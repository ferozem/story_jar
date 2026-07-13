# Parking Lot — deferred work

Things we deliberately postponed, with enough context to pick them up cold. Each entry:
**what** it is, **why** it's parked, **when** to pick it up, **how** to do it.

Add new items as they come up. Nothing here is a bug — it's all "later, on purpose."

---

## 1. Production CDN URL (move off the `r2.dev` dev URL)

**What:** The app currently fetches all content from Cloudflare's `r2.dev` public URL
(`https://pub-587bccbdc4a148729534cd6d7477816c.r2.dev/`). That's Cloudflare's **dev/testing**
URL — it's rate-limited and not meant for production traffic. Production should serve from a
**custom domain** attached to the R2 bucket, which also gets Cloudflare's edge CDN caching.

**Why parked:** The URL is only used *inside* the app (users never see it), so it's fine for
MVP / soft launch. The only real risk is rate-limiting as traffic grows — not a launch blocker.

**Pick up when:** you start scaling real users, OR you already buy a domain for the app's
website/landing (then it's free to add a subdomain).

**Cost:** attaching the domain + CDN caching is **free**; you only pay for the domain
(~$10–12/yr, cheapest at-cost via **Cloudflare Registrar**). If you already own a domain,
a subdomain like `cdn.<yourapp>.com` costs nothing extra.

**How (≈5 min, fully reversible, no content re-upload):**
1. Buy/connect a domain in Cloudflare, then bucket → **Settings → Custom Domains** → add
   `cdn.<yourdomain>` and let it provision.
2. Edit `.env`: set `CDN_BASE_URL=https://cdn.<yourdomain>/` (keep the trailing slash).
3. `node scripts/build-manifest.mjs` — regenerates the manifest with the new base URL.
4. Re-upload **only the manifest** (few KB; the 368 asset files stay put in the same bucket).
   A quick way: `node scripts/publish.mjs <any-single-story-id>` re-uploads that one story's
   assets + the refreshed manifest — or upload `manifest.json` directly.
5. Commit the regenerated `src/data/manifest.bundled.json`.

---

## 2. Bundled starter media (offline on first launch)

**What:** Ship ~5 stories' covers/audio *inside* the app so a brand-new install works fully
offline before it ever reaches R2.

**Why parked:** The bundled `manifest.bundled.json` already renders the catalog offline on
first launch; only asset *images/audio* need network the first time. Good enough for v1.

**Pick up when:** app-store review flags a blank-on-airplane-mode first launch, or you want a
richer offline first-run.

**How:** pick a starter set, keep their asset files bundled + `require()`d, and have the
resolver prefer the bundled asset when present. (`ponytail:` in the migration plan.)

---

## 3. Incremental / changed-only upload

**What:** `scripts/publish.mjs` re-uploads every referenced asset on a full run.

**Why parked:** R2 PUTs are idempotent and cheap; ~368 files one-time, and per-story publishes
(`publish.mjs <id>`) are already tiny. No pain yet.

**Pick up when:** full re-uploads get slow enough to annoy.

**How:** hash each file (or use R2 object metadata / `HeadObject`) and skip unchanged keys.

---

## 4. Accounts + cross-device sync

**What:** User data (favorites, progress, read status) is device-local in AsyncStorage. No
accounts, no login. Same child on a second device starts fresh.

**Why parked:** Explicitly chosen for v1 — avoids the entire auth/backend complexity. Local is
correct until sync is a real requirement.

**Pick up when:** you want a child's progress to follow them across devices, parent dashboards,
or analytics.

**How:** add Supabase or Firebase (auth + a per-user table synced with the local store).
Google/email sign-in lives here too. This is the big one — its own project/plan.

---

## 5. Headless CMS for non-technical authoring

**What:** Publishing today is a script (`publish.mjs`) run by a developer.

**Why parked:** You're the only author and comfortable with JSON + the script. A CMS is pure
overhead until someone non-technical needs to add stories.

**Pick up when:** a non-developer needs to author/publish stories.

**How:** Sanity/Contentful/Strapi feeding the same `manifest.json` shape the app already reads.

---

## 6. Move decorative art (~88 MB) off-bundle

**What:** Category hero art + landing splash still ship inside the binary (they're the fixed
app shell, not per-story content).

**Why parked:** They don't grow when you add stories, so they don't block the "publish without
redeploy" goal. Binary is ~90 MB, well under store limits.

**Pick up when:** binary size becomes a store/download problem.

**How:** same pattern as story assets — move to R2, reference by URL, cache on device.
