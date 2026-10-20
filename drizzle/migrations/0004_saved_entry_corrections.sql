create table public.entry_edit_history (id uuid primary key default gen_random_uuid(),table_name text not null,row_id uuid not null,before_values jsonb not null,after_values jsonb not null,edited_by uuid not null default auth.uid(),edited_at timestamptz not null default now());
grant select,insert on public.entry_edit_history to authenticated; grant all on public.entry_edit_history to service_role; alter table public.entry_edit_history enable row level security;
create policy "admin read corrections" on public.entry_edit_history for select to authenticated using(public.has_role(auth.uid(),'admin'));
create policy "record own corrections" on public.entry_edit_history for insert to authenticated with check(edited_by=auth.uid() and public.has_access(auth.uid()));
create table public.ledger_revisions (id uuid primary key default gen_random_uuid(),transaction_id uuid not null references public.ledger_transactions(id),amount numeric not null check(amount>0),units numeric not null check(units>=0),txn_date date not null,note text,reference text,edited_by uuid not null default auth.uid(),edited_at timestamptz not null default now());
grant select on public.ledger_revisions to authenticated; grant all on public.ledger_revisions to service_role; alter table public.ledger_revisions enable row level security;
create policy "module read revisions" on public.ledger_revisions for select to authenticated using(exists(select 1 from public.ledger_transactions t join public.ledger_accounts a on a.id=t.account_id where t.id=transaction_id and public.has_module_access(a.module)));
create view public.effective_ledger_transactions with (security_invoker=true) as select t.id,t.account_id,t.member_id,t.loan_id,t.type,coalesce(r.amount,t.amount) amount,coalesce(r.units,t.units) units,coalesce(r.txn_date,t.txn_date) txn_date,case when r.id is null then t.note else r.note end note,case when r.id is null then t.reference else r.reference end reference,t.transfer_id,t.created_by,t.created_at from public.ledger_transactions t left join lateral (select * from public.ledger_revisions r where r.transaction_id=t.id order by r.edited_at desc,r.id desc limit 1) r on true;
grant select on public.effective_ledger_transactions to authenticated,service_role;
grant update on public.salary_payments,public.notification_drafts to authenticated;
create policy "update drafts" on public.notification_drafts for update to authenticated using(public.has_module_access('notifications',true)) with check(public.has_module_access('notifications',true));
create or replace function public.edit_saved_entry(p_table text,p_id uuid,p_values jsonb,p_expected jsonb) returns void language plpgsql security invoker set search_path=public as $$
declare allowed text[]; b jsonb; a jsonb; assignments text; k text; principal numeric; rate numeric; cnt int; paid numeric; waiver numeric; due date; itype text; row_loan uuid; fee_note text;
begin
 if auth.uid() is null then raise exception 'লগইন করুন'; end if;
 allowed:=case p_table when 'centers' then array['name','code','address','meeting_day'] when 'members' then array['name','phone','father_name','mother_name','spouse_name','nid','dob','gender','occupation','address','center_id','nominee_name','nominee_relation','nominee_phone','admission_date','status'] when 'loans' then array['principal','interest_rate','service_charge','installment_type','installment_count','disburse_date','first_due_date','purpose','guarantor','status'] when 'savings_transactions' then array['amount','txn_date','note','type'] when 'loan_repayments' then array['amount','late_fee','txn_date','note'] when 'dps_schemes' then array['name','installment_type','duration_months','profit_rate','active'] when 'fdr_schemes' then array['name','duration_months','profit_rate','payout_type','active'] when 'dps_accounts' then array['installment_amount','start_date','status','scheme_id'] when 'fdr_accounts' then array['amount','start_date','maturity_date','status','scheme_id'] when 'dps_transactions' then array['amount','txn_date','note','type'] when 'fdr_transactions' then array['amount','txn_date','note','type'] when 'member_fees' then array['fee_type','amount','txn_date','note'] when 'cash_entries' then array['head_id','kind','amount','txn_date','note'] when 'account_heads' then array['name','kind','active'] when 'ledger_accounts' then array['name','account_no','bank_name','branch','unit_price','opening_balance','budget','start_date','note','status'] when 'staff' then array['name','phone','designation_id','salary','join_date','address','status'] when 'designations' then array['name'] when 'attendance' then array['attendance_date','status','check_in','check_out','note'] when 'salary_payments' then array['month','amount','txn_date','note'] when 'notification_drafts' then array['channel','message','recipients'] when 'somiti_rules' then array['title','content'] else null end;
 if allowed is null or jsonb_typeof(p_values)<>'object' or p_values='{}'::jsonb then raise exception 'সংশোধনের তথ্য সঠিক নয়'; end if;
 for k in select jsonb_object_keys(p_values) loop if not k=any(allowed) then raise exception 'এই তথ্য সংশোধন করা যাবে না: %',k; end if; end loop;
 perform pg_advisory_xact_lock(741302);
 execute format('select to_jsonb(t) from public.%I t where id=$1 for update',p_table) into b using p_id;
 if b is null then raise exception 'এন্ট্রি পাওয়া যায়নি অথবা অনুমতি নেই'; end if;
 if b is distinct from p_expected then raise exception 'তথ্য ইতিমধ্যে পরিবর্তিত হয়েছে। পেজ আবার খুলুন'; end if;
 if p_table='loans' then
 principal:=coalesce((p_values->>'principal')::numeric,(b->>'principal')::numeric); rate:=coalesce((p_values->>'interest_rate')::numeric,(b->>'interest_rate')::numeric); cnt:=coalesce((p_values->>'installment_count')::int,(b->>'installment_count')::int); itype:=coalesce(p_values->>'installment_type',b->>'installment_type');
 if principal<=0 or rate<0 or cnt<1 or itype not in ('daily','weekly','monthly') or coalesce((p_values->>'service_charge')::numeric,(b->>'service_charge')::numeric)<0 then raise exception 'ঋণের টাকা, হার ও কিস্তি সঠিক দিন'; end if;
 select coalesce(sum(amount),0) into paid from public.loan_repayments where loan_id=p_id; select coalesce(sum(amount),0) into waiver from public.effective_ledger_transactions where loan_id=p_id and type='waiver';
 if principal+round(principal*rate/100)-waiver<paid then raise exception 'পরিশোধিত টাকার চেয়ে ঋণ কম হতে পারে না'; end if;
 due:=coalesce((p_values->>'disburse_date')::date,(b->>'disburse_date')::date);
 if not(p_values ? 'first_due_date') or ((p_values->>'first_due_date')=b->>'first_due_date' and (due<>(b->>'disburse_date')::date or itype<>b->>'installment_type')) then due:=case itype when 'daily' then due+1 when 'weekly' then due+7 else (due+interval '1 month')::date end; p_values:=p_values||jsonb_build_object('first_due_date',due); end if;
 p_values:=p_values||jsonb_build_object('total_payable',principal+round(principal*rate/100)-waiver,'installment_amount',ceil((principal+round(principal*rate/100)-waiver)/cnt));
 end if;
 select string_agg(format('%1$I = v.%1$I',key),',') into assignments from jsonb_object_keys(p_values) key;
 execute format('update public.%1$I t set %2$s from jsonb_populate_record(null::public.%1$I,$1) v where t.id=$2 returning to_jsonb(t)',p_table,assignments) into a using p_values,p_id;
 if a is null then raise exception 'সংশোধনের অনুমতি নেই'; end if;
 if p_table='loans' and ((a->>'service_charge')::numeric<>(b->>'service_charge')::numeric or a->>'disburse_date'<>b->>'disburse_date') then
 fee_note:='লোন '||(b->>'loan_no')||' সার্ভিস চার্জ';
 if (a->>'service_charge')::numeric>0 then
 update public.member_fees set amount=(a->>'service_charge')::numeric,txn_date=(a->>'disburse_date')::date where member_id=(b->>'member_id')::uuid and fee_type='service' and note=fee_note;
 if not found then insert into public.member_fees(member_id,fee_type,amount,txn_date,note) values((b->>'member_id')::uuid,'service',(a->>'service_charge')::numeric,(a->>'disburse_date')::date,fee_note); end if;
 elsif exists(select 1 from public.member_fees where member_id=(b->>'member_id')::uuid and fee_type='service' and note=fee_note) then raise exception 'আগে আদায় করা সার্ভিস চার্জ শূন্য করতে আলাদা সমন্বয় প্রয়োজন'; end if;
 end if;
 if p_table='loan_repayments' then row_loan:=(a->>'loan_id')::uuid; select coalesce(sum(amount),0) into paid from public.loan_repayments where loan_id=row_loan; if paid>(select total_payable from public.loans where id=row_loan) then raise exception 'কিস্তি ঋণের বকেয়ার চেয়ে বেশি'; end if; if (a->>'late_fee')::numeric<0 then raise exception 'বিলম্ব চার্জ ঋণাত্মক হতে পারে না'; end if; update public.loans set status=case when paid>=total_payable then 'closed' else 'active' end where id=row_loan; end if;
 if p_table='loans' and not(p_values ? 'status') then update public.loans set status=case when paid>0 and paid=(a->>'total_payable')::numeric then 'closed' else 'active' end where id=p_id; end if;
 if exists(select 1 from public.savings_transactions group by member_id having sum(case when type='withdraw' then -amount else amount end)<0) then raise exception 'সঞ্চয় ব্যালেন্স অপর্যাপ্ত'; end if;
 if exists(select 1 from public.dps_transactions group by account_id having sum(case when type in ('deposit','profit') then amount else -amount end)<0) then raise exception 'DPS ব্যালেন্স অপর্যাপ্ত'; end if;
 if exists(select 1 from public.fdr_accounts a left join public.fdr_transactions t on t.account_id=a.id group by a.id,a.amount having a.amount+coalesce(sum(case when t.type in ('withdraw','service_charge') then -t.amount when t.type='deposit' then t.amount else 0 end),0)<0) then raise exception 'FDR ব্যালেন্স অপর্যাপ্ত'; end if;
 if exists(select 1 from public.ledger_accounts a left join public.effective_ledger_transactions t on t.account_id=a.id where a.module in ('fund','banks') group by a.id,a.opening_balance having a.opening_balance+coalesce(sum(case when t.type in ('purchase','deposit','return','profit','transfer_in') then t.amount else -t.amount end),0)<0) then raise exception 'হিসাবের স্থিতি অপর্যাপ্ত'; end if;
 insert into public.entry_edit_history(table_name,row_id,before_values,after_values) values(p_table,p_id,b,a);
