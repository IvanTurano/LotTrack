import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Expense,
  Income,
  Category,
  FixedExpense,
  Wallet,
} from "./expense-types";
import {
  getWallets as storageGetWallets,
  addWallet as storageAddWallet,
  updateWallet as storageUpdateWallet,
  deleteWallet as storageDeleteWallet,
  updateWalletBalance,
  transferBetweenWallets as storageTransferBetweenWallets,
  getCategories,
  addCategory as storageAddCategory,
  updateCategory as storageUpdateCategory,
  deleteCategory as storageDeleteCategory,
  addExpense as storageAddExpense,
  deleteExpense as storageDeleteExpense,
  getAllExpensesForMonth,
  addIncome as storageAddIncome,
  deleteIncome as storageDeleteIncome,
  getAllIncomesForMonth,
  getFixedExpenses,
  addFixedExpense as storageAddFixedExpense,
  updateFixedExpense as storageUpdateFixedExpense,
  deleteFixedExpense as storageDeleteFixedExpense,
  applyFixedExpensesForMonth,
} from "./expense-storage";

// ---- State ----

interface ExpenseState {
  wallets: Wallet[];
  categories: Category[];
  fixedExpenses: FixedExpense[];
  monthlyExpenses: Expense[];
  monthlyIncomes: Income[];
  selectedMonth: number;
  selectedYear: number;
  editingDate: string | null;
  isLoading: boolean;
}

type ExpenseAction =
  | { type: "SET_WALLETS"; payload: Wallet[] }
  | { type: "SET_CATEGORIES"; payload: Category[] }
  | { type: "SET_FIXED_EXPENSES"; payload: FixedExpense[] }
  | { type: "SET_MONTHLY_EXPENSES"; payload: Expense[] }
  | { type: "SET_MONTHLY_INCOMES"; payload: Income[] }
  | { type: "SET_MONTH"; payload: { month: number; year: number } }
  | { type: "SET_EDITING_DATE"; payload: string | null }
  | { type: "INCREMENT_MONTH" }
  | { type: "DECREMENT_MONTH" }
  | { type: "SET_LOADING"; payload: boolean };

function getInitialState(): ExpenseState {
  const now = new Date();
  return {
    wallets: [],
    categories: [],
    fixedExpenses: [],
    monthlyExpenses: [],
    monthlyIncomes: [],
    selectedMonth: now.getMonth(),
    selectedYear: now.getFullYear(),
    editingDate: null,
    isLoading: true,
  };
}

