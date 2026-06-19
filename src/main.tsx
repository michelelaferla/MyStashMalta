import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Calculator, Database, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { submitAnonymousSalary } from './lib/analytics';
import { SalaryInput, calculateSalary } from './lib/salaryCalculator';
import { ChildBucket, ComputationBasis } from './lib/taxRules';
import './styles.css';

const currency = new Intl.NumberFormat('en-MT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const currencyNoCents = new Intl.NumberFormat('en-MT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function App() {
  const [input, setInput] = useState<SalaryInput>({
    salary: 11931,
    salaryFrequency: 'annual',
    basis: 'single',
    children: '0',
    partTimeIncome: 0,
    partTimeQualifiesForFinalTax: true,
    birthCohort: 'from_1962',
    useProRataBelowMinimum: false,
  });
  const [consent, setConsent] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');

  const result = useMemo(() => calculateSalary(input), [input]);
  const chartData = [
    { name: 'Net salary', value: Math.max(0, result.annualNet) },
    { name: 'Income tax', value: Math.max(0, result.incomeTaxTotal) },
    { name: 'National Insurance', value: Math.max(0, result.employeeNI) },
  ];

  const showChildren = input.basis === 'married' || input.basis === 'parent';

  const update = <K extends keyof SalaryInput>(key: K, value: SalaryInput[K]) => {
    setInput((previous) => {
      const next = { ...previous, [key]: value };
      if (key === 'basis' && value === 'single') next.children = '0';
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!consent) return;
    setSubmitState('sending');
    setSubmitError('');
    const response = await submitAnonymousSalary(input, result);
    if (response.ok) {
      setSubmitState('sent');
    } else {
      setSubmitState('error');
      setSubmitError(response.message);
    }
  };

  const parseMoneyInput = (value: string): number => {
    const cleaned = value
        .replace(/[^\d.]/g, '')
        .replace(/^0+(?=\d)/, '');

    if (cleaned === '') {
      return 0;
    }

    return Number(cleaned);
  };

  const displayMoneyInput = (value: number): string => {
    return value === 0 ? '' : String(value);
  };

  return (
    <main>
      <section className="hero">
        <div className="hero__content">
          <div className="eyebrow"><Sparkles size={18} /> Malta 2026 tax-ready calculator</div>
          <h1>Know your real take-home salary in Malta.</h1>
          <p>
            Estimate annual and monthly net pay using Malta resident income tax bands, employee National Insurance,
            and the 2026 family tax reductions for married and parent computations.
          </p>
          <div className="hero__badges">
            <span>Single / Married / Parent</span>
            <span>Part-time income</span>
            <span>Anonymous salary analytics</span>
          </div>
        </div>
        <div className="hero__panel">
          <WalletCards size={34} />
          <strong>{currency.format(result.monthlyNet)}</strong>
          <span>estimated monthly net pay</span>
        </div>
      </section>

      <section className="layout">
        <form className="card controls" onSubmit={(event) => event.preventDefault()}>
          <div className="section-title">
            <Calculator />
            <div>
              <h2>Salary details</h2>
              <p>Enter gross amounts. The calculation updates instantly.</p>
            </div>
          </div>

          <label>
            Current salary
            <div className="input-row">
              <span>€</span>
              <input
                  type="text"
                  inputMode="decimal"
                  value={displayMoneyInput(input.salary)}
                  placeholder="0"
                  onChange={(event) => update('salary', parseMoneyInput(event.target.value))}
              />
              <select value={input.salaryFrequency} onChange={(event) => update('salaryFrequency', event.target.value as SalaryInput['salaryFrequency'])}>
                <option value="annual">annual</option>
                <option value="monthly">monthly</option>
              </select>
            </div>
          </label>

          <label>
            Tax computation
            <select value={input.basis} onChange={(event) => update('basis', event.target.value as ComputationBasis)}>
              <option value="single">Single computation</option>
              <option value="married">Married computation</option>
              <option value="parent">Parent computation</option>
            </select>
          </label>

          {showChildren && (
            <label>
              Qualifying children
              <select value={input.children} onChange={(event) => update('children', event.target.value as ChildBucket)}>
                <option value="0">No qualifying children</option>
                <option value="1">1 qualifying child</option>
                <option value="2+">2 or more qualifying children</option>
              </select>
            </label>
          )}

          <label>
            Employee NI category
            <select value={input.birthCohort} onChange={(event) => update('birthCohort', event.target.value as SalaryInput['birthCohort'])}>
              <option value="from_1962">Born after Jan 1962</option>
              <option value="up_to_1961">Born before Jan 1962</option>
              <option value="under_18">Under 18</option>
              <option value="student_under_18">Student under 18</option>
              <option value="student_18_plus">Student 18+</option>
            </select>
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={input.useProRataBelowMinimum}
              onChange={(event) => update('useProRataBelowMinimum', event.target.checked)}
            />
            <span>Use 10% pro-rata NI when weekly wage is below the minimum threshold</span>
          </label>

          <label>
            Part-time employment income
            <div className="input-row">
              <span>€</span>
              <input
                  type="text"
                  inputMode="decimal"
                  value={displayMoneyInput(input.partTimeIncome)}
                  placeholder="0"
                  onChange={(event) => update('partTimeIncome', parseMoneyInput(event.target.value))}
              />
              <span className="suffix">annual</span>
            </div>
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={input.partTimeQualifiesForFinalTax}
              onChange={(event) => update('partTimeQualifiesForFinalTax', event.target.checked)}
            />
            <span>Part-time income qualifies for the 10% final tax rate up to €10,000</span>
          </label>
        </form>

        <section className="results">
          <div className="card summary-card">
            <div>
              <span className="metric-label">Annual net salary</span>
              <strong>{currency.format(result.annualNet)}</strong>
            </div>
            <div>
              <span className="metric-label">Monthly net salary</span>
              <strong>{currency.format(result.monthlyNet)}</strong>
            </div>
            <div>
              <span className="metric-label">Effective tax + NI</span>
              <strong>{result.effectiveTaxAndNIRate}%</strong>
            </div>
          </div>

          <div className="card chart-card">
            <div className="chart-heading">
              <div>
                <h2>Where your gross pay goes</h2>
                <p>A simple doughnut breakdown of net pay, income tax and employee NI.</p>
              </div>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={310}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={82}
                    outerRadius={128}
                    paddingAngle={4}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => currency.format(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-center">
                <span>Monthly net</span>
                <strong>{currencyNoCents.format(result.monthlyNet)}</strong>
              </div>
            </div>
            <div className="legend-grid">
              <ResultPill label="Net salary" value={result.annualNet} />
              <ResultPill label="Income tax" value={result.incomeTaxTotal} />
              <ResultPill label="Employee NI" value={result.employeeNI} />
              <ResultPill label="Gross total" value={result.annualGrossTotal} />
            </div>
          </div>

          <div className="card detail-grid">
            <Detail label="Main annual gross" value={result.annualGrossMain} />
            <Detail label="Part-time annual gross" value={result.annualPartTime} />
            <Detail label="Chargeable main income" value={result.chargeableMainIncome} />
            <Detail label="Tax on main computation" value={result.incomeTaxMain} />
            <Detail label="Part-time final-tax portion" value={result.partTimeFinalTaxPortion} />
            <Detail label="Part-time tax" value={result.incomeTaxPartTimeFinal} />
            <Detail label="Part-time excess taxed normally" value={result.partTimeTaxableAsMain} />
            <Detail label="Monthly NI" value={result.monthlyNI} />
          </div>

          <div className="card privacy-card">
            <div className="section-title">
              <Database />
              <div>
                <h2>Anonymous salary analytics</h2>
                <p>Salary submissions are optional, bucketed and insert-only from the public app.</p>
              </div>
            </div>
            <label className="check-row">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
              <span>I agree to submit this calculation anonymously for future salary analysis.</span>
            </label>
            <button type="button" disabled={!consent || submitState === 'sending'} onClick={handleSubmit}>
              {submitState === 'sending' ? 'Submitting…' : submitState === 'sent' ? 'Submitted' : 'Submit anonymous data'}
            </button>
            {submitState === 'error' && <p className="error">{submitError}</p>}
            {submitState === 'sent' && <p className="success"><ShieldCheck size={16} /> Anonymous record saved.</p>}
          </div>
        </section>
      </section>
    </main>
  );
}

function ResultPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="pill">
      <span>{label}</span>
      <strong>{currency.format(value)}</strong>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: number }) {
  return (
    <div className="detail">
      <span>{label}</span>
      <strong>{currency.format(value)}</strong>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
