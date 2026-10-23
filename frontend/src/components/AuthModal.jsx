import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import {
  FaApple,
  FaChartLine,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { batchAddTransactions } from "../services/firestore";
import { apiFetch } from "../services/apiClient";

function AuthModal({
  showForm,
  setShowForm,
  isLoginOpen,
  setIsLoginOpen,
  setIsLoggedIn,
  setShowDashboard,
}) {
  const navigate = useNavigate();
  const isOpen = Boolean(showForm ?? isLoginOpen);

  const [isSignup, setIsSignup] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const googleSignInInProgress = useRef(false);

  if (!isOpen) return null;

  const closeModal = () => {
    if (typeof setIsLoginOpen === "function") {
      setIsLoginOpen(false);
    }
    if (typeof setShowForm === "function") {
      setShowForm(false);
    }
    setShowForgot(false);
    setIsSignup(false);
    setError("");
  };

  const finishAuth = async (user = null) => {
    if (typeof setIsLoggedIn === "function") {
      setIsLoggedIn(true);
    }
    if (typeof setShowDashboard === "function") {
      setShowDashboard(true);
    }
    closeModal();
    navigate("/dashboard");
  };

  const handleLogin = async () => {
    if (loading) return;
    if (!email.trim() || !password) {
      setError("Enter email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Clear any stale temporary email session cache upon fresh login
      try {
        sessionStorage.removeItem("gmailAccessToken");
      } catch (cErr) {
        console.warn("Cache reset:", cErr);
      }

      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (rememberMe) {
        try {
          localStorage.setItem("finsightRememberEmail", email.trim());
        } catch (e) {
          console.warn("Storage warning:", e);
        }
      }
      await finishAuth(cred?.user);
    } catch (err) {
      console.error("Login Error:", err);
      const isAuthCredentialErr =
        err?.code === "auth/invalid-credential" ||
        err?.code === "auth/user-not-found" ||
        err?.code === "auth/wrong-password";
      const msg = isAuthCredentialErr
        ? "Incorrect email or password."
        : typeof err?.message === "string"
        ? err.message
        : typeof err === "string"
        ? err
        : "Incorrect email or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (loading) return;
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Clear any stale temporary email session cache upon fresh signup
      try {
        sessionStorage.removeItem("gmailAccessToken");
      } catch (cErr) {
        console.warn("Cache reset:", cErr);
      }

      const credentials = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      if (credentials?.user) {
        await updateProfile(credentials.user, { displayName: name.trim() });
      }
      await finishAuth(credentials?.user);
    } catch (err) {
      console.error("Signup Error:", err);
      const isEmailInUse = err?.code === "auth/email-already-in-use";
      const msg = isEmailInUse
        ? "This email is already registered."
        : typeof err?.message === "string"
        ? err.message
        : typeof err === "string"
        ? err
        : "Signup failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Safe Google OAuth Login with bulletproof try-catch error handling
   * Catches origin mismatch, popup closed by user, popup blocked, and backend errors.
   */
  const handleGoogleLogin = async () => {
    if (loading || googleSignInInProgress.current) return;

    try {
      googleSignInInProgress.current = true;
      setLoading(true);
      setError("");

      // Clear any stale temporary email session cache upon fresh login
      try {
        sessionStorage.removeItem("gmailAccessToken");
      } catch (cErr) {
        console.warn("Cache reset:", cErr);
      }

      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      provider.addScope("https://www.googleapis.com/auth/gmail.readonly");

      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupError) {
        console.error("Google Sign-In Popup Error:", popupError);

        const errorCode = popupError?.code || "";
        const errorMessage = String(popupError?.message || "");

        // 1. Check for origin mismatch errors
        if (
          errorCode === "auth/unauthorized-domain" ||
          errorCode === "auth/invalid-origin" ||
          errorCode === "origin_mismatch" ||
          errorMessage.toLowerCase().includes("origin_mismatch") ||
          errorMessage.toLowerCase().includes("origin mismatch") ||
          errorMessage.toLowerCase().includes("unauthorized domain") ||
          errorMessage.toLowerCase().includes("auth/unauthorized-domain")
        ) {
          setError(
            "Authentication failed due to origin mismatch. Please check Authorized Origins."
          );
          return;
        }

        // 2. Check for user closing popup
        if (errorCode === "auth/popup-closed-by-user") {
          setError("Sign-in popup was closed. Please try again.");
          return;
        }

        // 3. Check for cancelled popup
        if (errorCode === "auth/cancelled-popup-request") {
          setError("Sign-in was cancelled.");
          return;
        }

        // 4. Check for blocked popup
        if (errorCode === "auth/popup-blocked") {
          setError("Popup was blocked by your browser. Please allow popups for this site.");
          return;
        }

        setError(errorMessage || "Google sign-in failed. Please try again.");
        return;
      }

      if (!result?.user) {
        setError("Unable to complete Google sign-in. Please try again.");
        return;
      }

      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (accessToken) {
        try {
          sessionStorage.setItem("gmailAccessToken", accessToken);
        } catch (storageErr) {
          console.warn("Session storage warning:", storageErr);
        }

        try {
          const gmailResponse = await apiFetch("/api/gmail/connect", {
            method: "POST",
            body: JSON.stringify({
              accessToken,
              userId: result.user.uid,
            }),
          });

          if (gmailResponse.ok) {
            const gmailData = await gmailResponse.json();
            console.log("Gmail connected successfully:", gmailData);
          }
        } catch (backendErr) {
          console.warn(
            "Gmail background sync unavailable or backend offline:",
            backendErr.message
          );
        }
      }

      await finishAuth(result.user);
    } catch (err) {
      console.error("Google OAuth Fatal Error:", err);
      const errorCode = err?.code || "";
      const errorMsg = String(err?.message || "");

      if (
        errorCode === "auth/unauthorized-domain" ||
        errorCode === "origin_mismatch" ||
        errorMsg.toLowerCase().includes("origin_mismatch") ||
        errorMsg.toLowerCase().includes("origin mismatch") ||
        errorMsg.toLowerCase().includes("unauthorized domain")
      ) {
        setError(
          "Authentication failed due to origin mismatch. Please check Authorized Origins."
        );
      } else if (errorCode === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed. Please try again.");
      } else {
        setError(errorMsg || "Authentication failed. Please try again.");
      }
    } finally {
      googleSignInInProgress.current = false;
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (loading) return;
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await sendPasswordResetEmail(auth, email.trim());
      alert("Password reset email sent successfully.");
      setShowForgot(false);
    } catch (err) {
      console.error("Password Reset Error:", err);
      const msg =
        typeof err?.message === "string"
          ? err.message
          : typeof err === "string"
          ? err
          : "Failed to send reset email.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal authPage"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="signupBox authModal">
        <button
          className="closeBtn"
          type="button"
          onClick={closeModal}
          aria-label="Close modal"
        >
          <FaTimes />
        </button>

        <div className="authInfo">
          <div className="authLogo">
            <FaChartLine />
            <span className="authLabel">FinSight AI</span>
          </div>
          <h2>
            {isSignup
              ? "Create Account"
              : showForgot
              ? "Reset Password"
              : "Welcome Back!"}
          </h2>
          <p>
            {showForgot
              ? "Enter your email to receive a reset link."
              : "Sign in to continue to your account."}
          </p>
        </div>

        <form
          className="authForm"
          onSubmit={(e) => {
            e.preventDefault();
            if (showForgot) handleForgotPassword();
            else if (isSignup) handleSignup();
            else handleLogin();
          }}
        >
          {isSignup && !showForgot && (
            <>
              <label htmlFor="authName">Name</label>
              <div className="inputGroup">
                <FaEnvelope className="fieldIcon" />
                <input
                  id="authName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
            </>
          )}

          <label htmlFor="authEmail">Email</label>
          <div className="inputGroup">
            <FaEnvelope className="fieldIcon" />
            <input
              id="authEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {!showForgot && (
            <>
              <label htmlFor="authPassword">Password</label>
              <div className="inputGroup">
                <FaLock className="fieldIcon" />
                <input
                  id="authPassword"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  className="eyeIconBtn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </>
          )}

          {isSignup && !showForgot && (
            <>
              <label htmlFor="authConfirmPassword">Confirm Password</label>
              <div className="inputGroup">
                <FaLock className="fieldIcon" />
                <input
                  id="authConfirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </>
          )}

          {!isSignup && !showForgot && (
            <div className="authRow">
              <label className="rememberRow">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                Remember me
              </label>
              <button
                className="forgotBtn"
                type="button"
                onClick={() => {
                  setShowForgot(true);
                  setError("");
                }}
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>
          )}

          {error && (
            <div
              className="errorText"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                background: "rgba(244, 63, 94, 0.12)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                borderRadius: "10px",
                color: "#f43f5e",
                fontSize: "13px",
                lineHeight: "1.4",
              }}
            >
              <FaExclamationTriangle style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {showForgot ? (
            <>
              <button
                className="authSubmit"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending link..." : "Send Reset Link"}
              </button>
              <button
                className="linkBtn"
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setError("");
                }}
                style={{
                  marginTop: "12px",
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                Back to Login
              </button>
            </>
          ) : (
            <button
              className="authSubmit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
            </button>
          )}

          {!showForgot && (
            <>
              <div className="orDivider">
                <span>or continue with</span>
              </div>
              <div className="socialRow">
                <button
                  className="googleBtn"
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                >
                  <FcGoogle /> Google
                </button>
                <button
                  className="appleBtn"
                  type="button"
                  onClick={() => alert("Apple login will be available soon.")}
                  disabled={loading}
                >
                  <FaApple /> Apple
                </button>
              </div>

              <p className="privacyText">
                {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  className="linkBtn"
                  type="button"
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setError("");
                  }}
                  disabled={loading}
                >
                  {isSignup ? "Sign In" : "Create Account"}
                </button>
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
