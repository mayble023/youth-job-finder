# Youth Job Finder

A mobile app that helps young job seekers in Papua New Guinea find entry-level work. Users can browse and search open jobs, see them on a map with distances, save jobs, apply with a cover note, track each application through to interview, keep a profile with skills and a PDF CV, get local reminders before interviews and see jobs recommended from their skills.

Built with React Native and Expo (managed workflow, Expo Router, TypeScript) on Supabase, for IS325 Mobile Applications Development.

- **Student:** `<Mayble WILLIE>`
- **Student number:** `<23201167>`
- **Repository:** https://github.com/mayble023/youth-job-finder

## Screenshots

| Jobs                               | Job detail                                     | Map                              | Applications                                       | Profile                                  |
| ---------------------------------- | ---------------------------------------------- | -------------------------------- | -------------------------------------------------- | ---------------------------------------- |
| ![Jobs](docs/screenshots/jobs.png) | ![Job detail](docs/screenshots/job-detail.png) | ![Map](docs/screenshots/map.png) | ![Applications](docs/screenshots/applications.png) | ![Profile](docs/screenshots/profile.png) |

_Placeholders. Add PNGs with these names to `docs/screenshots/`._

## Features

- **Accounts:** register with a 6-digit email code, log in, log out and reset your password with an emailed code. Stays signed in after the app is closed.
- **Jobs:** search (debounced), filter by category, job type and town, pull to refresh, closing dates and PGK salary ranges. The last list is cached for offline use.
- **Saved jobs:** save and unsave instantly (optimistic update), with its own screen.
- **Map and location:** shows your position, a marker for every job and a "jobs near me" list sorted by distance. If location is denied, it falls back to Port Moresby with a button to open Settings.
- **Applications (full CRUD):**
  - Create: apply with a cover note; the draft is saved on the phone.
  - Read: a list with status filters and counts, plus a detail screen.
  - Update: status, interview date and time, and notes.
  - Delete: withdraw, with a confirmation dialog.
- **Profile and CV:** edit name, town, education and skills. Upload, view and remove a PDF CV (max 5 MB) in private cloud storage.
- **Interview reminders:** local notifications 24 hours and 2 hours before an interview. They are rescheduled when the time changes, cancelled when you withdraw, and tapping one opens the application. There is an on/off switch.
- **Recommended for you:** the top 5 open jobs, scored on the phone from your skills, town, entry-level job types and distance, with the reasons shown.

## Run it from a clean clone

