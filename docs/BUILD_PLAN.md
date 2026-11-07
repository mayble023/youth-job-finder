# Youth Job Finder — Build Plan

PHASES

PHASE 0 — Finish the merge (branch: feat/ui-foundation)
Check whether main already contains CLAUDE.md, src/components, src/theme and supabase/. If feat/ui-foundation is not merged yet: on feat/ui-foundation run git merge main and resolve conflicts keeping main's CLAUDE.md, AGENTS.md, .env.example, .prettierrc, .prettierignore, package.json scripts (lint, format, typecheck), prettier, eslint-config-prettier, supabase/ and src/types/database.ts, plus the branch's theme, components, @expo/vector-icons, demo screen and themed header, with ONE eslint.config.js (eslint-config-expo, then eslint-config-prettier last). Run npm install and npm run format, check every component follows CLAUDE.md, then continue the workflow from step 3. If everything is already merged, say so and go to Phase 1.

PHASE 1 — Navigation shells (branch: feat/navigation)
Expo Router screens as working shells with our components and placeholder content (no data yet), routes in src/app:
(auth)/_layout (Stack): login, register, forgot-password.
(tabs)/_layout (Tabs with Ionicons): index (Jobs), map, applications, profile.
Stack screens: jobs/[id] (job detail), apply/[jobId], applications/[id] (detail), applications/[id]/edit, profile/edit, saved.
Typed params via useLocalSearchParams, headers from the theme, every screen reachable by tapping. Remove the component demo (and its real shop name). For now let all screens be reachable without login. At the end, print a text screen-flow diagram for my report.

PHASE 2 — Authentication and protected routes (branch: feat/auth)
BEFORE coding, STOP and tell me to edit Supabase → Authentication → Emails: add "Your code is {{ .Token }}" to both the "Confirm signup" and "Reset password" templates. Continue when I say done.
Install with npx expo install: @supabase/supabase-js, @react-native-async-storage/async-storage, react-native-url-polyfill only if current Supabase Expo docs still need it, @tanstack/react-query, react-hook-form, zod, @hookform/resolvers.
src/services/supabase.ts: client from EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY, session in AsyncStorage, autoRefreshToken with the AppState start/stop listener, clear error if env vars are missing.
src/services/auth.ts: signUp(email, password, fullName via user metadata), verifySignupCode (verifyOtp type 'email'), signIn, signOut, resendSignupCode, sendPasswordResetCode, resetPasswordWithCode (verifyOtp type 'recovery' then updateUser). Map errors to friendly messages (wrong password, unconfirmed email, rate limit, no network).
src/context/AuthContext.tsx + src/hooks/useAuth.ts (session, user, isLoading, actions). Wrap the app in AuthProvider and QueryClientProvider.
Protected routes with Expo Router's Stack.Protected guard (check the docs for our SDK): signed-in users only reach (tabs) and stack screens; signed-out users only reach (auth). Show a loading screen while the session restores.
Screens with react-hook-form + zod inline errors: register (full name 2–60, email, password min 8 with a number, confirm) then a 6-digit code step; login (with resend-code option for unconfirmed emails); forgot-password (email → code + new password + confirm). Log out on the profile tab with a confirmation dialog. Disable buttons while submitting; friendly offline errors with Retry. Never log passwords or tokens.

PHASE 3 — Jobs, search, saved jobs, offline cache (branch: feat/jobs)
src/services/jobs.ts: listJobs({search, category, town, jobType}) (ilike on title/company, ordered by closing_date), getJob, listSavedJobs, saveJob, unsaveJob; 15-second timeout; typed friendly errors.
src/services/localCache.ts (AsyncStorage): cache the last job list with a timestamp; remember last-used filters.
Hooks with React Query (useJobs, useJob, useSavedJobs; retry 2). If the network fails, show the cached list marked "Offline – last updated <time>".
npx expo install @react-native-community/netinfo; useNetworkStatus hook; show OfflineBanner app-wide when offline.
Jobs tab: debounced search (300 ms, max 100 chars), category and job-type filter chips, town picker, FlatList of job cards (title, company, town, type, PGK salary range, closing date via date-fns), pull to refresh; loading / empty with "Clear filters" / error with Retry / offline states.
Job detail: full info, tags as chips, optimistic Save/Unsave, Apply button (to apply/[jobId]), "View on map" button. Saved jobs screen linked from Profile, with its own empty state. Long text wraps; double taps don't navigate twice.

PHASE 4 — Map and location, Group A API (branch: feat/jobs-map)
npx expo install expo-location react-native-maps. src/services/location.ts (permission, current position with 10 s timeout, reverse geocode to a place name); src/utils/distance.ts (haversine km); useCurrentLocation hook (loading/granted/denied/error).
Map tab: centred on the user with showsUserLocation; if denied, centre on Port Moresby with a banner and a button to Linking.openSettings(). One marker per job (respecting filters) with a callout (title, company, distance) that opens the job detail. "Jobs near me" list sorted by distance with "You are near <place>". Loading/empty/error/offline states. Support focusing one job via a jobId param from the job detail. Tell me how to test denying the permission and what may differ in the APK.

