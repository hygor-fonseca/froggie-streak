// Sapinho Streak — o streak de exercício do Hygor e da Aybala. 🐸
import { dayKey, hourOf, addDays, parseKey, computeHistory, cellState } from "./streak.js";

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
  const both = !!(c.p1 && c.p2);           // ambos TREINARAM de verdade (confete, celebração)
  const iAmIn = !!c[me];
  const partnerIn = !!c[other(me)];
  const frozeToday = !!c[me + "_freeze"];
  const partnerFroze = !!c[other(me) + "_freeze"];
  const dayDone = !!((c[me] || frozeToday) && (c[other(me)] || partnerFroze)); // dia garantido, mesmo com freeze

  // Herói + mascote
  const num = $("#streak-num");
  num.textContent = hist.streak;
  num.classList.toggle("zero", hist.streak === 0);
  if (prevStreak !== null && prevStreak !== hist.streak) {
    num.classList.remove("pop");
    void num.offsetWidth; // reinicia a animação
    num.classList.add("pop");
  }
  prevStreak = hist.streak;
  $("#streak-label").textContent = hist.streak === 1 ? "dia seguido" : "dias seguidos";
  const myFreezes = hist.freezes[me];
  $("#freeze-line").hidden = myFreezes < 1;
  $("#freeze-line").textContent = `${myFreezes} proteç${myFreezes > 1 ? "ões" : "ão"} disponíve${myFreezes > 1 ? "is" : "l"} 🧊`;
  const goal = Object.keys(MILESTONES).map(Number).find((n) => n > hist.streak);
  $("#goal-line").hidden = !(hist.streak > 0 && goal);
  if (goal) $("#goal-line").textContent = `Próximo marco: ${goal} dias 🏁`;
  const hour = hourOf();
  const mascot = $("#mascot");
  if (dayDone) mascot.dataset.mood = "party";              // garantido, relaxa
  else if (hour >= 23 && !iAmIn) mascot.dataset.mood = "panic";   // perdendo a cabeça 😱
  else if (hour >= 21 && !iAmIn) mascot.dataset.mood = "worried"; // reta final 😟
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
    const froze = !!c[slot + "_freeze"];
    $(`[data-name-slot="${slot}"]`).textContent = PEOPLE[slot].name + (slot === me ? " (você)" : "");
    $(`[data-avatar="${slot}"]`).classList.toggle("checked", !!(c[slot] || froze));
    const st = $(`[data-state-slot="${slot}"]`);
    st.textContent = c[slot] ? "Treinou!" : froze ? "Protegido 🧊" : "Ainda não";
    st.classList.toggle("in", !!(c[slot] || froze));
    $(`[data-note-slot="${slot}"]`).textContent = c[slot] && c[slot + "_note"] ? "“" + c[slot + "_note"] + "”" : "";
  }
  $(".pair-heart").classList.toggle("full", both);

  // Linha de estado
  const them = PEOPLE[other(me)];
  const status = $("#status");
  const iAmDone = iAmIn || frozeToday;
  const partnerDone = partnerIn || partnerFroze;
  if (dayDone) status.textContent = both ? "Os dois treinaram, dia garantido! 🎉" : "Dia garantido pela proteção! 🧊";
  else if (iAmDone) status.textContent = `Falta ${them.art} ${them.name} 🐸`;
  else if (partnerDone) status.textContent = `${them.art === "o" ? "O" : "A"} ${them.name} já está, agora só falta você! 💪`;
  else status.textContent = "Ainda ninguém treinou hoje.";

  // Botão + nota
  const btn = $("#checkin-btn");
  const noteField = $("#note-field");
  if (dayDone) { btn.className = "btn btn-checkin done"; btn.textContent = both ? "Os dois! 🎉" : "Dia protegido 🧊"; btn.disabled = true; }
  else if (iAmDone) { btn.className = "btn btn-checkin done"; btn.textContent = frozeToday ? "Protegido 🧊" : "Feito ✓"; btn.disabled = true; }
  else { btn.className = "btn btn-checkin"; btn.innerHTML = "Já treinei 🐸"; btn.disabled = false; }

  // Botão de proteção — alternativa a treinar, só enquanto ainda não agi e tenho proteção.
  // Depois de ativar, o botão principal mostra "Protegido 🧊" e o desfazer reverte.
  const freezeBtn = $("#freeze-btn");
  freezeBtn.hidden = !(!iAmDone && myFreezes > 0);

  $("#undo-btn").hidden = !iAmDone;
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
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal-day";
    btn.textContent = d;
    btn.dataset.day = k;
    if (state === "future" || state === "empty") btn.disabled = true;
    li.appendChild(btn);
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
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { hideMilestone(); hideDay(); } });

