import { ServiceCreateShopForm } from '../../components/service/ServiceCreateShopForm';

export function ServiceCreateShopPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <section className="rounded-md border border-ink-200 bg-[#fbfdf8] shadow-sm">
        <div className="border-b border-ink-200 px-4 py-4 sm:px-5">
          <h2 className="text-xl font-semibold text-ink-950">Yangi do'kon</h2>
          <p className="mt-1 text-sm text-ink-500">Do'kon va asosiy OWNER account yaratish.</p>
        </div>
        <div className="p-4 sm:p-5">
          <ServiceCreateShopForm />
        </div>
      </section>
    </div>
  );
}
