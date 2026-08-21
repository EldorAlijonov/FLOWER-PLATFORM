import { randomInt } from 'node:crypto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PasswordService } from '../auth/password.service';
import { PrismaService } from '../database/prisma.service';
import type {
  CreatePlatformShopInput,
  ListPlatformAuditQuery,
  ListPlatformShopsQuery,
  UpdatePlatformShopInput,
} from './platform-shops.dto';

@Injectable()
export class PlatformShopsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async getDashboard() {
    const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
    const [
      totalShops,
      activeShops,
      blockedShops,
      archivedShops,
      createdLast30Days,
      planGroups,
      recentShops,
      recentAudit,
    ] = await Promise.all([
      this.prisma.shop.count({ where: { status: { not: 'ARCHIVED' } } }),
      this.prisma.shop.count({ where: { status: 'ACTIVE' } }),
      this.prisma.shop.count({ where: { status: 'BLOCKED' } }),
      this.prisma.shop.count({ where: { status: 'ARCHIVED' } }),
      this.prisma.shop.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.shop.groupBy({
        by: ['plan'],
        where: { status: { not: 'ARCHIVED' } },
        _count: { id: true },
      }),
      this.prisma.shop.findMany({
        where: { status: { not: 'ARCHIVED' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: this.shopListSelect(),
      }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: this.auditLogSelect(),
      }),
    ]);

    return {
      totalShops,
      activeShops,
      blockedShops,
      archivedShops,
      createdLast30Days,
      plans: {
        START: planGroups.find((group) => group.plan === 'START')?._count.id ?? 0,
        BUSINESS: planGroups.find((group) => group.plan === 'BUSINESS')?._count.id ?? 0,
        PRO: planGroups.find((group) => group.plan === 'PRO')?._count.id ?? 0,
      },
      recentShops: recentShops.map(this.serializeShop),
      recentAudit: recentAudit.map((log) => this.serializeAuditLog(log)),
    };
  }

