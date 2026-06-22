# Email Overview Deployment

The exam overview is sent by the `send-exam-overview` Supabase Edge Function. It cannot be sent from the Vite frontend because mail-provider secrets must never be exposed in browser code.

## Prerequisites

1. Create a Resend account and verify a sending domain.
2. Create a Resend API key with send-email permission.
3. Authenticate the Supabase CLI with `npx supabase login`.

## Deploy

From the project root, run:

```powershell
npx supabase link --project-ref bmfhqufnvfamswcmctpl
npx supabase secrets set RESEND_API_KEY=your_resend_api_key
npx supabase secrets set OVERVIEW_FROM_EMAIL="PL-300 Practice Arena <no-reply@your-verified-domain.com>"
npx supabase functions deploy send-exam-overview
```

After deployment, complete an exam. The Analytics page will confirm that the overview was sent. If a send fails, check the Edge Function logs in Supabase and the Resend dashboard.

## Security

- Store `RESEND_API_KEY` only as a Supabase Edge Function secret.
- Never add it to `.env`, Amplify variables, or browser code.
- `VITE_SUPABASE_PUBLISHABLE_KEY` is the only Supabase key allowed in the frontend.
