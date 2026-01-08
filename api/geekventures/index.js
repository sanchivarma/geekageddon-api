import fs from "fs";
import path from "path";
import { fetchYCombinator } from "../../lib/geekventures/services/ycombinator.js";
import { fetchProductHunt } from "../../lib/geekventures/services/productHunt.js";
import { fetchCrunchbase } from "../../lib/geekventures/services/crunchbase.js";
import { fetchCompaniesApi } from "../../lib/geekventures/services/companiesApi.js";
import { fetchGeekLeapsLocal } from "../../lib/geekventures/services/geekLeapsLocal.js";
import { fetchIntellizence } from "../../lib/geekventures/services/intellizence.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const applyCors = (res) => {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
};

const parseLimit = (value, fallback = 50) => {
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num) || num <= 0) return fallback;
  return Math.min(num, 100);
};

const normalizeTerm = (value) => String(value ?? "").trim().toLowerCase();

const filterItems = (items, search, categories) => {
  const term = normalizeTerm(search);
  return items.filter((item) => {
    const matchesTerm =
      !term ||
      item.name.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.categories.some((c) => c.toLowerCase().includes(term));
    const matchesCategory =
      !categories.length ||
      categories.some((cat) => item.categories.map((c) => c.toLowerCase()).includes(cat.toLowerCase()));
    return matchesTerm && matchesCategory;
  });
};

const sortItems = (items, sort) => {
  if (sort === "year") return [...items].sort((a, b) => (b.yearFounded || 0) - (a.yearFounded || 0));
  return [...items].sort((a, b) => (b.signalScore || 0) - (a.signalScore || 0));
};

const loadLocalVentures = () => {
  const filePath = path.join(process.cwd(), "api", "geekventures", "data", "geekventures.json");
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return Array.isArray(raw) ? raw : [];
  } catch (error) {
    console.error("[geekventures] failed to parse geekventures.json", error);
    return [];
  }
};

const dedupeByName = (items = []) => {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    const key = String(item.name ?? "").trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });
  return result;
};

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const limit = parseLimit(req.query.limit, 50);
  const search = req.query.q ?? req.query.query ?? "";
  const categories = (req.query.category ?? req.query.tag ?? req.query.topic ?? "")
    .toString()
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
  const sort = (req.query.sort ?? "signal").toString().toLowerCase();
  const type = (req.query.type ?? "").toString().toLowerCase();

  const datasetMap = {
    "mna": "mna",
    "fundraising": "fundraising",
    "layoff": "layoff",
    "data-breach": "data-breach",
  };
  const intellizenceDataset = datasetMap[type];

  const intellPromise = intellizenceDataset
    ? fetchIntellizence({ dataset: intellizenceDataset, limit })
    : Promise.resolve({ success: false, items: [], error: "intellizence dataset not requested" });

  const localVentures = loadLocalVentures();

  const [yc, ph, cb, tcapi, geekLocal, intel] = await Promise.all([
    fetchYCombinator({ limit, mode: "top" }),
    fetchProductHunt({ limit }),
    fetchCrunchbase({ limit }),
    fetchCompaniesApi({ limit }),
    fetchGeekLeapsLocal({ limit }),
    intellPromise,
  ]);

  const combined = [
    ...localVentures,
    ...(geekLocal.items || []),
    ...(yc.items || []),
    ...(ph.items || []),
    ...(cb.items || []),
    ...(tcapi.items || []),
    ...(intel.items || []),
  ];
  const filtered = filterItems(dedupeByName(combined), search, categories);
  const sorted = sortItems(filtered, sort).slice(0, limit);

  const errors = [yc, ph, cb, tcapi, geekLocal, intel].filter((r) => r.success === false).map((r) => r.error);

  return res.status(errors.length ? 207 : 200).json({
    success: true,
    count: sorted.length,
    total: filtered.length,
    limit,
    query: search || undefined,
    categories: categories.length ? categories : undefined,
    sort,
    items: sorted,
    sources: {
      geekVentures: { success: true, error: null },
      geekLeaps: { success: geekLocal.success, error: geekLocal.error },
      ycombinator: { success: yc.success, error: yc.error },
      productHunt: { success: ph.success, error: ph.error },
      crunchbase: { success: cb.success, error: cb.error },
      companiesApi: { success: tcapi.success, error: tcapi.error },
      intellizence: { success: intel.success, error: intel.error, dataset: intellizenceDataset },
    },
  });
}
