import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

type ServiceConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'danger' | 'warning' | 'success';
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ServiceConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  tone = 'warning',
  pending = false,
  onConfirm,
  onCancel,
}: ServiceConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    playWarningBell();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
      if (event.key === 'Enter') onConfirm();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, onConfirm, open]);

  if (!open) return null;

  const confirmClass =
    tone === 'danger'
      ? 'bg-petal-600 hover:bg-petal-700 focus:ring-petal-100'
      : tone === 'success'
        ? 'bg-brand-700 hover:bg-brand-800 focus:ring-brand-100'
        : 'bg-sun-600 hover:bg-sun-700 focus:ring-sun-100';

  return (
    <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" role="dialog">
      <button aria-label="Bekor qilish" className="absolute inset-0 bg-ink-950/45" onClick={onCancel} type="button" />
      <section className="relative w-full max-w-md rounded-md border border-ink-200 bg-white p-5 shadow-xl">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sun-50 text-sun-700">
            <AlertTriangle aria-hidden="true" size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="h-10 rounded-md border border-ink-200 px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            disabled={pending}
            onClick={onCancel}
            type="button"
          >
            Bekor qilish
          </button>
          <button
            className={`h-10 rounded-md px-4 text-sm font-semibold text-white focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${confirmClass}`}
            disabled={pending}
            onClick={onConfirm}
            type="button"
          >
            {pending ? 'Bajarilmoqda...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function playWarningBell() {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const gain = context.createGain();
  const oscillator = context.createOscillator();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  oscillator.frequency.setValueAtTime(660, context.currentTime + 0.12);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.36);
  window.setTimeout(() => void context.close(), 500);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
