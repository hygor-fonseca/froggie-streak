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

const bothIn = (c) => !!(c && c.p1 && c.p2);
const oneIn = (c) => !!(c && (!!c.p1 !== !!c.p2));

// Walk every day from the first check-in to today, applying the streak rules
// once. Returns the current streak, best streak, freezes left, completed-day
// count, and a per-day state map for the calendar.
//
// Rules (per spec):
//  - A day counts only when BOTH check in.
//  - An incomplete PAST day auto-consumes one freeze if available (day is
//    "frozen", streak survives); with no freeze left the streak resets to 0.
//  - Each couple has 1 freeze; it regenerates after 7 completed days in a row.
//  - Today is never penalised while it's still open.
export function computeHistory(checkins, todayKey = dayKey()) {
  const keys = Object.keys(checkins || {}).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
  const states = {};
  if (!keys.length || keys[0] > todayKey) {
    return { streak: 0, best: 0, freezes: 1, completed: 0, firstKey: null, states };
  }

  let streak = 0, best = 0, freezes = 1, run = 0, completed = 0;
  const firstKey = keys[0];

  for (let k = firstKey; k <= todayKey; k = addDays(k, 1)) {
    const c = checkins[k] || {};
    if (k === todayKey && !bothIn(c)) {
      states[k] = oneIn(c) ? "partial-today" : "today"; // open, no penalty
    } else if (bothIn(c)) {
      streak++; completed++; run++;
      if (streak > best) best = streak;
      if (run >= 7) { if (freezes < 1) freezes = 1; run = 0; } // regenerate (cap 1)
      states[k] = "both";
    } else if (freezes > 0) {
      freezes--; run = 0;
      states[k] = "frozen"; // streak protected
    } else {
      streak = 0; run = 0;
      states[k] = oneIn(c) ? "partial" : "missed";
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
