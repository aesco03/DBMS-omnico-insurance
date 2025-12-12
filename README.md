# OmniCoInsurance – Full-Stack DBMS Demo

A full-stack demo web app for a Database Management course, showcasing a 3-tier architecture:

- DataStore: MySQL schema with seed data and basic audit tables
- DataProcessing: Node.js/Express backend with auth, policies, claims, payments, and reports
- UserInterface: EJS templates with Bootstrap 5 for the UI

Quick start:

1) Create and seed the database:
   - Import `db/schema.sql`, then `db/seed.sql` into MySQL 8.

2) Configure environment:
   - Copy `.env.example` to `.env` and set DB credentials and session secret.

3) Install and run:
   - `npm install`
   - `npm run dev` (nodemon) or `npm start`

4) Access:
   - App runs at `http://localhost:3000` → redirects to login.

Note: Use your own user records in `client_info` (store bcrypt hashes). You can generate a hash with `node scripts/hash.js <password>`.
node scripts/create_admin.js --email admin@example.com --password YourStrongPass --name "Admin User"
