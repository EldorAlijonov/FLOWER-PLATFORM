import { createBrowserRouter } from 'react-router-dom';
import { ChangePasswordPage } from '../pages/change-password-page';
import { LoginPage } from '../pages/login-page';
import { ServiceAuditPage } from '../pages/service/ServiceAuditPage';
import { ServiceCreateShopPage } from '../pages/service/ServiceCreateShopPage';
import { ServiceDashboardPage } from '../pages/service/ServiceDashboardPage';
import { ServicePlansPage } from '../pages/service/ServicePlansPage';
import { ServiceSettingsPage } from '../pages/service/ServiceSettingsPage';
import { ServiceShopDetailPage } from '../pages/service/ServiceShopDetailPage';
import { ServiceShopsPage } from '../pages/service/ServiceShopsPage';
import { ProtectedServiceRoute, ProtectedShopRoute } from './protected-routes';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedShopRoute />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/change-password',
    element: <ChangePasswordPage />,
  },
  {
    path: '/app',
    element: <ProtectedShopRoute />,
  },
  {
    path: '/service',
    element: <ProtectedServiceRoute />,
    children: [
      {
        index: true,
        element: <ServiceDashboardPage />,
      },
      {
        path: 'shops',
        element: <ServiceShopsPage />,
      },
      {
        path: 'shops/new',
        element: <ServiceCreateShopPage />,
      },
      {
        path: 'shops/:id',
        element: <ServiceShopDetailPage />,
      },
      {
        path: 'plans',
        element: <ServicePlansPage />,
      },
      {
        path: 'audit',
        element: <ServiceAuditPage />,
      },
      {
        path: 'settings',
        element: <ServiceSettingsPage />,
      },
    ],
  },
]);
