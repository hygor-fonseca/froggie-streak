// Froggie Streak — two froggies, one streak. 🐸

// ===== Pure streak logic (testable: open index.html?test and check console) =====

export function dayKey(d) {
  return d.toLocaleDateString("sv"); // local date as YYYY-MM-DD
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function isBoth(checkins, key) {
  const c = checkins[key];
  return !!(c && c.p1 && c.p2);
}

function isFrozen(checkins, key) {
  const c = checkins[key];
  return !!(c && c.freeze);
}

// Consecutive both-checked days ending today (or yesterday if today's still open).
// Frozen rest days are skipped: they protect the streak but don't grow it.
export function currentStreak(checkins, today) {
  let n = 0;
  let d = isBoth(checkins, dayKey(today)) ? today : addDays(today, -1);
  for (;;) {
    const k = dayKey(d);
    if (isBoth(checkins, k)) n++;
    else if (!isFrozen(checkins, k)) break;
    d = addDays(d, -1);
  }
  return n;
}

// Longest both-streak anywhere in history (freeze days bridge runs).
export function bestStreak(checkins, today) {
  const keys = Object.keys(checkins).sort();
  if (!keys.length) return 0;
  let best = 0, run = 0;
  let d = new Date(keys[0] + "T12:00:00");
  const end = dayKey(today);
  while (dayKey(d) <= end) {
    const k = dayKey(d);
    if (isBoth(checkins, k)) { run++; if (run > best) best = run; }
    else if (!isFrozen(checkins, k)) run = 0;
    d = addDays(d, 1);
  }
  return best;
}

export function daysCompleted(checkins) {
  return Object.keys(checkins).filter((k) => isBoth(checkins, k)).length;
}

// 'both' | 'freeze' | 'half' | 'today' | 'missed'
export function dayState(checkins, d, today) {
  const c = checkins[dayKey(d)] || {};
  const done = (c.p1 ? 1 : 0) + (c.p2 ? 1 : 0);
  if (done === 2) return "both";
  if (c.freeze) return "freeze";
  if (done === 1) return "half";
  return dayKey(d) === dayKey(today) ? "today" : "missed";
}

// ===== Store: Firebase RTDB when configured, localStorage otherwise =====
// Demo mode syncs across tabs on one device (via the storage event), so you
// can play both froggies in two tabs before wiring Firebase.

function localStore() {
  const KEY = "froggie.room";
  const read = () => JSON.parse(localStorage.getItem(KEY) || "{}");
  let cb = null;
  addEventListener("storage", (e) => { if (e.key === KEY && cb) cb(read()); });
  return {
    demo: true,
    subscribe(fn) { cb = fn; fn(read()); },
    patch(path, val) {
      const data = read();
      let o = data;
      for (const p of path.slice(0, -1)) o = o[p] ?? (o[p] = {});
      if (val === null) delete o[path[path.length - 1]];
      else o[path[path.length - 1]] = val;
      localStorage.setItem(KEY, JSON.stringify(data));
      cb && cb(data);
    },
  };
}

async function firebaseStore(cfg, room) {
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
  const { getDatabase, ref, onValue, update } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js");
  const db = getDatabase(initializeApp(cfg));
  const root = ref(db, "rooms/" + room);
  return {
    demo: false,
    subscribe(fn) { onValue(root, (s) => fn(s.val() || {})); },
    patch(path, val) { return update(root, { [path.join("/")]: val }); }, // null deletes
  };
}

// ===== App =====

const $ = (sel) => document.querySelector(sel);
const configured = window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey !== "PASTE_ME";

let store;
let data = {};
let me = localStorage.getItem("froggie.me"); // 'p1' | 'p2' | null
let claimSlot = null;
let prevToday = null; // {meIn, partnerIn, both} — for celebration/notification edges

function other(slot) { return slot === "p1" ? "p2" : "p1"; }
function names() {
  const p = data.profiles || {};
  return { p1: p.p1?.name || "Froggie 1", p2: p.p2?.name || "Froggie 2" };
}

// ---- Notifications (fire only while the app is open; static hosting has no push server) ----
const notifOn = () => localStorage.getItem("froggie.notif") === "on";
function notify(body) {
  if (!notifOn() || !("Notification" in window) || Notification.permission !== "granted") return;
  if (!document.hidden) return; // visible app already shows the state
  new Notification("Froggie Streak 🐸", { body, icon: "apple-touch-icon.png" });
}

function renderBell() {
  const bell = $("#bell-btn");
  if (!("Notification" in window)) { bell.hidden = true; return; }
  const on = notifOn() && Notification.permission === "granted";
  bell.textContent = on ? "🔔" : "🔕";
  bell.setAttribute("aria-pressed", on);
  bell.setAttribute("aria-label", on ? "Notifications on" : "Notifications off");
}

$("#bell-btn").addEventListener("click", async () => {
  if (Notification.permission !== "granted") {
    const perm = await Notification.requestPermission();
    localStorage.setItem("froggie.notif", perm === "granted" ? "on" : "off");
  } else {
    localStorage.setItem("froggie.notif", notifOn() ? "off" : "on");
  }
  renderBell();
});

// ---- Rendering ----

function makeDayCell(checkins, d, today, mini) {
  const state = dayState(checkins, d, today);
  const labels = {
    both: "day complete", freeze: "rest day", half: "one froggie in",
    today: "today, still open", missed: "no check-ins",
  };
  const li = document.createElement("li");
  li.className = `day day-${state}` + (mini ? " day-mini" : "");
  if (!mini) li.textContent = d.toLocaleDateString(undefined, { weekday: "narrow" });
  else if (state === "freeze") li.textContent = "🧊";
  li.title = `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${labels[state]}`;
  li.setAttribute("aria-label", li.title);
  return li;
}

function render() {
  const today = new Date();
  const checkins = data.checkins || {};
  const picker = $("#screen-picker");
  const todayScr = $("#screen-today");

  if (!me) {
    picker.hidden = false;
    todayScr.hidden = true;
    const p = data.profiles || {};
    for (const slot of ["p1", "p2"]) {
      picker.querySelector(`[data-name-slot="${slot}"]`).textContent =
        p[slot] ? `I'm ${p[slot].name}` : "Claim this froggie";
    }
    return;
  }

  picker.hidden = true;
  todayScr.hidden = false;
  $("#demo-banner").hidden = !store.demo;

  const n = names();
  $("#topbar-me").textContent = `You're ${n[me]} 🐸`;
  renderBell();

  // Hero
  const tk = dayKey(today);
  const c = checkins[tk] || {};
  const both = !!(c.p1 && c.p2);
  const frozen = !!c.freeze;
  $("#streak-num").textContent = currentStreak(checkins, today);
  $("#flame").classList.toggle("lit", both);
  $("#hero-freeze").hidden = !frozen || both; // a secured day outranks its freeze

  // Celebration + notifications on transitions (skip the first snapshot)
  if (prevToday) {
    if (!prevToday.both && both) {
      celebrate();
      notify("Day secured — both froggies hopped in! 🎉");
    } else if (!prevToday.partnerIn && c[other(me)]) {
      notify(`${n[other(me)]} hopped in! Your turn 🐸`);
    }
  }
  prevToday = { meIn: !!c[me], partnerIn: !!c[other(me)], both };

  // Pair
  const partnerJoined = !!(data.profiles || {})[other(me)];
  for (const slot of ["p1", "p2"]) {
    todayScr.querySelector(`[data-name-slot="${slot}"]`).textContent =
      n[slot] + (slot === me ? " (you)" : "");
    const av = todayScr.querySelector(`[data-avatar="${slot}"]`);
    av.classList.toggle("checked", !!c[slot]);
    const st = todayScr.querySelector(`[data-state-slot="${slot}"]`);
    st.textContent = c[slot] ? "Hopped in!" : (slot !== me && !partnerJoined ? "Hasn't joined" : "Not yet");
    st.classList.toggle("in", !!c[slot]);
  }

  // Status line
  const status = $("#status");
  if (both) status.textContent = "Both froggies hopped in — day secured! 🎉";
  else if (frozen) status.textContent = "Rest day — the streak is safe 🧊";
  else if (!partnerJoined) status.textContent = "Send your froggie this page's link so they can claim their frog! 💌";
  else if (c[me]) status.textContent = `Waiting for your froggie, ${n[other(me)]} 🐸`;
  else if (c[other(me)]) status.textContent = `${n[other(me)]} already hopped in — your turn! 🐸`;
  else status.textContent = "Nobody's hopped in yet today.";

  $("#undo-btn").hidden = !c[me];

  // Week strip (last 7 days)
  const strip = $("#week-strip");
  strip.innerHTML = "";
  for (let i = 6; i >= 0; i--) strip.appendChild(makeDayCell(checkins, addDays(today, -i), today, false));

  // History (last 35 days + stats) — earns its place after the first secured day
  const done = daysCompleted(checkins);
  todayScr.querySelector(".history").hidden = done === 0;
  $("#stat-best").textContent = bestStreak(checkins, today);
  $("#stat-days").textContent = done;
  const hist = $("#history-grid");
  hist.innerHTML = "";
  for (let i = 34; i >= 0; i--) hist.appendChild(makeDayCell(checkins, addDays(today, -i), today, true));

  // Check-in + rest-day buttons
  const btn = $("#checkin-btn");
  if (both) { btn.classList.add("done"); btn.textContent = "Both in today! 🎉"; btn.disabled = true; }
  else if (c[me]) { btn.classList.add("done"); btn.textContent = "You're in ✓"; btn.disabled = true; }
  else { btn.classList.remove("done"); btn.innerHTML = "Check in 🐸"; btn.disabled = false; }

  const rest = $("#rest-btn");
  rest.classList.toggle("active", frozen);
  rest.setAttribute("aria-pressed", frozen);
  rest.title = frozen ? "Unmark rest day" : "Mark today a rest day";
  rest.setAttribute("aria-label", rest.title);
}

function celebrate() {
  $("#flame").classList.add("celebrate");
  setTimeout(() => $("#flame").classList.remove("celebrate"), 700);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const bits = ["🐸", "💚", "🧡", "✨"];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("span");
    s.className = "confetti";
    s.textContent = bits[i % bits.length];
    s.style.left = 10 + Math.random() * 80 + "vw";
    s.style.top = 5 + Math.random() * 20 + "vh";
    s.style.animationDelay = Math.random() * 300 + "ms";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1800);
  }
}

