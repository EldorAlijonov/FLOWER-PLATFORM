import type {
  CreatePlatformShopBody,
  CreatePlatformShopResponse,
  ShopPlan,
} from '@flower-platform/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy } from 'lucide-react';
import { FormEvent, Ref, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';

type FieldErrors = Partial<Record<keyof CreatePlatformShopBody, string>>;

type ServiceCreateShopFormProps = {
  firstInputRef?: Ref<HTMLInputElement>;
  onSuccess?: () => void;
};

const initialValues: CreatePlatformShopBody = {
  name: '',
  ownerName: '',
  phone: '',
  login: '',
  plan: 'START',
};

export function ServiceCreateShopForm({ firstInputRef, onSuccess }: ServiceCreateShopFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<CreatePlatformShopBody>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [created, setCreated] = useState<CreatePlatformShopResponse | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.platformShops.create({
        ...values,
        name: values.name.trim(),
        ownerName: values.ownerName.trim(),
        phone: values.phone.trim(),
        login: values.login.trim(),
      }),
    onSuccess: async (data) => {
      setFieldErrors({});
      setFormError('');
      setCreated(data);
      await queryClient.invalidateQueries({ queryKey: ['platform-shops'] });
      await queryClient.invalidateQueries({ queryKey: ['platform-dashboard'] });
    },
    onError: (error) => {
      const errors = getApiFieldErrors(error);
      setCreated(null);

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setFormError('');
        return;
      }

      setFormError("Do'kon yaratib bo'lmadi. Qayta urinib ko'ring.");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateCreateShopForm(values);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('');
      return;
    }

    setFieldErrors({});
    setFormError('');
    mutation.mutate();
  }

  function setField<K extends keyof CreatePlatformShopBody>(
    field: K,
    value: CreatePlatformShopBody[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  }

  if (created) {
    return (
      <section className="space-y-4">
        <div className="rounded-md border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900">
          <p className="font-semibold">Do'kon muvaffaqiyatli yaratildi.</p>
          <p className="mt-2">Bu ma'lumot faqat bir marta ko'rsatiladi.</p>
        </div>
        <div className="rounded-md border border-ink-200 bg-[#d7e2d9] p-4">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-ink-500">Login</p>
              <p className="mt-1 font-semibold text-ink-950">{created.owner.login}</p>
            </div>
            <div>
              <p className="text-ink-500">Bir martalik parol</p>
              <p className="mt-1 font-semibold tracking-wide text-ink-950">
                {created.temporaryPassword}
              </p>
            </div>
          </div>
          <button
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-ink-200 px-3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            onClick={() => void navigator.clipboard?.writeText(created.temporaryPassword)}
            type="button"
          >
            <Copy aria-hidden="true" size={16} />
            Nusxalash
          </button>
        </div>
        <div className="flex justify-end">
          <button
            className="h-10 rounded-md bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"
            onClick={() => {
              setCreated(null);
              onSuccess?.();
              navigate('/service/shops');
            }}
            type="button"
          >
            Ro'yxatga o'tish
          </button>
        </div>
      </section>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          error={fieldErrors.name}
          inputRef={firstInputRef}
          label="Do'kon nomi"
          name="name"
          onChange={(value) => setField('name', value)}
          value={values.name}
        />
        <Field
          error={fieldErrors.ownerName}
          label="Egasi"
          name="ownerName"
          onChange={(value) => setField('ownerName', value)}
          value={values.ownerName}
        />
        <Field
          error={fieldErrors.phone}
          label="Telefon"
          name="phone"
          onChange={(value) => setField('phone', value)}
          type="tel"
          value={values.phone}
        />
        <Field
          error={fieldErrors.login}
          label="Login"
          name="login"
          onChange={(value) => setField('login', value)}
          value={values.login}
        />
        <div>
          <label className="text-sm font-medium text-ink-700" htmlFor="new-shop-plan">
            Tarif
          </label>
          <select
            className={`mt-2 h-10 w-full rounded-md border bg-ink-50 px-3 text-sm text-ink-950 outline-none focus:bg-[#dfe8df] focus:ring-4 ${
              fieldErrors.plan
                ? 'border-petal-600 focus:border-petal-600 focus:ring-petal-100'
                : 'border-ink-200 focus:border-brand-600 focus:ring-brand-100'
            }`}
            id="new-shop-plan"
            name="plan"
            onChange={(event) => setField('plan', event.target.value as ShopPlan)}
            value={values.plan}
          >
            <option>START</option>
            <option>BUSINESS</option>
            <option>PRO</option>
          </select>
          {fieldErrors.plan ? (
            <p className="mt-2 text-sm text-petal-700">{fieldErrors.plan}</p>
          ) : null}
        </div>
      </div>

      {formError ? (
        <div className="rounded-md border border-petal-100 bg-petal-50 px-3 py-2 text-sm text-petal-700">
          {formError}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          className="h-10 rounded-md bg-brand-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={mutation.isPending}
          type="submit"
        >
          {mutation.isPending ? 'Yaratilmoqda...' : 'Yaratish'}
        </button>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: keyof CreatePlatformShopBody;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  inputRef?: Ref<HTMLInputElement>;
};

function Field({ label, name, value, onChange, error, type = 'text', inputRef }: FieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-ink-700" htmlFor={`new-shop-${name}`}>
        {label}
      </label>
      <input
        className={`mt-2 h-10 w-full rounded-md border bg-ink-50 px-3 text-sm text-ink-950 outline-none focus:bg-[#dfe8df] focus:ring-4 ${
          error
            ? 'border-petal-600 focus:border-petal-600 focus:ring-petal-100'
            : 'border-ink-200 focus:border-brand-600 focus:ring-brand-100'
        }`}
        id={`new-shop-${name}`}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        ref={inputRef}
        type={type}
        value={value}
      />
      {error ? <p className="mt-2 text-sm text-petal-700">{error}</p> : null}
    </div>
  );
}

function validateCreateShopForm(values: CreatePlatformShopBody): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) errors.name = "Do'kon nomini kiriting.";
  if (!values.ownerName.trim()) errors.ownerName = 'Egasi ismini kiriting.';
  if (!/^\+?[0-9\s()-]{7,20}$/.test(values.phone.trim()))
    errors.phone = "Telefon raqami noto'g'ri.";
  if (!values.login.trim()) errors.login = 'Login kiriting.';
  if (!['START', 'BUSINESS', 'PRO'].includes(values.plan)) errors.plan = "Tarif noto'g'ri.";

  return errors;
}

function getApiFieldErrors(error: unknown): FieldErrors {
  const details = (
    error as { details?: { errors?: FieldErrors; fields?: Record<string, string[]> } }
  ).details;

  if (details?.errors) return details.errors;

  if (details?.fields) {
    return {
      name: details.fields.name?.[0],
      ownerName: details.fields.ownerName?.[0],
      phone: details.fields.phone?.[0],
      login: details.fields.login?.[0],
      plan: details.fields.plan?.[0],
    };
  }

  return {};
}
