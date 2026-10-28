<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Phase-two shares, projects, security funds and bank accounts use a module-tagged immutable ledger; database triggers validate balances and RPCs commit transfers and bulk collections atomically.
- Staff provisioning is an admin-authorized server function; module permissions live separately from profiles and govern phase-two ledgers through RLS.
- New feature pages reuse the shared form/table kit and leaf-route metadata helper to keep Bengali workflows consistent.
- Uploaded Bengali fonts use CDN asset pointers and a Bengali-only font-face range to preserve Latin text; motion is CSS-only and respects reduced-motion preferences to keep interaction immediate.
- Signed-in menus warm route chunks and shared row queries through a bounded, cancellable background queue; all reads reuse the same query options to avoid duplicate network work.
- The authenticated layout deduplicates verified-user checks in QueryClient for one minute; auth events invalidate this cache and logout clears it, while database RLS remains authoritative.
- Interface font sizes are global typography tokens so tables, forms, menus and portal controls remain consistent.
- Desktop/mobile navigation and dashboard pickers share one unique-destination menu; display groups are separate from stable legacy permission modules so regrouping cannot change access. Saved shortcut labels resolve to destination IDs to survive renames.
- App browser reads and bearer middleware use the app-owned client with a session/persistent storage adapter; generated integrations remain untouched, and only persistent logins use the preview broker.
- Password resets for other accounts run through an authenticated server function that verifies the caller's database admin role before loading the privileged client; self-changes still require the current password.

- Member photos/ID docs live in Cloudflare R2 bucket somiti-member-docs; server functions in src/lib/r2.functions.ts mint SigV4 presigned PUT/GET URLs (keys R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET), members.photo_path/id_doc_path store object keys.
- List pages filter dates via shared DateFilter/useDateRange/inRange from src/components/kit.tsx.
- CenterProvider scopes member-related views through useCenterRows while the cached row queries stay unfiltered; changing center remounts entry forms to discard stale member selections.
- Shared MemberForm handles create/edit document uploads; blank member numbers are allocated atomically by a database trigger to prevent duplicate numbering.
- Financial corrections use authorized database RPCs and append-only ledger revisions read through an effective view; originals remain unchanged and all financial writes share an advisory lock.
- Login storage selection reads durable Remember Me preferences to survive installed-app restarts; public entry pages route restored sessions to the dashboard.
- Firebase migration: data mirrored to Firestore (src/lib/firebase.functions.ts, admin-only full copy/compare in Settings, members mirrored on save); app still reads the primary database until cutover.
- App session tokens last one year and are renewed on each app open via renewSession, so remembered devices stay signed in until explicit logout.
- Menu sections carry a permission key; visibleSections/canOpen drive menu, dashboard and the route guard, and data.functions maps every table to a section so the server rejects writes outside granted sections. /users, /settings, /import are admin-only; /requests is a staff→admin→CTO workflow (requests.functions.ts); the hidden "cto" role only opens /requests, reads no somiti data and is filtered out of user_roles listings.
- Language is a client-side bn/en toggle (src/lib/i18n.tsx, `t(bn,en)`); menu items carry their own English label.
- All static interface copy uses the shared UI glossary or explicit bilingual text; language-aware formatters cover numbers/dates. User-entered names, notes and stored values remain unchanged when switching language.
