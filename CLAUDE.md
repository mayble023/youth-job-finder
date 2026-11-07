> Both AGENTS.md and CLAUDE.md apply to this project. Where they differ, CLAUDE.md wins.

# Youth Job Finder — project rules

A React Native + Expo mobile app (TypeScript, Expo Router) for young job seekers in Papua New Guinea: browse jobs, apply, track applications, upload a CV, see jobs on a map. University semester project (IS325 Mobile Applications Development). Every rule below is marked by the lecturer.

## Stack (do not change)
- Expo managed workflow, Expo Router, TypeScript strict. The Expo SDK version in package.json (SDK 58) is pinned. NEVER upgrade or downgrade Expo or React Native.
- Supabase (@supabase/supabase-js) for auth, Postgres and Storage. Row Level Security on every table.
- @tanstack/react-query for server state, react-hook-form + zod for forms, AsyncStorage for local storage, date-fns for dates.
- Styling with StyleSheet and the tokens in src/theme only. No hard-coded colours, font sizes or spacing in components.

## Expo Go compatibility
- The app must run in Expo Go on Android at all times. Do not add any package that needs a config plugin, a development build or custom native code. If unsure, stop and ask me.
- Install packages with `npx expo install <name>`, never `npm install`.
- Import navigation only from expo-router. Never import from @react-navigation/* directly.
- When unsure about an Expo or Supabase API, check the current official docs for this SDK version instead of guessing.

## Folder structure
- src/app/ — Expo Router routes and screens only (this SDK's template puts routes in src/app, not app). src/app/(auth)/ for login/register/forgot-password, src/app/(tabs)/ for the signed-in app. Wherever a prompt says app/..., it means src/app/...
- src/components — reusable presentational components
- src/hooks — custom hooks (useAuth, useJobs, ...)
- src/services — ALL network, database, storage and device-API calls. No UI code here.
- src/context — React Context providers
- src/types — shared TypeScript types
- src/utils — validators (zod schemas), formatters, helpers
- src/theme — colours, spacing, typography, radii

## Code rules
- Components and screens NEVER call supabase, fetch or device APIs directly. They use hooks, which use services.
- No duplicated components: reuse src/components (Button, TextField, Screen, LoadingState, EmptyState, ErrorState).
- Every async screen handles four states: loading, success, empty and error (with a Retry button).
- Every form validates inline with zod and shows human-readable messages under each field.
- Destructive actions ask for confirmation. Submit buttons disable while a request runs (no double submits).
- Screens respect safe areas, scroll when content is long, and avoid the keyboard.
- No `any` unless a comment justifies it. Meaningful names. Comments explain why, not what.
- No console.log, no commented-out code, no unused files.
- Never log tokens, passwords or full user records.

## Security
- Only EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY (the publishable/anon key) are used in the app. NEVER use or ask for the service_role or secret key.
- .env is git-ignored. .env.example lists variable names with dummy values. Never read, print or commit the real .env values.
- Data ownership is enforced by Supabase RLS policies, not by client code.

## Git
- Small commits with conventional messages (feat:, fix:, chore:, refactor:, docs:).
- Never commit .env, keystores, node_modules or build output.
