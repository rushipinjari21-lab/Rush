/**
 * Project Model
 * PCMC BillPro - Project Master
 */
import { query, transaction } from "../config/database.js";

export const ProjectModel = {
  /**
   * Create projects table
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sap_work_key VARCHAR(50) NOT NULL UNIQUE,
        work_name VARCHAR(500) NOT NULL,
        contractor_name VARCHAR(200) NOT NULL,
        contractor_address TEXT,
        pan VARCHAR(20),
        gst VARCHAR(30),
        work_order_no VARCHAR(100) NOT NULL,
        tender_no VARCHAR(100),
        agreement_no VARCHAR(100),
        department VARCHAR(100) NOT NULL,
        division VARCHAR(100),
        ward VARCHAR(100),
        budget_head VARCHAR(100) NOT NULL,
        estimated_cost DECIMAL(18, 2) NOT NULL DEFAULT 0,
        contract_amount DECIMAL(18, 2) DEFAULT 0,
        tender_percentage DECIMAL(8, 4) DEFAULT 0,
        admin_approval VARCHAR(200),
        tech_sanction VARCHAR(200),
        start_date DATE,
        completion_date DATE,
        engineer_name VARCHAR(100),
        deputy_engineer VARCHAR(100),
        executive_engineer VARCHAR(100),
        status ENUM('active', 'completed', 'on_hold', 'cancelled') NOT NULL DEFAULT 'active',
        remarks TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_sap_key (sap_work_key),
        INDEX idx_status (status),
        INDEX idx_department (department),
        INDEX idx_contractor (contractor_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await query(sql);

    const extraCols = [
      "contractor_address TEXT NULL",
      "pan VARCHAR(20) NULL",
      "gst VARCHAR(30) NULL",
      "agreement_no VARCHAR(100) NULL",
      "division VARCHAR(100) NULL",
      "ward VARCHAR(100) NULL",
      "contract_amount DECIMAL(18, 2) NULL DEFAULT 0",
      "tender_percentage DECIMAL(8, 4) NULL DEFAULT 0",
      "admin_approval VARCHAR(200) NULL",
      "tech_sanction VARCHAR(200) NULL",
      "engineer_name VARCHAR(100) NULL",
      "deputy_engineer VARCHAR(100) NULL",
      "executive_engineer VARCHAR(100) NULL"
    ];

    for (const colDef of extraCols) {
      const colName = colDef.split(" ")[0];
      const colCheck = await query(`SHOW COLUMNS FROM projects LIKE '${colName}'`);
      if (!colCheck.length) {
        await query(`ALTER TABLE projects ADD COLUMN ${colDef}`);
      }
    }
  },

  /**
   * Create project
   */
  create: async (projectData) => {
    const {
      sap_work_key, work_name, contractor_name, contractor_address, pan, gst,
      work_order_no, tender_no, agreement_no, department, division, ward,
      budget_head, estimated_cost, contract_amount, tender_percentage,
      admin_approval, tech_sanction, start_date, completion_date,
      engineer_name, deputy_engineer, executive_engineer, status, remarks, created_by
    } = projectData;

    const sql = `
      INSERT INTO projects 
      (sap_work_key, work_name, contractor_name, contractor_address, pan, gst,
       work_order_no, tender_no, agreement_no, department, division, ward,
       budget_head, estimated_cost, contract_amount, tender_percentage,
       admin_approval, tech_sanction, start_date, completion_date,
       engineer_name, deputy_engineer, executive_engineer, status, remarks, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      sap_work_key, work_name, contractor_name, contractor_address ?? null, pan ?? null, gst ?? null,
      work_order_no, tender_no ?? null, agreement_no ?? null, department, division ?? null, ward ?? null,
      budget_head, estimated_cost || 0, contract_amount ?? estimated_cost ?? 0, tender_percentage ?? 0,
      admin_approval ?? null, tech_sanction ?? null, start_date ?? null, completion_date ?? null,
      engineer_name ?? null, deputy_engineer ?? null, executive_engineer ?? null,
      status || "active", remarks ?? null, created_by ?? null
    ]);
    return { id: result.insertId, ...projectData };
  },

  /**
   * Find by SAP Work Key
   */
  findBySapKey: async (sap_work_key) => {
    const sql = `SELECT * FROM projects WHERE sap_work_key = ?`;
    const rows = await query(sql, [sap_work_key]);
    return rows[0] || null;
  },

  /**
   * Find by ID
   */
  findById: async (id) => {
    const sql = `SELECT * FROM projects WHERE id = ?`;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Update project
   */
  update: async (sap_work_key, projectData) => {
    const allowedFields = [
      "work_name", "contractor_name", "contractor_address", "pan", "gst",
      "work_order_no", "tender_no", "agreement_no", "department", "division", "ward",
      "budget_head", "estimated_cost", "contract_amount", "tender_percentage",
      "admin_approval", "tech_sanction", "start_date", "completion_date",
      "engineer_name", "deputy_engineer", "executive_engineer", "status", "remarks"
    ];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(projectData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return null;

    values.push(sap_work_key);
    const sql = `UPDATE projects SET ${updates.join(", ")} WHERE sap_work_key = ?`;
    await query(sql, values);
    return ProjectModel.findBySapKey(sap_work_key);
  },

  /**
   * Delete project
   */
  delete: async (sap_work_key) => {
    const sql = `DELETE FROM projects WHERE sap_work_key = ?`;
    await query(sql, [sap_work_key]);
    return true;
  },

  /**
   * Get all projects with pagination and filters
   */
  findAll: async (filters = {}) => {
    const { page = 1, limit = 50, search = "", status = "", department = "" } = filters;
    let sql = `SELECT * FROM projects WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as total FROM projects WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (sap_work_key LIKE ? OR work_name LIKE ? OR contractor_name LIKE ?)`;
      countSql += ` AND (sap_work_key LIKE ? OR work_name LIKE ? OR contractor_name LIKE ?)`;
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    if (status) {
      sql += ` AND status = ?`;
      countSql += ` AND status = ?`;
      params.push(status);
    }

    if (department) {
      sql += ` AND department = ?`;
      countSql += ` AND department = ?`;
      params.push(department);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const queryParams = [...params, limit, (page - 1) * limit];

    const [projects, countResult] = await Promise.all([
      query(sql, queryParams),
      query(countSql, params)
    ]);

    return {
      projects,
      total: countResult[0].total,
      page,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  },

  /**
   * Get project statistics
   */
  getStats: async () => {
    const sql = `
      SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_projects,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
        SUM(estimated_cost) as total_estimated_cost
      FROM projects
    `;
    const rows = await query(sql);
    return rows[0];
  },

  /**
   * Get distinct departments
   */
  getDepartments: async () => {
    const sql = `SELECT DISTINCT department FROM projects ORDER BY department`;
    return query(sql);
  }
};

export default ProjectModel;
