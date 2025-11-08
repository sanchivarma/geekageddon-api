import { OPENAI_MODEL } from "../config.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MAX_ITEMS_DEFAULT = 5;
const EMPTY_CELL_VALUE = "--";
const DEFAULT_ASPECT_PRIORITY = [
  'Latest Version & Release Date',
  'Usability rating (1-5)',
  'Performance rating (1-5)',
  'Customer support rating (1-5)',
  "Market Presence & Industry Recognition",
  "User adoption Statistics",
  "Release Cadence & Update Frequency",
  "Pricing Model & Cost Efficiency",
  "Target Audience & Ideal Users",
  "Core Functionality & Capabilities",
  "Differentiators & Unique Selling Points",
  "System Requirements",
  "Technical Specifications",
  "Integration & Compatibility",
  "Maintenance & Updates",
  "Vendor Reputation & Reliability",
  "User Base & Adoption",
  "Popularity & Market Share",
  "Primary Use Cases",
  "Architecture & Deployment Model",
  "Hardware / Infrastructure",
  "Performance & Benchmarks",
  "Software & Features",
  "Ecosystem & Integrations",
  "Security & Compliance",
  "Data Governance & Residency",
  "Observability & Telemetry",
  "Developer Experience & Tooling",
  "Operational Complexity",
  "Scalability & Elasticity",
  "Pricing & Licensing",
  "Support & Service",
  "Community & Reviews",
  "Migration & Lock-in",
  "Roadmap & Longevity",
];

const ensureArray = (value) => (Array.isArray(value) ? value : value != null ? [value] : []);

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fallbackItems = (items = [], max = MAX_ITEMS_DEFAULT) =>
  ensureArray(items)
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, max);

const sanitizeLinks = (links = []) =>
  ensureArray(links)
    .map((link) => ({
      label: String(link?.label ?? link?.title ?? "Source").trim(),
      url: String(link?.url ?? link?.href ?? "").trim(),
      reason: link?.reason ? String(link.reason).trim() : undefined,
    }))
    .filter((link) => link.url);

const sanitizeHighlights = (highlights = [], items = []) =>
  ensureArray(highlights)
    .map((entry, index) => ({
      item: String(entry?.item ?? items[index] ?? items[0] ?? "").trim(),
      summary: String(entry?.summary ?? entry?.headline ?? "").trim(),
      bullets: ensureArray(entry?.bullets ?? entry?.points ?? entry?.takeaways)
        .map((line) => String(line).trim())
        .filter(Boolean)
        .slice(0, 4),
      links: sanitizeLinks(entry?.links),
    }))
    .filter((entry) => entry.item || entry.summary || entry.bullets.length);

const ensureAspectCoverage = (rows, columnCount, requiredAspects = DEFAULT_ASPECT_PRIORITY) => {
  const existing = new Set(rows.map((row) => row.label.toLowerCase()));
  const filled = [...rows];
  for (const aspect of requiredAspects) {
    const key = aspect.toLowerCase();
    if (existing.has(key)) continue;
    filled.push({
      label: aspect,
      values: Array.from({ length: columnCount }, () => EMPTY_CELL_VALUE),
    });
  }
  return filled;
};

const sortRowsByPriority = (rows, requiredAspects = DEFAULT_ASPECT_PRIORITY) => {
  const orderMap = new Map(requiredAspects.map((label, index) => [label.toLowerCase(), index]));
  return [...rows].sort((a, b) => {
    const aIndex = orderMap.has(a.label.toLowerCase()) ? orderMap.get(a.label.toLowerCase()) : requiredAspects.length;
    const bIndex = orderMap.has(b.label.toLowerCase()) ? orderMap.get(b.label.toLowerCase()) : requiredAspects.length;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.label.localeCompare(b.label);
  });
};

const sanitizeTable = ({ table = {}, items = [], maxRows = 6, requiredAspects = DEFAULT_ASPECT_PRIORITY }) => {
  const canonicalItems = items.length ? items : ["Option A", "Option B"];
  const columns = ["Factor", ...canonicalItems];
  const normalizedRows = ensureArray(table.rows)
    .map((row) => ({
      label: String(row?.label ?? row?.aspect ?? "").trim() || "Factor",
      values: ensureArray(row?.values ?? row?.items)
        .slice(0, canonicalItems.length)
        .map((value) => String(value ?? "").trim()),
    }))
    .filter((row) => row.values.some(Boolean) || row.label);
  const deduped = [];
  const seen = new Set();
  for (const row of normalizedRows) {
    const key = row.label.toLowerCase();
    if (seen.has(key)) continue;
    const values = row.values.length === canonicalItems.length
      ? row.values
      : [...row.values, ...Array(Math.max(0, canonicalItems.length - row.values.length)).fill(EMPTY_CELL_VALUE)];
    deduped.push({ label: row.label, values });
    seen.add(key);
  }
  const withMandatory = ensureAspectCoverage(deduped, canonicalItems.length, requiredAspects);
  const ordered = sortRowsByPriority(withMandatory, requiredAspects).slice(0, maxRows);
  return { columns, rows: ordered };
};

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

