import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// r2IncrementalCache backs ISR (revalidate = 600/3600/86400 across this app)
// with the R2 bucket bound as NEXT_INC_CACHE_R2_BUCKET in wrangler.jsonc —
// without it, Workers have no persistent store between invocations and ISR
// would effectively re-render every request instead of serving cached pages.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
