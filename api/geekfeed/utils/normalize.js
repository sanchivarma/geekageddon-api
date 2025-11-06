import { createHash } from "node:crypto";
import { extractKeywords, dedupeStrings, toIsoDate } from "./text.js";

const hashString = (...parts) => {
  const hash = createHash("sha256");
  for (const part of parts) {
    if (!part) continue;
    hash.update(String(part));
  }
  return hash.digest("hex");
};

const normalizeDate = (value) => {
  if (!value) return null;
  const iso = toIsoDate(value);
  return iso;
};

export const normalizeItem = ({
  sourceId,
  sourceName,
  sourceUrl,
  sourceType,
  id,
  url,
  title,
  summary,
  rawSummary,
  author,
  publishedAt,
  categories = [],
  tags = [],
  badges = [],
  imageUrl = null,
  language = null,
  score = null,
  extras = {},
  raw = undefined,
}) => {
  const canonicalId = id || hashString(sourceId, title, url, publishedAt);
  const keywords = extractKeywords(`${title ?? ""} ${summary ?? ""}`);
  const normalizedTags = dedupeStrings([...tags, ...categories, ...keywords]);
  const normalizedBadges = dedupeStrings(badges);
  return {
    id: canonicalId,
    source: {
      id: sourceId,
      name: sourceName,
      type: sourceType,
      url: sourceUrl ?? null,
    },
    title: title?.trim() ?? null,
    url: url ?? null,
    summary: summary?.trim() ?? null,
    rawSummary: rawSummary ?? null,
    author: author ?? null,
    publishedAt: normalizeDate(publishedAt),
    categories: dedupeStrings(categories),
    tags: normalizedTags,
    badges: normalizedBadges,
    imageUrl,
    language,
    score,
    extras,
    raw,
  };
};

export const mergeAndDedupe = (items = []) => {
  const byUrl = new Map();
  const byId = new Map();
  for (const item of items) {
    if (!item) continue;
    const key = item.url ?? item.id;
    if (key && !byUrl.has(key)) {
      byUrl.set(key, item);
    } else if (item.id && !byId.has(item.id)) {
      byId.set(item.id, item);
    }
  }
  const merged = [...byUrl.values(), ...byId.values()].filter(Boolean);
  const seen = new Set();
  return merged.filter((item) => {
    const key = item.id || item.url;
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const toTimestamp = (value) => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
};

export const sortByRecency = (items = []) =>
  [...items].sort((a, b) => toTimestamp(b?.publishedAt) - toTimestamp(a?.publishedAt));