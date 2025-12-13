CREATE DATABASE IF NOT EXISTS omnico_insurance;
USE omnico_insurance;

CREATE TABLE IF NOT EXISTS tier (
  tier_id INT AUTO_INCREMENT PRIMARY KEY,
  tier_name VARCHAR(50) NOT NULL,
  discount_rate DECIMAL(5,2) NOT NULL,
  benefits_description TEXT
);

CREATE TABLE IF NOT EXISTS client_info (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'agent', 'admin') DEFAULT 'customer',
  tier_id INT,
  FOREIGN KEY (tier_id) REFERENCES tier(tier_id)
);

CREATE TABLE IF NOT EXISTS insurance_type (
  type_id INT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(50) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS policy_status (
  status_id INT AUTO_INCREMENT PRIMARY KEY,
  status_name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS policy_info (
  policy_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  base_premium DECIMAL(10,2) NOT NULL,
  status_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES client_info(user_id),
  FOREIGN KEY (type_id) REFERENCES insurance_type(type_id),
  FOREIGN KEY (status_id) REFERENCES policy_status(status_id)
);

CREATE TABLE IF NOT EXISTS payment_info (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  policy_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE,
  due_date DATE NOT NULL,
  method VARCHAR(30),
  payment_option VARCHAR(30) DEFAULT 'Monthly',
  status VARCHAR(30) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (policy_id) REFERENCES policy_info(policy_id),
  FOREIGN KEY (user_id) REFERENCES client_info(user_id)
);

CREATE TABLE IF NOT EXISTS claims (
  claim_id INT AUTO_INCREMENT PRIMARY KEY,
  policy_id INT NOT NULL,
  user_id INT NOT NULL,
  claim_date DATE NOT NULL,
  claim_amount DECIMAL(10,2) NOT NULL,
  claim_status VARCHAR(30) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (policy_id) REFERENCES policy_info(policy_id),
  FOREIGN KEY (user_id) REFERENCES client_info(user_id)
);

CREATE TABLE IF NOT EXISTS auto_policy_detail (
  policy_id INT PRIMARY KEY,
  vehicle_make VARCHAR(50),
  model VARCHAR(50),
  year INT,
  vin VARCHAR(50),
  coverage_type VARCHAR(50),
  premium_amount DECIMAL(10,2),
  FOREIGN KEY (policy_id) REFERENCES policy_info(policy_id)
);

CREATE TABLE IF NOT EXISTS home_policy_detail (
  policy_id INT PRIMARY KEY,
  property_address VARCHAR(255),
  property_value DECIMAL(12,2),
  coverage_limit DECIMAL(12,2),
  deductible DECIMAL(10,2),
  FOREIGN KEY (policy_id) REFERENCES policy_info(policy_id)
);

-- Additional policy detail tables for other insurance types
CREATE TABLE IF NOT EXISTS pet_policy_detail (
  policy_id INT PRIMARY KEY,
  pet_name VARCHAR(100),
  species VARCHAR(50),
  age INT,
  deductible DECIMAL(10,2),
  coverage_amount DECIMAL(12,2),
  premium_amount DECIMAL(10,2),
  FOREIGN KEY (policy_id) REFERENCES policy_info(policy_id)
);

CREATE TABLE IF NOT EXISTS renters_policy_detail (
  policy_id INT PRIMARY KEY,
  rental_address VARCHAR(255),
  personal_property_value DECIMAL(12,2),
  term VARCHAR(50),
  deductible DECIMAL(10,2),
  coverage_type VARCHAR(50),
  coverage_amount DECIMAL(12,2),
  premium_amount DECIMAL(10,2),
  FOREIGN KEY (policy_id) REFERENCES policy_info(policy_id)
);

CREATE TABLE IF NOT EXISTS business_policy_detail (
  policy_id INT PRIMARY KEY,
  business_name VARCHAR(150),
  business_type VARCHAR(100),
  industry VARCHAR(100),
  annual_revenue DECIMAL(15,2),
  number_of_employees INT,
  business_address VARCHAR(255),
  contact_number VARCHAR(30),
  contact_email VARCHAR(100),
  deductible DECIMAL(12,2),
  coverage_type VARCHAR(50),
  coverage_amount DECIMAL(15,2),
  premium_amount DECIMAL(12,2),
  FOREIGN KEY (policy_id) REFERENCES policy_info(policy_id)
);

CREATE TABLE IF NOT EXISTS health_policy_detail (
  policy_id INT PRIMARY KEY,
  provider VARCHAR(150),
  person_name VARCHAR(150),
  plan VARCHAR(100),
  age INT,
  deductible DECIMAL(10,2),
  coverage_amount DECIMAL(12,2),
  premium_amount DECIMAL(12,2),
  FOREIGN KEY (policy_id) REFERENCES policy_info(policy_id)
);

CREATE TABLE IF NOT EXISTS life_policy_detail (
  policy_id INT PRIMARY KEY,
  beneficiary VARCHAR(150),
  person_name VARCHAR(150),
  term VARCHAR(50),
  age INT,
  deductible DECIMAL(10,2),
  coverage_amount DECIMAL(15,2),
  premium_amount DECIMAL(12,2),
  FOREIGN KEY (policy_id) REFERENCES policy_info(policy_id)
);

CREATE TABLE IF NOT EXISTS policy_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  policy_id INT NOT NULL,
  user_id INT NOT NULL,
  status_id INT NOT NULL,
  base_premium DECIMAL(10,2) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (policy_id) REFERENCES policy_info(policy_id),
  FOREIGN KEY (user_id) REFERENCES client_info(user_id),
  FOREIGN KEY (status_id) REFERENCES policy_status(status_id)
);

CREATE TABLE IF NOT EXISTS payment_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  policy_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(30),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claim_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  claim_id INT NOT NULL,
  policy_id INT NOT NULL,
  user_id INT NOT NULL,
  claim_status VARCHAR(30) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes if they do not exist (idempotent)
DELIMITER $$
DROP PROCEDURE IF EXISTS ensure_indexes$$
CREATE PROCEDURE ensure_indexes()
BEGIN
  IF (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'policy_info' AND index_name = 'idx_policy_user') = 0 THEN
    ALTER TABLE policy_info ADD INDEX idx_policy_user (user_id);
  END IF;
  IF (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'payment_info' AND index_name = 'idx_payment_policy') = 0 THEN
    ALTER TABLE payment_info ADD INDEX idx_payment_policy (policy_id);
  END IF;
  IF (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'payment_info' AND index_name = 'idx_payment_due_date') = 0 THEN
    ALTER TABLE payment_info ADD INDEX idx_payment_due_date (due_date);
  END IF;
  IF (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'payment_info' AND index_name = 'idx_payment_status_due') = 0 THEN
    ALTER TABLE payment_info ADD INDEX idx_payment_status_due (status, due_date);
  END IF;
  IF (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'claims' AND index_name = 'idx_claims_policy') = 0 THEN
    ALTER TABLE claims ADD INDEX idx_claims_policy (policy_id);
  END IF;
END$$
CALL ensure_indexes()$$
DROP PROCEDURE IF EXISTS ensure_indexes$$
DELIMITER ;

CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES client_info(user_id) ON DELETE CASCADE
);

