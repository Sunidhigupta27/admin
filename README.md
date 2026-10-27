# Influencer Platform — website + admin (two sites, one database)

```
influencer-platform/
├── website/         Public site: homepage, creator sign-up/login, enrol, pending, creator dashboard
├── admin/           Admin panel only: /login (admins only) and the panel at /
├── firestore.rules  Shared Firestore rules (publish once in the Firebase console)
└── docs/            Data model
```

Both apps use the **same Firebase project** (same `NEXT_PUBLIC_FIREBASE_*` keys),
so they read and write the **same Firestore database** — an ad posted in admin shows up
for creators on the website, and creators submitted on the website appear in admin Approvals.

## Run locally

```bash
cd website && npm install && npm run dev     # http://localhost:3000
cd admin   && npm install && npm run dev     # http://localhost:3001
```

Each folder has its own `.env.local` (already filled with your Firebase keys) and an
`.env.example` showing every variable.

## Deploy on Vercel (two projects from the same GitHub repo)

1. Push this whole folder to GitHub.
2. **Website project:** Vercel → Add New → Project → pick the repo →
   **Root Directory = `website`** → Framework: Next.js.
   Environment variables: the six `NEXT_PUBLIC_FIREBASE_*` keys, plus
   `NEXT_PUBLIC_ADMIN_URL` = the admin site address (add after step 3, then redeploy).
3. **Admin project:** Add New → Project → same repo → **Root Directory = `admin`**.
   Environment variables: the same six `NEXT_PUBLIC_FIREBASE_*` keys, plus
   `NEXT_PUBLIC_WEBSITE_URL` = the website address.
4. **Firebase console → Authentication → Settings → Authorized domains:** add **both**
   Vercel domains (e.g. `your-site.vercel.app` and `your-admin.vercel.app`), otherwise
   login and SMS codes fail on that domain.
5. If a Vercel page asks you to "Log in to Vercel" before showing the site, that is
   Vercel's own Deployment Protection, not this app: Project → Settings →
   Deployment Protection → turn off Vercel Authentication (or open the production domain).

## How the two sites behave

| Site | URL | What happens |
|---|---|---|
| website | `/` | Homepage (always public) |
| website | `/auth`, `/verify-*`, `/enrol`, `/pending`, `/creator` | Creator flow, unchanged |
| website | `/admin` | Forwards to `NEXT_PUBLIC_ADMIN_URL` (if an admin logs in on the website they land here and are sent across) |
| admin | `/login` | Email + password (+ SMS code if the admin has 2-step on). Non-admin accounts are refused and signed out |
| admin | `/` | Admin panel (Approvals, Dashboard, Creators, Ads & Videos, Social Accounts, Settings) |

Logins are per-site (browsers keep Firebase sessions per domain), so an admin logs in
separately on the admin site. Making someone an admin is unchanged: Firestore → `users` →
their document → `role = "admin"`.

## Shared code

`lib/config.js`, `lib/firebase.js`, `lib/ads.js`, `lib/mfa.js`, `lib/motion.js`,
`components/creator/AdTile.jsx` / `AdDetail.jsx` and `app/globals.css` exist in both folders.
If you change tiers, follower ranges, ad formats or the app name in `lib/config.js`,
make the same change in the other folder.
