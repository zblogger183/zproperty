import { BuyerNavTabs } from "@/components/buyer/BuyerNavTabs";

export default function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-4 border-b border-secondary px-6 py-4">
        <p className="text-sm font-medium text-black">Buyer Dashboard</p>
        <BuyerNavTabs />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
