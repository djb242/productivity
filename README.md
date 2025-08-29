# Productivity App (React + Vite)

This app can persist data to Supabase. By default it uses a dedicated Postgres schema named `productivity` so your app tables stay isolated from other projects.

## Supabase Setup

- Required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Optional: `VITE_SUPABASE_SCHEMA` (defaults to `productivity`).

1) Expose the schema to the API
- In Supabase Studio: Database → API → REST → Exposed schemas → add `productivity`.

2) Create the schema and tables
- Open Supabase Studio → SQL editor
- Paste and run the contents of `supabase/schema.sql`
  - This script creates the `productivity` schema (if missing), sets the search path, and creates all tables and indexes used by the app.

3) Configure environment variables
- Copy `.env.example` to `.env.local` and fill in your project values:
  - `VITE_SUPABASE_URL=...`
  - `VITE_SUPABASE_ANON_KEY=...`
  - `VITE_SUPABASE_SCHEMA=productivity` (optional; this is the default)

4) Run the app
- `npm install`
- `npm run dev`

Notes
- The client is created with `createClient(url, key, { db: { schema } })`. If you prefer using the `public` schema instead, set `VITE_SUPABASE_SCHEMA=public`.
- Row Level Security is not enabled by default in `schema.sql`. If you enable Auth and RLS, add `owner_id` columns and policies accordingly.
