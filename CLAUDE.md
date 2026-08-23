@AGENTS.md

# Real Estate Content Ops — Status

## Data model in use
- `projects` = individual developments (new-build towers, mixed-use, plot schemes), each with a `developer_id` (a real Supabase Auth account) and `payment_plans` rows, sourced from the developer's own site/PDF where reachable rather than a broker's summary page.
- `societies` = master-planned housing schemes (DHA, Bahria Town, Al-Kabir Town, Etihad Town, etc.), each with a public profile at `/area-guide/[city]/[society]`. `projects.society_id` links a project to its society when it genuinely sits inside one — an address on an organic city neighborhood (Gulberg III, Garden Town, Johar Town, Defence Road, Bedian Road...) is correctly left `society_id: null`, that's not a gap.
- Cross-linking (added this session): the area-guide page now shows "New Projects in [Society]" (queries `projects` by `society_id`, `app/(public)/area-guide/[city]/[society]/page.tsx`); the project detail page now shows "Part of [Society] →" linking back (`app/(public)/new-projects/[slug]/page.tsx`). Before this, `projects.society_id` was populated but never rendered anywhere.

## Closed this session
- **Admin UI for societies** now exists: `/admin/societies` (list) and `/admin/societies/new` (create form + `createSocietyAction` in `app/admin/societies/actions.ts`), mirroring the `/admin/projects` pattern. Sidebar link added in `AdminSidebar.tsx`.
- **`areas` table**: turns out Islamabad and Karachi already had ~8 areas each (an earlier multi-statement `execute_sql` call only surfaced the *last* query's result, which read as "empty" and produced a wrong note here — multi-statement Supabase calls only return the final statement's rows, don't trust an empty-looking result from one without re-checking). Only **Multan was genuinely empty** and got 3 areas (Bosan Road, Cantt, DHA Multan). Also added `B-17` for Islamabad. Linked with confidence: Multi Gardens B-17 → `B-17`, Inter City Housing Scheme → `Bosan Road`, Bahria Town Islamabad/Karachi + DHA Islamabad/Karachi societies → their matching existing areas. Left `area_id: null` on Faisal Hills, University Town, and Park View City societies rather than guess their containing area/sector.
- **Society entity schema**: `societySchema()` added to `lib/seo/schemas.tsx` (`Place` type, geo + `additionalProperty` for developer/established/plots/phases/avg price), wired into the area-guide page alongside the existing conditional `FAQPage` schema.

## Known gaps (not yet done)
1. **A few project addresses are ambiguous and were deliberately left unlinked** rather than guessed: "Skyline Boulevard" (Sector E, Lahore — possibly a Bahria Town sector), "Hassan Villas" (Jubilee Town Housing Scheme — may warrant its own society row later if more projects land there).
2. **Listing (`/listing/[slug]`) inventory is thin.** The page itself is solid (RealEstateListing schema, similar-listings, internal-linking block) — the gap is real owner/agent listings, not code. Developer *projects* are fair game to catalog from public marketing material; individual *listings* need real agent/owner-submitted inventory — do not scrape competitor portals (Zameen, Graana, etc.) to fill this in, that would be misappropriating their content.
3. **Societies admin form is intentionally minimal** — no image upload (cover image is a pasted URL, unlike projects' `ImageUploader`), no phases/blocks management UI (the `society_phases`/`society_blocks` tables from migration 013 are still agent-extensible-only, populated via the listing form's "add new" flow), no lat/lng map picker, no edit page (create-only).

## Conventions established this session
- Never attribute a project to a marketing/broker site (AIWA, Titanium Agency, Sky Marketing, etc.) as its developer — find the real builder and cross-check via the developer's own site or 2+ independent sources before writing `developer_id`.
- Reuse an existing developer account if the project belongs to a company already in the DB. Don't create duplicate accounts for spelling variants of the same company (e.g. "RealTek Developers" / "Realtek Properties" / "RealTech Properties" is one developer, not three).
- New developer accounts: real Supabase Auth users (`crypt()`/pgcrypto bcrypt, pre-confirmed email), `{slug}@zproperty.pk` placeholder email, sequential `+9230000001xx` placeholder phone (check `SELECT phone FROM users WHERE phone LIKE '+92300000%' ORDER BY phone` for the next free one), random 12-char password. Credentials are shown once in chat only — not recoverable after — so the user needs to save them immediately.
- Never fabricate pricing, unit sizes, or dates that aren't published anywhere. Leave the field null and say so in the description, rather than estimate.
