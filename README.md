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

On the coordinator's desktop, open the desktop app and use:

```text
Exports / Backups / Imports > Preview import from mobile JSON
```

The older command-line converter remains available for technical recovery work, but normal users should import the JSON file directly inside the desktop app.

The CSV export is only a review copy. Use the JSON bundle for syncing.
