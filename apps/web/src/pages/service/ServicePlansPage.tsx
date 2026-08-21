import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';

export function ServicePlansPage() {
  const plansQuery = useQuery({
    queryKey: ['platform-plans'],
    queryFn: () => apiClient.platformPlans.list(),
    retry: false,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section>
        <h2 className="text-xl font-semibold text-ink-950">Tariflar / obuna</h2>
        <p className="mt-1 text-sm text-ink-500">
          Payment ulanmagan MVP: tariflar va obuna holatlari Service Panel orqali nazorat qilinadi.
        </p>
      </section>

      {plansQuery.isLoading ? <p className="text-sm text-ink-500">Yuklanmoqda...</p> : null}
      {plansQuery.isError ? (
        <p className="rounded-md border border-petal-100 bg-petal-50 p-3 text-sm text-petal-700">
          Tariflarni yuklab bo'lmadi.
        </p>
      ) : null}

      {plansQuery.data ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {plansQuery.data.plans.map((plan) => (
              <article
                className="rounded-md border border-ink-200 bg-[#dfe8df] p-5 shadow-sm"
                key={plan.code}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-700">{plan.name}</p>
                    <h3 className="mt-2 text-lg font-semibold text-ink-950">
                      {plan.description}
                    </h3>
                  </div>
                  <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-800">
                    {plan.shopsCount} shop
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <p className="text-ink-500">Filial limit</p>
                  <p className="text-right font-semibold text-ink-700">{plan.maxBranches}</p>
                  <p className="text-ink-500">User limit</p>
                  <p className="text-right font-semibold text-ink-700">{plan.maxUsers}</p>
                </div>
                <ul className="mt-5 space-y-2 text-sm text-ink-600">
                  {plan.features.map((feature, index) => (
                    <li className="rounded-md bg-ink-50 px-3 py-2" key={feature}>
                      <span className="mr-2 font-semibold text-brand-700">{index + 1}.</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <section className="rounded-md border border-ink-200 bg-[#dfe8df] p-5 shadow-sm">
            <h3 className="font-semibold text-ink-950">Obuna holatlari</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {Object.entries(plansQuery.data.subscriptionStatuses).map(([status, count]) => (
                <div className="rounded-md border border-ink-200 bg-[#d7e2d9] p-4" key={status}>
                  <p className="text-sm text-ink-500">{status}</p>
                  <p className="mt-2 text-2xl font-semibold text-ink-950">{count}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
