// streak.js — pure streak logic for Sapinho Streak. No DOM, no Firebase.
// Everything is derived from the checkins history so there's no stored state
// to drift. Run the asserts at the bottom of app.js (open with ?test).

const TZ = "Europe/Lisbon"; // shared day boundary, whatever timezone each phone is in

// Today's calendar date in Lisbon, as YYYY-MM-DD.
export function dayKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

// Current hour (0–23) in the shared timezone, so the mascot can react to the
// end of the day. `% 24` guards against the "24" some engines emit at midnight.
export function hourOf(d = new Date()) {
  const s = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", hour12: false })
    .formatToParts(d).find((p) => p.type === "hour").value;
  return Number(s) % 24;
}

// Calendar-date math on YYYY-MM-DD strings (UTC noon avoids DST edge slips).
export function parseKey(k) {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}
export function keyOf(dt) { return dt.toISOString().slice(0, 10); }
export function addDays(k, n) {
  const dt = parseKey(k);
  dt.setUTCDate(dt.getUTCDate() + n);
  return keyOf(dt);
}

// Walk every day from the first check-in to today, applying the streak rules
// once. Returns the current streak, best streak, freezes left, completed-day
// count, and a per-day state map for the calendar.
//
// Rules (per spec):
//  - A day counts when BOTH are "done" — trained OR shielded by a freeze.
//  - Each PERSON has their own freeze balance (cap 2). A person's freeze is used
//    either manually ahead of time (`pN_freeze` on the check-in) or automatically
//    on an incomplete PAST day; a frozen day keeps the streak alive.
//  - The couple earns +1 freeze each (cap 2) after 3 days in a row where BOTH
//    actually trained (no freeze). Any freeze use breaks that run.
//  - Today is never penalised while it's still open.
export function computeHistory(checkins, todayKey = dayKey()) {
  const keys = Object.keys(checkins || {}).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
  const states = {};
  if (!keys.length || keys[0] > todayKey) {
    return { streak: 0, best: 0, freezes: { p1: 0, p2: 0 }, completed: 0, firstKey: null, states };
  }

  let streak = 0, best = 0, completed = 0, coupleRun = 0;
  const freezes = { p1: 0, p2: 0 };
  const firstKey = keys[0];

  for (let k = firstKey; k <= todayKey; k = addDays(k, 1)) {
    const c = checkins[k] || {};
    let p1_done = !!c.p1, p2_done = !!c.p2; // trained for real
    let frozen_p1 = false, frozen_p2 = false;

    // Manual freeze (activated ahead of time) — consumes that person's own balance.
    if (!p1_done && c.p1_freeze && freezes.p1 > 0) { freezes.p1--; p1_done = true; frozen_p1 = true; }
    if (!p2_done && c.p2_freeze && freezes.p2 > 0) { freezes.p2--; p2_done = true; frozen_p2 = true; }

    // Today is still open — no penalty.
    if (k === todayKey && !(p1_done && p2_done)) {
      states[k] = (p1_done !== p2_done) ? "partial-today" : "today";
      continue;
    }

    // Auto-freeze a missed past day, per person, if that person has a freeze left.
    if (k < todayKey) {
      if (!p1_done && freezes.p1 > 0) { freezes.p1--; p1_done = true; frozen_p1 = true; }
      if (!p2_done && freezes.p2 > 0) { freezes.p2--; p2_done = true; frozen_p2 = true; }
    }

    if (p1_done && p2_done) {
      streak++; completed++;
      if (streak > best) best = streak;
      if (c.p1 && c.p2) { // both actually trained (no freeze)
        coupleRun++;
        if (coupleRun >= 3) {
          freezes.p1 = Math.min(2, freezes.p1 + 1);
          freezes.p2 = Math.min(2, freezes.p2 + 1);
          coupleRun = 0;
        }
      } else {
        coupleRun = 0; // a freeze used = doesn't count toward earning protection
      }
      states[k] = (frozen_p1 || frozen_p2) ? "frozen" : "both";
    } else {
      streak = 0; coupleRun = 0;
      states[k] = (p1_done !== p2_done) ? "partial" : "missed";
    }
  }
  return { streak, best, freezes, completed, firstKey, states };
}

// Calendar cell state for any day, given a computed history.
export function cellState(hist, k, todayKey = dayKey()) {
  if (k > todayKey) return "future";
  if (hist.firstKey && k < hist.firstKey) return "empty";
  return hist.states[k] || "empty";
}
