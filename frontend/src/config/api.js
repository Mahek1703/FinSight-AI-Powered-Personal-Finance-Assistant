/**
 * API Configuration
 *
 * Resolves base backend URL dynamically from environment variables.
 * Localhost is strictly permitted during local Vite development (import.meta.env.DEV).
 * In production, if VITE_API_URL is missing, it logs an error and prevents fallback to localhost.
 */

const fromEnv = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

if (!fromEnv && !import.meta.env.DEV) {
  console.error(
    "CRITICAL CONFIGURATION ERROR: VITE_API_URL is not set. All backend API calls will fail. Please set VITE_API_URL in your deployment environment settings."
  );
}

export const API_BASE_URL =
  fromEnv || (import.meta.env.DEV ? "http://localhost:5000" : "");

export const getApiBaseUrl = () => {
  if (!API_BASE_URL) {
    throw new Error(
      "Backend API URL is not configured. Please ensure VITE_API_URL is provided in production."
    );
  }
  return API_BASE_URL;
};
