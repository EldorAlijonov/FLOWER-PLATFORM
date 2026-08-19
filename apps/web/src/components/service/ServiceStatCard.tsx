import type { LucideIcon } from 'lucide-react';

type ServiceStatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
};

export function ServiceStatCard({ title, value, subtitle, icon: Icon }: ServiceStatCardProps) {
  return (
    <article className="rounded-md border border-ink-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-600">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-ink-950">{value}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
          <Icon aria-hidden="true" size={20} />
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-500">{subtitle}</p>
    </article>
  );
}