// ===== Detalhe do dia =====
const WEEKDAYS = ["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
const STATE_LABELS = {
  both: "Os dois treinaram 🎉",
  frozen: "Dia protegido 🧊",
  partial: "Só um treinou",
  "partial-today": "Só um treinou — hoje ainda",
  today: "Hoje — ninguém ainda",
  missed: "Sem treino",
};
function openDay(k) {
  const c = (data.checkins || {})[k] || {};
  const hist = computeHistory(data.checkins || {}, dayKey());
  const state = cellState(hist, k, dayKey());
  if (state === "future" || state === "empty") return;
  const [y, m, d] = k.split("-").map(Number);
  const dt = parseKey(k);
  $("#day-title").textContent = `${d} de ${MONTHS[m - 1]}`;
  $("#day-state").textContent = `${WEEKDAYS[dt.getUTCDay()]} · ${STATE_LABELS[state] || ""}`;
  for (const slot of ["p1", "p2"]) {
    const froze = !!c[slot + "_freeze"];
    const trained = !!c[slot];
    $(`[data-day-state-slot="${slot}"]`).textContent = trained ? "Treinou" : froze ? "Protegido 🧊" : "Não treinou";
    $(`[data-day-state-slot="${slot}"]`).classList.toggle("in", trained || froze);
    const note = c[slot + "_note"];
    $(`[data-day-note-slot="${slot}"]`).textContent = note ? `“${note}”` : (trained ? "(sem nota)" : "");
  }
  $("#day-sheet").hidden = false;
  $("#day-close").focus();
}
function hideDay() { $("#day-sheet").hidden = true; }
$("#day-close").addEventListener("click", hideDay);
$("#day-sheet").addEventListener("click", (e) => { if (e.target.id === "day-sheet") hideDay(); });
$("#cal-grid").addEventListener("click", (e) => {
  const btn = e.target.closest(".cal-day");
  if (btn && !btn.disabled) openDay(btn.dataset.day);
});

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
$("#freeze-btn").addEventListener("click", () => store.patch(["checkins", dayKey(), me + "_freeze"], true));
$("#undo-btn").addEventListener("click", () => {
  const k = dayKey();
  store.patch(["checkins", k, me], null);
  store.patch(["checkins", k, me + "_note"], null);
  store.patch(["checkins", k, me + "_freeze"], null);
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
// Tique de minuto: o mascote acompanha o relógio (fica preocupado/pânico ao fim do dia)
setInterval(() => { if (!document.hidden) render(); }, 60_000);

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
  const k = (n) => addDays(t, -n); // k(0) = hoje
  const H = computeHistory;
  const both = { p1: 1, p2: 1 };

  // Básico
  console.assert(H({ [k(1)]: both, [k(0)]: both }, t).streak === 2, "dois dias completos = streak 2");
  console.assert(H({ [k(1)]: both }, t).streak === 1, "hoje aberto não parte o streak");
  const empty = H({}, t);
  console.assert(empty.streak === 0 && empty.freezes.p1 === 0 && empty.freezes.p2 === 0, "sem histórico = 0 e sem proteções");
  console.assert(H({ [k(2)]: { p1: 1 } }, t).states[k(2)] === "partial", "dia com só um = parcial");

  // Ganha 1 proteção cada após 3 dias reais seguidos
  const earn = H({ [k(2)]: both, [k(1)]: both, [k(0)]: both }, t);
  console.assert(earn.streak === 3 && earn.freezes.p1 === 1 && earn.freezes.p2 === 1, "3 dias reais = +1 proteção cada");

  // Sem proteção, um dia perdido parte o streak
  console.assert(H({ [k(2)]: both, [k(1)]: {} }, t).streak === 0, "sem proteção, falha parte o streak");

  // Auto-freeze: com saldo, dia perdido é protegido e consome saldo
  const auto = H({ [k(4)]: both, [k(3)]: both, [k(2)]: both, [k(1)]: {} }, t);
  console.assert(auto.streak === 4 && auto.states[k(1)] === "frozen", "dia perdido é auto-protegido");
  console.assert(auto.freezes.p1 === 0 && auto.freezes.p2 === 0, "auto-freeze consome saldo dos dois");

  // Freeze manual: p1 usa proteção, p2 treina = dia completo; consome só o saldo do p1
  const manual = H({ [k(4)]: both, [k(3)]: both, [k(2)]: both, [k(1)]: { p2: 1, p1_freeze: true } }, t);
  console.assert(manual.streak === 4 && manual.states[k(1)] === "frozen", "freeze manual + parceiro treina = dia completo");
  console.assert(manual.freezes.p1 === 0 && manual.freezes.p2 === 1, "freeze manual consome só o saldo de quem usou");

  // Freeze manual sem saldo é inerte (não fecha o dia)
  console.assert(H({ [k(1)]: { p2: 1, p1_freeze: true } }, t).streak === 0, "freeze sem saldo não protege");

  // Cap de 2 por pessoa mesmo ganhando 3 vezes (9 dias reais)
  const many = {};
  for (let i = 8; i >= 0; i--) many[k(i)] = both;
  const cap = H(many, t);
  console.assert(cap.streak === 9 && cap.freezes.p1 === 2 && cap.freezes.p2 === 2, "proteção não passa de 2 por pessoa");

  console.log("✅ Auto-teste do Sapinho passou");
}
