/* ===========================
   COQZILLA Site Script + Burn Altar
   Mantém o comportamento original e adiciona:
   - Conexão via MetaMask
   - Envio de ERC20 para 0xdead
   - Leitura de totalSupply e balanceOf(dead)
   - Assinatura de eventos Transfer para atualizações em tempo real
   - Rugido visual quando detectar queima
=========================== */

(() => {
  "use strict";

  /* ---------- Config do site existente ---------- */
  const CONTRACT_ADDRESS = "000x";
  const BUY_URL = "https://pump.tires/token/";
  const CHART_URL = "https://pump.tires/token/";
  const TELEGRAM_URL = "https://t.me/COQZPLS";
  const TWITTER_URL = "https://x.com/COQZPLS";

  /* ---------- Helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setAttrIf(el, attr, val) { if (el && val) el.setAttribute(attr, val); }
  function setTextIf(el, val) { if (el && val != null) el.textContent = String(val); }
  function shortAddr(addr) { if (!addr || addr.length < 10) return addr || ""; return `${addr.slice(0, 6)}...${addr.slice(-4)}`; }

  /* ---------- Populate links e chips ---------- */
  function populateLinks() {
    $$("[data-url='buy']").forEach(a => setAttrIf(a, "href", BUY_URL));
    $$("[data-url='pump']").forEach(a => setAttrIf(a, "href", BUY_URL)); // correção para markup existente
    $$("[data-url='chart']").forEach(a => setAttrIf(a, "href", CHART_URL));
    $$("[data-url='telegram']").forEach(a => setAttrIf(a, "href", TELEGRAM_URL));
    $$("[data-url='twitter']").forEach(a => setAttrIf(a, "href", TWITTER_URL));
    $$("[data-contract]").forEach(el => setTextIf(el, CONTRACT_ADDRESS));
    $$("[data-contract-short]").forEach(el => setTextIf(el, shortAddr(CONTRACT_ADDRESS)));
    $$("[data-copy='contract']").forEach(btn => { btn.addEventListener("click", () => copyToClipboard(CONTRACT_ADDRESS, btn)); });
  }

  /* ---------- Clipboard ---------- */
  async function copyToClipboard(text, btn) {
    try { await navigator.clipboard.writeText(text); flashLabel(btn, "Copied"); }
    catch {
      const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); flashLabel(btn, "Copied"); } catch { flashLabel(btn, "Failed"); }
      finally { document.body.removeChild(ta); }
    }
  }
  function flashLabel(el, msg) {
    if (!el) return;
    const prev = el.getAttribute("data-label-prev");
    if (!prev) el.setAttribute("data-label-prev", el.textContent || "");
    el.textContent = msg;
    setTimeout(() => { el.textContent = el.getAttribute("data-label-prev") || ""; }, 1200);
  }

  /* ---------- COQ Power counter ---------- */
  const COQ_POWER_KEY = "coq_power_clicks";
  function getCoqPower() { const n = parseInt(localStorage.getItem(COQ_POWER_KEY) || "0", 10); return Number.isFinite(n) ? n : 0; }
  function addCoqPower(n = 1) { const v = getCoqPower() + n; localStorage.setItem(COQ_POWER_KEY, String(v)); updateCoqPowerUI(); }
  function updateCoqPowerUI() { const el = $("#coq-power-display"); if (el) el.textContent = String(getCoqPower()); }
  function wirePowerClicks() { $$(".btn, a[href], button").forEach(t => t.addEventListener("click", () => addCoqPower(1), { passive: true })); }

  /* ---------- Hero video ---------- */
  function setupHeroVideo() {
    const vid = $("#coq-video");
    if (!vid) return;
    if (prefersReduced) { vid.removeAttribute("autoplay"); try { vid.pause(); } catch {} }
    const tryPlay = () => vid.play().catch(() => {});
    ["loadeddata", "canplay", "canplaythrough"].forEach(ev => vid.addEventListener(ev, tryPlay));
    if (document.visibilityState === "visible") tryPlay();
    document.addEventListener("visibilitychange", () => { if (!document.hidden && vid.paused) tryPlay(); });
    if (window.gsap && !prefersReduced) gsap.to(vid, { y: 10, rotation: 2, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
  }

  /* ---------- Micro roars ---------- */
  let roarModeActive = false;
  function setupRandomRoars() {
    const vid = $("#coq-video"); if (!vid || prefersReduced) return;
    setInterval(() => {
      if (!roarModeActive && Math.random() < 0.28) {
        vid.classList.add("coq-roar");
        setTimeout(() => vid.classList.remove("coq-roar"), 500);
      }
    }, 15000);
  }

  /* ---------- Konami Code ---------- */
  const KONAMI = [38,38,40,40,37,39,37,39,66,65];
  let konamiBuf = [];
  function setupKonami() {
    window.addEventListener("keydown", e => {
      konamiBuf.push(e.keyCode || e.which);
      if (konamiBuf.length > KONAMI.length) konamiBuf.shift();
      if (KONAMI.every((k, i) => konamiBuf[i] === k)) { activateRoarMode(); konamiBuf = []; }
    });
  }
  function activateRoarMode() {
    if (roarModeActive) return;
    roarModeActive = true;
    document.body.classList.add("roar-mode");
    const indicator = $("#roar-indicator"); if (indicator) indicator.classList.add("active");
    playRoarSound();
    const vid = $("#coq-video"); if (vid) { vid.classList.add("coq-roar"); setTimeout(() => vid.classList.remove("coq-roar"), 600); }
    setTimeout(() => { if (roarModeActive) deactivateRoarMode(); }, 10000);
  }
  function deactivateRoarMode() {
    roarModeActive = false;
    document.body.classList.remove("roar-mode");
    const indicator = $("#roar-indicator"); if (indicator) indicator.classList.remove("active");
    stopRoarSound();
  }

  /* ---------- WebAudio Roar ---------- */
  let audioCtx = null, noiseNode = null, lowpass = null, gain = null;
  function playRoarSound() {
    if (prefersReduced) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const bufferSize = 2 * audioCtx.sampleRate;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886*b0 + white*0.0555179;
        b1 = 0.99332*b1 + white*0.0750759;
        b2 = 0.96900*b2 + white*0.1538520;
        b3 = 0.86650*b3 + white*0.3104856;
        b4 = 0.55000*b4 + white*0.5329522;
        b5 = -0.7616*b5 - white*0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white*0.5362;
        b6 = white*0.115926;
        data[i] = pink * 0.16;
      }
      noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer; noiseNode.loop = true;
      lowpass = audioCtx.createBiquadFilter(); lowpass.type = "lowpass"; lowpass.frequency.value = 800; lowpass.Q.value = 0.7;
      gain = audioCtx.createGain(); gain.gain.value = 0.0001;
      noiseNode.connect(lowpass); lowpass.connect(gain); gain.connect(audioCtx.destination);
      noiseNode.start();
      const now = audioCtx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.linearRampToValueAtTime(0.6, now + 0.25);
      gain.gain.linearRampToValueAtTime(0.45, now + 1.0);
      gain.gain.linearRampToValueAtTime(0.0, now + 1.8);
      setTimeout(stopRoarSound, 1900);
    } catch {}
  }
  function stopRoarSound() {
    try {
      if (noiseNode) { noiseNode.stop(0); noiseNode.disconnect(); noiseNode = null; }
      if (lowpass) { lowpass.disconnect(); lowpass = null; }
      if (gain) { gain.disconnect(); gain = null; }
    } catch {}
  }

  /* ---------- BURN ALTAR ---------- */
  const DEAD = "0x000000000000000000000000000000000000dEaD";

  // Explorers por chainId
  const EXPLORERS = {
    1: "https://etherscan.io/tx/",
    56: "https://bscscan.com/tx/",
    8453: "https://basescan.org/tx/",
    369: "https://scan.pulsechain.com/tx/",
    1116: "https://snowtrace.io/tx/" // exemplo extra, ajuste conforme necessário
  };

  // ABI mínima ERC-20
  const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  ];

  let provider = null;
  let signer = null;
  let account = null;
  let chainId = null;
  let token = null; // ethers.Contract
  let tokenDecimals = null;
  let tokenSymbol = null;
  let tokenTotalRaw = null;

  function fmtUnits(v, d) { try { return ethers.utils.formatUnits(v, d); } catch { return String(v); } }
  function toUnits(v, d) { return ethers.utils.parseUnits(v, d); }
  function setEl(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
  function setHidden(id, flag) { const el = document.getElementById(id); if (el) el.hidden = flag; }

  async function connectWallet() {
    if (!window.ethereum) { alert("MetaMask not detected."); return; }
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    account = await signer.getAddress();
    const net = await provider.getNetwork();
    chainId = Number(net.chainId || net.chainId?._hex || 0);
    $("#btn-connect").textContent = `Connected ${shortAddr(account)}`;
  }

  async function loadToken() {
    const addr = $("#token-address").value.trim();
    if (!ethers.utils.isAddress(addr)) { alert("Invalid token address"); return; }

    // Provider fallback se não conectado
    if (!provider) {
      provider = window.ethereum
        ? new ethers.providers.Web3Provider(window.ethereum)
        : ethers.getDefaultProvider();
    }
    const readProv = provider.provider ? provider : ethers.getDefaultProvider();
    token = new ethers.Contract(addr, ERC20_ABI, signer || readProv);

    // Metadados
    try {
      const [name, symbol, decimals, total] = await Promise.all([
        token.name().catch(() => "-"),
        token.symbol().catch(() => ""),
        token.decimals().catch(() => 18),
        token.totalSupply()
      ]);
      tokenDecimals = Number(decimals);
      tokenSymbol = String(symbol || "");
      tokenTotalRaw = total;

      // Se usuário preencheu manualmente decimals, respeitar
      const manualDec = $("#burn-decimals").value;
      if (manualDec !== "" && Number.isFinite(Number(manualDec))) tokenDecimals = Number(manualDec);

      setEl("meta-name", name);
      setEl("meta-symbol", tokenSymbol ? `(${tokenSymbol})` : "");
      setEl("meta-supply", fmtUnits(total, tokenDecimals));
      await refreshBurnStats(true);

      subscribeTransfers(); // eventos ao vivo
    } catch (e) {
      console.error(e);
      alert("Could not read token metadata");
    }
  }

  async function refreshBurnStats(updateStats = false) {
    if (!token || tokenDecimals == null) return;
    try {
      const deadBal = await token.balanceOf(DEAD);
      const total = tokenTotalRaw || await token.totalSupply();
      const burned = fmtUnits(deadBal, tokenDecimals);
      const totalFmt = fmtUnits(total, tokenDecimals);
      const circ = Math.max(Number(totalFmt) - Number(burned), 0);

      setEl("meta-burned", burned);
      setEl("meta-circ", String(circ));
      setEl("meta-burned-pct", total.gt(0) ? `${((Number(burned) / Number(totalFmt)) * 100).toFixed(4)}%` : "-");
      setEl("stat-burned", `${burned} ${tokenSymbol || ""}`);
      setEl("stat-circ", `${circ} ${tokenSymbol || ""}`);

      if (updateStats) {
        // animação visual leve
        const altar = $(".roar-stage");
        if (altar) {
          altar.classList.add("stomp-dust");
          setTimeout(() => altar.classList.remove("stomp-dust"), 300);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  function subscribeTransfers() {
    try {
      token.removeAllListeners("Transfer");
    } catch {}
    token.on("Transfer", async (from, to, value, ev) => {
      if (!to) return;
      if (to.toLowerCase() === DEAD.toLowerCase()) {
        // Atualizar UI
        await refreshBurnStats(true);
        pushFeed(ev);
        triggerRoar();
      }
    });
  }

  function pushFeed(ev) {
    const ul = $("#feed-list");
    if (!ul) return;
    const li = document.createElement("li");
    const val = tokenDecimals != null ? fmtUnits(ev.args.value, tokenDecimals) : String(ev.args.value);
    const a = document.createElement("a");
    a.target = "_blank"; a.rel = "noopener";
    const base = EXPLORERS[chainId || 369] || "https://scan.pulsechain.com/tx/";
    a.href = base + ev.transactionHash;
    a.textContent = "tx";
    li.innerHTML = `🔥 burned <code>${val} ${tokenSymbol || ""}</code> `;
    li.appendChild(a);
    ul.prepend(li);

    // manter feed curto
    while (ul.children.length > 25) ul.removeChild(ul.lastChild);

    // exibir atalho de última tx
    const link = $("#last-tx-link");
    if (link) {
      link.href = a.href;
      setHidden("last-tx", false);
    }
  }

  async function burnNow() {
    try {
      if (!signer) await connectWallet();
      const addr = $("#token-address").value.trim();
      if (!ethers.utils.isAddress(addr)) { alert("Invalid token address"); return; }
      if (!token) await loadToken();

      const amountStr = $("#burn-amount").value.trim();
      if (!amountStr || Number(amountStr) <= 0) { alert("Enter amount to burn"); return; }
      const dec = tokenDecimals != null ? tokenDecimals : Number($("#burn-decimals").value) || 18;
      const amount = toUnits(amountStr, dec);

      const tx = await token.connect(signer).transfer(DEAD, amount);
      const btn = $("#btn-burn"); if (btn) btn.disabled = true;
      $("#btn-burn").textContent = "Sending...";
      const receipt = await tx.wait();
      if (btn) { btn.disabled = false; $("#btn-burn").textContent = "Send to 0xdead"; }

      // Atualizar UI
      await refreshBurnStats(true);
      pushFeed({ args: { value: amount }, transactionHash: tx.hash });
      triggerRoar();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Burn failed");
      const btn = $("#btn-burn"); if (btn) { btn.disabled = false; btn.textContent = "Send to 0xdead"; }
    }
  }

  function triggerRoar() {
    const stage = $(".roar-stage");
    if (stage) {
      stage.classList.add("burn-roar");
      setTimeout(() => stage.classList.remove("burn-roar"), 800);
    }
    const vid = $("#coq-video");
    if (vid) {
      vid.classList.add("coq-roar");
      setTimeout(() => vid.classList.remove("coq-roar"), 600);
    }
    playRoarSound();
  }

  function wireBurnAltarUI() {
    const btnConn = $("#btn-connect");
    const btnBurn = $("#btn-burn");
    const inpAddr = $("#token-address");
    const copyDead = $("#copy-dead");

    if (btnConn) btnConn.addEventListener("click", connectWallet);
    if (btnBurn) btnBurn.addEventListener("click", burnNow);
    if (inpAddr) inpAddr.addEventListener("change", loadToken);
    if (copyDead) copyDead.addEventListener("click", () => copyToClipboard(DEAD, copyDead));
  }

  /* ---------- Init ---------- */
  function init() {
    populateLinks();
    updateCoqPowerUI();
    wirePowerClicks();
    setupHeroVideo();
    setupRandomRoars();
    setupKonami();
    wireBurnAltarUI();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

/* Força autoplay robusto no vídeo se necessário */
document.addEventListener('DOMContentLoaded', () => {
  const v = document.getElementById('coq-video');
  if (!v) return;
  v.muted = true; v.setAttribute('muted', ''); v.playsInline = true; v.autoplay = true; v.loop = true;
  const tryPlay = () => v.play().catch(() => {});
  if (v.readyState >= 2) tryPlay(); else v.addEventListener('canplay', tryPlay, { once: true });
  ['touchstart','click','keydown','scroll'].forEach(evt => { window.addEventListener(evt, tryPlay, { once: true, passive: true }); });
});

