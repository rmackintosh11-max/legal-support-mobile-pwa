# Legal Support Mobile PWA

This is a separate mobile-friendly PWA edition. It does not modify the existing Tauri desktop app.

## GitHub Pages URL

This app is configured for this GitHub Pages address:

```text
https://rmackintosh11-max.github.io/legal-support-mobile-pwa/
```

It will work there after this folder is pushed to a public GitHub repository named `legal-support-mobile-pwa` with GitHub Pages enabled from GitHub Actions.

## Use on phones

1. Host the built `dist/` folder on HTTPS.
2. Open the URL once on the phone.
3. Use Add to Home Screen.
4. After the first load, the app shell works offline and entries are stored in the phone browser with IndexedDB.

## Sync back to the desktop app

On the phone, open Sync and export the mobile JSON bundle.

On the coordinator's desktop, convert that bundle to SQLite:

```sh
cd mobile-pwa
npm run bundle-to-sqlite -- legal-support-mobile-bundle-2026-06-08.json legal-support-mobile-import.sqlite
```

Then open the existing desktop app and use its Import App Data workflow to import `legal-support-mobile-import.sqlite`.

The CSV export is only a review copy. Use the JSON bundle for syncing.
