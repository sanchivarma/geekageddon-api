import { fetchPlacesWithDetails } from "./googlePlaces.js";
import { mergeGooglePlace, sortPlaces } from "./normalizer.js";
import { normalizePlacesWithOpenAI } from "./openaiNormalize.js";

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

export async function fetchNormalizedPlaces({
  googleApiKey,
  openAIApiKey,
  userIntent,
  origin,
  query,
  includedTypes,
  radiusMeters,
  languageCode,
  regionCode,
  limit,
}) {
  const { places, details } = await fetchPlacesWithDetails({
    apiKey: googleApiKey,
    query,
    location: origin,
    radiusMeters,
    languageCode,
    regionCode,
    includedTypes,
    maxResultCount: Math.min(Math.max(limit * 2, limit), 20),
  });

  const merged = places.map((place) =>
    mergeGooglePlace({
      place,
      detail: details.get(place.id) ?? {},
      origin,
    })
  );
  const deduped = dedupeById(merged);
  const sorted = sortPlaces(deduped).slice(0, limit);

  if (!sorted.length) {
    return { results: [], source: { usedLLM: false, fallback: true } };
  }

  if (!openAIApiKey) {
    return { results: sorted.map(fillRequiredKeys), source: { usedLLM: false, fallback: true } };
  }

  try {
    const normalized = await normalizePlacesWithOpenAI({
      apiKey: openAIApiKey,
      userIntent,
      origin,
      places: trimmedPlacesPayload(places, limit * 2),
      details: Object.fromEntries([...details.entries()].map(([id, detail]) => [id, detail])),
      limit,
    });
    const validated = validateNormalized(normalized).slice(0, limit);
    return { results: validated, source: { usedLLM: true, fallback: false } };
  } catch (error) {
    console.error("[geek-seek-v2] OpenAI normalization failed", error);
    return { results: sorted.map(fillRequiredKeys), source: { usedLLM: false, fallback: true, error: error.message } };
  }
}

const dedupeById = (items = []) => {
  const seen = new Map();
  for (const item of items) {
    if (!item?.id) continue;
    if (!seen.has(item.id)) seen.set(item.id, item);
  }
  return Array.from(seen.values());
};

const fillRequiredKeys = (place) => {
  const clone = { ...place };
  for (const key of REQUIRED_KEYS) {
    if (!(key in clone)) clone[key] = null;
  }
  if (!clone.source) clone.source = { provider: "google-places", url: clone.googleMapsUri ?? null, confidence: null };
  return clone;
};

const validateNormalized = (places = []) => places.map(fillRequiredKeys);

const trimmedPlacesPayload = (places, max = 20) =>
  places.slice(0, max).map((place) => {
    const {
      id,
      displayName,
      formattedAddress,
      shortFormattedAddress,
      location,
      rating,
      userRatingCount,
      priceLevel,
      googleMapsUri,
      types,
      currentOpeningHours,
    } = place;
    return {
      id,
      displayName,
      formattedAddress,
      shortFormattedAddress,
      location,
      rating,
      userRatingCount,
      priceLevel,
      googleMapsUri,
      types,
      currentOpeningHours,
    };
  });