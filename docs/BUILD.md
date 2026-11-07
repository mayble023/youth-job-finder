# Building the APK and AAB with EAS

Run these commands yourself, from the project folder, in order. Steps 1–4 are needed only once.

## Build profiles (eas.json)

| Profile       | Output                | Use it for                                                                                                                                        |
| ------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `development` | APK with a dev client | Not used in this project. It needs `expo-dev-client`, which we leave out so the app keeps running in Expo Go. Kept because the brief asks for it. |
| `preview`     | `.apk`, internal      | Installing straight onto a phone and demoing in the lab.                                                                                          |
| `production`  | `.aab` (app bundle)   | Uploading to Google Play. `autoIncrement` raises `versionCode` on every build.                                                                    |

`cli.appVersionSource` is `remote`, so EAS stores `versionCode` on its servers. The `versionCode: 1` in `app.config.ts` is used only once, to set the starting value.

## 1. Install the EAS CLI and log in

```sh
npm install -g eas-cli
eas --version        # must be 16.0.0 or newer (eas.json requires it)
eas login
eas whoami
```

## 2. Link the project to EAS

```sh
eas init
```

Our config is `app.config.ts` (code, not JSON), so `eas init` cannot edit it. It prints a project ID and asks you to add it yourself. Add it to `app.config.ts` like this and commit it. The ID is not a secret.

```ts
  extra: {
    eas: { projectId: 'paste-the-id-here' },
  },
```

## 3. Add the environment variables to EAS

**Why this is needed:** EAS Build runs on Expo's servers, not on your laptop. It uploads your project as Git sees it, and `.env` is git-ignored, so the build server never gets it. Variables starting with `EXPO_PUBLIC_` are copied into the JavaScript bundle at build time. If they are missing on the server, the installed app has no Supabase URL or key and cannot log in or load jobs. `GOOGLE_MAPS_API_KEY` is read by `app.config.ts` while the APK is built. Without it, the map in the APK shows a blank grey screen.

Run each command once for `preview` and once for `production`, pasting your own values. The Supabase key is the **publishable (anon)** key, never the service_role key.

```sh
eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR-REF.supabase.co" --environment preview --visibility plaintext
eas env:set --name EXPO_PUBLIC_SUPABASE_KEY --value "YOUR-PUBLISHABLE-KEY" --environment preview --visibility sensitive
eas env:set --name GOOGLE_MAPS_API_KEY --value "YOUR-MAPS-KEY" --environment preview --visibility sensitive

eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR-REF.supabase.co" --environment production --visibility plaintext
eas env:set --name EXPO_PUBLIC_SUPABASE_KEY --value "YOUR-PUBLISHABLE-KEY" --environment production --visibility sensitive
eas env:set --name GOOGLE_MAPS_API_KEY --value "YOUR-MAPS-KEY" --environment production --visibility sensitive

eas env:list --environment preview
eas env:list --environment production
```

`sensitive` hides the value in build logs and on the website. Do not use `secret`: EAS CLI cannot read secret variables while it resolves `app.config.ts`. Anything with `EXPO_PUBLIC_` ends up inside the app, so it must never be a real secret. That is why only the publishable key is used and data is protected by Supabase RLS.

## 4. Check the project

```sh
npx expo-doctor
```

All checks should pass before you build.

## 5. Build the APK (preview)

```sh
eas build --platform android --profile preview
```

The first time, answer **Yes** when EAS offers to generate a new Android keystore. When the build finishes, open the link or scan the QR code on your phone to download and install the `.apk`. You may need to allow "Install unknown apps" for your browser.

## 6. Build the AAB (production)

```sh
eas build --platform android --profile production
```

This makes the `.aab` that Google Play needs. It cannot be installed on a phone directly.

## 7. See your builds

```sh
eas build:list --platform android
```

## 8. Back up the keystore

EAS keeps the signing keystore. If it is lost, you can never update the app on Google Play, so keep a copy.

```sh
eas credentials --platform android
```

1. Choose the **production** build profile.
2. Choose **Keystore: Manage everything needed to build your project**.
3. Choose **Download existing keystore**.
4. EAS saves a `.jks` file and shows the keystore password, key alias and key password. Store the file and the passwords somewhere safe outside this project, such as a password manager.

Never commit the `.jks` file. `.gitignore` already blocks `*.jks`.

## 9. Lock the Google Maps key to this app

Do this after the first build.

1. Run `eas credentials --platform android`, choose the profile, and copy the **SHA-1 fingerprint** of the keystore.
2. In Google Cloud Console, go to **APIs & Services → Credentials** and open your Maps key.
3. Under **Application restrictions**, choose **Android apps**, then **Add**.
4. Enter package name `com.mayblewillie.youthjobfinder` and paste the SHA-1.
5. Keep **API restrictions** set to **Maps SDK for Android** only, then click **Save**.

If you later publish through Google Play, also add the **App signing key** SHA-1. You'll find it in Play Console under **Test and release → App integrity**.
