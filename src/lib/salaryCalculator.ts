import {
  BirthCohort,
  ChildBucket,
  ComputationBasis,
  calculateEmployeeNI,
  calculateIncomeTax,
  calculatePartTimeTax,
  roundCurrency,
} from './taxRules';

export interface SalaryInput {
  salary: number;
  salaryFrequency: 'annual' | 'monthly';
  basis: ComputationBasis;
  children: ChildBucket;
  partTimeIncome: number;
  partTimeQualifiesForFinalTax: boolean;
  birthCohort: BirthCohort;
  useProRataBelowMinimum: boolean;
}

export interface SalaryResult {
  annualGrossMain: number;
  annualPartTime: number;
  annualGrossTotal: number;
  chargeableMainIncome: number;
  partTimeFinalTaxPortion: number;
  partTimeTaxableAsMain: number;
  incomeTaxMain: number;
  incomeTaxPartTimeFinal: number;
  incomeTaxTotal: number;
  employeeNI: number;
  annualNet: number;
  monthlyGross: number;
  monthlyNet: number;
  monthlyTax: number;
  monthlyNI: number;
  effectiveTaxAndNIRate: number;
}

export function calculateSalary(input: SalaryInput): SalaryResult {
  const annualGrossMain = input.salaryFrequency === 'monthly' ? input.salary * 12 : input.salary;
  const annualPartTime = Math.max(0, input.partTimeIncome || 0);
  const partTime = calculatePartTimeTax(annualPartTime, input.partTimeQualifiesForFinalTax);
  const chargeableMainIncome = Math.max(0, annualGrossMain + partTime.taxableAsMainIncome);
  const incomeTaxMain = calculateIncomeTax(chargeableMainIncome, input.basis, input.children);
  const incomeTaxPartTimeFinal = partTime.taxOnFinalPortion;
  const incomeTaxTotal = roundCurrency(incomeTaxMain + incomeTaxPartTimeFinal);

  // Persons working both full-time and part-time normally pay SSC from the full-time job only.
  const employeeNI = calculateEmployeeNI(annualGrossMain, input.birthCohort, input.useProRataBelowMinimum);
  const annualGrossTotal = annualGrossMain + annualPartTime;
  const annualNet = roundCurrency(annualGrossTotal - incomeTaxTotal - employeeNI);
  const monthlyGross = roundCurrency(annualGrossTotal / 12);
  const monthlyNet = roundCurrency(annualNet / 12);
  const monthlyTax = roundCurrency(incomeTaxTotal / 12);
  const monthlyNI = roundCurrency(employeeNI / 12);
  const effectiveTaxAndNIRate = annualGrossTotal > 0 ? roundCurrency(((incomeTaxTotal + employeeNI) / annualGrossTotal) * 100) : 0;

  return {
    annualGrossMain: roundCurrency(annualGrossMain),
    annualPartTime: roundCurrency(annualPartTime),
    annualGrossTotal: roundCurrency(annualGrossTotal),
    chargeableMainIncome: roundCurrency(chargeableMainIncome),
    partTimeFinalTaxPortion: partTime.finalTaxPortion,
    partTimeTaxableAsMain: partTime.taxableAsMainIncome,
    incomeTaxMain,
    incomeTaxPartTimeFinal,
    incomeTaxTotal,
    employeeNI,
    annualNet,
    monthlyGross,
    monthlyNet,
    monthlyTax,
    monthlyNI,
    effectiveTaxAndNIRate,
  };
}
