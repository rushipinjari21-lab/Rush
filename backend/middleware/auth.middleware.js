import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model.js";

/**
 * Authenticate User
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "default_secret";
    const decoded = jwt.verify(token, secret);

    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * Admin Only
 */
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

/**
 * Engineer or Admin
 */
export const engineerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!["admin", "engineer"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Engineer or Admin access required",
    });
  }

  next();
};

/**
 * Accountant or Admin
 */
export const accountantOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!["admin", "accountant"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Accountant or Admin access required",
    });
  }

  next();
};

/**
 * Contractor or Admin
 */
export const contractorOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!["admin", "contractor"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Contractor or Admin access required",
    });
  }

  next();
};

/**
 * Generic Role Middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  };
};

export default {
  authenticate,
  adminOnly,
  engineerOrAdmin,
  accountantOrAdmin,
  contractorOrAdmin,
  authorize,
};