export const CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Utilities",
  "Salary",
  "Healthcare",
  "Shopping",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type TxType = "income" | "expense";

