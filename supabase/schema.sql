-- Baazar Retail — Supabase schema
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  role text default 'user',
  token_identifier text,
  created_at timestamptz default now()
);

create index if not exists users_email_idx on public.users (email);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "entityType" text,
  address text,
  district text,
  city text,
  zip text,
  phone text,
  "registeredPhoneAdditional" text,
  email text not null,
  "sameAsRegistered" boolean default true,
  "commAddress" text,
  "commDistrict" text,
  "commLocation" text,
  "commPinCode" text,
  "commPhone" text,
  "commEmail" text,
  "panNumber" text,
  "panFileId" text,
  "hasTan" boolean default false,
  "tanNumber" text,
  "tanFileId" text,
  "gstStatus" text,
  gstin text,
  "gstFileId" text,
  "gstRegistrationDate" text,
  "placeOfBusiness" text,
  "proofOfAddressType" text,
  "proofOfAddressFileId" text,
  "isMsmed" boolean default false,
  "msmedLineOfBusiness" text,
  "msmedType" text,
  "msmedFileId" text,
  "bankName" text,
  "accountNumber" text,
  "ifscCode" text,
  "chequeLabel" text,
  "chequeFileId" text,
  "branchName" text,
  "branchAddress" text,
  "goodsServices" text[] default '{}',
  "departmentTrading" text,
  "employeeRefName" text,
  "employeeRefContact" text,
  "vendorContactPerson" text,
  remarks text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  "vrfNumber" text,
  created_at timestamptz default now()
);

-- Safe adds if table already exists with fewer columns
alter table public.vendors add column if not exists "entityType" text;
alter table public.vendors add column if not exists address text;
alter table public.vendors add column if not exists district text;
alter table public.vendors add column if not exists city text;
alter table public.vendors add column if not exists zip text;
alter table public.vendors add column if not exists phone text;
alter table public.vendors add column if not exists "registeredPhoneAdditional" text;
alter table public.vendors add column if not exists "sameAsRegistered" boolean default true;
alter table public.vendors add column if not exists "commAddress" text;
alter table public.vendors add column if not exists "commDistrict" text;
alter table public.vendors add column if not exists "commLocation" text;
alter table public.vendors add column if not exists "commPinCode" text;
alter table public.vendors add column if not exists "commPhone" text;
alter table public.vendors add column if not exists "commEmail" text;
alter table public.vendors add column if not exists "panNumber" text;
alter table public.vendors add column if not exists "panFileId" text;
alter table public.vendors add column if not exists "hasTan" boolean default false;
alter table public.vendors add column if not exists "tanNumber" text;
alter table public.vendors add column if not exists "tanFileId" text;
alter table public.vendors add column if not exists "gstStatus" text;
alter table public.vendors add column if not exists gstin text;
alter table public.vendors add column if not exists "gstFileId" text;
alter table public.vendors add column if not exists "gstRegistrationDate" text;
alter table public.vendors add column if not exists "placeOfBusiness" text;
alter table public.vendors add column if not exists "proofOfAddressType" text;
alter table public.vendors add column if not exists "proofOfAddressFileId" text;
alter table public.vendors add column if not exists "isMsmed" boolean default false;
alter table public.vendors add column if not exists "msmedLineOfBusiness" text;
alter table public.vendors add column if not exists "msmedType" text;
alter table public.vendors add column if not exists "msmedFileId" text;
alter table public.vendors add column if not exists "bankName" text;
alter table public.vendors add column if not exists "accountNumber" text;
alter table public.vendors add column if not exists "ifscCode" text;
alter table public.vendors add column if not exists "chequeLabel" text;
alter table public.vendors add column if not exists "chequeFileId" text;
alter table public.vendors add column if not exists "branchName" text;
alter table public.vendors add column if not exists "branchAddress" text;
alter table public.vendors add column if not exists "goodsServices" text[] default '{}';
alter table public.vendors add column if not exists "departmentTrading" text;
alter table public.vendors add column if not exists "employeeRefName" text;
alter table public.vendors add column if not exists "employeeRefContact" text;
alter table public.vendors add column if not exists "vendorContactPerson" text;
alter table public.vendors add column if not exists remarks text;
alter table public.vendors add column if not exists status text default 'pending';
alter table public.vendors add column if not exists "vrfNumber" text;
alter table public.vendors add column if not exists created_at timestamptz default now();

-- Do NOT add: category, state, description, website, routingNumber

create index if not exists vendors_status_idx on public.vendors (status);
create index if not exists vendors_name_idx on public.vendors (name);
create index if not exists vendors_pan_idx on public.vendors ("panNumber");
create index if not exists vendors_vrf_idx on public.vendors ("vrfNumber");

alter table public.vendors enable row level security;

drop policy if exists "vendors_insert_public" on public.vendors;
create policy "vendors_insert_public"
  on public.vendors for insert
  to anon, authenticated
  with check (true);

drop policy if exists "vendors_select_public" on public.vendors;
create policy "vendors_select_public"
  on public.vendors for select
  to anon, authenticated
  using (true);

drop policy if exists "vendors_update_public" on public.vendors;
create policy "vendors_update_public"
  on public.vendors for update
  to anon, authenticated
  using (true)
  with check (true);

notify pgrst, 'reload schema';