end $$;
revoke all on function public.edit_saved_entry(text,uuid,jsonb,jsonb) from public,anon; grant execute on function public.edit_saved_entry(text,uuid,jsonb,jsonb) to authenticated;
create or replace function public.correct_ledger_entry(p_id uuid,p_values jsonb,p_expected jsonb) returns void language plpgsql security definer set search_path=public as $$
declare t record;a record;k text;amt numeric;u numeric;dt date;nt text;ref text;b jsonb;v jsonb;other record;
begin
 if auth.uid() is null then raise exception 'লগইন করুন'; end if; perform pg_advisory_xact_lock(741302);
 select * into t from public.effective_ledger_transactions where id=p_id; if not found then raise exception 'লেনদেন পাওয়া যায়নি'; end if;
 select * into a from public.ledger_accounts where id=t.account_id for update; if not public.has_module_access(a.module,true) then raise exception 'অনুমতি নেই'; end if;
 b:=to_jsonb(t); if b is distinct from p_expected then raise exception 'তথ্য পরিবর্তিত হয়েছে। পেজ আবার খুলুন'; end if;
 for k in select jsonb_object_keys(p_values) loop if k not in ('amount','units','txn_date','note','reference') then raise exception 'এই তথ্য সংশোধন করা যাবে না'; end if; end loop;
 amt:=coalesce((p_values->>'amount')::numeric,t.amount);u:=coalesce((p_values->>'units')::numeric,t.units);dt:=coalesce((p_values->>'txn_date')::date,t.txn_date);nt:=coalesce(p_values->>'note',t.note);ref:=coalesce(p_values->>'reference',t.reference);
 if a.module='shares' and t.type in ('purchase','withdraw') then amt:=u*a.unit_price; if u<=0 then raise exception 'শেয়ার সংখ্যা সঠিক দিন'; end if; end if;
 if amt<=0 or u<0 then raise exception 'টাকার পরিমাণ সঠিক দিন'; end if;
 if t.type='waiver' then perform id from public.loans where id=t.loan_id for update; if (select total_payable+t.amount-amt from public.loans where id=t.loan_id)<(select coalesce(sum(amount),0) from public.loan_repayments where loan_id=t.loan_id) then raise exception 'মওকুফের পরিমাণ বকেয়ার চেয়ে বেশি'; end if;
 update public.loans set total_payable=total_payable+t.amount-amt,installment_amount=ceil((total_payable+t.amount-amt)/installment_count),status=case when total_payable+t.amount-amt=(select coalesce(sum(amount),0) from public.loan_repayments where loan_id=t.loan_id) then 'closed' else 'active' end where id=t.loan_id; end if;
 insert into public.ledger_revisions(transaction_id,amount,units,txn_date,note,reference) values(t.id,amt,u,dt,nt,ref);
 if t.transfer_id is not null then
 if (select count(*) from public.ledger_transactions where transfer_id=t.transfer_id)<>2 then raise exception 'স্থানান্তরের দুই হিসাব পাওয়া যায়নি'; end if;
 select e.* into other from public.effective_ledger_transactions e where transfer_id=t.transfer_id and id<>t.id; perform id from public.ledger_accounts where id=other.account_id for update;
 if not exists(select 1 from public.ledger_accounts where id=other.account_id and public.has_module_access(module,true)) then raise exception 'অন্য হিসাবে অনুমতি নেই'; end if;
 insert into public.ledger_revisions(transaction_id,amount,units,txn_date,note,reference) values(other.id,amt,other.units,dt,nt,ref); end if;
 if exists(select 1 from public.ledger_accounts ac left join public.effective_ledger_transactions e on e.account_id=ac.id where ac.module in ('banks','fund') group by ac.id,ac.opening_balance having ac.opening_balance+coalesce(sum(case when e.type in ('purchase','deposit','return','profit','transfer_in') then e.amount else -e.amount end),0)<0) then raise exception 'হিসাবের স্থিতি অপর্যাপ্ত'; end if;
 if exists(select 1 from public.effective_ledger_transactions e join public.ledger_accounts ac on ac.id=e.account_id where ac.module='shares' group by e.account_id,e.member_id having sum(case when e.type='purchase' then e.units when e.type='withdraw' then -e.units else 0 end)<0) then raise exception 'শেয়ারের পরিমাণ অপর্যাপ্ত'; end if;
 select to_jsonb(e) into v from public.effective_ledger_transactions e where id=p_id; insert into public.entry_edit_history(table_name,row_id,before_values,after_values,edited_by) values('ledger_transactions',p_id,b,v,auth.uid());
