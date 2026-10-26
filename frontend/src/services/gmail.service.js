import { apiFetch } from "./apiClient.js";

/**
 * Send the Google OAuth access token to the backend.
 * The backend will use it to access Gmail and parse recent transactions.
 */
export const connectGmail = async (accessToken, userId = null) => {
  try {
    const response = await apiFetch("/api/gmail/connect", {
      method: "POST",
      body: JSON.stringify({
        accessToken,
        userId,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to connect Gmail");
    }

    return data;
  } catch (error) {
    console.error("Gmail Service Error:", error);
    throw error;
  }
};