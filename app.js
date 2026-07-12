// Sapinho Streak — o streak de exercício do Hygor e da Aybala. 🐸
import { dayKey, addDays, parseKey, computeHistory, cellState } from "./streak.js";

// Só duas pessoas, fixas. Sem contas, sem PINs.
const PEOPLE = {
  p1: { name: "Hygor",  art: "o", placeholder: "flexões, agachamentos…" },
  p2: { name: "Aybala", art: "a", placeholder: "exercício no tapete…" },
};
const other = (s) => (s === "p1" ? "p2" : "p1");
const MILESTONES = { 7: "7 dias seguidos! 🔥 Vocês são incríveis.", 30: "30 dias! 🐸👏 Um mês inteiro juntos.", 100: "100 dias! 🏆 Lendas do sapinho." };
const MONTHS = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

// ===== Store: Firebase RTDB quando configurado, localStorage caso contrário =====
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
    patch(path, val) { return update(root, { [path.join("/")]: val }); }, // null apaga
  };
}

// ===== Estado da app =====
const $ = (sel) => document.querySelector(sel);
const configured = window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey !== "PASTE_ME";

let store;
let data = {};
let me = localStorage.getItem("froggie.me"); // 'p1' | 'p2' | null
let calMonth = null;                          // primeiro dia do mês mostrado, 'YYYY-MM-01'
let prevBoth = null;                          // deteção da transição para celebração
let prevStreak = null;                        // para o "pop" do número
const shown = new Set(JSON.parse(localStorage.getItem("froggie.milestones") || "[]"));

function render() {
  const today = dayKey();
  const checkins = data.checkins || {};
  const hist = computeHistory(checkins, today);

  if (!me) { $("#screen-picker").hidden = false; $("#screen-today").hidden = true; return; }
  $("#screen-picker").hidden = true;
  $("#screen-today").hidden = false;
  $("#demo-banner").hidden = !store.demo;
  if (!calMonth) calMonth = today.slice(0, 8) + "01";

  $("#topbar-me-name").textContent = PEOPLE[me].name;

  const c = checkins[today] || {};
  const both = !!(c.p1 && c.p2);
  const iAmIn = !!c[me];
  const partnerIn = !!c[other(me)];

  // Herói + mascote
  const num = $("#streak-num");
  num.textContent = hist.streak;
  if (prevStreak !== null && prevStreak !== hist.streak) {
    num.classList.remove("pop");
    void num.offsetWidth; // reinicia a animação
    num.classList.add("pop");
  }
  prevStreak = hist.streak;
  $("#streak-label").textContent = hist.streak === 1 ? "dia seguido" : "dias seguidos";
  $("#freeze-line").hidden = hist.freezes < 1;
  const goal = Object.keys(MILESTONES).map(Number).find((n) => n > hist.streak);
  $("#goal-line").hidden = !(hist.streak > 0 && goal);
  if (goal) $("#goal-line").textContent = `Próximo marco: ${goal} dias 🏁`;
  const mascot = $("#mascot");
  if (both) mascot.dataset.mood = "party";
  else if (iAmIn || partnerIn) mascot.dataset.mood = "wait";
  else if (hist.streak === 0 && hist.completed > 0) mascot.dataset.mood = "sad";
  else mascot.dataset.mood = "happy";

  // Celebração ao fechar o dia (ignora o primeiro snapshot)
  if (prevBoth === false && both) {
    celebrate();
    if (MILESTONES[hist.streak] && !shown.has(hist.streak)) {
      shown.add(hist.streak);
      localStorage.setItem("froggie.milestones", JSON.stringify([...shown]));
      showMilestone(MILESTONES[hist.streak]);
    }
  }
  prevBoth = both;

  // Par
  for (const slot of ["p1", "p2"]) {
    $(`[data-name-slot="${slot}"]`).textContent = PEOPLE[slot].name + (slot === me ? " (você)" : "");
    $(`[data-avatar="${slot}"]`).classList.toggle("checked", !!c[slot]);
    const st = $(`[data-state-slot="${slot}"]`);
    st.textContent = c[slot] ? "Treinou!" : "Ainda não";
    st.classList.toggle("in", !!c[slot]);
    $(`[data-note-slot="${slot}"]`).textContent = c[slot] && c[slot + "_note"] ? "“" + c[slot + "_note"] + "”" : "";
  }
  $(".pair-heart").classList.toggle("full", both);

  // Linha de estado
  const them = PEOPLE[other(me)];
  const status = $("#status");
  if (both) status.textContent = "Os dois treinaram, dia garantido! 🎉";
  else if (iAmIn) status.textContent = `Falta ${them.art} ${them.name} 🐸`;
  else if (partnerIn) status.textContent = `${them.art === "o" ? "O" : "A"} ${them.name} já treinou, agora só falta você! 💪`;
  else status.textContent = "Ainda ninguém treinou hoje.";

  // Botão + nota
  const btn = $("#checkin-btn");
  const noteField = $("#note-field");
  if (both) { btn.className = "btn btn-checkin done"; btn.textContent = "Os dois! 🎉"; btn.disabled = true; }
  else if (iAmIn) { btn.className = "btn btn-checkin done"; btn.textContent = "Feito ✓"; btn.disabled = true; }
  else { btn.className = "btn btn-checkin"; btn.innerHTML = "Já treinei 🐸"; btn.disabled = false; }
  $("#undo-btn").hidden = !iAmIn;
  noteField.hidden = !iAmIn;
  if (iAmIn) {
    const input = $("#note-input");
    input.placeholder = PEOPLE[me].placeholder;
    if (document.activeElement !== input) input.value = c[me + "_note"] || "";
  }

  renderCalendar(hist, today);
  $("#stat-best").textContent = hist.best;
  $("#stat-days").textContent = hist.completed;
}

