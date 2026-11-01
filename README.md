# SomityPro — সমবায় সমিতি ব্যবস্থাপনা সিস্টেম

A Bengali-first savings & loan cooperative (somiti) management web app — dashboard, members, savings, DPS, FDR, loans, collection, funds, banking, staff attendance & salary, reports, receipts, and role-based administration.

**Live app**: https://somitypro.lovable.app

Built with [Lovable](https://lovable.dev). Continue developing in the [Lovable editor](https://lovable.dev/projects/d534ca7c-5bf9-4eb9-9039-e8d08b881e6b).

## Features

- **Dashboard** — module quick-search, favorites, custom quick actions, and multiple insight charts
- **Members & Centers** — member registry with photo/NID uploads, center-based views, bulk import
- **Savings & Deposits** — savings accounts, DPS, FDR with immutable ledger entries
- **Loans & Collection** — loan issuing, installment collection, due lists, bulk collection
- **Accounts & Funds** — cash, bank accounts, shares, investments, security funds (module-tagged ledger)
- **Reports & Receipts** — date-filtered reports, printable statements with signature slots and logo
- **Staff & Attendance** — staff attendance and salary management
- **Administration** — role-based access (permissions per feature section), activity log, change requests (staff → admin → CTO), announcement banners, system settings

## Technology

- React 19 + TanStack Start (SSR + server functions)
- Tailwind CSS v4, Bengali/English language toggle
- Firebase Firestore for app data, Cloudflare R2 for member documents

## Local Development

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Build with Lovable

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.
