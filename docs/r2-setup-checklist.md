# Cloudflare R2 Setup Checklist (do these once)

These steps need your identity and a credit card, so they are yours to do in a browser.
Usage stays inside the free tier (10 GB storage, unlimited egress); the card is Cloudflare's
anti-abuse gate, not a charge.

1. Create a Cloudflare account at https://dash.cloudflare.com/sign-up and verify your email.
2. In the dashboard sidebar, click **R2**. Click **Enable R2** and add a credit card when prompted.
3. Click **Create bucket**. Name it `story-time-content`. Region: **Automatic**. Create.
4. Create an API token: **R2 → Manage R2 API Tokens → Create API Token**.
   - Permissions: **Object Read & Write**.
   - Scope it to the `story-time-content` bucket.
   - Create, then copy the **Access Key ID**, **Secret Access Key**, and the
     **S3 API endpoint** (looks like `https://<accountid>.r2.cloudflarestorage.com`).
5. Paste those values into a new file `.env` in the project root (copy `.env.example`):
   - `R2_ENDPOINT` = the S3 API endpoint from step 4
   - `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` = the token values from step 4
   - `R2_BUCKET` = `story-time-content`
   - `CDN_BASE_URL` = see step 6
6. Public URL for assets (`CDN_BASE_URL`, must end with `/`):
   - **Dev:** enable the **R2.dev subdomain** (bucket → Settings → Public access) and use that
     URL, e.g. `https://pub-xxxx.r2.dev/`. Rate-limited; testing only.
   - **Prod:** attach a **Custom Domain** (bucket → Settings → Custom Domains), e.g.
     `https://cdn.yourstoryapp.com/`. Gets free Cloudflare CDN caching.

Note: the repo keeps `assets/stories/` and `assets/audio/` as the source of truth for
re-uploads. After the migration they are simply no longer imported by Metro, so they no
longer inflate the app binary.

When `.env` has all five values, tell the agent and we run the bulk upload together.
