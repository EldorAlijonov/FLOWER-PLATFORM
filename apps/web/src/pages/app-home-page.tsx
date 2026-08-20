import type { ShopAuthUser } from '@flower-platform/api-client';

type AppHomePageProps = {
  user: ShopAuthUser;
  onLogout: () => void;
  loggingOut: boolean;
};

export function AppHomePage({ user, onLogout, loggingOut }: AppHomePageProps) {
  return (
    <main className="min-h-screen bg-ink-100 text-ink-950">
      <header className="border-b border-ink-200 bg-[#dfe8df]">
        <div className="grid grid-cols-3" aria-hidden="true">
          <div className="h-1 bg-brand-700" />
          <div className="h-1 bg-petal-600" />
          <div className="h-1 bg-sun-600" />
        </div>
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div>
            <p className="text-sm font-semibold text-brand-700">CRM</p>
            <p className="text-xs text-ink-500">Shop authentication</p>
          </div>
          <button
            className="rounded-md border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
            disabled={loggingOut}
            onClick={onLogout}
            type="button"
          >
            Chiqish
          </button>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-md border border-ink-200 bg-[#dfe8df] p-6 shadow-sm">
          <p className="text-sm font-medium text-brand-700">Do'kon: {user.shopName}</p>
          <h1 className="mt-3 text-2xl font-semibold">Xush kelibsiz, {user.fullName}.</h1>
          <p className="mt-3 text-sm text-ink-600">Shop authentication ishlayapti.</p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-md bg-brand-50 p-4 text-brand-900">shop_id: {user.shopId}</div>
            <div className="rounded-md bg-sun-50 p-4 text-sun-700">role: {user.role}</div>
            <div className="rounded-md bg-petal-50 p-4 text-petal-700">login: {user.login}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
