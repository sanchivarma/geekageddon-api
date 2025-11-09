import { OPENAI_MODEL } from "../config.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MAX_ITEMS_DEFAULT = 2; // A vs B
const EMPTY_CELL_VALUE = "--";

// New, minimal target schema
// Model must return: { "rows": [ { "key": "Factor", "A": "value", "B": "value" }, ... ] }
const RESPONSE_SCHEMA = {
  rows: [{ key: "Factor", A: "Value for A", B: "Value for B" }],
};

const toArray = (value) => (Array.isArray(value) ? value : value != null ? [value] : []);
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fallbackItems = (items = [], max = MAX_ITEMS_DEFAULT) =>
  toArray(items)
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, max);

const buildTableHtml = ({ columns, rows }) => {
  const header = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr><th scope="row">${escapeHtml(row.label)}</th>${row.values
          .map((value) => `<td>${escapeHtml(value || EMPTY_CELL_VALUE)}</td>`)
          .join("")}</tr>`
    )
    .join("");
  return `<table class="geekseek-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
};

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
  try {
    return JSON.parse(candidate);
  } catch (primaryError) {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const trimmed = candidate.slice(start, end + 1);
      try {
        return JSON.parse(trimmed);
      } catch {
        // fall through to final error
      }
    }
    const err = new Error("Failed to parse OpenAI JSON response");
    err.cause = primaryError;
    err.snippet = candidate.slice(0, 500);
    throw err;
  }
};

// Normalize model output (rows[{key,A,B}]) into table html + echo rows
const sanitizeRows = (rows = [], items = []) => {
  const [itemA = "A", itemB = "B"] = items.length === 2 ? items : ["A", "B"];
  const normalized = toArray(rows)
    .map((r) => ({
      key: String(r?.key ?? r?.label ?? "").trim(),
      A: String(r?.A ?? r?.a ?? "").trim(),
      B: String(r?.B ?? r?.b ?? "").trim(),
    }))
    .filter((r) => r.key);

  const seen = new Set();
  const deduped = [];
  for (const r of normalized) {
    const k = r.key.toLowerCase();
    if (seen.has(k)) continue;
    deduped.push({
      label: r.key,
      values: [r.A || EMPTY_CELL_VALUE, r.B || EMPTY_CELL_VALUE],
    });
    seen.add(k);
  }

  const columns = ["Key", itemA, itemB];
  return { columns, rows: deduped };
};

const sanitizeComparisonPayload = ({ payload = {}, items = [], maxRows = 6 }) => {
  // Accept either { rows:[...] } or a bare array [...]
  const rows = Array.isArray(payload) ? payload : payload.rows;
  const normalizedItems = fallbackItems(items, 2);
  const table = sanitizeRows(rows, normalizedItems);

  // Enforce max rows and build HTML
  const clipped = { columns: table.columns, rows: table.rows.slice(0, maxRows) };
  const tableHtml = buildTableHtml(clipped);

  return {
    items: normalizedItems,
    rows: (rows || []).slice(0, maxRows), // raw rows echo for direct use
    table: { ...clipped, html: tableHtml },
    summary: "", // no summary in this minimal mode
    description: tableHtml,
  };
};

// Super-short, fast prompt builder
const buildPrompt = ({
  queryText,
  items,
  locale,
  maxRows,
}) => {
  const [A = "A", B = "B"] = fallbackItems(items, 2);
  // One tight instruction block → low tokens, faster completion.
  return [
    `Return JSON only, no markdown, no prose.`,
    `Format: {"rows":[{"key":"Factor","A":"value","B":"value"}]}`,
    `Compare "${A}" vs "${B}"${queryText ? ` for "${queryText}"` : ""}.`,
    `Produce at most ${Math.max(10, Math.min(20, maxRows || 6))} rows.`,
    `Prefer concise, non-marketed phrasing (≤ 8 words per value).`,
    `Common factors: Link, Overall Rating (1-5), Price, Performance, Features, Ease of Use, Ecosystem, Learning Curve, Support, When to Choose ${A}, When to Choose ${B}.`,
    `Use "${EMPTY_CELL_VALUE}" if unknown.`,
    locale ? `Locale: ${locale}.` : ``,
  ]
    .filter(Boolean)
    .join(" ");
};

export async function generateComparison({
  apiKey,
  persona,        // kept for signature compatibility (unused in fast mode)
  domain,         // kept for signature compatibility (unused in fast mode)
  styleNotes = [],// kept for signature compatibility (unused in fast mode)
  queryText,
  items = [],
  locale = "en",
  focus,          // kept for signature compatibility (unused in fast mode)
  maxRows = 6,
  maxItems = MAX_ITEMS_DEFAULT, // kept for signature compatibility (unused in fast mode)
  timeoutMs = Number(process.env.GEEKSEEK_COMPARE_TIMEOUT_MS ?? 1000), // ~1s budget
  maxCompletionTokens = Number(process.env.GEEKSEEK_COMPARE_MAX_TOKENS ?? 220), // smaller = faster
}) {
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const prompt = buildPrompt({
    queryText,
    items: fallbackItems(items, 2),
    locale,
    maxRows,
  });

  // Minimal logging to reduce overhead
  console.log("[geekseek] compare", { items: fallbackItems(items, 2), maxRows });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // Small perf gain on Node: disable compression negotiation overhead
        // (OpenAI already responds quickly to small prompts)
        // Note: OK to omit; kept here for clarity.
        "Accept-Encoding": "identity",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: "Respond with STRICT JSON ONLY. Do not include code fences or text." },
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
}

/**
 * Example user-facing prompt pattern (if you need one elsewhere):
 * "iPhone 16 vs Galaxy S24 — return JSON only as:
 *  {\"rows\":[{\"key\":\"Price\",\"A\":\"...\",\"B\":\"...\"}, ...]}.
 *  Max 8 words per value, use \"--\" if unknown."
 */
