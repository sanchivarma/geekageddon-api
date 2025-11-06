import { haversineDistanceMeters } from "../utils/geo.js";

const priceLevelToRange = (value) => {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(3, Math.round(n)));
};

const pick = (value, fallback) => (value !== undefined && value !== null ? value : fallback);

const extractPhone = (detail) => detail?.internationalPhoneNumber ?? detail?.formattedPhoneNumber ?? null;

const extractMapsUrl = (placeId, detail, fallback) => {
  const uri = detail?.googleMapsUri ?? fallback;
  if (uri) return uri;
  return placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : null;
};

const buildDirectionsUrl = (placeId, googleMapsUri) => {
  if (placeId) return `https://www.google.com/maps/dir/?api=1&destination_place_id=${encodeURIComponent(placeId)}`;
  if (googleMapsUri) return googleMapsUri;
  return null;
};

const buildReviewsUrl = (placeId, googleMapsUri) => {
  if (googleMapsUri) return googleMapsUri;
  if (placeId) return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
  return null;
};

const coalesceCategories = (detail, search) => {
  const types = Array.from(new Set([...(detail?.types ?? []), ...(search?.types ?? [])]));
  return types.length ? types : null;
};

const formatAddress = (detail, search) => detail?.formattedAddress ?? search?.formattedAddress ?? search?.shortFormattedAddress ?? null;

const extractOpeningHours = (detail) => {
  const periods = detail?.currentOpeningHours?.periods ?? detail?.regularOpeningHours?.periods;
  if (!Array.isArray(periods) || !periods.length) return null;
  const normalized = periods
    .map((period) => {
      const day = period?.open?.day ?? period?.close?.day;
      const openTime = period?.open?.time;
      const closeTime = period?.close?.time;
      if (day == null || !openTime || !closeTime) return null;
      return {
        day: dayIndexToLabel(day),
        open: openTime.slice(0, 2) + ":" + openTime.slice(2, 4),
        close: closeTime.slice(0, 2) + ":" + closeTime.slice(2, 4),
      };
    })
    .filter(Boolean);
  if (!normalized.length) return null;
  return {
    periods: normalized,
    currentStatusText: detail?.currentOpeningHours?.weekdayDescriptions?.[0] ?? null,
  };
};

const dayIndexToLabel = (idx) => {
  const labels = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]; // Google uses 0=Sun but new API uses 1=Mon?? We'll guard
  if (Number.isInteger(idx)) {
    if (idx === 0) return "sun";
    if (idx === 1) return "mon";
    if (idx === 2) return "tue";
    if (idx === 3) return "wed";
    if (idx === 4) return "thu";
    if (idx === 5) return "fri";
    if (idx === 6) return "sat";
  }
  return labels[idx % labels.length] ?? "mon";
};

const boolOrNull = (value) => (typeof value === "boolean" ? value : null);

const extractPayments = (detail) => {
  const paymentOptions = detail?.paymentOptions;
  const acceptsCards = paymentOptions?.acceptsCreditCards;
  const acceptsCash = paymentOptions?.acceptsCash;
  return {
    acceptsCards: acceptsCards == null ? null : Boolean(acceptsCards),
    acceptsCash: acceptsCash == null ? null : Boolean(acceptsCash),
  };
};

const extractParking = (detail) => {
  const parking = detail?.parkingOptions;
  return {
    hasFreeParking: parking?.freeParking == null ? null : Boolean(parking.freeParking),
    hasWheelchairAccessibleParking:
      detail?.accessibilityOptions?.wheelchairAccessibleParking == null
        ? null
        : Boolean(detail.accessibilityOptions.wheelchairAccessibleParking),
    hasWheelchairAccessibleRestroom:
      detail?.accessibilityOptions?.wheelchairAccessibleRestroom == null
        ? null
        : Boolean(detail.accessibilityOptions.wheelchairAccessibleRestroom),
  };
};

export function mergeGooglePlace({ place, detail, origin }) {
  const placeId = place?.id ?? detail?.id ?? null;
  const mapsUri = extractMapsUrl(placeId, detail, place?.googleMapsUri);
  const distanceMeters = origin && place?.location
    ? haversineDistanceMeters(origin, {
        latitude: place.location?.latitude ?? detail?.location?.latitude,
        longitude: place.location?.longitude ?? detail?.location?.longitude,
      })
    : null;
  const payments = extractPayments(detail);
  const parking = extractParking(detail);
  const openingHours = extractOpeningHours(detail);
  const rating = pick(detail?.rating, place?.rating);
  const userRatingCount = pick(detail?.userRatingCount, place?.userRatingCount);
  const priceLevel = priceLevelToRange(pick(detail?.priceLevel, place?.priceLevel));

  return {
    id: placeId,
    name: detail?.displayName?.text ?? place?.displayName?.text ?? place?.displayName ?? null,
    isOpenNow: boolOrNull(detail?.currentOpeningHours?.openNow ?? place?.currentOpeningHours?.openNow ?? null),
    address: formatAddress(detail, place),
    userRatingCount: userRatingCount ?? null,
    type: (detail?.types ?? place?.types ?? [])[0] ?? null,
    priceRange: priceLevel,
    phoneNumber: extractPhone(detail),
    googleMapsUri: mapsUri,
    websiteUri: detail?.websiteUri ?? null,
    isReservable: boolOrNull(detail?.reservable),
    servesVegetarianFood: boolOrNull(detail?.servesVegetarianFood),
    hasDineIn: boolOrNull(detail?.dineIn),
    hasTakeout: boolOrNull(detail?.takeout),
    hasDelivery: boolOrNull(detail?.delivery),
    rating: rating ?? null,
    acceptsCards: payments.acceptsCards,
    acceptsCash: payments.acceptsCash,
    hasOutdoorSeating: boolOrNull(detail?.outdoorSeating ?? place?.outdoorSeating),
    directionsUrl: buildDirectionsUrl(placeId, mapsUri),
    reviewsUrl: buildReviewsUrl(placeId, mapsUri),
    hasFreeParking: parking.hasFreeParking,
    hasWheelchairAccessibleParking: parking.hasWheelchairAccessibleParking,
    hasWheelchairAccessibleRestroom: parking.hasWheelchairAccessibleRestroom,
    distanceMeters,
    openingHours,
    categories: coalesceCategories(detail, place),
    cuisines: detail?.cuisines ?? null,
    source: {
      provider: "google-places",
      url: mapsUri,
      confidence: null,
    },
  };
}

export function sortPlaces(list = []) {
  return [...list].sort((a, b) => {
    const da = a.distanceMeters ?? Number.POSITIVE_INFINITY;
    const db = b.distanceMeters ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    const oa = a.isOpenNow === true ? 1 : 0;
    const ob = b.isOpenNow === true ? 1 : 0;
    if (oa !== ob) return ob - oa;
    const ra = typeof a.rating === "number" ? a.rating : -1;
    const rb = typeof b.rating === "number" ? b.rating : -1;
    return rb - ra;
  });
}