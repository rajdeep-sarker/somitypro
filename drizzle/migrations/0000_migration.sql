create type public.app_role as enum ('admin','staff');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.has_access(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "staff read profiles" on public.profiles for select to authenticated using (public.has_access(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- settings
create table public.somiti_settings (
  id int primary key default 1 check (id = 1),
  name text not null default 'সোনালী সঞ্চয় ও ঋণদান সমবায় সমিতি লিমিটেড',
  reg_no text, address text, phone text, email text,
  admission_fee numeric not null default 0,
  monthly_fee numeric not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.somiti_settings (id) values (1);

create table public.centers (
  id uuid primary key default gen_random_uuid(),
  name text not null, code text, address text, meeting_day text,
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  member_no text not null unique,
  name text not null,
  father_name text, mother_name text, spouse_name text,
  phone text, nid text, dob date, gender text, occupation text,
  address text,
  center_id uuid references public.centers(id) on delete set null,
  nominee_name text, nominee_relation text, nominee_phone text,
  admission_date date not null default current_date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table public.savings_transactions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  type text not null check (type in ('deposit','withdraw','profit')),
  amount numeric not null check (amount > 0),
  txn_date date not null default current_date,
  note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  loan_no text not null unique,
  member_id uuid not null references public.members(id) on delete cascade,
  principal numeric not null check (principal > 0),
  interest_rate numeric not null default 0,
  service_charge numeric not null default 0,
  total_payable numeric not null,
  installment_type text not null default 'weekly',
  installment_count int not null default 1,
  installment_amount numeric not null,
  disburse_date date not null default current_date,
  first_due_date date not null default current_date,
  status text not null default 'active',
  purpose text, guarantor text,
  created_at timestamptz not null default now()
);

create table public.loan_repayments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  amount numeric not null check (amount > 0),
  late_fee numeric not null default 0,
  txn_date date not null default current_date,
  note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.dps_schemes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  installment_type text not null default 'monthly',
  duration_months int not null default 12,
  profit_rate numeric not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.dps_accounts (
  id uuid primary key default gen_random_uuid(),
  account_no text not null unique,
  member_id uuid not null references public.members(id) on delete cascade,
  scheme_id uuid references public.dps_schemes(id) on delete set null,
  installment_amount numeric not null,
  start_date date not null default current_date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create table public.dps_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.dps_accounts(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  type text not null check (type in ('deposit','withdraw','profit','profit_withdraw','service_charge')),
  amount numeric not null check (amount > 0),
  txn_date date not null default current_date,
  note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.fdr_schemes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_months int not null default 12,
  profit_rate numeric not null default 0,
  payout_type text not null default 'maturity',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.fdr_accounts (
  id uuid primary key default gen_random_uuid(),
  account_no text not null unique,
  member_id uuid not null references public.members(id) on delete cascade,
  scheme_id uuid references public.fdr_schemes(id) on delete set null,
  amount numeric not null check (amount > 0),
  start_date date not null default current_date,
  maturity_date date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create table public.fdr_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.fdr_accounts(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  type text not null check (type in ('deposit','withdraw','profit','service_charge')),
  amount numeric not null check (amount > 0),
  txn_date date not null default current_date,
  note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.member_fees (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  fee_type text not null check (fee_type in ('admission','monthly','late','service','other')),
  amount numeric not null check (amount > 0),
  txn_date date not null default current_date,
  note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.account_heads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('expense','income')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.cash_entries (
  id uuid primary key default gen_random_uuid(),
  head_id uuid references public.account_heads(id) on delete set null,
  kind text not null check (kind in ('expense','income','opening')),
  amount numeric not null check (amount > 0),
  txn_date date not null default current_date,
  note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['somiti_settings','centers','members','savings_transactions','loans','loan_repayments','dps_schemes','dps_accounts','dps_transactions','fdr_schemes','fdr_accounts','fdr_transactions','member_fees','account_heads','cash_entries']
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "staff read" on public.%I for select to authenticated using (public.has_access(auth.uid()))', t);
    execute format('create policy "staff insert" on public.%I for insert to authenticated with check (public.has_access(auth.uid()))', t);
    execute format('create policy "staff update" on public.%I for update to authenticated using (public.has_access(auth.uid()))', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using (public.has_role(auth.uid(),''admin''))', t);
  end loop;
end $$;

insert into public.account_heads (name, kind) values
 ('অফিস ভাড়া','expense'),('বিদ্যুৎ বিল','expense'),('স্টাফ বেতন','expense'),('আপ্যায়ন','expense'),('স্টেশনারি','expense'),
 ('অনুদান','income'),('অন্যান্য আয়','income');
insert into public.dps_schemes (name, installment_type, duration_months, profit_rate) values
 ('মাসিক DPS ১ বছর','monthly',12,8),('মাসিক DPS ৩ বছর','monthly',36,10),('সাপ্তাহিক DPS','weekly',12,7);
insert into public.fdr_schemes (name, duration_months, profit_rate, payout_type) values
 ('FDR ১ বছর',12,10,'maturity'),('FDR মাসিক মুনাফা',24,11,'monthly');
insert into public.centers (name, code, address, meeting_day) values ('প্রধান কার্যালয়','C-01',null,'শনিবার');