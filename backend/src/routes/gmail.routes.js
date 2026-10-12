import express from "express";
import { connectGmail } from "../controllers/gmail.controller.js";

const router = express.Router();

router.post("/connect", connectGmail);

export default router;