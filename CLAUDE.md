@AGENTS.md

# Real Estate Content Ops — Status

## Data model in use
- `projects` = individual developments (new-build towers, mixed-use, plot schemes), each with a `developer_id` (a real Supabase Auth account) and `payment_plans` rows, sourced from the developer's own site/PDF where reachable rather than a broker's summary page.
- `societies` = master-planned housing schemes (DHA, Bahria Town, Al-Kabir Town, Etihad Town, etc.), each with a public profile at `/area-guide/[city]/[society]`. `projects.society_id` links a project to its society when it genuinely sits inside one — an address on an organic city neighborhood (Gulberg III, Garden Town, Johar Town, Defence Road, Bedian Road...) is correctly left `society_id: null`, that's not a gap.
- Cross-linking (added this session): the area-guide page now shows "New Projects in [Society]" (queries `projects` by `society_id`, `app/(public)/area-guide/[city]/[society]/page.tsx`); the project detail page now shows "Part of [Society] →" linking back (`app/(public)/new-projects/[slug]/page.tsx`). Before this, `projects.society_id` was populated but never rendered anywhere.

## Known gaps (not yet done)
1. **No admin UI for societies.** `/admin/projects/new` exists; `/admin/societies/new` doesn't. Societies are currently only created via direct SQL.
2. **`areas` table has no rows for Islamabad, Karachi, or Multan** — only Lahore has area coverage. New non-Lahore societies (University Town, Faisal Hills, Multi Gardens B-17, Park View City, Inter City Housing Scheme) were created with `area_id: null` as a result.
3. **No entity-level schema for societies.** The area-guide page only emits `FAQPage` JSON-LD (from pros/cons), unlike listings/projects/agents which each have a proper schema block in `lib/seo/schemas.tsx`.
4. **A few project addresses are ambiguous and were deliberately left unlinked** rather than guessed: "Skyline Boulevard" (Sector E, Lahore — possibly a Bahria Town sector), "Hassan Villas" (Jubilee Town Housing Scheme — may warrant its own society row later if more projects land there).
5. **Listing (`/listing/[slug]`) inventory is thin.** The page itself is solid (RealEstateListing schema, similar-listings, internal-linking block) — the gap is real owner/agent listings, not code; this session only added developer projects.

## Conventions established this session
- Never attribute a project to a marketing/broker site (AIWA, Titanium Agency, Sky Marketing, etc.) as its developer — find the real builder and cross-check via the developer's own site or 2+ independent sources before writing `developer_id`.
- Reuse an existing developer account if the project belongs to a company already in the DB. Don't create duplicate accounts for spelling variants of the same company (e.g. "RealTek Developers" / "Realtek Properties" / "RealTech Properties" is one developer, not three).
- New developer accounts: real Supabase Auth users (`crypt()`/pgcrypto bcrypt, pre-confirmed email), `{slug}@zproperty.pk` placeholder email, sequential `+9230000001xx` placeholder phone (check `SELECT phone FROM users WHERE phone LIKE '+92300000%' ORDER BY phone` for the next free one), random 12-char password. Credentials are shown once in chat only — not recoverable after — so the user needs to save them immediately.
- Never fabricate pricing, unit sizes, or dates that aren't published anywhere. Leave the field null and say so in the description, rather than estimate.
