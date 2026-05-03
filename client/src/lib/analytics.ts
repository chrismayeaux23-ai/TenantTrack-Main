import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || "https://us.i.posthog.com";
const ENABLE_DEV = import.meta.env.VITE_POSTHOG_ENABLE_DEV === "true";
const IS_PROD = import.meta.env.PROD === true;

let initialized = false;

function isEnabled(): boolean {
  return initialized && !!POSTHOG_KEY;
}

export function initAnalytics() {
  if (initialized) return;
  if (!POSTHOG_KEY) return;
  if (typeof window === "undefined") return;
  if (!IS_PROD && !ENABLE_DEV) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: false,
    disable_session_recording: true,
    // Defense-in-depth: strip query strings + auth-ish fragments from any URL
    // PostHog auto-attaches ($current_url, $referrer, $pathname, etc.) so a
    // stray `?email=...` or `?token=...` never lands in the warehouse.
    sanitize_properties: (props) => {
      const stripQuery = (u: unknown) => {
        if (typeof u !== "string") return u;
        try {
          const url = new URL(u, window.location.origin);
          url.search = "";
          url.hash = "";
          return url.toString();
        } catch {
          const i = u.indexOf("?");
          return i >= 0 ? u.slice(0, i) : u;
        }
      };
      const out: Record<string, unknown> = { ...props };
      for (const k of ["$current_url", "$referrer", "$initial_current_url", "$initial_referrer"]) {
        if (out[k] != null) out[k] = stripQuery(out[k]);
      }
      if (typeof out["$pathname"] === "string") {
        out["$pathname"] = stripQuery(out["$pathname"]);
      }
      return out;
    },
  });
  initialized = true;
}

/**
 * Hash a string with SHA-256 and return a hex digest.
 * Used to obscure the raw user UUID before sending to PostHog so we never
 * transmit a value that could be used to look someone up in our DB.
 */
async function sha256Hex(input: string): Promise<string | null> {
  if (typeof crypto === "undefined" || !crypto.subtle) return null;
  try {
    const buf = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

export async function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (!isEnabled()) return;
  const hashed = await sha256Hex(userId);
  // Fail closed: if hashing isn't available, skip identify entirely rather
  // than send the raw DB id. Events stay anonymous in this case.
  if (!hashed) return;
  try {
    posthog.identify(hashed, traits);
  } catch {}
}

export function resetAnalytics() {
  if (!isEnabled()) return;
  try {
    posthog.reset();
  } catch {}
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  if (!isEnabled()) return;
  try {
    posthog.capture(name, props);
  } catch {}
}

export function trackPageview(path?: string) {
  if (!isEnabled()) return;
  try {
    // Always strip query strings — they may carry email/token/etc.
    const clean = path ? path.split("?")[0].split("#")[0] : undefined;
    posthog.capture("$pageview", clean ? { $pathname: clean } : undefined);
  } catch {}
}

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
const STORAGE_KEY = "tt_utms";

export function captureUtmsFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const found: Record<string, string> = {};
  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) found[k] = v;
  }
  if (Object.keys(found).length === 0) return;
  try {
    const existingRaw = sessionStorage.getItem(STORAGE_KEY);
    if (existingRaw) {
      // Preserve first-touch UTMs — never overwrite once set.
      return;
    }
    const payload = {
      ...found,
      utm_first_seen_at: new Date().toISOString(),
      utm_landing_path: window.location.pathname,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}

export function getStoredUtms(): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Returns only the canonical UTM keys (no internal metadata). */
export function getCanonicalUtms(): Record<string, string> {
  const stored = getStoredUtms();
  if (!stored) return {};
  const out: Record<string, string> = {};
  for (const k of UTM_KEYS) {
    if (stored[k]) out[k] = stored[k];
  }
  return out;
}
