import React, { useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { apiFetch } from "../services/apiClient";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GmailConnectionButton = ({ onTransactionsLoaded, onError, existingIds = [] }) => {
  const tokenClientRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google?.accounts?.oauth2) {
        initializeGoogle();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;

      script.onload = initializeGoogle;
      script.onerror = () => {
        console.error("Failed to load Google Identity Services SDK");
        if (onError) {
          onError("Failed to load Google OAuth SDK. Please check your internet connection.");
        }
      };

      document.body.appendChild(script);
    };

    const initializeGoogle = () => {
      if (!window.google?.accounts?.oauth2) return;

      if (!CLIENT_ID) {
        console.warn("FinSight AI Notice: VITE_GOOGLE_CLIENT_ID is not configured in .env");
      }

      tokenClientRef.current =
        window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: "https://www.googleapis.com/auth/gmail.readonly",

          callback: async (response) => {
            if (response.error) {
              console.error("Google OAuth Error:", response);
              setLoading(false);
              if (onError) {
                onError(response.error_description || response.error || "Google authentication was cancelled.");
              }
              return;
            }

            try {
              const accessToken = response.access_token;
              const currentUid = auth.currentUser?.uid || null;

              const result = await apiFetch("/api/gmail/connect", {
                method: "POST",
                body: JSON.stringify({
                  accessToken,
                  userId: currentUid,
                  existingIds: existingIds || [],
                }),
              });

              const data = await result.json();

              if (!result.ok || !data.success) {
                throw new Error(
                  data.message || "Failed to extract purchase emails from Gmail."
                );
              }

              setConnected(true);

              if (onTransactionsLoaded) {
                onTransactionsLoaded(data);
              }
            } catch (error) {
              console.error("FinSight AI: Gmail connection error:", error);
              if (onError) {
                onError(error.message || "Failed to connect Gmail and extract emails.");
              }
            } finally {
              setLoading(false);
            }
          },
        });
    };

    loadGoogleScript();
  }, [onTransactionsLoaded, onError, existingIds]);

  const connectGmail = () => {
    if (!tokenClientRef.current) {
      console.warn("Google authentication is still loading. Please try again.");
      if (onError) {
        onError("Google OAuth is still initializing. Please wait a second and try again.");
      }
      return;
    }

    setLoading(true);

    tokenClientRef.current.requestAccessToken({
      prompt: "consent",
    });
  };

  return (
    <button
      onClick={connectGmail}
      disabled={loading}
      type="button"
      style={{
        padding: "12px 20px",
        borderRadius: "12px",
        border: "1px solid #00d084",
        background: connected ? "#123d2d" : "#00d084",
        color: connected ? "#00d084" : "#000",
        fontWeight: "700",
        fontSize: "14px",
        cursor: loading ? "wait" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.2s ease",
      }}
    >
      {loading
        ? "Scanning Mailbox..."
        : connected
        ? "✓ Gmail Connected"
        : "Connect Gmail"}
    </button>
  );
};

export default GmailConnectionButton;