import { generateComparison } from "./comparisonBase.js";

const MIN_ROWS = 15;
const MAX_ROWS = 20;

export async function buildComparison({
  apiKey,
  queryText,
  items = [],
  locale = "en",
  maxRows = 20,
}) {
  const enforcedRows = Math.max(MIN_ROWS, Math.min(maxRows, MAX_ROWS));

  return generateComparison({
    apiKey,
    queryText,
    items,
    locale,
    maxRows: enforcedRows,
    timeoutMs: Number(process.env.GEEKSEEK_COMPARE_TIMEOUT_MS ?? 25000),
    maxCompletionTokens: Number(process.env.GEEKSEEK_COMPARE_MAX_TOKENS ?? 600),
  });
}
