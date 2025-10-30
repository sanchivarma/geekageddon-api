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

  const openNow = parseBool(body.openNow ?? body.isOpenNow ?? query.openNow ?? query.isOpenNow, undefined);
  const priceLevels = coerceArray(body.priceLevels ?? query.priceLevels);
  const ratingMin = normalizeNumber(body.ratingMin ?? body.minRating ?? query.ratingMin ?? query.minRating);
  const paymentsPreferred = (body.paymentsPreferred ?? query.paymentsPreferred ?? "").toString().toLowerCase() || undefined; // 'cash' | 'card'
  const cuisines = coerceArray(body.cuisines ?? body.cuisine ?? query.cuisines ?? query.cuisine);
  const amenities = body.amenities ?? query.amenities; // can be object (POST) or JSON string (GET)

  let parsedAmenities = undefined;
  if (typeof amenities === "string") {
    try { parsedAmenities = JSON.parse(amenities); } catch (_) { /* ignore */ }
  } else if (typeof amenities === "object" && amenities) {
    parsedAmenities = amenities;
  }

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

  const filters = {
    openNow: openNow,
    priceLevels: priceLevels,
    ratingMin: ratingMin,
    paymentsPreferred: paymentsPreferred,
    cuisines: cuisines,
    amenities: parsedAmenities,
    // Extended booleans
    isReservable: parseBool(body.isReservable ?? query.isReservable, undefined),
    acceptsCards: parseBool(body.acceptsCards ?? query.acceptsCards, undefined),
    acceptsCash: parseBool(body.acceptsCash ?? query.acceptsCash, undefined),
    servesVegetarianFood: parseBool(body.servesVegetarianFood ?? query.servesVegetarianFood, undefined),
    hasTakeout: parseBool(body.hasTakeout ?? query.hasTakeout, undefined),
    hasDelivery: parseBool(body.hasDelivery ?? query.hasDelivery, undefined),
    hasRestroom: parseBool(body.hasRestroom ?? query.hasRestroom, undefined),
    isGoodForGroups: parseBool(body.isGoodForGroups ?? query.isGoodForGroups, undefined),
    hasWheelchairAccessibleParking: parseBool(body.hasWheelchairAccessibleParking ?? query.hasWheelchairAccessibleParking, undefined),
    hasWheelchairAccessibleRestroom: parseBool(body.hasWheelchairAccessibleRestroom ?? query.hasWheelchairAccessibleRestroom, undefined),
    hasFreeParking: parseBool(body.hasFreeParking ?? query.hasFreeParking, undefined),
    hasPaidParking: parseBool(body.hasPaidParking ?? query.hasPaidParking, undefined),
    isGoodForChildren: parseBool(body.isGoodForChildren ?? query.isGoodForChildren, undefined),
    allowsDogs: parseBool(body.allowsDogs ?? query.allowsDogs, undefined),
    hasDineIn: parseBool(body.hasDineIn ?? query.hasDineIn, undefined),
    hasOutdoorSeating: parseBool(body.hasOutdoorSeating ?? query.hasOutdoorSeating, undefined),
    hasLiveMusic: parseBool(body.hasLiveMusic ?? query.hasLiveMusic, undefined),
    hasMenuForChildren: parseBool(body.hasMenuForChildren ?? query.hasMenuForChildren, undefined),
    servesCoffee: parseBool(body.servesCoffee ?? query.servesCoffee, undefined),
    fuelOptions: coerceArray(body.fuelOptions ?? query.fuelOptions),
  };

  const sort = { by: sortBy, order };

  const payload = {
    type,
    q,
    category: category || undefined,
    location,
    filters,
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
    openNow: body.openNow != null || query.openNow != null,
    priceLevels: body.priceLevels != null || query.priceLevels != null,
    ratingMin: body.ratingMin != null || query.ratingMin != null,
    paymentsPreferred: body.paymentsPreferred != null || query.paymentsPreferred != null,
    cuisines: body.cuisines != null || body.cuisine != null || query.cuisines != null || query.cuisine != null,
    limit: limitInput != null,
    sortBy: body.sortBy != null || query.sortBy != null,
    order: body.order != null || query.order != null,
    locationText: body.locationText != null || query.locationText != null,
    currentLocation: !!curLoc,
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
