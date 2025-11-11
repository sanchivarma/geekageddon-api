import {
  DEFAULT_LOCATION,
  DEFAULT_RADIUS_METERS,
  DEFAULT_LANGUAGE,
  DEFAULT_REGION,
  DEFAULT_LIMIT,
  DEFAULT_TYPE,
} from "./config.js";
import { fetchNormalizedPlaces } from "./services/places.js";
import { buildComparison } from "./services/compare.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const TYPE_PLACES = "places";
const TYPE_TECH_COMPARE = "compare.tech";
const TYPE_PRODUCT_COMPARE = "compare.product";
const TYPE_COMPARE = "compare";
const COMPARISON_TYPE_HINTS = new Set([TYPE_COMPARE, TYPE_TECH_COMPARE, TYPE_PRODUCT_COMPARE]);
const RESERVED_TYPES = new Set([TYPE_PLACES, TYPE_COMPARE, TYPE_TECH_COMPARE, TYPE_PRODUCT_COMPARE, "place", "all"]);
const MAX_COMPARISON_ITEMS = 5;
const MIN_COMPARISON_ROWS = 20;
const MAX_COMPARISON_ROWS = 36;
const DEFAULT_COMPARISON_ROWS = 25;
const COMPARISON_KEYWORD_REGEX =
  /\b(compare|comparison|vs\.?|versus|difference\s+(?:between|of)|diff(?:erence)?\s+between|against)\b/i;
const NEAR_ME_REGEX = /\b(near\s*me|around\s*me|nearby|close\s*to\s*me)\b/i;
const LOCATION_CLAUSE_REGEX = /\b(in|at|around|near|within|inside)\s+[A-Za-z]/i;

const applyCors = (res) => {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
};

