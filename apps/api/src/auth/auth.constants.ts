export const authCookies = {
  shop: 'fp_shop_session',
  platform: 'fp_platform_session',
} as const;

export const authMessages = {
  invalidCredentials: "Login yoki parol noto'g'ri.",
  unauthorized: 'Authentication required.',
  forbidden: 'Access denied.',
} as const;

export const sessionDurationMs = 1000 * 60 * 60 * 24 * 7;
