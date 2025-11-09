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
  const persona = "You are a neutral analyst who produces crisp comparison tables for any subjects the user provides.";
  const domain = "generic cross-domain comparisons (products, services, policies, locations, ideas, etc.)";
  const styleNotes = [
    "Select the 20 most decision-ready comparison factors implied by the prompt.",
    "Keep every table cell under 140 characters and prefer concrete or numeric facts.",
    "Group rows logically (overview, experience, economics, metrics, outlook) but adapt to the subject.",
    "Cite reputable public sources for each factor (docs, analyst reports, government/open data).",
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
