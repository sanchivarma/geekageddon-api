// Minimal schemas and helpers for the geekseek places API

export const defaultRadiusMeters = 100_000; // 100km default

export function normalizeNumber(n, def = undefined) {
  const v = Number(n);
  return Number.isFinite(v) ? v : def;
}

export function parseBool(v, def = undefined) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["1", "true", "yes", "y"].includes(s)) return true;
    if (["0", "false", "no", "n"].includes(s)) return false;
  }
  return def;
}

export function coerceArray(v) {
  if (v == null) return undefined;
  if (Array.isArray(v)) return v;
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [v];
}

export function buildRequestPayload({ query = {}, body = {} }) {
  const q = (body.q ?? body.query ?? body.text ?? query.q ?? query.query ?? query.text ?? "").toString();
  const type = (body.type ?? query.type ?? "location").toString();
  const category = (body.category ?? query.category ?? "").toString();

  const lat = normalizeNumber(body.lat ?? query.lat);
  const lng = normalizeNumber(body.lng ?? query.lng);

  // radius supports `radius` and `unit` (m, km)
  const unit = (body.unit ?? query.unit ?? (body.searchRadiusKm != null ? "km" : "m")).toString().toLowerCase();
  const radiusInput = (body.radius ?? query.radius ?? body.searchRadiusKm ?? query.searchRadiusKm);
  let radius = normalizeNumber(radiusInput, defaultRadiusMeters);
  if (unit === "km") radius = radius * 1000;

  const openNowRaw = body.openNow ?? body.isOpenNow ?? query.openNow ?? query.isOpenNow;
  const openNow = parseBool(openNowRaw, undefined);
  const priceLevelsRaw = body.priceLevels ?? query.priceLevels;
  const priceLevels = coerceArray(priceLevelsRaw);
  const ratingMinRaw = body.ratingMin ?? body.minRating ?? query.ratingMin ?? query.minRating;
  const ratingMin = normalizeNumber(ratingMinRaw);
  const paymentsPreferredRaw = body.paymentsPreferred ?? query.paymentsPreferred;
  const paymentsPreferred = paymentsPreferredRaw ? paymentsPreferredRaw.toString().toLowerCase() : undefined;
  const cuisinesRaw = body.cuisines ?? body.cuisine ?? query.cuisines ?? query.cuisine;
  const cuisines = coerceArray(cuisinesRaw);
  const amenitiesRaw = body.amenities ?? query.amenities; // can be object (POST) or JSON string (GET)

  let parsedAmenities = undefined;
  if (typeof amenitiesRaw === "string") {
    try { parsedAmenities = JSON.parse(amenitiesRaw); } catch (_) { /* ignore */ }
  } else if (typeof amenitiesRaw === "object" && amenitiesRaw) {
    parsedAmenities = amenitiesRaw;
  }

  const boolInputs = {
    isReservable: body.isReservable ?? query.isReservable,
    acceptsCards: body.acceptsCards ?? query.acceptsCards,
    acceptsCash: body.acceptsCash ?? query.acceptsCash,
    servesVegetarianFood: body.servesVegetarianFood ?? query.servesVegetarianFood,
    hasTakeout: body.hasTakeout ?? query.hasTakeout,
    hasDelivery: body.hasDelivery ?? query.hasDelivery,
    hasRestroom: body.hasRestroom ?? query.hasRestroom,
    isGoodForGroups: body.isGoodForGroups ?? query.isGoodForGroups,
    hasWheelchairAccessibleParking: body.hasWheelchairAccessibleParking ?? query.hasWheelchairAccessibleParking,
    hasWheelchairAccessibleRestroom: body.hasWheelchairAccessibleRestroom ?? query.hasWheelchairAccessibleRestroom,
    hasFreeParking: body.hasFreeParking ?? query.hasFreeParking,
    hasPaidParking: body.hasPaidParking ?? query.hasPaidParking,
    isGoodForChildren: body.isGoodForChildren ?? query.isGoodForChildren,
    allowsDogs: body.allowsDogs ?? query.allowsDogs,
    hasDineIn: body.hasDineIn ?? query.hasDineIn,
    hasOutdoorSeating: body.hasOutdoorSeating ?? query.hasOutdoorSeating,
    hasLiveMusic: body.hasLiveMusic ?? query.hasLiveMusic,
    hasMenuForChildren: body.hasMenuForChildren ?? query.hasMenuForChildren,
    servesCoffee: body.servesCoffee ?? query.servesCoffee,
  };

  const parsedBools = Object.fromEntries(
    Object.entries(boolInputs).map(([key, raw]) => [key, { raw, value: parseBool(raw, undefined) }])
  );

  const fuelOptionsRaw = body.fuelOptions ?? query.fuelOptions;
  const fuelOptions = coerceArray(fuelOptionsRaw);

  const sortBy = (body.sortBy ?? query.sortBy ?? "distance").toString();
  const order = (body.order ?? query.order ?? "desc").toString();
  const limitInput = (body.limit ?? body.numberOfResults ?? query.limit ?? query.numberOfResults);
  const limit = Math.max(1, Math.min(50, normalizeNumber(limitInput, 50)));
  const locale = (body.locale ?? query.locale ?? "en").toString();
  const currency = (body.currency ?? query.currency ?? "USD").toString();
  const time = body.time ?? query.time; // ISO string or epoch or "now"

  // Optional freeform location text (e.g., "in Paris")
  const locationText = (body.locationText ?? body.searchNearbyLocationName ?? query.locationText ?? query.searchNearbyLocationName ?? "").toString();

  // Use provided currentLocation if available
  const curLoc = body.currentLocation || query.currentLocation;
  const curLat = normalizeNumber(curLoc?.lat ?? curLoc?.latitude);
  const curLng = normalizeNumber(curLoc?.lng ?? curLoc?.longitude);

  const location = {
    lat: (lat ?? curLat) ?? undefined,
    lng: (lng ?? curLng) ?? undefined,
    radiusMeters: radius,
    text: locationText || undefined,
  };

  const filters = {};
  if (openNowRaw != null) filters.openNow = openNow;
  if (priceLevelsRaw != null && Array.isArray(priceLevels) && priceLevels.length) filters.priceLevels = priceLevels;
  if (ratingMinRaw != null && ratingMin != null) filters.ratingMin = ratingMin;
  if (paymentsPreferredRaw != null && paymentsPreferred) filters.paymentsPreferred = paymentsPreferred;
  if (cuisinesRaw != null && Array.isArray(cuisines) && cuisines.length) filters.cuisines = cuisines;
  if (amenitiesRaw != null && parsedAmenities) filters.amenities = parsedAmenities;
  Object.entries(parsedBools).forEach(([key, { raw, value }]) => {
    if (raw != null) filters[key] = value;
  });
  if (fuelOptionsRaw != null && Array.isArray(fuelOptions) && fuelOptions.length) filters.fuelOptions = fuelOptions;

  const sort = { by: sortBy, order };

  const payload = {
    type,
    q,
    category: category || undefined,
    location,
    filters: Object.keys(filters).length ? filters : undefined,
    sort,
    limit,
    locale,
    currency,
    time: time || undefined,
  };

  // Track what the client explicitly provided (for prompt composition)
  payload.__provided = {
    q: !!(body.q ?? query.q ?? body.query ?? query.query),
    type: !!(body.type ?? query.type),
    category: !!(body.category ?? query.category),
    lat: body.lat != null || query.lat != null,
    lng: body.lng != null || query.lng != null,
    radius: radiusInput != null,
    unit: body.unit != null || query.unit != null,
    openNow: openNowRaw != null,
    priceLevels: priceLevelsRaw != null,
    ratingMin: ratingMinRaw != null,
    paymentsPreferred: paymentsPreferredRaw != null,
    cuisines: cuisinesRaw != null,
    limit: limitInput != null,
    sortBy: body.sortBy != null || query.sortBy != null,
    order: body.order != null || query.order != null,
    locationText: body.locationText != null || query.locationText != null,
    currentLocation: !!curLoc,
    amenities: amenitiesRaw != null,
    fuelOptions: fuelOptionsRaw != null,
    ...Object.fromEntries(Object.entries(parsedBools).map(([key, { raw }]) => [key, raw != null])),
  };

  return payload;
}

