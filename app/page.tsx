"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function Home() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-animate]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = Number(el.dataset.delay ?? 0);
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0) scale(1)";
              el.style.filter = "blur(0px)";
            }, delay);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.08 }
    );
    els.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(44px) scale(0.97)";
      el.style.filter = "blur(8px)";
      el.style.transition =
        "opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1), filter 0.75s cubic-bezier(0.16,1,0.3,1)";
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <AppShell showAuthActions>
      {/* ── Background atmosphere ── */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="gradient-orb orb-1" />
        <div className="gradient-orb orb-2" />
        <div className="gradient-orb orb-3" />
        <FloatingCurrency symbols={["₹", "$", "€", "£", "¥", "₿", "₩", "₽", "₪"]} count={20} />
      </div>
      <div className="fixed inset-0 -z-20 bg-[#04060f] pointer-events-none" />

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="relative pt-16 pb-24 md:pt-24 lg:pt-6 text-center">
        {/* Editorial rule line */}
        <div
          data-animate
          data-delay="0"
          className="mb-12 flex items-center gap-4"
        >
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: "rgba(160,175,215,0.4)" }}>
            Personal Finance · 2026
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        <div className="flex flex-col items-center">
          {/* Main headline */}
          <h1
            data-animate
            data-delay="80"
            className="font-display text-[clamp(3rem,8vw,6rem)] leading-[0.95] tracking-tight text-white"
          >
            Your money,<br />
            <em className="not-italic text-gradient-primary">fully visible.</em>
          </h1>

          <p
            data-animate
            data-delay="180"
            className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed"
            style={{ color: "rgba(200,210,240,0.58)" }}
          >
            Log income and expenses, categorize spending, and see your monthly
            balance, savings rate, and trends — all in one place.
          </p>

          <div
            data-animate
            data-delay="280"
            className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href="/signup"
              className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl px-8 text-base font-semibold text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                boxShadow: "0 8px 32px rgba(99,102,241,0.45)",
              }}
            >
              <span className="absolute inset-0 bg-white opacity-0 transition-opacity duration-200 group-hover:opacity-10" />
              Start for free
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 px-8 text-base font-medium text-white/70 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
            >
              Log in
            </Link>
          </div>

          {/* Trust signals */}
          <div
            data-animate
            data-delay="380"
            className="mt-10 flex items-center justify-center gap-6"
          >
              <div className="flex -space-x-3">
                {[
                  { letter: "A", bg: "linear-gradient(135deg, #6366f1, #8b5cf6)" },
                  { letter: "R", bg: "linear-gradient(135deg, #10b981, #06b6d4)" },
                  { letter: "E", bg: "linear-gradient(135deg, #f43f5e, #f97316)" },
                  { letter: "D", bg: "linear-gradient(135deg, #06b6d4, #6366f1)" },
                ].map(({ letter, bg }, i) => (
                  <div
                    key={i}
                    className="relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{
                      background: bg,
                      // border: "1px solid #04060f",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                      zIndex: 4 - i,
                    }}
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <p className="text-sm" style={{ color: "rgba(160,175,215,0.5)" }}>
                Trusted by <span className="text-white/80 font-medium">1,400+</span> users this month
              </p>
          </div>
        </div>

        {/* Bottom stat row */}
        <div className="mt-20 grid gap-5 sm:grid-cols-3" data-animate data-delay="0">
          <StatCard label="Income" date="MAR • 2026" value="₹22,000" tone="income" />
          <StatCard label="Expenses" date="MAR • 2026" value="₹12,845" tone="expense" />
          <StatCard label="Net Balance" date="MAR • 2026" value="₹9,155" tone="accent" />
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section className="py-28">
        {/* Section header */}
        <div data-animate data-delay="0" className="mb-16 max-w-2xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-8 bg-indigo-500" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Features</span>
          </div>
          <h2 className="font-display text-4xl text-white md:text-5xl">
            Built for clarity,<br /><em className="not-italic" style={{ color: "rgba(200,210,240,0.55)" }}>not complexity.</em>
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: "Fast logging",
              desc: "Slide-out panel. Keyboard-friendly. Add transactions in seconds without interrupting your flow.",
              accent: "#6366f1",
            },
            {
              title: "Clarity by default",
              desc: "Green income. Red expenses. Dense table. Everything visible at a glance, every time.",
              accent: "#10b981",
            },
            {
              title: "Charts that answer",
              desc: "Category breakdown, monthly comparison, 6-month trend. See your patterns instantly.",
              accent: "#06b6d4",
            },
          ].map((f, i) => (
            <div key={f.title} data-animate data-delay={i * 120}>
              <FeatureCard {...f} />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          CHART PREVIEW
      ══════════════════════════════════════ */}
      <section
        data-animate
        data-delay="0"
        className="relative overflow-hidden rounded-[32px]"
        style={{
          background: "rgba(10,14,28,0.70)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Ambient glow behind it */}
        <div className="pointer-events-none absolute -top-20 left-1/2 h-60 w-96 -translate-x-1/2 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)", filter: "blur(60px)" }} />

        <div className="relative z-10 p-10 md:p-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px w-8 bg-cyan-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Analytics</span>
              </div>
              <h2 className="font-display text-4xl text-white md:text-5xl">Visualize your<br />spending trends.</h2>
              <p className="mt-4 max-w-md text-base leading-relaxed" style={{ color: "rgba(200,210,240,0.52)" }}>
                Income vs expenses over 8 months — see exactly where your money goes.
              </p>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-6 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: "#10b981", boxShadow: "0 0 8px rgba(16,185,129,0.7)" }} />
                <span className="text-xs font-medium" style={{ color: "rgba(160,175,215,0.6)" }}>Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: "#f43f5e", boxShadow: "0 0 8px rgba(244,63,94,0.7)" }} />
                <span className="text-xs font-medium" style={{ color: "rgba(160,175,215,0.6)" }}>Expenses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: "#6366f1", boxShadow: "0 0 8px rgba(99,102,241,0.7)" }} />
                <span className="text-xs font-medium" style={{ color: "rgba(160,175,215,0.6)" }}>Net</span>
              </div>
            </div>
          </div>

          {/* SVG Sample Graph */}
          <SampleGraph />
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA
      ══════════════════════════════════════ */}
      <section
        data-animate
        data-delay="0"
        className="py-32 text-center"
      >
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-indigo-500" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Get started today</span>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-indigo-500" />
        </div>
        <h2 className="font-display text-5xl text-white md:text-7xl">
          Take control of<br />your finances.
        </h2>
        <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed" style={{ color: "rgba(200,210,240,0.52)" }}>
          Join thousands who track smarter with Fino. It's free, fast, and beautifully clear.
        </p>
        <Link
          href="/signup"
          className="group relative mt-12 inline-flex h-16 items-center justify-center gap-3 overflow-hidden rounded-2xl px-12 text-lg font-semibold text-white transition-all duration-300 hover:scale-[1.04] active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)",
            backgroundSize: "200% auto",
            boxShadow: "0 12px 48px rgba(99,102,241,0.5)",
            animation: "shimmer 3s linear infinite",
          }}
        >
          <span className="absolute inset-0 bg-white opacity-0 transition-opacity duration-200 group-hover:opacity-10" />
          Create your free account
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
            <path d="M4 10h12M12 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </section>

      <style jsx>{`
        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(180px);
          opacity: 0.40;
          animation: float 28s infinite ease-in-out;
        }
        .orb-1 {
          width: 700px; height: 700px;
          background: radial-gradient(circle, var(--primary), transparent);
          top: -15%; left: -10%;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, var(--secondary), transparent);
          top: 5%; right: -12%;
          animation-delay: -6s;
        }
        .orb-3 {
          width: 800px; height: 800px;
          background: radial-gradient(circle, var(--purple), transparent);
          bottom: -20%; left: 8%;
          animation-delay: -12s;
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -40px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
        }
        @keyframes shimmer {
          from { background-position: 0% center; }
          to   { background-position: 200% center; }
        }
        @keyframes drift {
          from { transform: translate(0, 0) rotate(0deg); }
          50%  { transform: translate(80px, 80px) rotate(180deg); }
          to   { transform: translate(0, 0) rotate(360deg); }
        }
        @keyframes growBar {
          from { height: 0; }
        }
        .text-gradient-primary {
          background: linear-gradient(135deg, #6366f1, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .animate-float-slow {
          animation: floatSlow 9s infinite ease-in-out;
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0); }
          50%  { transform: translateY(-24px); }
        }
      `}</style>
    </AppShell>
  );
}

