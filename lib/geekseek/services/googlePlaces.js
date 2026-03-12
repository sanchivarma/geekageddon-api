import { fetchJson } from "../utils/http.js";

const BASE_URL = "https://places.googleapis.com/v1";
const SEARCH_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.types",
];

const DETAIL_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "shortFormattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "priceLevel",
  "googleMapsUri",
  "internationalPhoneNumber",
  "formattedPhoneNumber",
  "websiteUri",
  "currentOpeningHours",
  "regularOpeningHours",
  "accessibilityOptions",
  "takeout",
  "delivery",
  "dineIn",
  "reservable",
  "servesCoffee",
  "servesVegetarianFood",
  "paymentOptions",
  "parkingOptions",
  "types",
];

const normalizeApiKey = (apiKey) => String(apiKey ?? "").trim();

const buildHeaders = (apiKey, fieldMask) => ({
  "Content-Type": "application/json",
  "X-Goog-Api-Key": normalizeApiKey(apiKey),
  "X-Goog-FieldMask": fieldMask,
});

const normalizeRegionCode = (value) => {
  if (!value) return undefined;
  const normalized = String(value).trim();
  return normalized ? normalized.toLowerCase() : undefined;
};

const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

const toSearchBody = ({
  query,
  location,
  radiusMeters,
  languageCode,
  regionCode,
  includedTypes,
  maxResultCount,
  preferNearby,
}) => {
  const maxResults = Math.min(Math.max(maxResultCount ?? 20, 1), 20);
  const hasLocation =
    isFiniteNumber(location?.latitude) &&
    isFiniteNumber(location?.longitude) &&
    isFiniteNumber(radiusMeters) &&
    radiusMeters > 0;

  const circle = hasLocation
    ? {
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        radius: radiusMeters,
      }
    : null;

  const canNearby = preferNearby && circle && Array.isArray(includedTypes) && includedTypes.length > 0;
  if (canNearby) {
    return {
      method: "POST",
      endpoint: `${BASE_URL}/places:searchNearby`,
      body: {
        languageCode,
        regionCode: normalizeRegionCode(regionCode),
        includedTypes,
        maxResultCount: maxResults,
        locationRestriction: { circle },
        rankPreference: "POPULARITY",
      },
    };
  }

  if (query) {
    return {
      method: "POST",
      endpoint: `${BASE_URL}/places:searchText`,
      body: {
        textQuery: query,
        languageCode,
        regionCode: normalizeRegionCode(regionCode),
        maxResultCount: maxResults,
        ...(circle ? { locationBias: { circle } } : {}),
      },
    };
  }

  return {
    method: "POST",
    endpoint: `${BASE_URL}/places:searchNearby`,
    body: {
      languageCode,
      regionCode: normalizeRegionCode(regionCode),
      includedTypes,
      maxResultCount: maxResults,
      ...(circle ? { locationRestriction: { circle } } : {}),
    },
  };
};

const sanitizeBody = (body) =>
  JSON.stringify(Object.fromEntries(Object.entries(body).filter(([_, value]) => value != null)));

export async function searchPlaces({
  apiKey,
  query,
  location,
  radiusMeters,
  languageCode = "en",
  regionCode,
  includedTypes = [],
  maxResultCount = 20,
  preferNearby = false,
}) {
  if (!normalizeApiKey(apiKey)) throw new Error("Missing GOOGLE_PLACES_API_KEY");
  if (!query && (!location?.latitude || !location?.longitude)) {
    throw new Error("location.latitude and location.longitude are required for nearby searches");
  }
  const { endpoint, method, body } = toSearchBody({
    query,
    location,
    radiusMeters,
    languageCode,
    regionCode,
    includedTypes,
    maxResultCount,
    preferNearby,
  });
  const primaryHeaders = buildHeaders(apiKey, SEARCH_FIELDS.join(","));
  try {
    const { data } = await fetchJson(endpoint, {
      method,
      headers: primaryHeaders,
      body: sanitizeBody(body),
    });
    return Array.isArray(data?.places) ? data.places : [];
  } catch (error) {
    const canFallback =
      error?.status === 400 &&
      endpoint.endsWith("/places:searchText") &&
      typeof body?.textQuery === "string" &&
      body.textQuery.trim().length > 0;

    if (!canFallback) {
      throw error;
    }

    const fallbackBody = {
      textQuery: body.textQuery,
      languageCode,
      maxResultCount: Math.min(Math.max(maxResultCount ?? 20, 1), 20),
    };
    const fallbackHeaders = buildHeaders(
      apiKey,
      ["places.id", "places.displayName", "places.formattedAddress", "places.location"].join(",")
    );
    const { data } = await fetchJson(endpoint, {
      method: "POST",
      headers: fallbackHeaders,
      body: sanitizeBody(fallbackBody),
    });
    return Array.isArray(data?.places) ? data.places : [];
  }
}

export async function fetchPlaceDetails({ apiKey, placeId }) {
  if (!normalizeApiKey(apiKey)) throw new Error("Missing GOOGLE_PLACES_API_KEY");
  if (!placeId) throw new Error("placeId is required");
  const url = `${BASE_URL}/places/${placeId}`;
  const headers = buildHeaders(apiKey, DETAIL_FIELDS.join(","));
  const { data } = await fetchJson(url, { method: "GET", headers });
  return data;
}

export async function fetchPlacesWithDetails(options = {}) {
  const places = await searchPlaces(options);
  if (!places.length) return { places: [], details: new Map() };
  const apiKey = options.apiKey;
  const detailResults = await Promise.allSettled(
    places.map((place) =>
      fetchPlaceDetails({ apiKey, placeId: place.id }).then((detail) => ({ placeId: place.id, detail }))
    )
  );
  const detailsMap = new Map();
  for (const result of detailResults) {
    if (result.status === "fulfilled" && result.value?.placeId) {
      detailsMap.set(result.value.placeId, result.value.detail);
    }
  }
  return { places, details: detailsMap };
}
