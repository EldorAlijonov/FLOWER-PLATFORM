import type { PlatformAuthUser } from '@flower-platform/api-client';
import { LogOut, Menu } from 'lucide-react';

type ServiceHeaderProps = {
  title: string;
  user: PlatformAuthUser;
  loggingOut: boolean;
  onLogout: () => void;
  onOpenSidebar: () => void;
};

export function ServiceHeader({
  title,
  user,
  loggingOut,
  onLogout,
  onOpenSidebar,
}: ServiceHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-ink-200 bg-[#f8fbf6]">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-ink-200 text-ink-700 hover:bg-[#eef3ef] lg:hidden"
            onClick={onOpenSidebar}
            title="Menyuni ochish"
            type="button"
          >
            <Menu aria-hidden="true" size={20} />
            <span className="sr-only">Menyuni ochish</span>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-ink-950">{title}</h1>
            <p className="hidden text-xs text-ink-500 sm:block">Service Account boshqaruvi</p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-sm font-semibold text-ink-950">{user.login}</p>
            <p className="text-xs text-ink-500">Platform Admin</p>
          </div>
          <button
            className="flex h-10 items-center gap-2 rounded-md border border-ink-200 px-3 text-sm font-medium text-ink-700 hover:bg-[#eef3ef] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loggingOut}
            onClick={onLogout}
            type="button"
          >
            <LogOut aria-hidden="true" size={16} />
            <span className="hidden sm:inline">Chiqish</span>
          </button>
        </div>
      </div>
    </header>
  );
}
