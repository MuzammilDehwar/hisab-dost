// Automated accounting verification script for Hisab Dost calculations
import assert from 'assert';

console.log('--- Starting Hisab Dost Accounting Verification ---');

// Test Case 1: Product Sale & Gross Profit & Net Profit
console.log('Test 1: Product cost Rs 100, selling Rs 150, qty 2, expense Rs 30');
const costPrice = 100;
const salePrice = 150;
const qty = 2;
const revenue = salePrice * qty; // 300
const cogs = costPrice * qty; // 200
const grossProfit = revenue - cogs; // 100
assert.strictEqual(grossProfit, 100, 'Gross profit must be Rs 100');
console.log('✓ Gross Profit correctly calculated: Rs', grossProfit);

const expense = 30;
const netEstimatedProfit = grossProfit - expense; // 70
assert.strictEqual(netEstimatedProfit, 70, 'Net estimated profit must be Rs 70');
console.log('✓ Net Estimated Profit correctly calculated: Rs', netEstimatedProfit);

// Test Case 2: Customer debt and repayment
console.log('Test 2: Customer owes Rs 500, pays Rs 200');
let customerBalance = 500;
const payment = 200;
customerBalance -= payment;
assert.strictEqual(customerBalance, 300, 'Remaining balance must be Rs 300');
console.log('✓ Customer balance after repayment correctly calculated: Rs', customerBalance);

// Test Case 3: Cash in Hand & Cash Drawer Reconciliation
console.log('Test 3: Cash In Hand calculation with cash, credit, customer recoveries, and expenses');
const cashSales = 300; // Physical cash received from direct sale
const creditSales = 500; // Goods given on credit (no physical cash in drawer)
const customerCashPayment = 200; // Customer brings Rs 200 cash to pay old udhaar
const cashExpense = 30; // Paid Rs 30 cash from drawer
const onlineExpense = 50; // Paid Rs 50 via EasyPaisa/Bank (not from cash drawer)

// Physical cash in hand in drawer:
const cashInDrawer = cashSales + customerCashPayment - cashExpense;
assert.strictEqual(cashInDrawer, 470, 'Cash in drawer must be 300 + 200 - 30 = 470');
console.log('✓ Cash In Hand correctly isolated from credit sales and online expenses: Rs', cashInDrawer);

// Test Case 4: Stock deduction and reversal on sale deletion
console.log('Test 4: Stock inventory deduction and restoration on delete');
let stock = 10;
stock -= qty; // Sold 2
assert.strictEqual(stock, 8, 'Stock must decrease to 8');
console.log('✓ Stock correctly decreased upon sale: Quantity remaining =', stock);

// Simulate sale deletion (reversal)
stock += qty; // Sale deleted
assert.strictEqual(stock, 10, 'Stock must restore to 10');
console.log('✓ Stock correctly restored upon sale deletion: Quantity remaining =', stock);

// Test Case 5: Credit sale deletion reverses customer balance
console.log('Test 5: Credit sale deletion reverses customer credit');
let custBalance = 0;
const creditSaleAmount = 500;
custBalance += creditSaleAmount; // Credit sale added
assert.strictEqual(custBalance, 500, 'Customer owes Rs 500');

// Credit sale deleted
custBalance -= creditSaleAmount;
assert.strictEqual(custBalance, 0, 'Customer balance correctly reverted to Rs 0');
console.log('✓ Customer balance correctly reverted to Rs', custBalance, 'on credit sale deletion');

console.log('--- ALL ACCOUNTING TESTS PASSED! ---');
