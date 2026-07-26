const POINTS = [
  { title: "Verified Listings Only", body: "Every property verified before going live" },
  { title: "CNIC-Verified Agents", body: "All agents identity-verified" },
  { title: "WhatsApp-First", body: "Contact agents instantly via WhatsApp" },
  { title: "Zero Commission", body: "We never charge buyers a commission" },
];

export function WhyUsSection() {
  return (
    <section className="bg-white px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-3xl font-bold text-black">Why SarZameenz?</h2>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {POINTS.map((point) => (
            <div key={point.title} className="border-l-4 border-secondary py-4 pl-5">
              <h3 className="text-base font-bold text-black">{point.title}</h3>
              <p className="mt-1 text-sm text-primary-mid">{point.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
