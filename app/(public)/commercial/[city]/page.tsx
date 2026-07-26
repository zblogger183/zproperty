export const revalidate = 1800;

export default async function CityListingsCommercialPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-primary">City Listings — Commercial</h1>
      <p className="mt-2 text-text">Commercial listings in this city.</p>
      <dl className="mt-6 flex flex-wrap gap-4 text-sm text-text">
        <div key="city">
          <dt className="font-medium capitalize">city</dt>
          <dd>{city}</dd>
        </div>
      </dl>
    </div>
  );
}
