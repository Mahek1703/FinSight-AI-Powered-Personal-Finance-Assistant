import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { verifyFirebaseToken } from "./middleware/auth.middleware.js";
import aiRoutes from "./routes/ai.routes.js";
import gmailRoutes from "./routes/gmail.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Security Headers
app.use(helmet());

// 2. Strict CORS Configuration
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, "");
      if (allowedOrigins.length > 0 && allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// 3. Body Parsing with Bounded Limits
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// 4. Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "AI rate limit exceeded. Please wait a few minutes before trying again.",
  },
});

app.use("/api", generalLimiter);
app.use("/api/ai", aiLimiter);

// 5. Protected API Routes
app.use("/api/ai", verifyFirebaseToken, aiRoutes);
app.use("/api/gmail", verifyFirebaseToken, gmailRoutes);

// 6. Health & Status Endpoints
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "FinSight AI Backend",
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    service: "FinSight AI Backend",
    health: "/health",
  });
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
  if (err?.message?.includes("CORS blocked")) {
    return res.status(403).json({
      success: false,
      error: err.message,
    });
  }
  console.error("Unhandled error:", err?.message || err);
  res.status(err?.status || 500).json({
    success: false,
    error: err?.message || "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});