export type MemberFiles = { photo: File | null; id_doc: File | null };
export function validateMemberFile(file: Pick<File, "size" | "type" | "name">) {
  if (file.size > 10 * 1024 * 1024) throw new Error("ফাইল সর্বোচ্চ ১০ মেগাবাইট হতে পারে");
  if (!file.type.startsWith("image/") && file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) throw new Error("ছবি অথবা PDF ফাইল নির্বাচন করুন");
}