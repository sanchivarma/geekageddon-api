import { buildRequestPayload, samplePlace, defaultRadiusMeters } from "../../lib/schemas.js";
import { detectNearbyIntent, extractLocationText } from "../../lib/geoparse.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function buildPromptLines(input) {
  const lines = [];
  const qText = input.q?.trim() || "";
  lines.push(`User request: ${qText || "(no query)"}`);
  lines.push("Apply these parameters:");
  const km = Math.round((input.location?.radiusMeters ?? defaultRadiusMeters) / 1000);
  if (input.location?.lat != null && input.location?.lng != null) lines.push(`- Search within ${km}km of my location`);
  else if (input.location?.text) lines.push(`- Search within ${km}km of ${input.location.text}`);
  else lines.push(`- Search within ${km}km of my current city`);
  const saidOpen = /\bopen\b/i.test(qText);
  if (input.filters?.openNow === true) lines.push(`- Must be currently open`);
  else if (saidOpen) lines.push(`- Prefer venues that are open now, but include relevant closed ones`);
  else lines.push(`- Include venues regardless of open status; mark their current status`);
  if (typeof input.filters?.ratingMin === "number") lines.push(`- With rating >= ${input.filters.ratingMin}`);
  if (input.filters?.isReservable === true) lines.push(`- Reservable`);
  const saidCard = /\bcard(s)?\b/i.test(qText);
  const saidCash = /\bcash\b/i.test(qText);
  if (input.filters?.paymentsPreferred === "card" || saidCard) lines.push(`- Which accept card payments`);
  else if (input.filters?.paymentsPreferred === "cash" || saidCash) lines.push(`- Which accept cash payments`);
  if (input.filters?.acceptsCards === true) lines.push(`- Accepts cards`);
  if (input.filters?.acceptsCash === true) lines.push(`- Accepts cash`);
  if (input.filters?.servesVegetarianFood === true) lines.push(`- Serves vegetarian food`);
  if (input.filters?.hasTakeout === true) lines.push(`- Has takeout`);
  if (input.filters?.hasDelivery === true) lines.push(`- Has delivery`);
  if (input.filters?.hasDineIn === true) lines.push(`- Has dine-in`);
  if (input.filters?.hasOutdoorSeating === true) lines.push(`- Has outdoor seating`);
  if (input.filters?.hasFreeParking === true) lines.push(`- Has free parking`);
  if (input.filters?.hasPaidParking === true) lines.push(`- Has paid parking`);
  if (input.filters?.hasWheelchairAccessibleParking === true) lines.push(`- Wheelchair accessible parking`);
  if (Array.isArray(input.filters?.cuisines) && input.filters.cuisines.length) lines.push(`- That offer cuisines: ${input.filters.cuisines.join(", ")}`);
  if (input.category) lines.push(`- Category: ${input.category}`);
  const saidParking = /\bparking\b/i.test(qText);
  if (input.filters?.amenities?.parking?.available === true || saidParking) lines.push(`- Which offer car parking`);
  lines.push(`- Return at least ${input.limit ?? 20} distinct venues when possible`);
  lines.push(`- Sort by distance ascending; if distance ties, prefer open venues, otherwise higher rating`);
  return lines;
}

function buildSinglePrompt({ input, lines }) {
  const header = [
    "You are an expert assistant that helps users find nearby places based on their requests.",
    "You are a data normalizer. Return ONLY strict JSON matching the provided JSON Schema.",
    "Return only strict JSON. No markdown. No prose.",
    "Task: Produce an array of nearby places that match the user request.",
    "CRITICAL RULES (READ CAREFULLY):",
    "- Output up to the requested limit as { \"results\": Place[] } only.",
    "- Only include places that are well-known, established, and verifiably real",
    "- If unsure a venue exists, omit it instead of fabricating.",
    "- If a field is unknown, use null, do not guess.",
    "Map URL (IMPORTANT):",
    "- googleMapsUri MUST follow this exact format:",
    "ttps://www.google.com/maps/search/?api=1&query=<ENCODED_NAME>",
    "- where <ID> is the place id you assign. Do NOT create fake place IDs.",
    "- Do NOT create fake URLs.",
    "- If unsure → googleMapsUri = null.",
    "Place object requirements:",
    "- Respect location; prioritize distance ascending, then currently open first, then rating descending.",
    "- rating is 0-5 (float), priceLevel is 0-4, reviewCount is integer.",
    "- openingHours.periods: [{ day:mon|tue|..., open:HH:MM, close:HH:MM }] and set currentStatusText when possible.",
    "- payments: include cash/cards/applePay/googlePay when known; else null.",
    "- amenities: include wheelchairAccessible, parking{available,valet,street,lot}, wifi{available,free}, etc.",
    "- Include address, phone, website, google-mapsUrl if available; else null.",
    "- Include categories and cuisines when applicable; else [] or null.",
    "- Include distanceMeters when available (approximate allowed).",
    "- Include a feature photo in photos array if available; else [].",
    "- Provide source {provider,url} and set confidence 0..1 for the match quality.",
    "- Each Place MUST include keys: id, name, isOpenNow, address (string), userRatingCount, type, priceRange, phoneNumber, googleMapsUri, websiteUri, isReservable, servesVegetarianFood, hasDineIn, hasTakeout, hasDelivery, rating, acceptsCards, acceptsCash, hasOutdoorSeating, directionsUrl, reviewsUrl, hasFreeParking, hasWheelchairAccessibleParking. Missing -> null.",
  ].join("\n");
  const body = [
    "",
    "User intent and parameters:",
    ...lines,
    "",
    "Return only JSON with key `results` (Place[]) and realistic fields.",
    "Do not include any commentary outside the JSON.",
  ].join("\n");
  return header + "\n" + body;
}

