-- Storage RLS for member-docs bucket: authenticated users with any staff/admin role can read/write
create policy "member_docs_read" on storage.objects for select to authenticated
using (bucket_id = 'member-docs');

create policy "member_docs_insert" on storage.objects for insert to authenticated
with check (bucket_id = 'member-docs');

create policy "member_docs_update" on storage.objects for update to authenticated
using (bucket_id = 'member-docs') with check (bucket_id = 'member-docs');

create policy "member_docs_delete" on storage.objects for delete to authenticated
using (bucket_id = 'member-docs');

-- Members table: photo and ID document paths
alter table public.members add column if not exists photo_path text;
alter table public.members add column if not exists id_doc_path text;