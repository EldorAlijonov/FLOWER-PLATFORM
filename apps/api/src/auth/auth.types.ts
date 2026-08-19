export type ShopRequestUser = {
  id: string;
  login: string;
  fullName: string;
  role: string;
  shopId: string;
  shopName: string;
  permissions: string[];
};

export type PlatformRequestUser = {
  id: string;
  login: string;
  role: string;
};

export type AuthenticatedRequest = {
  user?: ShopRequestUser;
  platformUser?: PlatformRequestUser;
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};
