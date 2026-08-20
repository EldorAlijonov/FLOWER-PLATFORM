import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ServicePagination } from '../../components/service/ServicePagination';
import { apiClient } from '../../lib/api-client';

const AUDIT_PAGE_SIZE = 10;

export function ServiceAuditPage() {
  const [page, setPage] = useState(1);
  const auditQuery = useQuery({
    queryKey: ['platform-audit'],
    queryFn: () => apiClient.platformAudit.list(),
    retry: false,
  });
  const logs = auditQuery.data ?? [];
  const totalPages = Math.max(1, Math.ceil(logs.length / AUDIT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedLogs = logs.slice(
    (currentPage - 1) * AUDIT_PAGE_SIZE,
    currentPage * AUDIT_PAGE_SIZE,
  );

  return (
    <div className="mx-auto flex h-[calc(100vh-6.5rem)] max-w-7xl flex-col gap-5">
      <section className="shrink-0">
        <h2 className="text-xl font-semibold text-ink-950">Faollik tarixi</h2>
        <p className="mt-1 text-sm text-ink-500">Service Panel amallari audit loglari.</p>
      </section>

      <section className="flex min-h-0 flex-1 flex-col rounded-md border border-ink-200 bg-[#dfe8df] shadow-sm">
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
                {paginatedLogs.map((log, index) => (
                  <tr className="transition hover:bg-[#f2f7f1]" key={log.id}>
                    <td className="px-4 py-4 font-medium text-ink-500">
                      {(currentPage - 1) * AUDIT_PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-4 py-4 text-ink-600">
                      {new Date(log.createdAt).toLocaleString('uz-UZ')}
                    </td>
                    <td className="px-4 py-4 font-semibold text-ink-950">{log.actor}</td>
                    <td className="px-4 py-4 text-ink-600">{log.action}</td>
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
            page={currentPage}
            pageSize={AUDIT_PAGE_SIZE}
            totalItems={logs.length}
          />
        ) : null}
      </section>
    </div>
  );
}
