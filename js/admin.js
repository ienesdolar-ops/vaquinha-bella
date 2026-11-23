const C = window.VAQUINHA;
const $ = (s) => document.querySelector(s);
const V = "10.12.2";

if (!C.firebase.apiKey) {
  $("#msg").textContent = "O Firebase ainda não foi configurado em js/config.js. Veja o LEIA-ME.md.";
  $("#login").disabled = true;
} else {
  const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
  const { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
  const { getFirestore, doc, getDoc, setDoc } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
  const app = initializeApp(C.firebase);
  const auth = getAuth(app), db = getFirestore(app);
  const ref = doc(db, "vaquinha", "status");
  let doadores = [];

  const preview = () => ($("#usdPreview").textContent = "≈ US$ " + Math.round((+$("#brl").value || 0) / C.cotacaoBRL).toLocaleString("pt-BR") + " no site");
  const draw = () => {
    $("#list").innerHTML = "";
    doadores.forEach((d, i) => {
      const li = document.createElement("li");
      li.textContent = d.nome + (d.valor ? ` — US$ ${d.valor}` : "");
      const x = document.createElement("button"); x.className = "x"; x.textContent = "×";
      x.onclick = () => { doadores.splice(i, 1); draw(); };
      li.append(x); $("#list").append(li);
    });
  };

  $("#login").onclick = async () => {
    try { await signInWithEmailAndPassword(auth, $("#email").value, $("#pass").value); }
    catch { $("#msg").textContent = "E-mail ou senha incorretos."; }
  };
  $("#logout").onclick = () => signOut(auth);
  $("#brl").oninput = preview;
  $("#add").onclick = () => {
    const nome = $("#dName").value.trim(); if (!nome) return;
    doadores.unshift({ nome, valor: +$("#dVal").value || null });
    $("#dName").value = $("#dVal").value = ""; draw();
  };
  $("#save").onclick = async () => {
    await setDoc(ref, { arrecadadoBRL: +$("#brl").value || 0, apoiadores: +$("#sup").value || 0, doadores, atualizado: Date.now() });
    $("#saved").textContent = "Salvo ✔ O site já foi atualizado.";
  };

  onAuthStateChanged(auth, async (user) => {
    $("#loginBox").hidden = !!user; $("#panel").hidden = !user;
    if (!user) return;
    const s = await getDoc(ref); const d = s.exists() ? s.data() : {};
    $("#brl").value = d.arrecadadoBRL ?? C.arrecadadoBRL;
    $("#sup").value = d.apoiadores ?? C.apoiadoresIniciais;
    doadores = d.doadores || []; draw(); preview();
  });
}
