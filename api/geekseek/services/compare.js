import { OPENAI_MODEL } from "../config.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MAX_ITEMS_DEFAULT = 3; // A vs B vs C
const EMPTY_CELL_VALUE = "";
const MIN_ROWS = 10;
const MAX_ROWS = 15;

const toArray = (value) => (Array.isArray(value) ? value : value != null ? [value] : []);

const fallbackItems = (items = [], max = MAX_ITEMS_DEFAULT) =>
  toArray(items)
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, max);

const stripMarkdownFence = (text = "") => {
  if (!text.trim().startsWith("```")) return text;
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
};

const parseJsonStrict = (rawContent) => {
  const baseText = typeof rawContent === "string" ? rawContent.trim() : "";
  if (!baseText) {
    const err = new Error("OpenAI response was empty");
    err.cause = new Error("EMPTY_CONTENT");
    throw err;
  }
  const candidate = stripMarkdownFence(baseText);
  const clean = candidate
    .replace(/[“”„]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([\]}])/g, "$1");

  const trimmed = (() => {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    return start !== -1 && end !== -1 && end > start ? clean.slice(start, end + 1) : clean;
  })();

  const attemptParse = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const base = attemptParse(trimmed);
  if (base) return base;

  const closers = ["}", "]}"];
  for (const closer of closers) {
    const withCloser = trimmed.endsWith(closer) ? trimmed : `${trimmed}${closer}`;
    const candidateParse = attemptParse(withCloser);
    if (candidateParse) return candidateParse;
  }

  let truncation = trimmed;
  while (truncation.length > 0) {
    truncation = truncation.slice(0, -1);
    if (!truncation.trim()) break;
    const parsed = attemptParse(truncation);
    if (parsed) return parsed;
  }

  const err = new Error("Failed to parse OpenAI JSON response");
  err.snippet = trimmed.slice(0, 500);
  throw err;
};

const sanitizeRows = ({ rows = [], columnKeys = ["A", "B"], maxRows = 6 }) => {
  const normalized = [];
  const seen = new Set();
  const safeRows = Array.isArray(rows) ? rows : [];
  for (const row of safeRows) {
    if (!row || typeof row !== "object") continue;
    if (normalized.length >= maxRows) break;
    const key = String(row.key ?? row.label ?? row.factor ?? "").trim();
    if (!key) continue;
    const values = columnKeys.map((keyName) => {
      const direct = String(row[keyName] ?? row[keyName?.toLowerCase()] ?? row.values?.[columnKeys.indexOf(keyName)] ?? "").trim();
      return direct || EMPTY_CELL_VALUE;
    });
    const identifier = `${row.group ?? ""}::${key}`.toLowerCase();
    if (seen.has(identifier)) continue;
    seen.add(identifier);
    normalized.push({
      label: key,
      group: row.group ?? row.section ?? row.category,
      values,
      source: row.source_url
        ? { url: row.source_url, label: row.source ?? row.source_url }
        : row.source
        ? { url: row.source.url ?? row.source.url, label: row.source.label ?? row.source.name }
        : undefined,
    });
  }
  const columns = ["Factor", ...columnKeys];
  return { columns, rows: normalized };
};

const sanitizeComparisonPayload = ({ payload = {}, items = [], maxRows = 6 }) => {
  const rawRows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.rows)
    ? payload.rows
    : Array.isArray(payload.table?.rows)
    ? payload.table.rows
    : [];

  const modelKeys = Object.keys(payload.models ?? {});
  const columnKeys = modelKeys.length ? modelKeys : ["A", "B"];
  const primaryTable = sanitizeRows({ rows: rawRows, columnKeys, maxRows });
  const fallbackRows =
    primaryTable.rows.length > 0
      ? primaryTable.rows
      : rawRows.map((row) => {
          const label = String(row?.label ?? row?.key ?? "Factor").trim();
          const values = columnKeys.map((keyName, index) => {
            const direct = String(row[keyName] ?? row[keyName?.toLowerCase()] ?? row.values?.[index] ?? "").trim();
            return direct || EMPTY_CELL_VALUE;
          });
          return { label, values };
        });
  const columnLabels = ["Factor", ...columnKeys.map((key, index) => {
    const candidate = payload.models?.[key]?.name ?? `Option ${index + 1}`;
    return String(candidate).trim() || `Option ${index + 1}`;
  })];
  const table = {
    columns: columnLabels,
    rows: fallbackRows,
  };
  const generatedAt =
    payload.timestamp_utc ?? payload.generated_at ?? payload.timestamp ?? new Date().toISOString();

  return {
    table,
    generatedAt,
    models: payload.models ?? {},
  };
};

const buildPrompt = ({
  queryText,
  items,
  locale,
  maxRows,
}) => {
  const [A = "A", B = "B"] = fallbackItems(items, 2);
  const rowLimit = Math.min(Math.max(10, maxRows ?? 10), 15);
  return [
  `Return JSON only; no markdown.`,
  `Schema (strict): {"models":{"A":{"name":"","url":""},"B":{"name":"","url":""}},"rows":[{"key":"Factor","A":"value","B":"value"}]}`,
  `Compare "${A}" vs "${B}"${queryText ? ` for "${queryText}"` : ""}.`,
  `Cover ${rowLimit} comparisons (overview, rating (US Market), specs, experience, economics) with valid stats.`,
  `Limit each value to ≤120 characters.`,
]
    .filter(Boolean)
    .join(" ");
};

const generateComparison = async ({
  apiKey,
  queryText,
  items = [],
  locale = "en",
  maxRows = 20,
  timeoutMs = Number(process.env.GEEKSEEK_COMPARE_TIMEOUT_MS ?? 10000),
  maxCompletionTokens = Number(process.env.GEEKSEEK_COMPARE_MAX_TOKENS ?? 220),
}) => {
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const prompt = buildPrompt({
    queryText,
    items: fallbackItems(items, 2),
    locale,
    maxRows,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Accept-Encoding": "identity",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: "Respond with STRICT JSON ONLY." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        max_completion_tokens: maxCompletionTokens,
        top_p: 1,
        n: 1,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const err = new Error(`OpenAI comparison request failed (${response.status})`);
      err.body = errorBody;
      throw err;
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    const parsed = parseJsonStrict(content);

    return sanitizeComparisonPayload({ payload: parsed, items, maxRows });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("OpenAI comparison request timed out, please simplify the prompt");
      timeoutError.code = "OPENAI_TIMEOUT";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

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
    timeoutMs: Number(process.env.GEEKSEEK_COMPARE_TIMEOUT_MS ?? 10000),
    maxCompletionTokens: Number(process.env.GEEKSEEK_COMPARE_MAX_TOKENS ?? 500),
  });
}
