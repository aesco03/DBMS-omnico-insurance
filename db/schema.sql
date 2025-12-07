CREATE DATABASE IF NOT EXISTS omnico_insurance;
USE omnico_insurance;

CREATE TABLE tier (
  tier_id INT AUTO_INCREMENT PRIMARY KEY,
  tier_name VARCHAR(50) NOT NULL,
  discount_rate DECIMAL(5,2) NOT NULL,
  benefits_description TEXT
);

CREATE TABLE client_info (
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

CREATE TABLE insurance_type (
  type_id INT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(50) NOT NULL,
  description TEXT
);

CREATE TABLE policy_status (
  status_id INT AUTO_INCREMENT PRIMARY KEY,
  status_name VARCHAR(50) NOT NULL
);

CREATE TABLE policy_info (
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

CREATE TABLE payment_info (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  policy_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  method VARCHAR(30),
  status VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (policy_id) REFERENCES policy_info(policy_id),
  FOREIGN KEY (user_id) REFERENCES client_info(user_id)
);

CREATE TABLE claims (
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

CREATE TABLE auto_policy_detail (
  policy_id INT PRIMARY KEY,
  vehicle_make VARCHAR(50),
  model VARCHAR(50),
  year INT,
  vin VARCHAR(50),
  coverage_type VARCHAR(50),
  premium_amount DECIMAL(10,2),
  FOREIGN KEY (policy_id) REFERENCES policy_info(policy_id)
);

CREATE TABLE home_policy_detail (
  policy_id INT PRIMARY KEY,
  property_address VARCHAR(255),
  property_value DECIMAL(12,2),
  coverage_limit DECIMAL(12,2),
  deductible DECIMAL(10,2),
  FOREIGN KEY (policy_id) REFERENCES policy_info(policy_id)
);

CREATE TABLE policy_history (
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

CREATE TABLE payment_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  policy_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(30),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE claim_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  claim_id INT NOT NULL,
  policy_id INT NOT NULL,
  user_id INT NOT NULL,
  claim_status VARCHAR(30) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_policy_user ON policy_info(user_id);
CREATE INDEX idx_payment_policy ON payment_info(policy_id);
CREATE INDEX idx_claims_policy ON claims(policy_id);