// Example place object structure for documentation and stubbing
export function samplePlace(id = 1) {
  return {
    id: `sample-${id}`,
    name: id % 2 ? "Sample Bistro" : "Downtown Dental Care",
    categories: id % 2 ? ["restaurant", "bistro", "french"] : ["dentist"],
    rating: 4.5,
    reviewCount: 1243,
    priceLevel: 2, // 0-4
    openNow: true,
    openingHours: {
      timezone: "America/Los_Angeles",
      periods: [
        { day: "mon", open: "09:00", close: "22:00" },
        { day: "tue", open: "09:00", close: "22:00" },
        { day: "wed", open: "09:00", close: "22:00" },
        { day: "thu", open: "09:00", close: "22:00" },
        { day: "fri", open: "09:00", close: "23:00" },
        { day: "sat", open: "10:00", close: "23:00" },
        { day: "sun", open: "10:00", close: "21:00" }
      ],
      currentStatusText: "Open until 10:00 PM",
    },
    payments: { cash: true, cards: true, applePay: true, googlePay: false, upi: false },
    amenities: {
      wheelchairAccessible: true,
      parking: { available: true, valet: false, street: true, lot: false },
      wifi: { available: true, free: true },
      petFriendly: false,
      outdoorSeating: true,
      reservations: true,
      delivery: true,
      takeout: true,
      familyFriendly: true
    },
    dietary: { vegan: true, vegetarian: true, glutenFree: true, halal: false, kosher: false },
    servesAlcohol: true,
    noiseLevel: "moderate",
    dressCode: "casual",
    cuisines: ["french", "californian"],
    keywords: ["cozy", "date night", "local"],
    phone: "+1 555-0100",
    website: "https://example.com/sample-bistro",
    mapsUrl: "https://maps.example.com/?q=sample",
    address: {
      street: "123 Main St",
      city: "San Francisco",
      region: "CA",
      postalCode: "94105",
      country: "US"
    },
    location: { lat: 37.789, lng: -122.391 },
    distanceMeters: 750,
    photos: [
      {
        url: "https://images.example.com/sample-bistro.jpg",
        thumbnail: "https://images.example.com/sample-bistro-thumb.jpg",
        attribution: "@localphotog"
      }
    ],
    source: { provider: "stub", url: "" },
    confidence: 0.7,
    updatedAt: new Date().toISOString()
  };
}
