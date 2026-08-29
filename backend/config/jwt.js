import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "default_refresh";

export const generateAccessToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
export const generateRefreshToken = (payload) => jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
export const verifyAccessToken = (token) => jwt.verify(token, JWT_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, JWT_REFRESH_SECRET);