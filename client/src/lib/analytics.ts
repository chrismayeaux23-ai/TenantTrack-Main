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
  });
  initialized = true;
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (!isEnabled()) return;
  try {
    posthog.identify(userId, traits);
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
    posthog.capture("$pageview", path ? { $pathname: path } : undefined);
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
