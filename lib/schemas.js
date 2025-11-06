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
    hasDineIn: body.hasDineIn ?? query.hasDineIn,
    hasOutdoorSeating: body.hasOutdoorSeating ?? query.hasOutdoorSeating,
    hasWheelchairAccessibleParking: body.hasWheelchairAccessibleParking ?? query.hasWheelchairAccessibleParking,
    hasFreeParking: body.hasFreeParking ?? query.hasFreeParking,
    hasPaidParking: body.hasPaidParking ?? query.hasPaidParking,
  };

  const parsedBools = Object.fromEntries(
    Object.entries(boolInputs).map(([key, raw]) => [key, { raw, value: parseBool(raw, undefined) }])
  );

  const sortBy = (body.sortBy ?? query.sortBy ?? "distance").toString();
  const order = (body.order ?? query.order ?? "desc").toString();
  const limitInput = (body.limit ?? body.numberOfResults ?? query.limit ?? query.numberOfResults);
  const limit = Math.max(1, Math.min(20, normalizeNumber(limitInput, 20)));
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
    ...Object.fromEntries(Object.entries(parsedBools).map(([key, { raw }]) => [key, raw != null])),
  };

  return payload;
}

const DEFAULT_HOURS = {
  timezone: "America/Los_Angeles",
  periods: [
    { day: "mon", open: "08:00", close: "22:00" },
    { day: "tue", open: "08:00", close: "22:00" },
    { day: "wed", open: "08:00", close: "22:00" },
    { day: "thu", open: "08:00", close: "22:00" },
    { day: "fri", open: "08:00", close: "23:00" },
    { day: "sat", open: "09:00", close: "23:00" },
    { day: "sun", open: "09:00", close: "21:00" },
  ],
  currentStatusText: "Open until 10:00 PM",
};

const DEFAULT_PAYMENTS = { cash: true, cards: true, applePay: true, googlePay: false };

const DEFAULT_AMENITIES = {
  reservations: true,
  dineIn: true,
  takeout: true,
  delivery: true,
  outdoorSeating: false,
  parking: { available: true, valet: false, street: true, lot: false },
  wifi: { available: true, free: true },
};

const DEFAULT_DIETARY = { vegan: true, vegetarian: true, glutenFree: true, halal: false, kosher: false };

