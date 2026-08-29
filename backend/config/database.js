/**
 * Database Configuration & Connection Pool
 * PCMC BillPro - MySQL Connection Manager
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const clean = (val) => {
  if (!val) return "";
  let s = String(val).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
};

const getPoolConfig = () => {
  const rawUrl = clean(
    process.env.DATABASE_URL || 
    process.env.MYSQL_URL || 
    process.env.MYSQL_PRIVATE_URL || 
    process.env.MYSQL_PUBLIC_URL || 
    process.env.DB_URL
  );

  const isRailway = Boolean(process.env.RAILWAY_ENVIRONMENT_ID || process.env.RAILWAY_SERVICE_ID || process.env.RAILWAY_PROJECT_ID);

  const baseOptions = {
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "20", 10),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 15000
  };

  if (rawUrl && !rawUrl.startsWith("${{")) {
    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname;
      const port = parseInt(parsed.port || "3306", 10);
      const user = decodeURIComponent(parsed.username || "root");
      const password = decodeURIComponent(parsed.password || "");
      const dbName = parsed.pathname ? parsed.pathname.replace(/^\//, "") : "";
      const database = dbName || clean(process.env.DB_NAME || process.env.MYSQLDATABASE) || "railway";
      const isInternal = host.endsWith(".railway.internal") || host === "localhost" || host === "127.0.0.1";

      console.log(`Configuring MySQL via URL: ${user}@${host}:${port}/${database} (Internal: ${isInternal})`);

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

  let host = clean(process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST);
  if ((!host || host === "localhost") && isRailway) {
    host = "mysql.railway.internal";
  } else if (!host) {
    host = "localhost";
  }

  const port = parseInt(clean(process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT) || "3306", 10);
  const database = clean(process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE) || (isRailway ? "railway" : "pcmc_billpro");
  const user = clean(process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER) || "root";
  const password = clean(process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || "");
  const isInternal = host.endsWith(".railway.internal") || host === "localhost" || host === "127.0.0.1";

  console.log(`Configuring MySQL via parameters: ${user}@${host}:${port}/${database} (Internal: ${isInternal}, Railway: ${isRailway})`);

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
