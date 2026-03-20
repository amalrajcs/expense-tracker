"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  addMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { CATEGORIES, type Category, type TxType } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TrendingUp, TrendingDown, Target, PieChart, BarChart3, Activity, Download, Plus } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
);

/* ─── Types ─────────────────────────────────────────────── */
type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: TxType;
  category: Category;
  description: string | null;
  date: string;
  created_at: string;
};

type Filters = {
  type: "all" | TxType;
  category: "all" | Category;
  from: string;
  to: string;
};

const DEFAULT_FILTERS: Filters = {
  type: "all",
  category: "all",
  from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
  to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
};

/* ─── Keyframe CSS (injected once) ──────────────────────── */
const ANIM_CSS = `
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.3); }
  50%       { box-shadow: 0 0 40px rgba(99,102,241,0.6); }
}
@keyframes barGrow {
  from { transform: scaleY(0); }
  to   { transform: scaleY(1); }
}
@keyframes strokeDraw {
  from { stroke-dashoffset: var(--total); }
  to   { stroke-dashoffset: 0; }
}
.dashboard-card { animation: slideUp 0.4s ease both; }
.dashboard-card:nth-child(1) { animation-delay: 0.05s; }
.dashboard-card:nth-child(2) { animation-delay: 0.10s; }
.dashboard-card:nth-child(3) { animation-delay: 0.15s; }
.dashboard-card:nth-child(4) { animation-delay: 0.20s; }
.tx-row { animation: fadeIn 0.3s ease both; }
.bar-fill { transform-origin: bottom; animation: barGrow 0.8s cubic-bezier(0.34,1.56,0.64,1) both; }
.donut-arc { animation: strokeDraw 0.9s ease both; }
`;

