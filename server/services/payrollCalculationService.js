// Payroll Calculation Service
// Clean, simple, and explainable functions for viva

// 1. Calculate payable days based on attendance and leaves
function calculatePayableDays(totalDays, presentDays, halfDays, paidLeaveDays) {
  let payable = presentDays + (halfDays * 0.5) + paidLeaveDays;
  if (payable > totalDays) payable = totalDays;
  return Number(payable.toFixed(1));
}

// 2. Calculate Gross Salary
function calculateGrossSalary(basic, hra, allowances, bonus, overtimePay, otherEarnings) {
  return Number((basic + hra + allowances + bonus + overtimePay + otherEarnings).toFixed(2));
}

// 3. Calculate Attendance/Absence deduction
function calculateAttendanceDeduction(basicSalary, totalDays, absentDays, halfDays, unpaidLeaveDays) {
  if (totalDays === 0) return 0;
  const perDaySalary = basicSalary / totalDays;
  const lostDays = absentDays + (halfDays * 0.5) + unpaidLeaveDays;
  return Number((perDaySalary * lostDays).toFixed(2));
}

// 4. Calculate Tax based on active Tax Rule
function calculateMonthlyTax(annualGrossIncome, taxRule) {
  if (!taxRule || !taxRule.slabs || taxRule.slabs.length === 0) {
    return 0; // Agar koi tax rule set nahi hai toh 0
  }

  // Standard deduction minus karo
  const standardDeduction = taxRule.standardDeduction || 0;
  let taxableIncome = annualGrossIncome - standardDeduction;

  if (taxableIncome <= 0) {
    return 0;
  }

  let totalAnnualTax = 0;

  // Slabs ke through iterate karo
  for (let i = 0; i < taxRule.slabs.length; i++) {
    const slab = taxRule.slabs[i];
    const min = slab.minIncome;
    const max = slab.maxIncome;
    const rate = slab.ratePercentage;

    if (taxableIncome > min) {
      let taxableAmountInSlab = 0;
      if (max !== null && max !== undefined) {
        taxableAmountInSlab = Math.min(taxableIncome, max) - min;
      } else {
        taxableAmountInSlab = taxableIncome - min;
      }

      totalAnnualTax += (taxableAmountInSlab * rate) / 100;
    }
  }

  // Monthly tax deduction = annual tax divided by 12
  const monthlyTax = Math.round(totalAnnualTax / 12);
  return monthlyTax;
}

// 5. Calculate Deductions (PF, Professional Tax, etc.)
function calculateDeductions(basicSalary, grossSalary, deductionRules, attendanceDeduction, taxAmount, otherDeductions) {
  let pf = 0;
  let professionalTax = 0;
  let customDeductions = otherDeductions || 0;

  // Active deduction rules apply karo
  if (Array.isArray(deductionRules)) {
    for (const rule of deductionRules) {
      if (rule.status === "active") {
        const baseAmount = rule.appliesTo === "gross" ? grossSalary : basicSalary;

        let amount = 0;
        if (rule.type === "percentage") {
          amount = (baseAmount * rule.value) / 100;
        } else {
          amount = rule.value; // fixed amount
        }

        if (rule.code === "PF") {
          pf += amount;
        } else if (rule.code === "PT" || rule.code === "PROFESSIONAL_TAX") {
          professionalTax += amount;
        } else {
          customDeductions += amount;
        }
      }
    }
  }

  pf = Number(pf.toFixed(2));
  professionalTax = Number(professionalTax.toFixed(2));
  attendanceDeduction = Number(attendanceDeduction.toFixed(2));
  taxAmount = Number(taxAmount.toFixed(2));
  customDeductions = Number(customDeductions.toFixed(2));

  const totalDeductions = Number((pf + professionalTax + attendanceDeduction + taxAmount + customDeductions).toFixed(2));

  return {
    pf,
    professionalTax,
    attendanceDeduction,
    tax: taxAmount,
    otherDeductions: customDeductions,
    totalDeductions
  };
}

// 6. Calculate Net Salary
function calculateNetSalary(grossSalary, totalDeductions) {
  const net = grossSalary - totalDeductions;
  return Number((net > 0 ? net : 0).toFixed(2));
}

module.exports = {
  calculatePayableDays,
  calculateGrossSalary,
  calculateAttendanceDeduction,
  calculateMonthlyTax,
  calculateDeductions,
  calculateNetSalary
};
