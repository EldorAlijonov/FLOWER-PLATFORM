import { CreditCard, History, Home, Settings, Store } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const navigationItems = [
  { label: 'Bosh sahifa', to: '/service', icon: Home, end: true },
  { label: "Do'konlar", to: '/service/shops', icon: Store },
  { label: 'Tariflar / obuna', to: '/service/plans', icon: CreditCard },
  { label: 'Faollik tarixi', to: '/service/audit', icon: History },
  { label: 'Sozlamalar', to: '/service/settings', icon: Settings },
];

type ServiceSidebarProps = {
  onNavigate?: () => void;
};

export function ServiceSidebar({ onNavigate }: ServiceSidebarProps) {
  const location = useLocation();

  return (
    <aside className="flex h-full w-72 flex-col border-r border-ink-200 bg-white">
      <div className="grid grid-cols-3" aria-hidden="true">
        <div className="h-1 bg-brand-700" />
        <div className="h-1 bg-petal-600" />
        <div className="h-1 bg-sun-600" />
      </div>
      <div className="flex h-16 items-center border-b border-ink-200 px-5">
        <div>
          <p className="text-sm font-semibold tracking-wide text-brand-700">FLOWER PLATFORM</p>
          <p className="mt-0.5 text-xs text-ink-500">Service Panel</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 text-sm font-medium">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              className={({ isActive }) => {
                const active = item.to.includes('?')
                  ? `${location.pathname}${location.search}` === item.to
                  : isActive && !location.search;

                return `flex items-center gap-3 rounded-md px-3 py-2.5 transition ${
                  active
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-950'
                }`;
              }}
              end={item.end}
              key={item.to}
              onClick={onNavigate}
              to={item.to}
            >
              <Icon aria-hidden="true" className="shrink-0" size={18} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
