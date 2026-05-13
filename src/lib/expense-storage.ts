import type {
  Expense,
  Income,
  Category,
  FixedExpense,
  Wallet,
  WalletType,
} from "./expense-types";
import { DEFAULT_CATEGORIES } from "./expense-types";
import { supabase } from "@/utils/supabase/client";

// ---- Mapping helpers ----

interface ExpenseRow {
  id: string;
  user_id: string;
  date: string;
  title: string;
  description: string | null;
  category_id: string;
  wallet_id: string | null;
  amount: number;
  fixed_expense_id: string | null;
  created_at: number;
}

interface IncomeRow {
  id: string;
  user_id: string;
  date: string;
  title: string;
  description: string | null;
  wallet_id: string | null;
  amount: number;
  created_at: number;
}

interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
}

interface FixedExpenseRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category_id: string;
  wallet_id: string | null;
  amount: number;
  day_of_month: number;
  active: boolean;
  created_at: number;
}

interface WalletRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
}

function rowToWallet(row: WalletRow): Wallet {
  return {
    id: row.id,
    name: row.name,
    type: row.type as WalletType,
    balance: Number(row.balance),
    color: row.color,
  };
}

function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    description: row.description ?? undefined,
    categoryId: row.category_id,
    walletId: row.wallet_id ?? "",
    amount: Number(row.amount),
    fixedExpenseId: row.fixed_expense_id ?? undefined,
    createdAt: row.created_at,
  };
}

function rowToIncome(row: IncomeRow): Income {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    description: row.description ?? undefined,
    walletId: row.wallet_id ?? "",
    amount: Number(row.amount),
    createdAt: row.created_at,
  };
}

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
  };
}

function rowToFixedExpense(row: FixedExpenseRow): FixedExpense {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    categoryId: row.category_id,
    walletId: row.wallet_id ?? "",
    amount: Number(row.amount),
    dayOfMonth: row.day_of_month,
    active: row.active,
    createdAt: row.created_at,
  };
}

// ---- Auth helper ----

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Usuario no autenticado");
  return user.id;
}

// ---- Wallets ----

export async function getWallets(): Promise<Wallet[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching wallets:", error);
    return [];
  }

  return (data ?? []).map(rowToWallet);
}

export async function addWallet(
  wallet: Omit<Wallet, "id" | "balance">
): Promise<Wallet> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("wallets")
    .insert({
      user_id: userId,
      name: wallet.name,
      type: wallet.type,
      balance: 0,
      color: wallet.color,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding wallet:", error);
    throw error;
  }

  return rowToWallet(data);
}

export async function updateWallet(
  id: string,
  updates: Partial<Pick<Wallet, "name" | "type" | "color">>
): Promise<void> {
  const userId = await getUserId();
  const row: Record<string, unknown> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.type !== undefined) row.type = updates.type;
  if (updates.color !== undefined) row.color = updates.color;

  const { error } = await supabase
    .from("wallets")
    .update(row)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating wallet:", error);
    throw error;
  }
}

export async function deleteWallet(id: string): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("wallets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting wallet:", error);
    throw error;
  }
}

export async function updateWalletBalance(
  id: string,
  amountChange: number
): Promise<void> {
  const userId = await getUserId();

  // Use atomic RPC to avoid race condition from read-then-write
  const { error } = await supabase.rpc("update_wallet_balance_atomic", {
    p_wallet_id: id,
    p_user_id: userId,
    p_amount_change: amountChange,
  });

  if (error) {
    // Fallback for old databases without the RPC function
    if (error.message?.includes("function") && error.message?.includes("does not exist")) {
      console.warn("RPC function not found, falling back to non-atomic update. Run schema.sql in Supabase SQL Editor.");
      const { data, error: fetchError } = await supabase
        .from("wallets")
        .select("balance")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching wallet balance:", fetchError);
        throw fetchError;
      }

      const newBalance = Number(data.balance) + amountChange;
      const { error: updateError } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating wallet balance:", updateError);
        throw updateError;
      }
      return;
    }

    console.error("Error updating wallet balance:", error);
    throw error;
  }
}

export async function transferBetweenWallets(
  fromWalletId: string,
  toWalletId: string,
  amount: number
): Promise<void> {
  const userId = await getUserId();

  // Use atomic RPC so both updates succeed or neither does
  const { error } = await supabase.rpc("transfer_between_wallets_atomic", {
    p_from_wallet_id: fromWalletId,
    p_to_wallet_id: toWalletId,
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    // Fallback for old databases without the RPC function
    if (error.message?.includes("function") && error.message?.includes("does not exist")) {
      console.warn("RPC function not found, falling back to non-atomic transfer. Run schema.sql in Supabase SQL Editor.");
      await updateWalletBalance(fromWalletId, -amount);
      await updateWalletBalance(toWalletId, amount);
      return;
    }

    console.error("Error transferring between wallets:", error);
    throw error;
  }
}

// ---- Categories ----

export async function getCategories(): Promise<Category[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return DEFAULT_CATEGORIES;
  }

  if (!data || data.length === 0) {
    // Seed default categories for new user — insert one by one to avoid upsert constraint issues
    const userId2 = await getUserId();
    for (const cat of DEFAULT_CATEGORIES) {
      await supabase
        .from("categories")
        .upsert(
          { id: cat.id, user_id: userId2, name: cat.name, color: cat.color },
          { onConflict: "id,user_id", ignoreDuplicates: true }
        );
    }
    return DEFAULT_CATEGORIES;
  }

  return data.map(rowToCategory);
}

