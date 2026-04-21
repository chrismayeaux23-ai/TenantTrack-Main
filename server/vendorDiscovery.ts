import type { TradeCategory } from "@shared/schema";

const PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

const TRADE_QUERY_TERMS: Record<string, string> = {
  Plumbing: "plumber",
  Electrical: "electrician",
  HVAC: "hvac contractor",
  Appliance: "appliance repair",
  Painting: "painting contractor",
  Carpentry: "carpenter",
  Landscaping: "landscaping company",
  Cleaning: "cleaning service",
  "Pest Control": "pest control",
  Roofing: "roofing contractor",
  Flooring: "flooring contractor",
  "General Handyman": "handyman",
  Other: "contractor",
};

export interface DiscoveredVendor {
  externalSourceId: string;
  name: string;
  companyName: string | null;
  tradeCategory: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  serviceArea: string | null;
  externalRating: number | null;
  externalReviewCount: number | null;
  externalSourceUrl: string | null;
  seedTrustScore: number;
  address: string | null;
  website: string | null;
}

/**
 * Bayesian-adjusted trust score on 0–100 scale.
 *
 * Pulls vendors with very few public reviews toward the global mean so a
 * single 5-star review doesn't outrank a vendor with 80 reviews averaging 4.7.
 *
 *   score = ((rating * count) + (priorMean * priorWeight)) / (count + priorWeight)
 *   trust = round(((score - 1) / 4) * 100)
 */
export function computeSeedTrustScore(rating: number | null | undefined, count: number | null | undefined): number {
  const r = typeof rating === "number" && rating > 0 ? rating : 0;
  const c = typeof count === "number" && count > 0 ? count : 0;
  if (r === 0 || c === 0) return 50; // neutral default for unrated vendors

  const PRIOR_MEAN = 3.8;   // global mean rating prior
  const PRIOR_WEIGHT = 12;  // ~12 phantom average reviews

  const adjusted = (r * c + PRIOR_MEAN * PRIOR_WEIGHT) / (c + PRIOR_WEIGHT);
  const normalized = Math.max(0, Math.min(100, Math.round(((adjusted - 1) / 4) * 100)));
  return normalized;
}

interface PlaceResult {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  googleMapsUri?: string;
  addressComponents?: Array<{ types?: string[]; longText?: string; shortText?: string }>;
}

function extractCity(place: PlaceResult): string | null {
  const components = place.addressComponents || [];
  const locality = components.find(c => c.types?.includes("locality"));
  if (locality?.longText) return locality.longText;
  const sub = components.find(c => c.types?.includes("postal_town") || c.types?.includes("administrative_area_level_2"));
  return sub?.longText || null;
}

export async function discoverVendorsFromPlaces(params: {
  tradeCategory: string;
  location: string;
}): Promise<DiscoveredVendor[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is not configured. Add it in your project secrets to enable vendor discovery.");
  }

  const term = TRADE_QUERY_TERMS[params.tradeCategory] || params.tradeCategory.toLowerCase();
  const textQuery = `${term} in ${params.location}`;

  const res = await fetch(PLACES_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.shortFormattedAddress",
        "places.internationalPhoneNumber",
        "places.nationalPhoneNumber",
        "places.rating",
        "places.userRatingCount",
        "places.websiteUri",
        "places.googleMapsUri",
        "places.addressComponents",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery,
      maxResultCount: 20,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    let errMessage = `Google Places API error (${res.status})`;
    try {
      const parsed = JSON.parse(body);
      if (parsed?.error?.message) errMessage = parsed.error.message;
    } catch { /* ignore */ }
    throw new Error(errMessage);
  }

  const data = await res.json() as { places?: PlaceResult[] };
  const places = data.places || [];

  return places.map((p): DiscoveredVendor => {
    const name = p.displayName?.text || "Unknown business";
    const phone = p.nationalPhoneNumber || p.internationalPhoneNumber || null;
    const rating = typeof p.rating === "number" ? p.rating : null;
    const reviewCount = typeof p.userRatingCount === "number" ? p.userRatingCount : null;
    return {
      externalSourceId: p.id || `${name}|${phone || ""}`,
      name,
      companyName: name,
      tradeCategory: params.tradeCategory,
      phone,
      email: null,
      city: extractCity(p),
      serviceArea: extractCity(p),
      externalRating: rating !== null ? Math.round(rating * 10) : null, // store as int (e.g. 47 = 4.7)
      externalReviewCount: reviewCount,
      externalSourceUrl: p.googleMapsUri || p.websiteUri || null,
      seedTrustScore: computeSeedTrustScore(rating, reviewCount),
      address: p.formattedAddress || p.shortFormattedAddress || null,
      website: p.websiteUri || null,
    };
  });
}

export function normalizeVendorKey(name: string, phone: string | null | undefined): string {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedPhone = (phone || "").replace(/\D/g, "");
  return `${normalizedName}|${normalizedPhone}`;
}
