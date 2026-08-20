import { Outlet } from 'react-router-dom';

export function AppLayout() {
  const navigationItems = ['Boshqaruv paneli', 'Buyurtmalar', 'Mahsulotlar', 'Mijozlar', 'Hisobotlar'];

  return (
    <div className="min-h-screen bg-ink-100 text-ink-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-ink-200 bg-[#dfe8df] lg:block">
        <div className="h-1.5 bg-brand-700" />
        <div className="flex h-16 items-center border-b border-ink-200 px-6">
          <div>
            <p className="text-sm font-semibold text-brand-700">Lola Gullari</p>
            <p className="text-xs text-ink-500">CRM boshqaruv</p>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4 text-sm font-medium">
          {navigationItems.map((item) => (
            <a
              className={`block rounded-md px-3 py-2 ${
                item === 'Boshqaruv paneli'
                  ? 'bg-brand-50 text-brand-800'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-950'
              }`}
              href="/"
              key={item}
            >
              {item}
            </a>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-ink-200 bg-[#dfe8df]">
          <div className="grid grid-cols-3" aria-hidden="true">
            <div className="h-1 bg-brand-700" />
            <div className="h-1 bg-petal-600" />
            <div className="h-1 bg-sun-600" />
          </div>
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold">CRM boshqaruv</p>
            <p className="text-xs text-ink-500">Shop context</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-800">
              Yangi buyurtma
            </button>
          </div>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
