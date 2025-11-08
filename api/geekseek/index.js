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

const applyCors = (res) => {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
};

const parseNumber = (value, fallback) => {
  if (value == null || value === "") return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

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

  if (isFiniteNumber(DEFAULT_LOCATION.latitude) && isFiniteNumber(DEFAULT_LOCATION.longitude)) {
    return { latitude: DEFAULT_LOCATION.latitude, longitude: DEFAULT_LOCATION.longitude };
  }

  return { latitude: 0, longitude: 0 };
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
      const description = payload.description ?? payload.table?.html ?? "";
      return res.status(200).json({
        success: true,
        type: TYPE_COMPARE,
        query: comparisonQuery,
        focus: focus || undefined,
        items: payload.items,
        table: payload.table,
        description,
        highlights: payload.highlights,
        links: payload.links,
        summary: payload.summary,
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
    requestedType,
    DEFAULT_TYPE,
  ]);
  const origin = toOrigin(req);
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
