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
- Desktop and mobile navigation share one sectioned menu definition, flattened for preloading, so grouping cannot drop or duplicate preload destinations.
- App browser reads and bearer middleware use the app-owned client with a session/persistent storage adapter; generated integrations remain untouched, and only persistent logins use the preview broker.
- Password resets for other accounts run through an authenticated server function that verifies the caller's database admin role before loading the privileged client; self-changes still require the current password.
