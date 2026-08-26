import Image from "next/image";
import Link from "next/link";
import { Bath, Bed } from "lucide-react";
import type { ListingCardData } from "@/types";
import { formatPkrPrice } from "@/lib/utils";
import { WhatsAppButton } from "./WhatsAppButton";
import { SaveButton } from "./SaveButton";

const BLUR_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='9'><rect width='16' height='9' fill='#1C4B42'/></svg>";
const BLUR_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(BLUR_SVG).toString("base64")}`;

export function ListingCard({
  listing,
  agentOverride,
}: {
  listing: ListingCardData;
  // Pages that already know the agent (e.g. an agent's own profile page,
  // listing every one of their listings) can pass it directly instead of
  // relying on listing.agent — useful since that field comes from a
  // public_agent_contact embed that isn't run on every query, and because
  // it avoids a redundant identical join when the same agent applies to
  // every card in the grid.
  agentOverride?: { name: string; whatsapp: string | null; profile_slug: string };
}) {
  const agent = agentOverride ?? listing.agent;
  const location = [listing.area?.name, listing.city?.name].filter(Boolean).join(", ");

  return (
    <div className="overflow-hidden rounded-xl border border-primary bg-white transition hover:border-2 hover:border-secondary">
      <Link href={`/listing/${listing.slug}`} className="block">
        <div className="relative aspect-video bg-primary/10">
          {listing.primary_image_url ? (
            <Image
              src={listing.primary_image_url}
              alt={listing.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 90vw"
              quality={65}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-primary-mid">
              No image
            </div>
          )}

          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {listing.is_featured && (
              <span className="w-fit rounded-full bg-secondary px-2 py-1 text-xs font-bold text-primary">
                Featured
              </span>
            )}
            {listing.is_hot_deal && (
              <span className="w-fit rounded-full bg-secondary px-2 py-1 text-xs font-bold text-primary">
                Hot Deal
              </span>
            )}
          </div>

          <span
            className={`absolute right-2 top-2 rounded-full px-2 py-1 text-xs ${
              listing.purpose === "buy"
                ? "bg-primary text-white"
                : "border border-primary bg-white text-primary"
            }`}
          >
            {listing.purpose === "buy" ? "Buy" : "Rent"}
          </span>

          <span className="absolute bottom-0 left-0 rounded-tr-lg bg-black px-3 py-1 text-sm font-bold text-secondary">
            {formatPkrPrice(listing.price, listing.purpose, listing.rental_period)}
          </span>

          <SaveButton listingId={listing.id} className="absolute bottom-2 right-2" />
        </div>

        <div className="p-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-black">{listing.title}</h3>
          {location && <p className="mt-1 text-xs text-primary-mid">{location}</p>}

          <div className="mt-2 flex items-center gap-3 text-xs text-black">
            {listing.beds != null && (
              <span className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" aria-hidden="true" />
                {listing.beds} Beds
              </span>
            )}
            {listing.baths != null && (
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" aria-hidden="true" />
                {listing.baths} Baths
              </span>
            )}
            {listing.area_marla != null && <span>{listing.area_marla} Marla</span>}
          </div>
        </div>
      </Link>

      {/* Kept outside the card's main <Link> above — nesting an agent-profile
          link inside the listing-detail link would produce invalid, nested
          <a> tags. */}
      {agent?.name && (
        <p className="px-3 text-xs text-primary-mid">
          Listed by{" "}
          {agent.profile_slug ? (
            <Link
              href={`/agents/${agent.profile_slug}`}
              className="font-medium text-primary hover:underline"
            >
              {agent.name}
            </Link>
          ) : (
            <span className="font-medium text-primary">{agent.name}</span>
          )}
        </p>
      )}

      <div className="px-3 pb-3 pt-2">
        <WhatsAppButton
          phone={agent?.whatsapp}
          message={`Hi, I'm interested in ${listing.title}`}
          className="w-full py-2 text-xs"
        />
      </div>
    </div>
  );
}
