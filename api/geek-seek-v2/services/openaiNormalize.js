import { OPENAI_MODEL } from "../config.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const REQUIRED_KEYS = [
  "id",
  "name",
  "isOpenNow",
  "address",
  "userRatingCount",
  "type",
  "priceRange",
  "phoneNumber",
  "googleMapsUri",
  "websiteUri",
  "isReservable",
  "servesVegetarianFood",
  "hasDineIn",
  "hasTakeout",
  "hasDelivery",
  "rating",
  "acceptsCards",
  "acceptsCash",
  "hasOutdoorSeating",
  "directionsUrl",
  "reviewsUrl",
  "hasFreeParking",
  "hasWheelchairAccessibleParking",
  "hasWheelchairAccessibleRestroom",
];

const buildSchemaDescription = () => `Place {
  id: string,
  name: string,
  isOpenNow: boolean | null,
  address: string | null,
  userRatingCount: number | null,
  type: string | null,
  priceRange: number | null,
  phoneNumber: string | null,
  googleMapsUri: string | null,
  websiteUri: string | null,
  isReservable: boolean | null,
  servesVegetarianFood: boolean | null,
  hasDineIn: boolean | null,
  hasTakeout: boolean | null,
  hasDelivery: boolean | null,
  rating: number | null,
  acceptsCards: boolean | null,
  acceptsCash: boolean | null,
  hasOutdoorSeating: boolean | null,
  directionsUrl: string | null,
  reviewsUrl: string | null,
  hasFreeParking: boolean | null,
  hasWheelchairAccessibleParking: boolean | null,
  hasWheelchairAccessibleRestroom: boolean | null,
  distanceMeters: number | null,
  openingHours?: { periods: Array<{ day: string, open: string, close: string }>, currentStatusText?: string | null } | null,
  categories?: string[] | null,
  cuisines?: string[] | null,
  source: { provider: string, url: string | null, confidence: number | null }
}`;

const stringify = (value) => JSON.stringify(value, (_, v) => (typeof v === "bigint" ? Number(v) : v));

const buildPrompt = ({ userIntent, origin, places, details, limit }) => {
  const body = {
    user_intent: userIntent,
    user_origin: origin,
    constraint: { limit },
    places_search: places,
    places_details: details,
  };

  return [
    "You are a data normalizer. Return ONLY strict JSON matching the provided schema.",
    buildSchemaDescription(),
    "Input payload:",
    stringify(body),
    "Rules:",
    "- Do NOT invent records or fields; only use provided inputs.",
    "- Output { \"results\": Place[] } with exactly the keys listed.",
    "- If unknown -> null. Arrays may be [].",
    "- Distances: compute from user_origin and each place’s geometry; include as distanceMeters (rounded).",
    "- Sorting: distance asc; if equal, open now first; then rating desc.",
    "- Prefer googleMapsUri from details; otherwise build Maps URL using place_id.",
    "- priceRange: map Google price_level (0–4) to 0–3 by min(price_level, 3).",
    "- openingHours.periods format: [{ \"day\":\"mon|tue|...\", \"open\":\"HH:MM\", \"close\":\"HH:MM\" }].",
    "- payments/amenities: set only if explicitly present; else null.",
    "- Provide source {provider: 'google-places', url: googleMapsUri, confidence: number between 0 and 1}.",
    "Return only JSON with key `results`.",
  ].join("\n");
};

export async function normalizePlacesWithOpenAI({ apiKey, userIntent, origin, places, details, limit }) {
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  const prompt = buildPrompt({ userIntent, origin, places, details, limit });
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`OpenAI request failed with status ${response.status}`);
    error.status = response.status;
    error.body = text;
    throw error;
  }
  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI response missing content");
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    const err = new Error("Failed to parse OpenAI JSON response");
    err.cause = error;
    throw err;
  }
  const results = Array.isArray(parsed?.results) ? parsed.results : [];
  const sanitized = results.map((item) => sanitizePlace(item));
  return sanitized;
}

const sanitizePlace = (place) => {
  const normalized = { ...place };
  for (const key of REQUIRED_KEYS) {
    if (!(key in normalized)) normalized[key] = null;
  }
  if (!normalized?.source || typeof normalized.source !== "object") {
    normalized.source = { provider: "google-places", url: normalized.googleMapsUri ?? null, confidence: null };
  } else {
    normalized.source = {
      provider: normalized.source.provider ?? "google-places",
      url: normalized.source.url ?? normalized.googleMapsUri ?? null,
      confidence: typeof normalized.source.confidence === "number" ? normalized.source.confidence : null,
    };
  }
  return normalized;
};