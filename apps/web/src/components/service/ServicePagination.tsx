import { ChevronLeft, ChevronRight } from 'lucide-react';

type ServicePaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

export function ServicePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: ServicePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex shrink-0 flex-col gap-3 border-t border-ink-200 bg-[#f8fbf6] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-ink-600">
        {start}-{end} / {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border border-ink-200 px-3 font-semibold text-ink-700 transition hover:bg-[#eef3ef] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={16} />
          Oldingi
        </button>
        <span className="min-w-20 rounded-md border border-ink-200 bg-[#fbfdf8] px-3 py-2 text-center font-semibold text-ink-700">
          {currentPage} / {totalPages}
        </span>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border border-ink-200 px-3 font-semibold text-ink-700 transition hover:bg-[#eef3ef] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          Keyingi
          <ChevronRight aria-hidden="true" size={16} />
        </button>
      </div>
    </div>
  );
}
