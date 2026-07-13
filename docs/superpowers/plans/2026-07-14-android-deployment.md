# Android (Google Play) Deployment Plan

> **For agentic workers:** operational plan — mix of local config changes (agent) and account/console actions (user). Steps use checkbox (`- [ ]`) syntax. This is NOT a TDD plan; verification is "the build succeeds / the app installs / the listing passes review."

**Goal:** Ship Story Jar to the Google Play Store as a production release, built in the cloud with EAS (no Mac, no Android Studio needed).

**Approach:** Configure the app for a store build (bundle id, display name, versioning), set up EAS build profiles, produce a testable APK then a production AAB, prepare the required store listing + privacy policy + data-safety/content-rating forms (simplified because the app collects no user data), and release through Play's internal-testing track before public production.

**Decisions locked:** Android/Google Play first (iOS later). No developer accounts yet. Expo used only for local Expo Go so far.

**Key facts (verified):** `app.json` name `story_time`, slug `story_time`, version `1.0.0`, **no** `android.package` (required — blocks any build). Android adaptive-icon assets exist (`assets/images/android-icon-*`, `splash-icon.png`, `icon.png`). No `eas.json`, `eas-cli` not installed. App collects **no** user data, has **no** accounts/login (simplifies Data Safety + kids compliance). Content is fetched from Cloudflare R2 at runtime.

**Chosen identifiers (change here if you dislike them):**
- Android package: `com.ferozem.storyjar`
- Store display name: `Story Jar`
- These are permanent once published — the package name especially **can never change** after first upload.

---

## Who does what

- **Agent (me):** all local file/config changes, EAS config, kicking off builds, drafting the privacy policy + store copy.
- **You:** anything needing your identity, money, or a phone — creating the Google Play account ($25), verifying identity, tapping through Play Console forms, taking screenshots, final "publish". I guide each one click-by-click like we did for Cloudflare.

---

## PHASE 0 — Accounts & tooling

### Task 0.1: Install EAS CLI + log in (agent + you)
- [ ] **Install the CLI:** `npm install -g eas-cli`
- [ ] **Log in / create an Expo account:** run `eas login`. If you don't have an Expo account, create one at https://expo.dev/signup first (free), then `eas login`. (The Expo Go account you used may already work — try logging in.)
- [ ] **Verify:** `eas whoami` prints your Expo username.

### Task 0.2: Create the Google Play Console account (you — ~$25, one-time)
- [ ] Go to https://play.google.com/console/signup
- [ ] Choose account type **Personal** (or Organization if you have a business). Personal is fine to start.
- [ ] Pay the **one-time $25** registration fee.
- [ ] Complete **identity verification** (Google now requires ID + address for new personal developer accounts — this can take a day or two to approve). **Start this early** — it's the slowest gate in the whole plan.
- [ ] **Confirm to me when the account is active** (you can reach the Play Console dashboard).

> While verification is pending, Phases 1–3 (all local config, build, and asset prep) proceed in parallel — nothing here blocks on the Play account until Phase 4.

---

## PHASE 1 — App configuration (make it buildable) — agent

### Task 1.1: Add required identifiers + polish display name
**File:** `app.json`

- [ ] Under `expo`, set the store display name:
  - change `"name": "story_time"` → `"name": "Story Jar"`
  - (leave `"slug": "story_time"` as-is — the slug is the internal Expo project id, not user-facing.)
- [ ] Under `expo.android`, add the package:
  ```json
  "android": {
    "package": "com.ferozem.storyjar",
    ...existing adaptiveIcon / predictiveBackGestureEnabled...
  }
  ```
- [ ] Confirm `expo.version` is `"1.0.0"` (the user-facing version string — fine for first release).

### Task 1.2: Let EAS manage the Android version code
**File:** `app.json` (or handled in `eas.json` in Phase 2)

- [ ] We will NOT hardcode `android.versionCode`. Instead we set `"autoIncrement": true` on the production build profile in `eas.json` (Task 2.1), so every production build bumps the integer versionCode Play requires. Nothing to add in `app.json` for this.

### Task 1.3: Sanity-check the config builds
- [ ] Run `npx expo config --type public` and confirm it prints without error and shows `android.package: com.ferozem.storyjar` and `name: Story Jar`.
- [ ] Commit: `git add app.json && git commit -m "chore: set Android package + store display name for Play release"`

---

## PHASE 2 — EAS build setup + test build — agent (you install the APK)

### Task 2.1: Configure EAS build profiles
**File:** `eas.json` (created by the next command, then edited)