export async function saveCategories(categories: Category[]): Promise<void> {
  const userId = await getUserId();
  const rows = categories.map((cat) => ({
    id: cat.id,
    user_id: userId,
    name: cat.name,
    color: cat.color,
  }));

  const { error } = await supabase
    .from("categories")
    .upsert(rows, { onConflict: "id,user_id", ignoreDuplicates: false });

  if (error) {
    console.error("Error saving categories:", error);
    throw error;
  }
}

export async function addCategory(
  name: string,
  color: string
): Promise<Category> {
  const userId = await getUserId();
  const id = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const category: Category = { id, name, color };

  const { error } = await supabase
    .from("categories")
    .insert({ id, user_id: userId, name, color });

  if (error) {
    console.error("Error adding category:", error);
    throw error;
  }

  return category;
}

export async function updateCategory(
  id: string,
  name: string,
  color: string
): Promise<Category | null> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("categories")
    .update({ name, color })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating category:", error);
    throw error;
  }

  return { id, name, color };
}

export async function deleteCategory(id: string): Promise<boolean> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting category:", error);
    throw error;
  }

  return true;
}

// ---- Expenses ----

export async function getExpensesByDate(date: string): Promise<Expense[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }

  return (data ?? []).map(rowToExpense);
}

export async function addExpense(
  expense: Omit<Expense, "id" | "createdAt">
): Promise<Expense> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      date: expense.date,
      title: expense.title,
      description: expense.description ?? null,
      category_id: expense.categoryId,
      wallet_id: expense.walletId || null,
      amount: expense.amount,
      fixed_expense_id: expense.fixedExpenseId ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding expense:", error);
    throw error;
  }

  return rowToExpense(data);
}

export async function updateExpense(
  id: string,
  updates: Partial<Omit<Expense, "id" | "createdAt">>
): Promise<Expense | null> {
  const userId = await getUserId();
  const row: Record<string, unknown> = {};
  if (updates.date !== undefined) row.date = updates.date;
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.description !== undefined) row.description = updates.description ?? null;
  if (updates.categoryId !== undefined) row.category_id = updates.categoryId;
  if (updates.walletId !== undefined) row.wallet_id = updates.walletId || null;
  if (updates.amount !== undefined) row.amount = updates.amount;
  if (updates.fixedExpenseId !== undefined) row.fixed_expense_id = updates.fixedExpenseId ?? null;

  const { data, error } = await supabase
    .from("expenses")
    .update(row)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error updating expense:", error);
    throw error;
  }

  return data ? rowToExpense(data) : null;
}

export async function deleteExpense(
  _date: string,
  id: string
): Promise<boolean> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }

  return true;
}

export async function getAllExpensesForMonth(
  month: number,
  year: number
): Promise<Expense[]> {
  const userId = await getUserId();
  const monthStr = String(month + 1).padStart(2, "0");
  const startDate = `${year}-${monthStr}-01`;
  const endMonth = month + 2 > 12 ? 1 : month + 2;
  const endYear = month + 2 > 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lt("date", endDate)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching monthly expenses:", error);
    return [];
  }

  return (data ?? []).map(rowToExpense);
}

// ---- Incomes ----

export async function getIncomesByDate(date: string): Promise<Income[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching incomes:", error);
    return [];
  }

  return (data ?? []).map(rowToIncome);
}

export async function addIncome(
  income: Omit<Income, "id" | "createdAt">
): Promise<Income> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("incomes")
    .insert({
      user_id: userId,
      date: income.date,
      title: income.title,
      description: income.description ?? null,
      wallet_id: income.walletId || null,
      amount: income.amount,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding income:", error);
    throw error;
  }

  return rowToIncome(data);
}

export async function updateIncome(
  id: string,
  updates: Partial<Omit<Income, "id" | "createdAt">>
): Promise<Income | null> {
  const userId = await getUserId();
  const row: Record<string, unknown> = {};
  if (updates.date !== undefined) row.date = updates.date;
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.description !== undefined) row.description = updates.description ?? null;
  if (updates.walletId !== undefined) row.wallet_id = updates.walletId || null;
  if (updates.amount !== undefined) row.amount = updates.amount;

  const { data, error } = await supabase
    .from("incomes")
    .update(row)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error updating income:", error);
    throw error;
  }

  return data ? rowToIncome(data) : null;
}

