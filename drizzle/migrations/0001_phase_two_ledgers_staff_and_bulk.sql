create table public.ledger_accounts (
 id uuid primary key default gen_random_uuid(), module text not null check(module in ('shares','investments','fund','banks')), name text not null, member_id uuid references public.members(id), account_no text, bank_name text, branch text, unit_price numeric not null default 1 check(unit_price > 0), opening_balance numeric not null default 0 check(opening_balance >= 0), budget numeric not null default 0, status text not null default 'active', start_date date not null default current_date, note text, created_at timestamptz not null default now()
);
grant select,insert,update,delete on public.ledger_accounts to authenticated;
grant all on public.ledger_accounts to service_role;
alter table public.ledger_accounts enable row level security;
create table public.ledger_transactions (
 id uuid primary key default gen_random_uuid(), account_id uuid not null references public.ledger_accounts(id), member_id uuid references public.members(id), loan_id uuid references public.loans(id), type text not null check(type in ('purchase','withdraw','dividend','invest','return','profit','deposit','expense','waiver','transfer_in','transfer_out')), amount numeric not null check(amount > 0), units numeric not null default 0 check(units >= 0), txn_date date not null default current_date, note text, reference text, transfer_id uuid, created_by uuid default auth.uid(), created_at timestamptz not null default now()
);
grant select,insert on public.ledger_transactions to authenticated;
grant all on public.ledger_transactions to service_role;
alter table public.ledger_transactions enable row level security;
create index ledger_txn_account on public.ledger_transactions(account_id,txn_date);
create table public.designations (id uuid primary key default gen_random_uuid(),name text not null unique,created_at timestamptz not null default now());
grant select,insert,update,delete on public.designations to authenticated;
grant all on public.designations to service_role;
alter table public.designations enable row level security;
create table public.staff (
 id uuid primary key default gen_random_uuid(), user_id uuid unique, name text not null, phone text, designation_id uuid references public.designations(id), salary numeric not null default 0 check(salary >= 0), join_date date not null default current_date, address text, status text not null default 'active', created_at timestamptz not null default now()
);
grant select,insert,update,delete on public.staff to authenticated;
grant all on public.staff to service_role;
alter table public.staff enable row level security;
create table public.staff_permissions (id uuid primary key default gen_random_uuid(),user_id uuid not null,module text not null check(module in ('shares','investments','fund','banks','collection','notifications')),can_write boolean not null default false,unique(user_id,module),created_at timestamptz not null default now());
grant select,insert,update,delete on public.staff_permissions to authenticated;
grant all on public.staff_permissions to service_role;
alter table public.staff_permissions enable row level security;
create or replace function public.has_module_access(p_module text,p_write boolean default false) returns boolean language sql stable security definer set search_path=public as $$
 select public.has_role(auth.uid(),'admin') or (public.has_role(auth.uid(),'staff') and exists(select 1 from public.staff s join public.staff_permissions p on p.user_id=s.user_id where s.user_id=auth.uid() and s.status='active' and p.module=p_module and (not p_write or p.can_write)))