You need Node.js LTS, a free [Supabase](https://supabase.com) project and the **Expo Go** app on an Android phone.

1. **Install packages**

   ```sh
   git clone https://github.com/mayble023/youth-job-finder.git
   cd youth-job-finder
   npm install
   ```

2. **Create `.env`**

   Copy `.env.example` to `.env`. Fill in the values from Supabase → Project Settings → API (the **Project URL** and the **publishable / anon** key).

   ```sh
   cp .env.example .env
   ```

3. **Create the database**

   In Supabase → SQL Editor, run these two files, in this order:
   1. `supabase/migrations/001_schema.sql` creates the tables, RLS policies, the profile trigger and the private `cvs` storage bucket.
   2. `supabase/seed.sql` adds 30 sample jobs. All employers are fictional.

   Both files are safe to run more than once.

4. **Set up the email templates**

   Supabase → Authentication → Emails. Add `Your code is {{ .Token }}` to both the **Confirm signup** and **Reset password** templates. The app uses 6-digit codes, not links.

5. **Start the app**

   ```sh
   npx expo start
   ```

   Scan the QR code with Expo Go on your Android phone.

## Environment variables

| Name                       | Used by                          | Notes                                                                                                                                |
| -------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `EXPO_PUBLIC_SUPABASE_URL` | App (`src/services/supabase.ts`) | Your project URL.                                                                                                                    |
| `EXPO_PUBLIC_SUPABASE_KEY` | App (`src/services/supabase.ts`) | The **publishable/anon** key only. It is visible inside the app, so data is protected by RLS. Never use the service_role/secret key. |
| `GOOGLE_MAPS_API_KEY`      | Build only (`app.config.ts`)     | Needed for the map in APK/AAB builds. Expo Go works without it. Restrict it to the app's package and SHA-1 (see `docs/BUILD.md`).    |

`.env` is git-ignored. `.env.example` lists the names with dummy values.

## External services and APIs

| Service                                 | What it does here                                                                 | Where                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Supabase Auth                           | Accounts, email codes, password reset, session refresh                            | `src/services/auth.ts`                                   |
| Supabase Postgres + RLS                 | Jobs, applications, saved jobs, profiles                                          | `src/services/jobs.ts`, `applications.ts`, `profile.ts`  |
| Supabase Storage (Group B)              | Private CV upload; only the path is stored; viewed through a 60-minute signed URL | `src/services/cv.ts`                                     |
| Device location + Google Maps (Group A) | Current position, job markers, distances, place name                              | `src/services/location.ts`, `src/app/(tabs)/map.tsx`     |
| Local notifications (Group B)           | Interview reminders                                                               | `src/services/reminders.ts`                              |
| Network status (NetInfo)                | Offline banner, pauses and retries requests                                       | `src/services/network.ts`, `src/services/queryClient.ts` |

## Building the APK and AAB

The full steps, with the reasons for each, are in [`docs/BUILD.md`](docs/BUILD.md). In short:

```sh
npm install -g eas-cli
eas login
eas init                                             # then add the printed projectId to app.config.ts
eas env:set ...                                      # Supabase URL/key and Maps key for preview + production
npx expo-doctor
eas build --platform android --profile preview       # .apk to install on a phone
eas build --platform android --profile production    # .aab for Google Play
eas build:list --platform android
eas credentials --platform android                   # back up the keystore
```

| Profile       | Output                                                            |
| ------------- | ----------------------------------------------------------------- |
| `development` | Dev-client APK. Unused, because the app stays Expo Go compatible. |
| `preview`     | Internal `.apk`                                                   |
| `production`  | `.aab`, with `versionCode` raised automatically                   |

## Project structure

```
src/app/          Routes and screens (Expo Router): (auth), (tabs), jobs, apply, applications, profile, saved
src/components/   Reusable UI: Screen, Button, TextField, JobCard, LoadingState / EmptyState / ErrorState …
src/hooks/        React Query hooks used by screens (useJobs, useApplications, useProfile …)
src/services/     Every network, database, storage and device call
src/context/      AuthContext, JobFiltersContext
src/utils/        zod validators, formatters, distance, recommendation scoring
src/theme/        Colours, spacing, type scale, radii (the only place with style values)
supabase/         Schema + RLS (migrations/001_schema.sql) and sample data (seed.sql)
```

Screens never call Supabase or device APIs directly: **screen → hook → service**.

## Known limitations

- **Seed dates go stale.** Closing dates in `seed.sql` are relative to the day it was run. After a few weeks the jobs show as closed. Re-running `seed.sql` won't change existing rows, so before a demo, run this in the SQL Editor:
  `update public.jobs set closing_date = current_date + 14 + (abs(hashtext(id::text)) % 30);`
- **The map needs a key in builds.** The map in a built APK stays blank until `GOOGLE_MAPS_API_KEY` is set in EAS. The key isn't locked to the app's SHA-1 until after the first build.
- **Android-first.** Tested only on Android in Expo Go. iOS and web are left at template defaults and are not supported.
- **No employer side.** Jobs come from the seed file; there is no screen for employers to post jobs or see applications.
- **Reminders stay on one phone.** They are local notifications on the phone that scheduled them. They are not pushed to your other devices, and they don't fire if notifications are blocked.
- **Simple recommendations.** The rules are fixed weights, not machine learning, and need at least one skill on the profile.
- **Search is basic.** Text search matches the title and company only, case-insensitive.
- **Offline is read-only.** You can browse cached jobs offline, but applying, saving and editing need a connection (the app says so and offers Retry). Cover-note drafts are kept on the phone.
- **No automated tests.** Testing was manual on a physical device (see the adversarial test list below).

## Library credits

Expo, Expo Router and the Expo modules (location, notifications, document-picker, file-system, web-browser, splash-screen, status-bar, system-ui, font, constants, linking, glass-effect) · React Native · React · TypeScript · @supabase/supabase-js · @tanstack/react-query · react-hook-form · zod · @hookform/resolvers · date-fns · @react-native-async-storage/async-storage · @react-native-community/netinfo · @react-native-community/datetimepicker · react-native-maps · react-native-safe-area-context · react-native-screens · @expo/vector-icons (Ionicons) · ESLint (eslint-config-expo) · Prettier.

## AI assistance

I used **Claude Code** (Anthropic's AI coding assistant) during this project to:

- Turn my build plan into phases and write code for each one on its own branch, with small commits and pull requests.
- Check Expo SDK 58, Supabase and EAS APIs against the current official docs.
- Run type checks, lint, `expo-doctor` and Android bundle checks, and fix the problems they found.
- Draft the SQL schema and RLS policies, `docs/BUILD.md` and this README.
- Audit the code: remove unused packages and files, and scan the repository history for secrets.

I set the requirements and the rules the code had to follow (see `CLAUDE.md`). I reviewed every pull request, did all the testing on my Android phone, and did every step involving accounts and keys myself (the Supabase dashboard, the Google Cloud key, EAS). I can explain how each part works.

## Brief section 3 checklist

✅ = done · ⚠️ = needs an action from me outside the code

### 3.1 Framework

| Requirement                                  | Status | Evidence                                                                                                                                                                                                                |
| -------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expo managed workflow, no native code        | ✅     | No `android/` or `ios/` folders (git-ignored). Only Expo Go-compatible packages, see `package.json`.                                                                                                                    |
| Runs in Expo Go on a physical Android device | ✅     | Tested every phase on an Android phone in Expo Go.                                                                                                                                                                      |
| Expo Router                                  | ✅     | `src/app/` (file-based routes). Navigation imports only from `expo-router`.                                                                                                                                             |
| At least 6 distinct screens                  | ✅     | 13 screens: `(auth)/login`, `register`, `forgot-password`; `(tabs)/index`, `map`, `applications`, `profile`; `jobs/[id]`, `apply/[jobId]`, `applications/[id]/index`, `applications/[id]/edit`, `profile/edit`, `saved` |
| At least 2 navigation patterns               | ✅     | Tabs: `src/app/(tabs)/_layout.tsx`. Stack: `src/app/_layout.tsx`, `src/app/(auth)/_layout.tsx`.                                                                                                                         |
| TypeScript, `any` only where justified       | ✅     | `tsconfig.json` (`strict: true`). No `any` in `src/`. `npm run typecheck` is clean.                                                                                                                                     |

### 3.2 Authentication

| Requirement                                   | Status | Evidence                                                                                                                                                              |
| --------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Register, log in, log out                     | ✅     | `src/services/auth.ts`, `src/app/(auth)/register.tsx`, `login.tsx`. Log out (with confirmation) in `src/app/(tabs)/profile.tsx`                                       |
| Session persists after reopening              | ✅     | `src/services/supabase.ts:18-20` (AsyncStorage, `persistSession`), with auto-refresh on app foreground (`:33`)                                                        |
| Protected routes can't be bypassed            | ✅     | `Stack.Protected` guards in `src/app/_layout.tsx:39-51`. Signed-out users have no route to app screens, and the database also needs a valid session (RLS).            |
| Signed-in user available app-wide via Context | ✅     | `src/context/AuthContext.tsx:30`, `src/hooks/useAuth.ts`                                                                                                              |
| Never store/log/transmit passwords ourselves  | ✅     | Passwords go only to Supabase Auth over HTTPS (`src/services/auth.ts`). No logging anywhere (no `console.*` in `src/`).                                               |
| Password reset / email verification / OAuth   | ✅     | Both email verification and password reset: `verifyOtp` with type `email` and type `recovery` (`src/services/auth.ts:107, 140`), `src/app/(auth)/forgot-password.tsx` |

### 3.3 Database & CRUD

| Requirement                                        | Status | Evidence                                                                                                                                      |
| -------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Remote persistent DB, visible from a second device | ✅     | Supabase Postgres (`supabase/migrations/001_schema.sql`). Log in as the same user on another phone to see the same data.                      |
| At least 2 related entities                        | ✅     | `profiles`, `jobs`, `applications` (FK to jobs and users), `saved_jobs`: `001_schema.sql:23-130`                                              |
| Create: validated form writing to the DB           | ✅     | `src/app/apply/[jobId].tsx` + `src/utils/validators/application.ts` → `createApplication` in `src/services/applications.ts`                   |
| Read: list view + separate detail view             | ✅     | `src/app/(tabs)/applications.tsx` → `src/app/applications/[id]/index.tsx` (also Jobs list → `jobs/[id]`)                                      |
| Update: pre-populated edit flow, persisted         | ✅     | `src/app/applications/[id]/edit.tsx`, `src/app/profile/edit.tsx`                                                                              |
| Delete guarded by confirmation                     | ✅     | Withdraw application: `src/app/applications/[id]/index.tsx:88`. Remove CV: `src/app/(tabs)/profile.tsx:149`.                                  |
| Ownership enforced by RLS, not test mode           | ✅     | RLS on every table (`001_schema.sql:141-144`), with per-user policies (`:148-205`) and storage policies on the user's own folder (`:220-255`) |
| Local storage for cache / prefs / drafts           | ✅     | `src/services/localCache.ts` (job list cache, filters, cover-note drafts), reminder settings in `src/services/reminders.ts`                   |

### 3.4 External APIs

| Requirement                                                      | Status | Evidence                                                                                                                                                                             |
| ---------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| At least 2 beyond auth/database                                  | ✅     | Three: maps and location, CV file storage, local notifications                                                                                                                       |
| Group A: map with current position, own markers, graceful denial | ✅     | `src/app/(tabs)/map.tsx:108` (`showsUserLocation`), `:115` (markers from our jobs table). On denial it falls back to Port Moresby with a Settings button. `src/services/location.ts` |
| Group B: file upload to remote storage (not a local URI)         | ✅     | `src/services/cv.ts:83` uploads to the private `cvs` bucket and stores only the storage path; `:109` creates the signed URL                                                          |
| Group B: local notifications                                     | ✅     | `src/services/reminders.ts:132`, `src/hooks/useReminders.ts`                                                                                                                         |
| Every integration handles loading/success/empty/error            | ✅     | Map: `LoadingState`, `EmptyState` and `ErrorState` in `src/app/(tabs)/map.tsx`. CV card states in `src/app/(tabs)/profile.tsx`. Reminder permission states on Profile.               |

### 3.5 Robustness & UX

| Requirement                                     | Status | Evidence                                                                                                                                                                |
| ----------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading indicators on every async operation     | ✅     | `LoadingState` (`src/components/StateViews.tsx`) on every data screen. `loading` on every submit `Button` (`src/components/Button.tsx`).                                |
| Inline human-readable validation                | ✅     | zod schemas in `src/utils/validators/`, shown under each field by `src/components/FormTextField.tsx`                                                                    |
| Offline doesn't crash, tells user, offers retry | ✅     | `OfflineBanner` in `src/components/Screen.tsx:50`, cached jobs offline (`src/hooks/useJobs.ts`), `ErrorState` with Retry, request timeouts in `src/services/request.ts` |
| Helpful empty states                            | ✅     | `EmptyState` with an action (Clear filters, Browse jobs, Edit profile) on Jobs, Saved, Applications, Map and Recommendations                                            |
| No crashes on adversarial input                 | ✅     | `maxLength` and zod limits on every text field, buttons disabled while busy, `useNavigateOnce` against double taps, `usePreventRemove` during saves                     |
| One theme file                                  | ✅     | `src/theme/index.ts` (colours, type scale, spacing, radii, sizes). No hex colours or numeric style values elsewhere in `src/`.                                          |
| Keyboard, safe areas, scrolling                 | ✅     | `src/components/Screen.tsx` (`SafeAreaView`, `KeyboardAvoidingView`, `ScrollView` with `keyboardShouldPersistTaps`)                                                     |

### 3.6 Security

| Requirement                                 | Status | Evidence                                                                                                                                                            |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No secrets in git                           | ✅     | `.env` in `.gitignore`, `.env.example` committed. Full git-history scan (JWTs, `sb_secret_`, Google keys, private keys): nothing found. `.env` was never committed. |
| Only publishable/anon key in the app        | ✅     | `src/services/supabase.ts:6-7` reads only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY`                                                                 |
| API keys restricted by platform/package     | ⚠️     | The Maps key is limited to "Maps SDK for Android". The package + SHA-1 restriction needs the keystore from the first EAS build: `docs/BUILD.md` step 9.             |
| Never log tokens, passwords or user records | ✅     | No `console.*` anywhere in `src/`. Errors are shown as friendly messages only (`src/utils/errors.ts`).                                                              |

## Adversarial tests to run

Run these on the phone in Expo Go. Each one should end in a message or blocked input, never a crash.

1. **Aeroplane mode on the Jobs tab.** The offline banner appears and the cached list shows "Offline – last updated …". Turn the network back on and pull to refresh.
2. **Aeroplane mode, then submit an application or save your profile.** You get a friendly error with Retry. Your cover-note draft is still there after you reopen the screen.
3. **Aeroplane mode on first launch after logging out.** The Jobs tab shows an error with Retry, not a blank screen.
4. **Empty inputs.** Press every submit button with empty fields (login, register, code, forgot password, apply, edit application, edit profile). Each field shows its own message.
5. **5000-character strings.** Paste a 5000-character string into search, cover note, notes, name, education, a skill, email and password. Text fields stop at their limit (the counter shows it), and email and password show "too long" messages.
6. **Rapid double taps.** Double-tap Apply/Submit, Save job, a job card, Upload CV and Log out. You get one application, one navigation and one upload.
7. **Back during load.** Press back while an application is being sent or a profile is saving. You get "Please wait" and no duplicate. Also press back while a job detail is still loading.
8. **Denied location.** Deny location, then open the Map. It centres on Port Moresby with a banner and an "Open settings" button. "Jobs near me" measures from Port Moresby.
9. **Denied notifications.** Deny notifications and turn reminders on. Profile explains that notifications are blocked and offers to open Settings.
10. **Wrong or expired codes.** Enter a wrong 6-digit code, and request too many codes. You get friendly messages, including one for rate limits.
11. **Wrong file.** Try to upload a CV larger than 5 MB, then cancel the file picker. Both show a clear message, or do nothing.
12. **Two accounts.** User B cannot see user A's applications, saved jobs, profile or CV. That's RLS at work.
13. **Close and reopen the app.** You are still signed in. Log out, then press Android back: you can't return to the app screens.
