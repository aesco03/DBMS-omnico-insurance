const paymentRepo = require('../src/repositories/paymentRepository');

async function main() {
  console.log('Updating payment statuses...');
  
  try {
    await paymentRepo.updatePaymentStatuses();
    console.log('Payment statuses updated successfully!');
    console.log('\nStatus updates:');
    console.log('- Overdue: Payments past due date, not paid');
    console.log('- Pending: Next upcoming payment (1 per policy)');
    console.log('- Upcoming: Future payments not yet due');
    console.log('- Completed: Paid payments');
    process.exit(0);
  } catch (error) {
    console.error('Error updating payment statuses:', error);
    process.exit(1);
  }
}

main();

