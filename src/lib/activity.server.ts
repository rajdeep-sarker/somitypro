import { wSet, type Write } from "./firebase-admin.server";

/** One activity-log row, committed together with the change it describes. */
export function logWrite(fsDb: string, ctx: { userId: string; userName?: string }, action: string, table: string, rowId: string, fields: string[] = []): Write {
  const id = crypto.randomUUID();
  return wSet(fsDb, "activity_log", id, { id, at: new Date().toISOString(), user_id: ctx.userId, user_name: ctx.userName ?? "", action, table, row_id: rowId, fields: fields.join(", ") });
}
