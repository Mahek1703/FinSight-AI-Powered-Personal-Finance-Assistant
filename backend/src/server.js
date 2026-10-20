import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
  })
);
app.use(express.json());

const { default: aiRoutes } = await import("./routes/ai.routes.js");
const { default: gmailRoutes } = await import("./routes/gmail.routes.js");

app.use("/api/ai", aiRoutes);
app.use("/api/gmail", gmailRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FinSight AI Backend is running 🚀",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});