// ===== Picker / claim flow =====

function openClaim(slot) {
  claimSlot = slot;
  const p = (data.profiles || {})[slot];
  $("#claim-form").hidden = false;
  $("#claim-title").textContent = p ? `Welcome back, ${p.name}!` : "Hi, new froggie!";
  $("#claim-name-field").hidden = !!p;
  $("#claim-name").required = !p;
  $("#claim-error").hidden = true;
  $("#claim-pin").value = "";
  (p ? $("#claim-pin") : $("#claim-name")).focus();
}

$("#screen-picker").addEventListener("click", (e) => {
  const card = e.target.closest(".frog-card");
  if (card) openClaim(card.dataset.slot);
});
$("#claim-cancel").addEventListener("click", () => { $("#claim-form").hidden = true; claimSlot = null; });

$("#claim-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const pin = $("#claim-pin").value;
  const p = (data.profiles || {})[claimSlot];
  if (p) {
    // ponytail: plaintext PIN — it's a couple's exercise app, not a bank.
    if (p.pin !== pin) { $("#claim-error").hidden = false; return; }
  } else {
    store.patch(["profiles", claimSlot], { name: $("#claim-name").value.trim() || "Froggie", pin });
  }
  me = claimSlot;
  localStorage.setItem("froggie.me", me);
  $("#claim-form").hidden = true;
  render();
});

