export const revalidate = 1800;

export default async function AreaListingsPlotsPage({
  params,
}: {
  params: Promise<{ city: string; area: string }>;
}) {
  const { city, area } = await params;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-primary">Area Listings — Plots</h1>
      <p className="mt-2 text-text">Plot listings in this area.</p>
      <dl className="mt-6 flex flex-wrap gap-4 text-sm text-text">
        <div key="city">
          <dt className="font-medium capitalize">city</dt>
          <dd>{city}</dd>
        </div>
        <div key="area">
          <dt className="font-medium capitalize">area</dt>
          <dd>{area}</dd>
        </div>
      </dl>
    </div>
  );
}