const SAMPLE_PLACES = [
  {
    id: "sample-harmonic-noodle",
    name: "Harmonic Noodle Bar",
    categories: ["restaurant", "asian", "noodle"],
    cuisines: ["pan-asian"],
    rating: 4.6,
    reviewCount: 846,
    priceLevel: 2,
    openNow: true,
    servesAlcohol: false,
    keywords: ["late night", "casual"],
    phone: "+1 206-555-0198",
    website: "https://harmonicnoodle.example.com",
    googleMapsUri: "https://maps.google.com/?q=Harmonic+Noodle+Bar+Seattle",
    address: { street: "219 E Pine St", city: "Seattle", region: "WA", postalCode: "98101", country: "US" },
    amenities: { ...DEFAULT_AMENITIES, outdoorSeating: true },
    dietary: { ...DEFAULT_DIETARY, vegan: true },
    distanceMeters: 620,
  },
  {
    id: "sample-blue-harbor",
    name: "Blue Harbor Coffee Co.",
    categories: ["cafe", "coffee"],
    cuisines: ["coffee", "pastries"],
    rating: 4.3,
    reviewCount: 412,
    priceLevel: 1,
    openNow: true,
    keywords: ["work-friendly", "wifi"],
    phone: "+1 503-555-4412",
    website: null,
    googleMapsUri: "https://maps.google.com/?q=Blue+Harbor+Coffee+Portland",
    address: { street: "81 NW 10th Ave", city: "Portland", region: "OR", postalCode: "97209", country: "US" },
    amenities: { ...DEFAULT_AMENITIES, outdoorSeating: false },
    dietary: { ...DEFAULT_DIETARY, vegan: false },
    distanceMeters: 980,
  },
  {
    id: "sample-saffron-cedar",
    name: "Saffron & Cedar Bistro",
    categories: ["restaurant", "bistro"],
    cuisines: ["mediterranean"],
    rating: 4.8,
    reviewCount: 1520,
    priceLevel: 3,
    openNow: false,
    servesAlcohol: true,
    keywords: ["date night", "chef driven"],
    phone: "+1 415-555-2442",
    website: "https://saffroncedar.example.com",
    googleMapsUri: "https://maps.google.com/?q=Saffron+%26+Cedar+Bistro+San+Francisco",
    address: { street: "998 Union St", city: "San Francisco", region: "CA", postalCode: "94133", country: "US" },
    amenities: { ...DEFAULT_AMENITIES, reservations: true, outdoorSeating: true },
    dietary: { ...DEFAULT_DIETARY, vegan: false, halal: true },
    distanceMeters: 1430,
  },
  {
    id: "sample-orbit-vegan",
    name: "Orbit Vegan Kitchen",
    categories: ["restaurant", "vegan"],
    cuisines: ["plant-based", "bowls"],
    rating: 4.5,
    reviewCount: 678,
    priceLevel: 2,
    openNow: true,
    keywords: ["fast casual", "sustainable"],
    phone: "+1 312-555-8088",
    website: "https://orbitvegan.example.com",
    googleMapsUri: "https://maps.google.com/?q=Orbit+Vegan+Kitchen+Chicago",
    address: { street: "527 W Kinzie St", city: "Chicago", region: "IL", postalCode: "60654", country: "US" },
    amenities: { ...DEFAULT_AMENITIES, delivery: true, outdoorSeating: true },
    dietary: { ...DEFAULT_DIETARY, vegan: true, vegetarian: true },
    distanceMeters: 870,
  },
  {
    id: "sample-forge-taproom",
    name: "Forge Taproom & Grill",
    categories: ["restaurant", "gastropub"],
    cuisines: ["american", "grill"],
    rating: 4.1,
    reviewCount: 532,
    priceLevel: 2,
    openNow: false,
    servesAlcohol: true,
    keywords: ["happy hour", "craft beer"],
    phone: "+1 720-555-6670",
    website: null,
    googleMapsUri: "https://maps.google.com/?q=Forge+Taproom+Denver",
    address: { street: "1415 Blake St", city: "Denver", region: "CO", postalCode: "80202", country: "US" },
    amenities: { ...DEFAULT_AMENITIES, reservations: false, delivery: false, outdoorSeating: true },
    distanceMeters: 1950,
  },
  {
    id: "sample-cinder-bloom",
    name: "Cinder & Bloom Bakery",
    categories: ["bakery", "dessert"],
    cuisines: ["bakery"],
    rating: 4.9,
    reviewCount: 268,
    priceLevel: 1,
    openNow: true,
    keywords: ["artisanal", "take-home"],
    phone: "+1 646-555-2044",
    website: "https://cinderbloom.example.com",
    googleMapsUri: "https://maps.google.com/?q=Cinder+%26+Bloom+Bakery+Brooklyn",
    address: { street: "233 Wythe Ave", city: "Brooklyn", region: "NY", postalCode: "11249", country: "US" },
    amenities: { ...DEFAULT_AMENITIES, reservations: false, delivery: true, outdoorSeating: false },
    dietary: { ...DEFAULT_DIETARY, glutenFree: false },
    distanceMeters: 430,
  },
];

// Example place object structure for documentation and stubbing
export function samplePlace(id = 1) {
  const sample = SAMPLE_PLACES[(Math.max(1, id) - 1) % SAMPLE_PLACES.length];
  const urlSafeName = encodeURIComponent(sample.name || `Sample ${id}`);
  const fallbackMap = `https://maps.google.com/?q=${urlSafeName}`;
  return {
    id: sample.id ?? `sample-${id}`,
    name: sample.name ?? `Sample Venue ${id}`,
    categories: sample.categories ?? ["restaurant"],
    rating: sample.rating ?? 4.2,
    reviewCount: sample.reviewCount ?? 120,
    priceLevel: sample.priceLevel ?? 2,
    openNow: sample.openNow ?? true,
    openingHours: sample.openingHours ?? DEFAULT_HOURS,
    payments: sample.payments ?? DEFAULT_PAYMENTS,
    amenities: sample.amenities ?? DEFAULT_AMENITIES,
    dietary: sample.dietary ?? DEFAULT_DIETARY,
    servesAlcohol: sample.servesAlcohol ?? false,
    noiseLevel: sample.noiseLevel ?? "moderate",
    dressCode: sample.dressCode ?? "casual",
    cuisines: sample.cuisines ?? sample.categories ?? ["fusion"],
    keywords: sample.keywords ?? [],
    phone: sample.phone ?? null,
    website: sample.website ?? null,
    mapsUrl: sample.mapsUrl ?? sample.googleMapsUri ?? fallbackMap,
    googleMapsUri: sample.googleMapsUri ?? sample.mapsUrl ?? fallbackMap,
    address: sample.address ?? {
      street: "123 Market St",
      city: "San Francisco",
      region: "CA",
      postalCode: "94105",
      country: "US",
    },
    distanceMeters: sample.distanceMeters ?? id * 480,
    photos: sample.photos ?? [],
    source: sample.source ?? { provider: "stub", url: "" },
    confidence: sample.confidence ?? 0.7,
    updatedAt: new Date().toISOString(),
  };
}
