import { randomInt } from 'node:crypto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PasswordService } from '../auth/password.service';
import { PrismaService } from '../database/prisma.service';
import type { CreatePlatformShopInput, UpdatePlatformShopInput } from './platform-shops.dto';

@Injectable()
export class PlatformShopsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async getDashboard() {
    const [totalShops, activeShops, blockedShops, planGroups, recentShops] = await Promise.all([
      this.prisma.shop.count(),
      this.prisma.shop.count({ where: { status: 'ACTIVE' } }),
      this.prisma.shop.count({ where: { status: 'BLOCKED' } }),
      this.prisma.shop.groupBy({ by: ['plan'], _count: { id: true } }),
      this.prisma.shop.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: this.shopListSelect(),
      }),
    ]);

    return {
      totalShops,
      activeShops,
      blockedShops,
      plans: {
        START: planGroups.find((group) => group.plan === 'START')?._count.id ?? 0,
        BUSINESS: planGroups.find((group) => group.plan === 'BUSINESS')?._count.id ?? 0,
        PRO: planGroups.find((group) => group.plan === 'PRO')?._count.id ?? 0,
      },
      recentShops: recentShops.map(this.serializeShop),
    };
  }

  async listAuditLogs() {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        action: true,
        entity: true,
        createdAt: true,
        metadata: true,
        shop: { select: { id: true, name: true } },
        platformUser: { select: { id: true, login: true } },
        user: { select: { id: true, login: true, fullName: true } },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      createdAt: log.createdAt.toISOString(),
      actor: log.platformUser?.login ?? log.user?.fullName ?? log.user?.login ?? 'System',
      shop: log.shop ? { id: log.shop.id, name: log.shop.name } : null,
      description: this.auditDescription(log.action, log.metadata),
    }));
  }

  async listShops() {
    const shops = await this.prisma.shop.findMany({
      orderBy: { createdAt: 'desc' },
      select: this.shopListSelect(),
    });

    return shops.map(this.serializeShop);
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

  async deleteShop(id: string, platformUserId: string) {
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
        await tx.auditLog.updateMany({
          where: { userId: { in: userIds } },
          data: { userId: null },
        });
      }

      await tx.auditLog.updateMany({
        where: { shopId: id },
        data: { shopId: null },
      });
      await this.recordAudit(tx, {
        action: 'SHOP_DELETED',
        shopId: null,
        platformUserId,
        metadata: { deletedShopId: id, shopName: shop.name },
      });
      await tx.user.deleteMany({ where: { shopId: id } });
      await tx.shop.delete({ where: { id } });
    });

    return { ok: true };
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
  }) {
    return {
      ...shop,
      createdAt: shop.createdAt.toISOString(),
    };
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
    if (action === 'SHOP_DELETED') return `${shopName} o'chirildi.`;

    return action;
  }
}

function createTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const chars = Array.from({ length: 10 }, () => alphabet[randomInt(0, alphabet.length)]);
  return `${chars.slice(0, 5).join('')}-${chars.slice(5).join('')}`;
}
