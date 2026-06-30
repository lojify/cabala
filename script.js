/* ====================================================================
   KAOS//STUDIO — script.js
   Vanilla JS + GSAP/ScrollTrigger + Lenis + Howler (com fallback sintetizado).
   Tudo guardado por isMobile / prefersReducedMotion conforme as
   Diretrizes Técnicas Universais.
==================================================================== */

(() => {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------------
     0. DETECÇÃO DE AMBIENTE
  ------------------------------------------------------------------ */
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.innerWidth < 768;
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  const state = {
    horizontalEnabled: !isMobile && !prefersReducedMotion,
    cursorEnabled: !isMobile && !isTouch && !prefersReducedMotion,
    audioOn: false,
  };

  /* ------------------------------------------------------------------
     1. LOADER
  ------------------------------------------------------------------ */
  function initLoader() {
    const bar = document.getElementById("loaderBar");
    const loader = document.getElementById("loader");
    const tl = gsap.timeline({
      onComplete: () => {
        document.body.classList.remove("is-loading");
        gsap.to(loader, {
          autoAlpha: 0,
          duration: prefersReducedMotion ? 0.01 : 0.5,
          ease: "power2.out",
          onComplete: () => loader.remove(),
        });
        revealIntro();
        ScrollTrigger.refresh();
      },
    });
    tl.to(bar, {
      scaleX: 1,
      transformOrigin: "left center",
      duration: prefersReducedMotion ? 0.01 : 1.1,
      ease: "power3.inOut",
    });
  }

  /* ------------------------------------------------------------------
     2. LENIS (scroll suave) integrado ao ticker do GSAP
  ------------------------------------------------------------------ */
  let lenis = null;
  function initLenis() {
    if (prefersReducedMotion) return; // scroll nativo é suficiente e mais previsível
    lenis = new Lenis({
      duration: isMobile ? 0.8 : 1.15,
      smoothWheel: true,
      touchMultiplier: isMobile ? 1.2 : 1,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ------------------------------------------------------------------
     3. SCROLL HORIZONTAL (técnica de pin + translateX)
     Desativado em mobile/reduced-motion: a trilha vira coluna (ver CSS)
     e o usuário simplesmente rola na vertical, nativamente.
  ------------------------------------------------------------------ */
  let horizontalTween = null;
  function initHorizontalScroll() {
    const track = document.getElementById("track");
    const wrapper = document.getElementById("track-wrapper");
    if (!state.horizontalEnabled) return;

    const getDistance = () => track.scrollWidth - window.innerWidth;

    horizontalTween = gsap.to(track, {
      x: () => -getDistance(),
      ease: "none",
      scrollTrigger: {
        trigger: wrapper,
        start: "top top",
        end: () => `+=${getDistance()}`,
        scrub: 0.4,
        pin: true,
        pinType: "transform",
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          gsap.set("#scrollProgress", { scaleX: self.progress, transformOrigin: "left center" });
          updateImageVelocityDistortion(self.getVelocity());
        },
      },
    });

    document.getElementById("scrollCue")?.addEventListener("click", () => {
      const target = window.scrollY + window.innerHeight * 0.9;
      if (lenis) lenis.scrollTo(target, { duration: 1 });
      else window.scrollTo({ top: target, behavior: "smooth" });
    });

    document.querySelectorAll(".hud__navItem").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.target;
        const panel = document.getElementById(id);
        const st = horizontalTween.scrollTrigger;
        const panelLeft = panel.offsetLeft;
        const ratio = panelLeft / getDistance();
        const y = st.start + ratio * (st.end - st.start);
        if (lenis) lenis.scrollTo(y, { duration: 1.1 });
        else window.scrollTo({ top: y, behavior: "smooth" });
      });
    });
  }

  function initVerticalProgressFallback() {
    if (state.horizontalEnabled) return;
    window.addEventListener(
      "scroll",
      () => {
        const p = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
        gsap.set("#scrollProgress", { scaleX: p, transformOrigin: "left center" });
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------------------
     4. TIPOGRAFIA ANIMADA (intro)
  ------------------------------------------------------------------ */
  function revealIntro() {
    const lines = document.querySelectorAll(".glitch-title, .panel__desc, .panel__eyebrow, .scroll-cue");
    if (prefersReducedMotion) {
      gsap.set(lines, { autoAlpha: 1 });
      return;
    }
    gsap.set(lines, { autoAlpha: 0, y: isMobile ? 16 : 28 });
    gsap.to(lines, {
      autoAlpha: 1,
      y: 0,
      duration: isMobile ? 0.5 : 0.9,
      ease: "power3.out",
      stagger: 0.12,
    });
  }

  /* ------------------------------------------------------------------
     5. EFEITO GLITCH — pulso periódico + hover
  ------------------------------------------------------------------ */
  function initGlitch() {
    if (prefersReducedMotion) return;
    const titles = document.querySelectorAll(".glitch-title");

    titles.forEach((title) => {
      title.addEventListener("mouseenter", () => pulseGlitch(title));
    });

    const interval = isMobile ? 6000 : 3200;
    setInterval(() => {
      const t = titles[Math.floor(Math.random() * titles.length)];
      if (t) pulseGlitch(t);
    }, interval);
  }

  function pulseGlitch(el) {
    el.classList.add("is-glitching");
    gsap.fromTo(
      el,
      { x: 0 },
      {
        x: () => gsap.utils.random(-4, 4),
        duration: 0.05,
        repeat: 5,
        yoyo: true,
        ease: "none",
        onComplete: () => {
          gsap.set(el, { x: 0 });
          el.classList.remove("is-glitching");
        },
      }
    );
  }

  /* ------------------------------------------------------------------
     6. DISTORÇÃO DE IMAGENS NO SCROLL (velocidade → skew/scale, só GPU)
  ------------------------------------------------------------------ */
  function updateImageVelocityDistortion(velocity) {
    if (prefersReducedMotion) return;
    const intensity = gsap.utils.clamp(-1, 1, velocity / 2500);
    gsap.to(".distort-img", {
      skewX: intensity * (isMobile ? 4 : 9),
      scale: 1 + Math.abs(intensity) * 0.06,
      filter: `hue-rotate(${intensity * 25}deg) saturate(${1 + Math.abs(intensity) * 0.5})`,
      duration: 0.4,
      ease: "power2.out",
      overwrite: "auto",
    });
  }

  /* ------------------------------------------------------------------
     7. CURSOR CUSTOMIZADO EXTREMO (pincel / pixel) + trilha em canvas
     Desligado em mobile/touch/reduced-motion.
  ------------------------------------------------------------------ */
  function initCursor() {
    if (!state.cursorEnabled) return;
    document.body.classList.add("has-custom-cursor");

    const cursor = document.getElementById("cursor");
    const label = document.getElementById("cursorLabel");
    const canvas = document.getElementById("cursorTrail");
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });

    const trail = [];
    const MAX_TRAIL = 18;
    const colors = ["#FF2E6E", "#00F0FF", "#FFE600"];

    window.addEventListener("mousemove", (e) => {
      const mx = e.clientX;
      const my = e.clientY;
      gsap.to(cursor, { x: mx, y: my, duration: 0.12, ease: "power2.out", overwrite: "auto" });
      trail.push({ x: mx, y: my, life: 1, color: colors[Math.floor(Math.random() * colors.length)] });
      if (trail.length > MAX_TRAIL) trail.shift();
    });

    function paintTrail() {
      ctx.clearRect(0, 0, w, h);
      trail.forEach((p, i) => {
        p.life -= 0.045;
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.color;
        const size = 6 + (i / MAX_TRAIL) * 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      });
      for (let i = trail.length - 1; i >= 0; i--) {
        if (trail[i].life <= 0) trail.splice(i, 1);
      }
      requestAnimationFrame(paintTrail);
    }
    requestAnimationFrame(paintTrail);

    document.querySelectorAll("[data-cursor]").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursor.classList.add("is-active");
        cursor.classList.toggle("is-pixel", el.dataset.cursor === "pixel");
        label.textContent = el.dataset.cursorLabel || "";
      });
      el.addEventListener("mouseleave", () => {
        cursor.classList.remove("is-active", "is-pixel");
        label.textContent = "";
      });
    });
  }

  /* ------------------------------------------------------------------
     8. ÁUDIO — Howler.js com fallback sintetizado via Web Audio API
     (assim o template funciona sem precisar de arquivos .mp3 reais;
     ver assets/audio/README.md para plugar áudio de verdade)
  ------------------------------------------------------------------ */
  const SYNTH_FALLBACK = true;
  let audioCtx = null, droneNodes = null;

  function ensureAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function startSynthDrone() {
    const ctx = ensureAudioCtx();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = "sawtooth"; osc1.frequency.value = 55;
    osc2.type = "sine"; osc2.frequency.value = 56.5;
    gain.gain.value = 0;
    osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
    osc1.start(); osc2.start();
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.2);
    droneNodes = { osc1, osc2, gain };
  }

  function stopSynthDrone() {
    if (!droneNodes) return;
    const { osc1, osc2, gain } = droneNodes;
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);
    setTimeout(() => { osc1.stop(); osc2.stop(); }, 700);
    droneNodes = null;
  }

  function playSynthBlip() {
    const ctx = ensureAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(900 + Math.random() * 600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  }

  /* --- Quando tiver os arquivos reais, troque SYNTH_FALLBACK para false
     e use este bloco (Howler já com a API certa):

     const ambient = new Howl({ src: ["assets/audio/ambient.mp3"], loop: true, volume: 0.2 });
     const click   = new Howl({ src: ["assets/audio/click.mp3"],  volume: 0.5 });
     const glitchSfx = new Howl({ src: ["assets/audio/glitch.mp3"], volume: 0.4 });
     // troque startSynthDrone()/stopSynthDrone() por ambient.play()/ambient.fade(...)
     // e playSynthBlip() por click.play() / glitchSfx.play()
  */

  function initAudio() {
    const btn = document.getElementById("audioToggle");
    const text = btn.querySelector(".hud__audioText");
    const bars = btn.querySelectorAll(".hud__audioBars i");

    let barsTween = null;
    function animateBars(on) {
      if (prefersReducedMotion) return;
      if (on) {
        barsTween = gsap.to(bars, {
          scaleY: () => gsap.utils.random(0.4, 1.6),
          duration: 0.3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: { each: 0.08, repeat: -1, yoyo: true },
        });
      } else {
        barsTween?.kill();
        gsap.to(bars, { scaleY: 0.3, duration: 0.3 });
      }
    }

    btn.addEventListener("click", () => {
      state.audioOn = !state.audioOn;
      btn.setAttribute("aria-pressed", String(state.audioOn));
      text.textContent = state.audioOn ? "ÁUDIO ON" : "ÁUDIO OFF";
      animateBars(state.audioOn);
      if (SYNTH_FALLBACK) {
        state.audioOn ? startSynthDrone() : stopSynthDrone();
      }
    });

    document.querySelectorAll("[data-cursor]").forEach((el) => {
      el.addEventListener("click", () => { if (state.audioOn && SYNTH_FALLBACK) playSynthBlip(); });
    });
  }

  /* ------------------------------------------------------------------
     9. MARQUEE (faixa de texto infinita, transform-only)
  ------------------------------------------------------------------ */
  function initMarquee() {
    const trackEl = document.querySelector(".marquee__track");
    if (!trackEl) return;
    if (prefersReducedMotion) return;
    gsap.to(trackEl, {
      xPercent: -50,
      duration: isMobile ? 14 : 22,
      ease: "none",
      repeat: -1,
    });
  }

  /* ------------------------------------------------------------------
     10. INIT
  ------------------------------------------------------------------ */
  window.addEventListener("DOMContentLoaded", () => {
    initLenis();
    initHorizontalScroll();
    initVerticalProgressFallback();
    initGlitch();
    initCursor();
    initAudio();
    initMarquee();
    initLoader();

    window.addEventListener("load", () => ScrollTrigger.refresh());
  });
})();
