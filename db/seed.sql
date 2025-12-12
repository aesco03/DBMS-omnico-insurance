USE omnico_insurance;

INSERT INTO tier (tier_name, discount_rate, benefits_description)
VALUES
('Standard', 0.00, 'Base tier'),
('Silver', 5.00, 'Small discount'),
('Gold', 10.00, 'Preferred customers');

INSERT INTO insurance_type (type_name, description)
VALUES
('Auto', 'Automobile insurance'),
('Home', 'Homeowners insurance'),
('Pet', 'Pet insurance'),
('Renters', 'Renters insurance'),
('Business', 'Business insurance'),
('Health', 'Health insurance'),
('Life', 'Life insurance');

INSERT INTO policy_status (status_name)
VALUES
('Active'), ('Pending'), ('Cancelled'), ('Expired');