const sanitizeComparisonPayload = ({
  payload = {},
  items = [],
  maxRows = 6,
  maxItems = MAX_ITEMS_DEFAULT,
  requiredAspects = DEFAULT_ASPECT_PRIORITY,
}) => {
  const normalizedItems = fallbackItems(payload.items?.length ? payload.items : items, maxItems);
  const table = sanitizeTable({
    table: payload.table ?? {},
    items: normalizedItems,
    maxRows,
    requiredAspects,
  });
  const tableHtml = buildTableHtml(table);
  const highlights = sanitizeHighlights(payload.highlights, normalizedItems);
  const links = sanitizeLinks(payload.links ?? payload.resources ?? payload.sources);
  const summary = String(payload.summary ?? payload.verdict ?? "").trim();
  return {
    items: normalizedItems,
    table: { ...table, html: tableHtml },
    highlights,
    links,
    summary,
    description: tableHtml,
  };
};

const buildPrompt = ({
  persona,
  domain,
  styleNotes,
  queryText,
  items,
  locale,
  focus,
  maxRows,
  maxItems,
  requiredAspects = DEFAULT_ASPECT_PRIORITY,
}) => {
  const uniqueAspects = mergeAspectList(requiredAspects);
  const payload = {
    query: queryText,
    requestedItems: fallbackItems(items, maxItems),
    locale,
    focus,
    requiredAspects: uniqueAspects,
  };
  const schema = {
    items: ["Item name"],
    table: {
      columns: ["Factor", "Item A", "Item B"],
      rows: [{ label: "Hardware", values: ["Item A detail", "Item B detail"] }],
    },
    highlights: [
      {
        item: "Item A",
        summary: "One sentence headline",
        bullets: ["Actionable insight 1", "Actionable insight 2"],
        links: [{ label: "Deep dive", url: "https://example.com/link" }],
      },
    ],
    links: [{ label: "Official site", url: "https://example.com", reason: "Docs" }],
    summary: "One paragraph verdict with recommendation",
  };
  return [
    `${persona}. You specialize in ${domain}.`,
    "Respond ONLY with strict JSON that matches the schema provided.",
    "Comparison rows must prioritize the most popular / market-moving factors first.",
    `Mandatory aspects to cover (in priority order): ${uniqueAspects.join(", ")}.`,
    "Mention additional aspects (ecosystem, roadmap, integrations) if relevant.",
    styleNotes.length ? `Style notes: ${styleNotes.join("; ")}` : "",
    "Input payload:",
    JSON.stringify(payload, null, 2),
    "Return STRICT JSON matching this schema (no Markdown and no prose outside JSON):",
    JSON.stringify(schema, null, 2),
    `Cap the table at ${maxRows} rows and ${maxItems} compared items.`,
    "Always cite reputable hardware/software benchmarks or product review sources in the links array.",
  ]
    .filter(Boolean)
    .join("\n");
};

const mergeAspectList = (additional = []) => {
  const merged = [...DEFAULT_ASPECT_PRIORITY];
  ensureArray(additional).forEach((item) => {
    const label = String(item ?? "").trim();
    if (!label) return;
    if (!merged.some((existing) => existing.toLowerCase() === label.toLowerCase())) {
      merged.push(label);
    }
  });
  return merged;
};

export async function generateComparison({
  apiKey,
  persona,
  domain,
  styleNotes = [],
  queryText,
  items = [],
  locale = "en",
  focus,
  maxRows = 6,
  maxItems = MAX_ITEMS_DEFAULT,
  extraAspects = [],
}) {
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  const requiredAspects = mergeAspectList(extraAspects);
  const prompt = buildPrompt({
    persona,
    domain,
    styleNotes,
    queryText,
    items,
    locale,
    focus,
    maxRows,
    maxItems,
    requiredAspects,
  });
  console.log("[geekseek] comparison request", {
    domain,
    items: fallbackItems(items, maxItems),
    locale,
    maxRows,
  });
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: "You respond ONLY with strict JSON. No prose." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  console.log("[geekseek] comparison response", {
    status: response.status,
    ok: response.ok,
  });
  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error(`OpenAI comparison request failed (${response.status})`);
    error.body = errorBody;
    throw error;
  }
  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content ?? "{}";
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    const err = new Error("Failed to parse OpenAI comparison JSON");
    err.cause = error;
    throw err;
  }
  return sanitizeComparisonPayload({ payload: parsed, items, maxRows, maxItems, requiredAspects });
}
