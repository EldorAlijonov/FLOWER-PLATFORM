import { useQuery } from '@tanstack/react-query';
import type { CrmAdminMetric, CrmAdminOrder, CrmAdminProduct } from '@flower-platform/types';
import { apiClient } from '../lib/api-client';

const metricToneClass: Record<CrmAdminMetric['tone'], string> = {
  emerald: 'border-brand-200 bg-brand-50 text-brand-900',
  sky: 'border-ink-200 bg-ink-50 text-ink-900',
  amber: 'border-sun-100 bg-sun-50 text-sun-700',
  rose: 'border-petal-100 bg-petal-50 text-petal-700',
};

const orderStatusClass: Record<CrmAdminOrder['status'], string> = {
  NEW: 'bg-ink-100 text-ink-700',
  PREPARING: 'bg-sun-100 text-sun-700',
  READY: 'bg-brand-100 text-brand-800',
  DELIVERING: 'bg-petal-100 text-petal-700',
};

const orderStatusLabel: Record<CrmAdminOrder['status'], string> = {
  NEW: 'Yangi',
  PREPARING: 'Tayyorlanmoqda',
  READY: 'Tayyor',
  DELIVERING: 'Yetkazilmoqda',
};

const productStatusClass: Record<CrmAdminProduct['status'], string> = {
  ACTIVE: 'bg-brand-100 text-brand-800',
  LOW_STOCK: 'bg-sun-100 text-sun-700',
  PAUSED: 'bg-ink-200 text-ink-700',
};

const productStatusLabel: Record<CrmAdminProduct['status'], string> = {
  ACTIVE: 'Faol',
  LOW_STOCK: 'Kam qoldi',
  PAUSED: "To'xtatilgan",
};

const shopStatusLabel = {
  ACTIVE: 'Faol',
  BLOCKED: 'Bloklangan',
} as const;

const moneyFormatter = new Intl.NumberFormat('uz-UZ');

export function HomePage() {
  const dashboardQuery = useQuery({
    queryKey: ['crm-admin-dashboard'],
    queryFn: () => apiClient.crmAdmin.getDashboard(),
  });

  if (dashboardQuery.isLoading) {
    return (
      <section className="space-y-6 p-4 sm:p-6">
        <div className="h-28 animate-pulse rounded-md bg-[#dfe8df]" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-28 animate-pulse rounded-md bg-[#dfe8df]" key={index} />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-md bg-[#dfe8df]" />
      </section>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <section className="p-4 sm:p-6">
        <div className="rounded-md border border-petal-100 bg-petal-50 p-4 text-sm text-petal-700">
          Ma'lumotlarni yuklab bo'lmadi. API ishlayotganini tekshiring.
        </div>
      </section>
    );
  }

  const dashboard = dashboardQuery.data;

  return (
    <section className="space-y-6 p-4 sm:p-6">
      <div className="rounded-md border border-ink-200 bg-[#dfe8df] p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-brand-700">{dashboard.shop.name}</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink-950">Boshqaruv paneli</h1>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs text-ink-500 sm:w-80">
            <div className="rounded-md border border-ink-200 px-3 py-2">
              <p className="font-semibold text-ink-950">08:00</p>
              <p>Ochilish</p>
            </div>
            <div className="rounded-md border border-ink-200 px-3 py-2">
              <p className="font-semibold text-ink-950">22:00</p>
              <p>Yopilish</p>
            </div>
            <div className="rounded-md border border-ink-200 px-3 py-2">
              <p className="font-semibold text-brand-700">{shopStatusLabel[dashboard.shop.status]}</p>
              <p>Holat</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.metrics.map((metric) => (
          <article className={`rounded-md border p-4 ${metricToneClass[metric.tone]}`} key={metric.label}>
            <p className="text-sm font-medium">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
            <p className="mt-2 text-xs opacity-80">{metric.trend}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="rounded-md border border-ink-200 bg-[#dfe8df]">
          <div className="flex items-center justify-between border-b border-ink-200 p-4">
            <h2 className="text-base font-semibold">Jonli buyurtmalar</h2>
            <button className="rounded-md border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
              Barchasi
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Mijoz</th>
                  <th className="px-4 py-3 font-medium">Guldasta</th>
                  <th className="px-4 py-3 font-medium">Holat</th>
                  <th className="px-4 py-3 font-medium">Yetkazish</th>
                  <th className="px-4 py-3 text-right font-medium">Jami</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {dashboard.orders.map((order) => (
                  <tr className="hover:bg-ink-50" key={order.id}>
                    <td className="px-4 py-4 font-medium text-ink-950">{order.customerName}</td>
                    <td className="px-4 py-4 text-ink-600">{order.bouquetName}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded px-2 py-1 text-xs font-medium ${orderStatusClass[order.status]}`}>
                        {orderStatusLabel[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-ink-600">{order.deliveryTime}</td>
                    <td className="px-4 py-4 text-right font-medium">
                      {moneyFormatter.format(order.totalAmount)} so'm
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-md border border-ink-200 bg-[#dfe8df]">
          <div className="flex items-center justify-between border-b border-ink-200 p-4">
            <h2 className="text-base font-semibold">Ombor</h2>
            <button className="rounded-md border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
              Zaxira to'ldirish
            </button>
          </div>
          <div className="divide-y divide-ink-100">
            {dashboard.products.map((product) => (
              <div className="grid grid-cols-[1fr_auto] gap-3 p-4" key={product.id}>
                <div>
                  <p className="font-medium text-ink-950">{product.name}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    {product.stock} ta qoldi - {moneyFormatter.format(product.price)} so'm
                  </p>
                </div>
                <span
                  className={`h-fit rounded px-2 py-1 text-xs font-medium ${productStatusClass[product.status]}`}
                >
                  {productStatusLabel[product.status]}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

