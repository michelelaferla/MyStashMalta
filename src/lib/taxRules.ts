export type ComputationBasis = 'single' | 'married' | 'parent';
export type ChildBucket = '0' | '1' | '2+';
export type BirthCohort = 'from_1962' | 'up_to_1961' | 'under_18' | 'student_under_18' | 'student_18_plus';

export interface TaxBand {
  from: number;
  to: number | null;
  rate: number;
  subtract: number;
}

export const TAX_SOURCE_VERSION = 'MTCA_2026_2026-04-13';

// Malta resident individual tax bands for basis year 2026.
// Formula used by MTCA table: tax = chargeableIncome * rate - subtract.
export const TAX_BANDS_2026: Record<string, TaxBand[]> = {
  single_0: [
    { from: 0, to: 12000, rate: 0, subtract: 0 },
    { from: 12001, to: 16000, rate: 0.15, subtract: 1800 },
    { from: 16001, to: 60000, rate: 0.25, subtract: 3400 },
    { from: 60001, to: null, rate: 0.35, subtract: 9400 },
  ],
  married_0: [
    { from: 0, to: 15000, rate: 0, subtract: 0 },
    { from: 15001, to: 23000, rate: 0.15, subtract: 2250 },
    { from: 23001, to: 60000, rate: 0.25, subtract: 4550 },
    { from: 60001, to: null, rate: 0.35, subtract: 10550 },
  ],
  married_1: [
    { from: 0, to: 17500, rate: 0, subtract: 0 },
    { from: 17501, to: 26500, rate: 0.15, subtract: 2625 },
    { from: 26501, to: 60000, rate: 0.25, subtract: 5275 },
    { from: 60001, to: null, rate: 0.35, subtract: 11275 },
  ],
  married_2plus: [
    { from: 0, to: 22500, rate: 0, subtract: 0 },
    { from: 22501, to: 32000, rate: 0.15, subtract: 3375 },
    { from: 32001, to: 60000, rate: 0.25, subtract: 6575 },
    { from: 60001, to: null, rate: 0.35, subtract: 12575 },
  ],
  parent_0: [
    { from: 0, to: 13000, rate: 0, subtract: 0 },
    { from: 13001, to: 17500, rate: 0.15, subtract: 1950 },
    { from: 17501, to: 60000, rate: 0.25, subtract: 3700 },
    { from: 60001, to: null, rate: 0.35, subtract: 9700 },
  ],
  parent_1: [
    { from: 0, to: 14500, rate: 0, subtract: 0 },
    { from: 14501, to: 21000, rate: 0.15, subtract: 2175 },
    { from: 21001, to: 60000, rate: 0.25, subtract: 4275 },
    { from: 60001, to: null, rate: 0.35, subtract: 10275 },
  ],
  parent_2plus: [
    { from: 0, to: 18500, rate: 0, subtract: 0 },
    { from: 18501, to: 25500, rate: 0.15, subtract: 2775 },
    { from: 25501, to: 60000, rate: 0.25, subtract: 5325 },
    { from: 60001, to: null, rate: 0.35, subtract: 11325 },
  ],
};

export function getTaxBandKey(basis: ComputationBasis, children: ChildBucket): string {
  if (basis === 'single') return 'single_0';
  if (basis === 'married') {
    if (children === '1') return 'married_1';
    if (children === '2+') return 'married_2plus';
    return 'married_0';
  }
  if (children === '1') return 'parent_1';
  if (children === '2+') return 'parent_2plus';
  return 'parent_0';
}

export function calculateIncomeTax(chargeableIncome: number, basis: ComputationBasis, children: ChildBucket): number {
  if (!Number.isFinite(chargeableIncome) || chargeableIncome <= 0) return 0;
  const bands = TAX_BANDS_2026[getTaxBandKey(basis, children)];
  const band = bands.find((item) => chargeableIncome >= item.from && (item.to === null || chargeableIncome <= item.to));
  if (!band) return 0;
  return Math.max(0, roundCurrency(chargeableIncome * band.rate - band.subtract));
}

export function calculatePartTimeTax(partTimeIncome: number, qualifiesForFinalTax: boolean): {
  finalTaxPortion: number;
  taxableAsMainIncome: number;
  taxOnFinalPortion: number;
} {
  if (!Number.isFinite(partTimeIncome) || partTimeIncome <= 0) {
    return { finalTaxPortion: 0, taxableAsMainIncome: 0, taxOnFinalPortion: 0 };
  }

  if (!qualifiesForFinalTax) {
    return { finalTaxPortion: 0, taxableAsMainIncome: partTimeIncome, taxOnFinalPortion: 0 };
  }

  const finalTaxPortion = Math.min(partTimeIncome, 10000);
  const taxableAsMainIncome = Math.max(0, partTimeIncome - 10000);
  return {
    finalTaxPortion,
    taxableAsMainIncome,
    taxOnFinalPortion: roundCurrency(finalTaxPortion * 0.1),
  };
}

export function calculateEmployeeNI(annualBasicSalary: number, birthCohort: BirthCohort, useProRataBelowMinimum: boolean): number {
  if (!Number.isFinite(annualBasicSalary) || annualBasicSalary <= 0) return 0;
  const weekly = annualBasicSalary / 52;
  let weeklyEmployeeNI = 0;

  if (birthCohort === 'student_under_18') {
    weeklyEmployeeNI = Math.min(roundCurrency(weekly * 0.1), 4.38);
  } else if (birthCohort === 'student_18_plus') {
    weeklyEmployeeNI = Math.min(roundCurrency(weekly * 0.1), 7.94);
  } else if (birthCohort === 'under_18') {
    weeklyEmployeeNI = weekly <= 229.44 ? 6.62 : roundCurrency(weekly * 0.1);
  } else if (weekly <= 229.44) {
    weeklyEmployeeNI = useProRataBelowMinimum ? roundCurrency(weekly * 0.1) : 22.94;
  } else if (birthCohort === 'up_to_1961') {
    weeklyEmployeeNI = weekly <= 490.38 ? roundCurrency(weekly * 0.1) : 49.04;
  } else {
    weeklyEmployeeNI = weekly <= 559.3 ? roundCurrency(weekly * 0.1) : 55.93;
  }

  return roundCurrency(weeklyEmployeeNI * 52);
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundToNearest(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest;
}

export function bucketAmount(value: number, step = 500): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  const lower = Math.floor(value / step) * step;
  const upper = lower + step - 1;
  return `€${lower.toLocaleString()}–€${upper.toLocaleString()}`;
}
