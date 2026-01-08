const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "with",
  "that",
  "from",
  "this",
  "have",
  "has",
  "about",
  "your",
  "their",
  "into",
  "what",
  "when",
  "where",
  "will",
  "would",
  "could",
  "should",
  "been",
  "being",
  "them",
  "they",
  "there",
  "then",
  "than",
  "also",
  "over",
  "under",
  "while",
  "within",
  "per",
  "each",
  "more",
  "most",
  "such",
  "some",
  "like",
  "just",
  "into",
  "onto",
  "make",
  "made",
  "using",
  "use",
  "used",
  "via",
  "tech",
  "technology",
  "news",
]);

const sanitizeText = (input = "") =>
  input
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export const extractKeywords = (text, max = 12) => {
  if (!text) return [];
  const sanitized = sanitizeText(text);
  const words = sanitized.split(/\s+/).filter(Boolean);
  const scores = new Map();
  for (const word of words) {
    if (word.length < 3) continue;
    if (STOP_WORDS.has(word)) continue;
    const count = scores.get(word) ?? 0;
    scores.set(word, count + 1);
  }
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
};

export const dedupeStrings = (values = []) => {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (!value) continue;
    const key = value.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value.trim());
  }
  return result;
};

export const toIsoDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};