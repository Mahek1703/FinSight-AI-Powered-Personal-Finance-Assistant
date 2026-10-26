import { adminAuth } from "../config/firebaseAdmin.js";

/**
 * Middleware to verify Firebase Auth Bearer ID tokens.
 * Protects all /api/* routes from unauthorized quota exhaustion.
 */
export const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Missing or malformed Bearer token",
    });
  }

  const token = authHeader.split("Bearer ")[1]?.trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Token empty",
    });
  }

  if (!adminAuth) {
    // If Admin Auth is uninitialized in development, log warning and allow request
    if (process.env.NODE_ENV !== "production") {
      console.warn("Notice: Firebase Admin Auth uninitialized. Skipping verification in non-production.");
      req.user = { uid: "dev-user" };
      return next();
    }
    return res.status(500).json({
      success: false,
      error: "Server configuration error: Firebase Admin Auth uninitialized",
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification failed:", error.code || error.message);
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Invalid or expired token",
    });
  }
};