/* ─── FloatingCurrency ──────────────────────────────────── */
function FloatingCurrency({ symbols, count }: { symbols: string[]; count: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const items = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: count }).map((_, i) => ({
      symbol: symbols[i % symbols.length],
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 18 + Math.random() * 22,
      delay: Math.random() * -25,
      size: 10 + Math.random() * 20,
      opacity: 0.04 + Math.random() * 0.07,
    }));
  }, [mounted, symbols, count]);
  if (!mounted) return null;
  return (
    <>
      {items.map((item, i) => (
        <div
          key={i}
          className="absolute font-display pointer-events-none select-none"
          style={{
            top: `${item.top}%`, left: `${item.left}%`,
            fontSize: `${item.size}px`, opacity: item.opacity,
            animation: `drift ${item.duration}s linear infinite`,
            animationDelay: `${item.delay}s`,
          }}
        >
          {item.symbol}
        </div>
      ))}
    </>
  );
}

/* ─── HeroCard ──────────────────────────────────────────── */
function HeroCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div
      className="w-64 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "rgba(10,14,28,0.75)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="mb-3 h-0.5 w-8 rounded-full" style={{ background: color }} />
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(160,175,215,0.42)" }}>{label}</p>
      <p className="mt-1.5 font-display text-3xl" style={{ color }}>{value}</p>
      <p className="mt-1 text-xs" style={{ color: "rgba(160,175,215,0.38)" }}>{sub}</p>
    </div>
  );
}

