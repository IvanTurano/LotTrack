// ============================================================
// Expense Tracker Types
// ============================================================

// ---- Wallets ----

export type WalletType = "cash" | "bank" | "virtual";

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  color: string;
}

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  cash: "Efectivo",
  bank: "Banco",
  virtual: "Billetera Virtual",
};

export const WALLET_TYPE_COLORS: Record<WalletType, string> = {
  cash: "#3ecf8e",
  bank: "#6366f1",
  virtual: "#f97316",
};

// ---- Core entities ----

export interface Category {
  id: string;
  name: string;
  color: string; // hex color for charts
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
  categoryId: string;
  walletId: string;
  amount: number;
  fixedExpenseId?: string; // links to the fixed expense template that generated this
  createdAt: number;
}

export interface Income {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
  walletId: string;
  amount: number;
  createdAt: number;
}

export interface FixedExpense {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  walletId: string;
  amount: number;
  dayOfMonth: number; // 1-31
  active: boolean;
  createdAt: number;
}

export interface ExpenseState {
  wallets: Wallet[];
  categories: Category[];
  fixedExpenses: FixedExpense[];
  monthlyExpenses: Expense[];
  monthlyIncomes: Income[];
  selectedMonth: number; // 0-11
  selectedYear: number;
  editingDate: string | null;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-comida", name: "Comida", color: "#ef4444" },
  { id: "cat-transporte", name: "Transporte", color: "#f97316" },
  { id: "cat-servicios", name: "Servicios", color: "#eab308" },
  { id: "cat-entretenimiento", name: "Entretenimiento", color: "#a855f7" },
  { id: "cat-salud", name: "Salud", color: "#ec4899" },
  { id: "cat-educacion", name: "Educación", color: "#6366f1" },
  { id: "cat-hogar", name: "Hogar", color: "#14b8a6" },
  { id: "cat-ropa", name: "Ropa", color: "#f43f5e" },
  { id: "cat-suscripcion", name: "Suscripción", color: "#8b5cf6" },
  { id: "cat-otro", name: "Otro", color: "#898989" },
];
