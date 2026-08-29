/**
 * Authentication Controller
 * PCMC BillPro - Login, Register, Token Management
 */
import { UserModel } from "../models/user.model.js";
import { generateAccessToken, generateRefreshToken } from "../config/jwt.js";
import { asyncHandler, ApiError } from "../middleware/error.middleware.js";
import { body, validationResult } from "express-validator";

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
export const login = [
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array());
    }

    const { username, password } = req.body;

    const user = await UserModel.findByUsername(username);
    if (!user) {
      throw new ApiError(401, "Invalid username or password");
    }

    const isPasswordValid = await UserModel.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid username or password");
    }

    if (!user.is_active) {
      throw new ApiError(403, "Account is deactivated. Contact administrator.");
    }

    await UserModel.updateLastLogin(user.id);

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: user.id });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          department: user.department,
          phone: user.phone
        },
        accessToken,
        refreshToken
      }
    });
  })
];

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (Admin only)
 * @access  Private/Admin
 */
export const register = [
  body("username").trim().isLength({ min: 3, max: 50 }).withMessage("Username must be 3-50 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("full_name").trim().notEmpty().withMessage("Full name is required"),
  body("role").isIn(["admin", "engineer", "accountant", "contractor"]).withMessage("Invalid role"),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array());
    }

    const { username, email, password, full_name, role, department, phone } = req.body;

    const existingUser = await UserModel.findByUsername(username);
    if (existingUser) {
      throw new ApiError(409, "Username already exists");
    }

    const existingEmail = await UserModel.findByEmail(email);
    if (existingEmail) {
      throw new ApiError(409, "Email already registered");
    }

    const newUser = await UserModel.create({
      username, email, password, full_name, role, department, phone
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role
      }
    });
  })
];

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json({
    success: true,
    data: user
  });
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  try {
    const { verifyRefreshToken } = await import("../config/jwt.js");
    const decoded = verifyRefreshToken(refreshToken);
    const user = await UserModel.findById(decoded.id);

    if (!user || !user.is_active) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const accessToken = generateAccessToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    });

    res.json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
export const changePassword = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array());
    }

    const { currentPassword, newPassword } = req.body;
    const user = await UserModel.findById(req.user.id);

    const isValid = await UserModel.verifyPassword(currentPassword, user.password);
    if (!isValid) {
      throw new ApiError(401, "Current password is incorrect");
    }

    await UserModel.updatePassword(user.id, newPassword);

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  })
];

export default { login, register, getMe, refreshToken, changePassword };
