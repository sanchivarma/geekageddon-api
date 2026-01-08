import { aggregateTechNews, SOURCE_CATALOG } from "../../lib/geekfeed/aggregator.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const applyCors = (res) => {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
};

const parseSourceIds = (value) => {
  if (!value) return undefined;
  const list = Array.isArray(value) ? value : value.split(",");
  return list
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);
};

const parseLimit = (value) => {
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num) || num <= 0) return 10;
  return Math.min(num, 25);
};

const buildMeta = (result) => ({
  availableSources: SOURCE_CATALOG.map(({ fetch, ...meta }) => meta),
  summary: result.summary,
  taxonomy: result.taxonomy,
});

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  const limit = parseLimit(req.query?.limit);
  const sourceIds = parseSourceIds(req.query?.source);
  const enabledToggles = parseSourceIds(req.query?.enable);
  try {
    const result = await aggregateTechNews({ limitPerSource: limit, sourceIds, enabledToggles });
    const hasErrors = result.sources?.some((s) => s.status === "error");
    const status = hasErrors && result.success ? 207 : result.success ? 200 : 503;
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=300");
    return res.status(status).json({
      success: result.success,
      fetchedAt: result.fetchedAt,
      limitPerSource: result.limitPerSource,
      totalItems: result.totalItems,
      message: result.summary?.errorMessages?.[0] ?? null,
      sources: result.sources,
      taxonomy: result.taxonomy,
      items: result.items,
      meta: buildMeta(result),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error: {
        message: error.message,
      },
    });
  }
}
