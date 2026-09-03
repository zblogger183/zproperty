"use client";

function cleanPhone(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^92/, "").replace(/^0/, "");
}

function postLead(listingId: string, type: "whatsapp" | "call") {
  fetch(`/api/listings/${listingId}/lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
    keepalive: true,
  }).catch(() => {});
}

// Shown when a listing has no full registered agent account but does have a
// contact number attached (e.g. entered directly for a plot owner) — same
// Call/WhatsApp actions as AgentCard, without the profile bio/enquiry form
// there's no agent profile to back.
export function SimpleContactCard({
  listingId,
  whatsappMessage,
  phone,
  whatsapp,
}: {
  listingId: string;
  whatsappMessage: string;
  phone: string | null;
  whatsapp: string | null;
}) {
  const cleanedCallNumber = phone ? cleanPhone(phone) : whatsapp ? cleanPhone(whatsapp) : null;
  const cleanedWhatsapp = whatsapp ? cleanPhone(whatsapp) : phone ? cleanPhone(phone) : null;

  return (
    <div className="rounded-xl border-2 border-primary bg-white p-5 text-center">
      <p className="text-base font-bold text-black">Contact about this listing</p>

      {cleanedWhatsapp && (
        <a
          href={`https://wa.me/92${cleanedWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => postLead(listingId, "whatsapp")}
          className="mt-3 block w-full rounded-lg bg-secondary py-3 text-sm font-bold text-primary"
        >
          💬 WhatsApp
        </a>
      )}

      {cleanedCallNumber && (
        <a
          href={`tel:+92${cleanedCallNumber}`}
          onClick={() => postLead(listingId, "call")}
          className="mt-2 block w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white"
        >
          📞 Call
        </a>
      )}
    </div>
  );
}
