import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api-client';

type FieldErrors = {
  newPassword?: string;
  confirmPassword?: string;
  form?: string;
};

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const meQuery = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => apiClient.auth.me(),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: () => apiClient.auth.changePassword({ newPassword, confirmPassword }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      navigate('/app');
    },
    onError: (error) => setErrors(getApiFieldErrors(error)),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validatePasswords(newPassword, confirmPassword);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    mutation.mutate();
  }

  if (meQuery.isLoading) {
    return (
      <main className="min-h-screen bg-ink-100 p-6 text-sm text-ink-600">Tekshirilmoqda...</main>
    );
  }

  if (meQuery.isError || !meQuery.data) {
    return <Navigate replace to="/login" />;
  }

  if (meQuery.data.user.accountType === 'PLATFORM') {
    return <Navigate replace to="/service" />;
  }

  if (!meQuery.data.user.mustChangePassword) {
    return <Navigate replace to="/app" />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-100 px-4 py-8 text-ink-950">
      <section className="w-full max-w-md rounded-md border border-ink-200 bg-[#dfe8df] shadow-sm">
        <div className="grid grid-cols-3" aria-hidden="true">
          <div className="h-1 bg-brand-700" />
          <div className="h-1 bg-petal-600" />
          <div className="h-1 bg-sun-600" />
        </div>
        <div className="p-6">
          <p className="text-sm font-semibold text-brand-700">Parolni almashtirish</p>
          <h1 className="mt-2 text-2xl font-semibold">Yangi parol o'rnating</h1>
          <p className="mt-2 text-sm text-ink-500">
            Bir martalik paroldan keyin shaxsiy parolingizni yaratishingiz kerak.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <PasswordField
              error={errors.newPassword}
              label="Yangi parol"
              onChange={(value) => {
                setNewPassword(value);
                setErrors((current) => ({ ...current, newPassword: undefined, form: undefined }));
              }}
              onToggle={() => setShowNewPassword((current) => !current)}
              show={showNewPassword}
              value={newPassword}
            />
            <PasswordField
              error={errors.confirmPassword}
              label="Parolni takrorlang"
              onChange={(value) => {
                setConfirmPassword(value);
                setErrors((current) => ({
                  ...current,
                  confirmPassword: undefined,
                  form: undefined,
                }));
              }}
              onToggle={() => setShowConfirmPassword((current) => !current)}
              show={showConfirmPassword}
              value={confirmPassword}
            />

            {errors.form ? (
              <div className="rounded-md border border-petal-100 bg-petal-50 px-3 py-2 text-sm text-petal-700">
                {errors.form}
              </div>
            ) : null}

            <button
              className="h-11 w-full rounded-md bg-brand-700 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={mutation.isPending}
              type="submit"
            >
              {mutation.isPending ? 'Saqlanmoqda...' : 'Parolni saqlash'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

type PasswordFieldProps = {
  label: string;
  value: string;
  show: boolean;
  error?: string;
  onChange: (value: string) => void;
  onToggle: () => void;
};

function PasswordField({ label, value, show, error, onChange, onToggle }: PasswordFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-ink-700">{label}</label>
      <div
        className={`mt-2 flex rounded-md border bg-ink-50 focus-within:bg-[#dfe8df] focus-within:ring-4 ${
          error
            ? 'border-petal-600 focus-within:border-petal-600 focus-within:ring-petal-100'
            : 'border-ink-200 focus-within:border-brand-600 focus-within:ring-brand-100'
        }`}
      >
        <input
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-ink-950 outline-none"
          onChange={(event) => onChange(event.target.value)}
          type={show ? 'text' : 'password'}
          value={value}
        />
        <button
          className="flex h-11 w-11 shrink-0 items-center justify-center text-brand-700 hover:text-brand-800"
          onClick={onToggle}
          type="button"
          title={show ? 'Parolni yashirish' : "Parolni ko'rsatish"}
        >
          {show ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
          <span className="sr-only">{show ? 'Parolni yashirish' : "Parolni ko'rsatish"}</span>
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-petal-700">{error}</p> : null}
    </div>
  );
}

function validatePasswords(newPassword: string, confirmPassword: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!newPassword) errors.newPassword = 'Yangi parolni kiriting.';
  else if (newPassword.length < 8)
    errors.newPassword = "Parol kamida 8 ta belgidan iborat bo'lishi kerak.";

  if (!confirmPassword) errors.confirmPassword = 'Parolni takrorlang.';
  else if (newPassword !== confirmPassword)
    errors.confirmPassword = 'Parollar bir-biriga mos emas.';

  return errors;
}

function getApiFieldErrors(error: unknown): FieldErrors {
  const details = (error as { details?: { errors?: FieldErrors } }).details;
  return details?.errors ?? { form: "Parolni saqlab bo'lmadi. Qayta urinib ko'ring." };
}
