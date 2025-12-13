# Testing the Payment System

## Quick Test Steps

### 1. Start Your Server
```bash
npm start
# or
npm run dev
```

### 2. Check What You Have

**Option A: If you have existing Active policies:**
- Generate payments for them by running:
  ```bash
  node scripts/generate_payments.js
  ```
- This will create monthly payment records for all active policies

**Option B: Create a new policy and test the flow:**
1. Log in as your test_user
2. Create a new policy (go to `/policies/new`)
3. Fill out the policy form and submit
4. Log out and log in as admin
5. Go to `/admin/policies` - you'll see pending policies
6. Click "Approve" on the policy
7. **Payments will be automatically generated!**
8. Log back in as test_user
9. Go to `/payments` - you'll see the scheduled payments

### 3. What You'll See

**As Admin:**
- `/admin/policies` - View and approve pending policies
- When you approve a policy, payments are auto-generated

**As Customer:**
- `/payments` - View all your scheduled payments (with due dates)
- `/payments/:policyId` - View payment history for a specific policy
- Pending payments are highlighted in yellow

**Payment Status:**
- `Pending` - Payment not yet made (yellow badge)
- `Completed` - Payment has been made (green badge)

### 4. Test Payment Flow

1. Create/approve a policy (as admin)
2. View payments (as customer) - you'll see monthly payments scheduled
3. Make a payment (as customer) - go to payment history and record a payment
4. Check payment history - see the payment status change

## Notes

- Payments are generated starting the month AFTER the policy start date
- Each payment has a `due_date` and `payment_date` (null until paid)
- All payment changes are logged in `payment_history` table
- Admin changes are tracked via `changed_by_user_id` fields

