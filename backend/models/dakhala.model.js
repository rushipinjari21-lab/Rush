/**
 * Dakhala Model
 * PCMC BillPro - Dakhala / Certificates Database Access
 */
import { query } from "../config/database.js";

export const DakhalaModel = {
  /**
   * Create dakhala certificates table
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS dakhala_certificates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sap_work_key VARCHAR(50) NOT NULL,
        template_type VARCHAR(100) NOT NULL,
        certificate_title VARCHAR(200) NOT NULL,
        ra_bill_id INT NULL,
        mb_id INT NULL,
        certificate_data JSON,
        status ENUM('draft', 'issued', 'revoked') DEFAULT 'issued',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (sap_work_key) REFERENCES projects(sap_work_key) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_sap_key (sap_work_key),
        INDEX idx_template (template_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await query(sql);
  },

  /**
   * Record new Dakhala issuance
   */
  create: async (data) => {
    const { sap_work_key, template_type, certificate_title, ra_bill_id, mb_id, certificate_data, created_by } = data;
    const sql = `
      INSERT INTO dakhala_certificates 
      (sap_work_key, template_type, certificate_title, ra_bill_id, mb_id, certificate_data, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const jsonData = typeof certificate_data === "object" ? JSON.stringify(certificate_data) : certificate_data;
    const result = await query(sql, [
      sap_work_key, template_type, certificate_title,
      ra_bill_id || null, mb_id || null, jsonData || null, created_by || null
    ]);

    return { id: result.insertId, ...data };
  },

  /**
   * Find by Project
   */
  findByProject: async (sap_work_key) => {
    const sql = `
      SELECT dc.*, u.full_name as issuer_name, mb.mb_number, rb.bill_number
      FROM dakhala_certificates dc
      LEFT JOIN users u ON dc.created_by = u.id
      LEFT JOIN measurement_books mb ON dc.mb_id = mb.id
      LEFT JOIN ra_bills rb ON dc.ra_bill_id = rb.id
      WHERE dc.sap_work_key = ?
      ORDER BY dc.created_at DESC
    `;
    return query(sql, [sap_work_key]);
  },

  /**
   * Find by ID
   */
  findById: async (id) => {
    const sql = `SELECT * FROM dakhala_certificates WHERE id = ?`;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  }
};

export default DakhalaModel;

