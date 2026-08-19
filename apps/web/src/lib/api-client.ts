import { createApiClient } from '@flower-platform/api-client';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export const apiClient = createApiClient({
  baseUrl: apiBaseUrl,
});
