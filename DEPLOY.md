# Deploy Baazar Retail to Vercel

## 1. Prerequisites

- GitHub/GitLab/Bitbucket repo with this project
- Supabase project ready (`schema.sql` applied, bucket `VRF` created)
- Vercel account

## 2. Environment variables (required)

In **Vercel → Project → Settings → Environment Variables**, add for
**Production**, **Preview**, and **Development**:

| Name                                  | Value                                        |
| ------------------------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`            | `https://vwgylcpejojurdpukidx.supabase.co`   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | your anon key from Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | `VRF`                                        |

Do **not** commit `.env.local`.

## 3. Deploy

### Option A — Vercel Dashboard

1. [vercel.com/new](https://vercel.com/new) → Import your repo
2. Framework: **Next.js** (auto-detected)
3. Root directory: project root (where `package.json` is)
4. Add the env vars above
5. Deploy

### Option B — CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET
vercel --prod
```

## 4. After deploy

1. Supabase → Authentication → URL Configuration
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`
2. Confirm `vendors` table exists (run `supabase/schema.sql` if not)
3. Confirm Storage bucket `VRF` + policies allow uploads

## 5. Local verify before push

```bash
npm install
npm run build
npm run start
```
