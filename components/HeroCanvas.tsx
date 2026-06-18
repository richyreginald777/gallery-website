"use client";

import { useEffect, useRef } from "react";

/**
 * Signature hero moment: slow-drifting "gallery dust" particles over a
 * fixed warm glow. (Cursor interaction lives in CursorStars — the glow
 * deliberately does NOT follow the pointer.) Plain 2D canvas — no WebGL
 * payload — capped DPR, pauses when off-screen/hidden, and renders a
 * static composition for users who prefer reduced motion.
 */
export default function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    let t = 0;

    // Fixed glow position — a quiet spotlight, slightly above centre
    const gx = 0.5;
    const gy = 0.42;

    // Theme-driven colours (refreshed on resize / theme change)
    let accentCol = "205, 173, 112";
    let softCol = "224, 199, 150";

    type P = {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      tw: number; // twinkle phase
      a: number; // base alpha
    };
    let particles: P[] = [];

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = isMobile ? 36 : 80;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.05 - Math.random() * 0.14,
        tw: Math.random() * Math.PI * 2,
        a: 0.25 + Math.random() * 0.5,
      }));
    }

    function refreshColors() {
      const cs = getComputedStyle(document.documentElement);
      const accent = cs.getPropertyValue("--accent").trim();
      const soft = cs.getPropertyValue("--accent-soft").trim();
      if (accent) accentCol = accent.replace(/\s+/g, ", ");
      if (soft) softCol = soft.replace(/\s+/g, ", ");
    }

    function drawGlow() {
      const cx = gx * w;
      const cy = gy * h;
      const radius = Math.max(w, h) * 0.8;
      const grad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `rgba(${accentCol}, 0.14)`);
      grad.addColorStop(0.4, `rgba(${accentCol}, 0.045)`);
      grad.addColorStop(1, `rgba(${accentCol}, 0)`);
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, w, h);
    }

    function frame() {
      if (!running) return;
      t += 1;
      ctx!.clearRect(0, 0, w, h);
      drawGlow();

      for (const p of particles) {
        p.x += p.vx + Math.sin((t + p.tw * 60) * 0.004) * 0.06;
        p.y += p.vy;
        if (p.y < -4) {
          p.y = h + 4;
          p.x = Math.random() * w;
        }
        if (p.x < -4) p.x = w + 4;
        if (p.x > w + 4) p.x = -4;
        const twinkle = 0.65 + 0.35 * Math.sin(t * 0.02 + p.tw);
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${softCol}, ${(p.a * twinkle * 0.55).toFixed(3)})`;
        ctx!.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    refreshColors();
    resize();

    // Repaint glow + motes when the theme attribute flips
    const themeObserver = new MutationObserver(() => {
      refreshColors();
      if (reduced) {
        ctx!.clearRect(0, 0, w, h);
        drawGlow();
        for (const p of particles) {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${softCol}, ${(p.a * 0.4).toFixed(3)})`;
          ctx!.fill();
        }
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    if (reduced) {
      // Static composition: glow + a scattering of fixed motes.
      drawGlow();
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${softCol}, ${(p.a * 0.4).toFixed(3)})`;
        ctx.fill();
      }
      const onResizeStatic = () => {
        resize();
        drawGlow();
      };
      window.addEventListener("resize", onResizeStatic);
      return () => {
        themeObserver.disconnect();
        window.removeEventListener("resize", onResizeStatic);
      };
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && !document.hidden;
        if (visible && !running) {
          running = true;
          raf = requestAnimationFrame(frame);
        } else if (!visible) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
