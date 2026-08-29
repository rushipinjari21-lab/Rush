-- ==========================================================
-- PCMC BillPro - Central MySQL Database Initialization Schema
-- Pimpri Chinchwad Municipal Corporation (PCMC) Billing System
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `pcmc_billpro` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pcmc_billpro`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'engineer', 'accountant', 'contractor') NOT NULL DEFAULT 'engineer',
  `department` VARCHAR(100),
  `phone` VARCHAR(20),
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `last_login` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sap_work_key` VARCHAR(50) NOT NULL UNIQUE,
  `work_name` VARCHAR(500) NOT NULL,
  `contractor_name` VARCHAR(200) NOT NULL,
  `contractor_address` TEXT,
  `pan` VARCHAR(20),
  `gst` VARCHAR(30),
  `work_order_no` VARCHAR(100) NOT NULL,
  `tender_no` VARCHAR(100),
  `agreement_no` VARCHAR(100),
  `department` VARCHAR(100) NOT NULL,
  `division` VARCHAR(100),
  `ward` VARCHAR(100),
  `budget_head` VARCHAR(100) NOT NULL,
  `estimated_cost` DECIMAL(18, 2) NOT NULL DEFAULT 0,
  `contract_amount` DECIMAL(18, 2) DEFAULT 0,
  `tender_percentage` DECIMAL(8, 4) DEFAULT 0,
  `admin_approval` VARCHAR(200),
  `tech_sanction` VARCHAR(200),
  `start_date` DATE,
  `completion_date` DATE,
  `engineer_name` VARCHAR(100),
  `deputy_engineer` VARCHAR(100),
  `executive_engineer` VARCHAR(100),
  `status` ENUM('active', 'completed', 'on_hold', 'cancelled') NOT NULL DEFAULT 'active',
  `remarks` TEXT,
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_sap_key` (`sap_work_key`),
  INDEX `idx_status` (`status`),
  INDEX `idx_department` (`department`),
  INDEX `idx_contractor` (`contractor_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bill of Quantities (BOQ Items / Schedule-B) Table
