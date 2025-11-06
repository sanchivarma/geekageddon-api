import { fetchJson } from "../utils/http.js";

const BASE_URL = "https://places.googleapis.com/v1";
const SEARCH_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.currentOpeningHours",
  "places.priceLevel",
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

const buildHeaders = (apiKey, fieldMask) => ({
  "Content-Type": "application/json",
  "X-Goog-Api-Key": apiKey,
  "X-Goog-FieldMask": fieldMask,
});

const toSearchBody = ({ query, location, radiusMeters, languageCode, regionCode, includedTypes, maxResultCount }) => {
  const circle = {
    center: {
      latitude: location.latitude,
      longitude: location.longitude,
    },
    radius: radiusMeters,
  };
  const base = {
    languageCode,
    maxResultCount: Math.min(Math.max(maxResultCount ?? 20, 1), 20),
  };
  if (regionCode) base.regionCode = regionCode;
  if (includedTypes?.length) base.includedTypes = includedTypes;
  if (query) {
    return {
      method: "POST",
      endpoint: `${BASE_URL}/places:searchText`,
      body: {
        textQuery: query,
        languageCode,
        locationBias: { circle },
      },
    };
  }
  return {
    method: "POST",
    endpoint: `${BASE_URL}/places:searchNearby`,
    body: {
      languageCode,
      regionCode,
      includedTypes,
      locationRestriction: { circle },
      maxResultCount: Math.min(Math.max(maxResultCount ?? 20, 1), 20),
    },
  };
};

const sanitizeBody = (body) => JSON.stringify(
  Object.fromEntries(Object.entries(body).filter(([_, value]) => value != null))
);

export async function searchPlaces({
  apiKey,
  query,
  location,
  radiusMeters,
  languageCode = "en",
  regionCode,
  includedTypes = [],
  maxResultCount = 20,
}) {
  if (!apiKey) throw new Error("Missing GOOGLE_PLACES_API_KEY");
  if (!location?.latitude || !location?.longitude) throw new Error("location.latitude and location.longitude are required");
  const { endpoint, method, body } = toSearchBody({ query, location, radiusMeters, languageCode, regionCode, includedTypes, maxResultCount });
  const headers = buildHeaders(apiKey, SEARCH_FIELDS.join(","));
  console.log("[geek-seek-v2] places.search request", {
    endpoint,
    method,
    languageCode,
    includedTypes,
    radiusMeters,
  });
  const { data } = await fetchJson(endpoint, {
    method,
    headers,
    body: sanitizeBody(body),
  });
  const count = Array.isArray(data?.places) ? data.places.length : 0;
  console.log("[geek-seek-v2] places.search response", { count });
  return Array.isArray(data?.places) ? data.places : [];
}

export async function fetchPlaceDetails({ apiKey, placeId }) {
  if (!apiKey) throw new Error("Missing GOOGLE_PLACES_API_KEY");
  if (!placeId) throw new Error("placeId is required");
  const url = `${BASE_URL}/places/${placeId}`;
  const headers = buildHeaders(apiKey, DETAIL_FIELDS.join(","));
  console.log("[geek-seek-v2] places.details request", { placeId });
  const { data } = await fetchJson(url, { method: "GET", headers });
  console.log("[geek-seek-v2] places.details response", {
    placeId,
    hasData: !!data,
    fields: data ? Object.keys(data).length : 0,
  });
  return data;
}

export async function fetchPlacesWithDetails(options = {}) {
  const places = await searchPlaces(options);
  if (!places.length) return { places: [], details: new Map() };
  const apiKey = options.apiKey;
  const detailResults = await Promise.allSettled(
    places.map((place) =>
      fetchPlaceDetails({ apiKey, placeId: place.id })
        .then((detail) => ({ placeId: place.id, detail }))
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
