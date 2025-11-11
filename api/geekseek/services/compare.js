import { generateComparison } from "./comparisonBase.js";

const MIN_ROWS = 15;
const MAX_ROWS = 20;

export async function buildComparison({
  apiKey,
  queryText,
  items = [],
  locale = "en",
  focus,
  maxRows = 20,
  maxItems = 5,
}) {
  const persona = "You are a neutral analyst who produces crisp human-like comparison tables";
  const domain = "Generic cross-domain comparisons (products, services, policies, locations, ideas, etc.)";
  const styleNotes = [
    "Select most decision-ready comparison factors implied by the prompt.",
    "Keep every table cell under 200 characters and provide relevant facts.",
    "Group rows logically (overview, rating, version, price, technical details, hardware/software details, reviews, experience, metrics) as applicable and relevant.",
  ];
  const enforcedRows = Math.max(MIN_ROWS, Math.min(maxRows, MAX_ROWS));

  return generateComparison({
    apiKey,
    queryText,
    items,
    locale,
    focus,
    maxRows: enforcedRows,
    maxItems,
    persona,
    domain,
    styleNotes,
    timeoutMs: Number(process.env.GEEKSEEK_COMPARE_TIMEOUT_MS ?? 25000),
    maxCompletionTokens: Number(process.env.GEEKSEEK_COMPARE_MAX_TOKENS ?? 700),
  });
}
