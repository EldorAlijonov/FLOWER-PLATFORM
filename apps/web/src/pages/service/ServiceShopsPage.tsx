import type { PlatformShop } from '@flower-platform/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, LayoutGrid, List, MoreHorizontal, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ServiceCreateShopModal } from '../../components/service/ServiceCreateShopModal';
import { ServiceConfirmModal } from '../../components/service/ServiceConfirmModal';
import { ServicePagination } from '../../components/service/ServicePagination';
import { ShopStatusBadge } from '../../components/service/ShopStatusBadge';
import { apiClient } from '../../lib/api-client';

type ConfirmAction =
  | { type: 'block'; shop: PlatformShop }
  | { type: 'unblock'; shop: PlatformShop }
  | { type: 'reset'; shop: PlatformShop }
  | { type: 'delete'; shop: PlatformShop };

type Notice = { tone: 'success' | 'danger'; message: string } | null;
const SHOPS_PAGE_SIZE = 8;

export function ServiceShopsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const createModalOpen = searchParams.get('new') === '1';
  const viewMode = searchParams.get('view') === 'cards' ? 'cards' : 'table';
  const currentPage = getPageParam(searchParams);
  const [openActionsId, setOpenActionsId] = useSearchParamsState('action');
  const [temporaryPassword, setTemporaryPassword] = useStateSecret();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const shopsQuery = useQuery({
    queryKey: ['platform-shops'],
    queryFn: () => apiClient.platformShops.list(),
    retry: false,
  });
  const refreshLists = async () => {
    await queryClient.invalidateQueries({ queryKey: ['platform-shops'] });
    await queryClient.invalidateQueries({ queryKey: ['platform-dashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['platform-audit'] });
  };
  const blockMutation = useMutation({
    mutationFn: (id: string) => apiClient.platformShops.block(id),
    onSuccess: async () => {
      setNotice({ tone: 'success', message: "Do'kon bloklandi." });
      setConfirmAction(null);
      await refreshLists();
    },
    onError: () => setNotice({ tone: 'danger', message: "Do'konni bloklab bo'lmadi." }),
  });
  const unblockMutation = useMutation({
    mutationFn: (id: string) => apiClient.platformShops.unblock(id),
    onSuccess: async () => {
      setNotice({ tone: 'success', message: "Do'kon blokdan chiqarildi." });
      setConfirmAction(null);
      await refreshLists();
    },
    onError: () => setNotice({ tone: 'danger', message: "Do'konni blokdan chiqarib bo'lmadi." }),
  });
  const resetMutation = useMutation({
    mutationFn: (id: string) => apiClient.platformShops.resetOwnerPassword(id),
    onSuccess: async (data) => {
      setTemporaryPassword(data);
      setNotice({ tone: 'success', message: 'Yangi bir martalik parol yaratildi.' });
      setConfirmAction(null);
      await refreshLists();
    },
    onError: () => setNotice({ tone: 'danger', message: "Owner parolini reset qilib bo'lmadi." }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.platformShops.delete(id),
    onSuccess: async () => {
      setNotice({ tone: 'success', message: "Do'kon ma'lumotlari o'chirildi." });
      setConfirmAction(null);
      await refreshLists();
    },
    onError: () => setNotice({ tone: 'danger', message: "Do'konni o'chirib bo'lmadi." }),
  });

  function openCreateModal() {
    const next = new URLSearchParams(searchParams);
    next.set('new', '1');
    setSearchParams(next);
  }

  function closeCreateModal() {
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next);
  }

  function setViewMode(nextMode: 'table' | 'cards') {
    const next = new URLSearchParams(searchParams);
    if (nextMode === 'cards') next.set('view', 'cards');
    else next.delete('view');
    next.delete('action');
    next.set('page', '1');
    setSearchParams(next);
  }

  function setCurrentPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    next.delete('action');
    setSearchParams(next);
  }

  function requestAction(action: ConfirmAction) {
    setOpenActionsId('');
    setConfirmAction(action);
  }

  function confirmCurrentAction() {
    if (!confirmAction) return;
    if (confirmAction.type === 'block') blockMutation.mutate(confirmAction.shop.id);
    if (confirmAction.type === 'unblock') unblockMutation.mutate(confirmAction.shop.id);
    if (confirmAction.type === 'reset') resetMutation.mutate(confirmAction.shop.id);
    if (confirmAction.type === 'delete') deleteMutation.mutate(confirmAction.shop.id);
  }

  const pending =
    blockMutation.isPending ||
    unblockMutation.isPending ||
    resetMutation.isPending ||
    deleteMutation.isPending;
  const shops = shopsQuery.data ?? [];
  const totalShopPages = Math.max(1, Math.ceil(shops.length / SHOPS_PAGE_SIZE));
  const page = Math.min(currentPage, totalShopPages);
  const paginatedShops = shops.slice((page - 1) * SHOPS_PAGE_SIZE, page * SHOPS_PAGE_SIZE);

  return (
    <div className="mx-auto flex h-[calc(100vh-6.5rem)] max-w-7xl flex-col gap-5">
      <section className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink-950">Do'konlar</h2>
          <p className="mt-1 text-sm text-ink-500">Platformadagi do'konlar UI skeletoni.</p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
          onClick={openCreateModal}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
          Yangi do'kon
        </button>
      </section>

      {notice ? <NoticeBanner notice={notice} onClose={() => setNotice(null)} /> : null}

      <section className="flex min-h-0 flex-1 flex-col rounded-md border border-ink-200 bg-[#fbfdf8] shadow-sm">
        <div className="shrink-0 border-b border-ink-200 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="relative block max-w-md">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
              size={17}
            />
            <span className="sr-only">Qidirish</span>
            <input
              className="h-10 w-full rounded-md border border-ink-200 bg-ink-50 pl-10 pr-3 text-sm outline-none focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-100"
              placeholder="Qidirish..."
              type="search"
            />
          </label>
          <div className="inline-flex w-fit rounded-md border border-ink-200 bg-[#eef3ef] p-1">
            <button
              className={`inline-flex h-9 items-center gap-2 rounded px-3 text-sm font-semibold ${
                viewMode === 'table'
                  ? 'bg-[#fbfdf8] text-ink-950 shadow-sm'
                  : 'text-ink-600 hover:text-ink-950'
              }`}
              onClick={() => setViewMode('table')}
              type="button"
            >
              <List aria-hidden="true" size={16} />
              Jadval
            </button>
            <button
              className={`inline-flex h-9 items-center gap-2 rounded px-3 text-sm font-semibold ${
                viewMode === 'cards'
                  ? 'bg-[#fbfdf8] text-ink-950 shadow-sm'
                  : 'text-ink-600 hover:text-ink-950'
              }`}
              onClick={() => setViewMode('cards')}
              type="button"
            >
              <LayoutGrid aria-hidden="true" size={16} />
              Card
            </button>
          </div>
          </div>
        </div>

        {shopsQuery.isLoading ? <p className="p-4 text-sm text-ink-500">Yuklanmoqda...</p> : null}

        {shopsQuery.isError ? (
          <div className="p-4">
            <p className="rounded-md border border-petal-100 bg-petal-50 px-3 py-2 text-sm text-petal-700">
              Do'konlarni yuklab bo'lmadi.
            </p>
          </div>
        ) : null}

        {!shopsQuery.isLoading && !shopsQuery.isError && shopsQuery.data?.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-ink-500">Hozircha do'konlar mavjud emas.</p>
            <button
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
              onClick={openCreateModal}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              Yangi do'kon
            </button>
          </div>
        ) : null}

        {shops.length > 0 ? (
          <div className="min-h-0 flex-1 overflow-auto">
            {viewMode === 'table' ? (
            <div className="hidden md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                  <tr>
                    <th className="w-16 px-4 py-3 font-medium">No.</th>
                    <th className="px-4 py-3 font-medium">Do'kon nomi</th>
                    <th className="px-4 py-3 font-medium">Egasi</th>
                    <th className="px-4 py-3 font-medium">Telefon</th>
                    <th className="px-4 py-3 font-medium">Tarif</th>
                    <th className="px-4 py-3 font-medium">Holati</th>
                    <th className="px-4 py-3 font-medium">Yaratilgan sana</th>
                    <th className="px-4 py-3 font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {paginatedShops.map((shop, index) => (
                    <tr className="transition hover:bg-[#f2f7f1]" key={shop.id}>
                      <td className="px-4 py-4 font-medium text-ink-500">
                        {(page - 1) * SHOPS_PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-4 font-semibold text-ink-950">{shop.name}</td>
                      <td className="px-4 py-4 text-ink-600">{shop.ownerName}</td>
                      <td className="px-4 py-4 text-ink-600">{shop.phone}</td>
                      <td className="px-4 py-4 font-medium text-ink-700">{shop.plan}</td>
                      <td className="px-4 py-4">
                        <ShopStatusBadge status={shop.status} />
                      </td>
                      <td className="px-4 py-4 text-ink-600">{formatDate(shop.createdAt)}</td>
                      <td className="px-4 py-4">
                        <ActionsDropdown
                          onBlock={() => requestAction({ type: 'block', shop })}
                          onDelete={() => requestAction({ type: 'delete', shop })}
                          onReset={() => requestAction({ type: 'reset', shop })}
                          onToggle={() =>
                            setOpenActionsId(openActionsId === shop.id ? '' : shop.id)
                          }
                          onClose={() => setOpenActionsId('')}
                          onUnblock={() => requestAction({ type: 'unblock', shop })}
                          open={openActionsId === shop.id}
                          shop={shop}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            ) : null}

            <div
              className={
                viewMode === 'cards'
                  ? 'grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3'
                  : 'divide-y divide-ink-100 md:hidden'
              }
            >
              {paginatedShops.map((shop, index) => (
                <article
                  className={
                    viewMode === 'cards'
                      ? 'space-y-4 rounded-md border border-ink-200 bg-[#f8fbf6] p-4 shadow-sm transition hover:border-brand-200 hover:bg-[#f2f7f1] hover:shadow-md'
                      : 'space-y-3 p-4 transition hover:bg-[#f2f7f1]'
                  }
                  key={shop.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-100 text-xs font-semibold text-ink-600">
                        {(page - 1) * SHOPS_PAGE_SIZE + index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-950">{shop.name}</p>
                        <p className="mt-1 text-sm text-ink-500">{shop.ownerName}</p>
                      </div>
                    </div>
                    <ShopStatusBadge status={shop.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <p className="text-ink-500">Telefon</p>
                    <p className="text-right text-ink-700">{shop.phone}</p>
                    <p className="text-ink-500">Tarif</p>
                    <p className="text-right font-medium text-ink-700">{shop.plan}</p>
                    <p className="text-ink-500">Sana</p>
                    <p className="text-right text-ink-700">{formatDate(shop.createdAt)}</p>
                  </div>
                  <div className="flex justify-end">
                    <ActionsDropdown
                      onBlock={() => requestAction({ type: 'block', shop })}
                      onDelete={() => requestAction({ type: 'delete', shop })}
                      onReset={() => requestAction({ type: 'reset', shop })}
                      onToggle={() => setOpenActionsId(openActionsId === shop.id ? '' : shop.id)}
                      onClose={() => setOpenActionsId('')}
                      onUnblock={() => requestAction({ type: 'unblock', shop })}
                      open={openActionsId === shop.id}
                      shop={shop}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
        {!shopsQuery.isLoading && !shopsQuery.isError ? (
          <ServicePagination
            onPageChange={setCurrentPage}
            page={page}
            pageSize={SHOPS_PAGE_SIZE}
            totalItems={shops.length}
          />
        ) : null}
      </section>

      <ServiceCreateShopModal onClose={closeCreateModal} open={createModalOpen} />
      <ServiceConfirmModal
        confirmLabel={getConfirmLabel(confirmAction)}
        message={getConfirmMessage(confirmAction)}
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirmCurrentAction}
        open={Boolean(confirmAction)}
        pending={pending}
        title={getConfirmTitle(confirmAction)}
        tone={confirmAction?.type === 'delete' || confirmAction?.type === 'block' ? 'danger' : confirmAction?.type === 'unblock' ? 'success' : 'warning'}
      />
      {temporaryPassword ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            className="absolute inset-0 bg-ink-950/45"
            onClick={() => setTemporaryPassword(null)}
            type="button"
          />
          <section className="relative w-full max-w-md rounded-md border border-ink-200 bg-[#fbfdf8] p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-ink-950">Yangi bir martalik parol</h2>
            <p className="mt-3 text-sm text-ink-500">Bu parol faqat bir marta ko'rsatiladi.</p>
            <div className="mt-4 rounded-md bg-ink-50 p-4">
              <p className="text-xs text-ink-500">Login</p>
              <p className="font-semibold text-ink-950">{temporaryPassword.ownerLogin}</p>
              <p className="mt-3 text-xs text-ink-500">Parol</p>
              <p className="font-semibold tracking-wide text-ink-950">
                {temporaryPassword.temporaryPassword}
              </p>
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('uz-UZ');
}

function getPageParam(searchParams: URLSearchParams) {
  const page = Number(searchParams.get('page') ?? '1');
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function ActionsDropdown({
  shop,
  open,
  onToggle,
  onClose,
  onBlock,
  onUnblock,
  onReset,
  onDelete,
}: {
  shop: PlatformShop;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative inline-block text-left">
      <button
        className="flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 text-ink-600 hover:bg-ink-50"
        onClick={onToggle}
        type="button"
      >
        <MoreHorizontal aria-hidden="true" size={18} />
        <span className="sr-only">Amallar</span>
      </button>
      {open ? (
        <div
          className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-ink-200 bg-[#fbfdf8] p-1 text-sm shadow-lg"
          onMouseLeave={onClose}
        >
          <Link
            className="block rounded px-3 py-2 font-medium text-brand-700 hover:bg-brand-50"
            to={`/service/shops/${shop.id}`}
          >
            Ko'rish
          </Link>
          {shop.status === 'ACTIVE' ? (
            <button
              className="block w-full rounded px-3 py-2 text-left font-medium text-petal-700 hover:bg-petal-50"
              onClick={onBlock}
              type="button"
            >
              Bloklash
            </button>
          ) : (
            <button
              className="block w-full rounded px-3 py-2 text-left font-medium text-brand-700 hover:bg-brand-50"
              onClick={onUnblock}
              type="button"
            >
              Blokdan chiqarish
            </button>
          )}
          <button
            className="block w-full rounded px-3 py-2 text-left font-medium text-sun-700 hover:bg-sun-50"
            onClick={onReset}
            type="button"
          >
            Owner uchun bir martalik parol yaratish
          </button>
          <button
            className="block w-full rounded px-3 py-2 text-left font-medium text-petal-700 hover:bg-petal-50"
            onClick={onDelete}
            type="button"
          >
            Do'konni o'chirish
          </button>
        </div>
      ) : null}
    </div>
  );
}

function useSearchParamsState(key: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) ?? '';

  function setValue(nextValue: string) {
    const next = new URLSearchParams(searchParams);
    if (nextValue) next.set(key, nextValue);
    else next.delete(key);
    setSearchParams(next);
  }

  return [value, setValue] as const;
}

function useStateSecret() {
  const [value, setValue] = useState<{
    ownerLogin: string;
    temporaryPassword: string;
  } | null>(null);
  return [value, setValue] as const;
}

function getConfirmTitle(action: ConfirmAction | null) {
  if (!action) return 'Amalni tasdiqlang';
  if (action.type === 'block') return "Do'konni bloklash";
  if (action.type === 'unblock') return "Do'konni blokdan chiqarish";
  if (action.type === 'reset') return 'Owner parolini reset qilish';
  return "Do'konni o'chirish";
}

function getConfirmMessage(action: ConfirmAction | null) {
  if (!action) return 'Davom etishni tasdiqlaysizmi?';
  if (action.type === 'block') return `${action.shop.name} bloklanadi va faol sessiyalari bekor qilinadi.`;
  if (action.type === 'unblock') return `${action.shop.name} yana faol holatga o'tkaziladi.`;
  if (action.type === 'reset')
    return `${action.shop.name} owneri uchun yangi bir martalik parol yaratiladi. Eski sessiyalar bekor qilinadi.`;
  return `${action.shop.name} ma'lumotlari butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.`;
}

function getConfirmLabel(action: ConfirmAction | null) {
  if (!action) return 'Tasdiqlash';
  if (action.type === 'block') return 'Bloklash';
  if (action.type === 'unblock') return 'Blokdan chiqarish';
  if (action.type === 'reset') return 'Reset qilish';
  return "O'chirish";
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
