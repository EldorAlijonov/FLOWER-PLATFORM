type ShopStatusBadgeProps = {
  status: 'ACTIVE' | 'BLOCKED' | 'ARCHIVED';
};

export function ShopStatusBadge({ status }: ShopStatusBadgeProps) {
  const tone =
    status === 'ACTIVE'
      ? 'bg-brand-50 text-brand-800'
      : status === 'BLOCKED'
        ? 'bg-petal-50 text-petal-700'
        : 'bg-ink-100 text-ink-700';
  const label =
    status === 'ACTIVE' ? 'Faol' : status === 'BLOCKED' ? 'Bloklangan' : 'Arxivlangan';

  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${tone}`}>
      {label}
    </span>
  );
}
