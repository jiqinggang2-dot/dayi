# Bootstrap the First CEO

After running `schema.sql`, create the first CEO through the protected bootstrap API.

Set these environment variables in Vercel first:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BOOTSTRAP_SECRET`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then call:

```bash
curl -X POST "https://YOUR-VERCEL-DOMAIN/api/admin/bootstrap" \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-secret: YOUR_BOOTSTRAP_SECRET" \
  -d "{\"email\":\"ceo@yourcompany.com\",\"password\":\"CHANGE_THIS_PASSWORD\",\"full_name\":\"CEO\"}"
```

The route refuses to create a CEO if a super-admin account already exists.

Important: in Supabase Auth settings, disable public sign-ups. Even if public sign-up remains enabled by mistake, RLS denies access to users who do not have a matching active `app_users` profile.
