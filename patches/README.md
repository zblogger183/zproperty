# Patches

## `@opennextjs+cloudflare+1.20.7.patch`

**What it does:** removes one unconditional line from the adapter's Turbopack
runtime patcher (`dist/cli/build/patches/plugins/turbopack.js`,
`buildExternalImportRule()`) that always adds a switch-case redirecting
`next/dist/compiled/@vercel/og/index.node.js` to its edge counterpart —
regardless of whether the app actually uses `next/og`'s `ImageResponse`.
Because the redirect target is a static string, esbuild bundles that entire
edge module into the Worker, along with its `resvg.wasm` (~1.4MB) and
`yoga.wasm` dependencies — about 734 KiB gzipped, pushing this app's Worker
over Cloudflare's Workers Free-plan 3MB gzip limit even though nothing in
this codebase ever imports `next/og`/`ImageResponse` (verified: no
`app/**/opengraph-image.*`, `icon.*`, or explicit `ImageResponse` usage
anywhere).

**Why this is safe for this app specifically:** with the case removed, that
dispatch path falls through to the generic `default: $RAW = await
import($ID)` branch, which esbuild can't resolve statically (it's a dynamic
specifier) — so if it were ever actually reached at runtime, it would throw
a clear "cannot resolve module" error rather than fail silently. It can
never be reached here, since nothing in this app's code calls into Next's
`next/og` renderer in the first place.

**Upstream issue:** this is a known, currently-open bug in
`@opennextjs/cloudflare` — https://github.com/opennextjs/opennextjs-cloudflare/issues/1376
("@vercel/og is bundled in the Node.js middleware bundle even when
unused"). It affects any app using Next.js 16's `proxy.ts` (which, since
Next 16, always runs in Node.js runtime — there is no edge-runtime opt-in —
so this isn't specific to this app's own proxy.ts code).

**When to remove this patch:** once `@opennextjs/cloudflare` ships a real
fix for issue #1376 above (ideally gating the `addCase` call on the same
kind of "is `@vercel/og` actually used" trace-file check that
`patchVercelOgLibrary` already does for the regular server-function
bundle), bump the package, delete this patch file, and confirm via
`npx wrangler deploy --dry-run` that the Worker still builds and that
removing the patch doesn't reintroduce the bundle-size regression.

**How it's applied:** via [`patch-package`](https://github.com/ds300/patch-package),
through the `postinstall` script in `package.json` — it reapplies
automatically after every `npm install` (including in CI). If this patch
ever fails to apply (e.g. after bumping `@opennextjs/cloudflare` to a new
version with different internals), `npm install` will fail loudly with a
clear error rather than silently skipping it — that's the point of using
`patch-package` instead of an ad-hoc postinstall regex script. If that
happens, re-diff against the new version's `turbopack.js` by hand (same
`addCase` line, possibly moved) and regenerate with
`npx patch-package @opennextjs/cloudflare`.
