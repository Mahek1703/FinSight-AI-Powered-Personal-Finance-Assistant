import { getGmailMessages } from "../services/gmail.service.js";

/**
 * Controller to connect Gmail via Google OAuth access token,
 * search and parse real purchase/receipt emails,
 * and return structured financial transaction objects to the client.
 */
export const connectGmail = async (req, res) => {
  try {
    const { accessToken, userId } = req.body || {};

    if (!accessToken || typeof accessToken !== "string" || !accessToken.trim()) {
      return res.status(400).json({
        success: false,
        count: 0,
        message: "Google access token is required to fetch purchase receipts.",
        transactions: [],
      });
    }

    if (accessToken.length > 4096) {
      return res.status(400).json({
        success: false,
        count: 0,
        message: "Invalid access token length.",
        transactions: [],
      });
    }

    // Fetch & parse authentic purchase emails from Gmail API
    const rawTransactions = await getGmailMessages(accessToken.trim());
    const transactions = (rawTransactions || []).map((t) => ({
      ...t,
      userId: userId || req.user?.uid || null,
    }));
    const count = transactions.length;

    if (count === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        message: "No purchase or receipt emails detected in your mailbox.",
        transactions: [],
      });
    }

    return res.status(200).json({
      success: true,
      count,
      message: `Retrieved ${count} purchase receipts from Gmail.`,
      transactions,
    });
  } catch (error) {
    console.error("Gmail Controller Error:", error.code || error.message || "Unknown error");

    const isAuthError =
      error.status === 401 ||
      error.code === 401 ||
      error.message?.includes("invalid_grant") ||
      error.message?.includes("Invalid Credentials");

    const statusCode = isAuthError ? 401 : 500;
    const errorMessage = isAuthError
      ? "Gmail access token is invalid or has expired. Please reconnect your Gmail account."
      : error.message || "Failed to connect Gmail and extract purchase emails.";

    return res.status(statusCode).json({
      success: false,
      count: 0,
      message: errorMessage,
      transactions: [],
    });
  }
};

export const fetchGmailTransactions = connectGmail;

export default {
  connectGmail,
  fetchGmailTransactions,
};