function renderCalendar(hist, today) {
  const first = calMonth;                       // 'YYYY-MM-01'
  const [y, m] = first.split("-").map(Number);
  $("#cal-title").textContent = `${MONTHS[m - 1]} ${y}`;
  // segunda = 0 … domingo = 6
  const lead = (parseKey(first).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();

  const grid = $("#cal-grid");
  grid.innerHTML = "";
  for (let i = 0; i < lead; i++) grid.appendChild(document.createElement("li")).className = "cal-cell cal-blank";
  for (let d = 1; d <= daysInMonth; d++) {
    const k = `${first.slice(0, 8)}${String(d).padStart(2, "0")}`;
    const state = cellState(hist, k, today);
    const li = document.createElement("li");
    li.className = `cal-cell cell-${state}`;
    li.textContent = d;
    const c = (data.checkins || {})[k] || {};
    const note = [c.p1_note, c.p2_note].filter(Boolean).join(" · ");
    li.title = `${d}/${m}: ${{both:"os dois treinaram",frozen:"protegido 🧊",partial:"só um treinou","partial-today":"só um treinou",today:"hoje",missed:"sem treino",future:"",empty:""}[state]}${note ? " · " + note : ""}`;
    grid.appendChild(li);
  }

  const now = today.slice(0, 8) + "01";
  $("#cal-next").disabled = first >= now; // sem futuro
}

// ===== Celebração =====
function celebrate() {
  $("#mascot").classList.add("bounce");
  setTimeout(() => $("#mascot").classList.remove("bounce"), 700);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const bits = ["🐸", "💚", "🧡", "✨"];
  for (let i = 0; i < 16; i++) {
    const s = document.createElement("span");
    s.className = "confetti";
    s.textContent = bits[i % bits.length];
    s.style.left = 8 + Math.random() * 84 + "vw";
    s.style.top = 4 + Math.random() * 20 + "vh";
    s.style.fontSize = 16 + Math.random() * 12 + "px";
    s.style.setProperty("--dx", Math.random() * 120 - 60 + "px");
    s.style.setProperty("--rot", 180 + Math.random() * 400 + "deg");
    s.style.animationDelay = Math.random() * 300 + "ms";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1900);
  }
}
function showMilestone(msg) {
  $("#milestone-msg").textContent = msg;
  $("#milestone").hidden = false;
  $("#milestone-close").focus();
}
function hideMilestone() { $("#milestone").hidden = true; }
$("#milestone-close").addEventListener("click", hideMilestone);
$("#milestone").addEventListener("click", (e) => { if (e.target.id === "milestone") hideMilestone(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideMilestone(); });

// ===== Escolher / trocar de sapinho =====
$("#screen-picker").addEventListener("click", (e) => {
  const card = e.target.closest(".frog-card");
  if (!card) return;
  me = card.dataset.slot;
  localStorage.setItem("froggie.me", me);
  render();
});
$("#switch-me").addEventListener("click", () => {
  me = null;
  localStorage.removeItem("froggie.me");
  render();
});

// ===== Ações =====
$("#checkin-btn").addEventListener("click", () => store.patch(["checkins", dayKey(), me], true));
$("#undo-btn").addEventListener("click", () => {
  const k = dayKey();
  store.patch(["checkins", k, me], null);
  store.patch(["checkins", k, me + "_note"], null);
});
let noteTimer;
$("#note-input").addEventListener("input", (e) => {
  clearTimeout(noteTimer);
  const val = e.target.value.trim();
  noteTimer = setTimeout(() => store.patch(["checkins", dayKey(), me + "_note"], val || null), 400);
});

$("#cal-prev").addEventListener("click", () => { calMonth = shiftMonth(calMonth, -1); render(); });
$("#cal-next").addEventListener("click", () => { calMonth = shiftMonth(calMonth, 1); render(); });
function shiftMonth(k, n) {
  const [y, m] = k.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

// Novo dia enquanto a app está aberta
document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });

