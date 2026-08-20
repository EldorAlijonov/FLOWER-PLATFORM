import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api-client';

export type FieldErrors = {
  login?: string;
  password?: string;
  form?: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const mutation = useMutation({
    mutationFn: () => apiClient.auth.login({ login, password }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      setFieldErrors({});
      navigate(data.redirectTo);
    },
    onError: (error) => {
      setFieldErrors(getApiFieldErrors(error));
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateLoginForm(login, password);

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    mutation.mutate(undefined);
  }

  if (mutation.isSuccess) {
    return <Navigate replace to={mutation.data.redirectTo} />;
  }

  return (
    <AuthShell
      eyebrow="FLOWER PLATFORM"
      subtitle="CRM tizimiga kirish"
      onSubmit={handleSubmit}
      errors={fieldErrors}
      loading={mutation.isPending}
      login={login}
      password={password}
      setLogin={(value) => {
        setLogin(value);
        setFieldErrors((current) => ({ ...current, login: undefined, form: undefined }));
      }}
      setPassword={(value) => {
        setPassword(value);
        setFieldErrors((current) => ({ ...current, password: undefined, form: undefined }));
      }}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
    />
  );
}

type AuthShellProps = {
  eyebrow: string;
  subtitle: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  errors?: FieldErrors;
  loading: boolean;
  login: string;
  password: string;
  setLogin: (value: string) => void;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
};

export function AuthShell(props: AuthShellProps) {
  const loginHasError = Boolean(props.errors?.login);
  const passwordHasError = Boolean(props.errors?.password);

  return (
    <main className="min-h-screen bg-brand-950 text-ink-950 lg:bg-ink-50">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-brand-950 px-10 py-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-100">Lola Gullari</p>
            <p className="mt-1 text-xs text-brand-200">Universal Flower Shop Platform</p>
          </div>

          <div className="max-w-xl">
            <div className="mb-8 grid grid-cols-3 gap-3" aria-hidden="true">
              <div className="h-28 rounded-md bg-brand-700" />
              <div className="h-28 rounded-md bg-petal-600" />
              <div className="h-28 rounded-md bg-sun-600" />
            </div>
            <h1 className="text-4xl font-semibold leading-tight">Xavfsiz kirish va aniq tenant konteksti.</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-brand-100">
              Platforma va do'kon foydalanuvchilari alohida sessionlarda ishlaydi.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-md border border-white/15 bg-[#dfe8df]/10 p-4">
              <p className="text-2xl font-semibold">2</p>
              <p className="mt-1 text-brand-100">login turi</p>
            </div>
            <div className="rounded-md border border-white/15 bg-[#dfe8df]/10 p-4">
              <p className="text-2xl font-semibold">1</p>
              <p className="mt-1 text-brand-100">shop kontekst</p>
            </div>
            <div className="rounded-md border border-white/15 bg-[#dfe8df]/10 p-4">
              <p className="text-2xl font-semibold">7</p>
              <p className="mt-1 text-brand-100">kunlik session</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-brand-950 px-5 py-10 sm:px-8 lg:bg-ink-50">
          <div className="w-full max-w-md">
            <div className="mb-4 rounded-md border border-white/15 bg-[#dfe8df]/10 p-4 text-white lg:hidden">
              <p className="text-sm font-semibold text-brand-100">Lola Gullari</p>
              <p className="mt-1 text-xs text-brand-200">Universal Flower Shop Platform</p>
              <div className="mt-5 grid grid-cols-3 gap-2" aria-hidden="true">
                <div className="h-3 rounded bg-brand-600" />
                <div className="h-3 rounded bg-petal-600" />
                <div className="h-3 rounded bg-sun-600" />
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-ink-200 bg-[#dfe8df] shadow-sm ring-1 ring-brand-100">
              <div className="grid grid-cols-3" aria-hidden="true">
                <div className="h-2 bg-brand-700" />
                <div className="h-2 bg-petal-600" />
                <div className="h-2 bg-sun-600" />
              </div>
              <div className="p-6 sm:p-8">
                <p className="text-sm font-medium text-brand-700">{props.eyebrow}</p>
                <h1 className="mt-2 text-2xl font-semibold text-ink-950">{props.subtitle}</h1>

                <form className="mt-8 space-y-5" onSubmit={props.onSubmit}>
                  <div>
                    <label className="text-sm font-medium text-ink-700" htmlFor="login">
                      Login
                    </label>
                    <input
                      autoComplete="username"
                      className={`mt-2 h-11 w-full rounded-md border bg-ink-50 px-3 text-sm text-ink-950 outline-none transition focus:bg-[#dfe8df] focus:ring-4 ${
                        loginHasError
                          ? 'border-petal-600 focus:border-petal-600 focus:ring-petal-100'
                          : 'border-ink-200 focus:border-brand-600 focus:ring-brand-100'
                      }`}
                      id="login"
                      onChange={(event) => props.setLogin(event.target.value)}
                      value={props.login}
                    />
                    {props.errors?.login ? <p className="mt-2 text-sm text-petal-700">{props.errors.login}</p> : null}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-ink-700" htmlFor="password">
                      Parol
                    </label>
                    <div
                      className={`mt-2 flex rounded-md border bg-ink-50 focus-within:bg-[#dfe8df] focus-within:ring-4 ${
                        passwordHasError
                          ? 'border-petal-600 focus-within:border-petal-600 focus-within:ring-petal-100'
                          : 'border-ink-200 focus-within:border-brand-600 focus-within:ring-brand-100'
                      }`}
                    >
                      <input
                        autoComplete="current-password"
                        className="h-11 min-w-0 flex-1 bg-transparent px-3 pr-2 text-sm text-ink-950 outline-none"
                        id="password"
                        onChange={(event) => props.setPassword(event.target.value)}
                        type={props.showPassword ? 'text' : 'password'}
                        value={props.password}
                      />
                      <button
                        className="flex h-11 w-11 shrink-0 items-center justify-center text-brand-700 hover:text-brand-800"
                        onClick={() => props.setShowPassword(!props.showPassword)}
                        type="button"
                        title={props.showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                      >
                        {props.showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
                        <span className="sr-only">
                          {props.showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                        </span>
                      </button>
                    </div>
                    {props.errors?.password ? (
                      <p className="mt-2 text-sm text-petal-700">{props.errors.password}</p>
                    ) : null}
                  </div>

                  {props.errors?.form ? (
                    <div className="rounded-md border border-petal-100 bg-petal-50 px-3 py-2 text-sm text-petal-700">
                      {props.errors.form}
                    </div>
                  ) : null}

                  <button
                    className="h-11 w-full rounded-md bg-brand-700 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={props.loading}
                    type="submit"
                  >
                    {props.loading ? 'Kirish...' : 'Kirish'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function validateLoginForm(login: string, password: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!login.trim()) {
    errors.login = 'Login kiritilishi shart.';
  } else if (login.trim().length < 4) {
    errors.login = "Login kamida 4 ta belgidan iborat bo'lishi kerak.";
  } else if (login.trim().length > 64) {
    errors.login = 'Login 64 belgidan oshmasligi kerak.';
  }

  if (!password) {
    errors.password = 'Parol kiritilishi shart.';
  } else if (password.length > 256) {
    errors.password = 'Parol 256 belgidan oshmasligi kerak.';
  }

  return errors;
}

export function getApiErrorMessage(error: unknown) {
  const details = (error as { details?: { message?: string } }).details;

  if (details?.message) {
    return details.message;
  }

  return "Login yoki parol noto'g'ri.";
}

export function getApiFieldErrors(error: unknown): FieldErrors {
  const details = (error as { status?: number; details?: { errors?: FieldErrors; fields?: Record<string, string[]>; message?: string } }).details;

  if (!details) {
    return { form: "Server bilan bog'lanib bo'lmadi. Qayta urinib ko'ring." };
  }

  if (details?.errors) {
    return details.errors;
  }

  if (details?.fields) {
    return {
      login: details.fields.login?.[0],
      password: details.fields.password?.[0],
    };
  }

  return { form: getApiErrorMessage(error) };
}
