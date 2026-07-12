// ── Froggie Streak sync setup ────────────────────────────────────────────
// Until you fill this in, the app runs in demo mode (this device only).
//
// One-time setup (~2 min):
//   1. https://console.firebase.google.com → Add project (name it anything)
//   2. Build → Realtime Database → Create database → Start in locked mode
//   3. Rules tab → paste:
//        { "rules": { "rooms": { "$room": { ".read": true, ".write": true } } } }
//   4. Project settings → General → Your apps → Web app → copy the config here
//   5. Don't put your real room secret below — share the app as a link with
//      the secret in the hash instead:  https://you.github.io/repo/#your-secret-pond
//      Each device remembers it after the first visit. That keeps the secret
//      out of this (public) repo; access control is the unguessable room name.
//
// The Firebase config values themselves are safe to commit publicly.
window.FIREBASE_CONFIG = {
  apiKey: "PASTE_ME",
  authDomain: "PASTE_ME.firebaseapp.com",
  databaseURL: "https://PASTE_ME-default-rtdb.firebaseio.com",
  projectId: "PASTE_ME",
};
window.ROOM_ID = "demo-pond"; // fallback when no #hash link was ever opened
