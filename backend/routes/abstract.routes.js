import express from "express";
import { generateAbstract, exportAbstract } from "../controllers/abstract.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/:mb_id", authenticate, generateAbstract);
router.get("/:mb_id/export", authenticate, exportAbstract);

export default router;