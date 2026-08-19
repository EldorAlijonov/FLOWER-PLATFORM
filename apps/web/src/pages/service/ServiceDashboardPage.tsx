import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CreditCard, Store, StoreIcon } from 'lucide-react';
import { ServiceStatCard } from '../../components/service/ServiceStatCard';
import { ShopStatusBadge } from '../../components/service/ShopStatusBadge';
import { apiClient } from '../../lib/api-client';

export function ServiceDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['platform-dashboard'],
    queryFn: () => apiClient.platformDashboard.get(),
    retry: false,
  });

  if (dashboardQuery.isLoading) {
    return <p className="text-sm text-ink-500">Yuklanmoqda...</p>;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <p className="rounded-md border border-petal-100 bg-petal-50 p-3 text-sm text-petal-700">
        Dashboardni yuklab bo'lmadi.
      </p>
    );
  }

  const stats = [
    {
      title: "Jami do'konlar",
      value: String(dashboardQuery.data.totalShops),
      subtitle: "Platformadagi barcha do'konlar",
      icon: Store,
    },
    {
      title: "Faol do'konlar",
      value: String(dashboardQuery.data.activeShops),
      subtitle: "Hozir faol ishlayotgan do'konlar",
      icon: StoreIcon,
    },
    {
      title: "Bloklangan do'konlar",
      value: String(dashboardQuery.data.blockedShops),
      subtitle: "Kirish cheklangan do'konlar",
      icon: AlertTriangle,
    },
    {
      title: 'START / BUSINESS / PRO',
      value: `${dashboardQuery.data.plans.START}/${dashboardQuery.data.plans.BUSINESS}/${dashboardQuery.data.plans.PRO}`,
      subtitle: "Tariflar bo'yicha taqsimot",
      icon: CreditCard,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <ServiceStatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="rounded-md border border-ink-200 bg-[#fbfdf8] shadow-sm">
        <div className="border-b border-ink-200 px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold text-ink-950">Oxirgi yaratilgan do'konlar</h2>
          <p className="mt-1 text-sm text-ink-500">Real database ma'lumotlari.</p>
        </div>
        <div className="divide-y divide-ink-100">
          {dashboardQuery.data.recentShops.map((shop, index) => (
            <div
              className="grid gap-3 px-4 py-4 text-sm sm:grid-cols-[3rem_1.4fr_0.8fr_0.8fr_0.7fr] sm:items-center sm:px-5"
              key={shop.id}
            >
              <span className="font-medium text-ink-500">{index + 1}</span>
              <div>
                <p className="font-semibold text-ink-950">{shop.name}</p>
                <p className="mt-1 text-xs text-ink-500">{shop.ownerName}</p>
              </div>
              <ShopStatusBadge status={shop.status} />
              <p className="text-ink-600">{new Date(shop.createdAt).toLocaleDateString('uz-UZ')}</p>
              <p className="font-medium text-ink-700">{shop.plan}</p>
            </div>
          ))}
          {dashboardQuery.data.recentShops.length === 0 ? (
            <p className="p-4 text-sm text-ink-500">Hozircha do'konlar mavjud emas.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