/* ─── Main Component ─────────────────────────────────────── */
export function DashboardClient({ userId }: { userId: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const SORT_KEYS = ["date", "amount", "category", "type"] as const;
  type SortKey = (typeof SORT_KEYS)[number];
  const SORT_DIRS = ["asc", "desc"] as const;
  type SortDir = (typeof SORT_DIRS)[number];

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "date", dir: "desc" });
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function load() {
    setLoading(true);
    const q = supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order(sort.key, { ascending: sort.dir === "asc" });

    if (filters.type !== "all") q.eq("type", filters.type);
    if (filters.category !== "all") q.eq("category", filters.category);
    if (filters.from) q.gte("date", filters.from);
    if (filters.to) q.lte("date", filters.to);

    const { data, error } = await q;
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data ?? []) as Transaction[]);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.category, filters.from, filters.to, sort.key, sort.dir]);

  /* ── Derived stats ── */
  const monthWindow = useMemo(() => {
    const now = new Date();
    return { start: startOfMonth(now), end: endOfMonth(now) };
  }, []);

  const currentMonth = useMemo(() => {
    const inMonth = rows.filter((t) => {
      const d = parseISO(t.date);
      return !isBefore(d, monthWindow.start) && !isAfter(d, monthWindow.end);
    });
    const income = sum(inMonth.filter((t) => t.type === "income").map((t) => t.amount));
    const expense = sum(inMonth.filter((t) => t.type === "expense").map((t) => t.amount));
    const net = income - expense;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;
    return { income, expense, net, savingsRate, inMonth };
  }, [rows, monthWindow.end, monthWindow.start]);

  const lastSixMonths = useMemo(() => {
    const end = endOfMonth(new Date());
    const start = startOfMonth(subMonths(end, 5));
    const months = Array.from({ length: 6 }, (_, i) => startOfMonth(addMonths(start, i)));
    const buckets = months.map((m) => {
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const tx = rows.filter((t) => {
        const d = parseISO(t.date);
        return !isBefore(d, mStart) && !isAfter(d, mEnd);
      });
      const income = sum(tx.filter((t) => t.type === "income").map((t) => t.amount));
      const expense = sum(tx.filter((t) => t.type === "expense").map((t) => t.amount));
      return { label: format(m, "MMM"), income, expense };
    });
    return { buckets };
  }, [rows]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<Category, number>();
    for (const c of CATEGORIES) map.set(c, 0);
    for (const t of currentMonth.inMonth) {
      if (t.type !== "expense") continue;
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    }
    return CATEGORIES.map((c) => ({ category: c, amount: map.get(c) ?? 0 })).filter((x) => x.amount > 0);
  }, [currentMonth.inMonth]);

  const charts = useMemo(() => {
    const bar = {
      labels: lastSixMonths.buckets.map((b) => b.label),
      datasets: [
        {
          label: "Income",
          data: lastSixMonths.buckets.map((b) => b.income),
          backgroundColor: "rgba(16,185,129,0.65)",
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: "Expenses",
          data: lastSixMonths.buckets.map((b) => b.expense),
          backgroundColor: "rgba(244,63,94,0.55)",
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };

    const line = {
      labels: lastSixMonths.buckets.map((b) => b.label),
      datasets: [{
        label: "Spending",
        data: lastSixMonths.buckets.map((b) => b.expense),
        borderColor: "rgba(99,102,241,1)",
        backgroundColor: "rgba(99,102,241,0.12)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: "rgba(99,102,241,1)",
        pointBorderColor: "rgba(255,255,255,0.8)",
        pointBorderWidth: 2,
        borderWidth: 2.5,
      }],
    };

    return { bar, line };
  }, [lastSixMonths.buckets]);

  async function onDelete(id: string) {
    const ok = confirm("Delete this transaction?");
    if (!ok) return;
    const t = toast.loading("Deleting…");
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    toast.dismiss(t);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    void load();
  }

  function exportToPDF() {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();

    // Top Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.text("Fino Expense Tracker", pageWidth / 2, 20, { align: "center" });

    // Subtitle
    doc.setFontSize(14);
    doc.text("Expense Report", pageWidth / 2, 28, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on ${format(new Date(), "MMM dd, yyyy")}`, 14, 38);

    const tableCols = ["Date", "Type", "Category", "Description", "Amount"];
    const tableRows = rows.map(t => [
      t.date,
      t.type.charAt(0).toUpperCase() + t.type.slice(1),
      t.category,
      t.description || "-",
      money(t.amount)
    ]);

    autoTable(doc, {
      head: [tableCols],
      body: tableRows,
      startY: 44,
      theme: "striped",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save("Expense_Report.pdf");
  }

  const netPct = currentMonth.income > 0
    ? Math.min(100, Math.max(0, (currentMonth.net / currentMonth.income) * 100))
    : 0;

  const CHART_OPTS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: "rgba(255,255,255,0.55)", font: { size: 11 }, padding: 16 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "rgba(255,255,255,0.4)", font: { size: 11 } },
        border: { display: false },
      },
      y: {
        ticks: { callback: (v: number | string) => `₹${v}`, color: "rgba(255,255,255,0.4)", font: { size: 11 } },
        grid: { color: "rgba(255,255,255,0.05)" },
        border: { display: false },
      },
    },
  };

  return (
    <div style={{ fontFamily: "'Inter', 'DM Sans', ui-sans-serif, sans-serif" }}>
      {/* Inject animations */}
      <style>{ANIM_CSS}</style>

      <div className="space-y-6">

        {/* ════════════════════════════════════════
            HERO — NET BALANCE CARD
            ════════════════════════════════════════ */}
        <div
          className="dashboard-card relative overflow-hidden rounded-3xl p-7"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(6,182,212,0.15) 50%, rgba(16,185,129,0.12) 100%)",
            border: "1px solid rgba(99,102,241,0.3)",
            boxShadow: "0 32px 80px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
            backdropFilter: "blur(24px)",
            animation: "pulseGlow 4s ease-in-out infinite",
          }}
        >
          {/* Background orbs */}
          <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.8), transparent 70%)", filter: "blur(30px)" }} />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, rgba(6,182,212,0.8), transparent 70%)", filter: "blur(24px)" }} />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Net Balance · {format(new Date(), "MMMM yyyy")}
                </span>
              </div>
              <div
                className="mt-3 font-display text-5xl font-bold tracking-tight"
                style={{
                  background: currentMonth.net >= 0
                    ? "linear-gradient(135deg, #34d399, #6ee7b7)"
                    : "linear-gradient(135deg, #f87171, #fca5a5)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {money(currentMonth.net)}
              </div>
              <div className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                {currentMonth.net >= 0 ? "You're saving well this month." : "Expenses exceed income this month"}
              </div>
            </div>

            {/* Savings progress ring */}
            <div className="flex flex-col items-center gap-2">
              <SavingsRing pct={Math.max(0, currentMonth.savingsRate)} />
              <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                Savings Rate
              </span>
            </div>
          </div>

          {/* Animated progress bar */}
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              <span>Expenses vs Income</span>
              <span>
                {currentMonth.income > 0
                  ? `${((currentMonth.expense / currentMonth.income) * 100).toFixed(0)}% spent`
                  : "No income yet"}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              {mounted && (
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: currentMonth.income > 0
                      ? `${Math.min(100, (currentMonth.expense / currentMonth.income) * 100)}%`
                      : "0%",
                    background: currentMonth.expense <= currentMonth.income
                      ? "linear-gradient(90deg, #10b981, #34d399)"
                      : "linear-gradient(90deg, #ef4444, #f87171)",
                    boxShadow: "0 0 10px rgba(99,102,241,0.5)",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            THREE METRIC CARDS
            ════════════════════════════════════════ */}
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Total Income"
            value={money(currentMonth.income)}
            sub={`${currentMonth.inMonth.filter((t) => t.type === "income").length} transactions`}
            icon={<TrendingUp size={18} className="text-[#10b981]" />}
            accentColor="rgba(16,185,129"
            delay={0.05}
          />
          <MetricCard
            label="Total Expenses"
            value={money(currentMonth.expense)}
            sub={`${currentMonth.inMonth.filter((t) => t.type === "expense").length} transactions`}
            icon={<TrendingDown size={18} className="text-[#f43f5e]" />}
            accentColor="rgba(244,63,94"
            delay={0.10}
          />
          <MetricCard
            label="Savings Rate"
            value={`${currentMonth.savingsRate.toFixed(1)}%`}
            sub="net ÷ income"
            icon={<Target size={18} className="text-[#8b5cf6]" />}
            accentColor="rgba(139,92,246"
            delay={0.15}
          />
        </div>

        {/* ════════════════════════════════════════
            CHARTS ROW
            ════════════════════════════════════════ */}
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          {/* Custom Donut — Expense Breakdown */}
          <ChartCard title="Expense Breakdown" subtitle="by category · this month" icon={<PieChart size={18} className="text-[#f43f5e]" />} accentColor="rgba(244,63,94">
            {expenseByCategory.length === 0 ? (
              <EmptyChart message="No expenses recorded yet" />
            ) : (
              <DonutChart data={expenseByCategory} />
            )}
          </ChartCard>

          {/* Custom Bar — Income vs Expenses */}
          <ChartCard title="Income vs Expenses" subtitle="last 6 months" icon={<BarChart3 size={18} className="text-[#10b981]" />} accentColor="rgba(16,185,129">
            <BarComparison buckets={lastSixMonths.buckets} />
          </ChartCard>
        </div>

        {/* Spending Trend Line */}
        <ChartCard title="Spending Trend" subtitle="monthly progression" icon={<Activity size={18} className="text-[#6366f1]" />} accentColor="rgba(99,102,241">
          <div className="h-[200px]">
            <Line data={charts.line} options={CHART_OPTS} />
          </div>
        </ChartCard>

        {/* ════════════════════════════════════════
            TRANSACTION TABLE
            ════════════════════════════════════════ */}
        <div
          className="dashboard-card overflow-hidden rounded-3xl"
          style={{
            background: "rgba(8,12,26,0.80)",
            border: "1px solid rgba(99,102,241,0.2)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Table Header */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-6 py-5"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(6,182,212,0.05) 100%)",
            }}
          >
            <div>
              <h2
                className="font-display text-xl font-semibold"
                style={{
                  background: "linear-gradient(135deg, #fff 40%, rgba(147,197,253,0.9))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Transactions
              </h2>
              <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
                Filter, sort &amp; manage entries
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToPDF}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-100"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                <Download size={16} strokeWidth={2.5} /> Export PDF
              </button>
              <button
                onClick={() => { setEditing(null); setSheetOpen(true); }}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-100"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                  boxShadow: "0 4px 20px rgba(99,102,241,0.5), 0 0 0 1px rgba(99,102,241,0.3)",
                }}
              >
                <Plus size={16} strokeWidth={3} /> Add Transaction
              </button>
            </div>
          </div>

          {/* Filters */}
          <div
            className="grid gap-3 px-6 py-4 md:grid-cols-12"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            {[
              {
                span: "md:col-span-3",
                label: "Type",
                node: (
                  <Select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as Filters["type"] }))}>
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </Select>
                ),
              },
              {
                span: "md:col-span-4",
                label: "Category",
                node: (
                  <Select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value as Filters["category"] }))}>
                    <option value="all">All Categories</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                ),
              },
              {
                span: "md:col-span-2",
                label: "From",
                node: <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />,
              },
              {
                span: "md:col-span-2",
                label: "To",
                node: <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />,
              },
              {
                span: "md:col-span-1",
                label: "Sort",
                node: (
                  <Select
                    value={`${sort.key}:${sort.dir}`}
                    onChange={(e) => {
                      const [key, dir] = e.target.value.split(":");
                      const nextKey = (SORT_KEYS as readonly string[]).includes(key) ? (key as SortKey) : "date";
                      const nextDir = (SORT_DIRS as readonly string[]).includes(dir) ? (dir as SortDir) : "desc";
                      setSort({ key: nextKey, dir: nextDir });
                    }}
                  >
                    <option value="date:desc">Date ↓</option>
                    <option value="date:asc">Date ↑</option>
                    <option value="amount:desc">Amt ↓</option>
                    <option value="amount:asc">Amt ↑</option>
                    <option value="category:asc">Cat A→Z</option>
                    <option value="type:asc">Type</option>
                  </Select>
                ),
              },
            ].map(({ span, label, node }) => (
              <div key={label} className={span}>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {label}
                </label>
                {node}
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block max-h-[480px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 backdrop-blur-xl" style={{ background: "rgba(8,12,26,0.95)" }}>
                <tr style={{ borderBottom: "1px solid rgba(99,102,241,0.18)" }}>
                  {["Date", "Type", "Category", "Description", "Amount", "Actions"].map((h) => (
                    <th
                      key={h}
                      className={cn(
                        "px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest",
                        h === "Amount" || h === "Actions" ? "text-right" : "",
                      )}
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <LoadingState />
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  rows.map((t, i) => (
                    <TxRow
                      key={t.id}
                      tx={t}
                      index={i}
                      onEdit={() => { setEditing(t); setSheetOpen(true); }}
                      onDelete={() => onDelete(t.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col md:hidden max-h-[500px] overflow-auto divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {loading ? (
              <div className="p-10 text-center"><LoadingState /></div>
            ) : rows.length === 0 ? (
              <div className="p-10 text-center"><EmptyState /></div>
            ) : (
              rows.map((t) => (
                <div key={t.id} className="flex flex-col gap-3 p-4 tx-row hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>{t.category}</div>
                      <div className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{t.date}</div>
                      {t.description && <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{t.description}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={cn("text-sm font-bold tabular-nums", t.type === "income" ? "text-emerald-400" : "text-rose-400")}
                      >
                        {t.type === "expense" ? "−" : "+"}{money(t.amount)}
                      </span>
                      <TypeBadge type={t.type} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <ActionBtn color="indigo" onClick={() => { setEditing(t); setSheetOpen(true); }}>✏ Edit</ActionBtn>
                    <ActionBtn color="rose" onClick={() => onDelete(t.id)}>🗑 Delete</ActionBtn>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sheet */}
      <TransactionSheet
        key={`${editing?.id ?? "new"}:${sheetOpen ? "open" : "closed"}`}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        userId={userId}
        initial={editing}
        onSaved={() => { setSheetOpen(false); setEditing(null); void load(); }}
      />
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function SavingsRing({ pct }: { pct: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);

  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
      <circle
        cx="48" cy="48" r={r}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 48 48)"
        style={{ transition: "stroke-dasharray 1.2s ease" }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <text x="48" y="48" textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize="14" fontWeight="700" fontFamily="Inter, sans-serif">
        {pct.toFixed(0)}%
      </text>
    </svg>
  );
}

function MetricCard({
  label, value, sub, icon, accentColor, delay,
}: {
  label: string; value: string; sub: string; icon: React.ReactNode; accentColor: string; delay: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="dashboard-card relative overflow-hidden rounded-2xl p-5 transition-all duration-300 cursor-default"
      style={{
        background: "rgba(8,12,26,0.80)",
        border: `1px solid ${accentColor},0.25)`,
        boxShadow: hovered
          ? `0 16px 48px ${accentColor},0.18), inset 0 1px 0 rgba(255,255,255,0.07)`
          : `0 4px 24px ${accentColor},0.08), inset 0 1px 0 rgba(255,255,255,0.04)`,
        backdropFilter: "blur(16px)",
        animationDelay: `${delay}s`,
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Corner glow */}
      <div className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full opacity-25 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, ${accentColor},0.9), transparent 70%)`,
          filter: "blur(16px)",
          opacity: hovered ? 0.4 : 0.2,
        }} />

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.38)" }}>
          {label}
        </span>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl text-base"
          style={{ background: `${accentColor},0.18)`, border: `1px solid ${accentColor},0.3)` }}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 font-display text-3xl font-bold leading-none tracking-tight"
        style={{ color: "#fff" }}>
        {value}
      </div>
      <div className="mt-1.5 text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{sub}</div>

      {/* Bottom accent stripe */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300"
        style={{
          background: `linear-gradient(90deg, ${accentColor},0), ${accentColor},0.7), ${accentColor},0))`,
          opacity: hovered ? 1 : 0.4,
        }}
      />
    </div>
  );
}

