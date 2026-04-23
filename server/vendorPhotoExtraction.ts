import OpenAI from "openai";
import { z } from "zod";
import { TRADE_CATEGORIES } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface ExtractedVendor {
  name: string;
  companyName: string;
  tradeCategory: string;
  phone: string;
  email: string;
  city: string;
  serviceArea: string;
  notes: string;
  preferredVendor: boolean;
  emergencyAvailable: boolean;
  licenseInfo: string;
  insuranceInfo: string;
}

const responseSchema = z.object({
  vendors: z.array(
    z.object({
      name: z.string().default(""),
      companyName: z.string().nullable().optional().default(""),
      tradeCategory: z.string().nullable().optional().default(""),
      phone: z.string().nullable().optional().default(""),
      email: z.string().nullable().optional().default(""),
      notes: z.string().nullable().optional().default(""),
    })
  ),
});

const SYSTEM_PROMPT = `You are an OCR + structured-extraction assistant. The user uploads a photo of a paper phonebook, address book, Rolodex, or hand-written contact list — typically belonging to a small landlord who tracks maintenance vendors (plumbers, electricians, HVAC techs, handymen, painters, roofers, pest control, landscapers, appliance repair, etc).

Read every contact entry visible in the image (printed OR handwritten, English or Spanish), then return them as a strict JSON object with this exact shape:

{
  "vendors": [
    {
      "name": "Person or business name (best guess if unclear)",
      "companyName": "Company name if separate from person name, else empty",
      "tradeCategory": "ONE of: ${TRADE_CATEGORIES.join(", ")}",
      "phone": "Phone number in any common format, digits/dashes/parens/spaces ok",
      "email": "Email if present, else empty",
      "notes": "Anything else useful (address, hours, partner name, 'good guy', etc)"
    }
  ]
}

Rules:
- Pick the SINGLE best matching trade category from the allowed list. If you truly cannot guess, use "Other".
- If a contact is clearly NOT a maintenance vendor (e.g. "Mom", "Dr. Patel - dentist", "Pizza Hut"), skip it.
- Combine multi-line entries into one vendor.
- Preserve original capitalization for names and companies; do not invent details.
- If the image is unreadable or contains no vendors, return {"vendors": []}.
- Return ONLY the JSON object, no prose.`;

function normalizeTrade(raw: string): string {
  const cleaned = (raw || "").trim();
  if (!cleaned) return "General Handyman";
  const exact = TRADE_CATEGORIES.find((t) => t.toLowerCase() === cleaned.toLowerCase());
  if (exact) return exact;
  const lc = cleaned.toLowerCase();
  // Loose keyword matching
  const map: Record<string, string> = {
    plumb: "Plumbing",
    electric: "Electrical",
    elec: "Electrical",
    hvac: "HVAC",
    "a/c": "HVAC",
    ac: "HVAC",
    heat: "HVAC",
    furnace: "HVAC",
    paint: "Painting",
    carpent: "Carpentry",
    wood: "Carpentry",
    landscap: "Landscaping",
    yard: "Landscaping",
    lawn: "Landscaping",
    gardener: "Landscaping",
    clean: "Cleaning",
    janitor: "Cleaning",
    pest: "Pest Control",
    bug: "Pest Control",
    extermin: "Pest Control",
    roof: "Roofing",
    floor: "Flooring",
    carpet: "Flooring",
    tile: "Flooring",
    appliance: "Appliance",
    fridge: "Appliance",
    washer: "Appliance",
    handy: "General Handyman",
    repair: "General Handyman",
    fix: "General Handyman",
  };
  for (const [k, v] of Object.entries(map)) {
    if (lc.includes(k)) return v;
  }
  return "Other";
}

function normalizePhone(raw: string): string {
  const trimmed = (raw || "").trim();
  return trimmed;
}

export async function extractVendorsFromImage(
  imageBase64: string,
  mimeType: string
): Promise<ExtractedVendor[]> {
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract every maintenance vendor contact from this phonebook page." },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return [];
  }

  const result = responseSchema.safeParse(parsedJson);
  if (!result.success) return [];

  return result.data.vendors
    .map((v) => ({
      name: (v.name || "").trim(),
      companyName: (v.companyName || "").trim(),
      tradeCategory: normalizeTrade(v.tradeCategory || ""),
      phone: normalizePhone(v.phone || ""),
      email: (v.email || "").trim(),
      city: "",
      serviceArea: "",
      notes: (v.notes || "").trim(),
      preferredVendor: false,
      emergencyAvailable: false,
      licenseInfo: "",
      insuranceInfo: "",
    }))
    .filter((v) => v.name.length > 0);
}

export async function extractVendorsFromImages(
  images: { base64: string; mimeType: string }[]
): Promise<ExtractedVendor[]> {
  const cap = Math.min(images.length, 5);
  const slice = images.slice(0, cap);
  const settled = await Promise.allSettled(
    slice.map((img) => extractVendorsFromImage(img.base64, img.mimeType))
  );
  const all: ExtractedVendor[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled") all.push(...s.value);
  }
  // Dedup within batch by lowercase name + trade
  const seen = new Set<string>();
  const deduped: ExtractedVendor[] = [];
  for (const v of all) {
    const key = `${v.name.toLowerCase()}|${v.tradeCategory.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(v);
  }
  return deduped;
}
