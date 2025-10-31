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
  if (input.filters?.openNow === true || saidOpen) lines.push(`- Which are currently open`);
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
  if (input.filters?.hasRestroom === true) lines.push(`- Has restroom`);
  if (input.filters?.isGoodForGroups === true) lines.push(`- Good for groups`);
  if (input.filters?.isGoodForChildren === true) lines.push(`- Good for children`);
  if (input.filters?.allowsDogs === true) lines.push(`- Allows dogs`);
  if (input.filters?.hasDineIn === true) lines.push(`- Has dine-in`);
  if (input.filters?.hasOutdoorSeating === true) lines.push(`- Has outdoor seating`);
  if (input.filters?.hasLiveMusic === true) lines.push(`- Has live music`);
  if (input.filters?.hasMenuForChildren === true) lines.push(`- Has menu for children`);
  if (input.filters?.servesCoffee === true) lines.push(`- Serves coffee`);
  if (input.filters?.hasFreeParking === true) lines.push(`- Has free parking`);
  if (input.filters?.hasPaidParking === true) lines.push(`- Has paid parking`);
  if (input.filters?.hasWheelchairAccessibleParking === true) lines.push(`- Wheelchair accessible parking`);
  if (input.filters?.hasWheelchairAccessibleRestroom === true) lines.push(`- Wheelchair accessible restroom`);
  if (Array.isArray(input.filters?.cuisines) && input.filters.cuisines.length) lines.push(`- That offer cuisines: ${input.filters.cuisines.join(", ")}`);
  if (input.category) lines.push(`- Category: ${input.category}`);
  const saidParking = /\bparking\b/i.test(qText);
  if (input.filters?.amenities?.parking?.available === true || saidParking) lines.push(`- Which offer car parking`);
  lines.push(`- Limit results to ${input.limit ?? 50}`);
  lines.push(`- Sort by distance ascending, then currently open first, then rating descending`);
  return lines;
}

