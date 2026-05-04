# Mployee — variable pay & work log

Production-oriented internal tool: employees submit rack counts with **camera-only** before/after photos; admins review, track trends, tune pay rules, and export **CSV / PDF** reports. Built for **Next.js (App Router)** on **Vercel** with **Supabase** (Postgres + Auth + Storage).

## Features

- **Employee app (`/`)** — mobile-first form: employee ID, name, date, rack count, optional work type, live camera capture for before/after (no gallery uploads), timestamps burned into JPEGs, server `submitted_at` on POST.
- **Admin (`/admin`)** — email/password auth; dashboard grouped by employee with signed image URLs; filters (employee, date range, bonus tier); daily rack trend bars; configurable pay rules; CSV (includes 24h signed URLs) and PDF exports.
- **Pay engine** — per submission: if `rack_count >= bonus_threshold_racks`, `bonus_pay_per_rack` applies to the whole row; otherwise `normal_pay_per_rack`. Editable under **Pay rules**.

## Prerequisites

- [Supabase](https://supabase.com/) project (free tier is enough to start).
- [Vercel](https://vercel.com/) account.
- Node 20+ recommended.

## 1. Supabase setup

1. Create a project. In **SQL Editor**, run everything in `supabase/schema.sql`.
2. **Storage → New bucket**  
   - Name: `submission-images`  
   - **Private** bucket.  
   - The SQL file inserts the bucket row if missing; confirm it exists.
3. **Authentication → Providers → Email** — enable email/password (default).
4. Create your first admin user under **Authentication → Users → Add user** (set email + password).
5. Promote that user in SQL:

```sql
update public.profiles
set is_admin = true
where email = 'you@company.com';
```

6. Copy **Project URL** and **anon** + **service_role** keys from **Project Settings → API** (service role is **server-only** — use in Vercel env, never in client code).

## 2. Local environment

```bash
cd "d:\best code vibe coding\MPLOYEE VARIABLE PAY TRACKING APP cursor"
npm install
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

Open `http://localhost:3000` for the employee form and `/admin/login` for the dashboard.

## 3. Deploy to Vercel

1. Push the repo to GitHub/GitLab/Bitbucket (or use Vercel CLI `vercel link`).
2. In Vercel → **New Project** → import the repo.
3. **Environment variables** (Production + Preview):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key (secret) |

4. **Deploy**. Build command: `npm run build`, output: Next.js default.

### Limits & operations notes

- **Vercel** serverless request bodies are limited (~4.5MB on Hobby). Images are **compressed client-side** before upload; if uploads fail, capture again or reduce resolution in `lib/image.ts`.
- **Rate limiting / abuse**: the public `/api/submit` endpoint is suitable for trusted internal networks. For public internet, add Cloudflare, Supabase Edge rate limits, or a shared secret header — not included here by default.

## Project layout

- `app/` — routes: employee home, admin panel, API routes.
- `components/` — `CameraCapture`, employee form, admin UI.
- `lib/` — Supabase clients, pay math, reporting helpers, validation.
- `supabase/schema.sql` — tables, RLS, storage policies, seed pay row.

## Google Form parity

The reference form required Google sign-in, so fields could not be scraped automatically. This app matches the described workflow (ID, name, date, racks, work type, before/after photos, submission metadata) and extends it with admin automation, storage, and reporting.

## Security checklist

- Never commit `.env.local` or the service role key.
- Only users with `profiles.is_admin = true` can read submissions / pay config or call admin report APIs (enforced in RLS + route checks).
- Submissions are written **only** via `/api/submit` using the service role (employees never get direct table write access).