export async function deleteIncome(
  _date: string,
  id: string
): Promise<boolean> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("incomes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting income:", error);
    throw error;
  }

  return true;
}

export async function getAllIncomesForMonth(
  month: number,
  year: number
): Promise<Income[]> {
  const userId = await getUserId();
  const monthStr = String(month + 1).padStart(2, "0");
  const startDate = `${year}-${monthStr}-01`;
  const endMonth = month + 2 > 12 ? 1 : month + 2;
  const endYear = month + 2 > 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lt("date", endDate)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching monthly incomes:", error);
    return [];
  }

  return (data ?? []).map(rowToIncome);
}

// ---- Fixed Expenses ----

export async function getFixedExpenses(): Promise<FixedExpense[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("fixed_expenses")
    .select("*")
    .eq("user_id", userId)
    .order("day_of_month", { ascending: true });

  if (error) {
    console.error("Error fetching fixed expenses:", error);
    return [];
  }

  return (data ?? []).map(rowToFixedExpense);
}

export async function addFixedExpense(
  data: Omit<FixedExpense, "id" | "createdAt">
): Promise<FixedExpense> {
  const userId = await getUserId();
  const { data: row, error } = await supabase
    .from("fixed_expenses")
    .insert({
      user_id: userId,
      title: data.title,
      description: data.description ?? null,
      category_id: data.categoryId,
      wallet_id: data.walletId || null,
      amount: data.amount,
      day_of_month: data.dayOfMonth,
      active: data.active,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding fixed expense:", error);
    throw error;
  }

  return rowToFixedExpense(row);
}

export async function updateFixedExpense(
  id: string,
  updates: Partial<Omit<FixedExpense, "id" | "createdAt">>
): Promise<FixedExpense | null> {
  const userId = await getUserId();
  const row: Record<string, unknown> = {};
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.description !== undefined) row.description = updates.description ?? null;
  if (updates.categoryId !== undefined) row.category_id = updates.categoryId;
  if (updates.walletId !== undefined) row.wallet_id = updates.walletId || null;
  if (updates.amount !== undefined) row.amount = updates.amount;
  if (updates.dayOfMonth !== undefined) row.day_of_month = updates.dayOfMonth;
  if (updates.active !== undefined) row.active = updates.active;

  const { data, error } = await supabase
    .from("fixed_expenses")
    .update(row)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error updating fixed expense:", error);
    throw error;
  }

  return data ? rowToFixedExpense(data) : null;
}

export async function deleteFixedExpense(id: string): Promise<boolean> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("fixed_expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting fixed expense:", error);
    throw error;
  }

  return true;
}

/**
 * Generate expense entries for all active fixed expenses for a given month.
 * Returns the newly created expenses (skips dates that already have a matching fixed expense).
 *
 * Batched: fetches all existing expenses for the month in one query, then inserts in parallel.
 */
export async function applyFixedExpensesForMonth(
  month: number,
  year: number
): Promise<Expense[]> {
  const fixed = (await getFixedExpenses()).filter((f) => f.active);
  if (fixed.length === 0) return [];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const userId = await getUserId();
  const monthStr = String(month + 1).padStart(2, "0");

  // Build all date strings and collect fixed expenses
  const entries: { dateStr: string; fe: FixedExpense }[] = [];
  for (const fe of fixed) {
    const day = Math.min(fe.dayOfMonth, daysInMonth);
    const dateStr = `${year}-${monthStr}-${String(day).padStart(2, "0")}`;
    entries.push({ dateStr, fe });
  }

  // Fetch ALL existing expenses for these dates in a single query
  const startDate = `${year}-${monthStr}-01`;
  const endMonth = month + 2 > 12 ? 1 : month + 2;
  const endYear = month + 2 > 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data: existingData, error: existingError } = await supabase
    .from("expenses")
    .select("id, date, fixed_expense_id")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lt("date", endDate);

  if (existingError) {
    console.error("Error fetching existing expenses:", existingError);
    return [];
  }

  // Build a Set of (date + fixedExpenseId) pairs that already exist
  const existingSet = new Set<string>();
  for (const row of (existingData ?? [])) {
    existingSet.add(`${row.date}:${row.fixed_expense_id}`);
  }

  // Filter entries that don't exist yet
  const toCreate = entries.filter(
    ({ dateStr, fe }) => !existingSet.has(`${dateStr}:${fe.id}`)
  );

  if (toCreate.length === 0) return [];

  // Insert all new expenses in parallel
  const created = await Promise.all(
    toCreate.map(({ dateStr, fe }) =>
      addExpense({
        date: dateStr,
        title: fe.title,
        description: fe.description,
        categoryId: fe.categoryId,
        walletId: fe.walletId,
        amount: fe.amount,
        fixedExpenseId: fe.id,
      })
    )
  );

  return created.filter((e): e is Expense => e !== null);
}