end $$;
revoke all on function public.correct_ledger_entry(uuid,jsonb,jsonb) from public,anon; grant execute on function public.correct_ledger_entry(uuid,jsonb,jsonb) to authenticated;
create or replace function public.validate_ledger_transaction() returns trigger language plpgsql security definer set search_path=public as $$
declare a public.ledger_accounts;bal numeric;held numeric;l public.loans;
begin
 select * into a from public.ledger_accounts where id=new.account_id for update;
 if a.status<>'active' then raise exception 'এই হিসাব বন্ধ রয়েছে'; end if;
 if a.module='shares' and new.type not in ('purchase','withdraw','dividend') then raise exception 'শেয়ারের লেনদেন সঠিক নয়'; end if;
 if a.module='investments' and new.type not in ('invest','return','profit','expense') then raise exception 'বিনিয়োগের লেনদেন সঠিক নয়'; end if;
 if a.module='fund' and new.type not in ('deposit','expense','waiver') then raise exception 'তহবিলের লেনদেন সঠিক নয়'; end if;
 if a.module='banks' and new.type not in ('deposit','withdraw','profit','expense','transfer_in','transfer_out') then raise exception 'ব্যাংকের লেনদেন সঠিক নয়'; end if;
 if a.module='shares' and new.member_id is null then raise exception 'সদস্য নির্বাচন করুন'; end if;
 if a.module='shares' and new.type in ('purchase','withdraw') then if new.units<=0 or abs(new.amount-new.units*a.unit_price)>0.01 then raise exception 'শেয়ার সংখ্যা ও টাকার পরিমাণ সঠিক নয়'; end if;
 select coalesce(sum(case when type='purchase' then units when type='withdraw' then -units else 0 end),0) into held from public.effective_ledger_transactions where account_id=a.id and member_id=new.member_id;
 if new.type='withdraw' and new.units>held then raise exception 'শেয়ারের পরিমাণ অপর্যাপ্ত'; end if; end if;
 select a.opening_balance+coalesce(sum(case when type in ('purchase','deposit','return','profit','transfer_in') then amount else -amount end),0) into bal from public.effective_ledger_transactions where account_id=a.id;
 if a.module in ('fund','banks') and new.type in ('withdraw','expense','waiver','transfer_out') and new.amount>bal then raise exception 'হিসাবের স্থিতি অপর্যাপ্ত'; end if;
 if new.type='waiver' then select * into l from public.loans where id=new.loan_id for update; if not found or l.status<>'active' then raise exception 'সক্রিয় ঋণ নির্বাচন করুন'; end if;
 select l.total_payable-coalesce(sum(amount),0) into held from public.loan_repayments where loan_id=l.id;
 if new.amount>held then raise exception 'মওকুফ বকেয়ার চেয়ে বেশি'; end if; new.member_id:=l.member_id;
 update public.loans set total_payable=total_payable-new.amount,status=case when new.amount=held then 'closed' else status end where id=l.id; end if; return new;
end $$;