const WA_API = `https://graph.facebook.com/v18.0/${process.env.WA_PHONE_ID}/messages`;
const WA_TOKEN = process.env.WA_ACCESS_TOKEN;

// Converts any Pakistani phone format to 92XXXXXXXXXX.
// Handles: already-92-prefixed (12 digits), leading-0 (11 digits), bare (10 digits).
function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `92${digits.slice(1)}`;
  if (digits.length === 10) return `92${digits}`;
  return digits;
}

interface WhatsAppComponent {
  type: "body";
  parameters: { type: "text"; text: string }[];
}

// Sends a pre-approved template message via Meta's WhatsApp Cloud API.
// Templates must be registered and approved in Meta Business Manager
// before they can be used in production.
async function sendWhatsApp(params: {
  to: string;
  templateName: string;
  components: WhatsAppComponent[];
}): Promise<void> {
  if (!process.env.WA_PHONE_ID || !WA_TOKEN) {
    console.log("[whatsapp] would send", params.templateName, "to", params.to);
    return;
  }

  const cleaned = cleanPhone(params.to);
  if (cleaned.length < 12) {
    console.warn("[whatsapp] skipping — phone too short:", params.to);
    return;
  }

  try {
    const response = await fetch(WA_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleaned,
        type: "template",
        template: {
          name: params.templateName,
          language: { code: "en_US" },
          components: params.components,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[whatsapp] API error:", response.status, text);
    }
  } catch (err) {
    // WhatsApp sending is best-effort — log but don't throw.
    console.error("[whatsapp] send failed:", err);
  }
}

function textParam(text: string): { type: "text"; text: string } {
  return { type: "text", text };
}

// ── TEMPLATE HELPERS ──────────────────────────────────────
// Template name → Meta Business Manager template (must be pre-approved).

async function newLead(
  phone: string,
  params: { leadType: string; listingTitle: string; leadName: string; leadPhone: string },
) {
  await sendWhatsApp({
    to: phone,
    templateName: "new_lead",
    components: [
      {
        type: "body",
        parameters: [
          textParam(params.leadName),
          textParam(params.leadType),
          textParam(params.listingTitle),
          textParam(params.leadPhone),
        ],
      },
    ],
  });
}

async function listingApproved(phone: string, listingTitle: string) {
  await sendWhatsApp({
    to: phone,
    templateName: "listing_approved",
    components: [{ type: "body", parameters: [textParam(listingTitle)] }],
  });
}

async function listingRejected(phone: string, title: string, reason: string) {
  await sendWhatsApp({
    to: phone,
    templateName: "listing_rejected",
    components: [{ type: "body", parameters: [textParam(title), textParam(reason)] }],
  });
}

async function paymentConfirmed(phone: string, planName: string, endsAt: string) {
  const formattedDate = new Date(endsAt).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  await sendWhatsApp({
    to: phone,
    templateName: "payment_confirmed",
    components: [{ type: "body", parameters: [textParam(planName), textParam(formattedDate)] }],
  });
}

async function subscriptionExpiring(phone: string, planName: string, days: number) {
  await sendWhatsApp({
    to: phone,
    templateName: "subscription_expiring",
    components: [{ type: "body", parameters: [textParam(planName), textParam(String(days))] }],
  });
}

async function cnicVerified(phone: string) {
  await sendWhatsApp({
    to: phone,
    templateName: "cnic_verified",
    components: [],
  });
}

export const wa = {
  newLead,
  listingApproved,
  listingRejected,
  paymentConfirmed,
  subscriptionExpiring,
  cnicVerified,
};
