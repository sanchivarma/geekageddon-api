const DEFAULT_TIMEOUT_MS = 10000;

const buildUrl = (baseUrl, query = {}) => {
  if (!query || Object.keys(query).length === 0) return baseUrl;
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, v));
    } else {
      url.searchParams.append(key, value);
    }
  }
  return url.toString();
};

const withTimeout = (timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timer };
};

const normalizeHeaders = (headers = {}) => {
  const normalized = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value == null) continue;
    normalized.set(key, value);
  }
  return normalized;
};

export async function fetchJson(url, options = {}) {
  const {
    query,
    method = "GET",
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    body,
    ...rest
  } = options;

  const requestUrl = buildUrl(url, query);
  const { controller, timer } = withTimeout(timeoutMs);
  try {
    const response = await fetch(requestUrl, {
      method,
      headers: headers ? normalizeHeaders(headers) : undefined,
      signal: controller.signal,
      body,
      ...rest,
    });

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new Error(`Failed to parse JSON for ${requestUrl}: ${error.message}`);
      }
    }

    if (!response.ok) {
      throw new Error(`Request to ${requestUrl} failed with status ${response.status}`);
    }

    return { data, status: response.status, url: requestUrl, headers: response.headers };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Request to ${requestUrl} timed out after ${timeoutMs}ms`);
    }
    throw new Error(`[fetchJson] ${error.message}`);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchText(url, options = {}) {
  const { query, method = "GET", headers, timeoutMs = DEFAULT_TIMEOUT_MS, body, ...rest } = options;
  const requestUrl = buildUrl(url, query);
  const { controller, timer } = withTimeout(timeoutMs);
  try {
    const response = await fetch(requestUrl, {
      method,
      headers: headers ? normalizeHeaders(headers) : undefined,
      signal: controller.signal,
      body,
      ...rest,
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Request to ${requestUrl} failed with status ${response.status}`);
    }

    return { text, status: response.status, url: requestUrl, headers: response.headers };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Request to ${requestUrl} timed out after ${timeoutMs}ms`);
    }
    throw new Error(`[fetchText] ${error.message}`);
  } finally {
    clearTimeout(timer);
  }
}

export { DEFAULT_TIMEOUT_MS };