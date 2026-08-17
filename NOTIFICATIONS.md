# Notifications

ZProperty has three notification channels. All are best-effort — a failure
in any of them is logged, never thrown, and never blocks the user action it's
attached to.

1. **Email (Resend)** — `lib/notifications/email.ts`, exported as `email.*`
   (e.g. `email.listingApproved(...)`, `email.newLead(...)`). No-ops with a
   console log if `RESEND_API_KEY` is not set.
2. **WhatsApp (Meta Cloud API)** — `lib/notifications/whatsapp.ts`, exported
   as `wa.*` (e.g. `wa.listingApproved(...)`). No-ops with a console log if
   `WA_PHONE_ID` / `WA_ACCESS_TOKEN` are not set. Templates must be
   registered and approved in Meta Business Manager before they'll actually
   send in production: `new_lead`, `listing_approved`, `listing_rejected`,
   `payment_confirmed`, `subscription_expiring`, `cnic_verified`.
3. **In-app (DB polling)** — `lib/notifications/inapp.ts`, exported as
   `notify.*`. Written to the `notifications` table and polled by
   `components/shared/NotificationBell.tsx` every 60s.

All three are typically fired together from the same action (e.g. listing
approval fires `notify.listingApproved`, `email.listingApproved`, and
`wa.listingApproved`). See `app/admin/listings/actions.ts`,
`app/admin/users/actions.ts`, `lib/payments/subscriptions.ts`,
`app/api/listings/[id]/lead/route.ts`, `app/(auth)/actions.ts`, and
`app/api/cron/check-subscriptions/route.ts` for the wiring.

A dev-only test route exists at `/api/test/email?template=welcome&to=you@example.com`
(404s in production) for manually checking email templates render and send.
