export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-primary">Project Detail</h1>
      <p className="mt-2 text-primary-mid">Moderate this project.</p>
      <dl className="mt-6 flex flex-wrap gap-4 text-sm text-primary-mid">
        <div key="id">
          <dt className="font-medium capitalize">id</dt>
          <dd>{id}</dd>
        </div>
      </dl>
    </div>
  );
}