function expenseReducer(
  state: ExpenseState,
  action: ExpenseAction
): ExpenseState {
  switch (action.type) {
    case "SET_WALLETS":
      return { ...state, wallets: action.payload };
    case "SET_CATEGORIES":
      return { ...state, categories: action.payload };
    case "SET_FIXED_EXPENSES":
      return { ...state, fixedExpenses: action.payload };
    case "SET_MONTHLY_EXPENSES":
      return { ...state, monthlyExpenses: action.payload };
    case "SET_MONTHLY_INCOMES":
      return { ...state, monthlyIncomes: action.payload };
    case "SET_MONTH":
      return {
        ...state,
        selectedMonth: action.payload.month,
        selectedYear: action.payload.year,
      };
    case "SET_EDITING_DATE":
      return { ...state, editingDate: action.payload };
    case "INCREMENT_MONTH": {
      const next = state.selectedMonth === 11 ? 0 : state.selectedMonth + 1;
      const year =
        state.selectedMonth === 11
          ? state.selectedYear + 1
          : state.selectedYear;
      return { ...state, selectedMonth: next, selectedYear: year };
    }
    case "DECREMENT_MONTH": {
      const prev = state.selectedMonth === 0 ? 11 : state.selectedMonth - 1;
      const year =
        state.selectedMonth === 0
          ? state.selectedYear - 1
          : state.selectedYear;
      return { ...state, selectedMonth: prev, selectedYear: year };
    }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

// ---- Context ----

interface ExpenseContextValue {
  state: ExpenseState;
  dispatch: React.Dispatch<ExpenseAction>;

  // Wallets
  addWallet: (wallet: Omit<Wallet, "id" | "balance">) => Promise<void>;
  updateWallet: (
    id: string,
    updates: Partial<Pick<Wallet, "name" | "type" | "color">>
  ) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  transferBetweenWallets: (
    fromId: string,
    toId: string,
    amount: number
  ) => Promise<void>;

  // Categories
  addCategory: (name: string, color: string) => Promise<void>;
  updateCategory: (id: string, name: string, color: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;

  // Expenses
  getExpensesForDate: (date: string) => Expense[];
  addExpense: (
    expense: Omit<Expense, "id" | "createdAt">
  ) => Promise<Expense | null>;
  deleteExpense: (date: string, id: string) => Promise<void>;
  getMonthlyExpenses: () => Expense[];

  // Incomes
  getIncomesForDate: (date: string) => Income[];
  addIncome: (
    income: Omit<Income, "id" | "createdAt">
  ) => Promise<Income | null>;
  deleteIncome: (date: string, id: string) => Promise<void>;
  getMonthlyIncomes: () => Income[];

  // Fixed expenses
  addFixedExpense: (
    data: Omit<FixedExpense, "id" | "createdAt">
  ) => Promise<void>;
  updateFixedExpense: (
    id: string,
    updates: Partial<Omit<FixedExpense, "id" | "createdAt">>
  ) => Promise<void>;
  deleteFixedExpense: (id: string) => Promise<void>;
  applyFixedExpenses: () => Promise<void>;

  // Date helpers
  hasEntriesForDate: (date: string) => boolean;

  // Refresh
  refreshMonthlyData: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

// ---- Provider ----

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(expenseReducer, getInitialState());
  const [isInitialized, setIsInitialized] = useState(false);

  // Load all data on mount
  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const [wallets, categories, fixedExpenses] = await Promise.all([
          storageGetWallets(),
          getCategories(),
          getFixedExpenses(),
        ]);

        if (cancelled) return;

        dispatch({ type: "SET_WALLETS", payload: wallets });
        dispatch({ type: "SET_CATEGORIES", payload: categories });
        dispatch({ type: "SET_FIXED_EXPENSES", payload: fixedExpenses });

        // Load monthly data
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const [expenses, incomes] = await Promise.all([
          getAllExpensesForMonth(month, year),
          getAllIncomesForMonth(month, year),
        ]);

        if (cancelled) return;

        dispatch({ type: "SET_MONTHLY_EXPENSES", payload: expenses });
        dispatch({ type: "SET_MONTHLY_INCOMES", payload: incomes });
        dispatch({ type: "SET_LOADING", payload: false });
        setIsInitialized(true);
      } catch (err) {
        console.error("Error loading initial data:", err);
        if (!cancelled) {
          dispatch({ type: "SET_LOADING", payload: false });
          setIsInitialized(true);
        }
      }
    }

    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reload monthly data when month changes
  const refreshMonthlyData = useCallback(async () => {
    try {
      const [expenses, incomes] = await Promise.all([
        getAllExpensesForMonth(state.selectedMonth, state.selectedYear),
        getAllIncomesForMonth(state.selectedMonth, state.selectedYear),
      ]);
      dispatch({ type: "SET_MONTHLY_EXPENSES", payload: expenses });
      dispatch({ type: "SET_MONTHLY_INCOMES", payload: incomes });
    } catch (err) {
      console.error("Error refreshing monthly data:", err);
    }
  }, [state.selectedMonth, state.selectedYear]);

  useEffect(() => {
    if (isInitialized) {
      refreshMonthlyData();
    }
  }, [state.selectedMonth, state.selectedYear, isInitialized, refreshMonthlyData]);

  // Helper to refresh wallets after any mutation
  const refreshWallets = useCallback(async () => {
    const w = await storageGetWallets();
    dispatch({ type: "SET_WALLETS", payload: w });
  }, []);

  // --- Wallets ---
  const addWallet = useCallback(
    async (wallet: Omit<Wallet, "id" | "balance">) => {
      await storageAddWallet(wallet);
      await refreshWallets();
    },
    [refreshWallets]
  );

  const updateWallet = useCallback(
    async (
      id: string,
      updates: Partial<Pick<Wallet, "name" | "type" | "color">>
    ) => {
      await storageUpdateWallet(id, updates);
      await refreshWallets();
    },
    [refreshWallets]
  );

  const deleteWallet = useCallback(
    async (id: string) => {
      await storageDeleteWallet(id);
      await refreshWallets();
    },
    [refreshWallets]
  );

  const transferBetweenWallets = useCallback(
    async (fromId: string, toId: string, amount: number) => {
      await storageTransferBetweenWallets(fromId, toId, amount);
      await refreshWallets();
    },
    [refreshWallets]
  );

  // --- Categories ---
  const addCategory = useCallback(async (name: string, color: string) => {
    await storageAddCategory(name, color);
    const cats = await getCategories();
    dispatch({ type: "SET_CATEGORIES", payload: cats });
  }, []);

  const updateCategory = useCallback(
    async (id: string, name: string, color: string) => {
      await storageUpdateCategory(id, name, color);
      const cats = await getCategories();
      dispatch({ type: "SET_CATEGORIES", payload: cats });
    },
    []
  );

  const deleteCategory = useCallback(async (id: string) => {
    await storageDeleteCategory(id);
    const cats = await getCategories();
    dispatch({ type: "SET_CATEGORIES", payload: cats });
  }, []);

  // --- Derived data: memoized Maps for O(1) lookups ---
  const expensesByDateMap = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const exp of state.monthlyExpenses) {
      const arr = map.get(exp.date) || [];
      arr.push(exp);
      map.set(exp.date, arr);
    }
    return map;
  }, [state.monthlyExpenses]);

  const incomesByDateMap = useMemo(() => {
    const map = new Map<string, Income[]>();
    for (const inc of state.monthlyIncomes) {
      const arr = map.get(inc.date) || [];
      arr.push(inc);
      map.set(inc.date, arr);
    }
    return map;
  }, [state.monthlyIncomes]);

  const categoriesMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const cat of state.categories) {
      map.set(cat.id, cat);
    }
    return map;
  }, [state.categories]);

  // --- Date helpers (memoized with Maps, O(1) instead of O(n)) ---
  const getExpensesForDate = useCallback(
    (date: string): Expense[] => expensesByDateMap.get(date) || [],
    [expensesByDateMap]
  );

  const addExpense = useCallback(
    async (
      expense: Omit<Expense, "id" | "createdAt">
    ): Promise<Expense | null> => {
      const wallet = state.wallets.find((w) => w.id === expense.walletId);
      if (!wallet || wallet.balance < expense.amount) return null;

      // Deduct from wallet balance
      await updateWalletBalance(expense.walletId, -expense.amount);
      const created = await storageAddExpense(expense);

      // Refresh wallets and monthly data
      await refreshWallets();
      const expenses = await getAllExpensesForMonth(
        state.selectedMonth,
        state.selectedYear
      );
      dispatch({ type: "SET_MONTHLY_EXPENSES", payload: expenses });
      return created;
    },
    [state.wallets, state.selectedMonth, state.selectedYear, refreshWallets]
  );

  const deleteExpense = useCallback(
    async (date: string, id: string) => {
      // Refund the wallet balance — find the expense in current state
      const expense = state.monthlyExpenses.find((e) => e.id === id);
      if (expense && expense.walletId) {
        await updateWalletBalance(expense.walletId, expense.amount);
      }
      await storageDeleteExpense(date, id);

      // Refresh wallets and monthly data
      await refreshWallets();
      const expenses = await getAllExpensesForMonth(
        state.selectedMonth,
        state.selectedYear
      );
      dispatch({ type: "SET_MONTHLY_EXPENSES", payload: expenses });
    },
    [state.monthlyExpenses, state.selectedMonth, state.selectedYear, refreshWallets]
  );

  const getMonthlyExpenses = useCallback(
    () => state.monthlyExpenses,
    [state.monthlyExpenses]
  );

  // --- Incomes ---
  const getIncomesForDate = useCallback(
    (date: string): Income[] => incomesByDateMap.get(date) || [],
    [incomesByDateMap]
  );

  const addIncome = useCallback(
    async (
      income: Omit<Income, "id" | "createdAt">
    ): Promise<Income | null> => {
      // Add to wallet balance
      await updateWalletBalance(income.walletId, income.amount);
      const created = await storageAddIncome(income);

      // Refresh wallets and monthly data
      await refreshWallets();
      const incomes = await getAllIncomesForMonth(
        state.selectedMonth,
        state.selectedYear
      );
      dispatch({ type: "SET_MONTHLY_INCOMES", payload: incomes });
      return created;
    },
    [state.selectedMonth, state.selectedYear, refreshWallets]
  );

  const deleteIncome = useCallback(
    async (date: string, id: string) => {
      // Deduct from wallet balance (reverse the income)
      const income = state.monthlyIncomes.find((i) => i.id === id);
      if (income && income.walletId) {
        await updateWalletBalance(income.walletId, -income.amount);
      }
      await storageDeleteIncome(date, id);

      // Refresh wallets and monthly data
      await refreshWallets();
      const incomes = await getAllIncomesForMonth(
        state.selectedMonth,
        state.selectedYear
      );
      dispatch({ type: "SET_MONTHLY_INCOMES", payload: incomes });
    },
    [state.monthlyIncomes, state.selectedMonth, state.selectedYear, refreshWallets]
  );

  const getMonthlyIncomes = useCallback(
    () => state.monthlyIncomes,
    [state.monthlyIncomes]
  );

  // --- Fixed expenses ---
  const addFixedExpense = useCallback(
    async (data: Omit<FixedExpense, "id" | "createdAt">) => {
      await storageAddFixedExpense(data);
      const fixed = await getFixedExpenses();
      dispatch({ type: "SET_FIXED_EXPENSES", payload: fixed });
    },
    []
  );

  const updateFixedExpense = useCallback(
    async (
      id: string,
      updates: Partial<Omit<FixedExpense, "id" | "createdAt">>
    ) => {
      await storageUpdateFixedExpense(id, updates);
      const fixed = await getFixedExpenses();
      dispatch({ type: "SET_FIXED_EXPENSES", payload: fixed });
    },
    []
  );

  const deleteFixedExpense = useCallback(async (id: string) => {
    await storageDeleteFixedExpense(id);
    const fixed = await getFixedExpenses();
    dispatch({ type: "SET_FIXED_EXPENSES", payload: fixed });
  }, []);

  const applyFixedExpenses = useCallback(async () => {
    await applyFixedExpensesForMonth(state.selectedMonth, state.selectedYear);
    // Refresh wallets and monthly data after applying
    await refreshWallets();
    const [expenses, incomes] = await Promise.all([
      getAllExpensesForMonth(state.selectedMonth, state.selectedYear),
      getAllIncomesForMonth(state.selectedMonth, state.selectedYear),
    ]);
    dispatch({ type: "SET_MONTHLY_EXPENSES", payload: expenses });
    dispatch({ type: "SET_MONTHLY_INCOMES", payload: incomes });
  }, [state.selectedMonth, state.selectedYear, refreshWallets]);

  // --- Date helpers ---
  const hasEntriesForDate = useCallback(
    (date: string): boolean =>
      expensesByDateMap.has(date) || incomesByDateMap.has(date),
    [expensesByDateMap, incomesByDateMap]
  );

  const getCategoryById = useCallback(
    (id: string): Category | undefined => categoriesMap.get(id),
    [categoriesMap]
  );

  // --- Context value: memoized to prevent unnecessary re-renders ---
  const value = useMemo<ExpenseContextValue>(
    () => ({
      state,
      dispatch,
      addWallet,
      updateWallet,
      deleteWallet,
      transferBetweenWallets,
      addCategory,
      updateCategory,
      deleteCategory,
      getCategoryById,
      getExpensesForDate,
      addExpense,
      deleteExpense,
      getMonthlyExpenses,
      getIncomesForDate,
      addIncome,
      deleteIncome,
      getMonthlyIncomes,
      addFixedExpense,
      updateFixedExpense,
      deleteFixedExpense,
      applyFixedExpenses,
      hasEntriesForDate,
      refreshMonthlyData,
    }),
    [
      state, dispatch, addWallet, updateWallet, deleteWallet,
      transferBetweenWallets, addCategory, updateCategory, deleteCategory,
      getCategoryById, getExpensesForDate, addExpense, deleteExpense,
      getMonthlyExpenses, getIncomesForDate, addIncome, deleteIncome,
      getMonthlyIncomes, addFixedExpense, updateFixedExpense, deleteFixedExpense,
      applyFixedExpenses, hasEntriesForDate, refreshMonthlyData,
    ]
  );

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }
  return context;
}
