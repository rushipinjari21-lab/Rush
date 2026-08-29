/**
 * BOQ Model
 * PCMC BillPro - Bill of Quantities
 */
import { query, transaction } from "../config/database.js";

export const BOQModel = {
  /**
   * Create BOQ table
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS boq_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sap_work_key VARCHAR(50) NOT NULL,
        part_section ENUM('Part A', 'Part B', 'Part C', 'Part D', 'Other') NOT NULL DEFAULT 'Other',
        ssr_code VARCHAR(50) NOT NULL,
        additional_specification VARCHAR(100),
        description TEXT NOT NULL,
        unit VARCHAR(50) NOT NULL,
        boq_quantity DECIMAL(18, 4) NOT NULL DEFAULT 0,
        rate DECIMAL(18, 2) NOT NULL DEFAULT 0,
        amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
        item_no VARCHAR(20),
        page_no INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (sap_work_key) REFERENCES projects(sap_work_key) ON DELETE CASCADE,
        INDEX idx_sap_key (sap_work_key),
        INDEX idx_ssr_code (ssr_code),
        INDEX idx_part (part_section)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await query(sql);

    const additionalSpecificationColumn = await query("SHOW COLUMNS FROM boq_items LIKE 'additional_specification'");
    if (!additionalSpecificationColumn.length) {
      await query("ALTER TABLE boq_items ADD COLUMN additional_specification VARCHAR(100) NULL AFTER ssr_code");
    }
  },

  /**
   * Create BOQ uploads tracking table
   */
  createUploadsTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS boq_uploads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sap_work_key VARCHAR(50) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT,
        upload_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        extracted_items INT DEFAULT 0,
        error_message TEXT,
        uploaded_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sap_work_key) REFERENCES projects(sap_work_key) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await query(sql);
  },

  /**
   * Bulk insert BOQ items
   */
  bulkCreate: async (sap_work_key, items) => {
    if (!items || items.length === 0) return [];

    const placeholders = items.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    const values = items.flatMap(item => [
      sap_work_key,
      item.part_section || "Other",
      item.ssr_code ?? "",
      item.additional_specification ?? null,
      item.description,
      item.unit || "Nos",
      item.boq_quantity || 0,
      item.rate || 0,
      item.amount || (item.boq_quantity * item.rate) || 0,
      item.item_no || null
    ]);

    const sql = `
      INSERT INTO boq_items 
      (sap_work_key, part_section, ssr_code, additional_specification, description, unit, boq_quantity, rate, amount, item_no)
      VALUES ${placeholders}
    `;
    const result = await query(sql, values);
    return result;
  },

  /**
   * Replace parsed BOQ rows without breaking Measurement Book entries that
   * already refer to an older import. A new parsed set is inserted first;
   * entries are then moved to the matching Item No. before stale rows are
   * removed. This makes re-uploading a corrected Schedule B safe.
   */
  replaceForProject: async (sap_work_key, items) => {
    if (!items || !items.length) return [];

    return transaction(async (connection) => {
      const [existingItems] = await connection.execute(
        "SELECT * FROM boq_items WHERE sap_work_key = ? ORDER BY id",
        [sap_work_key]
      );
      const [existingEntries] = await connection.execute(`
        SELECT me.id, me.boq_item_id, bi.item_no AS old_item_no, bi.ssr_code AS old_ssr_code
        FROM measurement_entries me
        JOIN measurement_books mb ON mb.id = me.mb_id
        JOIN boq_items bi ON bi.id = me.boq_item_id
        WHERE mb.sap_work_key = ?
      `, [sap_work_key]);
      // RA bill rows keep a BOQ item reference so later abstracts and quantity
      // variation statements can carry approved quantities forward.  Capture
      // those references before replacing the imported Schedule B rows.
      const [existingBillItems] = await connection.execute(`
        SELECT rbi.id, rbi.boq_item_id, rbi.ssr_code,
               bi.item_no AS old_item_no, bi.ssr_code AS old_ssr_code
        FROM ra_bill_items rbi
        JOIN ra_bills rb ON rb.id = rbi.ra_bill_id
        LEFT JOIN boq_items bi ON bi.id = rbi.boq_item_id
        WHERE rb.sap_work_key = ?
      `, [sap_work_key]);

      const insertedItems = [];
      for (const item of items) {
        const [result] = await connection.execute(`
          INSERT INTO boq_items
          (sap_work_key, part_section, ssr_code, additional_specification, description, unit, boq_quantity, rate, amount, item_no)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          sap_work_key,
          item.part_section || "Other",
          item.ssr_code ?? "",
          item.additional_specification ?? null,
          item.description,
          item.unit,
          item.boq_quantity || 0,
          item.rate || 0,
          item.amount ?? (item.boq_quantity * item.rate) ?? 0,
          item.item_no || null
        ]);
        insertedItems.push({ id: result.insertId, ...item });
      }

      const oldById = new Map(existingItems.map((item) => [Number(item.id), item]));
      for (const entry of existingEntries) {
        const oldItem = oldById.get(Number(entry.boq_item_id));
        const matchingItems = insertedItems.filter((item) => String(item.item_no ?? "") === String(oldItem?.item_no ?? ""));
        const target = matchingItems.find((item) => item.ssr_code === oldItem?.ssr_code)
          || (matchingItems.length === 1 ? matchingItems[0] : null);

        if (!target) continue;
        await connection.execute(`
          UPDATE measurement_entries
          SET boq_item_id = ?, ssr_code = ?, description = ?, unit = ?, boq_quantity = ?, rate = ?
          WHERE id = ?
        `, [
          target.id,
          target.ssr_code ?? "",
          target.description,
          target.unit || "Nos",
          target.boq_quantity || 0,
          target.rate || 0,
          entry.id
        ]);
      }

      // Preserve the link from historic RA bill items to the replacement BOQ rows
      const billOldById = new Map(existingItems.map((item) => [Number(item.id), item]));
      for (const billItem of existingBillItems) {
        const oldItem = billOldById.get(Number(billItem.boq_item_id));
        const matchingItems = insertedItems.filter((item) => String(item.item_no ?? "") === String(oldItem?.item_no ?? ""));
        const target = matchingItems.find((item) => item.ssr_code === oldItem?.ssr_code)
          || (matchingItems.length === 1 ? matchingItems[0] : null);

        if (!target) continue;
        await connection.execute(
          "UPDATE ra_bill_items SET boq_item_id = ?, ssr_code = ?, unit = ? WHERE id = ?",
          [target.id, target.ssr_code ?? "", target.unit || "Nos", billItem.id]
        );
      }

      const referencedIds = new Set([
        ...existingEntries.map((e) => Number(e.boq_item_id)),
        ...existingBillItems.map((b) => Number(b.boq_item_id)).filter(Boolean)
      ]);
      const deletableIds = existingItems
        .map((item) => Number(item.id))
        .filter((id) => !referencedIds.has(id));

      if (deletableIds.length) {
        const placeholders = deletableIds.map(() => "?").join(", ");
        await connection.execute(
          `DELETE FROM boq_items WHERE sap_work_key = ? AND id IN (${placeholders})`,
          [sap_work_key, ...deletableIds]
        );
      }

      return insertedItems;
    });
  },

  /**
   * Create single BOQ item
   */
  create: async (itemData) => {
    const { sap_work_key, part_section, ssr_code, additional_specification, description, unit, boq_quantity, rate, amount, item_no } = itemData;
    const sql = `
      INSERT INTO boq_items (sap_work_key, part_section, ssr_code, additional_specification, description, unit, boq_quantity, rate, amount, item_no)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      sap_work_key, part_section || "Other", ssr_code, additional_specification ?? null, description, unit || "Nos",
      boq_quantity || 0, rate || 0, amount || (boq_quantity * rate) || 0, item_no
    ]);
    return { id: result.insertId, ...itemData, unit: unit || "Nos" };
  },

  /**
   * Find by ID
   */
  findById: async (id) => {
    const sql = `SELECT * FROM boq_items WHERE id = ?`;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Find by SAP Work Key
   */
  findBySapKey: async (sap_work_key, partSection = "") => {
    let sql = `SELECT * FROM boq_items WHERE sap_work_key = ?`;
    const params = [sap_work_key];
    if (partSection) {
      sql += ` AND part_section = ?`;
      params.push(partSection);
    }
    sql += ` ORDER BY part_section, item_no, id`;
    return query(sql, params);
  },

  /**
   * Search SSR Code
   */
  searchBySsrCode: async (sap_work_key, ssrCode) => {
    const sql = `SELECT * FROM boq_items WHERE sap_work_key = ? AND ssr_code LIKE ? ORDER BY ssr_code`;
    return query(sql, [sap_work_key, `%${ssrCode}%`]);
  },

  /**
   * Update BOQ item
   */
  update: async (id, itemData) => {
    const allowedFields = ["part_section", "ssr_code", "additional_specification", "description", "unit", "boq_quantity", "rate", "amount", "item_no"];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(itemData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return null;

    values.push(id);
    const sql = `UPDATE boq_items SET ${updates.join(", ")} WHERE id = ?`;
    await query(sql, values);
    return BOQModel.findById(id);
  },

  /**
   * Delete BOQ item
   */
  delete: async (id) => {
    const sql = `DELETE FROM boq_items WHERE id = ?`;
    await query(sql, [id]);
    return true;
  },

  /**
   * Delete all BOQ items for a project
   */
  deleteBySapKey: async (sap_work_key) => {
    const sql = `DELETE FROM boq_items WHERE sap_work_key = ?`;
    await query(sql, [sap_work_key]);
    return true;
  },

  /**
   * Get BOQ statistics
   */
  getStats: async (sap_work_key) => {
    const sql = `
      SELECT 
        COUNT(*) as total_items,
        SUM(amount) as total_amount,
        SUM(boq_quantity) as total_quantity,
        part_section,
        COUNT(*) as section_count,
        SUM(amount) as section_amount
      FROM boq_items 
      WHERE sap_work_key = ?
      GROUP BY part_section
    `;
    return query(sql, [sap_work_key]);
  },

  /**
   * Record upload
   */
  recordUpload: async (uploadData) => {
    const { sap_work_key, file_name, file_path, file_size, uploaded_by } = uploadData;
    const sql = `
      INSERT INTO boq_uploads (sap_work_key, file_name, file_path, file_size, uploaded_by)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [sap_work_key, file_name, file_path, file_size, uploaded_by]);
    return result.insertId;
  },

  /**
   * Update upload status
   */
  updateUploadStatus: async (uploadId, status, itemsCount, errorMsg) => {
    const sql = `
      UPDATE boq_uploads 
      SET upload_status = ?, extracted_items = ?, error_message = ?
      WHERE id = ?
    `;
    await query(sql, [status, itemsCount, errorMsg, uploadId]);
  }
};

export default BOQModel;