const parseNumber = (value, fallback) => {
  if (value == null || value === "") return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

const DEFAULT_COUNTRY_COORDS = {
  US: { latitude: 37.0902, longitude: -95.7129 },
  CA: { latitude: 56.1304, longitude: -106.3468 },
  GB: { latitude: 51.5072, longitude: -0.1276 },
  EU: { latitude: 50.1109, longitude: 8.6821 },
  DE: { latitude: 52.52, longitude: 13.405 },
  IN: { latitude: 20.5937, longitude: 78.9629 },
  SG: { latitude: 1.3521, longitude: 103.8198 },
  AU: { latitude: -25.2744, longitude: 133.7751 },
  JP: { latitude: 35.6762, longitude: 139.6503 },
};

const DEFAULT_CITY_COORDS = {
  berlin: { latitude: 52.52, longitude: 13.405 },
  london: { latitude: 51.5072, longitude: -0.1276 },
  newyork: { latitude: 40.7128, longitude: -74.006 },
  sanfrancisco: { latitude: 37.7749, longitude: -122.4194 },
  tokyo: { latitude: 35.6762, longitude: 139.6503 },
  singapore: { latitude: 1.3521, longitude: 103.8198 },
  paris: { latitude: 48.8566, longitude: 2.3522 },
  delhi: { latitude: 28.6139, longitude: 77.209 },
  mumbai: { latitude: 19.076, longitude: 72.8777 },
  bengaluru: { latitude: 12.9716, longitude: 77.5946 },
  sydney: { latitude: -33.8688, longitude: 151.2093 },
  melbourne: { latitude: -37.8136, longitude: 144.9631 },
};

const normalizeCityKey = (value) =>
  typeof value === "string" ? value.trim().toLowerCase().replace(/[\s.'-]/g, "") : "";

const toOrigin = (req) => {
  const query = req.query ?? {};
  const latitude = parseNumber(query.lat, undefined);
  const longitude = parseNumber(query.lng, undefined);
  if (isFiniteNumber(latitude) && isFiniteNumber(longitude)) {
    return { latitude, longitude };
  }

  const headerLat = parseNumber(req.headers?.["x-vercel-ip-latitude"], undefined);
  const headerLng = parseNumber(req.headers?.["x-vercel-ip-longitude"], undefined);
  if (isFiniteNumber(headerLat) && isFiniteNumber(headerLng)) {
    return { latitude: headerLat, longitude: headerLng };
  }

  const cityKey = normalizeCityKey(req.headers?.["x-vercel-ip-city"]);
  if (cityKey && DEFAULT_CITY_COORDS[cityKey]) {
    return DEFAULT_CITY_COORDS[cityKey];
  }

  const countryCode = String(req.headers?.["x-vercel-ip-country"] ?? "")
    .toUpperCase()
    .trim();
  if (countryCode && DEFAULT_COUNTRY_COORDS[countryCode]) {
    return DEFAULT_COUNTRY_COORDS[countryCode];
  }

  if (isFiniteNumber(DEFAULT_LOCATION.latitude) && isFiniteNumber(DEFAULT_LOCATION.longitude)) {
    return { latitude: DEFAULT_LOCATION.latitude, longitude: DEFAULT_LOCATION.longitude };
  }

  return { latitude: 52.520008, longitude: 13.404954 };
};

const parseArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseBool = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  }
  return fallback;
};

const sanitizePlaceTypes = (candidateLists = []) => {
  const collected = [];
  candidateLists.forEach((list) => {
    parseArray(list).forEach((value) => {
      const lowered = value.trim().toLowerCase();
      if (!lowered || RESERVED_TYPES.has(lowered)) return;
      collected.push(lowered);
    });
  });
  return collected.slice(0, 5);
};

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
  const openAIApiKey = process.env.OPENAI_API_KEY;
  const languageCode = req.query.languageCode ?? req.query.locale ?? DEFAULT_LANGUAGE;
  const regionCode = req.query.regionCode ?? DEFAULT_REGION;

  const rawQuery = req.query.q ?? req.query.query ?? "";
  const rawIntent = req.query.intent ?? "";
  const userIntent = rawQuery || rawIntent || "Popular spots near me";
  const placesQuery = rawQuery || "Places near Berlin";
  const itemsFromQuery = extractComparisonItems(req.query);

  const requestedType = normalizeMode(req.query.type ?? req.query.mode ?? DEFAULT_TYPE);
  const effectiveType = requestedType || TYPE_PLACES;
  const endpointType = normalizeMode(req.query.endpoint);
  const shouldCompare =
    isComparisonType(requestedType) ||
    isComparisonType(endpointType) ||
    hasComparisonKeyword(rawQuery) ||
    itemsFromQuery.length >= 2;

  if (shouldCompare) {
    if (!openAIApiKey) {
      return res.status(500).json({
        success: false,
        message: "Missing OPENAI_API_KEY environment variable",
      });
    }
    const comparisonQuery =
      rawQuery || rawIntent || (itemsFromQuery.length ? itemsFromQuery.join(" vs ") : "");
    if (!comparisonQuery) {
      return res.status(400).json({ success: false, message: "Missing comparison prompt (q)" });
    }
    const rowsCandidate = parseNumber(
      req.query.rows ?? req.query.tableRows ?? req.query.compareRows,
      DEFAULT_COMPARISON_ROWS
    );
    const maxRows = clampComparisonRows(rowsCandidate ?? DEFAULT_COMPARISON_ROWS);
    const focus = req.query.focus ?? req.query.preference ?? "";
    const maxItems = Math.max(
      2,
      Math.min(itemsFromQuery.length || MAX_COMPARISON_ITEMS, MAX_COMPARISON_ITEMS)
    );
    try {
      const payload = await buildComparison({
        apiKey: openAIApiKey,
        queryText: comparisonQuery,
        items: itemsFromQuery,
        locale: languageCode,
        focus,
        maxRows,
        maxItems,
      });
      return res.status(200).json({
        success: true,
        type: TYPE_COMPARE,
        query: comparisonQuery,
        focus: focus || undefined,
        table: payload.table,
        generatedAt: payload.generatedAt,
        models: payload.models,
      });
    } catch (error) {
      console.error("[geekseek] comparison error", error);
      return res.status(500).json({
        success: false,
        type: TYPE_COMPARE,
        message: error.message,
        error: process.env.NODE_ENV === "development" ? { stack: error.stack } : undefined,
      });
    }
  }

  if (!googleApiKey) {
    return res.status(500).json({
      success: false,
      message: "Missing GOOGLE_PLACES_API_KEY environment variable",
    });
  }

  const explicitLimit = parseNumber(req.query.limit, undefined);
  const inferredLimit = explicitLimit ?? inferLimitFromQuery(userIntent);
  const limit = Math.max(1, Math.min(inferredLimit ?? DEFAULT_LIMIT, 50));
  const rawRadiusMeters = parseNumber(req.query.radiusMeters ?? req.query.radius, DEFAULT_RADIUS_METERS);
  const radiusMeters = Math.min(Math.max(rawRadiusMeters, 500), 50_000);
  const includedTypes = sanitizePlaceTypes([
    req.query.placeType,
    req.query.placesType,
    req.query.types,
    effectiveType,
    DEFAULT_TYPE,
  ]);
  let origin = toOrigin(req);
  const queryHasCoords =
    req.query.lat != null && req.query.lat !== "" && req.query.lng != null && req.query.lng !== "";
  const hasExplicitLocationPhrase = LOCATION_CLAUSE_REGEX.test(rawQuery || "");
  const hasIPHeaders =
    req.headers?.["x-vercel-ip-latitude"] && req.headers?.["x-vercel-ip-longitude"];

  if (
    openAIApiKey &&
    rawQuery &&
    hasExplicitLocationPhrase &&
    !NEAR_ME_REGEX.test(rawQuery) &&
    !queryHasCoords &&
    !hasIPHeaders
  ) {
    const inferred = await inferLocationFromPrompt(rawQuery, openAIApiKey);
    if (inferred) {
      origin = inferred;
    }
  }
  const envLLMDefault = parseBool(process.env.GEEKSEEK_PLACES_USE_LLM ?? "false", false);
  const requestedLLM = parseBool(
    req.query.enrich ?? req.query.llm ?? req.query.normalize ?? req.query.useLlm,
    envLLMDefault
  );
  const shouldUseLLM = requestedLLM && !!openAIApiKey;

  try {
    const { results, source } = await fetchNormalizedPlaces({
      googleApiKey,
      openAIApiKey: shouldUseLLM ? openAIApiKey : undefined,
      userIntent,
      origin,
      query: placesQuery,
      includedTypes,
      radiusMeters,
      languageCode,
      regionCode,
      limit,
    });
    return res.status(200).json({
      success: true,
      type: TYPE_PLACES,
      count: results.length,
      message: results.length ? "ok" : "no results",
      origin,
      limit,
      radiusMeters,
      languageCode,
      regionCode,
      includedTypes,
      source,
      llm: {
        enabled: shouldUseLLM,
      },
      items: results,
    });
  } catch (error) {
    console.error("[geekseek] handler error", error);
    return res.status(500).json({
      success: false,
      message: error.message,
      error: {
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
    });
  }
}

function normalizeMode(value) {
  if (Array.isArray(value)) return normalizeMode(value[0]);
  if (!value) return "";
  return String(value).trim().toLowerCase();
}

function inferLimitFromQuery(text) {
  if (!text) return undefined;
  const match = String(text).match(/\b(\d{1,3})\b/);
  if (!match) return undefined;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return undefined;
  return value;
}

function hasComparisonKeyword(text) {
  if (!text) return false;
  return COMPARISON_KEYWORD_REGEX.test(String(text));
}

function isComparisonType(value) {
  if (!value) return false;
  return COMPARISON_TYPE_HINTS.has(value);
}

function extractComparisonItems(query = {}) {
  const pools = [
    query.items,
    query.targets,
    query.products,
    query.options,
    query.versus,
    query.vs,
    query.compare,
  ];
  const seen = new Set();
  const result = [];
  pools.forEach((pool) => {
    parseArray(pool).forEach((entry) => {
      const normalized = entry.toLowerCase();
      if (seen.has(normalized)) return;
      seen.add(normalized);
      result.push(entry);
    });
  });
  return result.slice(0, MAX_COMPARISON_ITEMS);
}

function clampComparisonRows(value) {
  if (!Number.isFinite(value)) return DEFAULT_COMPARISON_ROWS;
  return Math.max(MIN_COMPARISON_ROWS, Math.min(value, MAX_COMPARISON_ROWS));
}

async function inferLocationFromPrompt(prompt, apiKey) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract the primary city or region mentioned in the user prompt and return JSON {\"latitude\": number, \"longitude\": number}. If uncertain, respond with {}.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    if (isFiniteNumber(parsed?.latitude) && isFiniteNumber(parsed?.longitude)) {
      return { latitude: parsed.latitude, longitude: parsed.longitude };
    }
  } catch (error) {
    console.error("[geekseek] location inference failed", error);
  }
  return null;
}
