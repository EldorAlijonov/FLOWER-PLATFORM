const sections = [
  { title: 'Profil', description: 'Service Account maʼlumotlari uchun joy.' },
  { title: 'Login', description: 'Login sozlamalari keyingi bosqichda ulanadi.' },
  {
    title: "Parolni o'zgartirish",
    description: 'Hozir faqat UI skeleton, backend funksiyasi yoʻq.',
  },
  { title: 'Platforma sozlamalari', description: 'Umumiy sozlamalar bloki uchun placeholder.' },
];

export function ServiceSettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section>
        <h2 className="text-xl font-semibold text-ink-950">Sozlamalar</h2>
        <p className="mt-1 text-sm text-ink-500">Service Panel sozlamalari skeletoni.</p>
      </section>

      <section className="space-y-3">
        {sections.map((section) => (
          <article
            className="rounded-md border border-ink-200 bg-[#fbfdf8] p-5 shadow-sm"
            key={section.title}
          >
            <h3 className="text-base font-semibold text-ink-950">{section.title}</h3>
            <p className="mt-2 text-sm text-ink-500">{section.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
