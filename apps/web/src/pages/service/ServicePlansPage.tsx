const plans = [
  {
    name: 'START',
    caption: 'Boshlangich paket',
    features: ['Asosiy CRM', "Bitta do'kon", "Standart qo'llab-quvvatlash"],
  },
  {
    name: 'BUSINESS',
    caption: "O'sayotgan do'konlar uchun",
    features: ["Ko'proq imkoniyatlar", 'Jamoa boshqaruvi', 'Obuna nazorati'],
  },
  {
    name: 'PRO',
    caption: 'Kengaytirilgan platforma',
    features: ['Premium boshqaruv', 'Kengaytirilgan hisobot', 'Ustuvor yordam'],
  },
];

export function ServicePlansPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section>
        <h2 className="text-xl font-semibold text-ink-950">Tariflar / obuna</h2>
        <p className="mt-1 text-sm text-ink-500">
          Tariflar sahifasi skeletoni. Backend logikasi keyingi bosqichda ulanadi.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <article
            className="rounded-md border border-ink-200 bg-[#fbfdf8] p-5 shadow-sm"
            key={plan.name}
          >
            <p className="text-sm font-semibold text-brand-700">{plan.name}</p>
            <h3 className="mt-2 text-lg font-semibold text-ink-950">{plan.caption}</h3>
            <ul className="mt-5 space-y-2 text-sm text-ink-600">
              {plan.features.map((feature, index) => (
                <li className="rounded-md bg-ink-50 px-3 py-2" key={feature}>
                  <span className="mr-2 font-semibold text-brand-700">{index + 1}.</span>
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
