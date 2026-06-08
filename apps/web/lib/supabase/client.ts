import { createBrowserClient } from "@supabase/ssr";

type BrowserClient = ReturnType<typeof createBrowserClient>;

let cached: BrowserClient | undefined;

/**
 * Memoized Supabase browser client. Construction is deferred to first call (in
 * the browser) so it never runs during static prerender — where the public env
 * vars may be absent — and we avoid spawning multiple GoTrue instances.
 */
export function getSupabaseBrowserClient(): BrowserClient {
  if (!cached) {
    cached = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return cached;
}
