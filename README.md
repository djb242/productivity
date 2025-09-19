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
- Includes an `app_state` table used by the Writer’s Dashboard to save JSON state. It stores a single row (id = `singleton`) and does not require user accounts.

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

## Calendars (Google + Outlook via ICS)

- In Planner, expand the Calendars panel and click Add ICS.
- Paste your calendar’s ICS URL.
  - Google Calendar: Settings → Integrate calendar → Secret address in iCal format.
  - Outlook/Microsoft 365: Calendar → Share/Publish → ICS link.
- Toggle and color each source; events render read-only on the timeline.

Notes
- ICS is fetched through a built-in proxy to avoid CORS:
  - Dev: Vite middleware at `/api/proxy-ics`.
  - Cloudflare Pages: Worker route at `/api/proxy-ics`.
- If your org blocks publishing ICS, you may need admin approval.

## OpenAI Prompt API (optional)

- If you use pages that call `/api/prompt` (e.g. Writer tools), deploy the PHP endpoint in `public/api/prompt.php`.
- Set your OpenAI API key on the server via Apache env var (e.g. in `public/.htaccess`):
  - `SetEnv OPENAI_API_KEY "sk-..."`
- Never expose your API key to the client or commit it to source control.
