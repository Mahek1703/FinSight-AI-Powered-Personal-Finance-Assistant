import { API_BASE_URL } from "../config/api.js";
import { auth } from "../firebase.js";

/**
 * Event emitter for slow backend requests (e.g. Render free-tier cold boot).
 */
const slowListeners = new Set();

export const subscribeApiSlowStatus = (callback) => {
  if (typeof callback === "function") {
    slowListeners.add(callback);
    return () => slowListeners.delete(callback);
  }
  return () => {};
};

const notifySlowStatus = (isSlow, message = "") => {
  slowListeners.forEach((listener) => {
    try {
      listener(isSlow, message);
    } catch {
      // ignore
    }
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("finsight:api-slow", {
        detail: { isSlow, message },
      })
    );
  }
};

/**
 * Centralized authenticated fetch client for backend requests.
 * Handles base URL resolution, token attachment & refresh, slow request notifications,
 * request timeouts, and structured error status mapping (401, 429, 5xx).
 *
 * @param {string} path - Endpoint path (e.g., "/api/ai/scan-receipt")
 * @param {RequestInit & { timeoutMs?: number }} [options={}] - Standard fetch options with timeout
 * @returns {Promise<Response>}
 */
export async function apiFetch(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error(
      "Backend API URL is not configured. Please check VITE_API_URL in production environment variables."
    );
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;
  const timeoutMs = options.timeoutMs || 60000; // 60s timeout for Render free tier wakeups

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Attach and refresh Firebase ID token
  try {
    const user = auth?.currentUser;
    if (user && typeof user.getIdToken === "function") {
      try {
        const token = await user.getIdToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      } catch {
        // Force refresh if standard retrieval fails
        const freshToken = await user.getIdToken(true);
        if (freshToken) {
          headers["Authorization"] = `Bearer ${freshToken}`;
        }
      }
    }
  } catch (tokenErr) {
    console.warn("Unable to attach auth bearer token:", tokenErr?.message || tokenErr);
  }

  // Setup timeout and slow-response notifications
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error("Request timed out. The AI backend is taking too long to respond."));
  }, timeoutMs);

  // If request takes longer than 3.5s, signal Render wake-up state to UI
  const slowTimer = setTimeout(() => {
    notifySlowStatus(
      true,
      "AI is waking up, please wait (free-tier servers may take 30-45s)..."
    );
  }, 3500);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);
    clearTimeout(slowTimer);
    notifySlowStatus(false, "");

    // 401 Unauthorized -> Trigger sign-out and notify user
    if (response.status === 401) {
      try {
        if (auth?.currentUser) {
          await auth.signOut();
        }
      } catch {
        // ignore
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("finsight:auth-expired", {
            detail: { message: "Please log in again." },
          })
        );
      }
      const err = new Error("Session expired or unauthorized. Please log in again.");
      err.status = 401;
      throw err;
    }

    // 429 Rate Limit
    if (response.status === 429) {
      const err = new Error("Too many requests, try again in a minute.");
      err.status = 429;
      throw err;
    }

    // 5xx Server Error
    if (response.status >= 500) {
      let serverMsg = "";
      try {
        const errJson = await response.clone().json();
        serverMsg = errJson.message || errJson.error || "";
      } catch {
        // fallback
      }
      const err = new Error(
        serverMsg || `Backend server error (${response.status}). Please try again shortly.`
      );
      err.status = response.status;
      throw err;
    }

    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    clearTimeout(slowTimer);
    notifySlowStatus(false, "");

    if (err.name === "AbortError" || controller.signal.aborted) {
      const timeoutErr = new Error(
        "Request timed out. The server might still be waking up. Please retry."
      );
      timeoutErr.isTimeout = true;
      throw timeoutErr;
    }

    if (
      (typeof navigator !== "undefined" && !navigator.onLine) ||
      err.message?.includes("Failed to fetch") ||
      err.message?.includes("NetworkError")
    ) {
      const netErr = new Error(
        "Unable to reach the backend server. Please verify your internet connection or retry."
      );
      netErr.isNetworkError = true;
      throw netErr;
    }

    throw err;
  }
}
