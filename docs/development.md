# Development

How to build, run and test Tagaholic. The [README](../README.md) has the short version.

## Web build

```bash
npm run web
```

The quickest way to work on screens. It differs from the phone app in a few ways:

- PDF sheet music is shown as a link, not in the viewer ([ADR 0002](adr/0002-sheet-music-viewers.md)).
- Running with `CI=1` turns off Metro's file watching, so the server keeps serving the old bundle after you edit code. Restart it rather than reloading the page.

## Android

The app uses native modules (`react-native-pdf`, `react-native-blob-util`), so **Expo Go can't run it**. You need a development build, which includes `expo-dev-client`.

### Prerequisites

- **Android Studio**, for the SDK and an emulator.
- **JDK 17.** Android Studio's bundled Java is too new for this Gradle version ("Unsupported class file major version 69"). Point `JAVA_HOME` at a JDK 17.
- **`android/local.properties`** (gitignored), pointing at the SDK with forward slashes:

  ```properties
  sdk.dir=C:/Users/<you>/AppData/Local/Android/Sdk
  ```

  `npx expo prebuild --clean` deletes this file, so recreate it afterwards.
- **Windows path limit.** The native C++ builds (react-native-worklets, gesture-handler) can exceed 260 characters when the checkout is in a deep folder. Enable long paths in Windows, or build from a short path such as `C:\tg` (`git worktree add C:\tg <branch>`, then `npm ci`).

### Build and run

```bash
npm run android -- --device <AVD name>
```

This builds a debug APK, installs it and starts Metro. `--device` takes the emulator's AVD name (from `emulator -list-avds`), not `emulator-5554`. The first build takes 10 minutes or more.

After that, JavaScript changes don't need a rebuild: start Metro with `npx expo start --dev-client` and reopen the app.

### On your own phone

1. Install the debug APK: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.
2. Forward Metro's port to the phone: `adb reverse tcp:8081 tcp:8081`.
3. Start Metro: `npx expo start --dev-client --port 8081`.
4. Open the app. On Android 17, a debug build asks for the "nearby devices" permission to reach Metro. Allow it, or the bundle won't load.

When more than one device is attached, pass `-s <serial>` to every `adb` command.

### Handy commands

- Open a Tag directly: `adb shell am start -a android.intent.action.VIEW -d "tagaholic://tag/<id>"`
- Take a screenshot: `adb exec-out screencap -p > screen.png`

### Testing offline behaviour

A debug build loads its JavaScript and assets from Metro, so it can't show what happens without a network. Build a release APK (`cd android && ./gradlew app:assembleRelease`) to test offline.

## Tests and lint

```bash
npm test
npm run lint
```

The tests cover `core/`, the domain logic. They run against recorded barbershoptags.com responses in `core/fixtures/`, never the network. GitHub Actions runs them on every pull request.

## Pitch samples

The Pitch button plays bundled audio files in `assets/audio/pitch`, one per tonic from F3 to E4. After changing the sound in `scripts/generate-pitch-samples.js`, regenerate them:

```bash
node scripts/generate-pitch-samples.js
```

## Upgrading Expo

Pin each Expo package to the version released with the installed `expo`. Some ship prebuilt native code for a later SDK patch, and a mismatch crashes the app at start. `npx expo install --check` lists mismatches.
