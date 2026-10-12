import express from "express";
import { generateAI, scanReceipt, parseVoice } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/", generateAI);
router.post("/scan-receipt", scanReceipt);
router.post("/receipt-ocr", scanReceipt);
router.post("/parse-voice", parseVoice);
router.post("/voice-parse", parseVoice);

export default router;