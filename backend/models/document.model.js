/**
 * Document Center Model
 * PCMC BillPro - Centralized Document Storage & Tracking
 */
import { query } from "../config/database.js";

export const DocumentModel = {
  /**
   * Create documents table
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS project_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sap_work_key VARCHAR(50) NOT NULL,
        document_type ENUM('MB', 'ABSTRACT', 'RA_BILL', 'DAKHALA', 'QUANTITY_VARIATION', 'REPORT') NOT NULL,
        template_type VARCHAR(100),
        mb_id INT NULL,
        ra_bill_id INT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT DEFAULT 0,
        version INT DEFAULT 1,
        generated_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sap_work_key) REFERENCES projects(sap_work_key) ON DELETE CASCADE,
        FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_sap_doc (sap_work_key),
        INDEX idx_doc_type (document_type),
        INDEX idx_mb (mb_id),
        INDEX idx_ra_bill (ra_bill_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await query(sql);
  },

  /**
   * Record generated document
   */
  create: async (docData) => {
    const {
      sap_work_key, document_type, template_type, mb_id, ra_bill_id,
      file_name, file_path, file_size, version, generated_by
    } = docData;

    const sql = `
      INSERT INTO project_documents 
      (sap_work_key, document_type, template_type, mb_id, ra_bill_id, file_name, file_path, file_size, version, generated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      sap_work_key, document_type, template_type || null,
      mb_id || null, ra_bill_id || null, file_name, file_path,
      file_size || 0, version || 1, generated_by || null
    ]);

    return { id: result.insertId, ...docData };
  },

  /**
   * Get document by ID
   */
  findById: async (id) => {
    const sql = `SELECT * FROM project_documents WHERE id = ?`;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Find documents by project (with folder hierarchy grouping)
   */
  findByProject: async (sap_work_key) => {
    const sql = `
      SELECT pd.*, u.full_name as generator_name, mb.mb_number, rb.bill_number
      FROM project_documents pd
      LEFT JOIN users u ON pd.generated_by = u.id
      LEFT JOIN measurement_books mb ON pd.mb_id = mb.id
      LEFT JOIN ra_bills rb ON pd.ra_bill_id = rb.id
      WHERE pd.sap_work_key = ?
      ORDER BY pd.created_at DESC
    `;
    return query(sql, [sap_work_key]);
  },

  /**
   * Delete document record
   */
  delete: async (id) => {
    const sql = `DELETE FROM project_documents WHERE id = ?`;
    await query(sql, [id]);
    return true;
  }
};

export default DocumentModel;

