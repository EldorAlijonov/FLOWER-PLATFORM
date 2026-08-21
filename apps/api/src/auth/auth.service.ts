import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthSessionScope } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { authMessages, sessionDurationMs } from './auth.constants';
import { AuditService } from './audit.service';
import { LoginRateLimitService } from './login-rate-limit.service';
import { PasswordService } from './password.service';
import { createSessionToken, hashSessionToken } from './session-cookie';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly rateLimit: LoginRateLimitService,
    private readonly audit: AuditService,
  ) {}

  async loginPlatform(login: string, password: string, ip?: string) {
    this.rateLimit.assertAllowed('platform', login, ip);
    const platformUser = await this.prisma.platformUser.findUnique({ where: { login } });

    if (!platformUser) {
      await this.recordFailedPlatform(login, ip);
      return undefined as never;
    }

    if (
      !platformUser ||
      !(await this.passwordService.verify(password, platformUser.passwordHash))
    ) {
      await this.recordFailedPlatform(login, ip);
      return undefined as never;
    }

    if (platformUser.status !== 'ACTIVE') {
      await this.audit.record({
        action: 'USER_BLOCKED_LOGIN_ATTEMPT',
        entity: 'PLATFORM_AUTH',
        platformUserId: platformUser.id,
        metadata: { login, ip },
      });
      throw new UnauthorizedException(authMessages.invalidCredentials);
    }

    this.rateLimit.recordSuccess('platform', login, ip);
    const token = createSessionToken();
    const expiresAt = this.sessionExpiry();

    await this.prisma.authSession.create({
      data: {
        scope: AuthSessionScope.PLATFORM,
        tokenHash: hashSessionToken(token),
        platformUserId: platformUser.id,
        expiresAt,
      },
    });
    await this.prisma.platformUser.update({
      where: { id: platformUser.id },
      data: { lastLoginAt: new Date() },
    });
    await this.audit.record({
      action: 'LOGIN_SUCCESS',
      entity: 'PLATFORM_AUTH',
      platformUserId: platformUser.id,
      metadata: { login, ip },
    });

    return {
      token,
      expiresAt,
      user: {
        id: platformUser.id,
        login: platformUser.login,
        role: platformUser.role,
      },
    };
  }

  async loginUnified(login: string, password: string, ip?: string) {
    this.rateLimit.assertAllowed('platform', login, ip);
    this.rateLimit.assertAllowed('shop', login, ip);

    const platformUser = await this.prisma.platformUser.findUnique({ where: { login } });

    if (platformUser) {
      if (!(await this.passwordService.verify(password, platformUser.passwordHash))) {
        this.rateLimit.recordFailure('platform', login, ip);
        await this.audit.record({
          action: 'LOGIN_FAILED',
          entity: 'PLATFORM_AUTH',
          platformUserId: platformUser.id,
          metadata: { login, ip, reason: 'invalid_password' },
        });
        throw new UnauthorizedException({ errors: { password: "Parol noto'g'ri." } });
      }

      if (platformUser.status !== 'ACTIVE') {
        await this.audit.record({
          action: 'USER_BLOCKED_LOGIN_ATTEMPT',
          entity: 'PLATFORM_AUTH',
          platformUserId: platformUser.id,
          metadata: { login, ip },
        });
        throw new UnauthorizedException({ errors: { form: 'Ushbu account bloklangan.' } });
      }

      this.rateLimit.recordSuccess('platform', login, ip);
      const token = createSessionToken();
      const expiresAt = this.sessionExpiry();

      await this.prisma.authSession.create({
        data: {
          scope: AuthSessionScope.PLATFORM,
          tokenHash: hashSessionToken(token),
          platformUserId: platformUser.id,
          expiresAt,
        },
      });
      await this.prisma.platformUser.update({
        where: { id: platformUser.id },
        data: { lastLoginAt: new Date() },
      });
      await this.audit.record({
        action: 'LOGIN_SUCCESS',
        entity: 'PLATFORM_AUTH',
        platformUserId: platformUser.id,
        metadata: { login, ip },
      });

      return {
        accountType: 'PLATFORM' as const,
        token,
        cookie: 'platform' as const,
        redirectTo: '/service',
        user: {
          id: platformUser.id,
          login: platformUser.login,
          accountType: 'PLATFORM' as const,
          role: platformUser.role,
        },
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { login },
      include: { shop: true },
    });

    if (!user) {
      this.rateLimit.recordFailure('shop', login, ip);
      await this.audit.record({
        action: 'LOGIN_FAILED',
        entity: 'SHOP_AUTH',
        metadata: { login, ip, reason: 'login_not_found' },
      });
      throw new UnauthorizedException({ errors: { login: 'Bunday login mavjud emas.' } });
    }

    if (!(await this.passwordService.verify(password, user.passwordHash))) {
      this.rateLimit.recordFailure('shop', login, ip);
      await this.audit.record({
        action: 'LOGIN_FAILED',
        entity: 'SHOP_AUTH',
        shopId: user.shopId,
        userId: user.id,
        metadata: { login, ip, reason: 'invalid_password' },
      });
      throw new UnauthorizedException({ errors: { password: "Parol noto'g'ri." } });
    }

    if (user.status !== 'ACTIVE') {
      await this.audit.record({
        action: 'USER_BLOCKED_LOGIN_ATTEMPT',
        entity: 'SHOP_AUTH',
        shopId: user.shopId,
        userId: user.id,
        metadata: { login, ip, userStatus: user.status },
      });
      throw new UnauthorizedException({ errors: { form: 'Ushbu account bloklangan.' } });
    }

    if (user.shop.status !== 'ACTIVE') {
      await this.audit.record({
        action: 'USER_BLOCKED_LOGIN_ATTEMPT',
        entity: 'SHOP_AUTH',
        shopId: user.shopId,
        userId: user.id,
        metadata: { login, ip, shopStatus: user.shop.status },
      });
      throw new UnauthorizedException({
        errors: { form: "Ushbu do'kon accounti vaqtincha bloklangan." },
      });
    }

    this.rateLimit.recordSuccess('shop', login, ip);
    const token = createSessionToken();
    const expiresAt = this.sessionExpiry();

    await this.prisma.authSession.create({
      data: {
        scope: AuthSessionScope.SHOP,
        tokenHash: hashSessionToken(token),
        userId: user.id,
        expiresAt,
      },
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.audit.record({
      action: 'LOGIN_SUCCESS',
      entity: 'SHOP_AUTH',
      shopId: user.shopId,
      userId: user.id,
      metadata: { login, ip },
    });

    return {
      accountType: 'SHOP' as const,
      token,
      cookie: 'shop' as const,
      redirectTo: user.mustChangePassword ? '/change-password' : '/app',
      user: {
        id: user.id,
        fullName: user.fullName,
        login: user.login,
        accountType: 'SHOP' as const,
        role: user.role,
        shopId: user.shopId,
        shopName: user.shop.name,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async loginShop(login: string, password: string, ip?: string) {
    this.rateLimit.assertAllowed('shop', login, ip);
    const user = await this.prisma.user.findUnique({
      where: { login },
      include: { shop: true },
    });

    if (!user) {
      await this.recordFailedShop(login, ip);
      return undefined as never;
    }

    if (!user || !(await this.passwordService.verify(password, user.passwordHash))) {
      await this.recordFailedShop(login, ip);
      return undefined as never;
    }

    if (user.status !== 'ACTIVE' || user.shop.status !== 'ACTIVE') {
      await this.audit.record({
        action: 'USER_BLOCKED_LOGIN_ATTEMPT',
        entity: 'SHOP_AUTH',
        shopId: user.shopId,
        userId: user.id,
        metadata: { login, ip, userStatus: user.status, shopStatus: user.shop.status },
      });
      throw new UnauthorizedException(authMessages.invalidCredentials);
    }

    this.rateLimit.recordSuccess('shop', login, ip);
    const token = createSessionToken();
    const expiresAt = this.sessionExpiry();

    await this.prisma.authSession.create({
      data: {
        scope: AuthSessionScope.SHOP,
        tokenHash: hashSessionToken(token),
        userId: user.id,
        expiresAt,
      },
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.audit.record({
      action: 'LOGIN_SUCCESS',
      entity: 'SHOP_AUTH',
      shopId: user.shopId,
      userId: user.id,
      metadata: { login, ip },
    });

    return {
      token,
      expiresAt,
      user: {
        id: user.id,
        fullName: user.fullName,
        login: user.login,
        role: user.role,
        shopId: user.shopId,
        shopName: user.shop.name,
      },
    };
  }

  async getPlatformUserByToken(token: string | undefined) {
    if (!token) {
      throw new UnauthorizedException(authMessages.unauthorized);
    }

    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: { platformUser: true },
    });

    if (
      !session ||
      session.scope !== AuthSessionScope.PLATFORM ||
      session.status !== 'ACTIVE' ||
      session.expiresAt <= new Date() ||
      !session.platformUser
    ) {
      throw new UnauthorizedException(authMessages.unauthorized);
    }

    if (session.platformUser.status !== 'ACTIVE') {
      throw new ForbiddenException(authMessages.forbidden);
    }

    return {
      id: session.platformUser.id,
      login: session.platformUser.login,
      role: session.platformUser.role,
    };
  }

  async getShopUserByToken(token: string | undefined) {
    if (!token) {
      throw new UnauthorizedException(authMessages.unauthorized);
    }

    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: { user: { include: { shop: true } } },
    });

    if (
      !session ||
      session.scope !== AuthSessionScope.SHOP ||
      session.status !== 'ACTIVE' ||
      session.expiresAt <= new Date() ||
      !session.user
    ) {
      throw new UnauthorizedException(authMessages.unauthorized);
    }

    if (session.user.status !== 'ACTIVE' || session.user.shop.status !== 'ACTIVE') {
      throw new ForbiddenException(authMessages.forbidden);
    }

    return {
      id: session.user.id,
      login: session.user.login,
      fullName: session.user.fullName,
      role: session.user.role,
      shopId: session.user.shopId,
      shopName: session.user.shop.name,
      mustChangePassword: session.user.mustChangePassword,
      permissions: this.permissionsForRole(session.user.role),
    };
  }

  async getUnifiedUserByTokens(platformToken: string | undefined, shopToken: string | undefined) {
    if (platformToken) {
      const platformUser = await this.getPlatformUserByToken(platformToken);

      return {
        user: {
          ...platformUser,
          accountType: 'PLATFORM' as const,
        },
        redirectTo: '/service',
      };
    }

    if (shopToken) {
      const shopUser = await this.getShopUserByToken(shopToken);

      return {
        user: {
          ...shopUser,
          accountType: 'SHOP' as const,
        },
        redirectTo: shopUser.mustChangePassword ? '/change-password' : '/app',
      };
    }

    throw new UnauthorizedException(authMessages.unauthorized);
  }

  async logoutUnified(platformToken: string | undefined, shopToken: string | undefined) {
    await Promise.all([this.logoutPlatform(platformToken), this.logoutShop(shopToken)]);
  }

  async logoutPlatform(token: string | undefined) {
    const user = token
      ? await this.getPlatformUserByToken(token).catch(() => undefined)
      : undefined;
    await this.revokeToken(token);

    if (user) {
      await this.audit.record({
        action: 'LOGOUT',
        entity: 'PLATFORM_AUTH',
        platformUserId: user.id,
        metadata: { login: user.login },
      });
    }
  }

  async logoutShop(token: string | undefined) {
    const user = token ? await this.getShopUserByToken(token).catch(() => undefined) : undefined;
    await this.revokeToken(token);

    if (user) {
      await this.audit.record({
        action: 'LOGOUT',
        entity: 'SHOP_AUTH',
        shopId: user.shopId,
        userId: user.id,
        metadata: { login: user.login },
      });
    }
  }

  async listProfiles() {
    const [platformUsers, shopUsers, sessions] = await Promise.all([
      this.prisma.platformUser.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          login: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          login: true,
          role: true,
          status: true,
          shopId: true,
          lastLoginAt: true,
          createdAt: true,
          shop: {
            select: {
              name: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.authSession.groupBy({
        by: ['scope', 'status'],
        _count: { id: true },
      }),
    ]);

    return {
      platformUsers,
      shopUsers: shopUsers.map((user) => ({
        id: user.id,
        fullName: user.fullName,
        login: user.login,
        role: user.role,
        status: user.status,
        shopId: user.shopId,
        shopName: user.shop.name,
        shopStatus: user.shop.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      })),
      sessions: sessions.map((session) => ({
        scope: session.scope,
        status: session.status,
        count: session._count.id,
      })),
    };
  }

  async getPlatformSecurity(platformUserId: string, currentToken: string | undefined) {
    const sessions = await this.prisma.authSession.findMany({
      where: { platformUserId, scope: 'PLATFORM' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tokenHash: true,
        status: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
    const currentTokenHash = currentToken ? hashSessionToken(currentToken) : undefined;

    return {
      sessions: sessions.map((session) => ({
        id: session.id,
        status: session.status,
        expiresAt: session.expiresAt.toISOString(),
        revokedAt: session.revokedAt?.toISOString() ?? null,
        createdAt: session.createdAt.toISOString(),
        current: currentTokenHash === session.tokenHash,
      })),
    };
  }

  async changePlatformPassword(
    platformUserId: string,
    currentPassword: string,
    newPassword: string,
    currentToken: string | undefined,
  ) {
    const platformUser = await this.prisma.platformUser.findUnique({
      where: { id: platformUserId },
      select: { id: true, login: true, passwordHash: true },
    });

    if (!platformUser) {
      throw new UnauthorizedException(authMessages.unauthorized);
    }

    if (!(await this.passwordService.verify(currentPassword, platformUser.passwordHash))) {
      throw new ForbiddenException({ errors: { currentPassword: "Hozirgi parol noto'g'ri." } });
    }

    if (await this.passwordService.verify(newPassword, platformUser.passwordHash)) {
      throw new ForbiddenException({
        errors: { newPassword: 'Yangi parol eski paroldan farq qilishi kerak.' },
      });
    }

    const currentTokenHash = currentToken ? hashSessionToken(currentToken) : undefined;
    await this.prisma.$transaction(async (tx) => {
      await tx.platformUser.update({
        where: { id: platformUserId },
        data: { passwordHash: await this.passwordService.hash(newPassword) },
      });
      await tx.authSession.updateMany({
        where: {
          platformUserId,
          scope: 'PLATFORM',
          status: 'ACTIVE',
          tokenHash: currentTokenHash ? { not: currentTokenHash } : undefined,
        },
        data: { status: 'REVOKED', revokedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          action: 'PLATFORM_PASSWORD_CHANGED',
          entity: 'PLATFORM_AUTH',
          platformUserId,
          metadata: { login: platformUser.login },
        },
      });
    });

    return { ok: true };
  }

  async changeShopPassword(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, shopId: true, login: true, mustChangePassword: true },
    });

    if (!user) {
      throw new UnauthorizedException(authMessages.unauthorized);
    }

    if (!user.mustChangePassword) {
      throw new ForbiddenException(authMessages.forbidden);
    }

    if (await this.passwordService.verify(newPassword, user.passwordHash)) {
      throw new ForbiddenException({
        errors: { newPassword: 'Yangi parol vaqtinchalik paroldan farq qilishi kerak.' },
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await this.passwordService.hash(newPassword),
        mustChangePassword: false,
      },
    });

    await this.audit.record({
      action: 'PASSWORD_CHANGED',
      entity: 'SHOP_AUTH',
      shopId: user.shopId,
      userId: user.id,
      metadata: { login: user.login },
    });

    return { ok: true, redirectTo: '/app' as const };
  }

  private async revokeToken(token: string | undefined) {
    if (!token) {
      return;
    }

    await this.prisma.authSession
      .update({
        where: { tokenHash: hashSessionToken(token) },
        data: { status: 'REVOKED', revokedAt: new Date() },
      })
      .catch(() => undefined);
  }

  private async recordFailedPlatform(login: string, ip?: string): Promise<never> {
    this.rateLimit.recordFailure('platform', login, ip);
    await this.audit.record({
      action: 'LOGIN_FAILED',
      entity: 'PLATFORM_AUTH',
      metadata: { login, ip },
    });
    throw new UnauthorizedException(authMessages.invalidCredentials);
  }

  private async recordFailedShop(login: string, ip?: string): Promise<never> {
    this.rateLimit.recordFailure('shop', login, ip);
    await this.audit.record({
      action: 'LOGIN_FAILED',
      entity: 'SHOP_AUTH',
      metadata: { login, ip },
    });
    throw new UnauthorizedException(authMessages.invalidCredentials);
  }

  private sessionExpiry() {
    return new Date(Date.now() + sessionDurationMs);
  }

  private permissionsForRole(role: string) {
    if (role === 'OWNER') {
      return [
        'orders.read',
        'orders.create',
        'orders.update_status',
        'products.manage',
        'employees.manage',
      ];
    }

    if (role === 'MANAGER') {
      return ['orders.read', 'orders.create', 'orders.update_status', 'products.manage'];
    }

    return ['orders.read'];
  }
}
