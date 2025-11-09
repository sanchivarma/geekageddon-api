import { generateComparison } from "./comparisonBase.js";

const DETAIL_FACTORS = [
  "Overview & Positioning",
  "Latest Release / Version",
  "Release Year & Support Horizon",
  "Launch Pricing / Licensing Model",
  "MSRP / Subscription Tiers",
  "Warranty & Support SLA",
  "User Ratings & Sentiment",
  "Target Persona / Use Cases",
  "Dimensions & Footprint",
  "Weight & Materials",
];

const TECH_FACTORS = [
  "Core Architecture / Platform",
  "Hardware Specs (CPU / GPU / Sensors)",
  "Battery / Power Envelope",
  "Performance Benchmarks",
  "Networking & I/O Options",
  "Software / Firmware Stack",
  "Automation / Integration Hooks",
  "Security & Compliance Features",
  "Telemetry & Observability",
  "Scalability & Capacity Limits",
];

const STATS_FACTORS = [
  "Environmental / Operating Limits",
  "Roadmap & Release Cadence",
  "Adoption / Market Share Signals",
  "Notable Customers / References",
  "Cost of Ownership & Upgrades",
];

const TECH_PRODUCT_FACTORS = [...DETAIL_FACTORS, ...TECH_FACTORS, ...STATS_FACTORS];

const TECH_KEYWORDS =
  /\b(api|sdk|framework|platform|database|db|vector|ml|ai|tensor|gpu|cpu|chip|processor|server|cloud|infra|devops|kubernetes|docker|microservice|pipeline|model|embedding|runtime|cli|library|sdk)\b/i;
const PRODUCT_KEYWORDS =
  /\b(device|phone|smartphone|camera|headphone|earbud|laptop|notebook|tablet|watch|smartwatch|monitor|tv|television|router|console|gadget|appliance|printer|speaker|projector|lens|car|ev|vehicle|bike|drone|vacuum)\b/i;
const PRODUCT_TOKENS = /\b(pro|max|mini|ultra|plus|series|gen|mk|edition|air|studio|gear|one|s\d+|x\d+)\b/i;

const detectContext = (queryText = "", items = []) => {
  const haystack = [queryText, ...items].filter(Boolean).join(" ").toLowerCase();
  if (TECH_KEYWORDS.test(haystack)) return "tech";
  if (PRODUCT_KEYWORDS.test(haystack)) return "product";
  return "generic";
};

export async function buildComparison({
  apiKey,
  queryText,
  items = [],
  locale = "en",
  focus,
  maxRows = 25,
  maxItems = 5,
}) {
  const context = detectContext(queryText, items);
  let persona =
    "You are a senior research analyst who produces decisive comparison tables for both technical and consumer stakeholders";
  let domain = "hardware devices, consumer electronics, SaaS products, developer platforms, and infrastructure services";
  let styleNotes = [
    "Return at least twenty-five comparison factor rows ordered in three blocks: general details, deep technical traits, quantitative stats",
    "Provide concrete or numeric statistics whenever possible (release year, size in mm, grams, GHz, Mbps, hours of battery life, ratings)",
    "Use concise, neutral language suitable for executive decision briefings and cite trustworthy sources in the links list",
    "Highlight any latest-version changes, roadmap signals, or differentiating benchmarks directly in the relevant rows",
  ];
  let extraAspects = TECH_PRODUCT_FACTORS;
  let includeDefaultAspects = false;
  let enforcedRows = Math.max(maxRows, 25);

  if (context === "generic") {
    persona =
      "You are a senior research facilitator who adapts comparison criteria to any subject matter (products, services, policies, locales)";
    domain = "general purpose comparisons across consumer, technical, policy, civic, or experiential domains";
    styleNotes = [
      "Infer the most decision-ready factors from the prompt; do not assume the items are products or software unless stated",
      "Output at least twenty-five rows, grouped logically (identity/context, experience, economics, measurable outcomes, long-term outlook)",
      "Prefer quantitative or ranked statistics when available (scores, % change, dollars, units, durations)",
      "Cite trustworthy public links (government data, standards bodies, analyst reports, reputable media) that back the metrics",
    ];
    extraAspects = [];
    includeDefaultAspects = false;
  } else if (context === "tech") {
    styleNotes = [
      "Return at least twenty-five comparison factors: describe the product briefly, then deep technical traits, then quantitative benchmarks and roadmap outlook",
      "Surface concrete figures whenever available (latency ms, throughput ops/s, VRAM GB, availability SLA, release year, pricing tiers)",
      "Highlight differentiators such as ecosystem integrations, compliance posture, automation maturity, or AI acceleration",
      "Cite credible technical references (vendor docs, CNCF/Gartner reports, benchmark studies, open-source repos)",
    ];
    extraAspects = TECH_PRODUCT_FACTORS;
  } else if (context === "product") {
    styleNotes = [
      "Return at least twenty-five comparison factors covering design, features, performance, ownership experience, and quantitative stats",
      "Always include measurable specs (dimensions, weight, battery life, warranty years, price bands, ratings)",
      "Call out unique experience factors such as ecosystem lock-in, app/library availability, accessories, or service options",
      "Reference reputable review labs, teardown reports, or vendor documentation in links",
    ];
    extraAspects = TECH_PRODUCT_FACTORS;
  }

  return generateComparison({
    apiKey,
    queryText,
    items,
    locale,
    focus,
    maxRows: enforcedRows,
    maxItems,
    extraAspects,
    includeDefaultAspects,
    persona,
    domain,
    styleNotes,
  });
}
