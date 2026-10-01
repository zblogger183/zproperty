import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

// kvIncrementalCache backs ISR (revalidate = 600/3600/86400 across this app)
// with the KV namespace bound as NEXT_INC_CACHE_KV in wrangler.jsonc —
// without it, Workers have no persistent store between invocations and ISR
// would effectively re-render every request instead of serving cached pages.
// KV (not R2) deliberately: R2 requires a card on file even on its free
// tier, while KV's free tier needs none.
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
});