CREATE TABLE IF NOT EXISTS `boq_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sap_work_key` VARCHAR(50) NOT NULL,
  `part_section` ENUM('Part A', 'Part B', 'Part C', 'Part D', 'Other') NOT NULL DEFAULT 'Other',
  `ssr_code` VARCHAR(50) NOT NULL,
  `additional_specification` VARCHAR(100),
  `description` TEXT NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `boq_quantity` DECIMAL(18, 4) NOT NULL DEFAULT 0,
  `rate` DECIMAL(18, 2) NOT NULL DEFAULT 0,
  `amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
  `item_no` VARCHAR(20),
  `page_no` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sap_work_key`) REFERENCES `projects`(`sap_work_key`) ON DELETE CASCADE,
  INDEX `idx_sap_key` (`sap_work_key`),
  INDEX `idx_ssr_code` (`ssr_code`),
  INDEX `idx_part` (`part_section`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BOQ Uploads Tracking Table
CREATE TABLE IF NOT EXISTS `boq_uploads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sap_work_key` VARCHAR(50) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` INT,
  `upload_status` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  `extracted_items` INT DEFAULT 0,
  `error_message` TEXT,
  `uploaded_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sap_work_key`) REFERENCES `projects`(`sap_work_key`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Measurement Books (MB Form 45) Table
CREATE TABLE IF NOT EXISTS `measurement_books` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sap_work_key` VARCHAR(50) NOT NULL,
  `mb_number` VARCHAR(50) NOT NULL,
  `mb_date` DATE NOT NULL,
  `description` TEXT,
  `status` ENUM('draft', 'verified', 'approved') DEFAULT 'draft',
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sap_work_key`) REFERENCES `projects`(`sap_work_key`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `uk_sap_mb` (`sap_work_key`, `mb_number`),
  INDEX `idx_sap_key` (`sap_work_key`),
  INDEX `idx_mb_number` (`mb_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Measurement Entries (Field Measurements) Table
CREATE TABLE IF NOT EXISTS `measurement_entries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `mb_id` INT NOT NULL,
  `boq_item_id` INT NOT NULL,
  `ssr_code` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `unit` VARCHAR(50) NOT NULL,
  `boq_quantity` DECIMAL(18, 4) NOT NULL DEFAULT 0,
  `rate` DECIMAL(18, 2) NOT NULL DEFAULT 0,
  `location` VARCHAR(500) NOT NULL,
  `remark` TEXT,
  `length` DECIMAL(18, 4) DEFAULT 0,
  `breadth` DECIMAL(18, 4) DEFAULT 0,
  `height` DECIMAL(18, 4) DEFAULT 0,
  `quantity` DECIMAL(18, 4) NOT NULL DEFAULT 0,
  `total_quantity` DECIMAL(18, 4) NOT NULL DEFAULT 0,
  `entry_date` DATE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`mb_id`) REFERENCES `measurement_books`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`boq_item_id`) REFERENCES `boq_items`(`id`) ON DELETE RESTRICT,
  INDEX `idx_mb_id` (`mb_id`),
  INDEX `idx_boq_item` (`boq_item_id`),
  INDEX `idx_ssr_code` (`ssr_code`),
  INDEX `idx_entry_date` (`entry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Running Account (RA) Bills Table
CREATE TABLE IF NOT EXISTS `ra_bills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sap_work_key` VARCHAR(50) NOT NULL,
  `mb_id` INT NOT NULL,
  `bill_number` INT NOT NULL,
  `bill_type` ENUM('RA', 'Final', 'Advance') NOT NULL DEFAULT 'RA',
  `bill_date` DATE NOT NULL,
  `period_from` DATE,
  `period_to` DATE,
  `total_work_done_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
  `previous_bill_amount` DECIMAL(18, 2) DEFAULT 0,
  `this_bill_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
  `tender_premium_percentage` DECIMAL(8, 4) DEFAULT 0,
  `tender_premium_amount` DECIMAL(18, 2) DEFAULT 0,
  `gross_bill_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
  `security_deposit_rate` DECIMAL(5, 2) DEFAULT 5.00,
  `security_deposit_amount` DECIMAL(18, 2) DEFAULT 0,
  `income_tax_rate` DECIMAL(5, 2) DEFAULT 2.00,
  `income_tax_amount` DECIMAL(18, 2) DEFAULT 0,
  `gst_tds_rate` DECIMAL(5, 2) DEFAULT 2.00,
  `gst_tds_amount` DECIMAL(18, 2) DEFAULT 0,
  `labour_cess_rate` DECIMAL(5, 2) DEFAULT 1.00,
  `labour_cess_amount` DECIMAL(18, 2) DEFAULT 0,
  `royalty_charges` DECIMAL(18, 2) DEFAULT 0,
  `water_charges` DECIMAL(18, 2) DEFAULT 0,
  `testing_charges` DECIMAL(18, 2) DEFAULT 0,
  `penalty_amount` DECIMAL(18, 2) DEFAULT 0,
  `other_recovery` DECIMAL(18, 2) DEFAULT 0,
  `total_recovery_amount` DECIMAL(18, 2) DEFAULT 0,
  `net_payable_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
  `net_payable_words` TEXT,
  `status` ENUM('draft', 'submitted', 'verified', 'approved', 'paid') DEFAULT 'draft',
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sap_work_key`) REFERENCES `projects`(`sap_work_key`) ON DELETE CASCADE,
  FOREIGN KEY (`mb_id`) REFERENCES `measurement_books`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `uk_sap_bill` (`sap_work_key`, `bill_number`),
  INDEX `idx_sap_key` (`sap_work_key`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. RA Bill Line Items Table
CREATE TABLE IF NOT EXISTS `ra_bill_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ra_bill_id` INT NOT NULL,
  `boq_item_id` INT NOT NULL,
  `ssr_code` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `unit` VARCHAR(50) NOT NULL,
  `rate` DECIMAL(18, 2) NOT NULL,
  `boq_quantity` DECIMAL(18, 4) NOT NULL DEFAULT 0,
  `previous_quantity` DECIMAL(18, 4) NOT NULL DEFAULT 0,
  `current_quantity` DECIMAL(18, 4) NOT NULL DEFAULT 0,
  `total_quantity` DECIMAL(18, 4) NOT NULL DEFAULT 0,
  `previous_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
  `current_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
  `total_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ra_bill_id`) REFERENCES `ra_bills`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`boq_item_id`) REFERENCES `boq_items`(`id`) ON DELETE RESTRICT,
  INDEX `idx_ra_bill_id` (`ra_bill_id`),
  INDEX `idx_boq_item` (`boq_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Dakhala (Municipal Certificates) Table
CREATE TABLE IF NOT EXISTS `dakhala_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sap_work_key` VARCHAR(50) NOT NULL,
  `ra_bill_id` INT NULL,
  `certificate_type` VARCHAR(100) NOT NULL,
  `certificate_data` LONGTEXT NOT NULL,
  `status` ENUM('draft', 'generated', 'signed') DEFAULT 'draft',
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sap_work_key`) REFERENCES `projects`(`sap_work_key`) ON DELETE CASCADE,
  FOREIGN KEY (`ra_bill_id`) REFERENCES `ra_bills`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_sap_key` (`sap_work_key`),
  INDEX `idx_cert_type` (`certificate_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Documents Table
CREATE TABLE IF NOT EXISTS `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sap_work_key` VARCHAR(50) NOT NULL,
  `document_type` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` INT,
  `mime_type` VARCHAR(100),
  `uploaded_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sap_work_key`) REFERENCES `projects`(`sap_work_key`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_sap_key` (`sap_work_key`),
  INDEX `idx_doc_type` (`document_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- 11. Default System Admin Account
-- Username: admin | Password: password (change in production)
INSERT INTO `users` (`username`, `email`, `password`, `full_name`, `role`, `department`, `is_active`)
VALUES ('admin', 'admin@pcmc.gov.in', '$2a$12$e68Y/z1Zq.yS.bT65jT3zOh6mF6.Q8c1.3.pX8zG7uQ4Q7x5kP7X6', 'System Administrator', 'admin', 'Civil Engineering', 1)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);
