const assert = require("assert");
const {
  resolveAnomalySchema,
  simulationSchema,
  createDiscrepancySchema,
  updateDiscrepancyStatusSchema
} = require("./utils/validation");
const {
  calculatePayableDays,
  calculateGrossSalary,
  calculateMonthlyTax,
  calculateDeductions,
  calculateNetSalary
} = require("./services/payrollCalculationService");
const AnalyticsService = require("./services/analyticsService");

console.log("=== RUNNING INTELLIGENT SUITE UNIT & LOGIC TESTS ===");

// 1. Test Joi Validations
console.log("\n[1] Testing Joi Validation Schemas...");

// 1.1 Anomaly Resolution Schema
const validResolution = resolveAnomalySchema.validate({
  status: "Resolved",
  investigationNotes: "Overtime verified and settled"
});
assert.strictEqual(validResolution.error, undefined, "Valid anomaly resolution should pass validation");

const invalidResolution = resolveAnomalySchema.validate({
  status: "UnknownStatus"
});
assert.notStrictEqual(invalidResolution.error, undefined, "Invalid status should fail validation");
console.log("✓ Anomaly Resolution schema validated.");

// 1.2 Simulation Schema
const validSim = simulationSchema.validate({
  simulationType: "company",
  incrementPercentage: 10
});
assert.strictEqual(validSim.error, undefined, "Valid simulation input should pass");

const invalidSim = simulationSchema.validate({
  simulationType: "invalidType"
});
assert.notStrictEqual(invalidSim.error, undefined, "Invalid simulation type should fail");
console.log("✓ What-If Simulation schema validated.");

// 1.3 Discrepancy Ticket Schemas
const validTicket = createDiscrepancySchema.validate({
  category: "Incorrect Overtime",
  subject: "Overtime hours missing",
  description: "Worked 6 hours on sprint wrap up, but payment not credited in November slip.",
  claimedAmount: 1800
});
assert.strictEqual(validTicket.error, undefined, "Valid ticket creation should pass");

const shortDescriptionTicket = createDiscrepancySchema.validate({
  category: "Incorrect Overtime",
  subject: "OT",
  description: "short"
});
assert.notStrictEqual(shortDescriptionTicket.error, undefined, "Short description should fail min-length validation");

const validTicketReview = updateDiscrepancyStatusSchema.validate({
  status: "Under Review",
  adminRemarks: "Checking timecard with team lead"
});
assert.strictEqual(validTicketReview.error, undefined, "Valid ticket review should pass");
console.log("✓ Discrepancy Ticket schemas validated.");

// 2. Test Core Payroll Calculations & Deduction Logic
console.log("\n[2] Testing Payroll Calculation Service...");
const gross = calculateGrossSalary(50000, 20000, 10000, 3000, 1500, 0);
assert.strictEqual(gross, 84500, "Gross salary calculation should match exact sum");

const taxRule = {
  standardDeduction: 50000,
  slabs: [
    { minIncome: 0, maxIncome: 300000, ratePercentage: 0 },
    { minIncome: 300000, maxIncome: 700000, ratePercentage: 5 },
    { minIncome: 700000, maxIncome: 1000000, ratePercentage: 10 }
  ]
};

const annualIncome = gross * 12; // 1,014,000
const monthlyTax = calculateMonthlyTax(annualIncome, taxRule);
assert(monthlyTax > 0, "Monthly tax should be calculated correctly");

const deductionRules = [
  { code: "PF", type: "percentage", value: 12, appliesTo: "basic", status: "active" },
  { code: "PT", type: "fixed", value: 200, appliesTo: "gross", status: "active" }
];

const deductions = calculateDeductions(50000, gross, deductionRules, 0, monthlyTax, 0);
assert.strictEqual(deductions.pf, 6000, "12% PF on 50,000 basic should be 6,000");
assert.strictEqual(deductions.professionalTax, 200, "PT should be 200");
assert.strictEqual(deductions.totalDeductions, 6000 + 200 + monthlyTax, "Total deductions sum should match");

const netSalary = calculateNetSalary(gross, deductions.totalDeductions);
assert.strictEqual(netSalary, gross - deductions.totalDeductions, "Net salary should equal Gross - Total Deductions");
console.log("✓ Core calculation engine passed.");

// 3. Test Predictive Forecasting Regression Logic
console.log("\n[3] Testing Predictive Analytics Linear Regression Algorithm...");
const sampleTrends = [
  { totalGross: 195000, month: 9, year: 2026 },
  { totalGross: 205000, month: 10, year: 2026 },
  { totalGross: 215000, month: 11, year: 2026 }
];

const forecastResult = AnalyticsService.generateForecast(sampleTrends, { month: 11, year: 2026 });
assert.strictEqual(forecastResult.hasSufficientData, true, "3 periods should provide sufficient data");
assert.strictEqual(forecastResult.slope, 10000, "Linear slope for +10k per month should be exactly 10,000");
assert.strictEqual(forecastResult.projections.length, 4, "Should project 4 months forward");
assert.strictEqual(forecastResult.projections[0].totalGross, 225000, "Next projected period should be 225,000");
assert.strictEqual(forecastResult.projections[1].totalGross, 235000, "Second projected period should be 235,000");
console.log("✓ Linear regression projection algorithm passed with exact trajectory matching.");

// Test adaptive baseline fallback when fewer than 2 periods exist (limitation removed!)
const adaptiveForecast = AnalyticsService.generateForecast([{ totalGross: 200000 }], { totalGross: 200000, month: 11, year: 2026 });
assert.strictEqual(adaptiveForecast.hasSufficientData, true, "Adaptive baseline provides projection without blocking");
assert.strictEqual(adaptiveForecast.projections.length, 4, "Should provide 4 months forward projections");
console.log("✓ Adaptive baseline forecasting tested successfully (limitation removed).");

// 4. Test Automated Financial Insights Derivation
console.log("\n[4] Testing Business Insights Logic...");
const sampleDepts = [
  { departmentName: "Engineering", totalGross: 150000, budgetSharePercentage: 65 },
  { departmentName: "HR", totalGross: 80000, budgetSharePercentage: 35 }
];
const sampleInsights = AnalyticsService.deriveInsights(sampleDepts, sampleTrends, { totalGross: 215000, totalDeductions: 30000 });
assert(sampleInsights.length >= 2, "Should derive department expense and growth insights");
console.log("✓ Derived insights:", sampleInsights.map(i => i.title));

console.log("\n=======================================================");
console.log("ALL LOGIC, MATHEMATICAL & VALIDATION TESTS PASSED 100%!");
console.log("=======================================================");

