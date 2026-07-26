export default async function MarketingClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-primary">Marketing Client Detail</h1>
      <p className="mt-2 text-text">Campaign detail for this client.</p>
      <dl className="mt-6 flex flex-wrap gap-4 text-sm text-text">
        <div key="clientId">
          <dt className="font-medium capitalize">clientId</dt>
          <dd>{clientId}</dd>
        </div>
      </dl>
    </div>
  );
}