/* ─── StatCard ──────────────────────────────────────────── */
function StatCard({ label, date, value, tone }: { label: string; date: string; value: string; tone: "income" | "expense" | "accent" }) {
  const colors = {
    income: "#10B981",
    expense: "#F43F5E",
    accent: "#6366F1",
  };
  const color = colors[tone];
  return (
    <div
      className="group relative overflow-hidden rounded-3xl p-7 transition-all duration-300 hover:-translate-y-2"
      style={{
        background: "rgba(10,14,28,0.72)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(160,175,215,0.38)" }}>{label}</span>
        <span className="text-[9px] font-semibold tracking-[0.1em]" style={{ color: "rgba(160,175,215,0.28)" }}>{date}</span>
      </div>
      <div className="mt-4 font-display text-5xl" style={{ color }}>{value}</div>
    </div>
  );
}

/* ─── SampleGraph ───────────────────────────────────────── */
const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const INCOME_DATA  = [4200, 5100, 4800, 6200, 5500, 6800, 5900, 6200];
const EXPENSE_DATA = [2800, 3200, 2600, 3800, 3100, 2900, 2700, 2845];
const NET_DATA     = INCOME_DATA.map((v, i) => v - EXPENSE_DATA[i]);

function SampleGraph() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 300);
    return () => clearTimeout(t);
  }, []);

  const W = 800, H = 260;
  const PAD = { top: 20, right: 20, bottom: 40, left: 52 };
  const gW = W - PAD.left - PAD.right;
  const gH = H - PAD.top - PAD.bottom;

  const allVals = [...INCOME_DATA, ...EXPENSE_DATA, ...NET_DATA];
  const minV = Math.min(...allVals) * 0.9;
  const maxV = Math.max(...allVals) * 1.05;

  const xOf = (i: number) => PAD.left + (i / (MONTHS.length - 1)) * gW;
  const yOf = (v: number) => PAD.top + gH - ((v - minV) / (maxV - minV)) * gH;

  function makePath(data: number[]) {
    return data
      .map((v, i) => `${i === 0 ? "M" : "L"} ${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`)
      .join(" ");
  }

  function makeArea(data: number[]) {
    const top = makePath(data);
    const bottom = `L ${xOf(data.length - 1).toFixed(1)} ${(PAD.top + gH).toFixed(1)} L ${PAD.left.toFixed(1)} ${(PAD.top + gH).toFixed(1)} Z`;
    return top + " " + bottom;
  }

  const incPath  = makePath(INCOME_DATA);
  const expPath  = makePath(EXPENSE_DATA);
  const netPath  = makePath(NET_DATA);

  // Y-axis grid ticks
  const ticks = 5;
  const yTicks = Array.from({ length: ticks }, (_, i) => {
    const v = minV + ((maxV - minV) * i) / (ticks - 1);
    return { v, y: yOf(v) };
  });

  // Compute line lengths for dash animation
  const lineLen = gW * 1.2; // overestimate

  const lines = [
    { path: incPath, area: makeArea(INCOME_DATA), data: INCOME_DATA, color: "#10b981", glow: "rgba(16,185,129,0.5)", id: "income" },
    { path: expPath, area: makeArea(EXPENSE_DATA), data: EXPENSE_DATA, color: "#f43f5e", glow: "rgba(244,63,94,0.5)", id: "expense" },
    { path: netPath, area: makeArea(NET_DATA), data: NET_DATA, color: "#6366f1", glow: "rgba(99,102,241,0.5)", id: "net" },
  ];

  const fmt = (v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v}`;

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: "340px" }}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          {lines.map((l) => (
            <linearGradient key={l.id} id={`grad-${l.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={l.color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={l.color} stopOpacity="0" />
            </linearGradient>
          ))}
          {lines.map((l) => (
            <filter key={`glow-${l.id}`} id={`glow-${l.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}
        </defs>

        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={t.y.toFixed(1)}
              x2={W - PAD.right} y2={t.y.toFixed(1)}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1"
            />
            <text
              x={(PAD.left - 8).toFixed(1)} y={t.y.toFixed(1)}
              textAnchor="end" dominantBaseline="middle"
              fill="rgba(160,175,215,0.4)" fontSize="10"
              fontFamily="DM Sans, sans-serif"
            >
              {fmt(t.v)}
            </text>
          </g>
        ))}

        {/* X-axis month labels */}
        {MONTHS.map((m, i) => (
          <text
            key={m}
            x={xOf(i).toFixed(1)} y={(PAD.top + gH + 18).toFixed(1)}
            textAnchor="middle" fill="rgba(160,175,215,0.4)"
            fontSize="10" fontFamily="DM Sans, sans-serif"
          >
            {m}
          </text>
        ))}

        {/* Area fills */}
        {lines.map((l) => (
          <path
            key={`area-${l.id}`}
            d={l.area}
            fill={`url(#grad-${l.id})`}
            opacity={drawn ? 1 : 0}
            style={{ transition: "opacity 0.8s ease 0.6s" }}
          />
        ))}

        {/* Lines with draw-on animation */}
        {lines.map((l) => (
          <path
            key={`line-${l.id}`}
            d={l.path}
            fill="none"
            stroke={l.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#glow-${l.id})`}
            strokeDasharray={lineLen}
            strokeDashoffset={drawn ? 0 : lineLen}
            style={{ transition: `stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1) 0.1s` }}
          />
        ))}

        {/* Hover vertical indicator */}
        {hovered !== null && (
          <line
            x1={xOf(hovered).toFixed(1)} y1={PAD.top.toFixed(1)}
            x2={xOf(hovered).toFixed(1)} y2={(PAD.top + gH).toFixed(1)}
            stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 3"
          />
        )}

        {/* Data points */}
        {lines.map((l) =>
          l.data.map((v, i) => {
            const isHov = hovered === i;
            return (
              <circle
                key={`pt-${l.id}-${i}`}
                cx={xOf(i).toFixed(1)} cy={yOf(v).toFixed(1)}
                r={isHov ? 6 : 3.5}
                fill={l.color}
                stroke={isHov ? "white" : "rgba(4,6,15,0.8)"}
                strokeWidth={isHov ? 2 : 1.5}
                style={{ transition: "r 0.15s ease, stroke 0.15s ease", cursor: "pointer", filter: isHov ? `drop-shadow(0 0 6px ${l.color})` : "none" }}
              />
            );
          })
        )}

        {/* Invisible hover capture bars */}
        {MONTHS.map((_, i) => (
          <rect
            key={`hover-${i}`}
            x={(xOf(i) - gW / (MONTHS.length * 2)).toFixed(1)}
            y={PAD.top.toFixed(1)}
            width={(gW / MONTHS.length).toFixed(1)}
            height={gH.toFixed(1)}
            fill="transparent"
            onMouseEnter={() => setHovered(i)}
          />
        ))}

        {/* Tooltip */}
        {hovered !== null && (() => {
          const tx = xOf(hovered);
          const tooltipX = tx > W * 0.7 ? tx - 120 : tx + 12;
          return (
            <g>
              <rect
                x={tooltipX.toFixed(1)} y="16"
                width="112" height="66"
                rx="8" ry="8"
                fill="rgba(10,14,28,0.95)"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
              <text x={(tooltipX + 10).toFixed(1)} y="32" fill="rgba(160,175,215,0.6)" fontSize="9" fontFamily="DM Sans, sans-serif" fontWeight="600" letterSpacing="1">{MONTHS[hovered].toUpperCase()}</text>
              <circle cx={(tooltipX + 10).toFixed(1)} cy="45" r="3.5" fill="#10b981" />
              <text x={(tooltipX + 18).toFixed(1)} y="49" fill="rgba(255,255,255,0.85)" fontSize="10" fontFamily="DM Sans, sans-serif">{fmt(INCOME_DATA[hovered])}</text>
              <circle cx={(tooltipX + 10).toFixed(1)} cy="60" r="3.5" fill="#f43f5e" />
              <text x={(tooltipX + 18).toFixed(1)} y="64" fill="rgba(255,255,255,0.85)" fontSize="10" fontFamily="DM Sans, sans-serif">{fmt(EXPENSE_DATA[hovered])}</text>
              <circle cx={(tooltipX + 10).toFixed(1)} cy="75" r="3.5" fill="#6366f1" />
              <text x={(tooltipX + 18).toFixed(1)} y="79" fill="rgba(255,255,255,0.85)" fontSize="10" fontFamily="DM Sans, sans-serif">{fmt(NET_DATA[hovered])}</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

/* ─── FeatureCard ───────────────────────────────────────── */
function FeatureCard({ title, desc, accent }: { title: string; desc: string; accent: string }) {
  return (
    <div
      className="group relative h-full overflow-hidden rounded-3xl p-8 transition-all duration-400 hover:-translate-y-3"
      style={{
        background: "rgba(10,14,28,0.72)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Hover glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at 30% 30%, ${accent}18, transparent 65%)` }}
      />
      <h3 className="font-display text-2xl text-white pt-2">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(200,210,240,0.52)" }}>{desc}</p>
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100 rounded-full"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
    </div>
  );
}

/* ─── AnimBar ───────────────────────────────────────────── */
function AnimBar({ height, delay }: { height: string; delay: number }) {
  return (
    <div className="relative flex-1 group cursor-pointer">
      <div
        className="w-full rounded-t-xl transition-all duration-300 group-hover:opacity-80 group-hover:-translate-y-2"
        style={{
          height,
          background: "linear-gradient(180deg, rgba(99,102,241,0.9), rgba(6,182,212,0.6))",
          boxShadow: "0 -4px 20px rgba(99,102,241,0.2)",
          animation: `growBar 1.1s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`,
        }}
      />
      <style jsx>{`
        @keyframes growBar {
          from { height: 0; }
        }
      `}</style>
    </div>
  );
}