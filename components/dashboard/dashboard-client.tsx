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
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";
import { CATEGORIES, type Category, type TxType } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
);

type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: TxType;
  category: Category;
  description: string | null;
  date: string; // yyyy-mm-dd
  created_at: string;
};

type Filters = {
  type: "all" | TxType;
  category: "all" | Category;
  from: string; // yyyy-mm-dd
  to: string; // yyyy-mm-dd
};

const DEFAULT_FILTERS: Filters = {
  type: "all",
  category: "all",
  from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
  to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
};

export function DashboardClient({ userId }: { userId: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const SORT_KEYS = ["date", "amount", "category", "type"] as const;
  type SortKey = (typeof SORT_KEYS)[number];
  const SORT_DIRS = ["asc", "desc"] as const;
  type SortDir = (typeof SORT_DIRS)[number];

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "date",
    dir: "desc",
  });

  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

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

  const monthWindow = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return { start, end };
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
    const pie = {
      labels: expenseByCategory.map((x) => x.category),
      datasets: [
        {
          data: expenseByCategory.map((x) => x.amount),
          backgroundColor: [
            "rgba(43,92,255,0.75)",
            "rgba(147,179,255,0.65)",
            "rgba(255,92,92,0.65)",
            "rgba(38,192,119,0.60)",
            "rgba(255,208,92,0.62)",
            "rgba(255,255,255,0.18)",
            "rgba(0,0,0,0.20)",
            "rgba(43,92,255,0.35)",
          ],
          borderColor: "rgba(255,255,255,0.10)",
          borderWidth: 1,
        },
      ],
    };

    const bar = {
      labels: lastSixMonths.buckets.map((b) => b.label),
      datasets: [
        {
          label: "Income",
          data: lastSixMonths.buckets.map((b) => b.income),
          backgroundColor: "rgba(38,192,119,0.55)",
          borderRadius: 10,
        },
        {
          label: "Expenses",
          data: lastSixMonths.buckets.map((b) => b.expense),
          backgroundColor: "rgba(255,92,92,0.50)",
          borderRadius: 10,
        },
      ],
    };

    const line = {
      labels: lastSixMonths.buckets.map((b) => b.label),
      datasets: [
        {
          label: "Spending",
          data: lastSixMonths.buckets.map((b) => b.expense),
          borderColor: "rgba(43,92,255,0.95)",
          backgroundColor: "rgba(43,92,255,0.16)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: "rgba(43,92,255,0.95)",
        },
      ],
    };

    return { pie, bar, line };
  }, [expenseByCategory, lastSixMonths.buckets]);

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

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setSheetOpen(true);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Income (month)" value={money(currentMonth.income)} tone="income" />
        <StatCard label="Expenses (month)" value={money(currentMonth.expense)} tone="expense" />
        <StatCard label="Net balance" value={money(currentMonth.net)} tone={currentMonth.net >= 0 ? "income" : "expense"} />
        <StatCard
          label="Savings rate"
          value={`${currentMonth.savingsRate.toFixed(1)}%`}
          tone="accent"
          hint="(net / income)"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-3xl p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-2xl leading-none">Transactions</div>
              <div className="mt-1 text-xs text-[color:var(--muted-2)]">
                Filter, sort, and edit in-place.
              </div>
            </div>
            <Button onClick={openCreate}>Add transaction</Button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-12">
            <div className="md:col-span-3">
              <label className="text-xs text-[color:var(--muted-2)]">Type</label>
              <Select
                value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as Filters["type"] }))}
              >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </Select>
            </div>
            <div className="md:col-span-4">
              <label className="text-xs text-[color:var(--muted-2)]">Category</label>
              <Select
                value={filters.category}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, category: e.target.value as Filters["category"] }))
                }
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-[color:var(--muted-2)]">From</label>
              <Input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-[color:var(--muted-2)]">To</label>
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-xs text-[color:var(--muted-2)]">Sort</label>
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
                <option value="amount:desc">Amount ↓</option>
                <option value="amount:asc">Amount ↑</option>
                <option value="category:asc">Category A→Z</option>
                <option value="category:desc">Category Z→A</option>
                <option value="type:asc">Type A→Z</option>
                <option value="type:desc">Type Z→A</option>
              </Select>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <div className="hidden md:block max-h-[520px] overflow-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="sticky top-0 bg-[color:var(--bg)]/85 backdrop-blur">
                  <tr className="text-xs text-[color:var(--muted-2)]">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-[color:var(--muted)]" colSpan={6}>
                        Loading transactions…
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-[color:var(--muted)]" colSpan={6}>
                        No transactions found for these filters.
                      </td>
                    </tr>
                  ) : (
                    rows.map((t) => (
                      <tr key={t.id} className="border-t border-white/10 hover:bg-black/5 dark:hover:bg-white/5">
                        <td className="px-4 py-3 font-mono text-xs text-[color:var(--muted)]">
                          {t.date}
                        </td>
                        <td className="px-4 py-3">
                          <Pill tone={t.type}>{t.type}</Pill>
                        </td>
                        <td className="px-4 py-3">{t.category}</td>
                        <td className="px-4 py-3 text-[color:var(--muted)]">
                          {t.description ?? <span className="text-[color:var(--muted-2)]">—</span>}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-3 text-right font-medium tabular-nums",
                            t.type === "income" ? "text-[color:var(--income)]" : "text-[color:var(--expense)]",
                          )}
                        >
                          {t.type === "expense" ? "-" : "+"}
                          {money(t.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <Button variant="ghost" className="h-9" onClick={() => openEdit(t)}>
                              Edit
                            </Button>
                            <Button variant="ghost" className="h-9 text-[color:var(--expense)]" onClick={() => onDelete(t.id)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col divide-y divide-white/10 md:hidden max-h-[520px] overflow-auto">
              {loading ? (
                <div className="p-8 text-center text-sm text-[color:var(--muted)]">Loading transactions…</div>
              ) : rows.length === 0 ? (
                <div className="p-8 text-center text-sm text-[color:var(--muted)]">No transactions found.</div>
              ) : (
                rows.map((t) => (
                  <div key={t.id} className="flex flex-col gap-3 p-4 hover:bg-black/5 dark:hover:bg-white/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-sm">{t.category}</div>
                        <div className="mt-1 font-mono text-[10px] text-[color:var(--muted-2)]">{t.date}</div>
                        {t.description && (
                          <div className="mt-1 text-xs text-[color:var(--muted)]">{t.description}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right">
                        <div
                          className={cn(
                            "text-sm font-medium tabular-nums",
                            t.type === "income" ? "text-[color:var(--income)]" : "text-[color:var(--expense)]",
                          )}
                        >
                          {t.type === "expense" ? "-" : "+"}
                          {money(t.amount)}
                        </div>
                        <Pill tone={t.type}>{t.type}</Pill>
                      </div>
                    </div>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" className="h-8 px-3 text-xs" onClick={() => openEdit(t)}>
                        Edit
                      </Button>
                      <Button variant="ghost" className="h-8 px-3 text-xs text-[color:var(--expense)]" onClick={() => onDelete(t.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-3xl p-5 md:p-6">
            <div className="flex items-baseline justify-between">
              <div className="font-display text-xl">Expense breakdown</div>
              <div className="text-xs text-[color:var(--muted-2)]">Current month</div>
            </div>
            <div className="mt-4 h-[260px]">
              {expenseByCategory.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-[color:var(--muted)]">
                  Add expenses to see a category breakdown.
                </div>
              ) : (
                <Pie
                  data={charts.pie}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>

          <div className="glass rounded-3xl p-5 md:p-6">
            <div className="font-display text-xl">Income vs expenses</div>
            <div className="mt-3 h-[220px]">
              <Bar
                data={charts.bar}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom" } },
                  scales: {
                    x: { grid: { display: false } },
                    y: { ticks: { callback: (v) => `₹${v}` } },
                  },
                }}
              />
            </div>
          </div>

          <div className="glass rounded-3xl p-5 md:p-6">
            <div className="font-display text-xl">Spending trend</div>
            <div className="mt-3 h-[220px]">
              <Line
                data={charts.line}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom" } },
                  scales: {
                    x: { grid: { display: false } },
                    y: { ticks: { callback: (v) => `₹${v}` } },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <TransactionSheet
        key={`${editing?.id ?? "new"}:${sheetOpen ? "open" : "closed"}`}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        userId={userId}
        initial={editing}
        onSaved={() => {
          setSheetOpen(false);
          setEditing(null);
          void load();
        }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: "income" | "expense" | "accent";
  hint?: string;
}) {
  const color = tone === "income" ? "var(--income)" : tone === "expense" ? "var(--expense)" : "var(--accent)";
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-baseline justify-between">
        <div className="text-xs text-[color:var(--muted-2)]">{label}</div>
        {hint ? <div className="text-[10px] text-[color:var(--muted-2)]">{hint}</div> : null}
      </div>
      <div className="font-display mt-2 text-3xl leading-none" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function Pill({ tone, children }: { tone: TxType; children: string }) {
  const bg = tone === "income" ? "rgba(38,192,119,0.14)" : "rgba(255,92,92,0.14)";
  const fg = tone === "income" ? "var(--income)" : "var(--expense)";
  return (
    <span
      className="inline-flex items-center rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium"
      style={{ background: bg, color: fg }}
    >
      {children}
    </span>
  );
}

function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}

function money(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}₹${abs.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function TransactionSheet({
  open,
  onOpenChange,
  userId,
  initial,
  onSaved,
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
      onOpenChange={(v) => {
        if (saving) return;
        onOpenChange(v);
      }}
      title={isEdit ? "Edit transaction" : "Add transaction"}
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-[color:var(--muted-2)]">Amount</label>
            <Input
              inputMode="decimal"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
            />
            {errors.amount ? <div className="mt-1 text-xs text-[color:var(--expense)]">{errors.amount}</div> : null}
          </div>
          <div>
            <label className="text-xs text-[color:var(--muted-2)]">Date</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
            />
            {errors.date ? <div className="mt-1 text-xs text-[color:var(--expense)]">{errors.date}</div> : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-[color:var(--muted-2)]">Type</label>
            <Select
              value={form.type}
              onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as TxType }))}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
            {errors.type ? <div className="mt-1 text-xs text-[color:var(--expense)]">{errors.type}</div> : null}
          </div>
          <div>
            <label className="text-xs text-[color:var(--muted-2)]">Category</label>
            <Select
              value={form.category}
              onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as Category }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            {errors.category ? (
              <div className="mt-1 text-xs text-[color:var(--expense)]">{errors.category}</div>
            ) : null}
          </div>
        </div>

        <div>
          <label className="text-xs text-[color:var(--muted-2)]">Description (optional)</label>
          <Input
            placeholder="e.g. Groceries, Uber, Rent…"
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
          />
          {errors.description ? (
            <div className="mt-1 text-xs text-[color:var(--expense)]">{errors.description}</div>
          ) : (
            <div className="mt-1 text-[10px] text-[color:var(--muted-2)]">
              {form.description.length}/120
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button className="w-full" size="lg" onClick={save} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add transaction"}
          </Button>
          <Button
            className="mt-2 w-full"
            variant="secondary"
            size="lg"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

