# Kanyo

Kanyo is a bilingual skincare companion that helps people build an evolving **skin profile**, explore transparent product information and keep a product journal.

> Kanyo provides cosmetic guidance, not medical diagnosis. Persistent, painful or severe skin symptoms should be assessed by a qualified healthcare professional.

## Applications

- `/` — Next.js front-end, deployed on Vercel.
- `/apps/api` — Fastify API, deployable on Railway.
- `/supabase` — Supabase configuration and database migrations.

## Local development

1. Copy `.env.example` to `.env.local` and set the public Supabase and API values.
2. Install dependencies with `pnpm install`.
3. Run `pnpm dev` for the front-end.
4. In a second terminal, run `cd apps/api && pnpm install && pnpm dev` for the API.

The interface is intentionally usable without configuration for product discovery and the assessment preview. Once Supabase credentials are set, assessment, profile, notes and reviews are persisted through the secured database schema.

## Deployment

- Import the repository into Vercel with the repository root as the project root. The `build` command is `pnpm build`.
- Create a Railway service with `apps/api` as the root directory. Railway will use `railway.toml` and expose `/health`.
- Set `NEXT_PUBLIC_API_URL` on Vercel to the Railway service URL.
- Set `WEB_ORIGIN` on Railway to the Vercel production URL.
- Apply the migration in `supabase/migrations` to the selected Supabase project, then add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel.

Never put Supabase `service_role` credentials in Vercel public environment variables or browser code.

