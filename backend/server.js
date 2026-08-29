/**
 * PCMC BillPro - Backend Server
 * Civil Construction Billing Automation System
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

import { checkConnection, testConnection } from "./config/database.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import boqRoutes from "./routes/boq.routes.js";
import measurementRoutes from "./routes/measurement.routes.js";
import abstractRoutes from "./routes/abstract.routes.js";
import rabillRoutes from "./routes/rabill.routes.js";
import reportRoutes from "./routes/report.routes.js";
import dakhalaRoutes from "./routes/dakhala.routes.js";
import documentRoutes from "./routes/document.routes.js";

// Models (for table creation)
import { UserModel } from "./models/user.model.js";
import { ProjectModel } from "./models/project.model.js";
import { BOQModel } from "./models/boq.model.js";
import { MeasurementModel } from "./models/measurement.model.js";
import { RABillModel } from "./models/rabill.model.js";
import { DakhalaModel } from "./models/dakhala.model.js";
import { DocumentModel } from "./models/document.model.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const DATABASE_RETRY_MS = Number.parseInt(process.env.DATABASE_RETRY_MS || "5000", 10);
const DATABASE_HEALTH_CHECK_MS = Number.parseInt(process.env.DATABASE_HEALTH_CHECK_MS || "10000", 10);
const AUTO_START_MYSQL = process.env.AUTO_START_MYSQL !== "false";
const MYSQLD_PATH = process.env.MYSQLD_PATH || "C:/xampp/mysql/bin/mysqld.exe";
const MYSQL_INI_PATH = process.env.MYSQL_INI_PATH || "C:/xampp/mysql/bin/my.ini";
const configuredCorsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedCorsOrigins = new Set([
  ...configuredCorsOrigins,
  "http://localhost",
  "http://localhost:5173",
  "http://localhost:5000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5000",
  "capacitor://localhost",
  "ionic://localhost",
  "https://localhost"
]);
let databaseReady = false;
let databaseInitializing = false;
let mysqlStartRequested = false;
let retryTimer = null;

// Trust reverse proxy for HTTPS headers (Nginx / Cloudflare / Load Balancers)
app.set("trust proxy", 1);

/**
 * Start the local XAMPP MySQL server only when it is actually unavailable.
 * This is intentionally limited to Windows + localhost, so a remote database
 * is never started or touched by this application.
 */
const startLocalMySql = () => {
  const isLocalDatabase = ["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST || "localhost");
  if (
    process.platform !== "win32" ||
    !AUTO_START_MYSQL ||
    !isLocalDatabase ||
    mysqlStartRequested ||
    !fs.existsSync(MYSQLD_PATH)
  ) {
    return;
  }

  mysqlStartRequested = true;
  const args = fs.existsSync(MYSQL_INI_PATH)
    ? [`--defaults-file=${MYSQL_INI_PATH}`, "--standalone"]
    : ["--standalone"];

  try {
    const mysqlProcess = spawn(MYSQLD_PATH, args, {
      detached: true,
      stdio: "ignore",
      windowsHide: true
    });
    mysqlProcess.unref();
    console.log("Requested local XAMPP MySQL startup. Waiting for it to become ready...");
  } catch (error) {
    console.error("Could not request local MySQL startup:", error.message);
  }

  // Permit one more request later if XAMPP did not start successfully.
  setTimeout(() => {
    if (!databaseReady) mysqlStartRequested = false;
  }, Math.max(DATABASE_RETRY_MS * 2, 15000)).unref();
};

const scheduleDatabaseRetry = () => {
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connectDatabase();
  }, DATABASE_RETRY_MS);
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));

// CORS Configuration supporting Web, Android Capacitor, iOS, Tablet & Custom Domains
app.use(cors({
  origin: (origin, callback) => {
    // Always allow mobile apps (Capacitor/Ionic), curl/tools without origin, or wildcard CORS
    if (!origin || configuredCorsOrigins.includes("*") || configuredCorsOrigins.length === 0) {
      return callback(null, true);
    }
    if (allowedCorsOrigins.has(origin) || origin.startsWith("capacitor://") || origin.startsWith("ionic://") || origin.includes("localhost")) {
      return callback(null, true);
    }
    const isAllowed = configuredCorsOrigins.some(allowed => origin.includes(allowed.replace(/^https?:\/\//, '')));
    if (isAllowed) return callback(null, true);
    return callback(null, true);
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { success: false, message: "Too many requests, please try again later." }
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Comprehensive 3-Tier Health Check Endpoints (Internet, Backend, MySQL)
const healthHandler = (req, res) => {
  const status = databaseReady ? "healthy" : "degraded";
  res.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    status,
    message: databaseReady ? "PCMC BillPro Central API is running" : "PCMC BillPro is waiting for MySQL database",
    internet: true,
    backend: "connected",
    database: databaseReady ? "connected" : "connecting",
    version: "1.0.0",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
};

app.get("/", healthHandler);
app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

// Keep Express alive while MySQL is starting, but let health checks through
app.use((req, res, next) => {
  if (req.path === "/health" || req.path === "/api/health") {
    return next();
  }
  if (!databaseReady) {
    return res.status(503).json({
      success: false,
      message: "Database is connecting. Please retry in a few seconds."
    });
  }
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/boq", boqRoutes);
app.use("/api/measurement-books", measurementRoutes);
app.use("/api/abstract", abstractRoutes);
app.use("/api/ra-bills", rabillRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dakhala", dakhalaRoutes);
app.use("/api/documents", documentRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

/**
 * Initialize database tables
 */
const initializeDatabase = async () => {
  console.log("Initializing database tables...");
  await UserModel.createTable();
  await ProjectModel.createTable();
  await BOQModel.createTable();
  await BOQModel.createUploadsTable();
  await MeasurementModel.createTable();
  await MeasurementModel.createEntriesTable();
  await RABillModel.createTable();
  await RABillModel.createItemsTable();
  await DakhalaModel.createTable();
  await DocumentModel.createTable();
  await UserModel.seedAdmin();
  console.log("Database initialized successfully");
};

/**
 * Connect to MySQL and create tables. A stopped XAMPP MySQL service should
 * never kill the API: it will retry until the service comes back.
 */
const connectDatabase = async () => {
  if (databaseInitializing || databaseReady) return;
  databaseInitializing = true;
  try {
    await testConnection();
    await initializeDatabase();
    databaseReady = true;
    mysqlStartRequested = false;
    console.log("Database is ready for requests");
  } catch (error) {
    databaseReady = false;
    if (error.code === "ECONNREFUSED") startLocalMySql();
    console.error(`Database is unavailable. Retrying in ${DATABASE_RETRY_MS / 1000} seconds:`, error.message);
    scheduleDatabaseRetry();
  } finally {
    databaseInitializing = false;
  }
};

const monitorDatabase = async () => {
  if (databaseInitializing) return;

  try {
    await checkConnection();
    // If MySQL came back between retries, run the normal initialization before
    // accepting API requests again.
    if (!databaseReady) connectDatabase();
  } catch (error) {
    if (databaseReady) {
      console.error("MySQL connection was lost. Temporarily pausing API requests until it recovers.");
    }
    databaseReady = false;
    if (error.code === "ECONNREFUSED") startLocalMySql();
    connectDatabase();
  }
};

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`PCMC BillPro Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  connectDatabase();
});

setInterval(monitorDatabase, DATABASE_HEALTH_CHECK_MS).unref();

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Close the other backend process, then restart this server.`);
    return;
  }
  console.error("Server error:", error);
});

export default app;
