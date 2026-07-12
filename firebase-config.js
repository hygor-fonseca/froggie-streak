// ── Froggie Streak sync setup ────────────────────────────────────────────
// Until you fill this in, the app runs in demo mode (this device only).
//
// One-time setup (~2 min):
//   1. https://console.firebase.google.com → Add project (name it anything)
//   2. Build → Realtime Database → Create database → Start in locked mode
//   3. Rules tab → paste:
//        { "rules": { "rooms": { "$room": { ".read": true, ".write": true } } } }
//   4. Project settings → General → Your apps → Web app → copy the config here
//   5. Change ROOM_ID below to something long and unguessable (it's the key
//      to your shared streak — like a secret pond only you two know).
//
// These config values are safe to commit publicly; access control comes from
// the unguessable ROOM_ID, which is fine for a two-froggie exercise tracker.
window.FIREBASE_CONFIG = {
  apiKey: "PASTE_ME",
  authDomain: "PASTE_ME.firebaseapp.com",
  databaseURL: "https://PASTE_ME-default-rtdb.firebaseio.com",
  projectId: "PASTE_ME",
};
window.ROOM_ID = "secret-pond-CHANGE-ME";
