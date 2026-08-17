import { Resend } from "resend";

// The Resend constructor throws immediately if given a falsy key, so a
// placeholder is passed when unset — send() below no-ops before this
// client is ever actually used in that case.
const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
const FROM = "ZProperty <noreply@zproperty.pk>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zproperty.pk";

function cleanPhone(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^92/, "").replace(/^0/, "");
}

// ── SHARED HTML WRAPPER ───────────────────────────────────
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <style>
    body { margin:0; padding:0; background:#f4f4f4;
           font-family: Arial, sans-serif; }
    .wrap { max-width:580px; margin:24px auto;
            background:#ffffff; border-radius:12px;
            overflow:hidden; border:1px solid #D4E0DD; }
    .header { background:#1C4B42; padding:24px 32px;
              text-align:center; }
    .header-logo { font-size:22px; font-weight:700;
                   color:#B4E717; letter-spacing:-0.5px; }
    .header-tag { font-size:11px; color:#2A6B5F;
                  margin-top:4px; }
    .body { padding:32px; }
    .body h2 { color:#000000; font-size:20px;
               font-weight:700; margin:0 0 16px; }
    .body p { color:#000000; font-size:14px;
              line-height:1.6; margin:0 0 12px; }
    .body .muted { color:#2A6B5F; font-size:13px; }
    .cta { display:inline-block; background:#B4E717;
           color:#1C4B42; font-weight:700;
           font-size:14px; padding:12px 28px;
           border-radius:8px; text-decoration:none;
           margin:16px 0; }
    .divider { border:none; border-top:1px solid #D4E0DD;
               margin:24px 0; }
    .footer { background:#1C4B42; padding:16px 32px;
              text-align:center; }
    .footer p { color:#2A6B5F; font-size:11px; margin:0; }
    .footer a { color:#B4E717; text-decoration:none; }
    .badge { display:inline-block; background:#1C4B42;
             color:#B4E717; font-size:11px; font-weight:700;
             padding:4px 10px; border-radius:20px; }
    .alert-box { background:#E8F2F0; border-left:4px solid
                 #1C4B42; padding:12px 16px; border-radius:4px;
                 margin:16px 0; }
    .success-box { background:#F2FBD0; border-left:4px solid
                   #B4E717; padding:12px 16px; border-radius:4px;
                   margin:16px 0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="header-logo">ZProperty.pk</div>
      <div class="header-tag">Pakistan's Real Estate Growth Ecosystem</div>
    </div>
    <div class="body">
      ${content}
    </div>
    <hr class="divider" />
    <div class="footer">
      <p>© ${new Date().getFullYear()} ZProperty.pk —
        <a href="${SITE}">Visit website</a> ·
        <a href="${SITE}/contact">Contact us</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── SEND HELPER ───────────────────────────────────────────
async function send(params: { to: string; subject: string; html: string }): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // Log in dev, skip in prod if key missing
    console.log("[email] would send to", params.to, ":", params.subject);
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  } catch (err) {
    // Email is best-effort — log but don't throw
    console.error("[email] send failed:", err);
  }
}

// ── EMAIL TEMPLATES ───────────────────────────────────────

export async function emailListingApproved(params: {
  to: string;
  agentName: string;
  listingTitle: string;
  listingSlug: string;
}) {
  await send({
    to: params.to,
    subject: "✓ Your listing is now live on ZProperty!",
    html: emailWrapper(`
      <h2>Your listing is live!</h2>
      <p>Hi ${params.agentName},</p>
      <p>Great news! Your listing has been reviewed and approved
         by our team. It is now visible to thousands of buyers
         on ZProperty.pk.</p>
      <div class="success-box">
        <strong>${params.listingTitle}</strong><br>
        <span class="muted">is now live and receiving enquiries</span>
      </div>
      <a class="cta" href="${SITE}/listing/${params.listingSlug}">
        View Your Live Listing →
      </a>
      <hr class="divider" />
      <p class="muted">Share your listing link with potential buyers
         to get more enquiries. Upgrade to Pro to feature your
         listing at the top of search results.</p>
    `),
  });
}

export async function emailListingRejected(params: {
  to: string;
  agentName: string;
  listingTitle: string;
  reason: string;
}) {
  await send({
    to: params.to,
    subject: "Your listing requires attention",
    html: emailWrapper(`
      <h2>Listing not approved</h2>
      <p>Hi ${params.agentName},</p>
      <p>Your listing <strong>${params.listingTitle}</strong>
         could not be approved at this time.</p>
      <div class="alert-box">
        <strong>Reason:</strong> ${params.reason}
      </div>
      <p>Please update your listing and resubmit. Common issues:</p>
      <ul style="color:#000;font-size:14px;line-height:2;">
        <li>Add at least 3 clear photos</li>
        <li>Ensure the price is correct</li>
        <li>Write a detailed description (min 50 words)</li>
        <li>Verify the property type and location</li>
      </ul>
      <a class="cta" href="${SITE}/dashboard/listings">
        Fix and Resubmit →
      </a>
    `),
  });
}

export async function emailNewLead(params: {
  to: string;
  agentName: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
  leadType: "call" | "whatsapp" | "email" | "form";
  message?: string;
  listingTitle: string;
  listingSlug: string;
}) {
  const typeLabels = {
    call: "Phone Call",
    whatsapp: "WhatsApp",
    email: "Email",
    form: "Enquiry Form",
  };
  const cleanedPhone = cleanPhone(params.leadPhone);
  await send({
    to: params.to,
    subject: `New lead for "${params.listingTitle}"`,
    html: emailWrapper(`
      <h2>You have a new lead!</h2>
      <p>Hi ${params.agentName},</p>
      <p>Someone is interested in your listing.
         Contact them quickly — fast responses
         get 3x more conversions.</p>
      <div class="alert-box">
        <p style="margin:0 0 8px;">
          <strong>${params.leadName}</strong>
          <span class="badge" style="margin-left:8px;">
            Via ${typeLabels[params.leadType]}
          </span>
        </p>
        <p style="margin:0 0 4px;">
          📞 <strong>${params.leadPhone}</strong>
        </p>
        ${params.leadEmail ? `<p style="margin:0 0 4px;">✉ ${params.leadEmail}</p>` : ""}
        ${
          params.message
            ? `<p style="margin:8px 0 0;font-style:italic;color:#2A6B5F">
               "${params.message}"</p>`
            : ""
        }
      </div>
      ${
        cleanedPhone
          ? `<a class="cta" href="https://wa.me/92${cleanedPhone}?text=${encodeURIComponent(`Hi ${params.leadName}, I saw your enquiry about ${params.listingTitle}`)}">
        Reply on WhatsApp →
      </a>`
          : ""
      }
      <hr class="divider" />
      <p class="muted">View all your leads in your
        <a href="${SITE}/dashboard/leads" style="color:#1C4B42">
          Dashboard
        </a>
      </p>
    `),
  });
}

export async function emailCNICVerified(params: { to: string; agentName: string }) {
  await send({
    to: params.to,
    subject: "✓ Your CNIC has been verified",
    html: emailWrapper(`
      <h2>Identity Verified!</h2>
      <p>Hi ${params.agentName},</p>
      <div class="success-box">
        <strong>✓ CNIC Verified</strong><br>
        <span class="muted">Your identity has been confirmed
        by our team.</span>
      </div>
      <p>You now have a <strong>Verified Agent badge</strong>
         on all your listings. Verified agents receive
         significantly more enquiries from serious buyers.</p>
      <a class="cta" href="${SITE}/dashboard">
        View Your Dashboard →
      </a>
    `),
  });
}

export async function emailPaymentConfirmed(params: {
  to: string;
  name: string;
  planName: string;
  amount: number;
  endsAt: string;
}) {
  const formattedAmount = new Intl.NumberFormat("en-PK").format(params.amount);
  const formattedDate = new Date(params.endsAt).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  await send({
    to: params.to,
    subject: `Payment confirmed — ${params.planName} Plan active`,
    html: emailWrapper(`
      <h2>Payment Confirmed</h2>
      <p>Hi ${params.name},</p>
      <p>Your payment has been received and your
         subscription is now active.</p>
      <div class="success-box">
        <p style="margin:0 0 4px;">
          <strong>Plan:</strong> ${params.planName}
        </p>
        <p style="margin:0 0 4px;">
          <strong>Amount paid:</strong> PKR ${formattedAmount}
        </p>
        <p style="margin:0;">
          <strong>Active until:</strong> ${formattedDate}
        </p>
      </div>
      <a class="cta" href="${SITE}/dashboard/subscription">
        View Subscription →
      </a>
      <hr class="divider" />
      <p class="muted">Keep this email as your receipt.
         If you have any issues, contact us at
         support@zproperty.pk</p>
    `),
  });
}

export async function emailSubscriptionExpiring(params: {
  to: string;
  name: string;
  planName: string;
  daysLeft: number;
  endsAt: string;
}) {
  const formattedDate = new Date(params.endsAt).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  await send({
    to: params.to,
    subject: `Your ${params.planName} plan expires in ${params.daysLeft} days`,
    html: emailWrapper(`
      <h2>Subscription Expiring Soon</h2>
      <p>Hi ${params.name},</p>
      <p>Your <strong>${params.planName} plan</strong>
         expires on <strong>${formattedDate}</strong>
         (${params.daysLeft} days from now).</p>
      <div class="alert-box">
        Renew now to avoid losing your listings visibility
        and CRM access.
      </div>
      <a class="cta" href="${SITE}/dashboard/subscription">
        Renew Now →
      </a>
    `),
  });
}

export async function emailWelcome(params: { to: string; name: string; role: "agent" | "buyer" | "developer" }) {
  const roleContent = {
    agent: `
      <p>Start by:</p>
      <ul style="color:#000;font-size:14px;line-height:2;">
        <li>Completing your agent profile</li>
        <li>Adding your first listing</li>
        <li>Uploading your CNIC for verification</li>
      </ul>
      <a class="cta" href="${SITE}/dashboard">
        Go to Dashboard →
      </a>`,
    buyer: `
      <p>Start browsing verified properties in
         Lahore, Karachi and Islamabad.</p>
      <a class="cta" href="${SITE}/buy/lahore/">
        Browse Properties →
      </a>`,
    developer: `
      <p>List your projects and reach thousands
         of interested buyers across Pakistan.</p>
      <a class="cta" href="${SITE}/dashboard">
        Go to Dashboard →
      </a>`,
  };
  await send({
    to: params.to,
    subject: `Welcome to ZProperty.pk!`,
    html: emailWrapper(`
      <h2>Welcome, ${params.name}!</h2>
      <p>Your ZProperty.pk account is ready.</p>
      ${roleContent[params.role]}
      <hr class="divider" />
      <p class="muted">Questions? Email us at
         support@zproperty.pk or WhatsApp us.</p>
    `),
  });
}

const SUPPORT_EMAIL = "support@zproperty.pk";

export async function emailContactForm(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  await send({
    to: SUPPORT_EMAIL,
    subject: `[Contact Form] ${params.subject} — ${params.name}`,
    html: emailWrapper(`
      <h2>New Contact Form Submission</h2>
      <div class="alert-box">
        <p style="margin:0 0 4px;"><strong>From:</strong> ${params.name}</p>
        <p style="margin:0 0 4px;"><strong>Email:</strong> ${params.email}</p>
        <p style="margin:0;"><strong>Subject:</strong> ${params.subject}</p>
      </div>
      <p style="white-space:pre-line;">${params.message}</p>
    `),
  });
}

// Export a single object for easy import
export const email = {
  listingApproved: emailListingApproved,
  listingRejected: emailListingRejected,
  newLead: emailNewLead,
  cnicVerified: emailCNICVerified,
  paymentConfirmed: emailPaymentConfirmed,
  subscriptionExpiring: emailSubscriptionExpiring,
  welcome: emailWelcome,
  contactForm: emailContactForm,
};
