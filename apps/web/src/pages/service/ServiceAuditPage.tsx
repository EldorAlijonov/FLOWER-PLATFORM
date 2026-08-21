import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ServicePagination } from '../../components/service/ServicePagination';
import { apiClient } from '../../lib/api-client';

const AUDIT_PAGE_SIZE = 10;
const auditActions = [
  'SHOP_CREATED',
  'SHOP_UPDATED',
  'SHOP_BLOCKED',
  'SHOP_UNBLOCKED',
  'SHOP_ARCHIVED',
  'OWNER_PASSWORD_RESET',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
];

export function ServiceAuditPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = getPageParam(searchParams);
  const q = searchParams.get('q') ?? '';
  const action = searchParams.get('action') ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const [searchValue, setSearchValue] = useState(q);
  const auditQuery = useQuery({
    queryKey: ['platform-audit', { page, q, action, from, to }],
    queryFn: () =>
      apiClient.platformAudit.list({
        page,
        limit: AUDIT_PAGE_SIZE,
        q: q || undefined,
        action: action || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    retry: false,
  });

  useEffect(() => setSearchValue(q), [q]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (searchValue.trim()) next.set('q', searchValue.trim());
      else next.delete('q');
      next.set('page', '1');

      if (next.toString() !== searchParams.toString()) {
        setSearchParams(next);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchParams, searchValue, setSearchParams]);

  const logs = auditQuery.data?.items ?? [];
  const pagination = auditQuery.data?.pagination ?? {
    page,
    limit: AUDIT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  };

  function setFilter(key: 'action' | 'from' | 'to', value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  }

  function setPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-6.5rem)] max-w-7xl flex-col gap-5">
      <section className="shrink-0">
        <h2 className="text-xl font-semibold text-ink-950">Faollik tarixi</h2>
        <p className="mt-1 text-sm text-ink-500">Service Panel amallari audit loglari.</p>
      </section>

      <section className="flex min-h-0 flex-1 flex-col rounded-md border border-ink-200 bg-[#dfe8df] shadow-sm">
        <div className="shrink-0 border-b border-ink-200 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full max-w-md">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
                size={17}
              />
              <span className="sr-only">Audit qidirish</span>
              <input
                className="h-10 w-full rounded-md border border-ink-200 bg-ink-50 pl-10 pr-3 text-sm outline-none focus:border-brand-600 focus:bg-[#dfe8df] focus:ring-4 focus:ring-brand-100"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Qidirish..."
                type="search"
                value={searchValue}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <select
                className="h-10 rounded-md border border-ink-200 bg-ink-50 px-3 text-sm font-medium text-ink-700 outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                onChange={(event) => setFilter('action', event.target.value)}
                value={action}
              >
                <option value="">Barcha amallar</option>
                {auditActions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <input
                className="h-10 rounded-md border border-ink-200 bg-ink-50 px-3 text-sm font-medium text-ink-700 outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                onChange={(event) => setFilter('from', event.target.value)}
                type="date"
                value={from}
              />
              <input
                className="h-10 rounded-md border border-ink-200 bg-ink-50 px-3 text-sm font-medium text-ink-700 outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                onChange={(event) => setFilter('to', event.target.value)}
                type="date"
                value={to}
              />
            </div>
          </div>
        </div>
        {auditQuery.isLoading ? <p className="p-4 text-sm text-ink-500">Yuklanmoqda...</p> : null}
        {auditQuery.isError ? (
          <p className="p-4 text-sm text-petal-700">Audit tarixini yuklab bo'lmadi.</p>
        ) : null}
        {auditQuery.data ? (
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                <tr>
                  <th className="w-16 px-4 py-3 font-medium">No.</th>
                  <th className="px-4 py-3 font-medium">Sana</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Do'kon</th>
                  <th className="px-4 py-3 font-medium">Izoh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {logs.map((log, index) => (
                  <tr className="transition hover:bg-[#f2f7f1]" key={log.id}>
                    <td className="px-4 py-4 font-medium text-ink-500">
                      {(pagination.page - 1) * AUDIT_PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-4 py-4 text-ink-600">
                      {new Date(log.createdAt).toLocaleString('uz-UZ')}
                    </td>
                    <td className="px-4 py-4 font-semibold text-ink-950">{log.actor}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-md bg-ink-100 px-2 py-1 text-xs font-semibold text-ink-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-ink-600">{log.shop?.name ?? '-'}</td>
                    <td className="px-4 py-4 text-ink-600">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {!auditQuery.isLoading && !auditQuery.isError ? (
          <ServicePagination
            onPageChange={setPage}
            page={pagination.page}
            pageSize={AUDIT_PAGE_SIZE}
            totalItems={pagination.total}
          />
        ) : null}
      </section>
    </div>
  );
}

function getPageParam(searchParams: URLSearchParams) {
  const page = Number(searchParams.get('page') ?? '1');
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}
