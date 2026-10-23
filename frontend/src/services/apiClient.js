import { API_BASE_URL } from "../config/api.js";
import { auth } from "../firebase.js";

/**
 * Centralized fetch helper for backend requests.
 * Handles base URL resolution, headers, and Firebase ID token attachment.
 *
 * @param {string} path - Endpoint path (e.g., "/api/ai/scan-receipt")
 * @param {RequestInit} [options={}] - Standard fetch options
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

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  try {
    const user = auth?.currentUser;
    if (user && typeof user.getIdToken === "function") {
      const token = await user.getIdToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch (tokenErr) {
    console.warn("Unable to attach auth bearer token:", tokenErr?.message || tokenErr);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
