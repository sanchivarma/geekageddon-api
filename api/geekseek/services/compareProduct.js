import { generateComparison } from "./comparisonBase.js";

const PRODUCT_ASPECTS = [
  'Release Year & Model',
  'Dimensions & Weight',
  'Market Price & Value',
  'Customer Reviews & Ratings',
  'Performance Ratings',
  'Customer Support & Service',
  'Customizability & Options',
  'Customer Base Stats',
  "Build Quality & Materials",
  "Industrial Design & Ergonomics",
  "Core Feature Set",
  "Performance & Benchmarks",
  "Battery Life / Power Efficiency",
  "Connectivity & Protocol Support",
  "Smart Assistant / Ecosystem Tie-ins",
  "Software Updates & Roadmap",
  "Service & Warranty",
  "Repairability & Sustainability",
  "Accessories & Third-party Ecosystem",
  "Price Tiers / Bundles",
  "Subscription or Ongoing Costs",
  "Privacy & Data Policies",
  "Localization & Regional Availability",
  "Logistics & Delivery SLAs",
];

export async function buildProductComparison({
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
    extraAspects: PRODUCT_ASPECTS,
    persona: "You are a pragmatic product researcher who helps buyers pick the right product quickly",
    domain: "consumer electronics, SaaS subscriptions, productivity apps, and hardware gadgets",
    styleNotes: [
      "Prioritize buyer-relevant specs: price, warranty, ecosystem lock-in, support",
      "Use neutral tone and short sentences that can be rendered in product cards",
      "Reference reputable reviews, vendor FAQs, teardown reports",
      "List every meaningful differentiator you can derive; expand the comparison table with as many relevant factors as possible",
      "Ensure the table outputs at least 20 ranked factor rows when data permits",
      "Attach quantitative stats whenever available (battery hours, grams, dB ratings, MSRP ranges, warranty years, subscription fees)",
    ],
  });
}
