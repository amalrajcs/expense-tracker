"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/scroll-reveal";

export default function Home() {
  return (
    <AppShell showAuthActions>
      {/* Full-page Background Container (Plain Black) */}
       <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="gradient-orb orb-1" />
        <div className="gradient-orb orb-2" />
        <div className="gradient-orb orb-3" />
        <div className="gradient-orb orb-4" />
        <FloatingCurrency symbols={["₹", "$", "€", "£", "¥", "₿", "₩", "₽", "₪"]} count={25} />
      </div>
      <div className="fixed inset-0 -z-10 bg-black pointer-events-none" />

      <section className="relative pt-12 pb-20 md:pt-20 lg:pt-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <div className="breadcrumb animate-fadeIn flex items-center gap-3 font-bold uppercase tracking-[0.2em] text-[10px] text-[color:var(--muted-2)]">
              <span>Wealth</span>
              <span className="opacity-30">→</span>
              <span>wisely</span>
              <span className="opacity-30">→</span>
              <span>held.</span>
            </div>
            <p className="subtitle font-display animate-fadeIn mt-8 max-w-2xl text-xl font-bold leading-tight tracking-tight text-[color:var(--fg)]/80 md:text-2xl">
              Log income and expenses, categorize spending, and see your month at a glance net balance savings rate trends that explain what changed.
            </p>

            <div className="hero-buttons animate-fadeIn mt-12 flex flex-col gap-4 sm:flex-row">
              <Link href="/signup">
                <Button className="h-14 rounded-full bg-linear-to-br from-[color:var(--primary)] to-[color:var(--secondary)] px-10 text-base font-bold shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 transform transition-transform hover:-translate-y-1 active:translate-y-0">
                  Create account
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" className="h-14 rounded-full border border-white/10 bg-white/10 px-10 text-base font-bold backdrop-blur-md hover:bg-white/15 transform transition-transform hover:-translate-y-1 active:translate-y-0">
                  Log in
                </Button>
              </Link>
            </div>
          </div>

          {/* Large Hero Symbol */}
          <div className="hidden lg:block animate-float-slow">
            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-br from-[color:var(--primary)] to-[color:var(--secondary)] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
              <div className="relative flex h-64 w-64 rotate-[-12deg] items-center justify-center rounded-[60px] bg-linear-to-br from-[color:var(--primary)] to-[color:var(--secondary)] font-display text-[120px] font-black text-white shadow-[0_40px_100px_rgba(99,102,241,0.4)] transition-transform duration-700 hover:rotate-[-5deg] hover:scale-110">
                ₹
                <div className="absolute -inset-1 rounded-[60px] border-2 border-white/20 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="stats-grid animate-fadeIn mt-24 grid gap-6 md:grid-cols-3">
            <StatCard label="Income" date="MAR • 2026" value="₹6,200" tone="income" />
            <StatCard label="Expenses" date="MAR • 2026" value="₹2,845" tone="expense" />
            <StatCard label="Net Balance" date="MAR • 2026" value="₹3,355" tone="accent" />
          </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon="⚡"
            title="Fast logging"
            desc="Slide-out panel. Keyboard-friendly. Add transactions in seconds."
          />
          <FeatureCard
            icon="📊"
            title="Clarity by default"
            desc="Green income. Red expenses. Dense table. Everything visible."
          />
          <FeatureCard
            icon="📈"
            title="Charts that answer"
            desc="Category, monthly, and 6-month trend. See patterns instantly."
          />
        </div>
      </section>

      {/* Chart Preview Section */}
      <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[color:var(--card)] p-10 md:p-16">
        <div className="relative z-10 max-w-2xl">
          <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">Visualize your spending trends</h2>
          <p className="mt-4 text-[color:var(--muted)]">Track your monthly expenses with beautiful, interactive charts that explain where your money goes.</p>
        </div>

        <div className="mt-16 flex items-end justify-between gap-3 md:gap-6">
          <Bar height="60%" delay={0} />
          <Bar height="85%" delay={100} />
          <Bar height="70%" delay={200} />
          <Bar height="95%" delay={300} />
          <Bar height="75%" delay={400} />
          <Bar height="88%" delay={500} />
          <Bar height="65%" delay={600} />
          <Bar height="80%" delay={700} />
        </div>
      </section>

      <section className="py-32 text-center">
        <h2 className="font-display text-5xl font-extrabold tracking-tighter md:text-7xl">Start tracking today</h2>
        <p className="mt-6 text-lg text-[color:var(--muted)] md:text-xl">Take control of your finances with clarity and confidence.</p>
        <Link href="/signup" className="mt-10 inline-block">
          <Button className="h-16 rounded-full bg-linear-to-br from-[color:var(--primary)] to-[color:var(--secondary)] px-12 text-lg font-extrabold shadow-2xl shadow-indigo-500/40">
            Get Started Free
          </Button>
        </Link>
      </section>

      <style jsx>{`
        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(180px);
          opacity: 0.45;
          animation: float 25s infinite ease-in-out;
        }

        .orb-1 {
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, var(--primary), transparent);
          top: -15%;
          left: -10%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, var(--secondary), transparent);
          top: 10%;
          right: -10%;
          animation-delay: -5s;
        }

        .orb-3 {
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, var(--purple), transparent);
          bottom: -20%;
          left: 5%;
          animation-delay: -10s;
        }

        .orb-4 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, var(--accent), transparent);
          bottom: 15%;
          right: 15%;
          animation-delay: -15s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -40px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes drift {
          from { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(100px, 100px) rotate(180deg); }
          to { transform: translate(0, 0) rotate(360deg); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(-12deg); }
          50% { transform: translateY(-30px) rotate(-8deg); }
        }

        .animate-float-slow {
          animation: float-slow 8s infinite ease-in-out;
        }

        .animate-fadeIn {
          animation: fadeIn 1s ease-out both;
        }

        .breadcrumb { animation-delay: 0.2s; }
        .subtitle { animation-delay: 0.4s; }
        .hero-buttons { animation-delay: 0.6s; }
        .stats-grid { animation-delay: 0.8s; }
      `}</style>
    </AppShell>
  );
}

