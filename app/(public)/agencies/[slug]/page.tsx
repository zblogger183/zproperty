export const revalidate = 600;

export default async function AgencyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-primary">Agency Profile</h1>
      <p className="mt-2 text-primary-mid">Agency profile and active listings.</p>
      <dl className="mt-6 flex flex-wrap gap-4 text-sm text-primary-mid">
        <div key="slug">
          <dt className="font-medium capitalize">slug</dt>
          <dd>{slug}</dd>
        </div>
      </dl>
    </div>
  );
}
