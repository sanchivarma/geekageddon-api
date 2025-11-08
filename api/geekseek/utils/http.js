const DEFAULT_TIMEOUT_MS = 12000;

const abortableFetch = async (url, options = {}) => {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...rest } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: signal ?? controller.signal, ...rest });
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

export async function fetchJson(url, options = {}) {
  const { expectedStatus = 200, ...rest } = options;
  const response = await abortableFetch(url, rest);
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error(`[fetchJson] Failed to parse JSON from ${url}: ${error.message}`);
    }
  }
  if (expectedStatus != null && response.status !== expectedStatus) {
    const err = new Error(`[fetchJson] Unexpected status ${response.status} for ${url}`);
    err.status = response.status;
    err.body = data ?? text;
    throw err;
  }
  return { data, response };
}

export { DEFAULT_TIMEOUT_MS };