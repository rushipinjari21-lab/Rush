import express from "express";
import { login, register, getMe, refreshToken, changePassword } from "../controllers/auth.controller.js";
import { authenticate, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", authenticate, adminOnly, register);
router.get("/me", authenticate, getMe);
router.post("/refresh", refreshToken);
router.put("/change-password", authenticate, changePassword);

export default router;