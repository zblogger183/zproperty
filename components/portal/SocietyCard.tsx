import Image from "next/image";
import Link from "next/link";
import type { SocietyCardData } from "@/types";
import { formatPkrPrice } from "@/lib/utils";

const BLUR_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='9'><rect width='16' height='9' fill='#1C4B42'/></svg>";
const BLUR_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(BLUR_SVG).toString("base64")}`;

export function SocietyCard({ society }: { society: SocietyCardData }) {
  const href = society.city?.slug ? `/area-guide/${society.city.slug}/${society.slug}` : null;
  const priceLabel = society.avg_price_marla != null ? `From ${formatPkrPrice(society.avg_price_marla)}/Marla` : null;

  const card = (
    <div className="overflow-hidden rounded-xl border border-primary bg-white">
      <div className="relative aspect-video bg-primary/10">
        {society.cover_image_url ? (
          <Image
            src={society.cover_image_url}
            alt={society.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-primary-mid">No image</div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-base font-bold text-black">{society.name}</h3>
        {society.city?.name && <p className="text-sm text-primary-mid">{society.city.name}</p>}
        {society.developer_name && <p className="mt-1 text-sm text-black">{society.developer_name}</p>}
        {priceLabel && <p className="mt-1 font-semibold text-black">{priceLabel}</p>}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}
