-- ================================================================
--  PothoSense v4  Database Migration
--  MySQL 8.0 compatible  run once in MySQL Workbench
--  Select ALL text, then click the lightning bolt (Execute)
-- ================================================================
use pothosense;
show tables;
-- 1. Supervisors table
CREATE TABLE IF NOT EXISTS supervisors (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  employee_id   VARCHAR(20)  NOT NULL UNIQUE,
  email         VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  zone          VARCHAR(100),
  admin_key     VARCHAR(64)  NOT NULL UNIQUE,
  otp_code      VARCHAR(10)  DEFAULT NULL,
  otp_expires   DATETIME     DEFAULT NULL,
  is_active     TINYINT(1)   DEFAULT 1,
  created_at    DATETIME     DEFAULT NOW()
);

-- 2. Add columns to staff table (one at a time, no IF NOT EXISTS)
--    If any column already exists, comment it out and re-run.

-- ALTER TABLE staff ADD COLUMN supervisor_id       INT            NULL;
ALTER TABLE staff ADD COLUMN performance_rating  DECIMAL(3,2)   NOT NULL DEFAULT 5.00;
ALTER TABLE staff ADD COLUMN active_jobs         INT            NOT NULL DEFAULT 0;
ALTER TABLE staff ADD COLUMN availability        ENUM('available','busy','off_duty') NOT NULL DEFAULT 'available';
ALTER TABLE staff ADD COLUMN otp_code            VARCHAR(10)    DEFAULT NULL;
ALTER TABLE staff ADD COLUMN otp_expires         DATETIME       DEFAULT NULL;

-- repairs_completed may already exist from a previous migration  skip if so
-- ALTER TABLE staff ADD COLUMN repairs_completed INT NOT NULL DEFAULT 0;

-- 3. Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  report_id     INT      NOT NULL,
  staff_id      INT      NOT NULL,
  supervisor_id INT      NOT NULL,
  assigned_at   DATETIME DEFAULT NOW(),
  due_by        DATETIME DEFAULT NULL,
  notes         TEXT     DEFAULT NULL,
  auto_assigned TINYINT(1) DEFAULT 0,
  UNIQUE KEY uq_report (report_id),
  FOREIGN KEY (report_id)     REFERENCES reports(id)      ON DELETE CASCADE,
  FOREIGN KEY (staff_id)      REFERENCES staff(id)        ON DELETE CASCADE,
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id)  ON DELETE CASCADE
);

-- 4. Foreign key from staff to supervisors
ALTER TABLE staff
  ADD CONSTRAINT fk_staff_supervisor
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id) ON DELETE SET NULL;

-- 5. Default supervisor (password: Supervisor@123)
INSERT IGNORE INTO supervisors
  (name, employee_id, email, password_hash, zone, admin_key)
VALUES (
  'Head Supervisor',
  'SUP001',
  'supervisor@pothosense.com',
  '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE.9by/vQHGYkFqPK',
  'All Zones',
  'SUP_001_KEY_SHARE_WITH_STAFF'
);

-- Done.
-- Default supervisor login:
--   Employee ID : SUP001
--   Password    : Supervisor@123
--   Admin key   : SUP_001_KEY_SHARE_WITH_STAFF  (share with your staff to register)