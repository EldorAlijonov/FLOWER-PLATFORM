import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { apiClient } from '../../lib/api-client';

type PasswordErrors = Partial<
  Record<'currentPassword' | 'newPassword' | 'confirmPassword' | 'form', string>
>;

export function ServiceSettingsPage() {
  const queryClient = useQueryClient();
  const [values, setValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const profileQuery = useQuery({
    queryKey: ['platform-profile'],
    queryFn: () => apiClient.platformAuth.profile(),
    retry: false,
  });
  const securityQuery = useQuery({
    queryKey: ['platform-security'],
    queryFn: () => apiClient.platformAuth.security(),
    retry: false,
  });
  const passwordMutation = useMutation({
    mutationFn: () => apiClient.platformAuth.changePassword(values),
    onSuccess: async () => {
      setValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
      setNotice("Parol yangilandi. Boshqa platform sessiyalar bekor qilindi.");
      await queryClient.invalidateQueries({ queryKey: ['platform-security'] });
    },
    onError: (error) => setErrors(getApiFieldErrors(error)),
  });

  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    passwordMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section>
        <h2 className="text-xl font-semibold text-ink-950">Sozlamalar</h2>
        <p className="mt-1 text-sm text-ink-500">Service Admin profil va xavfsizlik sozlamalari.</p>
      </section>

      {notice ? (
        <div className="rounded-md border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800">
          {notice}
        </div>
      ) : null}

      <section className="rounded-md border border-ink-200 bg-[#dfe8df] p-5 shadow-sm">
        <h3 className="text-base font-semibold text-ink-950">Profil</h3>
        {profileQuery.isLoading ? <p className="mt-3 text-sm text-ink-500">Yuklanmoqda...</p> : null}
        {profileQuery.data ? (
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Login" value={profileQuery.data.user.login} />
            <Info label="Role" value={profileQuery.data.user.role} />
            <Info label="Account type" value={profileQuery.data.user.accountType} />
            <Info label="ID" value={profileQuery.data.user.id} />
          </div>
        ) : null}
      </section>

      <section className="rounded-md border border-ink-200 bg-[#dfe8df] p-5 shadow-sm">
        <h3 className="text-base font-semibold text-ink-950">Parolni o'zgartirish</h3>
        <form className="mt-4 space-y-4" onSubmit={submitPassword}>
          <PasswordField
            error={errors.currentPassword}
            label="Hozirgi parol"
            name="currentPassword"
            onChange={(value) => setValues((current) => ({ ...current, currentPassword: value }))}
            onToggle={() => setShow((current) => ({ ...current, currentPassword: !current.currentPassword }))}
            show={Boolean(show.currentPassword)}
            value={values.currentPassword}
          />
          <PasswordField
            error={errors.newPassword}
            label="Yangi parol"
            name="newPassword"
            onChange={(value) => setValues((current) => ({ ...current, newPassword: value }))}
            onToggle={() => setShow((current) => ({ ...current, newPassword: !current.newPassword }))}
            show={Boolean(show.newPassword)}
            value={values.newPassword}
          />
          <PasswordField
            error={errors.confirmPassword}
            label="Yangi parolni takrorlang"
            name="confirmPassword"
            onChange={(value) => setValues((current) => ({ ...current, confirmPassword: value }))}
            onToggle={() => setShow((current) => ({ ...current, confirmPassword: !current.confirmPassword }))}
            show={Boolean(show.confirmPassword)}
            value={values.confirmPassword}
          />
          {errors.form ? <p className="text-sm text-petal-700">{errors.form}</p> : null}
          <div className="flex justify-end">
            <button
              className="h-10 rounded-md bg-brand-700 px-4 text-sm font-semibold text-white disabled:opacity-70"
              disabled={passwordMutation.isPending}
              type="submit"
            >
              {passwordMutation.isPending ? 'Saqlanmoqda...' : 'Parolni yangilash'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-md border border-ink-200 bg-[#dfe8df] p-5 shadow-sm">
        <h3 className="text-base font-semibold text-ink-950">Faol sessiyalar</h3>
        <div className="mt-4 divide-y divide-ink-200 text-sm">
          {securityQuery.data?.sessions.map((session) => (
            <div className="grid gap-2 py-3 sm:grid-cols-[1fr_8rem_6rem]" key={session.id}>
              <div>
                <p className="font-semibold text-ink-950">
                  {session.current ? 'Joriy sessiya' : 'Platform sessiya'}
                </p>
                <p className="mt-1 text-ink-500">
                  Yaratilgan: {new Date(session.createdAt).toLocaleString('uz-UZ')}
                </p>
              </div>
              <p className="text-ink-600">{session.status}</p>
              <p className="text-ink-500">{session.current ? 'Current' : '-'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink-200 bg-[#d7e2d9] p-3">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-1 break-all font-semibold text-ink-950">{value}</p>
    </div>
  );
}

function PasswordField({
  label,
  name,
  value,
  show,
  error,
  onChange,
  onToggle,
}: {
  label: string;
  name: string;
  value: string;
  show: boolean;
  error?: string;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-ink-700" htmlFor={name}>
        {label}
      </label>
      <div className={`mt-2 flex rounded-md border bg-ink-50 ${error ? 'border-petal-600' : 'border-ink-200'}`}>
        <input
          className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
          id={name}
          onChange={(event) => onChange(event.target.value)}
          type={show ? 'text' : 'password'}
          value={value}
        />
        <button
          className="flex h-10 w-10 items-center justify-center text-ink-600"
          onClick={onToggle}
          type="button"
        >
          {show ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}
          <span className="sr-only">{show ? 'Yashirish' : "Ko'rsatish"}</span>
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-petal-700">{error}</p> : null}
    </div>
  );
}

function validate(values: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const errors: PasswordErrors = {};
  if (!values.currentPassword) errors.currentPassword = 'Hozirgi parolni kiriting.';
  if (values.newPassword.length < 8)
    errors.newPassword = "Parol kamida 8 ta belgidan iborat bo'lishi kerak.";
  if (values.newPassword !== values.confirmPassword)
    errors.confirmPassword = 'Parollar bir-biriga mos emas.';
  return errors;
}

function getApiFieldErrors(error: unknown): PasswordErrors {
  const details = (error as { details?: { errors?: PasswordErrors } }).details;
  return details?.errors ?? { form: "Parolni yangilab bo'lmadi." };
}
