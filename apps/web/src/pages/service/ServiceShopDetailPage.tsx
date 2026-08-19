import type { ShopPlan, UpdatePlatformShopBody } from '@flower-platform/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ServiceConfirmModal } from '../../components/service/ServiceConfirmModal';
import { ShopStatusBadge } from '../../components/service/ShopStatusBadge';
import { apiClient } from '../../lib/api-client';

type FieldErrors = Partial<Record<keyof UpdatePlatformShopBody, string>>;
type ConfirmAction = 'block' | 'unblock' | 'reset' | 'delete' | null;
type Notice = { tone: 'success' | 'danger'; message: string } | null;

export function ServiceShopDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<UpdatePlatformShopBody>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<{
    ownerLogin: string;
    temporaryPassword: string;
  } | null>(null);

  const shopQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['platform-shop', id],
    queryFn: () => apiClient.platformShops.get(id as string),
    retry: false,
  });

  useEffect(() => {
    if (shopQuery.data) {
      setValues({
        name: shopQuery.data.name,
        ownerName: shopQuery.data.ownerName,
        phone: shopQuery.data.phone,
        plan: shopQuery.data.plan,
      });
    }
  }, [shopQuery.data]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['platform-shop', id] });
    await queryClient.invalidateQueries({ queryKey: ['platform-shops'] });
    await queryClient.invalidateQueries({ queryKey: ['platform-dashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['platform-audit'] });
  };

  const updateMutation = useMutation({
    mutationFn: () => apiClient.platformShops.update(id as string, values),
    onSuccess: async () => {
      setNotice({ tone: 'success', message: "Do'kon ma'lumotlari saqlandi." });
      await invalidate();
    },
    onError: (error) => setFieldErrors(getApiFieldErrors(error)),
  });
  const blockMutation = useMutation({
    mutationFn: () => apiClient.platformShops.block(id as string),
    onSuccess: async () => {
      setNotice({ tone: 'success', message: "Do'kon bloklandi." });
      setConfirmAction(null);
      await invalidate();
    },
    onError: () => setNotice({ tone: 'danger', message: "Do'konni bloklab bo'lmadi." }),
  });
  const unblockMutation = useMutation({
    mutationFn: () => apiClient.platformShops.unblock(id as string),
    onSuccess: async () => {
      setNotice({ tone: 'success', message: "Do'kon blokdan chiqarildi." });
      setConfirmAction(null);
      await invalidate();
    },
    onError: () => setNotice({ tone: 'danger', message: "Do'konni blokdan chiqarib bo'lmadi." }),
  });
  const resetMutation = useMutation({
    mutationFn: () => apiClient.platformShops.resetOwnerPassword(id as string),
    onSuccess: async (data) => {
      setTemporaryPassword(data);
      setNotice({ tone: 'success', message: 'Yangi bir martalik parol yaratildi.' });
      setConfirmAction(null);
      await invalidate();
    },
    onError: () => setNotice({ tone: 'danger', message: "Owner parolini reset qilib bo'lmadi." }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => apiClient.platformShops.delete(id as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['platform-shops'] });
      await queryClient.invalidateQueries({ queryKey: ['platform-dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['platform-audit'] });
      navigate('/service/shops', { replace: true });
    },
    onError: () => setNotice({ tone: 'danger', message: "Do'konni o'chirib bo'lmadi." }),
  });

  if (!id) return <Navigate replace to="/service/shops" />;
  if (shopQuery.isLoading) return <p className="text-sm text-ink-500">Yuklanmoqda...</p>;
  if (shopQuery.isError || !shopQuery.data) {
    return (
      <p className="rounded-md border border-petal-100 bg-petal-50 p-3 text-sm text-petal-700">
        Do'kon topilmadi.
      </p>
    );
  }

  const shop = shopQuery.data;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateEditForm(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    updateMutation.mutate();
  }

  function goBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate('/service/shops');
  }

  function confirmCurrentAction() {
    if (confirmAction === 'block') blockMutation.mutate();
    if (confirmAction === 'unblock') unblockMutation.mutate();
    if (confirmAction === 'reset') resetMutation.mutate();
    if (confirmAction === 'delete') deleteMutation.mutate();
  }

  const pending =
    blockMutation.isPending ||
    unblockMutation.isPending ||
    resetMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-ink-200 px-3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            onClick={goBack}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={16} />
            Qaytish
          </button>
          <h2 className="mt-2 text-xl font-semibold text-ink-950">{shop.name}</h2>
        </div>
        <ShopStatusBadge status={shop.status} />
      </div>

      {notice ? <NoticeBanner notice={notice} onClose={() => setNotice(null)} /> : null}

      <section className="grid gap-4 md:grid-cols-2">
        <InfoCard label="Owner login" value={shop.owner?.login ?? '-'} />
        <InfoCard
          label="Oxirgi owner login"
          value={
            shop.owner?.lastLoginAt
              ? new Date(shop.owner.lastLoginAt).toLocaleString('uz-UZ')
              : "hali yo'q"
          }
        />
        <InfoCard
          label="Yaratilgan sana"
          value={new Date(shop.createdAt).toLocaleString('uz-UZ')}
        />
        <InfoCard
          label="Yangilangan sana"
          value={new Date(shop.updatedAt).toLocaleString('uz-UZ')}
        />
      </section>

      <section className="rounded-md border border-ink-200 bg-white shadow-sm">
        <div className="border-b border-ink-200 px-4 py-4">
          <h3 className="font-semibold text-ink-950">Do'konni tahrirlash</h3>
          <p className="mt-1 text-sm text-ink-500">
            Login va password bu formada o'zgartirilmaydi.
          </p>
        </div>
        <form className="space-y-4 p-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              error={fieldErrors.name}
              label="Do'kon nomi"
              onChange={(value) => setValues((current) => ({ ...current, name: value }))}
              value={values.name ?? ''}
            />
            <Field
              error={fieldErrors.ownerName}
              label="Egasi"
              onChange={(value) => setValues((current) => ({ ...current, ownerName: value }))}
              value={values.ownerName ?? ''}
            />
            <Field
              error={fieldErrors.phone}
              label="Telefon"
              onChange={(value) => setValues((current) => ({ ...current, phone: value }))}
              value={values.phone ?? ''}
            />
            <div>
              <label className="text-sm font-medium text-ink-700">Tarif</label>
              <select
                className="mt-2 h-10 w-full rounded-md border border-ink-200 bg-ink-50 px-3 text-sm"
                onChange={(event) =>
                  setValues((current) => ({ ...current, plan: event.target.value as ShopPlan }))
                }
                value={values.plan ?? 'START'}
              >
                <option>START</option>
                <option>BUSINESS</option>
                <option>PRO</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              className="h-10 rounded-md bg-brand-700 px-4 text-sm font-semibold text-white disabled:opacity-70"
              disabled={updateMutation.isPending}
              type="submit"
            >
              {updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-md border border-ink-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-ink-950">Xavfsizlik amallari</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {shop.status === 'ACTIVE' ? (
            <button
              className="h-10 rounded-md border border-petal-200 px-4 text-sm font-semibold text-petal-700 hover:bg-petal-50"
              onClick={() => setConfirmAction('block')}
              type="button"
            >
              Bloklash
            </button>
          ) : (
            <button
              className="h-10 rounded-md border border-brand-200 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50"
              onClick={() => setConfirmAction('unblock')}
              type="button"
            >
              Blokdan chiqarish
            </button>
          )}
          <button
            className="h-10 rounded-md border border-sun-200 px-4 text-sm font-semibold text-sun-700 hover:bg-sun-50"
            onClick={() => setConfirmAction('reset')}
            type="button"
          >
            Owner parolini reset qilish
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-petal-600 px-4 text-sm font-semibold text-white hover:bg-petal-700"
            onClick={() => setConfirmAction('delete')}
            type="button"
          >
            <Trash2 aria-hidden="true" size={16} />
            Do'konni o'chirish
          </button>
        </div>
      </section>

      <ServiceConfirmModal
        confirmLabel={getConfirmLabel(confirmAction)}
        message={getConfirmMessage(confirmAction, shop.name)}
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirmCurrentAction}
        open={Boolean(confirmAction)}
        pending={pending}
        title={getConfirmTitle(confirmAction)}
        tone={confirmAction === 'delete' || confirmAction === 'block' ? 'danger' : confirmAction === 'unblock' ? 'success' : 'warning'}
      />

      {temporaryPassword ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            className="absolute inset-0 bg-ink-950/45"
            onClick={() => setTemporaryPassword(null)}
            type="button"
          />
          <section className="relative w-full max-w-md rounded-md border border-ink-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-ink-950">Yangi bir martalik parol</h2>
            <p className="mt-3 text-sm text-ink-500">Bu parol faqat bir marta ko'rsatiladi.</p>
            <div className="mt-4 rounded-md bg-ink-50 p-4">
              <p className="text-xs text-ink-500">Login</p>
              <p className="font-semibold">{temporaryPassword.ownerLogin}</p>
              <p className="mt-3 text-xs text-ink-500">Parol</p>
              <p className="font-semibold tracking-wide">{temporaryPassword.temporaryPassword}</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border border-ink-200 px-3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
                onClick={() =>
                  void navigator.clipboard?.writeText(temporaryPassword.temporaryPassword)
                }
                type="button"
              >
                <Copy aria-hidden="true" size={16} />
                Nusxalash
              </button>
              <button
                className="h-10 rounded-md bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"
                onClick={() => setTemporaryPassword(null)}
                type="button"
              >
                Yopish
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-ink-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-ink-500">{label}</p>
      <p className="mt-2 font-semibold text-ink-950">{value}</p>
    </article>
  );
}