  async listAuditLogs(query: ListPlatformAuditQuery) {
    const where = this.auditListWhere(query);
    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: this.auditLogSelect(),
      }),
    ]);

    return {
      items: logs.map((log) => this.serializeAuditLog(log)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async listShops(query: ListPlatformShopsQuery) {
    const where = this.shopListWhere(query);
    const orderBy = this.shopListOrderBy(query.sort);
    const [total, shops] = await Promise.all([
      this.prisma.shop.count({ where }),
      this.prisma.shop.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: this.shopListSelect(),
      }),
    ]);

    return {
      items: shops.map(this.serializeShop),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async getShop(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      select: {
        ...this.shopListSelect(),
        updatedAt: true,
        users: {
          where: { role: 'OWNER' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: {
            id: true,
            fullName: true,
            login: true,
            status: true,
            role: true,
            lastLoginAt: true,
            mustChangePassword: true,
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: this.auditLogSelect(),
        },
      },
    });

    if (!shop) {
      throw new NotFoundException({ message: "Do'kon topilmadi." });
    }

    const owner = shop.users[0] ?? null;

    return {
      ...this.serializeShop(shop),
      updatedAt: shop.updatedAt.toISOString(),
      owner: owner
        ? {
            ...owner,
            lastLoginAt: owner.lastLoginAt?.toISOString() ?? null,
          }
        : null,
      recentAudit: shop.auditLogs.map((log) => this.serializeAuditLog(log)),
    };
  }

  async createShop(input: CreatePlatformShopInput, platformUserId: string) {
    const login = input.login.trim();

    await this.assertLoginAvailable(login);
    const temporaryPassword = createTemporaryPassword();
    const passwordHash = await this.passwordService.hash(temporaryPassword);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const shop = await tx.shop.create({
          data: {
            name: input.name,
            ownerName: input.ownerName,
            phone: input.phone,
            plan: input.plan,
            status: 'ACTIVE',
          },
          select: this.shopListSelect(),
        });

        const owner = await tx.user.create({
          data: {
            shopId: shop.id,
            fullName: input.ownerName,
            login,
            passwordHash,
            mustChangePassword: true,
            role: 'OWNER',
            status: 'ACTIVE',
          },
          select: this.ownerSelect(),
        });

        await this.recordAudit(tx, {
          action: 'SHOP_CREATED',
          shopId: shop.id,
          platformUserId,
          metadata: { shopName: shop.name, ownerUserId: owner.id, ownerLogin: owner.login },
        });

        return { shop, owner };
      });

      return {
        shop: this.serializeShop(result.shop),
        owner: result.owner,
        temporaryPassword,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({ errors: { login: 'Bu login allaqachon band.' } });
      }

      throw error;
    }
  }

  async updateShop(id: string, input: UpdatePlatformShopInput, platformUserId: string) {
    await this.ensureShopExists(id);
    const shop = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.shop.update({
        where: { id },
        data: {
          name: input.name,
          ownerName: input.ownerName,
          phone: input.phone,
          plan: input.plan,
        },
        select: this.shopListSelect(),
      });

      if (input.ownerName) {
        await tx.user.updateMany({
          where: { shopId: id, role: 'OWNER' },
          data: { fullName: input.ownerName },
        });
      }

      await this.recordAudit(tx, {
        action: 'SHOP_UPDATED',
        shopId: id,
        platformUserId,
        metadata: { shopName: updated.name },
      });

      return updated;
    });

    return this.serializeShop(shop);
  }

  async blockShop(id: string, platformUserId: string) {
    const shop = await this.ensureShopExists(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.shop.update({ where: { id }, data: { status: 'BLOCKED' } });
      await tx.authSession.updateMany({
        where: { scope: 'SHOP', user: { shopId: id }, status: 'ACTIVE' },
        data: { status: 'REVOKED', revokedAt: new Date() },
      });
      await this.recordAudit(tx, {
        action: 'SHOP_BLOCKED',
        shopId: id,
        platformUserId,
        metadata: { shopName: shop.name },
      });
    });

    return this.getShop(id);
  }

  async unblockShop(id: string, platformUserId: string) {
    const shop = await this.ensureShopExists(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.shop.update({ where: { id }, data: { status: 'ACTIVE' } });
      await this.recordAudit(tx, {
        action: 'SHOP_UNBLOCKED',
        shopId: id,
        platformUserId,
        metadata: { shopName: shop.name },
      });
    });

    return this.getShop(id);
  }

  async resetOwnerPassword(id: string, platformUserId: string) {
    const shop = await this.ensureShopExists(id);
    const owner = await this.findOwner(id);
    const temporaryPassword = createTemporaryPassword();
    const passwordHash = await this.passwordService.hash(temporaryPassword);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: owner.id },
        data: { passwordHash, mustChangePassword: true },
      });
      await tx.authSession.updateMany({
        where: { userId: owner.id, scope: 'SHOP', status: 'ACTIVE' },
        data: { status: 'REVOKED', revokedAt: new Date() },
      });
      await this.recordAudit(tx, {
        action: 'OWNER_PASSWORD_RESET',
        shopId: id,
        platformUserId,
        metadata: { shopName: shop.name, ownerUserId: owner.id, ownerLogin: owner.login },
      });
    });

    return {
      shopId: id,
      ownerLogin: owner.login,
      temporaryPassword,
    };
  }

  async archiveShop(id: string, platformUserId: string) {
    const shop = await this.ensureShopExists(id);

    await this.prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({
        where: { shopId: id },
        select: { id: true },
      });
      const userIds = users.map((user) => user.id);

      if (userIds.length > 0) {
        await tx.authSession.updateMany({
          where: { userId: { in: userIds }, status: 'ACTIVE' },
          data: { status: 'REVOKED', revokedAt: new Date() },
        });
      }

      await tx.shop.update({ where: { id }, data: { status: 'ARCHIVED' } });
      await this.recordAudit(tx, {
        action: 'SHOP_ARCHIVED',
        shopId: id,
        platformUserId,
        metadata: { shopName: shop.name },
      });
    });

    return { ok: true };
  }

  async deleteShop(id: string, platformUserId: string) {
    return this.archiveShop(id, platformUserId);
  }

  private async assertLoginAvailable(login: string) {
    const [existingUser, existingPlatformUser] = await Promise.all([
      this.prisma.user.findUnique({ where: { login }, select: { id: true } }),
      this.prisma.platformUser.findUnique({ where: { login }, select: { id: true } }),
    ]);

    if (existingUser || existingPlatformUser) {
      throw new ConflictException({ errors: { login: 'Bu login allaqachon band.' } });
    }
  }

  private async ensureShopExists(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!shop) {
      throw new NotFoundException({ message: "Do'kon topilmadi." });
    }

    return shop;
  }

  private async findOwner(shopId: string) {
    const owner = await this.prisma.user.findFirst({
      where: { shopId, role: 'OWNER' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, login: true },
    });

    if (!owner) {
      throw new NotFoundException({ message: "Do'kon owner accounti topilmadi." });
    }

    return owner;
  }

  private shopListSelect() {
    return {
      id: true,
      name: true,
      ownerName: true,
      phone: true,
      plan: true,
      status: true,
      createdAt: true,
      users: {
        where: { role: 'OWNER' },
        orderBy: { createdAt: 'asc' },
        take: 1,
        select: { login: true },
      },
    } satisfies Prisma.ShopSelect;
  }

  private ownerSelect() {
    return {
      id: true,
      shopId: true,
      fullName: true,
      login: true,
      role: true,
      status: true,
      mustChangePassword: true,
    } satisfies Prisma.UserSelect;
  }

  private serializeShop(shop: {
    id: string;
    name: string;
    ownerName: string;
    phone: string;
    plan: string;
    status: string;
    createdAt: Date;
    users?: Array<{ login: string }>;
  }) {
    return {
      id: shop.id,
      name: shop.name,
      ownerName: shop.ownerName,
      ownerLogin: shop.users?.[0]?.login ?? null,
      phone: shop.phone,
      plan: shop.plan,
      status: shop.status,
      createdAt: shop.createdAt.toISOString(),
    };
  }

  private shopListWhere(query: ListPlatformShopsQuery): Prisma.ShopWhereInput {
    const filters: Prisma.ShopWhereInput[] = [];

    if (query.status) {
      filters.push({ status: query.status });
    } else {
      filters.push({ status: { not: 'ARCHIVED' } });
    }

    if (query.plan) {
      filters.push({ plan: query.plan });
    }

    if (query.q) {
      filters.push({
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { ownerName: { contains: query.q, mode: 'insensitive' } },
          { phone: { contains: query.q, mode: 'insensitive' } },
          { users: { some: { login: { contains: query.q, mode: 'insensitive' } } } },
        ],
      });
    }

    return { AND: filters };
  }

  private shopListOrderBy(sort: ListPlatformShopsQuery['sort']): Prisma.ShopOrderByWithRelationInput {
    if (sort === 'created_asc') return { createdAt: 'asc' };
    if (sort === 'name_asc') return { name: 'asc' };
    if (sort === 'name_desc') return { name: 'desc' };
    return { createdAt: 'desc' };
  }

  private auditLogSelect() {
    return {
      id: true,
      action: true,
      entity: true,
      createdAt: true,
      metadata: true,
      shop: { select: { id: true, name: true } },
      platformUser: { select: { id: true, login: true } },
      user: { select: { id: true, login: true, fullName: true } },
    } satisfies Prisma.AuditLogSelect;
  }

  private serializeAuditLog(log: {
    id: string;
    action: string;
    entity: string;
    createdAt: Date;
    metadata: Prisma.JsonValue | null;
    shop: { id: string; name: string } | null;
    platformUser: { id: string; login: string } | null;
    user: { id: string; login: string; fullName: string } | null;
  }) {
    return {
      id: log.id,
      action: log.action,
      entity: log.entity,
      createdAt: log.createdAt.toISOString(),
      actor: log.platformUser?.login ?? log.user?.fullName ?? log.user?.login ?? 'System',
      shop: log.shop ? { id: log.shop.id, name: log.shop.name } : null,
      description: this.auditDescription(log.action, log.metadata),
    };
  }

  private auditListWhere(query: ListPlatformAuditQuery): Prisma.AuditLogWhereInput {
    const filters: Prisma.AuditLogWhereInput[] = [];

    if (query.action) {
      filters.push({ action: query.action });
    }

    if (query.shopId) {
      filters.push({ shopId: query.shopId });
    }

    if (query.from || query.to) {
      filters.push({
        createdAt: {
          gte: query.from,
          lte: query.to,
        },
      });
    }

    if (query.q) {
      filters.push({
        OR: [
          { action: { contains: query.q, mode: 'insensitive' } },
          { entity: { contains: query.q, mode: 'insensitive' } },
          { shop: { name: { contains: query.q, mode: 'insensitive' } } },
          { platformUser: { login: { contains: query.q, mode: 'insensitive' } } },
          { user: { fullName: { contains: query.q, mode: 'insensitive' } } },
          { user: { login: { contains: query.q, mode: 'insensitive' } } },
        ],
      });
    }

    return filters.length > 0 ? { AND: filters } : {};
  }

  private async recordAudit(
    tx: Prisma.TransactionClient,
    input: {
      action: string;
      shopId: string | null;
      platformUserId: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    await tx.auditLog.create({
      data: {
        action: input.action,
        entity: 'SHOP',
        shopId: input.shopId ?? undefined,
        platformUserId: input.platformUserId,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  private auditDescription(action: string, metadata: unknown) {
    const data =
      metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : {};
    const shopName = typeof data.shopName === 'string' ? data.shopName : "Do'kon";

    if (action === 'SHOP_CREATED') return `${shopName} yaratildi.`;
    if (action === 'SHOP_UPDATED') return `${shopName} ma'lumotlari yangilandi.`;
    if (action === 'SHOP_BLOCKED') return `${shopName} bloklandi.`;
    if (action === 'SHOP_UNBLOCKED') return `${shopName} blokdan chiqarildi.`;
    if (action === 'OWNER_PASSWORD_RESET') return `${shopName} owner paroli reset qilindi.`;
    if (action === 'SHOP_ARCHIVED') return `${shopName} arxivlandi.`;

    return action;
  }
}

function createTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const chars = Array.from({ length: 10 }, () => alphabet[randomInt(0, alphabet.length)]);
  return `${chars.slice(0, 5).join('')}-${chars.slice(5).join('')}`;
}
