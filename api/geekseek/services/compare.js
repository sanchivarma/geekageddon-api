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
  "Telemetry / Analytics & Observability",
  "Scalability & Capacity Limits",
];

const STATS_FACTORS = [
  "Environmental / Operating Limits",
  "Roadmap & Release Cadence",
  "Adoption / Market Share Signals",
  "Notable Customers / References",
  "Cost of Ownership & Upgrades",
];

const COMPARISON_ASPECTS = [...DETAIL_FACTORS, ...TECH_FACTORS, ...STATS_FACTORS];

export async function buildComparison({
  apiKey,
  queryText,
  items = [],
  locale = "en",
  focus,
  maxRows = 25,
  maxItems = 5,
}) {
  return generateComparison({
    apiKey,
    queryText,
    items,
    locale,
    focus,
    maxRows,
    maxItems,
    extraAspects: COMPARISON_ASPECTS,
    persona: "You are a senior research analyst who produces decisive comparison tables for both technical and consumer stakeholders",
    domain: "hardware devices, consumer electronics, SaaS products, developer platforms, and infrastructure services",
    styleNotes: [
      "Return at least twenty comparison factor rows ordered in three blocks: general details first, deep technical traits next, quantitative stats last",
      "Provide concrete or numeric statistics whenever possible (release year, version, size in mm, grams, GHz, Mbps, hours of battery life, ratings)",
      "Use concise, neutral language suitable for executive decision briefings and cite trustworthy sources in the links list",
      "Highlight any latest-version changes, roadmap signals, or differentiating benchmarks directly in the relevant rows",
    ],
  });
}
