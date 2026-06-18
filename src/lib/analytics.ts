import { createClient } from '@supabase/supabase-js';
import { SalaryInput, SalaryResult } from './salaryCalculator';
import { TAX_SOURCE_VERSION, bucketAmount, roundToNearest } from './taxRules';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function submitAnonymousSalary(input: SalaryInput, result: SalaryResult): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
  }

  const row = {
    source_version: TAX_SOURCE_VERSION,
    computation_basis: input.basis,
    child_bucket: input.children,
    birth_cohort: input.birthCohort,
    gross_salary_bucket: bucketAmount(result.annualGrossMain, 500),
    part_time_income_bucket: bucketAmount(result.annualPartTime, 500),
    annual_gross_rounded: roundToNearest(result.annualGrossTotal, 100),
    annual_net_rounded: roundToNearest(result.annualNet, 100),
    annual_income_tax_rounded: roundToNearest(result.incomeTaxTotal, 100),
    annual_ni_rounded: roundToNearest(result.employeeNI, 100),
  };

  const { error } = await supabase.from('salary_submissions').insert(row);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
