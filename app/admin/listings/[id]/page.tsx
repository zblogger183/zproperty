export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-primary">Listing Detail</h1>
      <p className="mt-2 text-text">Moderate this listing.</p>
      <dl className="mt-6 flex flex-wrap gap-4 text-sm text-text">
        <div key="id">
          <dt className="font-medium capitalize">id</dt>
          <dd>{id}</dd>
        </div>
      </dl>
    </div>
  );
}
