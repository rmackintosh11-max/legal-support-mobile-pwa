# Phone Testing and Sharing

## Current status

The mobile PWA version is built in this folder. It is separate from the desktop Tauri app.

It works like a small website that can be installed to a phone Home Screen. After the first load, the app shell is cached and entries are stored locally on the phone.

For iPhone, you cannot send colleagues an app file to open directly. They need an HTTPS link, then they add it to their Home Screen.

## Test on your iPhone

### Best test method

1. Publish the `dist/` folder to an HTTPS host.
2. Open that HTTPS link in Safari on your iPhone.
3. Tap Share.
4. Tap Add to Home Screen.
5. Open Legal Support from the Home Screen.
6. Put the phone in airplane mode and test saving an entry.

### Why localhost is not enough

The app is currently running on your Mac at:

```text
http://127.0.0.1:1430/
```

That address only works on the Mac itself. Your iPhone cannot use it. Also, proper offline PWA installation on iPhone needs HTTPS.

## Share with colleagues

1. Host the built `dist/` folder on an HTTPS service.
2. Send colleagues the HTTPS link.
3. Ask iPhone users to open the link in Safari and choose Add to Home Screen.
4. Ask Android users to open the link in Chrome and choose Install app or Add to Home Screen.
5. They should open the installed app once while online.
6. After that, they can capture entries offline.

## Sync entries back to desktop

On the phone:

1. Open the mobile app.
2. Go to Sync.
3. Tap Export mobile bundle.
4. Send the JSON file to the coordinator.

On the coordinator desktop:

1. Open the desktop app.
2. Go to Exports / Backups / Imports.
3. Click Preview import from mobile JSON.
4. Select the phone-exported JSON file.
5. Review the preview.
6. Click Confirm import.

## Recommended hosting

Use a simple static HTTPS host such as Netlify, Cloudflare Pages, GitHub Pages, or an internal HTTPS web server.

The folder to upload is:

```text
mobile-pwa/dist
```
