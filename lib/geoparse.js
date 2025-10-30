// Lightweight NLQ heuristics to detect location intent like "near me" or "in <place>"

export function detectNearbyIntent(text) {
  if (!text) return false;
  const s = text.toLowerCase();
  return [
    "near me",
    "around me",
    "nearby",
    "close to me",
    "closest to me",
  ].some((p) => s.includes(p));
}

export function extractLocationText(text) {
  if (!text) return undefined;
  const s = text.trim();

  // Basic patterns like: "in Paris", "at London", "around Berlin", "near Times Square"
  const m = s.match(/\b(?:in|at|around|near)\s+([^.,;]+)(?:[.,;]|$)/i);
  if (m && m[1]) return m[1].trim();

  // Fallback: return undefined (client can provide lat/lng or we can ask for it)
  return undefined;
}

