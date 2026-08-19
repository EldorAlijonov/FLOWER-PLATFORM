type ShopStatusBadgeProps = {
  status: 'ACTIVE' | 'BLOCKED';
};

export function ShopStatusBadge({ status }: ShopStatusBadgeProps) {
  const isActive = status === 'ACTIVE';

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
        isActive ? 'bg-brand-50 text-brand-800' : 'bg-petal-50 text-petal-700'
      }`}
    >
      {isActive ? 'Faol' : 'Bloklangan'}
    </span>
  );
}
