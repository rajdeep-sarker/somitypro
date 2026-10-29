import { expect, it } from "vitest";
import { announcementAudience } from "./announcement-audience";

const profiles = [{ id: "user-one", full_name: "Manager", phone: "01700000000", password_hash: "secret" }];
const views = [{ id: "banner-one_user-one", count: 3, last_seen_at: "2026-10-29T15:20:00Z" }, { id: "banner-two_user-one", count: 1 }];
it("reports who saw the selected banner, count and last time without account secrets", () => {
  expect(announcementAudience(true, "banner-one", views, profiles, [{ user_id: "user-one", role: "admin" }])).toEqual([{ userId: "user-one", name: "Manager", phone: "01700000000", role: "admin", count: 3, lastSeenAt: "2026-10-29T15:20:00Z" }]);
});
it("keeps older display counts without inventing a display time", () => {
  expect(announcementAudience(true, "banner-two", views, profiles, [])[0]?.lastSeenAt).toBeNull();
});
it("rejects audience access for anyone other than CTO", () => {
  expect(() => announcementAudience(false, "banner-one", views, profiles, [])).toThrow("CTO only");
});