"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor star cloud (antigravity.google-style): a wide, sparse, dim cloud
 * of tiny four-pointed stars that swirls around the pointer. Each star
 * orbits its own radius and follows the (eased) cursor through its own
 * spring, so fast moves stretch the whole cloud behind the cursor and it
 * flows back — fluid feel, no fluid sim. Deliberately subtle: tiny stars,
 * low opacity, no bright center.
 *
 * Fixed overlay, pointer-events: none, DPR capped at 2. Fades out when the
 * pointer leaves or after touch ends; loop stops once fully faded.
 * Renders nothing under prefers-reduced-motion.
 */

type Sat = {
  angle: number; // current orbit angle
  speed: number; // radians/sec
  dist: number; // orbit radius
  r: number; // star size
  lag: number; // spring ease factor (lower = more fluid lag)
  x: number;
  y: number;
  tw: number; // twinkle phase
  primary: boolean; // true = accent, false = "contrast" colour
};

export default function CursorStars() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const touch = window.matchMedia("(pointer: coarse)").matches;

    // Theme-aware palette. In dark mode: warm gold + ink-white on near-black.
    // In light mode: deep ink + deep gold on paper — so the cloud stays
    // visible instead of washing out. Refreshed when [data-theme] flips.
    let accentCol = "200, 169, 110";
    let contrastCol = "236, 231, 221";
    let alphaScale = 0.52;

    function refreshPalette() {
      const cs = getComputedStyle(document.documentElement);
      const light =
        document.documentElement.getAttribute("data-theme") === "light";
      const accent = cs.getPropertyValue("--accent").trim();
      const ink = cs.getPropertyValue("--ink").trim();
      if (accent) accentCol = accent.replace(/\s+/g, ", ");
      // The "other" stars use ink so they contrast with the background in
      // both themes (dark ink-dots on paper, light ink-dots on near-black).
      if (ink) contrastCol = ink.replace(/\s+/g, ", ");
      // Dark dots on a light page need more presence than glowing dots on black.
      alphaScale = light ? 0.85 : 0.52;
    }

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let last = 0;

    // Pointer target and eased orb position
    let px = -100;
    let py = -100;
    let ox = -100;
    let oy = -100;
    let fade = 0; // 0 hidden → 1 visible
    let visible = false;

    const N = 64;
    const sats: Sat[] = Array.from({ length: N }, (_, i) => ({
      angle: (i / N) * Math.PI * 2 + Math.random(),
      speed: (0.2 + Math.random() * 0.7) * (Math.random() < 0.5 ? -1 : 1),
      // wide, sparse spread — most stars far from the cursor
      dist: 25 + Math.pow(Math.random(), 0.6) * 145,
      r: 1.0 + Math.random() * 1.8,
      lag: 0.015 + Math.random() * 0.07,
      x: -100,
      y: -100,
      tw: Math.random() * Math.PI * 2,
      primary: Math.random() < 0.65,
    }));

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function star(x: number, y: number, r: number, alpha: number, color: string) {
      const ir = r * 0.24;
      ctx!.save();
      ctx!.translate(x, y);
      ctx!.beginPath();
      ctx!.moveTo(0, -r);
      ctx!.quadraticCurveTo(ir, -ir, r, 0);
      ctx!.quadraticCurveTo(ir, ir, 0, r);
      ctx!.quadraticCurveTo(-ir, ir, -r, 0);
      ctx!.quadraticCurveTo(-ir, -ir, 0, -r);
      ctx!.closePath();
      ctx!.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
      ctx!.fill();
      ctx!.restore();
    }

    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx!.clearRect(0, 0, w, h);

      fade += ((visible ? 1 : 0) - fade) * 0.08;
      if (fade < 0.01 && !visible) {
        running = false;
        ctx!.clearRect(0, 0, w, h);
        return;
      }

      // Cloud centre eases toward pointer — the fluid lag
      ox += (px - ox) * 0.085;
      oy += (py - oy) * 0.085;

      // Stars: each orbit point moves with the centre; each star springs
      // toward it with its own lag, so the cloud flows like liquid.
      // No glow, no core — the cursor itself stays the focal point.
      for (const s of sats) {
        s.angle += s.speed * dt;
        const txp = ox + Math.cos(s.angle) * s.dist;
        const typ = oy + Math.sin(s.angle) * s.dist * 0.8; // slight ellipse
        s.x += (txp - s.x) * s.lag * (dt * 60);
        s.y += (typ - s.y) * s.lag * (dt * 60);
        // gentle twinkle; some stars almost disappear between blinks
        const twinkle = 0.5 + 0.5 * Math.sin(now * 0.0025 + s.tw);
        if (twinkle <= 0.05) continue;
        const col = s.primary ? accentCol : contrastCol;
        star(s.x, s.y, s.r, alphaScale * twinkle * fade, col);
      }

      raf = requestAnimationFrame(frame);
    }

    function wake() {
      if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }

    function onPointerMove(e: PointerEvent) {
      px = e.clientX;
      py = e.clientY;
      if (!visible) {
        // appear at the cursor, not flying in from off-screen
        ox = px;
        oy = py;
        for (const s of sats) {
          s.x = px;
          s.y = py;
        }
      }
      visible = true;
      wake();
    }

    function onPointerDown(e: PointerEvent) {
      onPointerMove(e);
    }

    function hide() {
      visible = false;
    }

    const onVisibility = () => {
      if (document.hidden) hide();
    };

    refreshPalette();
    resize();

    // React to day/night toggle so the cloud recolours instantly.
    const themeObserver = new MutationObserver(refreshPalette);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    if (touch) window.addEventListener("pointerup", hide, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.documentElement.removeEventListener("pointerleave", hide);
      if (touch) window.removeEventListener("pointerup", hide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[80] h-full w-full"
    />
  );
}
