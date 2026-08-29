/**
 * RA Bill Model
 * PCMC BillPro - Running Account Bill Management
 */
import { query, transaction } from "../config/database.js";

export const RABillModel = {
  /**
   * Create RA Bills table
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS ra_bills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sap_work_key VARCHAR(50) NOT NULL,
        mb_id INT NOT NULL,
        bill_number VARCHAR(50) NOT NULL,
        bill_date DATE NOT NULL,
        bill_period_from DATE,
        bill_period_to DATE,
        gross_amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
        gst_rate DECIMAL(5, 2) DEFAULT 18.00,
        gst_amount DECIMAL(18, 2) DEFAULT 0,
        labour_cess_rate DECIMAL(5, 2) DEFAULT 1.00,
        labour_cess_amount DECIMAL(18, 2) DEFAULT 0,
        security_deposit_rate DECIMAL(5, 2) DEFAULT 5.00,
        security_deposit_amount DECIMAL(18, 2) DEFAULT 0,
        other_deductions DECIMAL(18, 2) DEFAULT 0,
        net_payable DECIMAL(18, 2) DEFAULT 0,
        status ENUM('draft', 'submitted', 'verified', 'approved', 'paid') DEFAULT 'draft',
        remarks TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (sap_work_key) REFERENCES projects(sap_work_key) ON DELETE CASCADE,
        FOREIGN KEY (mb_id) REFERENCES measurement_books(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY uk_sap_bill (sap_work_key, bill_number),
        UNIQUE KEY uk_mb_bill (mb_id),
        INDEX idx_sap_key (sap_work_key),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await query(sql);

    // Existing installations may pre-date the one-bill-per-MB safeguard. Add
    // the unique key only when historical data is already clean; never delete
    // or alter an old bill just to complete a schema migration.
    const mbBillIndex = await query("SHOW INDEX FROM ra_bills WHERE Key_name = 'uk_mb_bill'");
    if (!mbBillIndex.length) {
      const duplicateMbs = await query(`
        SELECT mb_id
        FROM ra_bills
        GROUP BY mb_id
        HAVING COUNT(*) > 1
        LIMIT 1
      `);
      if (!duplicateMbs.length) {
        await query("ALTER TABLE ra_bills ADD UNIQUE KEY uk_mb_bill (mb_id)");
      } else {
        console.warn("RA bill one-per-MB safeguard was not added because existing duplicate MB bills were found.");
      }
    }
  },

  /**
   * Create RA Bill items table
   */
  createItemsTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS ra_bill_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ra_bill_id INT NOT NULL,
        boq_item_id INT NULL,
        ssr_code VARCHAR(50) NOT NULL,
        description TEXT,
        unit VARCHAR(50),
        boq_quantity DECIMAL(18, 4) DEFAULT 0,
        previous_quantity DECIMAL(18, 4) DEFAULT 0,
        current_quantity DECIMAL(18, 4) DEFAULT 0,
        total_quantity DECIMAL(18, 4) DEFAULT 0,
        balance_quantity DECIMAL(18, 4) DEFAULT 0,
        rate DECIMAL(18, 2) DEFAULT 0,
        amount DECIMAL(18, 2) DEFAULT 0,
        FOREIGN KEY (ra_bill_id) REFERENCES ra_bills(id) ON DELETE CASCADE,
        INDEX idx_ra_bill (ra_bill_id),
        INDEX idx_ssr_code (ssr_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await query(sql);

    // Existing installations created before BOQ-item tracking need a small,
    // non-destructive schema upgrade. A bill can then distinguish rows that
    // legitimately share the same SSR code.
    const boqItemColumn = await query("SHOW COLUMNS FROM ra_bill_items LIKE 'boq_item_id'");
    if (!boqItemColumn.length) {
      await query("ALTER TABLE ra_bill_items ADD COLUMN boq_item_id INT NULL AFTER ra_bill_id, ADD INDEX idx_ra_boq_item (boq_item_id)");
    }
  },

  /**
   * Create RA Bill
   */
  create: async (billData) => {
    const {
      sap_work_key, mb_id, bill_number, bill_date, bill_period_from, bill_period_to,
      gross_amount, gst_rate, gst_amount, labour_cess_rate, labour_cess_amount,
      security_deposit_rate, security_deposit_amount, other_deductions, net_payable,
      remarks, created_by
    } = billData;

    const sql = `
      INSERT INTO ra_bills 
      (sap_work_key, mb_id, bill_number, bill_date, bill_period_from, bill_period_to,
       gross_amount, gst_rate, gst_amount, labour_cess_rate, labour_cess_amount,
       security_deposit_rate, security_deposit_amount, other_deductions, net_payable, remarks, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      sap_work_key, mb_id, bill_number, bill_date,
      bill_period_from === undefined ? null : bill_period_from,
      bill_period_to === undefined ? null : bill_period_to,
      gross_amount, gst_rate, gst_amount, labour_cess_rate, labour_cess_amount,
      security_deposit_rate, security_deposit_amount, other_deductions, net_payable,
      remarks === undefined ? null : remarks,
      created_by === undefined ? null : created_by
    ]);
    return { id: result.insertId, ...billData };
  },

  /**
   * Add RA Bill items
   */
  addItems: async (ra_bill_id, items) => {
    if (!items || items.length === 0) return [];

    const placeholders = items.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    const values = items.flatMap(item => [
      ra_bill_id,
      item.boq_item_id ?? null,
      item.ssr_code,
      item.description,
      item.unit,
      item.boq_quantity || 0,
      item.previous_quantity || 0,
      item.current_quantity || 0,
      item.total_quantity || 0,
      item.balance_quantity || 0,
      item.rate || 0,
      item.amount || 0
    ]);

    const sql = `
      INSERT INTO ra_bill_items 
      (ra_bill_id, boq_item_id, ssr_code, description, unit, boq_quantity, previous_quantity,
       current_quantity, total_quantity, balance_quantity, rate, amount)
      VALUES ${placeholders}
    `;
    return query(sql, values);
  },

  /**
   * Find by ID
   */
  findById: async (id) => {
    const sql = `SELECT * FROM ra_bills WHERE id = ?`;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Find the bill generated from a Measurement Book. One Measurement Book is
   * the source for one RA bill, preventing accidental double billing.
   */
  findByMBId: async (mb_id) => {
    const sql = `SELECT * FROM ra_bills WHERE mb_id = ? ORDER BY id DESC LIMIT 1`;
    const rows = await query(sql, [mb_id]);
    return rows[0] || null;
  },

  /**
   * Find by SAP Key and Bill Number
   */
  findByBillNumber: async (sap_work_key, bill_number) => {
    const sql = `SELECT * FROM ra_bills WHERE sap_work_key = ? AND bill_number = ?`;
    const rows = await query(sql, [sap_work_key, bill_number]);
    return rows[0] || null;
  },

  /**
   * Get items by RA Bill ID
   */
  getItems: async (ra_bill_id) => {
    const sql = `SELECT * FROM ra_bill_items WHERE ra_bill_id = ? ORDER BY id`;
    return query(sql, [ra_bill_id]);
  },

  /**
   * Get full RA Bill with items
   */
  getFullBill: async (id) => {
    const bill = await RABillModel.findById(id);
    if (!bill) return null;
    const items = await RABillModel.getItems(id);
    return { ...bill, items };
  },

  /**
   * Get all RA Bills for a project
   */
  findBySapKey: async (sap_work_key) => {
    const sql = `
      SELECT rb.*, mb.mb_number
      FROM ra_bills rb
      LEFT JOIN measurement_books mb ON rb.mb_id = mb.id
      WHERE rb.sap_work_key = ?
      ORDER BY rb.created_at DESC
    `;
    return query(sql, [sap_work_key]);
  },

  /**
   * Update status
   */
  updateStatus: async (id, status) => {
    const sql = `UPDATE ra_bills SET status = ? WHERE id = ?`;
    await query(sql, [status, id]);
  },

  /**
   * Update RA Bill
   */
  update: async (id, billData) => {
    const allowedFields = [
      "bill_date", "bill_period_from", "bill_period_to", "gross_amount",
      "gst_rate", "gst_amount", "labour_cess_rate", "labour_cess_amount",
      "security_deposit_rate", "security_deposit_amount", "other_deductions",
      "net_payable", "status", "remarks"
    ];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(billData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return null;

    values.push(id);
    const sql = `UPDATE ra_bills SET ${updates.join(", ")} WHERE id = ?`;
    await query(sql, values);
    return RABillModel.findById(id);
  },

  /**
   * Delete RA Bill
   */
  delete: async (id) => {
    const sql = `DELETE FROM ra_bills WHERE id = ?`;
    await query(sql, [id]);
    return true;
  },

  /**
   * Get RA Bill statistics
   */
  getStats: async () => {
    const sql = `
      SELECT 
        COUNT(*) as total_bills,
        SUM(gross_amount) as total_gross,
        SUM(net_payable) as total_net,
        SUM(CASE WHEN status = 'paid' THEN net_payable ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'approved' THEN net_payable ELSE 0 END) as total_approved
      FROM ra_bills
    `;
    const rows = await query(sql);
    return rows[0];
  },

  /**
   * Get previous bill quantities for SSR codes
   */
  getPreviousQuantities: async (sap_work_key, exclude_bill_id = null) => {
    let sql = `
      SELECT 
        rbi.boq_item_id,
        rbi.ssr_code,
        SUM(rbi.current_quantity) as prev_qty
      FROM ra_bill_items rbi
      JOIN ra_bills rb ON rbi.ra_bill_id = rb.id
      WHERE rb.sap_work_key = ? AND rb.status IN ('approved', 'paid')
    `;
    const params = [sap_work_key];
    if (exclude_bill_id) {
      sql += ` AND rb.id != ?`;
      params.push(exclude_bill_id);
    }
    sql += ` GROUP BY rbi.boq_item_id, rbi.ssr_code`;
    return query(sql, params);
  }
};

export default RABillModel;
