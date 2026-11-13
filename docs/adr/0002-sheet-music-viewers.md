# 2. Show PDF sheet music with react-native-pdf and images with react-native-image-zoom

Date: 2026-11-13

## Status

Accepted

## Context

barbershoptags.com publishes sheet music as a PDF for about 60% of Tags and as an image (PNG, JPEG, GIF or WebP) for most of the rest. The Tag page must show both inside the app with pinch-zoom and pan, on Android first. Android's WebView can't render PDFs itself, and #10 will need to show sheet music from files cached on the device, without a network connection.

## Decision

- PDF sheet music uses `react-native-pdf`, with `react-native-blob-util` (0.25.x, the line that supports React Native 0.79). It renders with Android's native PDF renderer, zooms and pans, and opens local files as well as URLs. Its Expo config plugins are in `app.json`, and their changes have been applied to the checked-in `android/` folder.
- Image sheet music uses `@likashefqet/react-native-image-zoom`, which builds on `react-native-gesture-handler` and `react-native-reanimated`, both already in the app.
- `react-native-pdf` is native-only. The web build, a development convenience, links to the PDF instead of showing it.

## Consequences

- The app can't run in Expo Go; it needs a development build (`npm run android`).
- After changing native dependencies or config plugins, apply their changes to `android/` with `npx expo prebuild --platform android --no-install`, and revert anything else prebuild changes (it currently also renames the Kotlin package folder from BarberShoptimal to Tagaholic).
- PDFs and images are checked by running the app on Android; the core tests cover only which format each Tag's sheet music has.
