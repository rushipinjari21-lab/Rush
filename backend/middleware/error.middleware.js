/**
 * Error Handling Middleware
 * PCMC BillPro - Centralized Error Handler
 */

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // MySQL duplicate entry error
  if (err.code === "ER_DUP_ENTRY") {
    statusCode = 409;
    message = "Duplicate entry. Record already exists.";
  }

  // MySQL foreign key constraint error
  if (err.code === "ER_NO_REFERENCED_ROW_2" || err.code === "ER_ROW_IS_REFERENCED_2") {
    statusCode = 400;
    message = "Referenced record not found or record is in use.";
  }

  // Validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed.";
  }

  // Multer file upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "File too large. Maximum size is 10MB.";
  }

  // XAMPP/MySQL may be starting or temporarily restarting. Return a clear
  // retry response while the backend remains alive instead of showing a
  // misleading login or project-save failure.
  if (["ECONNREFUSED", "PROTOCOL_CONNECTION_LOST", "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR", "ER_CON_COUNT_ERROR"].includes(err.code)) {
    statusCode = 503;
    message = "Database is temporarily unavailable. Please try again in a few seconds.";
  }

  console.error(`[ERROR] ${statusCode}: ${message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 */
export const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.originalUrl}`);
  next(error);
};

/**
 * Async handler wrapper
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default { errorHandler, notFound, asyncHandler, ApiError };
