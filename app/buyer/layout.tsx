export default function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-secondary px-6 py-4">
        <p className="text-sm font-medium text-black">Buyer Dashboard</p>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