function Field({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-ink-700">{label}</label>
      <input
        className={`mt-2 h-10 w-full rounded-md border bg-ink-50 px-3 text-sm outline-none ${error ? 'border-petal-600' : 'border-ink-200'}`}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      {error ? <p className="mt-2 text-sm text-petal-700">{error}</p> : null}
    </div>
  );
}

function validateEditForm(values: UpdatePlatformShopBody): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name?.trim()) errors.name = "Do'kon nomini kiriting.";
  if (!values.ownerName?.trim()) errors.ownerName = 'Egasi ismini kiriting.';
  if (!values.phone || !/^\+?[0-9\s()-]{7,20}$/.test(values.phone.trim()))
    errors.phone = "Telefon raqami noto'g'ri.";
  if (values.plan && !['START', 'BUSINESS', 'PRO'].includes(values.plan))
    errors.plan = "Tarif noto'g'ri.";
  return errors;
}

function getApiFieldErrors(error: unknown): FieldErrors {
  const details = (error as { details?: { errors?: FieldErrors } }).details;
  return details?.errors ?? {};
}

function getConfirmTitle(action: ConfirmAction) {
  if (action === 'block') return "Do'konni bloklash";
  if (action === 'unblock') return "Do'konni blokdan chiqarish";
  if (action === 'reset') return 'Owner parolini reset qilish';
  if (action === 'delete') return "Do'konni o'chirish";
  return 'Amalni tasdiqlang';
}

