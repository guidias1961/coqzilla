/* ===========================
   COQZILLA Site Script
   - Uses <video id="coq-video"> in hero
   - Konami Roar Mode with WebAudio
   - Copy to clipboard
   - COQ Power counter (localStorage)
   - Reduced motion safe
   - GSAP optional
=========================== */

(() => {
  "use strict";

  /* ---------- Config: update here ---------- */
  const CONTRACT_ADDRESS = "0x92157F0F9E1C535e3B5a6F541Ab4AfFB1c6b4238";
  const BUY_URL = "https://pump.tires/token/0x92157F0F9E1C535e3B5a6F541Ab4AfFB1c6b4238";
  const CHART_URL = "https://pump.tires/token/0x92157F0F9E1C535e3B5a6F541Ab4AfFB1c6b4238";
  const TELEGRAM_URL = "https://t.me/COQZPLS";
  const TWITTER_URL = "https://x.com/COQZPLS";

  /* ---------- Helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setAttrIf(el, attr, val) {
    if (el && val) el.setAttribute(attr, val);
  }

  function setTextIf(el, val) {
    if (el && val != null) el.textContent = String(val);
  }

  function shortAddr(addr) {
    if (!addr || addr.length < 10) return addr || "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  /* ---------- Populate links and contract chips ---------- */
  function populateLinks() {
    // data-url targets
    $$("[data-url='buy']").forEach(a => setAttrIf(a, "href", BUY_URL));
    $$("[data-url='chart']").forEach(a => setAttrIf(a, "href", CHART_URL));
    $$("[data-url='telegram']").forEach(a => setAttrIf(a, "href", TELEGRAM_URL));
    $$("[data-url='twitter']").forEach(a => setAttrIf(a, "href", TWITTER_URL));

    // contract text chips
    $$("[data-contract]").forEach(el => setTextIf(el, CONTRACT_ADDRESS));
    $$("[data-contract-short]").forEach(el => setTextIf(el, shortAddr(CONTRACT_ADDRESS)));

    // copy buttons
    $$("[data-copy='contract']").forEach(btn => {
      btn.addEventListener("click", () => copyToClipboard(CONTRACT_ADDRESS, btn));
    });
  }

  /* ---------- Clipboard ---------- */
  async function copyToClipboard(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      flashLabel(btn, "Copied");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        flashLabel(btn, "Copied");
      } catch {
        flashLabel(btn, "Failed");
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  function flashLabel(el, msg) {
    if (!el) return;
    const prev = el.getAttribute("data-label-prev");
    if (!prev) el.setAttribute("data-label-prev", el.textContent || "");
    el.textContent = msg;
    setTimeout(() => {
      el.textContent = el.getAttribute("data-label-prev") || "";
    }, 1200);
  }

  /* ---------- COQ Power counter ---------- */
  const COQ_POWER_KEY = "coq_power_clicks";
  function getCoqPower() {
    const n = parseInt(localStorage.getItem(COQ_POWER_KEY) || "0", 10);
    return Number.isFinite(n) ? n : 0;
  }
  function addCoqPower(n = 1) {
    const v = getCoqPower() + n;
    localStorage.setItem(COQ_POWER_KEY, String(v));
    updateCoqPowerUI();
  }
  function updateCoqPowerUI() {
    const el = $("#coq-power");
    if (el) el.textContent = String(getCoqPower());
  }

  function wirePowerClicks() {
    // count clicks on all primary CTAs and nav links
    const targets = $$(".btn, a[href], button");
    targets.forEach(t => {
      t.addEventListener("click", () => addCoqPower(1), { passive: true });
    });
  }

  /* ---------- Hero video handling ---------- */
  function setupHeroVideo() {
    const vid = $("#coq-video");
    if (!vid) return;

    // Ensure only video is visible: hide any stray <img> inside hero if exists
    $$(".hero-image img").forEach(img => { img.style.display = "none"; });

    // Reduced motion
    if (prefersReduced) {
      vid.removeAttribute("autoplay");
      try { vid.pause(); } catch {}
    }

    // Robust autoplay
    const tryPlay = () => vid.play().catch(() => {});
    ["loadeddata", "canplay", "canplaythrough"].forEach(ev =>
      vid.addEventListener(ev, tryPlay)
    );
    if (document.visibilityState === "visible") tryPlay();
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && vid.paused) tryPlay();
    });

    // Idle animation via GSAP if available
    if (window.gsap && !prefersReduced) {
      gsap.to(vid, { y: 10, rotation: 2, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }
  }

  /* ---------- Random micro-roars (visual) ---------- */
  let roarModeActive = false;
  function setupRandomRoars() {
    const vid = $("#coq-video");
    if (!vid || prefersReduced) return;
    setInterval(() => {
      if (!roarModeActive && Math.random() < 0.28) {
        vid.classList.add("coq-roar");
        setTimeout(() => vid.classList.remove("coq-roar"), 500);
      }
    }, 15000);
  }

  /* ---------- Konami Code -> Roar Mode ---------- */
  const KONAMI = [38,38,40,40,37,39,37,39,66,65]; // up up down down left right left right b a
  let konamiBuf = [];

  function setupKonami() {
    window.addEventListener("keydown", e => {
      konamiBuf.push(e.keyCode || e.which);
      if (konamiBuf.length > KONAMI.length) konamiBuf.shift();
      if (KONAMI.every((k, i) => konamiBuf[i] === k)) {
        activateRoarMode();
        konamiBuf = [];
      }
    });
  }

  function activateRoarMode() {
    if (roarModeActive) return;
    roarModeActive = true;

    document.body.classList.add("roar-mode");
    const indicator = $("#roar-indicator");
    if (indicator) indicator.classList.add("active");

    playRoarSound();

    const vid = $("#coq-video");
    if (vid) {
      vid.classList.add("coq-roar");
      setTimeout(() => vid.classList.remove("coq-roar"), 600);
    }
    // auto deactivate after 10s
    setTimeout(() => { if (roarModeActive) deactivateRoarMode(); }, 10000);
  }

  function deactivateRoarMode() {
    roarModeActive = false;
    document.body.classList.remove("roar-mode");
    const indicator = $("#roar-indicator");
    if (indicator) indicator.classList.remove("active");
    stopRoarSound();
  }

  /* ---------- WebAudio Roar ---------- */
  let audioCtx = null;
  let noiseNode = null;
  let lowpass = null;
  let gain = null;

  function playRoarSound() {
    if (prefersReduced) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const bufferSize = 2 * audioCtx.sampleRate;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      // pinkish noise
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        data[i] = pink * 0.16;
      }
      noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;

      lowpass = audioCtx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 800;
      lowpass.Q.value = 0.7;

      gain = audioCtx.createGain();
      gain.gain.value = 0.0001;

      noiseNode.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(audioCtx.destination);

      noiseNode.start();

      // fade in then out
      const now = audioCtx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.linearRampToValueAtTime(0.6, now + 0.25);
      gain.gain.linearRampToValueAtTime(0.45, now + 1.0);
      gain.gain.linearRampToValueAtTime(0.0, now + 1.8);
      setTimeout(stopRoarSound, 1900);
    } catch (e) {
      // silent fail
    }
  }

  function stopRoarSound() {
    try {
      if (noiseNode) { noiseNode.stop(0); noiseNode.disconnect(); noiseNode = null; }
      if (lowpass) { lowpass.disconnect(); lowpass = null; }
      if (gain) { gain.disconnect(); gain = null; }
    } catch {}
  }

  /* ---------- Hidden console easter egg ---------- */
  window.coq = function coq() {
    const art = [
      "           __",
      "         <(o )___",
      "          ( ._> /   COQZILLA",
      "           `---' "
    ].join("\n");
    // eslint-disable-next-line no-console
    console.log(art);
    const banner = $("#aircoq-banner");
    if (banner) banner.classList.add("reveal");
  };

  /* ---------- Init ---------- */
  function init() {
    populateLinks();
    updateCoqPowerUI();
    wirePowerClicks();
    setupHeroVideo();
    setupRandomRoars();
    setupKonami();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
// HERO VIDEO: autoplay robusto + fallback de interação
document.addEventListener('DOMContentLoaded', () => {
  const v = document.getElementById('coq-video');
  if (!v) return;

  v.muted = true;           // requerido para autoplay
  v.setAttribute('muted', '');
  v.playsInline = true;     // iOS
  v.autoplay = true;
  v.loop = true;

  const tryPlay = () => v.play().catch(() => {});
  if (v.readyState >= 2) tryPlay();
  else v.addEventListener('canplay', tryPlay, { once: true });

  // Desbloqueia autoplay no primeiro gesto do usuário (mobile)
  ['touchstart','click','keydown','scroll'].forEach(evt => {
    window.addEventListener(evt, tryPlay, { once: true, passive: true });
  });
});

// (Opcional) se ainda usar GSAP, mude o alvo para o vídeo:
if (typeof gsap !== 'undefined') {
  const el = document.querySelector('#coq-video');
  if (el) {
    gsap.to('#coq-video', { y: 10, rotation: 2, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
  }
}

