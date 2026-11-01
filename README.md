<div align="center">

# 🏦 SomityPro

### A complete management platform for savings & loan cooperatives (সমবায় সমিতি)

**Members · Savings · DPS · FDR · Loans · Accounting · Staff · Reports — all in one bilingual app**

[![Live App](https://img.shields.io/badge/🌐_Live_App-somitypro.lovable.app-0d7a5f?style=for-the-badge)](https://somitypro.lovable.app)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start-ff4154?style=for-the-badge)](https://tanstack.com/start)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

[🚀 Live Demo](https://somitypro.lovable.app) · [✨ Features](#-features) · [🛠️ Tech Stack](#️-tech-stack) · [🏗️ Architecture](#️-architecture-highlights)

</div>

---

## 📖 What is SomityPro?

In Bangladesh, thousands of small savings & loan cooperatives — known as **somiti (সমিতি)** — still run their entire operation on paper ledgers: member registers, savings passbooks, loan schedules, cash books. SomityPro replaces all of that with a single, fast, bilingual (বাংলা / English) web application built for **real cooperative workflows**.

It is not a generic dashboard template — every screen mirrors how a somiti actually works: center-based member groups, weekly collection sheets, DPS/FDR schemes, installment loans, and printable receipts with official signatures.

## ✨ Features

<table>
<tr>
<td width="50%">

### 👥 Members & Centers
- Member registry with **photo & NID uploads** (Cloudflare R2)
- Center-based grouping & scoped views
- Bulk import from spreadsheets
- Atomic member-number allocation (no duplicates)

### 💰 Savings & Deposits
- Savings accounts with full transaction history
- **DPS** (monthly deposit schemes) & **FDR** (fixed deposits)
- Immutable, module-tagged ledger — corrections via append-only revisions

### 🏧 Loans & Collection
- Loan issuing & installment schedules
- Due lists & bulk collection entry
- Per-member printable collection statements

</td>
<td width="50%">

### 📊 Accounts & Reports
- Cash book, bank accounts, shares, investments, security funds
- Date-filtered reports across every module
- Printable receipts with **uploaded org logo & signature slots**
- Dashboard with 6+ insight charts & quick search

### 👔 Staff & Administration
- Staff attendance & salary management
- **Role-based access control** — admins define exactly which sections each user can see or edit
- Full **activity log** of every change, per user
- Feature-request workflow: staff → admin → CTO

### 🌐 Experience
- Full **বাংলা / English** language toggle
- Collapsible sidebar, favorites & quick actions
- Remember-me sessions, subtle animations, mobile-friendly

</td>
</tr>
</table>

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TanStack Start (SSR + server functions) |
| **Styling** | Tailwind CSS v4, shadcn/ui, custom Bengali typography (SutonnyOMJ) |
| **Database** | Firebase Firestore |
| **File storage** | Cloudflare R2 (presigned uploads for member documents) |
| **Testing** | Vitest (access control, ledger rules, session logic) |
| **Build** | Vite 7, deployed on the edge |

## 🏗️ Architecture Highlights

- **Immutable financial ledger** — balances are validated by triggers; transfers and bulk collections commit atomically. Corrections never rewrite history.
- **Server-side authorization** — every write is checked against the caller's role and section permissions on the server, not just hidden in the UI.
- **Hidden CTO role** — a technical oversight account that can broadcast announcement banners (with per-user view tracking) and review feature requests, without touching somiti data.
- **Bilingual by design** — all interface copy is translated; user-entered data (names, notes) is never altered when switching languages.
- **Performance** — signed-in navigation preloads route chunks and shared queries through a bounded, cancellable background queue.

## 🚀 Local Development

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

> Environment secrets (Firebase service account, R2 keys) are stored in the deployment platform's secret store — none are committed to this repository.

## 👤 Author

**Rajdeep Sarker** — designed and built for **সোনালী সঞ্চয় ও ঋণদান সমবায় সমিতি লিমিটেড**, a real savings & loan cooperative serving ~1,300 members.

Built with [Lovable](https://lovable.dev) — every change syncs straight to this repository.

---

<div align="center">
<sub>If this project helps your cooperative, consider giving it a ⭐ — it helps others find it.</sub>
</div>