function FloatingCurrency({ symbols, count }: { symbols: string[]; count: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const items = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: count }).map((_, i) => ({
      symbol: symbols[i % symbols.length],
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * -20,
      size: 12 + Math.random() * 24,
      opacity: 0.05 + Math.random() * 0.1,
    }));
  }, [mounted, symbols, count]);

  if (!mounted) return null;

  return (
    <>
      {items.map((item, i) => (
        <div
          key={i}
          className="absolute font-display font-black pointer-events-none select-none"
          style={{
            top: `${item.top}%`,
            left: `${item.left}%`,
            fontSize: `${item.size}px`,
            opacity: item.opacity,
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

function StatCard({ label, date, value, tone }: { label: string; date: string; value: string; tone: "income" | "expense" | "accent" }) {
  const colors = {
    income: "text-[color:var(--green)]",
    expense: "text-[color:var(--primary)]",
    accent: "text-[color:var(--accent)]",
  };

  return (
    <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[color:var(--card)] p-8 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-2 hover:border-white/20 hover:shadow-2xl">
      <div className="absolute top-0 left-0 h-1 w-0 bg-linear-to-r from-[color:var(--primary)] to-[color:var(--secondary)] transition-all duration-500 group-hover:w-full" />
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-2)]">
        <span>{label}</span>
        <span>{date}</span>
      </div>
      <div className={`mt-4 font-display text-5xl font-extrabold ${colors[tone]}`}>
        {value}
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="group relative rounded-[40px] border border-white/5 bg-linear-to-br from-white/10 to-transparent p-10 backdrop-blur-md transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl">
      <div className="absolute inset-0 -z-10 rounded-[40px] bg-linear-to-br from-[color:var(--primary)] via-[color:var(--secondary)] to-[color:var(--purple)] opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-10" />

      <div className="flex h-16 w-16 rotate-[-5deg] items-center justify-center rounded-2xl bg-linear-to-br from-[color:var(--primary)] to-[color:var(--secondary)] text-3xl shadow-lg transition-transform duration-500 group-hover:rotate-[5deg] group-hover:scale-110">
        {icon}
      </div>
      <h3 className="mt-8 font-display text-2xl font-extrabold tracking-tight">{title}</h3>
      <p className="mt-3 text-base leading-relaxed text-[color:var(--muted)]">{desc}</p>
    </div>
  );
}

function Bar({ height, delay }: { height: string; delay: number }) {
  return (
    <div className="relative flex-1">
      <div
        className="animate-grow rounded-t-xl bg-linear-to-t from-[color:var(--primary)] to-[color:var(--secondary)] cursor-pointer transition-all duration-300 hover:opacity-80 hover:-translate-y-2"
        style={{
          height,
          animationDelay: `${delay}ms`,
        }}
      />
      <style jsx>{`
        @keyframes grow {
          from { height: 0; }
        }
        .animate-grow {
          animation: grow 1s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
    </div>
  );
}