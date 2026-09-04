import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils/formatPrice";
import { projectMeta } from "@/lib/seo/metadata";
import { SchemaScript, projectSchema } from "@/lib/seo/schemas";
import { Breadcrumb } from "@/components/portal/Breadcrumb";
import { ImageGallery, type GalleryImage } from "@/components/portal/listing/ImageGallery";
import { ProjectEnquiryCard } from "@/components/portal/projects/ProjectEnquiryCard";
import MiniMapDynamic from "@/components/portal/listing/MiniMapLoader";

export const revalidate = 600;

const PROJECT_DETAIL_COLUMNS = `
  id, slug, name, tagline, type, property_type,
  status, address, description, amenities,
  launch_date, possession_date, completion_pct,
  total_units, min_price, max_price,
  min_area, max_area, lat, lng, developer_id,
  cover_image_url, og_image_url, master_plan_url,
  video_url, virtual_tour_url, brochure_url,
  is_featured, is_verified,
  views_count, leads_count,
  meta_title, meta_desc,
  city:cities(name, slug),
  area:areas(name, slug),
  society:societies(name, slug),
  images:project_images(url, thumb_url, type, title, display_order),
  payment_plans(
    id, unit_type, total_price, advance_pct,
    advance_amount, installment_yrs,
    monthly_installment, on_possession_pct,
    on_possession_amt, notes
  )
`;

interface ProjectImageRow {
  url: string;
  thumb_url: string | null;
  type: "gallery" | "floor_plan" | "master_plan" | "brochure" | "amenity" | null;
  title: string | null;
  display_order: number;
}

interface PaymentPlanRow {
  id: string;
  unit_type: string | null;
  total_price: number | null;
  advance_pct: number | null;
  advance_amount: number | null;
  installment_yrs: number | null;
  monthly_installment: number | null;
  on_possession_pct: number | null;
  on_possession_amt: number | null;
  notes: string | null;
}

interface ProjectDetail {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  type: string | null;
  property_type: string | null;
  status: string;
  address: string | null;
  description: string | null;
  amenities: unknown;
  launch_date: string | null;
  possession_date: string | null;
  completion_pct: number | null;
  total_units: number | null;
  min_price: number | null;
  max_price: number | null;
  min_area: number | null;
  max_area: number | null;
  lat: number | null;
  lng: number | null;
  developer_id: string | null;
  cover_image_url: string | null;
  og_image_url: string | null;
  master_plan_url: string | null;
  video_url: string | null;
  virtual_tour_url: string | null;
  brochure_url: string | null;
  is_featured: boolean;
  is_verified: boolean;
  views_count: number;
  leads_count: number;
  meta_title: string | null;
  meta_desc: string | null;
  city: { name: string; slug: string } | null;
  area: { name: string; slug: string } | null;
  society: { name: string; slug: string } | null;
  images: ProjectImageRow[];
  payment_plans: PaymentPlanRow[];
}

async function getProject(slug: string): Promise<ProjectDetail | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_DETAIL_COLUMNS)
    .eq("slug", slug)
    .eq("status_platform", "active")
    .single();

  return (data as unknown as ProjectDetail) ?? null;
}

export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("projects")
    .select("slug")
    .eq("status_platform", "active")
    .order("views_count", { ascending: false })
    .limit(100);

  return (data ?? []).map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    return { title: "Project not found | ZProperty.pk" };
  }

  return projectMeta({
    name: project.name,
    slug: project.slug,
    property_type: project.property_type,
    city_name: project.city?.name ?? "",
    address: project.address,
    status: project.status,
    total_units: project.total_units,
    min_price: project.min_price,
    max_price: project.max_price,
    unit_types: project.payment_plans.map((plan) => plan.unit_type),
    amenities: project.amenities,
    og_image_url: project.og_image_url,
    cover_image_url: project.cover_image_url,
    meta_title: project.meta_title,
    meta_desc: project.meta_desc,
  });
}

