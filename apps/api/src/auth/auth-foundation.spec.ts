import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuditService } from './audit.service';
import { LoginRateLimitService } from './login-rate-limit.service';
import { PasswordService } from './password.service';
import { PlatformAuthGuard } from './platform-auth.guard';
import { authCookies } from './auth.constants';

type MockPlatformUser = {
  id: string;
  login: string;
  passwordHash: string;
  role: 'PLATFORM_SUPER_ADMIN';
  status: 'ACTIVE' | 'DISABLED';
};

type MockShop = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'BLOCKED';
};

type MockUser = {
  id: string;
  shopId: string;
  fullName: string;
  login: string;
  passwordHash: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  status: 'ACTIVE' | 'DISABLED';
  shop: MockShop;
};

type MockSession = {
  id: string;
  scope: 'PLATFORM' | 'SHOP';
  tokenHash: string;
  platformUserId?: string;
  userId?: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  expiresAt: Date;
};

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectStatus(promise: Promise<unknown>, status: number, label: string) {
  try {
    await promise;
  } catch (error) {
    const actual = (error as UnauthorizedException | ForbiddenException).getStatus?.();
    assert(actual === status, `${label}: expected ${status}, got ${actual}`);
    return;
  }

  throw new Error(`${label}: expected error status ${status}`);
}

function guardContext(cookie: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { cookie },
      }),
    }),
  } as never;
}

async function createHarness() {
  const passwordService = new PasswordService();
  const platformPasswordHash = await passwordService.hash('service-secret');
  const shopPasswordHash = await passwordService.hash('shop-secret');
  const disabledPasswordHash = await passwordService.hash('disabled-secret');
  const blockedPasswordHash = await passwordService.hash('blocked-secret');
  const shop: MockShop = { id: 'shop-1', name: 'Lola Gullari', status: 'ACTIVE' };
  const blockedShop: MockShop = { id: 'shop-2', name: 'Blocked Shop', status: 'BLOCKED' };
  const platformUsers: MockPlatformUser[] = [
    {
      id: 'platform-1',
      login: 'EldorAlijonov',
      passwordHash: platformPasswordHash,
      role: 'PLATFORM_SUPER_ADMIN',
      status: 'ACTIVE',
    },
  ];
  const users: MockUser[] = [
    {
      id: 'user-1',
      shopId: shop.id,
      fullName: 'Dinora Owner',
      login: 'dinora',
      passwordHash: shopPasswordHash,
      role: 'OWNER',
      status: 'ACTIVE',
      shop,
    },
    {
      id: 'user-2',
      shopId: shop.id,
      fullName: 'Disabled User',
      login: 'disabled',
      passwordHash: disabledPasswordHash,
      role: 'STAFF',
      status: 'DISABLED',
      shop,
    },
    {
      id: 'user-3',
      shopId: blockedShop.id,
      fullName: 'Blocked Shop User',
      login: 'blocked-shop',
      passwordHash: blockedPasswordHash,
      role: 'OWNER',
      status: 'ACTIVE',
      shop: blockedShop,
    },
  ];
  const sessions: MockSession[] = [];
  const auditLogs: unknown[] = [];
  let sessionCount = 0;

  const prisma = {
    platformUser: {
      findUnique: async ({ where }: { where: { login?: string; id?: string } }) =>
        platformUsers.find((user) => user.login === where.login || user.id === where.id) ?? null,
      update: async () => undefined,
    },
    user: {
      findUnique: async ({ where }: { where: { login?: string; id?: string } }) =>
        users.find((user) => user.login === where.login || user.id === where.id) ?? null,
      update: async () => undefined,
    },
    authSession: {
      create: async ({ data }: { data: MockSession }) => {
        const session = { ...data, id: `session-${++sessionCount}`, status: 'ACTIVE' as const };
        sessions.push(session);
        return session;
      },
      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        const session = sessions.find((item) => item.tokenHash === where.tokenHash);

        if (!session) {
          return null;
        }

        return {
          ...session,
          platformUser: session.platformUserId
            ? platformUsers.find((user) => user.id === session.platformUserId)
            : null,
          user: session.userId ? users.find((user) => user.id === session.userId) : null,
        };
      },
      update: async ({ where, data }: { where: { tokenHash: string }; data: Partial<MockSession> }) => {
        const session = sessions.find((item) => item.tokenHash === where.tokenHash);

        if (!session) {
          throw new Error('not found');
        }

        Object.assign(session, data);
      },
    },
    auditLog: {
      create: async ({ data }: { data: unknown }) => {
        auditLogs.push(data);
      },
    },
  };
  const audit = new AuditService(prisma as never);
  const authService = new AuthService(
    prisma as never,
    passwordService,
    new LoginRateLimitService(),
    audit,
  );

  return { authService, sessions };
}

async function run() {
  const { authService, sessions } = await createHarness();

  const platformLogin = await authService.loginPlatform('EldorAlijonov', 'service-secret', 'test');
  assert(platformLogin.user.role === 'PLATFORM_SUPER_ADMIN', 'Test 1: service login success');

  const unifiedPlatformLogin = await authService.loginUnified('EldorAlijonov', 'service-secret', 'test');
  assert(unifiedPlatformLogin.user.accountType === 'PLATFORM', 'Unified service login: accountType');
  assert(unifiedPlatformLogin.redirectTo === '/service', 'Unified service login: redirect');

  await expectStatus(authService.loginPlatform('EldorAlijonov', 'wrong', 'test'), 401, 'Test 2');

  const shopLogin = await authService.loginShop('dinora', 'shop-secret', 'test');
  assert(shopLogin.user.shopId === 'shop-1', 'Test 3: shop_id mavjud');

  const unifiedShopLogin = await authService.loginUnified('dinora', 'shop-secret', 'test');
  assert(unifiedShopLogin.user.accountType === 'SHOP', 'Unified shop login: accountType');
  assert(unifiedShopLogin.redirectTo === '/app', 'Unified shop login: redirect');

  await expectStatus(authService.loginShop('dinora', 'wrong', 'test'), 401, 'Test 4');
  await expectStatus(authService.loginUnified('unknown-login', 'shop-secret', 'test'), 401, 'Unified wrong login');
  await expectStatus(authService.loginUnified('dinora', 'wrong-password', 'test'), 401, 'Unified wrong password');
  await expectStatus(authService.loginShop('disabled', 'disabled-secret', 'test'), 401, 'Test 5');
  await expectStatus(authService.loginShop('blocked-shop', 'blocked-secret', 'test'), 401, 'Test 6');

  const platformGuard = new PlatformAuthGuard(authService);
  await expectStatus(
    platformGuard.canActivate(guardContext(`${authCookies.shop}=${shopLogin.token}`)) as Promise<unknown>,
    403,
    'Test 7',
  );

  await expectStatus(authService.getShopUserByToken(undefined), 401, 'Test 8');

  await authService.logoutShop(shopLogin.token);
  await expectStatus(authService.getShopUserByToken(shopLogin.token), 401, 'Test 9');

  assert(
    sessions.some((session) => session.scope === 'PLATFORM') &&
      sessions.some((session) => session.scope === 'SHOP'),
    'Test 10: service/shop sessions are separate',
  );
  await expectStatus(authService.getShopUserByToken(platformLogin.token), 401, 'Test 10 isolation');

  console.log('Auth foundation tests passed.');
}

void run();
