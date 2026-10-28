# Roadmap (SomityPro clone)

## Navigation speed and readability
- [x] Add Remember Me and administrator-assisted password recovery
- [x] Group existing menu options under work-based section headings
- [x] Preload menu pages and shared data after sign-in without blocking clicks
- [x] Increase interface font sizes and verify menu navigation

## Typography and motion
- [x] Apply uploaded Unicode Sutonny font throughout
- [x] Add subtle page and control transitions without delaying interaction

## Phase 1 — done
- [x] Mobile login, dashboard, centers, members (+ledger), savings, loans (disburse/collect/schedule/due/overdue/close), DPS, FDR, fees, cash in/out, reports, settings

## Phase 2 — implemented; sending service pending
- [x] Phone: immediate menu feedback, cached repeat reads, accessible drawer, narrow-screen tables and tabs
- [x] Share management (classes, buy, withdraw, dividend, holders)
- [x] Investment/project management (budget, status, investment/return/profit/expense ledger)
- [x] Insurance / security fund (deposit, atomic loan waiver, P/L)
- [x] Bank accounts, transactions and atomic transfers
- [x] Staff: list, designations, admin-created login, phase-two module permissions, attendance, ID card, salary report
- [x] Bulk member import (Excel), atomic bulk savings/loan/DPS collection, daily collection sheet
- [x] SMS / email recipient selection, drafts and export
- [ ] SMS / email delivery — blocked: sending-service account and credentials required
- [x] Rules & policy page, printable receipts

## Open tasks
- [x] Remember Me survives installed-app restarts and skips the login page
- [x] Photo/NID selection inside member creation and editing
- [x] Pencil editing on saved entries, including safe financial corrections
- [x] Date filters on all list pages
- [x] Member photo/ID upload to Cloudflare R2 (any format)
- [x] Collapsible menu sections on desktop and phone
- [x] Center-based member selection and list filtering across entry pages
- [x] Replace Lovable favicon with somiti icon
- [x] Explain Firebase free-tier and Lovable Free database hosting options without migrating
- [x] Firebase: copy + compare page in Settings, members mirrored on save
- [ ] Firebase: move logins and switch every page to read/save in Firebase (section by section)
- [x] Dashboard quick search, favorites, insight charts

## Current batch
- [x] Quick Actions "Add" picker on dashboard
- [x] Bangla/English (menus, dashboard, staff, attendance, users; other pages still Bangla) language switch
- [x] Staff page UI cleanup; separate attendance page
- [x] User Management (admin-only) with per-section permissions; users see only allowed menus
- [x] Changes needed: staff→admin→CTO workflow, hidden CTO role
- [ ] CTO announcement banner: popup shown for the next N logins per user, closes only via ×
- [ ] Reset all somiti data to zero (keep logins/settings)
- [ ] Activity log: every change by every user with time (admin/CTO view)
