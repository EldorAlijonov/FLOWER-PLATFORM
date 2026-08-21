import { useQuery } from '@tanstack/react-query';
import { Archive, CalendarPlus, Clock3, CreditCard, Store, StoreIcon, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { ServicePagination } from '../../components/service/ServicePagination';
import { ServiceStatCard } from '../../components/service/ServiceStatCard';
import { ShopStatusBadge } from '../../components/service/ShopStatusBadge';
import { apiClient } from '../../lib/api-client';

const RECENT_SHOPS_PAGE_SIZE = 5;

export function ServiceDashboardPage() {
  const [recentPage, setRecentPage] = useState(1);
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
      icon: TriangleAlert,
    },
    {
      title: 'Arxivlangan',
      value: String(dashboardQuery.data.archivedShops),
      subtitle: "Ro'yxatdan chiqarilgan do'konlar",
      icon: Archive,
    },
    {
      title: '30 kun ichida',
      value: String(dashboardQuery.data.createdLast30Days),
      subtitle: "Oxirgi 30 kunda yaratilgan do'konlar",
      icon: CalendarPlus,
    },
    {
      title: 'START / BUSINESS / PRO',
      value: `${dashboardQuery.data.plans.START}/${dashboardQuery.data.plans.BUSINESS}/${dashboardQuery.data.plans.PRO}`,
      subtitle: "Tariflar bo'yicha taqsimot",
      icon: CreditCard,
    },
  ];
  const recentShops = dashboardQuery.data.recentShops;
  const recentTotalPages = Math.max(1, Math.ceil(recentShops.length / RECENT_SHOPS_PAGE_SIZE));
  const currentRecentPage = Math.min(recentPage, recentTotalPages);
  const paginatedRecentShops = recentShops.slice(
    (currentRecentPage - 1) * RECENT_SHOPS_PAGE_SIZE,
    currentRecentPage * RECENT_SHOPS_PAGE_SIZE,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <ServiceStatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="rounded-md border border-ink-200 bg-[#dfe8df] shadow-sm">
        <div className="border-b border-ink-200 px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold text-ink-950">Oxirgi yaratilgan do'konlar</h2>
          <p className="mt-1 text-sm text-ink-500">Real database ma'lumotlari.</p>
        </div>
        <div className="divide-y divide-ink-100">
          {paginatedRecentShops.map((shop, index) => (
            <div
              className="grid gap-3 px-4 py-4 text-sm transition hover:bg-[#f2f7f1] sm:grid-cols-[3rem_1.4fr_0.8fr_0.8fr_0.7fr] sm:items-center sm:px-5"
              key={shop.id}
            >
              <span className="font-medium text-ink-500">
                {(currentRecentPage - 1) * RECENT_SHOPS_PAGE_SIZE + index + 1}
              </span>
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
        <ServicePagination
          onPageChange={setRecentPage}
          page={currentRecentPage}
          pageSize={RECENT_SHOPS_PAGE_SIZE}
          totalItems={recentShops.length}
        />
      </section>

      <section className="rounded-md border border-ink-200 bg-[#dfe8df] shadow-sm">
        <div className="border-b border-ink-200 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <Clock3 aria-hidden="true" className="text-ink-500" size={18} />
            <h2 className="text-base font-semibold text-ink-950">So'nggi amallar</h2>
          </div>
        </div>
        <div className="divide-y divide-ink-100">
          {dashboardQuery.data.recentAudit.map((log) => (
            <div className="grid gap-2 px-4 py-4 text-sm transition hover:bg-[#f2f7f1] sm:grid-cols-[11rem_1fr_9rem]" key={log.id}>
              <p className="text-ink-500">{new Date(log.createdAt).toLocaleString('uz-UZ')}</p>
              <div>
                <p className="font-semibold text-ink-950">{log.description}</p>
                <p className="mt-1 text-xs text-ink-500">{log.shop?.name ?? '-'}</p>
              </div>
              <span className="w-fit rounded-md bg-ink-100 px-2 py-1 text-xs font-semibold text-ink-700">
                {log.action}
              </span>
            </div>
          ))}
          {dashboardQuery.data.recentAudit.length === 0 ? (
            <p className="p-4 text-sm text-ink-500">Hozircha audit yozuvlari yo'q.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
