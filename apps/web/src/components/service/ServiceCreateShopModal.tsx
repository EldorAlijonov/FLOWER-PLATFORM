import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ServiceCreateShopForm } from './ServiceCreateShopForm';

type ServiceCreateShopModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ServiceCreateShopModal({ open, onClose }: ServiceCreateShopModalProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = window.setTimeout(() => firstInputRef.current?.focus(), 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4"
      role="dialog"
    >
      <button
        aria-label="Modal oynani yopish"
        className="absolute inset-0 bg-ink-950/45"
        onClick={onClose}
        type="button"
      />
      <section className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-md border border-ink-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-ink-200 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink-950">Yangi do'kon</h2>
            <p className="mt-1 text-sm text-ink-500">
              Hozir faqat forma interfeysi. Backend keyingi bosqichda ulanadi.
            </p>
          </div>
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ink-200 text-ink-600 hover:bg-ink-50"
            onClick={onClose}
            title="Yopish"
            type="button"
          >
            <X aria-hidden="true" size={18} />
            <span className="sr-only">Yopish</span>
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <ServiceCreateShopForm firstInputRef={firstInputRef} onSuccess={onClose} />
        </div>
      </section>
    </div>
  );
}
