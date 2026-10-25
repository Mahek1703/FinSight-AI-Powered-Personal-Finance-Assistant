/**
 * FinSight Frontend Environment Configuration & Startup Validator
 * Lists all required VITE_* environment variables and validates them once at application boot.
 */

export const REQUIRED_ENV_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

export const OPTIONAL_ENV_VARS = [
  "VITE_API_URL",
  "VITE_GOOGLE_CLIENT_ID",
];

/**
 * Validates environment configuration.
 * Returns an object with { isValid: boolean, missing: string[] }.
 */
export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !import.meta.env[key]);

  // In production, VITE_API_URL must also be present
  if (!import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
    missing.push("VITE_API_URL");
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}
