# PhotoSwiper

> Tinder-style Android app to sort your camera roll — swipe left to delete, right to keep, up to file into gallery folders.

![Platform](https://img.shields.io/badge/platform-Android-informational) ![Stack](https://img.shields.io/badge/stack-Expo%20%C2%B7%20React%20Native-blue) ![License](https://img.shields.io/badge/license-Apache%202.0%20%2B%20Commons%20Clause-green)

**[Download the latest APK](https://github.com/elisalien/photoswiper/releases/latest)**

<p align="center"><img src="assets/images/icon.png" width="128" alt="PhotoSwiper icon"></p>

## About

PhotoSwiper turns camera-roll cleanup into a card deck: each photo or video is shown one at a time and a single swipe decides its fate — delete it, keep it, or move it into a folder of your gallery. Photos and videos are sorted in separate modes, and items you've already sorted are kept out of future decks. The app UI is in French.

## Features

| Swipe | Action |
|-------|--------|
| Left | Delete (batched Android confirmation) |
| Right | Keep (hidden from future decks) |
| Up | Move into `Pictures/PhotoSwiper/<folder>/` |

- Separate **Photos** and **Videos** modes, with media counts on the home screen; videos play inline on the card.
- Up-swipes physically move the file to `Pictures/PhotoSwiper/<folder>/`, so it shows up in the gallery and in the Android file explorer.
- Customisable folder list in Settings (defaults: *Favoris*, *Voyage*, *À imprimer*).
- Already sorted items stay out of the deck until you tap **Reset swipe** in Settings.
- Haptic feedback on actions.

## Getting started

Requirements: Node.js / npm and the Expo tooling.

```bash
npm install
npm start
```

Other scripts: `npm run android` (`expo run:android`), `npm run prebuild` (`expo prebuild --platform android`).

### Build an APK

**Local (no queue):**

```bash
npm run build:apk:local
```

Output: `dist/PhotoSwiper-local.apk`. The script ([scripts/build-apk-local.ps1](scripts/build-apk-local.ps1)) is PowerShell/Windows-only and expects the Android SDK in `%LOCALAPPDATA%\Android\Sdk` and JDK 17; it runs `expo prebuild` if needed, then Gradle `assembleRelease`.

**EAS cloud:**

```bash
npm run build:apk
```

(uses the `preview` profile from [eas.json](eas.json), which produces an APK).

## Usage

1. Launch the app and grant gallery access (photos and videos).
2. Pick the **Photos** or **Videos** mode from the home screen.
3. Swipe each card: left to delete, right to keep, up to choose a folder.
4. Manage your folders and reset the sorting history from **Settings** (*Paramètres*).

## Project structure

| Path | Contents |
|------|----------|
| `app/` | expo-router screens: home (`index.tsx`), swipe deck (`swipe/[mode].tsx`), `settings.tsx` |
| `components/` | Card stack, swipe card, video player, folder picker, glass UI panels |
| `services/` | Media library access, swipe actions, sorted-item history, folders & settings storage |
| `theme/`, `constants/` | Colors, spacing, typography |
| `assets/` | App icons, splash, font |
| `scripts/build-apk-local.ps1` | Local APK build script |

## Tech stack

Expo SDK 57 · React Native · expo-router · Reanimated · Gesture Handler · expo-media-library · expo-video · TypeScript

## Credits & license

Made by elisalien.

Source-available under **Apache 2.0 + Commons Clause**.
You may use, modify, and share the code freely. **Selling PhotoSwiper (or a product whose value substantially comes from it) is not allowed.**
See [LICENSE](LICENSE).

---

<p align="center">
  Made by <a href="https://github.com/elisalien">Élisalien</a> ·
  <a href="https://gitlab.com/elisalien/catalog">Shaders, sources & software catalog</a>
</p>
