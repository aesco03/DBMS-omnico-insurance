
USE omnico_insurance;

-- Add due_date for tracking when payment is due
ALTER TABLE payment_info 
ADD COLUMN due_date DATE NULL AFTER payment_date;

-- Add payment_option (Monthly, Quarterly, Annual)
ALTER TABLE payment_info 
ADD COLUMN payment_option VARCHAR(30) DEFAULT 'Monthly' AFTER method;

-- Make payment_date nullable (for pending payments)
ALTER TABLE payment_info 
MODIFY COLUMN payment_date DATE NULL;

-- Set default status
ALTER TABLE payment_info 
MODIFY COLUMN status VARCHAR(30) DEFAULT 'Pending';

-- Update existing records: set due_date from payment_date or created_at
UPDATE payment_info 
SET due_date = COALESCE(payment_date, DATE(created_at)) 
WHERE due_date IS NULL;


CREATE TABLE IF NOT EXISTS payment_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  policy_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(30),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payment_id (payment_id),
  INDEX idx_policy_id (policy_id),
  INDEX idx_user_id (user_id)
);


CREATE TABLE IF NOT EXISTS insurance_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  claim_id INT NULL,
  payment_id INT NULL,
  client_id INT NOT NULL,
  policy_id INT NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details TEXT,
  changed_by_user_id INT NULL,
  FOREIGN KEY (client_id) REFERENCES client_info(user_id),
  FOREIGN KEY (policy_id) REFERENCES policy_info(policy_id),
  FOREIGN KEY (claim_id) REFERENCES claims(claim_id) ON DELETE SET NULL,
  FOREIGN KEY (payment_id) REFERENCES payment_info(payment_id) ON DELETE SET NULL,
  FOREIGN KEY (changed_by_user_id) REFERENCES client_info(user_id) ON DELETE SET NULL,
  INDEX idx_policy_id (policy_id),
  INDEX idx_client_id (client_id),
  INDEX idx_action_type (action_type),
  INDEX idx_action_date (action_date)
);


-- Index for finding payments by due date
CREATE INDEX idx_payment_due_date ON payment_info(due_date);

-- Index for finding pending/overdue payments
CREATE INDEX idx_payment_status_due ON payment_info(status, due_date);

-- Track who changed payment
ALTER TABLE payment_info 
ADD COLUMN changed_by_user_id INT NULL AFTER created_at;

ALTER TABLE payment_info 
ADD FOREIGN KEY (changed_by_user_id) REFERENCES client_info(user_id) ON DELETE SET NULL;

-- Track who changed claim
ALTER TABLE claims 
ADD COLUMN changed_by_user_id INT NULL AFTER created_at;

ALTER TABLE claims 
ADD FOREIGN KEY (changed_by_user_id) REFERENCES client_info(user_id) ON DELETE SET NULL;

-- Track who changed policy
ALTER TABLE policy_info 
ADD COLUMN changed_by_user_id INT NULL AFTER updated_at;

ALTER TABLE policy_info 
ADD FOREIGN KEY (changed_by_user_id) REFERENCES client_info(user_id) ON DELETE SET NULL;


SELECT 'Payment and history tracking system added successfully!' AS status;
