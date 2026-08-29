/**
 * Database Configuration & Connection Pool
 * PCMC BillPro - MySQL Connection Manager
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const getPoolConfig = () => {
  const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

  const baseOptions = {
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "20", 10),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 15000
  };

  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);
      const host = parsed.hostname;
      const port = parseInt(parsed.port || "3306", 10);
      const user = decodeURIComponent(parsed.username || "root");
      const password = decodeURIComponent(parsed.password || "");
      const dbName = parsed.pathname ? parsed.pathname.replace(/^\//, "") : "";
      const database = dbName || process.env.DB_NAME || process.env.MYSQLDATABASE || "railway";
      const isInternal = host.endsWith(".railway.internal") || host === "localhost" || host === "127.0.0.1";

      console.log(`Configuring MySQL connection to: ${user}@${host}:${port}/${database} (Internal: ${isInternal})`);

      const config = {
        host,
        port,
        user,
        password,
        database,
        ...baseOptions
      };

      if (process.env.DB_SSL === "true" || (!isInternal && process.env.DB_SSL === "require")) {
        config.ssl = { rejectUnauthorized: false };
      }

      return config;
    } catch (e) {
      console.warn("Could not parse database URL with URL constructor:", e.message);
    }
  }

  const host = process.env.DB_HOST || process.env.MYSQLHOST || "localhost";
  const port = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || "3306", 10);
  const database = process.env.DB_NAME || process.env.MYSQLDATABASE || "pcmc_billpro";
  const user = process.env.DB_USER || process.env.MYSQLUSER || "root";
  const password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "";
  const isInternal = host.endsWith(".railway.internal") || host === "localhost" || host === "127.0.0.1";

  console.log(`Configuring MySQL connection to: ${user}@${host}:${port}/${database} (Internal: ${isInternal})`);

  const config = {
    host,
    port,
    database,
    user,
    password,
    ...baseOptions
  };

  if (process.env.DB_SSL === "true" || (!isInternal && process.env.DB_SSL === "require")) {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
};

const pool = mysql.createPool(getPoolConfig());

/**
 * Check that a connection can be obtained from the pool.  This is deliberately
 * quiet so the server can use it for its background database health check.
 */
export const checkConnection = async () => {
  const connection = await pool.getConnection();
  connection.release();
  return true;
};

/**
 * Test database connection
 */
export const testConnection = async () => {
  try {
    await checkConnection();
    console.log("✅ MySQL Database connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message, error.code || "");
    throw error;
  }
};

/**
 * Execute query with error handling
 */
export const query = async (sql, params) => {
  try {
    // mysql2 rejects JavaScript `undefined` values before it sends a query.
    // Optional form fields are represented by SQL NULL instead, which keeps a
    // missing optional project field from crashing a project save.
    const safeParams = Array.isArray(params)
      ? params.map((value) => value === undefined ? null : value)
      : params;
    const [rows] = await pool.execute(sql, safeParams);
    return rows;
  } catch (error) {
    console.error("Database Query Error:", error.message);
    console.error("SQL:", sql);
    throw error;
  }
};

/**
 * Execute transaction
 */
export const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default pool;