function formatDate(value: string | null): string {
  if (!value) return "TBD";
  return new Date(value).toLocaleDateString("en-PK", { year: "numeric", month: "long" });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  let developer: { name: string; phone: string | null } | null = null;
  if (project.developer_id) {
    const admin = createAdminClient();
    const { data } = await admin.from("users").select("name, phone").eq("id", project.developer_id).single();
    developer = data;
  }

  const images = project.images ?? [];
  const galleryImages: GalleryImage[] = images
    .filter((image) => image.type === "gallery")
    .sort((a, b) => a.display_order - b.display_order)
    .map((image) => ({
      thumb_url: image.thumb_url ?? image.url,
      large_url: image.url,
      alt_text: image.title ?? project.name,
      display_order: image.display_order,
    }));

  if (galleryImages.length === 0 && project.cover_image_url) {
    galleryImages.push({
      thumb_url: project.cover_image_url,
      large_url: project.cover_image_url,
      alt_text: project.name,
      display_order: 0,
    });
  }

  const planImages = images
    .filter((image) => image.type === "master_plan" || image.type === "floor_plan")
    .sort((a, b) => a.display_order - b.display_order);

  const amenities: string[] = Array.isArray(project.amenities) ? project.amenities : [];

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "New Projects", href: "/new-projects" },
    ...(project.city ? [{ label: project.city.name, href: `/new-projects/city/${project.city.slug}` }] : []),
    { label: project.name, href: `/new-projects/${slug}` },
  ];

  const areaRange =
    project.min_area && project.max_area && project.min_area !== project.max_area
      ? `${project.min_area} - ${project.max_area} Sqft`
      : project.min_area
        ? `${project.min_area} Sqft`
        : null;

  return (
    <>
      <SchemaScript
        schema={projectSchema({
          name: project.name,
          slug: project.slug,
          description: project.description,
          min_price: project.min_price,
          max_price: project.max_price,
          offer_count: project.payment_plans.length,
          cover_image_url: project.cover_image_url,
          og_image_url: project.og_image_url,
          city_name: project.city?.name ?? "",
        })}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        {/* Breadcrumb already emits its own BreadcrumbList JSON-LD. */}
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6">
          <ImageGallery images={galleryImages} videoUrl={project.video_url} title={project.name} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            {project.is_verified && (
              <span className="mb-3 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
                ✓ Verified Project
              </span>
            )}
            <h1 className="text-3xl font-bold text-black">{project.name}</h1>
            {project.tagline && <p className="mt-1 text-base text-primary-mid">{project.tagline}</p>}
            <p className="mt-1 text-sm text-primary-mid">
              {project.area ? `${project.area.name}, ${project.city?.name}` : project.city?.name}
            </p>
            {project.society && project.city && (
              <Link
                href={`/area-guide/${project.city.slug}/${project.society.slug}`}
                className="mt-1 inline-block text-sm text-primary hover:text-primary-mid"
              >
                Part of {project.society.name} →
              </Link>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <InfoCard label="Status" value={project.status.replace(/_/g, " ")} capitalize />
              {project.property_type && (
                <InfoCard label="Property Type" value={project.property_type} capitalize />
              )}
              <InfoCard label="Launch Date" value={formatDate(project.launch_date)} />
              <InfoCard label="Possession" value={formatDate(project.possession_date)} />
              {!!project.total_units && <InfoCard label="Total Units" value={`${project.total_units} units`} />}
              {areaRange && <InfoCard label="Area Range" value={areaRange} />}
            </div>

            {project.description && (
              <div className="mt-6">
                <h2 className="text-lg font-bold text-black">About {project.name}</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-black">
                  {project.description}
                </p>
              </div>
            )}

            {amenities.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 text-lg font-bold text-black">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full border border-secondary px-3 py-1.5 text-sm text-primary"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {project.payment_plans.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-4 text-xl font-bold text-black">Payment Plans</h2>
                {project.payment_plans.map((plan) => (
                  <div key={plan.id} className="mb-4 rounded-xl border border-primary bg-white p-5">
                    {plan.unit_type && <h3 className="mb-3 text-base font-bold text-black">{plan.unit_type}</h3>}

                    <PlanRow label="Total Price" value={plan.total_price ? formatPrice(plan.total_price, "buy") : "—"} />
                    {plan.advance_pct != null && (
                      <PlanRow
                        label={`Advance (${plan.advance_pct}%)`}
                        value={plan.advance_amount ? formatPrice(plan.advance_amount, "buy") : "—"}
                      />
                    )}
                    {plan.monthly_installment != null && (
                      <PlanRow
                        label="Monthly Installment"
                        value={`PKR ${plan.monthly_installment.toLocaleString("en-PK")}`}
                      />
                    )}
                    {plan.on_possession_pct != null && (
                      <PlanRow
                        label={`On Possession (${plan.on_possession_pct}%)`}
                        value={plan.on_possession_amt ? formatPrice(plan.on_possession_amt, "buy") : "—"}
                      />
                    )}
                    {!!plan.installment_yrs && (
                      <PlanRow label="Installment Period" value={`${plan.installment_yrs} years`} last={!plan.notes} />
                    )}
                    {plan.notes && (
                      <div className="flex justify-between py-2">
                        <span className="text-sm text-primary-mid">Note</span>
                        <span className="text-right text-sm italic text-primary-mid">{plan.notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {planImages.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 text-lg font-bold text-black">Master Plan & Floor Plans</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {planImages.map((image) => (
                    <div key={image.url} className="overflow-hidden rounded-xl border border-primary">
                      <div className="relative aspect-video">
                        <Image src={image.url} alt={image.title ?? project.name} fill className="object-cover" />
                      </div>
                      <div className="p-2">
                        {image.title && <p className="text-sm font-semibold text-black">{image.title}</p>}
                        <a
                          href={image.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline"
                        >
                          Open full size
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.lat != null && project.lng != null && (
              <div className="mt-6">
                <h2 className="text-lg font-bold text-black">Location</h2>
                <div className="mt-3">
                  <MiniMapDynamic lat={project.lat} lng={project.lng} title={project.name} />
                </div>
              </div>
            )}
          </div>

          <div>
            <ProjectEnquiryCard
              projectId={project.id}
              projectName={project.name}
              developerName={developer?.name ?? null}
              developerWhatsapp={developer?.phone ?? null}
            />

            <div className="mt-4 space-y-2 rounded-xl border border-primary bg-white p-5">
              <p className="text-xs text-primary-mid">{project.views_count} people viewed this project</p>
              <p className="text-xs text-primary-mid">{project.leads_count} enquiries received</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function InfoCard({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="rounded-lg border border-primary bg-white p-3">
      <p className="text-[10px] uppercase tracking-wide text-primary-mid">{label}</p>
      <p className={`text-base font-bold text-black ${capitalize ? "capitalize" : ""}`}>{value}</p>
    </div>
  );
}

function PlanRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex justify-between py-2 ${last ? "" : "border-b border-primary"}`}>
      <span className="text-sm text-primary-mid">{label}</span>
      <span className="text-sm font-semibold text-black">{value}</span>
    </div>
  );
}