// ===== Actions =====

$("#checkin-btn").addEventListener("click", () => {
  store.patch(["checkins", dayKey(new Date()), me], true);
});

$("#undo-btn").addEventListener("click", () => {
  store.patch(["checkins", dayKey(new Date()), me], null);
});

$("#rest-btn").addEventListener("click", () => {
  const k = dayKey(new Date());
  const frozen = !!(data.checkins?.[k]?.freeze);
  store.patch(["checkins", k, "freeze"], frozen ? null : true);
});

// Re-render when the date may have changed (app left open overnight)
document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });

// ===== Boot =====

(async () => {
  // The room secret travels in the shared link (…/#secret-pond), not the public
  // repo: first visit stores it, so the installed PWA works without the hash.
  const hashRoom = decodeURIComponent(location.hash.slice(1));
  if (hashRoom) localStorage.setItem("froggie.roomId", hashRoom);
  const room = localStorage.getItem("froggie.roomId") || window.ROOM_ID;
  store = configured ? await firebaseStore(window.FIREBASE_CONFIG, room) : localStore();
  store.subscribe((d) => { data = d || {}; render(); });
})();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js");
}

// ===== Self-test: open index.html?test, check the console =====
if (location.search.includes("test")) {
  const t = new Date("2026-07-12T12:00:00");
  const k = (n) => dayKey(addDays(t, -n));
  const c = { [k(0)]: { p1: true, p2: true }, [k(1)]: { p1: true, p2: true }, [k(2)]: { p1: true } };
  console.assert(currentStreak(c, t) === 2, "streak counts consecutive both-days");
  console.assert(currentStreak({ [k(1)]: { p1: true, p2: true } }, t) === 1, "open today doesn't break streak");
  console.assert(currentStreak({}, t) === 0, "empty history = 0");
  const f = { [k(1)]: { p1: true, p2: true }, [k(2)]: { freeze: true }, [k(3)]: { p1: true, p2: true } };
  console.assert(currentStreak(f, t) === 2, "freeze bridges the streak without growing it");
  console.assert(currentStreak({ [k(1)]: { freeze: true } }, t) === 0, "freeze alone doesn't create a streak");
  const h = {
    [k(9)]: { p1: true, p2: true }, [k(8)]: { p1: true, p2: true }, [k(7)]: { p1: true, p2: true },
    [k(5)]: { p1: true, p2: true }, [k(4)]: { freeze: true }, [k(3)]: { p1: true, p2: true },
  };
  console.assert(bestStreak(h, t) === 3, "bestStreak finds longest historical run");
  console.assert(daysCompleted(h) === 5, "daysCompleted counts both-days");
  console.assert(dayState(c, t, t) === "both", "today both");
  console.assert(dayState(c, addDays(t, -2), t) === "half", "half day");
  console.assert(dayState(c, addDays(t, -3), t) === "missed", "missed day");
  console.assert(dayState(f, addDays(t, -2), t) === "freeze", "freeze day");
  console.assert(dayState({}, t, t) === "today", "today open");
  console.log("✅ Froggie self-test passed");
}