async function callOpenAIAPI({ promptText }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const url = "https://api.openai.com/v1/chat/completions";
  const body = {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [ { role: "user", content: promptText } ],
    response_format: { type: "json_object" }
  };
  if (!apiKey) {
    return { provider: "stub", model: null, results: null, reason: "missing_openai_key", prompt: { text: promptText } };
  }
  try {
    console.log("[geekseek] OpenAI request", { model: body.model, prompt: promptText });
    const started = Date.now();
    const resp = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.log("[geekseek] OpenAI http error", { status: resp.status, body: errText?.slice?.(0, 500) });
      return { provider: "openai", model: body.model, results: null, reason: `http_${resp.status}`, prompt: { text: promptText }, error: errText };
    }
    const data = await resp.json();
    const latencyMs = Date.now() - started; console.log("[geekseek] OpenAI response", { latencyMs });
    const text = data?.choices?.[0]?.message?.content || "";
    let parsed = null; try { parsed = JSON.parse(text); } catch (_) { if (typeof data === "object" && data && data.results) parsed = data; }
    const results = Array.isArray(parsed?.results) ? parsed.results : null;
    return { provider: "openai", model: body.model, results, latencyMs, prompt: { text: promptText } };
  } catch (e) {
    console.log("[geekseek] OpenAI network error", { message: e?.message });
    return { provider: "openai", model: body.model, results: null, reason: "network_error", prompt: { text: promptText } };
  }
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") { res.writeHead(204, CORS_HEADERS).end(); return; }
  if (!["GET","POST"].includes(req.method)) { res.setHeader("Allow","GET, POST, OPTIONS"); return res.status(405).json({ ok:false, error:"method_not_allowed" }); }
  Object.entries(CORS_HEADERS).forEach(([k,v])=>res.setHeader(k,v));
  const rawQuery = req.query || {}; const rawBody = req.body || {};
  const input = buildRequestPayload({ query: rawQuery, body: rawBody });
  const nearbyIntent = detectNearbyIntent(input.q);
  const extractedText = extractLocationText(input.q);
  if (extractedText && !input.location.text) input.location.text = extractedText;
  const lines = buildPromptLines(input);
  const promptText = buildSinglePrompt({ input, lines });

  const parseBool = (v) => {
    if (typeof v === "boolean") return v;
    if (v == null) return undefined;
    const s = String(v).trim().toLowerCase();
    if (["1","true","yes","on"].includes(s)) return true;
    if (["0","false","no","off"].includes(s)) return false;
    return undefined;
  };

  const mock = parseBool(process.env.GEEKSEEK_TEST_MODE) ?? false;
  try {
    //console.log("[geekseek] env.GEEKSEEK_TEST_MODE=", envMockRaw);
    console.log("[geekseek] mock=", mock, "source=", envMockRaw != null ? "env" : "default");
  } catch(_){}
  const needsClientLocation = nearbyIntent && (input.location.lat == null || input.location.lng == null);
  if (needsClientLocation) {
    if (!mock) {
      return res.status(200).json({ ok:true, action:"request_client_location", message:"Client should obtain geolocation and retry with lat,lng.", how:{ browser:"Use navigator.geolocation.getCurrentPosition and call this endpoint with lat,lng.", fields:["lat","lng"] }, query: input, results:[], meta:{ count:0, prompt:{ text: promptText } } });
    } else {
      // In mock mode, proceed with a generic fallback so the client still sees results
      if (!input.location.text) input.location.text = "current city";
    }
  }
  if (input.location.lat == null && input.location.lng == null && !input.location.text) { input.location.text = "current city"; }
  const supportedTypes = new Set(["location","places"]);
  if (!supportedTypes.has((input.type||"location").toLowerCase())) {
    return res.status(400).json({ ok:false, error:"unsupported_type", supportedTypes:[...supportedTypes], meta:{ prompt:{ text: promptText } } });
  }
  let ai;
  if (mock) {
    ai = { provider: "mock", model: null, results: null, reason: "mock_mode", prompt: { text: promptText } };
  } else {
    ai = await callOpenAIAPI({ promptText });
  }

  if (!mock && ai.provider === "stub" && ai.reason === "missing_openai_key") {
    return res.status(503).json({
      success: false,
      count: 0,
      message: "Missing OpenAI API key; set OPENAI_API_KEY to enable live results.",
      error: "missing_openai_key",
      body: [],
      meta: {
        provider: ai.provider,
        reason: ai.reason,
        prompt: ai.prompt ?? { text: promptText },
        mock,
      },
    });
  }

  let results = ai.results;

  // Build success/failure envelope requested
  let success = false;
  let message = "no results found";
  let errorText = ai.error || ai.reason || undefined;
  let body;
  let count = 0;

  if (mock) {
    // Generate enriched mock results with truthy badges
    results = Array.from({ length: input.limit }).map((_, i) => {
      const p = samplePlace(i + 1);
      if (input.category) p.categories = [input.category];
      if (typeof input.filters?.openNow === "boolean") p.openNow = input.filters.openNow;
      else p.openNow = (i % 4 !== 0); // include some closed items by default
      // Distance and rating
      p.distanceMeters = (i + 1) * 450;
      p.rating = 4.6;
      p.reviewCount = 1234 + i * 11;
      // Flattened fields with diversity
      if (p.isReservable == null) p.isReservable = i % 3 !== 0;
      if (p.servesVegetarianFood == null) p.servesVegetarianFood = i % 2 === 0;
      if (p.hasDineIn == null) p.hasDineIn = true;
      if (p.hasTakeout == null) p.hasTakeout = i % 4 !== 0;
      if (p.hasDelivery == null) p.hasDelivery = i % 3 !== 2;
      if (p.acceptsCards == null) p.acceptsCards = true;
      if (p.acceptsCash == null) p.acceptsCash = i % 2 === 1;
      if (p.hasOutdoorSeating == null) p.hasOutdoorSeating = i % 2 === 0;
      if (p.hasFreeParking == null) p.hasFreeParking = i % 3 === 0;
      if (p.hasWheelchairAccessibleParking == null) p.hasWheelchairAccessibleParking = i % 2 === 0;
      // URLs
      if (!p.googleMapsUri && p.mapsUrl) p.googleMapsUri = p.mapsUrl;
      if (!p.googleMapsUri) p.googleMapsUri = `https://maps.google.com/?q=${encodeURIComponent(p.name || `Place ${i + 1}`)}`;
      if (!p.directionsUrl) p.directionsUrl = p.googleMapsUri;
      if (!p.reviewsUrl) p.reviewsUrl = p.googleMapsUri;
      return p;
    });
  } else if (!Array.isArray(results)) {
    // Live path but no results (e.g., missing API key or parse failure). Produce a graceful fallback
    results = Array.from({ length: input.limit }).map((_, i) => {
      const p = samplePlace(i + 1);
      if (input.category) p.categories = [input.category];
      p.distanceMeters = (i + 1) * 550;
      p.rating = 4.2;
      p.reviewCount = 420 + i * 7;
      // Alternate open/closed to show both states
      p.openNow = (i % 3 !== 0);
      // Flattened truthy flags with diversity
      if (p.isReservable == null) p.isReservable = i % 2 === 0;
      if (p.servesVegetarianFood == null) p.servesVegetarianFood = i % 3 !== 0;
      if (p.hasDineIn == null) p.hasDineIn = true;
      if (p.hasTakeout == null) p.hasTakeout = i % 4 !== 1;
      if (p.hasDelivery == null) p.hasDelivery = i % 3 === 0;
      if (p.acceptsCards == null) p.acceptsCards = true;
      if (p.acceptsCash == null) p.acceptsCash = i % 2 !== 0;
      if (p.hasOutdoorSeating == null) p.hasOutdoorSeating = i % 2 === 0;
      if (p.hasFreeParking == null) p.hasFreeParking = i % 3 === 0;
      if (p.hasWheelchairAccessibleParking == null) p.hasWheelchairAccessibleParking = i % 2 === 1;
      if (!p.googleMapsUri && p.mapsUrl) p.googleMapsUri = p.mapsUrl;
      if (!p.googleMapsUri) p.googleMapsUri = `https://maps.google.com/?q=${encodeURIComponent(p.name || `Place ${i + 1}`)}`;
      if (!p.directionsUrl) p.directionsUrl = p.googleMapsUri;
      if (!p.reviewsUrl) p.reviewsUrl = p.googleMapsUri;
      return p;
    });
  }

  if (Array.isArray(results)) {
    // Apply filters and sorting to real or mock results
    /* if (typeof input.filters?.openNow === "boolean") {
      results = results.filter((r) => r.openNow === input.filters.openNow);
    } if (Array.isArray(input.filters?.priceLevels) && input.filters.priceLevels.length) {
      const allowed = new Set(input.filters.priceLevels.map((x) => Number(x)));
      results = results.filter((r) => r.priceLevel == null || allowed.has(Number(r.priceLevel)));
    }*/
    
    results.sort((a, b) => {
      const oa = a.openNow === true ? 1 : 0;
      const ob = b.openNow === true ? 1 : 0;
      if (oa !== ob) return ob - oa; // open first
      const da = a.distanceMeters ?? 1e12;
      const db = b.distanceMeters ?? 1e12;
      if (da !== db) return da - db; // nearest first
      const ra = typeof a.rating === "number" ? a.rating : -1;
      const rb = typeof b.rating === "number" ? b.rating : -1;
      return rb - ra; // highest rating first
    });

    const limited = results.slice(0, input.limit);
    // Normalize to requested output keys
    const norm = (r) => {
      const addr = typeof r.address === "string" ? r.address : (r.address ? [r.address.street, r.address.city, r.address.region, r.address.postalCode, r.address.country].filter(Boolean).join(", ") : null);
      const payments = r.payments || {};
      const am = r.amenities || {};
      const parking = (am.parking || {});
      return {
        id: r.id ?? r.place_id ?? null,
        name: r.name ?? null,
        isOpenNow: r.isOpenNow ?? r.openNow ?? null,
        address: addr ?? null,
        userRatingCount: r.userRatingCount ?? r.reviewCount ?? null,
        type: r.type ?? (Array.isArray(r.categories) ? r.categories[0] : null),
        priceRange: (r.priceRange != null ? r.priceRange : (typeof r.priceLevel === "number" ? (r.priceLevel + 1) : null)),
        phoneNumber: r.phoneNumber ?? r.phone ?? null,
        googleMapsUri: r.googleMapsUri ?? r.mapsUrl ?? null,
        websiteUri: r.websiteUri ?? r.website ?? null,
        distanceMeters: r.distanceMeters ?? null,
        isReservable: r.isReservable ?? am.reservations ?? null,
        servesVegetarianFood: r.servesVegetarianFood ?? (r.dietary ? r.dietary.vegetarian : null),
        hasDineIn: r.hasDineIn ?? am.dineIn ?? null,
        hasTakeout: r.hasTakeout ?? r.takeout ?? am.takeout ?? null,
        hasDelivery: r.hasDelivery ?? r.delivery ?? am.delivery ?? null,
        rating: r.rating ?? null,
        acceptsCards: r.acceptsCards ?? payments.cards ?? null,
        acceptsCash: r.acceptsCash ?? payments.cash ?? null,
        hasOutdoorSeating: r.hasOutdoorSeating ?? am.outdoorSeating ?? null,
        directionsUrl: r.directionsUrl ?? null,
        reviewsUrl: r.reviewsUrl ?? null,
        hasFreeParking: r.hasFreeParking ?? null,
        hasWheelchairAccessibleParking: r.hasWheelchairAccessibleParking ?? null,
      };
    };
    results = limited.map(norm);
    success = true;
    message = mock ? "mock results" : "successfully retrieved results";
    errorText = undefined;
    body = results;
    count = results.length;
  } else {
    // No results from provider and not in mock mode
    success = false;
    message = "no results found";
    body = {};
    count = 0;
  }

  try {
    console.log("[geekseek] handler return", { count, provider: ai.provider, reason: ai.reason, success });
  } catch (_) {}

  return res.status(200).json({
    success,
    count,
    message,
    error: errorText,
    body,
    meta: {
      provider: ai.provider,
      model: ai.model,
      latencyMs: ai.latencyMs,
      prompt: ai.prompt ?? { text: promptText },
      mock,
    },
  });
}
