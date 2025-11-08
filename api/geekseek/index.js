import {
  DEFAULT_LOCATION,
  DEFAULT_RADIUS_METERS,
  DEFAULT_LANGUAGE,
  DEFAULT_REGION,
  DEFAULT_LIMIT,
  DEFAULT_TYPE,
} from "./config.js";
import { fetchNormalizedPlaces } from "./services/places.js";
import { buildTechComparison } from "./services/compareTech.js";
import { buildProductComparison } from "./services/compareProduct.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const TYPE_PLACES = "places";
const TYPE_TECH_COMPARE = "compare.tech";
const TYPE_PRODUCT_COMPARE = "compare.product";
const COMPARISON_TYPES = new Set([TYPE_TECH_COMPARE, TYPE_PRODUCT_COMPARE]);
const RESERVED_TYPES = new Set([TYPE_PLACES, TYPE_TECH_COMPARE, TYPE_PRODUCT_COMPARE, "place", "all"]);

const applyCors = (res) => {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
};

const parseNumber = (value, fallback) => {
  if (value == null || value === "") return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toOrigin = (query) => {
  const latitude = parseNumber(query.lat, DEFAULT_LOCATION.latitude);
  const longitude = parseNumber(query.lng, DEFAULT_LOCATION.longitude);
  return { latitude, longitude };
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

  const requestedType = normalizeMode(req.query.type ?? req.query.mode ?? DEFAULT_TYPE);
  const endpointType = normalizeMode(req.query.endpoint);
  const comparisonType = [requestedType, endpointType].find((value) => COMPARISON_TYPES.has(value));

  if (comparisonType) {
    if (!openAIApiKey) {
      return res.status(500).json({
        success: false,
        message: "Missing OPENAI_API_KEY environment variable",
      });
    }
    const query = req.query.q ?? req.query.query ?? "";
    if (!query) {
      return res.status(400).json({ success: false, message: "Missing comparison prompt (q)" });
    }
    const builder = comparisonType === TYPE_TECH_COMPARE ? buildTechComparison : buildProductComparison;
    try {
      const payload = await builder({
        apiKey: openAIApiKey,
        queryText: query,
        items: parseArray(req.query.items ?? req.query.targets ?? ""),
        locale: languageCode,
        focus: req.query.focus ?? "",
      });
      const description = payload.description ?? payload.table?.html ?? "";
      return res.status(200).json({
        success: true,
        type: comparisonType,
        query,
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
        type: comparisonType,
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

  const userIntent = req.query.q ?? req.query.intent ?? "Popular spots near me";
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
  const origin = toOrigin(req.query);
  const query = req.query.query ?? req.query.q ?? "Places near Berlin";
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
      query,
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
