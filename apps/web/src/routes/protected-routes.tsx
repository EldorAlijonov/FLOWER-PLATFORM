import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { apiClient } from '../lib/api-client';
import { ServiceLayout } from '../layouts/ServiceLayout';
import { AppHomePage } from '../pages/app-home-page';

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-ink-100 p-6 text-sm text-ink-600">Tekshirilmoqda...</main>
  );
}

export function ProtectedShopRoute() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => apiClient.auth.me(),
    retry: false,
  });
  const logoutMutation = useMutation({
    mutationFn: () => apiClient.auth.logout(),
    onSuccess: async () => {
      await queryClient.clear();
      window.location.assign('/login');
    },
  });

  if (meQuery.isLoading) {
    return <LoadingScreen />;
  }

  if (meQuery.isError || !meQuery.data) {
    return <Navigate replace to="/login" />;
  }

  if (meQuery.data.user.accountType === 'PLATFORM') {
    return <Navigate replace to="/service" />;
  }

  if (meQuery.data.user.mustChangePassword) {
    return <Navigate replace to="/change-password" />;
  }

  return (
    <AppHomePage
      loggingOut={logoutMutation.isPending}
      onLogout={() => logoutMutation.mutate()}
      user={meQuery.data.user}
    />
  );
}

export function ProtectedServiceRoute() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => apiClient.auth.me(),
    retry: false,
  });
  const logoutMutation = useMutation({
    mutationFn: () => apiClient.auth.logout(),
    onSuccess: async () => {
      await queryClient.clear();
      window.location.assign('/login');
    },
  });

  if (meQuery.isLoading) {
    return <LoadingScreen />;
  }

  if (meQuery.isError || !meQuery.data) {
    return <Navigate replace to="/login" />;
  }

  if (meQuery.data.user.accountType === 'SHOP') {
    return <Navigate replace to="/app" />;
  }

  return (
    <ServiceLayout
      loggingOut={logoutMutation.isPending}
      onLogout={() => logoutMutation.mutate()}
      user={meQuery.data.user}
    />
  );
}
