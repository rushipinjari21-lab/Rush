/**
 * User Model
 * PCMC BillPro - User Management
 */
import { query, transaction } from "../config/database.js";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export const UserModel = {
  /**
   * Create users table
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'engineer', 'accountant', 'contractor') NOT NULL DEFAULT 'engineer',
        department VARCHAR(100),
        phone VARCHAR(20),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await query(sql);
  },

  /**
   * Find user by ID
   */
  findById: async (id) => {
    const sql = `SELECT id, username, email, full_name, role, department, phone, is_active, last_login, created_at FROM users WHERE id = ?`;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Find user by username
   */
  findByUsername: async (username) => {
    const sql = `SELECT * FROM users WHERE username = ?`;
    const rows = await query(sql, [username]);
    return rows[0] || null;
  },

  /**
   * Find user by email
   */
  findByEmail: async (email) => {
    const sql = `SELECT * FROM users WHERE email = ?`;
    const rows = await query(sql, [email]);
    return rows[0] || null;
  },

  /**
   * Create new user
   */
  create: async (userData) => {
    const { username, email, password, full_name, role, department, phone } = userData;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const sql = `
      INSERT INTO users (username, email, password, full_name, role, department, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [username, email, hashedPassword, full_name, role, department, phone]);
    return { id: result.insertId, ...userData };
  },

  /**
   * Update user
   */
  update: async (id, userData) => {
    const allowedFields = ["email", "full_name", "role", "department", "phone", "is_active"];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(userData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return null;

    values.push(id);
    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    await query(sql, values);
    return UserModel.findById(id);
  },

  /**
   * Update password
   */
  updatePassword: async (id, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const sql = `UPDATE users SET password = ? WHERE id = ?`;
    await query(sql, [hashedPassword, id]);
    return true;
  },

  /**
   * Update last login
   */
  updateLastLogin: async (id) => {
    const sql = `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`;
    await query(sql, [id]);
  },

  /**
   * Delete user
   */
  delete: async (id) => {
    const sql = `DELETE FROM users WHERE id = ?`;
    await query(sql, [id]);
    return true;
  },

  /**
   * Get all users with pagination
   */
  findAll: async (page = 1, limit = 50, search = "") => {
    let sql = `SELECT id, username, email, full_name, role, department, phone, is_active, last_login, created_at FROM users`;
    let countSql = `SELECT COUNT(*) as total FROM users`;
    const params = [];

    if (search) {
      sql += ` WHERE username LIKE ? OR email LIKE ? OR full_name LIKE ?`;
      countSql += ` WHERE username LIKE ? OR email LIKE ? OR full_name LIKE ?`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const [users, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [])
    ]);

    return {
      users,
      total: countResult[0].total,
      page,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  },

  /**
   * Verify password
   */
  verifyPassword: async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  /**
   * Seed default admin
   */
  seedAdmin: async () => {
    const existing = await UserModel.findByUsername("admin");
    if (!existing) {
      await UserModel.create({
        username: "admin",
        email: "admin@pcmc.gov.in",
        password: "admin123",
        full_name: "System Administrator",
        role: "admin",
        department: "IT",
        phone: "+91-20-27415000"
      });
      console.log("✅ Default admin user created (admin / admin123)");
    }
  }
};

export default UserModel;
