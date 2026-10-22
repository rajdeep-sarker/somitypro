DROP POLICY IF EXISTS member_docs_read ON storage.objects;
DROP POLICY IF EXISTS member_docs_insert ON storage.objects;
DROP POLICY IF EXISTS member_docs_update ON storage.objects;
DROP POLICY IF EXISTS member_docs_delete ON storage.objects;
CREATE POLICY member_docs_admin_all ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'member-docs' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'member-docs' AND public.has_role(auth.uid(), 'admin'));