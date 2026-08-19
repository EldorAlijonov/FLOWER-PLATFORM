import type { PlatformAuthUser } from '@flower-platform/api-client';
import { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ServiceHeader } from '../components/service/ServiceHeader';
import { ServiceSidebar } from '../components/service/ServiceSidebar';

type ServiceLayoutProps = {
  user: PlatformAuthUser;
  onLogout: () => void;
  loggingOut: boolean;
};

const pageTitles: Record<string, string> = {
  '/service': 'Bosh sahifa',
  '/service/shops': "Do'konlar",
  '/service/shops/new': "Yangi do'kon",
  '/service/plans': 'Tariflar / obuna',
  '/service/audit': 'Faollik tarixi',
  '/service/settings': 'Sozlamalar',
};

export function ServiceLayout({ user, onLogout, loggingOut }: ServiceLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = useMemo(
    () =>
      pageTitles[location.pathname] ??
      (location.pathname.startsWith('/service/shops/') ? "Do'kon tafsiloti" : 'Service Panel'),
    [location.pathname],
  );

  return (
    <div className="h-screen overflow-hidden bg-[#eef3ef] text-ink-950">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        <ServiceSidebar />
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Menyuni yopish"
            className="absolute inset-0 bg-ink-950/40"
            onClick={() => setSidebarOpen(false)}
            type="button"
          />
          <div className="relative h-full max-w-[86vw]">
            <ServiceSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex h-screen flex-col lg:pl-72">
        <ServiceHeader
          loggingOut={loggingOut}
          onLogout={onLogout}
          onOpenSidebar={() => setSidebarOpen(true)}
          title={title}
          user={user}
        />
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
