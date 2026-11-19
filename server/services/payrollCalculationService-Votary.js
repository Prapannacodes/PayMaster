// Payroll Calculation Service
// Ultra-clean, easy formulas you can explain in seconds!

const round = (num) => Number(Number(num || 0).toFixed(2));

// 1. Payable Days = Present + Half Days (0.5) + Paid Leaves
function calculatePayableDays(totalDays, presentDays = 0, halfDays = 0, paidLeaveDays = 0) {
  const payable = presentDays + (halfDays * 0.5) + paidLeaveDays;
  return Math.min(totalDays, Number(payable.toFixed(1)));
}

// 2. Gross Salary = Basic + HRA + Allowances + Bonus + Overtime + Other
function calculateGrossSalary(basic = 0, hra = 0, allowances = 0, bonus = 0, overtime = 0, other = 0) {
  return round(basic + hra + allowances + bonus + overtime + other);
}

// 3. Attendance Cut (Loss of Pay) = Per Day Rate * Lost Days
function calculateAttendanceDeduction(basic = 0, totalDays = 30, absent = 0, halfDays = 0, unpaidLeave = 0) {
  if (!totalDays) return 0;
  const perDaySalary = basic / totalDays;
  const lostDays = absent + (halfDays * 0.5) + unpaidLeave;
  return round(perDaySalary * lostDays);
}

// 4. Monthly Tax = Slab calculations on (Annual Gross - Standard Deduction) / 12
function calculateMonthlyTax(annualGross = 0, taxRule = null) {
  if (!taxRule?.slabs?.length) return 0;

  let taxable = Math.max(0, annualGross - (taxRule.standardDeduction || 0));
  let annualTax = 0;

  for (const slab of taxRule.slabs) {
    if (taxable > slab.minIncome) {
      const slabTop = slab.maxIncome ? Math.min(taxable, slab.maxIncome) : taxable;
      const taxableInSlab = slabTop - slab.minIncome;
      annualTax += (taxableInSlab * slab.ratePercentage) / 100;
    }
  }

  return Math.round(annualTax / 12);
}

// 5. Total Deductions = PF + PT + Attendance Cut + Tax + Other Deductions
function calculateDeductions(basic = 0, gross = 0, rules = [], attendanceCut = 0, tax = 0, other = 0) {
  let pf = 0;
  let professionalTax = 0;
  let custom = other || 0;

  (rules || []).forEach(rule => {
    if (rule.status !== "active") return;
    const base = rule.appliesTo === "gross" ? gross : basic;
    const amount = rule.type === "percentage" ? (base * rule.value) / 100 : rule.value;

    if (rule.code === "PF") pf += amount;
    else if (rule.code === "PT" || rule.code === "PROFESSIONAL_TAX") professionalTax += amount;
    else custom += amount;
  });

  const totalDeductions = round(pf + professionalTax + attendanceCut + tax + custom);

  return {
    pf: round(pf),
    professionalTax: round(professionalTax),
    attendanceDeduction: round(attendanceCut),
    tax: round(tax),
    otherDeductions: round(custom),
    totalDeductions
  };
}

// 6. Net Take-Home Salary = Gross Salary - Total Deductions
function calculateNetSalary(grossSalary = 0, totalDeductions = 0) {
  return round(Math.max(0, grossSalary - totalDeductions));
}

module.exports = {
  calculatePayableDays,
  calculateGrossSalary,
  calculateAttendanceDeduction,
  calculateMonthlyTax,
  calculateDeductions,
  calculateNetSalary
};