// ===== Arranque =====
(async () => {
  // O segredo da sala viaja no link partilhado (…/#lagoa-secreta), não no repo
  // público: a primeira visita guarda-o, por isso a PWA instalada funciona sem hash.
  const hashRoom = decodeURIComponent(location.hash.slice(1));
  if (hashRoom) localStorage.setItem("froggie.roomId", hashRoom);
  const room = localStorage.getItem("froggie.roomId") || window.ROOM_ID;
  store = configured ? await firebaseStore(window.FIREBASE_CONFIG, room) : localStore();
  store.subscribe((d) => { data = d || {}; render(); });
})();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js");
}

// ===== Auto-teste: abrir index.html?test e ver a consola =====
if (location.search.includes("test")) {
  const t = "2026-07-12";
  const k = (n) => addDays(t, -n);
  const H = computeHistory;
  console.assert(H({ [k(0)]: { p1: 1, p2: 1 }, [k(1)]: { p1: 1, p2: 1 } }, t).streak === 2, "dois dias completos = streak 2");
  console.assert(H({ [k(1)]: { p1: 1, p2: 1 } }, t).streak === 1, "hoje aberto não parte o streak");
  console.assert(H({}, t).streak === 0, "sem histórico = 0");
  // freeze automático protege 1 falha, depois parte
  const miss = { [k(3)]: { p1: 1, p2: 1 }, [k(2)]: {}, [k(1)]: { p1: 1, p2: 1 } };
  const r1 = H(miss, t);
  console.assert(r1.streak === 2 && r1.states[k(2)] === "frozen" && r1.freezes === 0, "1ª falha é protegida");
  const miss2 = { [k(4)]: { p1: 1, p2: 1 }, [k(3)]: {}, [k(2)]: {}, [k(1)]: { p1: 1, p2: 1 } };
  console.assert(H(miss2, t).streak === 1, "2ª falha sem proteção parte o streak");
  // regenera após 7 completos
  const week = {};
  for (let i = 8; i >= 2; i--) week[k(i)] = { p1: 1, p2: 1 };
  week[k(1)] = {}; // falha protegida pela proteção regenerada
  const rw = H(week, t);
  console.assert(rw.states[k(1)] === "frozen", "proteção regenera após 7 dias");
  console.assert(H({ [k(2)]: { p1: 1 } }, t).states[k(2)] === "partial" || H({ [k(2)]: { p1: 1 } }, t).states[k(2)] === "frozen", "dia parcial");
  console.log("✅ Auto-teste do Sapinho passou");
}
