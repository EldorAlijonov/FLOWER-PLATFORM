import type { CrmAdminDashboard } from '@flower-platform/types';

export type ApiClientOptions = {
  baseUrl: string;
};

export type PlatformAuthUser = {
  id: string;
  login: string;
  accountType: 'PLATFORM';
  role: 'PLATFORM_SUPER_ADMIN';
};

export type ShopAuthUser = {
  id: string;
  fullName: string;
  login: string;
  accountType: 'SHOP';
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  shopId: string;
  shopName: string;
  mustChangePassword?: boolean;
  permissions?: string[];
};

export type AuthUser = PlatformAuthUser | ShopAuthUser;

export type LoginResponse = {
  user: AuthUser;
  redirectTo: '/service' | '/app' | '/change-password';
};

export type PlatformProfiles = {
  platformUsers: Array<{
    id: string;
    login: string;
    role: string;
    status: string;
    lastLoginAt: string | null;
    createdAt: string;
  }>;
  shopUsers: Array<{
    id: string;
    fullName: string;
    login: string;
    role: string;
    status: string;
    shopId: string;
    shopName: string;
    shopStatus: string;
    lastLoginAt: string | null;
    createdAt: string;
  }>;
  sessions: Array<{
    scope: string;
    status: string;
    count: number;
  }>;
};

export type ShopPlan = 'START' | 'BUSINESS' | 'PRO';
export type ShopStatus = 'ACTIVE' | 'BLOCKED' | 'ARCHIVED';

export type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PlatformShop = {
  id: string;
  name: string;
  ownerName: string;
  ownerLogin: string | null;
  phone: string;
  plan: ShopPlan;
  status: ShopStatus;
  createdAt: string;
};

export type PlatformShopDetail = PlatformShop & {
  updatedAt: string;
  owner: {
    id: string;
    fullName: string;
    login: string;
    role: 'OWNER' | 'MANAGER' | 'STAFF';
    status: 'ACTIVE' | 'DISABLED';
    mustChangePassword: boolean;
    lastLoginAt: string | null;
  } | null;
  recentAudit: PlatformAuditLog[];
};

export type CreatePlatformShopBody = {
  name: string;
  ownerName: string;
  phone: string;
  login: string;
  plan: ShopPlan;
};

export type UpdatePlatformShopBody = Partial<
  Pick<CreatePlatformShopBody, 'name' | 'ownerName' | 'phone' | 'plan'>
>;

export type CreatePlatformShopResponse = {
  shop: PlatformShop;
  owner: {
    id: string;
    shopId: string;
    fullName: string;
    login: string;
    role: 'OWNER';
    status: 'ACTIVE';
    mustChangePassword: boolean;
  };
  temporaryPassword: string;
};

export type ResetOwnerPasswordResponse = {
  shopId: string;
  ownerLogin: string;
  temporaryPassword: string;
};

export type PlatformDashboard = {
  totalShops: number;
  activeShops: number;
  blockedShops: number;
  archivedShops: number;
  createdLast30Days: number;
  plans: Record<ShopPlan, number>;
  recentShops: PlatformShop[];
  recentAudit: PlatformAuditLog[];
};

export type PlatformAuditLog = {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
  actor: string;
  shop: { id: string; name: string } | null;
  description: string;
};

export type ListPlatformShopsQuery = {
  page?: number;
  limit?: number;
  q?: string;
  status?: ShopStatus;
  plan?: ShopPlan;
  sort?: 'created_desc' | 'created_asc' | 'name_asc' | 'name_desc';
};

type LoginBody = {
  login: string;
  password: string;
};

export function createApiClient(options: ApiClientOptions) {
  return {
    async request<T>(path: string, init?: RequestInit): Promise<T> {
      const response = await fetch(`${options.baseUrl}${path}`, {
        credentials: 'include',
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });

      if (!response.ok) {
        let details: unknown;

        try {
          details = await response.json();
        } catch {
          details = undefined;
        }

        const error = new Error(`API request failed with status ${response.status}`);
        Object.assign(error, { status: response.status, details });
        throw error;
      }

      return response.json() as Promise<T>;
    },

    crmAdmin: {
      getDashboard(): Promise<CrmAdminDashboard> {
        return createApiClient(options).request<CrmAdminDashboard>('/crm-admin/dashboard');
      },
    },

    auth: {
      login(body: LoginBody): Promise<LoginResponse> {
        return createApiClient(options).request('/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      },
      me(): Promise<LoginResponse> {
        return createApiClient(options).request('/v1/auth/me');
      },
      logout(): Promise<{ ok: true }> {
        return createApiClient(options).request('/v1/auth/logout', { method: 'POST' });
      },
      changePassword(body: {
        newPassword: string;
        confirmPassword: string;
      }): Promise<{ ok: true; redirectTo: '/app' }> {
        return createApiClient(options).request('/v1/auth/change-password', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      },
    },

    platformAuth: {
      profiles(): Promise<PlatformProfiles> {
        return createApiClient(options).request('/v1/platform/auth/profiles');
      },
    },

    platformShops: {
      list(query: ListPlatformShopsQuery = {}): Promise<PaginatedResponse<PlatformShop>> {
        return createApiClient(options).request(
          `/v1/platform/shops${toQueryString(query as Record<string, string | number | undefined>)}`,
        );
      },
      get(id: string): Promise<PlatformShopDetail> {
        return createApiClient(options).request(`/v1/platform/shops/${id}`);
      },
      create(body: CreatePlatformShopBody): Promise<CreatePlatformShopResponse> {
        return createApiClient(options).request('/v1/platform/shops', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      },
      update(id: string, body: UpdatePlatformShopBody): Promise<PlatformShop> {
        return createApiClient(options).request(`/v1/platform/shops/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      },
      block(id: string): Promise<PlatformShopDetail> {
        return createApiClient(options).request(`/v1/platform/shops/${id}/block`, {
          method: 'POST',
        });
      },
      unblock(id: string): Promise<PlatformShopDetail> {
        return createApiClient(options).request(`/v1/platform/shops/${id}/unblock`, {
          method: 'POST',
        });
      },
      resetOwnerPassword(id: string): Promise<ResetOwnerPasswordResponse> {
        return createApiClient(options).request(`/v1/platform/shops/${id}/reset-owner-password`, {
          method: 'POST',
        });
      },
      delete(id: string): Promise<{ ok: true }> {
        return createApiClient(options).request(`/v1/platform/shops/${id}`, { method: 'DELETE' });
      },
      archive(id: string): Promise<{ ok: true }> {
        return createApiClient(options).request(`/v1/platform/shops/${id}/archive`, {
          method: 'POST',
        });
      },
    },

    platformDashboard: {
      get(): Promise<PlatformDashboard> {
        return createApiClient(options).request('/v1/platform/dashboard');
      },
    },

    platformAudit: {
      list(): Promise<PlatformAuditLog[]> {
        return createApiClient(options).request('/v1/platform/audit');
      },
    },
  };
}

function toQueryString(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  const value = params.toString();
  return value ? `?${value}` : '';
}
