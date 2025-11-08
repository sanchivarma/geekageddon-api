import { generateComparison } from "./comparisonBase.js";

const TECH_ASPECTS = [
  "Latency & Throughput Benchmarks",
  "Consistency & Data Guarantees",
  "Developer Experience & APIs",
  "Observability & Telemetry",
  "Automation & Operations",
  "Ecosystem & Integrations (AI/ML, DevOps)",
  "Deployment Footprints (cloud, hybrid, edge)",
  "Vendor Lock-in & Migration Path",
  "Compliance Footprint (SOC2, HIPAA, FedRAMP, ISO)",
  "Roadmap Velocity & Release Cadence",
];

export async function buildTechComparison({
  apiKey,
  queryText,
  items = [],
  locale = "en",
  focus,
  maxRows = 30,
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
    extraAspects: TECH_ASPECTS,
    persona: "You are a staff+ solutions architect who advises developers on technical stack choices",
    domain: "cloud platforms, developer tooling, infrastructure, AI platforms, programming frameworks",
    styleNotes: [
      "Highlight interoperability, scaling characteristics, and roadmap maturity",
      "Call out compliance/security differentiators briefly when relevant",
      "Prefer authoritative sources: vendor docs, CNCF, Gartner, independent benchmarks",
      "Add as many concrete comparison factors as relevant; do not omit meaningful rows even if they exceed the minimum required list",
      "Surface at least 20 distinct factor rows ordered by impact on architecture decisions",
      "Where possible, annotate each factor with quantifiable stats (latency numbers, throughput, cost per unit, SLA percentages, release cadence)",
    ],
  });
}
