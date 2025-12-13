const paymentScheduler = require('../src/services/paymentScheduler');

async function main() {
  console.log('Starting payment generation for all active policies...');
  
  try {
    const results = await paymentScheduler.generatePaymentsForAllActivePolicies();
    
    console.log('\n=== Payment Generation Summary ===');
    console.log(`Policies processed: ${results.policiesProcessed}`);
    console.log(`Payments created: ${results.paymentsCreated}`);
    
    if (results.errors.length > 0) {
      console.log(`\nErrors encountered: ${results.errors.length}`);
      results.errors.forEach(err => {
        console.error(`  Policy ${err.policy_id}: ${err.error}`);
      });
    }
    
    console.log('\nPayment generation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error generating payments:', error);
    process.exit(1);
  }
}

main();