function buildSinglePrompt({ input, lines }) {
  const header = [
    "You are a precise local search aggregator.",
    "Return only strict JSON. No markdown. No prose.",
    "Task: Produce a results array of nearby places that match the user intent.",
    "Rules:",
    "- Output top N items (N provided) as { \"results\": Place[] } only.",
    "- Use realistic, publicly verifiable data style; never invent specific facts.",
    "- If a field is unknown, use null, do not guess.",
    "- Respect location and radius; prioritize distance ascending, then currently open first, then rating descending.",
    "- rating is 0-5 (float), priceLevel is 0-4, reviewCount is integer.",
    "- openingHours.periods: [{ day:mon|tue|..., open:HH:MM, close:HH:MM }] and set currentStatusText when possible.",
    "- payments: include cash/cards/applePay/googlePay when known; else null.",
    "- amenities: include wheelchairAccessible, parking{available,valet,street,lot}, wifi{available,free}, etc.",
    "- Include address, phone, website, mapsUrl if available; else null.",
    "- Include categories and cuisines when applicable; else [] or null.",
    "- Include location {lat,lng} and distanceMeters (approximate allowed).",
    "- Include a photos array if available; else [].",
    "- Provide source {provider,url} and set confidence 0..1 for the match quality.",
    "- Each Place MUST include keys: id, name, isOpenNow, address (string), userRatingCount, type, priceRange, phoneNumber, location{latitude,longitude}, googleMapsUri, websiteUri, isReservable, servesVegetarianFood, hasDineIn, hasTakeout, hasDelivery, hasRestroom, isGoodForGroups, isGoodForChildren, allowsDogs, rating, acceptsCards, acceptsCash, hasOutdoorSeating, hasLiveMusic, hasMenuForChildren, servesCoffee, directionsUrl, reviewsUrl, hasFreeParking, hasWheelchairAccessibleParking, hasWheelchairAccessibleRestroom, fuelOptions[]. Missing -> null.",
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
  const envMockRaw = process.env.GEEKSEEK_TEST_MODE;
  const mock = parseBool(rawBody.mock ?? rawQuery.mock) ?? parseBool(envMockRaw) ?? false;
  try {
    console.log("[geekseek] env.GEEKSEEK_TEST_MODE=", envMockRaw);
    console.log("[geekseek] mock=", mock, "source=", (rawBody.mock ?? rawQuery.mock) != null ? "request" : (envMockRaw != null ? "env" : "default"));
  } catch(_){}
  const needsClientLocation = nearbyIntent && (input.location.lat == null || input.location.lng == null);
  if (needsClientLocation) {
    return res.status(200).json({ ok:true, action:"request_client_location", message:"Client should obtain geolocation and retry with lat,lng.", how:{ browser:"Use navigator.geolocation.getCurrentPosition and call this endpoint with lat,lng.", fields:["lat","lng"] }, query: input, results:[], meta:{ count:0, prompt:{ text: promptText } } });
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
      if (typeof input.filters?.openNow === "boolean") p.openNow = input.filters.openNow; else p.openNow = true;
      // Distance and rating
      p.distanceMeters = (i + 1) * 450;
      p.rating = 4.6;
      p.reviewCount = 1234 + i * 11;
      // Flattened fields to ensure truthy badges
      p.isReservable = true;
      p.servesVegetarianFood = true;
      p.hasDineIn = true;
      p.hasTakeout = true;
      p.hasDelivery = true;
      p.hasRestroom = true;
      p.isGoodForGroups = true;
      p.isGoodForChildren = true;
      p.allowsDogs = true;
      p.acceptsCards = true;
      p.acceptsCash = true;
      p.hasOutdoorSeating = true;
      p.hasLiveMusic = (i % 2 === 0);
      p.hasMenuForChildren = true;
      p.servesCoffee = true;
      p.hasFreeParking = true;
      p.hasWheelchairAccessibleParking = true;
      p.hasWheelchairAccessibleRestroom = true;
      // URLs
      p.googleMapsUri = p.mapsUrl || "https://maps.google.com";
      p.website = p.website || "https://example.com";
      p.directionsUrl = p.directionsUrl || p.googleMapsUri;
      p.reviewsUrl = p.reviewsUrl || p.googleMapsUri;
      return p;
    });
  }

  if (Array.isArray(results)) {
    // Apply filters and sorting to real or mock results
    if (typeof input.filters?.openNow === "boolean") {
      results = results.filter((r) => r.openNow === input.filters.openNow);
    }
    if (Array.isArray(input.filters?.priceLevels) && input.filters.priceLevels.length) {
      const allowed = new Set(input.filters.priceLevels.map((x) => Number(x)));
      results = results.filter((r) => r.priceLevel == null || allowed.has(Number(r.priceLevel)));
    }
    results.sort((a, b) => {
      const da = a.distanceMeters ?? 1e12,
        db = b.distanceMeters ?? 1e12;
      if (da !== db) return da - db;
      const oa = a.openNow === true ? 1 : 0,
        ob = b.openNow === true ? 1 : 0;
      if (oa !== ob) return ob - oa;
      const ra = typeof a.rating === "number" ? a.rating : -1,
        rb = typeof b.rating === "number" ? b.rating : -1;
      return rb - ra;
    });

    const limited = results.slice(0, input.limit);
    // Normalize to requested output keys
    const norm = (r) => {
      const addr = typeof r.address === "string" ? r.address : (r.address ? [r.address.street, r.address.city, r.address.region, r.address.postalCode, r.address.country].filter(Boolean).join(", ") : null);
      const loc = r.location || {};
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
        priceRange: r.priceRange ?? null,
        phoneNumber: r.phoneNumber ?? r.phone ?? null,
        location: { latitude: loc.lat ?? loc.latitude ?? null, longitude: loc.lng ?? loc.longitude ?? null },
        googleMapsUri: r.googleMapsUri ?? r.mapsUrl ?? null,
        websiteUri: r.websiteUri ?? r.website ?? null,
        distanceMeters: r.distanceMeters ?? null,
        isReservable: r.isReservable ?? am.reservations ?? null,
        servesVegetarianFood: r.servesVegetarianFood ?? (r.dietary ? r.dietary.vegetarian : null),
        hasDineIn: r.hasDineIn ?? am.dineIn ?? null,
        hasTakeout: r.hasTakeout ?? r.takeout ?? am.takeout ?? null,
        hasDelivery: r.hasDelivery ?? r.delivery ?? am.delivery ?? null,
        hasRestroom: r.hasRestroom ?? am.restroom ?? null,
        isGoodForGroups: r.isGoodForGroups ?? null,
        isGoodForChildren: r.isGoodForChildren ?? (am.familyFriendly ?? null),
        allowsDogs: r.allowsDogs ?? am.petFriendly ?? null,
        rating: r.rating ?? null,
        acceptsCards: r.acceptsCards ?? payments.cards ?? null,
        acceptsCash: r.acceptsCash ?? payments.cash ?? null,
        hasOutdoorSeating: r.hasOutdoorSeating ?? am.outdoorSeating ?? null,
        hasLiveMusic: r.hasLiveMusic ?? null,
        hasMenuForChildren: r.hasMenuForChildren ?? null,
        servesCoffee: r.servesCoffee ?? null,
        directionsUrl: r.directionsUrl ?? null,
        reviewsUrl: r.reviewsUrl ?? null,
        hasFreeParking: r.hasFreeParking ?? null,
        hasWheelchairAccessibleParking: r.hasWheelchairAccessibleParking ?? null,
        hasWheelchairAccessibleRestroom: r.hasWheelchairAccessibleRestroom ?? null,
        fuelOptions: Array.isArray(r.fuelOptions) ? r.fuelOptions : [],
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
