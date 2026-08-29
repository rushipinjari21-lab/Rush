/**
 * Measurement Book Model
 * PCMC BillPro - Measurement Book Management
 */
import { query, transaction } from "../config/database.js";
import { calculateMeasurementQuantity } from "../lib/calculations/measurementEngine.js";

export const MeasurementModel = {
  /**
   * Create measurement books table
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS measurement_books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sap_work_key VARCHAR(50) NOT NULL,
        mb_number VARCHAR(50) NOT NULL,
        mb_date DATE NOT NULL,
        description TEXT,
        status ENUM('draft', 'verified', 'approved') DEFAULT 'draft',
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (sap_work_key) REFERENCES projects(sap_work_key) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY uk_sap_mb (sap_work_key, mb_number),
        INDEX idx_sap_key (sap_work_key),
        INDEX idx_mb_number (mb_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await query(sql);
  },

  /**
   * Create measurement entries table
   */
  createEntriesTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS measurement_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mb_id INT NOT NULL,
        boq_item_id INT NOT NULL,
        ssr_code VARCHAR(50) NOT NULL,
        description TEXT,
        unit VARCHAR(50) NOT NULL,
        boq_quantity DECIMAL(18, 4) NOT NULL DEFAULT 0,
        rate DECIMAL(18, 2) NOT NULL DEFAULT 0,
        location VARCHAR(500) NOT NULL,
        remark TEXT,
        length DECIMAL(18, 4) DEFAULT 0,
        breadth DECIMAL(18, 4) DEFAULT 0,
        height DECIMAL(18, 4) DEFAULT 0,
        quantity DECIMAL(18, 4) NOT NULL DEFAULT 0,
        total_quantity DECIMAL(18, 4) NOT NULL DEFAULT 0,
        entry_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mb_id) REFERENCES measurement_books(id) ON DELETE CASCADE,
        FOREIGN KEY (boq_item_id) REFERENCES boq_items(id) ON DELETE RESTRICT,
        INDEX idx_mb_id (mb_id),
        INDEX idx_boq_item (boq_item_id),
        INDEX idx_ssr_code (ssr_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await query(sql);
  },

  /**
   * Create measurement book
   */
  createMB: async (mbData) => {
    const { sap_work_key, mb_number, mb_date, description, created_by } = mbData;
    const sql = `
      INSERT INTO measurement_books (sap_work_key, mb_number, mb_date, description, created_by)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [sap_work_key, mb_number, mb_date, description, created_by]);
    return { id: result.insertId, ...mbData };
  },

  /**
   * Find MB by ID
   */
  findMBById: async (id) => {
    const sql = `SELECT * FROM measurement_books WHERE id = ?`;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Find MB by SAP Key and Number
   */
  findMBByNumber: async (sap_work_key, mb_number) => {
    const sql = `SELECT * FROM measurement_books WHERE sap_work_key = ? AND mb_number = ?`;
    const rows = await query(sql, [sap_work_key, mb_number]);
    return rows[0] || null;
  },

  /**
   * Get all MBs for a project
   */
  findMBsBySapKey: async (sap_work_key) => {
    const sql = `
      SELECT mb.*, 
        COUNT(me.id) as total_entries,
        SUM(me.total_quantity) as total_measured
      FROM measurement_books mb
      LEFT JOIN measurement_entries me ON mb.id = me.mb_id
      WHERE mb.sap_work_key = ?
      GROUP BY mb.id
      ORDER BY mb.created_at DESC
    `;
    return query(sql, [sap_work_key]);
  },

  /**
   * Add measurement entry
   */
  addEntry: async (entryData) => {
    const {
      mb_id, boq_item_id, ssr_code, description, unit, boq_quantity, rate,
      location, remark, length, breadth, height, quantity, total_quantity, entry_date
    } = entryData;

    const totalQty = total_quantity !== undefined && total_quantity !== null
      ? Number(total_quantity)
      : calculateMeasurementQuantity({ length, breadth, height, quantity }, unit);

    const sql = `
      INSERT INTO measurement_entries 
      (mb_id, boq_item_id, ssr_code, description, unit, boq_quantity, rate,
       location, remark, length, breadth, height, quantity, total_quantity, entry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      mb_id, boq_item_id, ssr_code, description || "", unit || "Nos", boq_quantity || 0, rate || 0,
      location, remark, length || 0, breadth || 0, height || 0, quantity !== undefined ? quantity : 1, totalQty, entry_date
    ]);
    return { id: result.insertId, ...entryData, unit: unit || "Nos", total_quantity: totalQty };
  },

  /**
   * Get entries by MB ID
   */
  getEntriesByMB: async (mb_id) => {
    const sql = `
      SELECT me.*, bi.ssr_code as boq_ssr, bi.description as boq_desc
      FROM measurement_entries me
      LEFT JOIN boq_items bi ON me.boq_item_id = bi.id
      WHERE me.mb_id = ?
      ORDER BY me.created_at
    `;
    return query(sql, [mb_id]);
  },

  /**
   * Get entries grouped by BOQ item. Multiple measurements may use the same
   * SSR code; the BOQ item id keeps two PDF rows with the same code separate.
   */
  getEntriesGroupedBySSR: async (mb_id) => {
    const sql = `
      SELECT 
        boq_item_id,
        ssr_code,
        description,
        unit,
        boq_quantity,
        rate,
        COUNT(*) as measurement_count,
        SUM(total_quantity) as current_quantity,
        GROUP_CONCAT(location SEPARATOR '; ') as locations,
        GROUP_CONCAT(remark SEPARATOR '; ') as remarks
      FROM measurement_entries
      WHERE mb_id = ?
      GROUP BY boq_item_id, ssr_code, description, unit, boq_quantity, rate
      ORDER BY ssr_code, boq_item_id
    `;
    return query(sql, [mb_id]);
  },

  /**
   * Get cumulative quantity for one BOQ item across all MBs. The same SSR
   * code can appear in more than one Schedule B row, so it is not a safe key.
   */
  getCumulativeQuantity: async (sap_work_key, boq_item_id, exclude_mb_id = null) => {
    let sql = `
      SELECT SUM(me.total_quantity) as cumulative_qty
      FROM measurement_entries me
      JOIN measurement_books mb ON me.mb_id = mb.id
      WHERE mb.sap_work_key = ? AND me.boq_item_id = ?
    `;
    const params = [sap_work_key, boq_item_id];
    if (exclude_mb_id) {
      sql += ` AND mb.id != ?`;
      params.push(exclude_mb_id);
    }
    const rows = await query(sql, params);
    return rows[0]?.cumulative_qty || 0;
  },

  /**
   * Update entry
   */
  updateEntry: async (id, entryData) => {
    const allowedFields = ["location", "remark", "length", "breadth", "height", "quantity", "entry_date"];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(entryData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return null;

    // Recalculate total_quantity
    if (entryData.length !== undefined || entryData.breadth !== undefined || 
        entryData.height !== undefined || entryData.quantity !== undefined || entryData.total_quantity !== undefined) {
      const current = await MeasurementModel.findEntryById(id);
      const length = entryData.length !== undefined ? entryData.length : current.length;
      const breadth = entryData.breadth !== undefined ? entryData.breadth : current.breadth;
      const height = entryData.height !== undefined ? entryData.height : current.height;
      const qty = entryData.quantity !== undefined ? entryData.quantity : current.quantity;
      const totalQty = entryData.total_quantity !== undefined
        ? Number(entryData.total_quantity)
        : calculateMeasurementQuantity({ length, breadth, height, quantity: qty }, current.unit);
      updates.push("total_quantity = ?");
      values.push(totalQty);
    }

    values.push(id);
    const sql = `UPDATE measurement_entries SET ${updates.join(", ")} WHERE id = ?`;
    await query(sql, values);
    return MeasurementModel.findEntryById(id);
  },

  /**
   * Find entry by ID
   */
  findEntryById: async (id) => {
    const sql = `SELECT * FROM measurement_entries WHERE id = ?`;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Delete entry
   */
  deleteEntry: async (id) => {
    const sql = `DELETE FROM measurement_entries WHERE id = ?`;
    await query(sql, [id]);
    return true;
  },

  /**
   * Delete MB and all entries
   */
  deleteMB: async (id) => {
    const sql = `DELETE FROM measurement_books WHERE id = ?`;
    await query(sql, [id]);
    return true;
  },

  /**
   * Update MB status
   */
  updateMBStatus: async (id, status) => {
    const sql = `UPDATE measurement_books SET status = ? WHERE id = ?`;
    await query(sql, [status, id]);
  },

  /**
   * Get MB statistics for dashboard
   */
  getStats: async () => {
    const sql = `
      SELECT 
        COUNT(*) as total_mbs,
        COUNT(DISTINCT sap_work_key) as projects_with_mb,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_mbs
      FROM measurement_books
    `;
    const rows = await query(sql);
    return rows[0];
  }
};

export default MeasurementModel;