function ChartCard({
  title, subtitle, icon, accentColor, children,
}: {
  title: string; subtitle: string; icon: React.ReactNode; accentColor: string; children: React.ReactNode;
}) {
  return (
    <div
      className="dashboard-card overflow-hidden rounded-2xl"
      style={{
        background: "rgba(8,12,26,0.80)",
        border: `1px solid ${accentColor},0.2)`,
        boxShadow: `0 8px 32px ${accentColor},0.08), inset 0 1px 0 rgba(255,255,255,0.04)`,
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: `linear-gradient(135deg, ${accentColor},0.09) 0%, rgba(6,182,212,0.04) 100%)`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl text-sm"
            style={{ background: `${accentColor},0.2)`, border: `1px solid ${accentColor},0.35)` }}
          >
            {icon}
          </span>
          <div>
            <div
              className="font-semibold text-base leading-none"
              style={{
                background: `linear-gradient(135deg, #fff 30%, ${accentColor},0.85))`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {title}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
              {subtitle}
            </div>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function TxRow({
  tx, index, onEdit, onDelete,
}: {
  tx: Transaction; index: number; onEdit: () => void; onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <tr
      className="tx-row transition-colors duration-150"
      style={{
        background: hovered
          ? "rgba(99,102,241,0.07)"
          : index % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        animationDelay: `${index * 0.04}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td className="px-5 py-3.5">
        <span
          className="inline-block rounded-lg px-2 py-0.5 font-mono text-[11px]"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
        >
          {tx.date}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <TypeBadge type={tx.type} />
      </td>
      <td className="px-5 py-3.5 font-medium text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
        {tx.category}
      </td>
      <td className="px-5 py-3.5 max-w-[180px] truncate text-sm" style={{ color: "rgba(255,255,255,0.48)" }}>
        {tx.description ?? <span style={{ color: "rgba(255,255,255,0.18)" }}>—</span>}
      </td>
      <td className={cn("px-5 py-3.5 text-right font-bold tabular-nums text-sm",
        tx.type === "income" ? "text-emerald-400" : "text-rose-400")}>
        {tx.type === "expense" ? "−" : "+"}{money(tx.amount)}
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="inline-flex items-center gap-1.5">
          <ActionBtn color="indigo" onClick={onEdit}>✏ Edit</ActionBtn>
          <ActionBtn color="rose" onClick={onDelete}>🗑 Delete</ActionBtn>
        </div>
      </td>
    </tr>
  );
}

function TypeBadge({ type }: { type: TxType }) {
  const isIncome = type === "income";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{
        background: isIncome ? "rgba(16,185,129,0.14)" : "rgba(244,63,94,0.14)",
        color: isIncome ? "#34d399" : "#fb7185",
        border: `1px solid ${isIncome ? "rgba(16,185,129,0.35)" : "rgba(244,63,94,0.35)"}`,
        boxShadow: isIncome ? "0 0 8px rgba(16,185,129,0.15)" : "0 0 8px rgba(244,63,94,0.15)",
        letterSpacing: "0.03em",
      }}
    >
      {isIncome ? "▲" : "▼"} {type}
    </span>
  );
}

function ActionBtn({
  color, onClick, children,
}: {
  color: "indigo" | "rose"; onClick: () => void; children: React.ReactNode;
}) {
  const styles = color === "indigo"
    ? { bg: "rgba(99,102,241,0.12)", fg: "rgba(147,197,253,0.9)", border: "rgba(99,102,241,0.25)" }
    : { bg: "rgba(244,63,94,0.10)", fg: "rgba(252,165,165,0.9)", border: "rgba(244,63,94,0.25)" };

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 hover:scale-105 active:scale-100"
      style={{ background: styles.bg, color: styles.fg, border: `1px solid ${styles.border}` }}
    >
      {children}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-indigo-400" />
      <span className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Loading transactions…</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-4xl">🔍</span>
      <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>No transactions match your filters</span>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid h-full place-items-center">
      <div className="flex flex-col items-center gap-2">
        <span className="text-3xl">📊</span>
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>{message}</span>
      </div>
    </div>
  );
}

/* ─── Custom DonutChart ──────────────────────────────────── */
const DONUT_COLORS = [
  { fill: "#6366f1", glow: "rgba(99,102,241,0.5)" },
  { fill: "#06b6d4", glow: "rgba(6,182,212,0.5)" },
  { fill: "#f43f5e", glow: "rgba(244,63,94,0.5)" },
  { fill: "#10b981", glow: "rgba(16,185,129,0.5)" },
  { fill: "#fbbf24", glow: "rgba(251,191,36,0.5)" },
  { fill: "#8b5cf6", glow: "rgba(139,92,246,0.5)" },
  { fill: "#3b82f6", glow: "rgba(59,130,246,0.5)" },
  { fill: "#ec4899", glow: "rgba(236,72,153,0.5)" },
];

function DonutChart({ data }: { data: { category: string; amount: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((a, b) => a + b.amount, 0);

  const cx = 80;
  const cy = 80;
  const R = 62;
  const r = 38;
  const GAP = 0.03; // radians gap between segments

  // Build arc segments
  let angle = -Math.PI / 2;
  const segments = data.map((item, i) => {
    const pct = item.amount / total;
    const sweep = pct * Math.PI * 2 - GAP;
    const startAngle = angle + GAP / 2;
    const endAngle = startAngle + sweep;

    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle);
    const y2 = cy + R * Math.sin(endAngle);
    const xi1 = cx + r * Math.cos(endAngle);
    const yi1 = cy + r * Math.sin(endAngle);
    const xi2 = cx + r * Math.cos(startAngle);
    const yi2 = cy + r * Math.sin(startAngle);
    const large = sweep > Math.PI ? 1 : 0;

    const midAngle = (startAngle + endAngle) / 2;
    const color = DONUT_COLORS[i % DONUT_COLORS.length];

    const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${r} ${r} 0 ${large} 0 ${xi2} ${yi2} Z`;

    angle += pct * Math.PI * 2;

    return { d, pct, midAngle, color, item, i };
  });

  const hoveredSeg = hovered !== null ? segments[hovered] : null;

  return (
    <div className="flex flex-col gap-4 p-1 sm:flex-row sm:items-center">
      {/* SVG Donut */}
      <div className="relative flex-shrink-0">
        <svg
          width="160" height="160" viewBox="0 0 160 160"
          className="overflow-visible"
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            {segments.map((s) => (
              <filter key={`glow-${s.i}`} id={`glow-${s.i}`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>

          {segments.map((s) => {
            const isHov = hovered === s.i;
            const scale = isHov ? 1.06 : 1;
            const ox = (cx - cx * scale).toFixed(2);
            const oy = (cy - cy * scale).toFixed(2);

            return (
              <path
                key={s.i}
                d={s.d}
                fill={s.color.fill}
                opacity={hovered !== null && !isHov ? 0.35 : 0.92}
                filter={isHov ? `url(#glow-${s.i})` : undefined}
                transform={isHov ? `scale(${scale}) translate(${ox} ${oy})` : undefined}
                style={{
                  transition: "opacity 0.2s ease, transform 0.2s ease",
                  cursor: "pointer",
                  transformOrigin: `${cx}px ${cy}px`,
                }}
                onMouseEnter={() => setHovered(s.i)}
              />
            );
          })}

          {/* Center hole info */}
          {hoveredSeg ? (
            <>
              <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="central"
                fill="white" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">
                {hoveredSeg.item.category.slice(0, 9)}
              </text>
              <text x={cx} y={cy + 8} textAnchor="middle" dominantBaseline="central"
                fill={hoveredSeg.color.fill} fontSize="12" fontWeight="700" fontFamily="Inter, sans-serif">
                {(hoveredSeg.pct * 100).toFixed(1)}%
              </text>
            </>
          ) : (
            <>
              <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="central"
                fill="rgba(255,255,255,0.5)" fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif"
                letterSpacing="1">
                TOTAL
              </text>
              <text x={cx} y={cy + 9} textAnchor="middle" dominantBaseline="central"
                fill="white" fontSize="11" fontWeight="800" fontFamily="Inter, sans-serif">
                ₹{(total / 1000).toFixed(1)}k
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        {segments.map((s) => {
          const isHov = hovered === s.i;
          const barW = `${(s.pct * 100).toFixed(1)}%`;
          return (
            <div
              key={s.i}
              className="group flex flex-col gap-0.5 cursor-pointer rounded-lg px-2 py-1 transition-all duration-150"
              style={{ background: isHov ? "rgba(255,255,255,0.05)" : "transparent" }}
              onMouseEnter={() => setHovered(s.i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: s.color.fill, boxShadow: `0 0 6px ${s.color.glow}` }}
                  />
                  <span className="truncate text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {s.item.category}
                  </span>
                </div>
                <span className="flex-shrink-0 text-[11px] font-bold tabular-nums" style={{ color: s.color.fill }}>
                  {(s.pct * 100).toFixed(1)}%
                </span>
              </div>
              {/* Mini bar */}
              <div className="h-0.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: barW,
                    background: s.color.fill,
                    boxShadow: isHov ? `0 0 8px ${s.color.glow}` : "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Custom BarComparison ───────────────────────────────── */
function BarComparison({
  buckets,
}: {
  buckets: { label: string; income: number; expense: number }[];
}) {
  const [mounted, setMounted] = useState(false);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const maxVal = Math.max(...buckets.flatMap((b) => [b.income, b.expense]), 1);

  const fmt = (v: number) =>
    v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`;

  return (
    <div className="flex flex-col gap-4 px-1 pt-2 pb-1">
      {/* Y-axis labels + bars */}
      <div className="flex items-end gap-2" style={{ height: "180px" }}>
        {/* Y labels */}
        <div className="flex flex-col justify-between h-full pr-1" style={{ minWidth: "32px" }}>
          {[1, 0.75, 0.5, 0.25, 0].map((frac) => (
            <span key={frac} className="text-[9px] text-right leading-none"
              style={{ color: "rgba(255,255,255,0.28)", fontVariantNumeric: "tabular-nums" }}>
              {fmt(maxVal * frac)}
            </span>
          ))}
        </div>

        {/* Grid + bars container */}
        <div className="relative flex-1 h-full">
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
            <div
              key={frac}
              className="absolute w-full"
              style={{
                bottom: `${frac * 100}%`,
                borderTop: "1px dashed rgba(255,255,255,0.06)",
              }}
            />
          ))}

          {/* Month columns */}
          <div className="relative flex items-end justify-around h-full gap-1">
            {buckets.map((b, i) => {
              const incH = maxVal > 0 ? (b.income / maxVal) * 100 : 0;
              const expH = maxVal > 0 ? (b.expense / maxVal) * 100 : 0;
              const isHov = hoveredCol === i;

              return (
                <div
                  key={b.label}
                  className="flex flex-col items-center gap-1 h-full justify-end w-full"
                  onMouseEnter={() => setHoveredCol(i)}
                  onMouseLeave={() => setHoveredCol(null)}
                  style={{ cursor: "default" }}
                >
                  {/* Tooltip */}
                  {isHov && (
                    <div
                      className="absolute z-10 rounded-xl px-3 py-2 text-[11px] font-semibold pointer-events-none"
                      style={{
                        background: "rgba(10,14,30,0.95)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                        bottom: "100%",
                        transform: "translateY(-8px)",
                        whiteSpace: "nowrap",
                        color: "#fff",
                      }}
                    >
                      <div style={{ color: "#34d399" }}>↑ {fmt(b.income)}</div>
                      <div style={{ color: "#fb7185" }}>↓ {fmt(b.expense)}</div>
                    </div>
                  )}

                  <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: "100%" }}>
                    {/* Income bar */}
                    <div
                      className="bar-fill rounded-t-lg transition-all duration-300 flex-1"
                      style={{
                        height: mounted ? `${incH}%` : "0%",
                        minHeight: b.income > 0 ? "4px" : "0",
                        background: isHov
                          ? "linear-gradient(180deg, #34d399, #10b981)"
                          : "linear-gradient(180deg, rgba(16,185,129,0.9), rgba(16,185,129,0.5))",
                        boxShadow: isHov ? "0 0 12px rgba(16,185,129,0.5)" : "none",
                        transition: "height 0.7s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease, box-shadow 0.2s ease",
                        animationDelay: `${i * 0.08}s`,
                        maxWidth: "22px",
                      }}
                    />
                    {/* Expense bar */}
                    <div
                      className="bar-fill rounded-t-lg transition-all duration-300 flex-1"
                      style={{
                        height: mounted ? `${expH}%` : "0%",
                        minHeight: b.expense > 0 ? "4px" : "0",
                        background: isHov
                          ? "linear-gradient(180deg, #fb7185, #f43f5e)"
                          : "linear-gradient(180deg, rgba(244,63,94,0.85), rgba(244,63,94,0.45))",
                        boxShadow: isHov ? "0 0 12px rgba(244,63,94,0.5)" : "none",
                        transition: "height 0.7s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease, box-shadow 0.2s ease",
                        animationDelay: `${i * 0.08 + 0.04}s`,
                        maxWidth: "22px",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis month labels */}
      <div className="flex justify-around pl-10">
        {buckets.map((b, i) => (
          <span
            key={b.label}
            className="text-[11px] font-semibold transition-colors duration-150"
            style={{ color: hoveredCol === i ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.38)" }}
          >
            {b.label}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.5)" }} />
          <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#f43f5e", boxShadow: "0 0 6px rgba(244,63,94,0.5)" }} />
          <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Expenses</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Utilities ──────────────────────────────────────────── */
function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}

function money(value: number) {
  const sign = value < 0 ? "−" : "";
  const abs = Math.abs(value);
  return `${sign}₹${abs.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

/* ─── Transaction Sheet ──────────────────────────────────── */
function TransactionSheet({
  open, onOpenChange, userId, initial, onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initial: Transaction | null;
  onSaved: () => void;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isEdit = !!initial;

  const [form, setForm] = useState({
    amount: initial?.amount?.toString() ?? "",
    type: (initial?.type ?? "expense") as TxType,
    category: (initial?.category ?? "Food") as Category,
    description: initial?.description ?? "",
    date: initial?.date ?? format(new Date(), "yyyy-MM-dd"),
  });
  const [saving, setSaving] = useState(false);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount <= 0) e.amount = "Enter a positive amount";
    if (!form.date) e.date = "Choose a date";
    if (!CATEGORIES.includes(form.category)) e.category = "Choose a category";
    if (form.type !== "income" && form.type !== "expense") e.type = "Choose a type";
    if (form.description && form.description.length > 120) e.description = "Keep description ≤ 120 chars";
    return e;
  }, [form]);

  async function save() {
    if (Object.keys(errors).length) {
      toast.error(Object.values(errors)[0] ?? "Fix form errors");
      return;
    }
    setSaving(true);
    const t = toast.loading(isEdit ? "Saving…" : "Adding…");
    const payload = {
      user_id: userId,
      amount: Number(form.amount),
      type: form.type,
      category: form.category,
      description: form.description ? form.description : null,
      date: form.date,
    };

    const result = isEdit
      ? await supabase.from("transactions").update(payload).eq("id", initial!.id)
      : await supabase.from("transactions").insert(payload);

    toast.dismiss(t);
    setSaving(false);
    if (result.error) return toast.error(result.error.message);
    toast.success(isEdit ? "Updated" : "Added");
    onSaved();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => { if (saving) return; onOpenChange(v); }}
      title={isEdit ? "Edit transaction" : "Add transaction"}
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-[color:var(--muted-2)]">Amount</label>
            <Input inputMode="decimal" placeholder="0.00" value={form.amount}
              onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))} />
            {errors.amount ? <div className="mt-1 text-xs text-[color:var(--expense)]">{errors.amount}</div> : null}
          </div>
          <div>
            <label className="text-xs text-[color:var(--muted-2)]">Date</label>
            <Input type="date" value={form.date}
              onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} />
            {errors.date ? <div className="mt-1 text-xs text-[color:var(--expense)]">{errors.date}</div> : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-[color:var(--muted-2)]">Type</label>
            <Select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as TxType }))}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
            {errors.type ? <div className="mt-1 text-xs text-[color:var(--expense)]">{errors.type}</div> : null}
          </div>
          <div>
            <label className="text-xs text-[color:var(--muted-2)]">Category</label>
            <Select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as Category }))}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            {errors.category ? <div className="mt-1 text-xs text-[color:var(--expense)]">{errors.category}</div> : null}
          </div>
        </div>

        <div>
          <label className="text-xs text-[color:var(--muted-2)]">Description (optional)</label>
          <Input placeholder="e.g. Groceries, Uber, Rent…" value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          {errors.description ? (
            <div className="mt-1 text-xs text-[color:var(--expense)]">{errors.description}</div>
          ) : (
            <div className="mt-1 text-[10px] text-[color:var(--muted-2)]">{form.description.length}/120</div>
          )}
        </div>

        <div className="pt-2">
          <Button className="w-full" size="lg" onClick={save} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add transaction"}
          </Button>
          <Button className="mt-2 w-full" variant="secondary" size="lg"
            onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
