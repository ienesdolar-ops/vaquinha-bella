(() => {
const C = window.VAQUINHA, T = window.I18N;
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const usd = (brl) => brl / C.cotacaoBRL;

let lang = "pt";
let state = { arrecadadoBRL: C.arrecadadoBRL, apoiadores: C.apoiadoresIniciais, doadores: [] };
let amount = C.valores[1];
let tab = "card";

/* ---------- Idioma ---------- */
function detectLang() {
  try { const s = localStorage.getItem("lang"); if (s && T[s]) return s; } catch {}
  return "en";
}
function setLang(l) {
  lang = l; const d = T[l];
  document.documentElement.lang = l;
  document.documentElement.dir = d.dir || "ltr";
  $$("[data-i18n]").forEach((el) => { const k = el.dataset.i18n; if (d[k]) el.textContent = d[k]; });
  $("#langBtn").textContent = `${d.flag} ${d.name} ▾`;
  $$("#langMenu button").forEach((b) => b.setAttribute("aria-current", b.dataset.l === l));
  try { localStorage.setItem("lang", l); } catch {}
  render(false); renderWall(); setupShare();
}
function buildLangMenu() {
  const m = $("#langMenu");
  m.innerHTML = Object.entries(T).map(([k, v]) => `<li><button data-l="${k}">${v.flag} ${v.name}</button></li>`).join("");
  $("#langBtn").onclick = (e) => { e.stopPropagation(); m.hidden = !m.hidden; };
  m.onclick = (e) => { const b = e.target.closest("button"); if (b) { setLang(b.dataset.l); m.hidden = true; } };
  document.addEventListener("click", () => (m.hidden = true));
}

/* ---------- Progresso ---------- */
const fmt = (v) => new Intl.NumberFormat(lang === "pt" ? "pt-BR" : lang, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
let shown = 0;
function render(animate = true) {
  const goal = usd(C.metaBRL), raised = usd(state.arrecadadoBRL);
  const pct = Math.min(100, (raised / goal) * 100);
  $("#goal").textContent = fmt(goal);
  $("#pct").textContent = Math.round(pct) + "%";
  $("#count").textContent = state.apoiadores;
  $("#bar").setAttribute("aria-valuenow", Math.round(pct));
  $("#fill").style.width = pct + "%";
  $$(".station").forEach((s) => s.classList.toggle("on", parseFloat(s.style.getPropertyValue("--p")) <= pct));
  if (!animate) { $("#raised").textContent = fmt(shown || raised); return; }
  const start = performance.now(), from = shown;
  const step = (t) => {
    const k = Math.min(1, (t - start) / 1800), e = 1 - Math.pow(1 - k, 3);
    shown = from + (raised - from) * e;
    $("#raised").textContent = fmt(shown);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function renderWall() {
  const w = $("#wall");
  if (!state.doadores.length) { w.innerHTML = `<li>${T[lang].wallEmpty}</li>`; return; }
  w.innerHTML = state.doadores.map((d) => {
    const li = document.createElement("li");
    li.textContent = "🇬🇧 " + d.nome + (d.valor ? " · " : "");
    if (d.valor) { const b = document.createElement("b"); b.textContent = fmt(d.valor); li.append(b); }
    return li.outerHTML;
  }).join("");
}

/* ---------- Firebase (opcional) ---------- */
async function loadFirebase() {
  if (!C.firebase.apiKey) return;
  try {
    const V = "10.12.2";
    const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
    const { getFirestore, doc, onSnapshot } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
    const db = getFirestore(initializeApp(C.firebase));
    onSnapshot(doc(db, "vaquinha", "status"), (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      state = { arrecadadoBRL: d.arrecadadoBRL ?? state.arrecadadoBRL, apoiadores: d.apoiadores ?? state.apoiadores, doadores: d.doadores || [] };
      render(); renderWall();
    });
  } catch (e) { console.warn("Firebase indisponível", e); }
}

/* ---------- Modal de doação ---------- */
function buildBooths() {
  const b = $("#booths");
  b.innerHTML = C.valores.map((v) => `<button class="booth" data-v="${v}">$${v}</button>`).join("") +
    `<button class="booth" data-v="other" data-i18n="other">${T[lang].other}</button>`;
  b.onclick = (e) => {
    const t = e.target.closest(".booth"); if (!t) return;
    $$(".booth").forEach((x) => x.classList.remove("sel")); t.classList.add("sel");
    const other = t.dataset.v === "other";
    $("#customAmount").hidden = !other;
    if (other) $("#customAmount").focus(); else amount = +t.dataset.v;
  };
  b.querySelector(`[data-v="${amount}"]`)?.classList.add("sel");
  $("#customAmount").oninput = (e) => (amount = Math.max(1, +e.target.value || 0));
}
function setTab(t) {
  tab = t;
  $$(".tab").forEach((x) => x.classList.toggle("active", x.dataset.tab === t));
  $$(".pane").forEach((p) => (p.hidden = !p.dataset.pane.split(" ").includes(t)));
  $("#payCard").hidden = t !== "card"; $("#cardNote").hidden = true;
  $("#payPaypal").hidden = t !== "paypal";
  if (t === "pix") buildPix();
}
function openModal() { $("#modal").hidden = false; setTab(tab); }
function closeModal() { $("#modal").hidden = true; }

/* ---------- Pix (BR Code EMV) ---------- */
function crc16(s) {
  let c = 0xffff;
  for (let i = 0; i < s.length; i++) {
    c ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) c = c & 0x8000 ? (c << 1) ^ 0x1021 : c << 1;
  }
  return (c & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}
const f = (id, v) => id + String(v.length).padStart(2, "0") + v;
function pixPayload() {
  const p = C.pix;
  const gui = f("00", "br.gov.bcb.pix") + f("01", p.chave);
  let s = f("00", "01") + f("26", gui) + f("52", "0000") + f("53", "986") + f("58", "BR") +
    f("59", p.nome.slice(0, 25)) + f("60", p.cidade.slice(0, 15)) + f("62", f("05", "VAQUINHABELLA")) + "6304";
  return s + crc16(s);
}
let pixBuilt = false;
function buildPix() {
  if (pixBuilt) return; pixBuilt = true;
  const code = pixPayload();
  $("#pixCode").value = code;
  if (window.QRCode) new QRCode($("#qr"), { text: code, width: 200, height: 200, colorDark: "#012169" });
}

/* ---------- Pagamentos ---------- */
const appearance = {
  theme: "stripe", labels: "auto", inputs: "spaced",
  variables: {
    borderRadius: "4px", colorBackground: "#ffffff", colorDanger: "#df1b41", colorPrimary: "#0570de",
    colorSuccess: "#00c853", colorText: "#30313d", fontFamily: "default", fontSizeBase: "16px", spacingUnit: "4px",
  },
};
let stripe = null, checkoutForm = null;

async function payCard() {
  if (!amount || amount < 1) return $("#customAmount").focus();
  try {
    if (!stripe) {
      const { publishableKey } = await fetch("/api/config").then((r) => r.json());
      stripe = Stripe(publishableKey);
    }
  } catch {
    // Sem servidor (site estático): usa o Payment Link como alternativa
    return window.open(C.stripeLink, "_blank", "noopener");
  }

  // Mostra o formulário embutido
  $$(".pane").forEach((p) => (p.hidden = p.dataset.pane !== "stripe"));
  $("#chosenAmount").textContent = amount;
  if (checkoutForm) { checkoutForm.unmount?.(); checkoutForm = null; }
  $("#checkout-form").innerHTML = "";

  const clientSecret = fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, lang }),
  }).then((r) => r.json()).then((j) => j.client_secret);

  const checkout = stripe.initCheckoutFormSdk({ clientSecret, appearance });
  checkoutForm = checkout.createForm({ layout: "expanded" });
  checkoutForm.mount("#checkout-form");

  const loadActionsResult = await checkout.loadActions();
  if (loadActionsResult.type === "success") {
    checkoutForm.on("confirm", async (event) => {
      try { await loadActionsResult.actions.confirm({ formConfirmEvent: event }); }
      catch (error) { console.error("Payment confirmation error:", error); }
    });
  }
}
function payPaypal() {
  window.open(`https://www.paypal.com/paypalme/${encodeURIComponent(C.paypalUser)}/${amount}USD`, "_blank", "noopener");
}

/* ---------- Compartilhar ---------- */
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => (t.hidden = true), 1800); }
async function copy(text) { try { await navigator.clipboard.writeText(text); } catch {} toast(T[lang].copied); }
function setupShare() {
  const url = location.href.split("#")[0], msg = `${T[lang].title} 🇬🇧`;
  $("#shareWa").href = `https://wa.me/?text=${encodeURIComponent(msg + " " + url)}`;
  $("#shareX").href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(url)}`;
}

/* ---------- Init ---------- */
buildLangMenu();
lang = detectLang();
buildBooths();
setLang(lang);
render(true);
$$("[data-open-donate]").forEach((b) => (b.onclick = openModal));
$("#closeModal").onclick = closeModal;
$("#modal").onclick = (e) => { if (e.target.id === "modal") closeModal(); };
document.addEventListener("keydown", (e) => e.key === "Escape" && closeModal());
$$(".tab").forEach((t) => (t.onclick = () => setTab(t.dataset.tab)));
$("#payCard").onclick = payCard;
$("#payPaypal").onclick = payPaypal;
$("#backAmount").onclick = () => setTab("card");
if (new URLSearchParams(location.search).get("donation") === "success") {
  setTimeout(() => toast("Thank you! 💙 Cheers from Bella 🇬🇧"), 600);
  history.replaceState(null, "", location.pathname);
}
$("#copyPix").onclick = () => copy($("#pixCode").value);
$("#copyLink").onclick = () => copy(location.href.split("#")[0]);
loadFirebase();
})();