- [ ] Run `eas build:configure` → choose **Android** when prompted. This creates `eas.json` and links/creates an EAS project (adds `expo.extra.eas.projectId` to `app.json` — that's expected, commit it).
- [ ] Edit `eas.json` to these profiles (APK for easy sideload testing, AAB for the store):
  ```json
  {
    "cli": { "version": ">= 12.0.0" },
    "build": {
      "preview": {
        "android": { "buildType": "apk" },
        "distribution": "internal"
      },
      "production": {
        "android": { "buildType": "app-bundle" },
        "autoIncrement": true
      }
    },
    "submit": { "production": {} }
  }
  ```
- [ ] Commit: `git add eas.json app.json && git commit -m "chore: add EAS build profiles (preview apk + production aab)"`

### Task 2.2: Build a testable APK and smoke-test on your phone
- [ ] Run `eas build -p android --profile preview`.
  - First run asks to **generate a new Android Keystore** — say **yes** (EAS stores and manages the signing key for you; do not lose it — Play requires the same signing identity forever).
  - The build runs in Expo's cloud (~10–20 min). It prints a URL and, when done, a link to download the `.apk`.
- [ ] **You:** open that `.apk` link on your Android phone, download, and install (you may need to allow "install from unknown sources" for your browser). Open the app.
- [ ] **Smoke test on the real installed build (not Expo Go):** library loads, a cover shows (R2), open a story, audio plays. This is the first time you're running the *actual production-style binary*.
- [ ] If it works, continue. If something breaks that didn't break in Expo Go, tell me — native-only issues surface here.

### Task 2.3: Build the production AAB
- [ ] Run `eas build -p android --profile production`.
- [ ] This produces the `.aab` (Android App Bundle) that Google Play requires. It'll be downloadable from the build page and is also directly submittable via `eas submit` in Phase 4.

---

## PHASE 3 — Privacy policy + store listing assets — agent drafts, you host/capture

### Task 3.1: Privacy policy (required by Play)
- [ ] I draft `docs/privacy-policy.md` tailored to your app: **no accounts, no personal data collected, no analytics, no ads**; content (images/audio) is fetched from Cloudflare R2 (a CDN) and cached on-device; standard server request logs may include IP at the CDN layer. Written plain enough for parents.
- [ ] **You host it at a public URL** (Play needs a link). Easiest options, pick one:
  - **GitHub Pages** — free; I'll set up a tiny repo/page from the markdown.
  - A single page on your (future) website if you get the domain from the R2 parking-lot item.
  - A free host like a Google Site.
- [ ] Save the final URL — it goes in the Play listing.

### Task 3.2: Store listing copy
- [ ] I draft: **app title** ("Story Jar"), **short description** (≤80 chars), **full description** (≤4000 chars) — emphasizing moral/character stories for kids, offline-friendly, no ads, no data collection.
- [ ] You review/tweak wording.

### Task 3.3: Graphics (you capture, I guide sizes)
Play requires:
- [ ] **App icon** 512×512 PNG — I'll export from your existing `icon.png` if it's high-res enough, else flag it.
- [ ] **Feature graphic** 1024×500 PNG — needs creating (I can generate a simple branded one, or you design it).
- [ ] **Phone screenshots** — min 2, up to 8. You already have the app running: grab shots of the library, a category, a reader page, and story-of-the-day (like the ones you sent me). Send them and I'll confirm they meet Play's size rules.

---

## PHASE 4 — Play Console: create app, forms, submit — you (I guide each screen)

> Starts once your Play account (Task 0.2) is verified/active.

### Task 4.1: Create the app
- [ ] Play Console → **Create app**: name **Story Jar**, default language, type **App**, **Free**, accept declarations.

### Task 4.2: Complete the required "App content" declarations
I'll walk each one; your no-data-collection design makes them short:
- [ ] **Privacy policy:** paste the URL from Task 3.1.
- [ ] **Data safety:** declare **no data collected / no data shared** (true — you have no accounts, analytics, or ads). Note the CDN fetch, which is not personal-data collection by you.
- [ ] **Content rating:** fill the IARC questionnaire (kids storytelling app, no violence/etc.) → expect an "Everyone" rating.
- [ ] **Target audience & content:** select the **children** age bands → this opts you into Google Play's **Families** policy. Confirm the app is designed for children and complies (no ads/data makes this straightforward).
- [ ] **Ads:** declare **No ads**.
- [ ] **Government/financial/health:** No.

### Task 4.3: Upload the build via internal testing first
- [ ] Set up an **Internal testing** release (fastest track, near-instant, up to 100 testers).
- [ ] Upload the AAB — easiest is `eas submit -p android --profile production` (I run it; it needs a Google service-account key OR you can upload the `.aab` file manually in the console the first time). I'll pick the simplest path with you.
- [ ] Add your own email as a tester, install via the internal-testing opt-in link on your phone, confirm the store-delivered build works.

### Task 4.4: Promote to Production
- [ ] Fill the **Production** release: upload/promote the same AAB, add release notes.
- [ ] Complete the **store listing** (Task 3.2 copy + Task 3.3 graphics).
- [ ] Submit for review. First-time reviews for a new developer account + a children's app can take **a few days to ~a week**.
- [ ] On approval → **Publish**. You're live. 🎉

---

## Deferred / not in this plan (see also `docs/parking-lot.md`)

- **iOS / App Store** — separate effort ($99/yr, TestFlight). Add after Android is live.
- **Custom CDN domain** — already parked (item 1 in `docs/parking-lot.md`); the app ships on the `r2.dev` URL for now. Fine for launch-scale traffic.
- **Analytics / crash reporting** — none yet. If you later want crash logs, that's a new decision (and would change the Data Safety declaration).
- **OTA updates (EAS Update)** — pushing JS-only updates without a store review. Nice later; not needed to launch.

---

## Self-review notes
- **Blocking gate identified:** Google Play identity verification (Task 0.2) is the slowest step — plan says start it first, do everything else in parallel.
- **Hard requirement covered:** `android.package` (Task 1.1) — without it no build is possible.
- **Kids-app specifics covered:** Families policy / Target Audience (Task 4.2) — the thing most likely to surprise a first-time publisher.
- **No placeholders:** identifiers chosen (`com.ferozem.storyjar`, "Story Jar"); every command is exact.
- **Reversibility caveat flagged:** package name + signing keystore are permanent post-publish.
