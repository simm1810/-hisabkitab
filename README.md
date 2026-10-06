# 🧳 HisabKitab — Smart Group Trip Expense Manager

Split trip expenses with friends the smart way. Create a trip, share a join
code, add expenses on the go, and let HisabKitab tell everyone exactly who
owes whom — with the minimum number of payments needed to settle up.

Built with **React + Tailwind CSS + Supabase + Zustand + Framer Motion**.

---

## ✨ Features

- **Auth** — Google OAuth + Email/Password (Supabase Auth)
- **Dashboard** — "My Trips" list with search, create trip FAB
- **Create Trip** — admin flow, auto-generated 6-char join code (e.g. `GOA123`) + shareable link
- **Join Trip** — `/join/:code` public preview page, join after login, WhatsApp share
- **Members** — avatars, admin crown 👑, admin can remove members
- **Expenses** — add with description, amount, payer, category, date, bill photo (Supabase Storage)
- **Balances (the brain)** — total spent, per-person share, individual balances, and a
  **greedy minimal-transaction settlement algorithm** ("Rahul pays Amit ₹500") with a
  one-tap "Settle Up"
- **AI Nearby Explorer** — Gemini-powered suggestions (places / cheap eats / petrol / ATMs)
  called via a Supabase Edge Function so the AI key never touches the browser
- **Realtime** — expenses/members/settlements sync live across everyone's phones
- **PWA** — installable, mobile-first, safe-area aware
- **Design** — Deep Teal `#0f766e` + warm cream + saffron orange, Lucide icons, Framer Motion

---

## 🗂 Project Structure

```
hisabkitab/
├── public/                     # PWA icons, manifest, favicon
├── src/
│   ├── components/
│   │   ├── tabs/                # ExpensesTab, BalancesTab, MembersTab
│   │   ├── Avatar.jsx
│   │   ├── AddExpenseModal.jsx
│   │   ├── NearbyExplorerModal.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── SplashScreen.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── CreateTrip.jsx
│   │   ├── JoinTrip.jsx
│   │   └── TripDetail.jsx
│   ├── store/                   # Zustand: useAuthStore, useTripStore
│   ├── lib/supabase.js
│   ├── utils/settlement.js      # 🧠 the core split/settle algorithm
│   ├── utils/categories.js
│   ├── App.jsx / main.jsx / index.css
├── supabase/
│   ├── schema.sql                # full DB schema + RLS policies + triggers
│   └── functions/nearby-explorer/index.ts   # AI edge function
├── .env.example
├── package.json / vite.config.js / tailwind.config.js
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Create a Supabase project
Go to [supabase.com](https://supabase.com) → New Project.

### 3. Run the database schema
Open **SQL Editor** in your Supabase dashboard, paste the contents of
`supabase/schema.sql`, and run it. This creates all tables (`profiles`,
`trips`, `trip_members`, `expenses`, `settlements`), Row Level Security
policies, the `receipts` storage bucket, realtime publications, and helper
functions.

### 4. Enable Auth providers
In **Authentication → Providers**:
- Enable **Email** (default)
- Enable **Google** — add your OAuth Client ID/Secret from Google Cloud Console,
  and set the redirect URL shown by Supabase into your Google OAuth config.

### 5. Configure environment variables
```bash
cp .env.example .env
```
Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from
**Project Settings → API**. Older Supabase projects may show an anon public key;
that also works if you put it in `VITE_SUPABASE_ANON_KEY`.

### 6. Deploy the AI Edge Function (optional but recommended)
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy nearby-explorer
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
```
Get a free Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
The "AI Suggest Near Me" button will show a friendly error until this is deployed.

### 7. Run locally
```bash
npm run dev
```
Visit `http://localhost:5173`.

---

## 📦 Build & Deploy

```bash
npm run build
```
Outputs a static `dist/` folder — deploy it anywhere:

- **Vercel**: `vercel deploy` (framework preset: Vite) — add the two env vars in project settings
- **Netlify**: drag-and-drop `dist/`, or `netlify deploy --prod`, set env vars in site settings
- **Cloudflare Pages**: connect repo, build command `npm run build`, output `dist`

Remember to set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as
environment variables on whichever host you use. If your project uses the older
anon public key, set `VITE_SUPABASE_ANON_KEY` instead. These are baked in at
build time.

Also add your production domain to **Supabase → Authentication → URL
Configuration → Redirect URLs** so Google OAuth works there too.

---

## 🧠 How the Settlement Algorithm Works

See `src/utils/settlement.js` — fully commented and pure (no side effects):

1. **`computeEqualShares`** — splits the total spend evenly across members in
   whole paise, distributing the leftover 1-2 paise of rounding to the first
   few members so shares always sum *exactly* to the total (no floating-point
   drift).
2. **`computeBalances`** — for each member: `balance = amountPaid − fairShare`.
   Positive = they're owed money, negative = they owe money.
3. **`computeSettlementPlan`** — the classic **greedy debt-simplification
   algorithm**: sort creditors and debtors by amount descending, repeatedly
   match the largest creditor with the largest debtor, settle the smaller of
   the two amounts, and repeat. This minimizes the number of transactions
   needed to clear all debts (the same approach used by Splitwise-style apps).

All money math happens in integer paise internally and is converted back to
rupees only for display, so totals are always penny-perfect.

---

## 🗄 Database Schema (summary)

| Table | Purpose |
|---|---|
| `profiles` | Public user info, auto-created via trigger on signup |
| `trips` | Trip details, `join_code` (unique), `invite_link` |
| `trip_members` | Join table, `role` = `admin` \| `member` |
| `expenses` | Who paid what, category, date, optional receipt |
| `settlements` | Log of "Settle Up" actions between two members |

Row Level Security ensures a user can only read/write data for trips they're
a member of; only the trip admin can update/delete the trip or remove members.

---

## 🔒 Notes on the AI Feature

The Gemini API key is **never** shipped to the browser. The React app calls
`supabase.functions.invoke('nearby-explorer', { body: { destination, mode } })`,
and the Edge Function (running server-side on Supabase's infrastructure) is
the only place that holds the key. Swap in OpenAI or any other model by
editing `supabase/functions/nearby-explorer/index.ts`.

---

## 🛠 Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Routing | React Router v6 |
| State | Zustand |
| Backend | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) |
| Animation | Framer Motion |
| Icons | Lucide React |
| AI | Google Gemini (via Edge Function) |
| PWA | vite-plugin-pwa |

---

Made with 🧡 for group trips where nobody wants to do maths after a long day.
