/**
 * File Upload Middleware
 * PCMC BillPro - Multer Configuration for BOQ PDF Uploads
 */
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760"); // 10MB
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = process.env.UPLOAD_PATH
  ? path.resolve(process.cwd(), process.env.UPLOAD_PATH)
  : path.resolve(__dirname, "..", "uploads");
const BOQ_UPLOAD_DIR = path.join(UPLOAD_ROOT, "boq");

// Multer does not create nested folders automatically.  Create the BOQ folder
// when the server starts so a first PDF upload cannot fail with ENOENT.
fs.mkdirSync(BOQ_UPLOAD_DIR, { recursive: true });

/**
 * Storage configuration
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BOQ_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

/**
 * File filter - PDF only
 */
const fileFilter = (req, file, cb) => {
  const hasPdfExtension = path.extname(file.originalname).toLowerCase() === ".pdf";
  if (file.mimetype === "application/pdf" || hasPdfExtension) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

/**
 * Multer upload instance
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
});

/**
 * Error handler for multer
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

export default { upload, handleUploadError };
