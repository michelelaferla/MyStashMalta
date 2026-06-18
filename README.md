# Malta Salary Calculator 2026

A professional React + TypeScript app for estimating Malta net salary, income tax and employee National Insurance using MTCA 2026 tax bands.

## Features

- Responsive layout for desktop, tablet and mobile
- Single, married and parent computations
- Qualifying child bands, including 2026 rates for 1 child and 2+ children
- Part-time employment income at the 10% final tax rate up to €10,000, with excess treated as normal taxable income
- Employee Class 1 National Insurance calculation
- Doughnut graph showing net salary, income tax and National Insurance
- Optional anonymous salary analytics using Supabase insert-only Row Level Security

## Official data sources used

- MTCA resident tax rates for individuals, 2026
- MTCA 2026 tax-rates PDF amendment for child-based married and parent computations
- MTCA Class 1 Social Security Contribution Rates, 2026
- MTCA part-time employment tax FAQ / FS4 guidance

Always verify the rules before production launch. Tax rules can change, and some situations need professional advice.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Configure optional anonymous database collection

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env` and fill in:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The public app only gets INSERT access. Do not add an anonymous SELECT policy unless you intentionally want users to read analytics data.

## Privacy approach

The app submits data only when the user ticks the consent checkbox. It stores bucketed/rounded figures, not names, emails, identity card numbers, addresses, or user accounts.

For stronger privacy, keep public analytics as aggregated reports only, and do not publish raw rows.

## Important assumptions

- The main salary input is treated as basic employment salary.
- Employee NI is calculated on main salary. Persons working both full-time and part-time generally pay Social Security Contributions from the full-time job only.
- The part-time tax treatment assumes the work qualifies for the final 10% part-time rate. If it does not qualify, the app treats the part-time amount as normal taxable income.
- This is an estimator, not payroll software.
