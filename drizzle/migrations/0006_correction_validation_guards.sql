create or replace function public.guard_financial_correction() returns trigger language plpgsql security definer set search_path=public as $$ declare j jsonb; k text; v numeric; paid numeric; waived numeric; b numeric; begin
 j:=to_jsonb(new);
 if auth.uid() is not null and not public.has_role(auth.uid(),'admin') and (j-'status') is distinct from (to_jsonb(old)-'status') then raise exception 'সংশোধনের জন্য অ্যাডমিনের অনুমতি প্রয়োজন'; end if;
 foreach k in array array['amount','principal','interest_rate','service_charge','installment_amount','installment_count','profit_rate','duration_months','opening_balance','unit_price','units','budget','late_fee','salary'] loop
 if j ? k and j->>k is not null then v:=(j->>k)::numeric; if v::text in ('NaN','Infinity','-Infinity') then raise exception 'সঠিক সংখ্যা দিন'; end if; if k not in ('opening_balance','budget') and v<0 then raise exception 'পরিমাণ ঋণাত্মক হতে পারে না'; end if; if k in ('principal','amount','installment_amount','installment_count','duration_months','unit_price') and v<=0 then raise exception 'পরিমাণ শূন্যের বেশি হতে হবে'; end if; end if;
 end loop;
 if tg_table_name='loans' then
 select coalesce(sum(amount),0) into paid from public.loan_repayments where loan_id=new.id;
 select coalesce(sum(amount),0) into waived from public.effective_ledger_transactions where loan_id=new.id and type='waiver';
 if new.total_payable<paid or new.total_payable<>new.principal+round(new.principal*new.interest_rate/100)-waived then raise exception 'ঋণের সংশোধিত হিসাব সঠিক নয়'; end if;
 end if;
 if tg_table_name='loan_repayments' then
 if not exists(select 1 from public.loans where id=new.loan_id and member_id=new.member_id) then raise exception 'ঋণ ও সদস্যের তথ্য মেলে না'; end if;
 select coalesce(sum(amount),0)-old.amount+new.amount into paid from public.loan_repayments where loan_id=new.loan_id;
 if paid>(select total_payable from public.loans where id=new.loan_id) then raise exception 'কিস্তি ঋণের বকেয়ার চেয়ে বেশি'; end if;
 end if;
 return new;
end $$;
do $$ declare t text; begin foreach t in array array['loans','loan_repayments','savings_transactions','dps_accounts','dps_transactions','fdr_accounts','fdr_transactions','member_fees','cash_entries','ledger_accounts','salary_payments'] loop execute format('create trigger correction_guard before update on public.%I for each row execute function public.guard_financial_correction()',t); end loop; end $$;
create or replace function public.audit_financial_update() returns trigger language plpgsql security definer set search_path=public as $$ begin if auth.uid() is not null and to_jsonb(old) is distinct from to_jsonb(new) then insert into public.entry_edit_history(table_name,row_id,before_values,after_values,edited_by) values(tg_table_name,new.id,to_jsonb(old),to_jsonb(new),auth.uid()); end if; return new; end $$;
do $$ declare t text; begin foreach t in array array['loans','loan_repayments','savings_transactions','dps_accounts','dps_transactions','fdr_accounts','fdr_transactions','member_fees','cash_entries','ledger_accounts','salary_payments'] loop execute format('create trigger correction_audit after update on public.%I for each row execute function public.audit_financial_update()',t); end loop; end $$;
do $$ declare def text; begin
 select pg_get_functiondef('public.edit_saved_entry(text,uuid,jsonb,jsonb)'::regprocedure) into def;
 def:=replace(def,'else (due+interval ''1 month'')::date end','else ((date_trunc(''month'',due)+interval ''1 month'')::date+extract(day from due)::int-1) end');
 def:=replace(def,'if exists(select 1 from public.dps_transactions group by account_id having sum(case when type in (''deposit'',''profit'') then amount else -amount end)<0) then','if exists(select 1 from public.dps_transactions group by account_id having sum(case when type=''deposit'' then amount when type in (''withdraw'',''service_charge'') then -amount else 0 end)<0 or sum(case when type=''profit'' then amount when type=''profit_withdraw'' then -amount else 0 end)<0) then');
 execute def;
end $$;