$$;
create policy "read permissions" on public.staff_permissions for select to authenticated using(user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin permissions" on public.staff_permissions for all to authenticated using(public.has_role(auth.uid(),'admin')) with check(public.has_role(auth.uid(),'admin'));
create policy "read accounts" on public.ledger_accounts for select to authenticated using(public.has_module_access(module));
create policy "write accounts" on public.ledger_accounts for insert to authenticated with check(public.has_module_access(module,true));
create policy "update accounts" on public.ledger_accounts for update to authenticated using(public.has_module_access(module,true)) with check(public.has_module_access(module,true));
create policy "delete accounts" on public.ledger_accounts for delete to authenticated using(public.has_role(auth.uid(),'admin'));
create policy "read transactions" on public.ledger_transactions for select to authenticated using(exists(select 1 from public.ledger_accounts a where a.id=account_id and public.has_module_access(a.module)));
create policy "insert transactions" on public.ledger_transactions for insert to authenticated with check(exists(select 1 from public.ledger_accounts a where a.id=account_id and public.has_module_access(a.module,true)));
create table public.attendance (id uuid primary key default gen_random_uuid(),staff_id uuid not null references public.staff(id),attendance_date date not null default current_date,status text not null check(status in ('present','absent','leave','late')),check_in time,check_out time,note text,unique(staff_id,attendance_date),created_at timestamptz not null default now());
grant select,insert,update,delete on public.attendance to authenticated;
grant all on public.attendance to service_role;
alter table public.attendance enable row level security;
create table public.salary_payments (id uuid primary key default gen_random_uuid(),staff_id uuid not null references public.staff(id),month text not null,amount numeric not null check(amount > 0),txn_date date not null default current_date,note text,created_at timestamptz not null default now());
grant select,insert on public.salary_payments to authenticated;
grant all on public.salary_payments to service_role;
alter table public.salary_payments enable row level security;
create table public.somiti_rules (id uuid primary key default gen_random_uuid(),title text not null,content text not null,created_at timestamptz not null default now());
grant select,insert,update,delete on public.somiti_rules to authenticated;
grant all on public.somiti_rules to service_role;
alter table public.somiti_rules enable row level security;
create table public.notification_drafts (id uuid primary key default gen_random_uuid(),channel text not null check(channel in ('sms','email')),message text not null,recipients jsonb not null default '[]',status text not null default 'draft' check(status='draft'),created_at timestamptz not null default now());
grant select,insert,delete on public.notification_drafts to authenticated;
grant all on public.notification_drafts to service_role;
alter table public.notification_drafts enable row level security;
create policy "read drafts" on public.notification_drafts for select to authenticated using(public.has_module_access('notifications'));
create policy "insert drafts" on public.notification_drafts for insert to authenticated with check(public.has_module_access('notifications',true));
create policy "delete drafts" on public.notification_drafts for delete to authenticated using(public.has_role(auth.uid(),'admin'));
do $$ declare t text; begin foreach t in array array['designations','staff','attendance','salary_payments'] loop
 execute format('create policy "admin manage" on public.%I for all to authenticated using(public.has_role(auth.uid(),''admin'')) with check(public.has_role(auth.uid(),''admin''))',t);
 end loop; end $$;
create policy "own staff" on public.staff for select to authenticated using(user_id=auth.uid());
create policy "read rules" on public.somiti_rules for select to authenticated using(public.has_access(auth.uid()));
create policy "admin rules" on public.somiti_rules for all to authenticated using(public.has_role(auth.uid(),'admin')) with check(public.has_role(auth.uid(),'admin'));
create or replace function public.validate_ledger_transaction() returns trigger language plpgsql security definer set search_path=public as $$
declare a public.ledger_accounts; bal numeric; held numeric; l public.loans;
begin
 select * into a from public.ledger_accounts where id=new.account_id for update;
 if a.status <> 'active' then raise exception 'এই হিসাব বন্ধ রয়েছে'; end if;
 if a.module='shares' and new.type not in ('purchase','withdraw','dividend') then raise exception 'শেয়ারের লেনদেন সঠিক নয়'; end if;
 if a.module='investments' and new.type not in ('invest','return','profit','expense') then raise exception 'বিনিয়োগের লেনদেন সঠিক নয়'; end if;
 if a.module='fund' and new.type not in ('deposit','expense','waiver') then raise exception 'তহবিলের লেনদেন সঠিক নয়'; end if;
 if a.module='banks' and new.type not in ('deposit','withdraw','profit','expense','transfer_in','transfer_out') then raise exception 'ব্যাংকের লেনদেন সঠিক নয়'; end if;
 if a.module='shares' and new.member_id is null then raise exception 'সদস্য নির্বাচন করুন'; end if;
 if a.module='shares' and new.type in ('purchase','withdraw') then
  if new.units<=0 or abs(new.amount-new.units*a.unit_price)>0.01 then raise exception 'শেয়ার সংখ্যা ও টাকার পরিমাণ সঠিক নয়'; end if;
  select coalesce(sum(case when type='purchase' then units when type='withdraw' then -units else 0 end),0) into held from public.ledger_transactions where account_id=a.id and member_id=new.member_id;
  if new.type='withdraw' and new.units>held then raise exception 'শেয়ারের পরিমাণ অপর্যাপ্ত'; end if;
 end if;
 select a.opening_balance+coalesce(sum(case when type in ('purchase','deposit','return','profit','transfer_in') then amount else -amount end),0) into bal from public.ledger_transactions where account_id=a.id;
 if a.module in ('fund','banks') and new.type in ('withdraw','expense','waiver','transfer_out') and new.amount>bal then raise exception 'হিসাবের স্থিতি অপর্যাপ্ত'; end if;
 if new.type='waiver' then
  select * into l from public.loans where id=new.loan_id for update;
  if not found or l.status<>'active' then raise exception 'সক্রিয় ঋণ নির্বাচন করুন'; end if;
  select l.total_payable-coalesce(sum(amount),0) into held from public.loan_repayments where loan_id=l.id;
  if new.amount>held then raise exception 'মওকুফ বকেয়ার চেয়ে বেশি'; end if;
  new.member_id:=l.member_id;
  update public.loans set total_payable=total_payable-new.amount,status=case when new.amount=held then 'closed' else status end where id=l.id;
 end if;
 return new;
end $$;
create trigger validate_ledger before insert on public.ledger_transactions for each row execute function public.validate_ledger_transaction();
create or replace function public.transfer_bank(p_from uuid,p_to uuid,p_amount numeric,p_date date,p_note text default '') returns uuid language plpgsql security invoker set search_path=public as $$
declare tid uuid:=gen_random_uuid();begin
 if not public.has_module_access('banks',true) then raise exception 'অনুমতি নেই'; end if;
 if p_from=p_to or p_amount<=0 then raise exception 'সঠিক হিসাব ও টাকা দিন'; end if;
 perform id from public.ledger_accounts where id in(p_from,p_to) order by id for update;
 if (select count(*) from public.ledger_accounts where id in(p_from,p_to) and module='banks' and status='active')<>2 then raise exception 'ব্যাংক হিসাব সঠিক নয়'; end if;
 insert into public.ledger_transactions(account_id,type,amount,txn_date,note,transfer_id) values(p_from,'transfer_out',p_amount,p_date,p_note,tid),(p_to,'transfer_in',p_amount,p_date,p_note,tid);
 return tid;end $$;
grant execute on function public.transfer_bank(uuid,uuid,numeric,date,text) to authenticated;
create table public.bulk_batches (id uuid primary key,kind text not null check(kind in ('members','collection')),row_count int not null,created_by uuid default auth.uid(),created_at timestamptz not null default now());
grant select,insert on public.bulk_batches to authenticated;
grant all on public.bulk_batches to service_role;
alter table public.bulk_batches enable row level security;
create policy "read batch" on public.bulk_batches for select to authenticated using(public.has_module_access('collection'));
create policy "insert batch" on public.bulk_batches for insert to authenticated with check(public.has_module_access('collection',true));
create or replace function public.import_members(p_batch uuid,p_rows jsonb) returns int language plpgsql security invoker set search_path=public as $$
declare r jsonb;n int:=0;begin
 if not public.has_module_access('collection',true) then raise exception 'অনুমতি নেই';end if;
 if exists(select 1 from public.bulk_batches where id=p_batch) then raise exception 'এই ব্যাচ ইতিমধ্যে সংরক্ষিত';end if;
 if jsonb_array_length(p_rows)<1 or jsonb_array_length(p_rows)>1000 then raise exception '১ থেকে ১০০০ সদস্য দিন';end if;
 for r in select * from jsonb_array_elements(p_rows) loop
 if trim(coalesce(r->>'name',''))='' or trim(coalesce(r->>'member_no',''))='' then raise exception 'সদস্যের নাম ও নম্বর আবশ্যক';end if;
 insert into public.members(member_no,name,phone,address,nid) values(trim(r->>'member_no'),trim(r->>'name'),r->>'phone',r->>'address',r->>'nid');n:=n+1;
 end loop;
 insert into public.bulk_batches(id,kind,row_count) values(p_batch,'members',n);return n;end $$;
grant execute on function public.import_members(uuid,jsonb) to authenticated;
create or replace function public.bulk_collect(p_batch uuid,p_date date,p_rows jsonb) returns int language plpgsql security invoker set search_path=public as $$
declare r jsonb;l public.loans;paid numeric;n int:=0;v numeric;begin
 if not public.has_module_access('collection',true) then raise exception 'অনুমতি নেই';end if;
 if exists(select 1 from public.bulk_batches where id=p_batch) then raise exception 'এই ব্যাচ ইতিমধ্যে সংরক্ষিত';end if;
 if jsonb_array_length(p_rows)<1 or jsonb_array_length(p_rows)>1000 then raise exception '১ থেকে ১০০০ এন্ট্রি দিন';end if;
 for r in select * from jsonb_array_elements(p_rows) loop
 v:=(r->>'amount')::numeric;if v<=0 then raise exception 'টাকা শূন্যের বেশি হতে হবে';end if;
 if r->>'kind'='savings' then insert into public.savings_transactions(member_id,type,amount,txn_date,note) values((r->>'member_id')::uuid,'deposit',v,p_date,'বাল্ক কালেকশন');
 elsif r->>'kind'='loan' then
 select * into l from public.loans where id=(r->>'account_id')::uuid for update;
 if not found or l.member_id<>(r->>'member_id')::uuid or l.status<>'active' then raise exception 'ঋণ সঠিক নয়';end if;
 select coalesce(sum(amount),0) into paid from public.loan_repayments where loan_id=l.id;
 if v>l.total_payable-paid then raise exception 'কিস্তি বকেয়ার চেয়ে বেশি';end if;
 insert into public.loan_repayments(loan_id,member_id,amount,txn_date,note) values(l.id,l.member_id,v,p_date,'বাল্ক কালেকশন');
 if paid+v=l.total_payable then update public.loans set status='closed' where id=l.id;end if;
 elsif r->>'kind'='dps' then
 if not exists(select 1 from public.dps_accounts where id=(r->>'account_id')::uuid and member_id=(r->>'member_id')::uuid and status='active') then raise exception 'DPS হিসাব সঠিক নয়';end if;
 insert into public.dps_transactions(account_id,member_id,type,amount,txn_date,note) values((r->>'account_id')::uuid,(r->>'member_id')::uuid,'deposit',v,p_date,'বাল্ক কালেকশন');
 else raise exception 'কালেকশন খাত সঠিক নয়';end if;n:=n+1;
 end loop;
 insert into public.bulk_batches(id,kind,row_count) values(p_batch,'collection',n);return n;end $$;
grant execute on function public.bulk_collect(uuid,date,jsonb) to authenticated;