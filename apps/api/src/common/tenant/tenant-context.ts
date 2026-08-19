import { AsyncLocalStorage } from 'node:async_hooks';
import { TenantContextValue } from './tenant.types';

const tenantStorage = new AsyncLocalStorage<TenantContextValue>();

export const TenantContext = {
  run<T>(tenant: TenantContextValue, callback: () => T): T {
    return tenantStorage.run(tenant, callback);
  },

  get(): TenantContextValue | undefined {
    return tenantStorage.getStore();
  },

  require(): TenantContextValue {
    const tenant = tenantStorage.getStore();

    if (!tenant) {
      throw new Error('Tenant context is not available.');
    }

    return tenant;
  },
};
