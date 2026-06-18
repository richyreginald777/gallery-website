"use client";

import { useEffect, useRef } from "react";

/**
 * Pure-delight microinteraction: a soft burst of gold leaf flecks blooms
 * wherever the visitor clicks/taps, then drifts and fades like settling
 * dust. Non-functional by design — a tactile "reward" that suits the
 * gallery-at-night mood. One shared canvas, theme-aware colour, capped DPR,
 * idle when nothing is animating, and silent under prefers-reduced-motion.
 */

type Fleck = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 → 0
  decay: number;
  r: number;
  rot: number;
  vr: number;
  gold: boolean;
};

export default function GoldBurst() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let last = 0;
    let flecks: Fleck[] = [];

    let accentCol = "205, 173, 112";
    let softCol = "236, 231, 221";
    function refreshPalette() {
      const cs = getComputedStyle(document.documentElement);
      const a = cs.getPropertyValue("--accent").trim();
      const s = cs.getPropertyValue("--accent-soft").trim();
      if (a) accentCol = a.replace(/\s+/g, ", ");
      if (s) softCol = s.replace(/\s+/g, ", ");
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function burst(x: number, y: number) {
      const n = 16 + Math.floor(Math.random() * 8);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const speed = 1.4 + Math.random() * 4.2;
        flecks.push({
          x,
          y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed - 1.2, // slight upward bias
          life: 1,
          decay: 0.012 + Math.random() * 0.02,
          r: 1.4 + Math.random() * 3.2,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          gold: Math.random() < 0.78,
        });
      }
      // cap so rapid clicking never piles up
      if (flecks.length > 400) flecks = flecks.slice(-400);
      wake();
    }

    function diamond(f: Fleck) {
      const alpha = Math.max(f.life, 0) * 0.9;
      ctx!.save();
      ctx!.translate(f.x, f.y);
      ctx!.rotate(f.rot);
      ctx!.beginPath();
      ctx!.moveTo(0, -f.r);
      ctx!.lineTo(f.r * 0.62, 0);
      ctx!.lineTo(0, f.r);
      ctx!.lineTo(-f.r * 0.62, 0);
      ctx!.closePath();
      ctx!.fillStyle = `rgba(${f.gold ? accentCol : softCol}, ${alpha.toFixed(
        3
      )})`;
      ctx!.fill();
      ctx!.restore();
    }

    function frame(now: number) {
      const dt = Math.min((now - last) / 16.67, 2);
      last = now;
      ctx!.clearRect(0, 0, w, h);

      for (const f of flecks) {
        f.vy += 0.06 * dt; // gravity
        f.vx *= 0.985;
        f.vy *= 0.985;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.rot += f.vr * dt;
        f.life -= f.decay * dt;
        if (f.life > 0) diamond(f);
      }
      flecks = flecks.filter((f) => f.life > 0);

      if (flecks.length === 0) {
        running = false;
        ctx!.clearRect(0, 0, w, h);
        return;
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

    function onPointerDown(e: PointerEvent) {
      // ignore right/middle clicks
      if (e.button && e.button !== 0) return;
      burst(e.clientX, e.clientY);
    }

    refreshPalette();
    resize();

    const themeObserver = new MutationObserver(refreshPalette);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[90] h-full w-full"
    />
  );
}
