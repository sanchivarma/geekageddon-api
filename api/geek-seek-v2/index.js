import { DEFAULT_LOCATION, DEFAULT_RADIUS_METERS, DEFAULT_LANGUAGE, DEFAULT_REGION, DEFAULT_LIMIT, DEFAULT_TYPE } from "./config.js";
import { fetchNormalizedPlaces } from "./services/geekSeekV2.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const limit = Math.max(1, Math.min( parseNumber(req.query.limit, DEFAULT_LIMIT), 20 ));
  const rawRadiusMeters = parseNumber(req.query.radiusMeters ?? req.query.radius, DEFAULT_RADIUS_METERS);
  const radiusMeters = Math.min(Math.max(rawRadiusMeters, 0), 50_000);
  const languageCode = req.query.languageCode ?? DEFAULT_LANGUAGE;
  const regionCode = req.query.regionCode ?? DEFAULT_REGION;
  const parsedTypes = parseArray(req.query.type ?? DEFAULT_TYPE);
  const includedTypes = parsedTypes.slice(0, 5);
  const userIntent = req.query.q ?? req.query.intent ?? `Pharmacies near Berlin`; // default
  const googleApiKey = 'AIzaSyAem4GVpE9gI1Lj_f1AhuXRyMPB8kTW7zk';
  const openAIApiKey = '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';

  if (!googleApiKey) {
    return res.status(500).json({
      success: false,
      message: "Missing GOOGLE_PLACES_API_KEY environment variable",
    });
  }

  try {
    const origin = toOrigin(req.query);
    const query = req.query.query ?? req.query.q ?? "Places in Berlin";
    const { results, source } = await fetchNormalizedPlaces({
      googleApiKey,
      openAIApiKey,
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
      count: results.length,
      message: results.length ? "ok" : "no results",
      origin,
      limit,
      radiusMeters,
      source,
      items: results,
    });
  } catch (error) {
    console.error("[geek-seek-v2] handler error", error);
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
