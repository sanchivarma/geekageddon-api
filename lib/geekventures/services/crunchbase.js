// Crunchbase is paid; we only expose a stub that reports missing API key.

export async function fetchCrunchbase({ limit = 50, apiKey = process.env.CRUNCHBASE_API_KEY } = {}) {
  if (!apiKey) {
    return { success: false, items: [], error: "Crunchbase API key not provided (paid API)" };
  }
  // Placeholder to avoid calling paid API unintentionally.
  return { success: false, items: [], error: "Crunchbase integration not implemented in this environment" };
}