function getConfirmMessage(action: ConfirmAction, shopName: string) {
  if (action === 'block') return `${shopName} bloklanadi va faol sessiyalari bekor qilinadi.`;
  if (action === 'unblock') return `${shopName} yana faol holatga o'tkaziladi.`;
  if (action === 'reset')
    return `${shopName} owneri uchun yangi bir martalik parol yaratiladi. Eski sessiyalar bekor qilinadi.`;
  if (action === 'delete')
    return `${shopName} ma'lumotlari butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.`;
  return 'Davom etishni tasdiqlaysizmi?';
}

function getConfirmLabel(action: ConfirmAction) {
  if (action === 'block') return 'Bloklash';
  if (action === 'unblock') return 'Blokdan chiqarish';
  if (action === 'reset') return 'Reset qilish';
  if (action === 'delete') return "O'chirish";
  return 'Tasdiqlash';
}

function NoticeBanner({ notice, onClose }: { notice: NonNullable<Notice>; onClose: () => void }) {
  const toneClass =
    notice.tone === 'success'
      ? 'border-brand-200 bg-brand-50 text-brand-800'
      : 'border-petal-100 bg-petal-50 text-petal-700';

  return (
    <div className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm ${toneClass}`}>
      <p>{notice.message}</p>
      <button className="font-semibold" onClick={onClose} type="button">
        Yopish
      </button>
    </div>
  );
}
