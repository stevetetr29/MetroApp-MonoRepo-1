# MetroApp Monorepo

A location-based transit game: ride the metro, check in at stations, complete AI-verified
photo tasks and trivia, collect digital trading cards, and fight for your subway line in
weekly Line Wars.

## Layout

```
apps/
  mobile/     Expo (React Native) client — Expo Router, react-native-maps, expo-camera
  admin/      Next.js 14 admin portal — App Router, Tailwind, Supabase
packages/
  shared/     Shared TypeScript interfaces consumed by both apps
supabase/
  functions/  Deno Edge Functions (verify-task → Google Gemini vision)
  migrations/ SQL schema (PostGIS enabled)
```

## Quick start

```bash
npm install
npm run build          # typecheck shared + mobile, next build admin
npm run dev            # turbo dev (admin on :3000, Expo dev server)
```

Each app can also run standalone: `npm run dev -w apps/admin` or `npm start -w apps/mobile`.

## Environment

Copy `.env.example` to `.env` (admin) / `.env.local` and fill in Supabase keys.
Mobile reads `EXPO_PUBLIC_*`, admin reads `NEXT_PUBLIC_*`. Both apps degrade
gracefully to local data when Supabase is not configured.

## Backend deployment (manual)

```bash
supabase link --project-ref <ref>
supabase db push                                   # applies migrations/
supabase secrets set GEMINI_API_KEY=<key>
supabase functions deploy verify-task
```

## Vercel (admin)

Create a Vercel project with **Root Directory = `apps/admin`** and set
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The default
`next build` output deploys cleanly.
