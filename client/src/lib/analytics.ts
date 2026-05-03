import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || "https://us.i.posthog.com";

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  if (!POSTHOG_KEY) return;
  if (typeof window === "undefined") return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    disable_session_recording: true,
  });
  initialized = true;
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (!initialized || !POSTHOG_KEY) return;
  try {
    posthog.identify(userId, traits);
  } catch {}
}

export function resetAnalytics() {
  if (!initialized || !POSTHOG_KEY) return;
  try {
    posthog.reset();
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
