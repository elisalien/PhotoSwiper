# PhotoSwiper

Tinder-style Android app to sort your camera roll — swipe left to delete, right to keep, up to file into gallery folders.

## Gestures

| Swipe | Action |
|-------|--------|
| Left | Delete (batched Android confirmation) |
| Right | Keep (hidden from future decks) |
| Up | Move into `Pictures/PhotoSwiper/<folder>/` |

Photos and videos are separate modes. Already sorted items stay out of the deck until you tap **Reset swipe** in Settings.

## Stack

Expo SDK 57 · React Native · expo-router · Reanimated · MediaLibrary

## Setup

```bash
npm install
npm start
```

## Build APK

**Local (no queue):**

```bash
npm run build:apk:local
```

Output: `dist/PhotoSwiper-local.apk`

**EAS cloud:**

```bash
npm run build:apk
```

## License

See [LICENSE](LICENSE).