PHASE 5 — Applications CRUD (branch: feat/applications)
src/services/applications.ts: createApplication, listMyApplications({status?}) joined with job title/company/town, getApplication, updateApplication({status, interviewAt, notes}), deleteApplication, getMyApplicationForJob; unique-constraint error → "You have already applied for this job".
zod: coverNote 20–1000 trimmed; notes ≤ 1000; interviewAt required and in the future when status is 'interviewing'.
React Query hooks with correct invalidation.
CREATE apply/[jobId]: job summary, cover note with character count, inline errors, draft auto-saved to AsyncStorage and restored, cleared after submit.
READ applications tab: status badges, filter chips (All/Applied/Interviewing/Offered/Rejected), counts, pull to refresh, empty state with "Browse jobs". Detail screen with Edit and Withdraw.
UPDATE edit screen pre-filled (status picker, date/time via npx expo install @react-native-community/datetimepicker, notes).
DELETE "Withdraw application" with an Alert confirmation (destructive). Job detail shows "Already applied" when relevant. No duplicates on double tap or back-navigation during save.

PHASE 6 — Profile and CV upload, Group B API (branch: feat/profile-cv)
src/services/profile.ts: getMyProfile, updateMyProfile({fullName, town, education, skills}).
src/services/cv.ts: pick a PDF with expo-document-picker (npx expo install), reject > 5 MB; upload to bucket 'cvs' at `${userId}/cv.pdf` (upsert, ArrayBuffer as current Supabase RN docs recommend); save cv_path; signed URL (60 min) to view; delete with confirmation. Never store a local file URI in the database.
Profile tab: name, email, town, education, skills chips, CV card (none / uploaded date) with Upload/Replace, View (expo-web-browser), Remove; links to Edit profile, Saved jobs, Log out. Edit profile: pre-filled zod form, skills as tags (max 15, 2–30 chars, lowercase, no duplicates).
Then give me the two-account test: user A must not see user B's applications, saved jobs, profile or CV.

PHASE 7 — Interview reminders (branch: feat/reminders)
npx expo install expo-notifications (local scheduled notifications only). src/services/reminders.ts: permission, schedule 24 h and 2 h before interview_at (skip past times), cancel; store notification ids per application in AsyncStorage. Android channel + foreground handler. Schedule/reschedule/cancel when an application's status or interview date changes or it is withdrawn. Reminders on/off toggle on Profile (AsyncStorage). Tapping a reminder opens the application. Tell me a quick way to test it.

PHASE 8 — Recommended jobs (branch: feat/recommendations)
src/utils/recommendations.ts: pure scoreJob(job, profile, coords?) 0–100 from matching skill tags (most weight), same town, internship/graduate fit, distance; returns reasons ("Matches 3 of your skills: …"). useRecommendedJobs: top 5, excluding applied and closed jobs. Horizontal "Recommended for you" section on the Jobs tab; if no skills, an empty state linking to Edit profile. No AI service, no API key.

PHASE 9 — Build configuration (branch: chore/eas-build)
STOP first and tell me to (1) make a 1024×1024 icon at assets/images/icon.png and (2) create a Google Maps API key with "Maps SDK for Android" enabled and add GOOGLE_MAPS_API_KEY to my .env. Check every step against current Expo/EAS docs for our SDK.
Convert app.json to app.config.ts (keep existing values): name "Youth Job Finder", slug "youth-job-finder", version "1.0.0", android.package "com.<ask me>.youthjobfinder", android.versionCode 1, icon, adaptiveIcon (foreground + theme background colour), splash as the current SDK expects, android.config.googleMaps.apiKey from process.env.GOOGLE_MAPS_API_KEY, only the permissions we use, expo-location permission text. eas.json exactly: cli version >= 16.0.0 with appVersionSource remote; development (developmentClient, internal, apk); preview (internal, apk); production (autoIncrement, app-bundle); submit.production {}. Add GOOGLE_MAPS_API_KEY to .env.example. Write docs/BUILD.md with the exact commands I run myself (eas login, eas init, eas env variables for preview and production, npx expo-doctor, preview and production builds, eas build:list, backing up the keystore with eas credentials) and why EXPO_PUBLIC_ variables must be set in EAS. Do NOT run eas commands yourself. Run npx expo-doctor and fix what you can.

PHASE 10 — Final audit and README (branch: chore/final-audit)
Remove console.log, commented-out code, unused files, unused dependencies (including unused template packages), unjustified `any`, duplicated components, and any supabase/fetch call outside src/services. Check every screen for loading/empty/error/offline states, inline form errors, safe areas, keyboard handling and long-text wrapping. Search the repo and git history for secrets. Write README.md: description, my name and student number as placeholders, clean-clone setup (npm install, .env from .env.example, run the SQL files, npx expo start), env variables, external APIs/services, APK/AAB build steps with profile names, screenshot placeholders, honest known limitations, library credits, and an "AI assistance" section saying I used Claude Code and for what. Finish with a checklist of my brief's section 3 requirements marked done/not done with file references, and a list of adversarial tests to run (aeroplane mode, empty inputs, 5000-character strings, double taps, back during load, denied permissions).

Start now with STEP 1, then PHASE 0.
