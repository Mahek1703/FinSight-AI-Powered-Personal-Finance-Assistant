const API_URL = "http://localhost:5000/api/gmail";

/**
 * Send the Google OAuth access token to the backend.
 * The backend will use it to access Gmail.
 */
export const connectGmail = async (accessToken, userId = null) => {
  try {
    const response = await fetch(`${API_URL}/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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