// ShopForge — Centralized API Client
// Native Fetch API wrapper with JWT auth, 401 handling, and response validation.
// NO Axios. fetch() only.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

let accessToken = null;

/**
 * Persist the current access token in memory.
 * Call this after login / token-refresh to keep subsequent requests authenticated.
 *
 * @param {string|null} token - JWT access token (or null to clear).
 */
export function setAccessToken(token) {
  accessToken = token;
}

/**
 * Return the current in-memory access token.
 *
 * @returns {string|null}
 */
export function getAccessToken() {
  return accessToken;
}

// ---------------------------------------------------------------------------
// 401 handler — a single callback the app can register (e.g. redirect to
// login, clear auth store, attempt a silent refresh, etc.)
// ---------------------------------------------------------------------------

/** @type {(() => void) | null} */
let onUnauthorized = null;

/**
 * Register a callback that fires whenever the server returns 401.
 * Typically wired up once in the root component / auth store.
 *
 * @param {() => void} handler
 */
export function setOnUnauthorized(handler) {
  onUnauthorized = handler;
}

// ---------------------------------------------------------------------------
// Custom API error
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  /**
   * @param {string}  message  Human-readable error message.
   * @param {number}  status   HTTP status code.
   * @param {*}       data     Parsed response body (if any).
   */
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// ---------------------------------------------------------------------------
// Core request helper
// ---------------------------------------------------------------------------

/**
 * Generic request function that every HTTP helper delegates to.
 *
 * @param {string}         endpoint  Path appended to BASE_URL (e.g. "/products").
 * @param {RequestInit}    options   Standard fetch options (method, body, headers …).
 * @returns {Promise<any>}           Parsed JSON response body.
 * @throws {ApiError}                On non-2xx responses or network failures.
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  // ---- Build headers -------------------------------------------------------
  const headers = new Headers(options.headers);

  // Default to JSON content-type unless the caller is sending FormData
  // (fetch sets the correct multipart boundary automatically for FormData).
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Attach JWT bearer token when available.
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // ---- Execute fetch -------------------------------------------------------
  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // always send HTTP-only cookies
    });
  } catch (networkError) {
    // Network-level failure (offline, DNS, CORS pre-flight block, etc.)
    throw new ApiError(
      networkError instanceof Error
        ? networkError.message
        : "Network request failed",
      0,
    );
  }

  // ---- Handle 401 globally -------------------------------------------------
  if (response.status === 401) {
    if (typeof onUnauthorized === "function") {
      onUnauthorized();
    }
    throw new ApiError("Unauthorized — please log in again.", 401);
  }

  // ---- Parse response body -------------------------------------------------
  let data = null;

  const contentType = response.headers.get("Content-Type") || "";

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      throw new ApiError("Invalid JSON in response body.", response.status);
    }
  } else if (response.status !== 204) {
    // 204 No Content has no body — anything else that isn't JSON is returned
    // as plain text so callers can still inspect it.
    data = await response.text();
  }

  // ---- Reject non-2xx responses --------------------------------------------
  if (!response.ok) {
    // FastAPI typically returns { "detail": "…" } on errors.
    const message =
      (data && typeof data === "object" && data.detail) ||
      (typeof data === "string" && data) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, data);
  }

  return data;
}

// ---------------------------------------------------------------------------
// Convenience HTTP helpers
// ---------------------------------------------------------------------------

/**
 * @param {string}       endpoint
 * @param {RequestInit}  [options]
 */
export function get(endpoint, options = {}) {
  return request(endpoint, { ...options, method: "GET" });
}

/**
 * @param {string}       endpoint
 * @param {*}            body      Will be JSON-stringified unless it is FormData.
 * @param {RequestInit}  [options]
 */
export function post(endpoint, body, options = {}) {
  return request(endpoint, {
    ...options,
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

/**
 * @param {string}       endpoint
 * @param {*}            body
 * @param {RequestInit}  [options]
 */
export function put(endpoint, body, options = {}) {
  return request(endpoint, {
    ...options,
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

/**
 * @param {string}       endpoint
 * @param {*}            body
 * @param {RequestInit}  [options]
 */
export function patch(endpoint, body, options = {}) {
  return request(endpoint, {
    ...options,
    method: "PATCH",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

/**
 * Named `del` because `delete` is a reserved word in JavaScript.
 *
 * @param {string}       endpoint
 * @param {RequestInit}  [options]
 */
export function del(endpoint, options = {}) {
  return request(endpoint, { ...options, method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Default export — convenient single import
// ---------------------------------------------------------------------------

const api = { get, post, put, patch, del, setAccessToken, getAccessToken, setOnUnauthorized, ApiError };
export default api;
