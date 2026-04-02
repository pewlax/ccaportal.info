# CC Accelerator

**Content Agency Command Center**

## Setup

```bash
npm install
npm run dev
```

## Supabase Setup (for real persistence across devices)

1. Create a free project at [supabase.com](https://supabase.com)
2. Run `supabase-setup.sql` in the SQL Editor
3. Add env vars in Netlify: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Redeploy

Without Supabase, the app uses localStorage (browser-only persistence).

## Deploy

Push to GitHub → Import in Netlify → Auto-deploys from `netlify.toml`.
