import Link from "next/link";
import type { SocietyCardData } from "@/types";
import { SocietyCard } from "../SocietyCard";

export function SocietiesSection({ societies }: { societies: SocietyCardData[] }) {
  return (
    <section className="border-t border-primary bg-white px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-black">Societies</h2>
          <Link href="/societies" className="text-sm text-primary transition hover:text-primary-mid">
            View all →
          </Link>
        </div>

        {societies.length === 0 ? (
          <p className="mt-8 text-sm text-primary-mid">Societies will appear here soon.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {societies.map((society) => (
              <SocietyCard key={society.id} society={society} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
