-- Supabase schema for anonymous salary analytics.
-- Run this in the Supabase SQL editor. The public client can INSERT only.

create extension if not exists pgcrypto;

create table if not exists public.salary_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source_version text not null default 'MTCA_2026_2026-04-13',
  computation_basis text not null check (computation_basis in ('single','married','parent')),
  child_bucket text not null check (child_bucket in ('0','1','2+')),
  birth_cohort text not null,
  gross_salary_bucket text not null,
  part_time_income_bucket text not null,
  annual_gross_rounded numeric(12,2) not null,
  annual_net_rounded numeric(12,2) not null,
  annual_income_tax_rounded numeric(12,2) not null,
  annual_ni_rounded numeric(12,2) not null
);

alter table public.salary_submissions enable row level security;

-- Allow anonymous app users to submit rows.
create policy "anonymous salary insert only"
  on public.salary_submissions
  for insert
  to anon
  with check (true);

grant insert on public.salary_submissions to anon;

-- Do NOT add a SELECT policy for anon. Keep analytics private/admin-only.
-- Build aggregate views later, e.g. bucketed salary trends, once you have enough rows.
