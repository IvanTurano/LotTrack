"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useExpenses } from "@/lib/expense-context";
import { cn, formatCurrency } from "@/lib/utils";
import type { Expense, Income } from "@/lib/expense-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  PiggyBank,
  CreditCard,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import type { WalletType } from "@/lib/expense-types";

const WALLET_TYPE_ICONS: Record<WalletType, typeof Wallet> = {
  cash: PiggyBank,
  bank: CreditCard,
  virtual: Smartphone,
};

export function ExpenseDayModal() {
  const {
    state,
    dispatch,
    getExpensesForDate,
    getIncomesForDate,
    addExpense,
    deleteExpense,
    addIncome,
    deleteIncome,
    getCategoryById,
  } = useExpenses();
  const { editingDate, categories, wallets } = state;

  const isOpen = editingDate !== null;

  // Data
  const [dayExpenses, setDayExpenses] = useState<Expense[]>([]);
  const [dayIncomes, setDayIncomes] = useState<Income[]>([]);

  // Forms
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expense form
  const [expTitle, setExpTitle] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expCategoryId, setExpCategoryId] = useState("");
  const [expWalletId, setExpWalletId] = useState("");
  const [expAmount, setExpAmount] = useState("");

  // Income form
  const [incTitle, setIncTitle] = useState("");
  const [incDesc, setIncDesc] = useState("");
  const [incWalletId, setIncWalletId] = useState("");
  const [incAmount, setIncAmount] = useState("");

  // Selected wallet balance for expense validation
  const selectedExpenseWallet = useMemo(
    () => wallets.find((w) => w.id === expWalletId),
    [wallets, expWalletId]
  );

  const expenseAmountNum = useMemo(() => {
    const n = parseFloat(expAmount);
    return isNaN(n) ? 0 : n;
  }, [expAmount]);

  const hasInsufficientBalance =
    selectedExpenseWallet !== undefined &&
    expenseAmountNum > 0 &&
    selectedExpenseWallet.balance < expenseAmountNum;

  // Refresh data when date changes
  useEffect(() => {
    if (editingDate) {
      setDayExpenses(getExpensesForDate(editingDate));
      setDayIncomes(getIncomesForDate(editingDate));
      setShowExpenseForm(false);
      setShowIncomeForm(false);
      setInsufficientFunds(false);
    }
  }, [editingDate, getExpensesForDate, getIncomesForDate]);

  const refreshData = useCallback(() => {
    if (editingDate) {
      setDayExpenses(getExpensesForDate(editingDate));
      setDayIncomes(getIncomesForDate(editingDate));
    }
  }, [editingDate, getExpensesForDate, getIncomesForDate]);

  const handleClose = useCallback(() => {
    dispatch({ type: "SET_EDITING_DATE", payload: null });
  }, [dispatch]);

  // Helper to get wallet name by id
  const getWalletName = useCallback(
    (walletId: string) => {
      const w = wallets.find((w) => w.id === walletId);
      return w?.name ?? "Sin billetera";
    },
    [wallets]
  );

  const getWalletColor = useCallback(
    (walletId: string) => {
      const w = wallets.find((w) => w.id === walletId);
      return w?.color ?? "#898989";
    },
    [wallets]
  );

  const getWalletType = useCallback(
    (walletId: string): WalletType => {
      const w = wallets.find((w) => w.id === walletId);
      return w?.type ?? "cash";
    },
    [wallets]
  );

  // --- Expense handlers ---
  const handleAddExpense = useCallback(async () => {
    if (!editingDate || !expTitle || !expCategoryId || !expAmount || !expWalletId || isSubmitting) return;
    const amount = parseFloat(expAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsSubmitting(true);
    try {
      const result = await addExpense({
        date: editingDate,
        title: expTitle,
        description: expDesc || undefined,
        categoryId: expCategoryId,
        walletId: expWalletId,
        amount,
      });

      if (!result) {
        setInsufficientFunds(true);
        return;
      }

      setInsufficientFunds(false);
      setExpTitle("");
      setExpDesc("");
      setExpCategoryId("");
      setExpWalletId("");
      setExpAmount("");
      setShowExpenseForm(false);
      refreshData();
    } catch (err) {
      console.error("Error adding expense:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    editingDate,
    expTitle,
    expDesc,
    expCategoryId,
    expWalletId,
    expAmount,
    addExpense,
    refreshData,
    isSubmitting,
  ]);

  const handleDeleteExpense = useCallback(
    async (id: string) => {
      if (!editingDate || isSubmitting) return;
      setIsSubmitting(true);
      try {
        await deleteExpense(editingDate, id);
        setInsufficientFunds(false);
        refreshData();
      } catch (err) {
        console.error("Error deleting expense:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingDate, deleteExpense, refreshData, isSubmitting]
  );

  // --- Income handlers ---
  const handleAddIncome = useCallback(async () => {
    if (!editingDate || !incTitle || !incAmount || !incWalletId || isSubmitting) return;
    const amount = parseFloat(incAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsSubmitting(true);
    try {
      await addIncome({
        date: editingDate,
        title: incTitle,
        description: incDesc || undefined,
        walletId: incWalletId,
        amount,
      });

      setIncTitle("");
      setIncDesc("");
      setIncWalletId("");
      setIncAmount("");
      setShowIncomeForm(false);
      refreshData();
    } catch (err) {
      console.error("Error adding income:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    editingDate,
    incTitle,
    incDesc,
    incWalletId,
    incAmount,
    addIncome,
    refreshData,
    isSubmitting,
  ]);

  const handleDeleteIncome = useCallback(
    async (id: string) => {
      if (!editingDate || isSubmitting) return;
      setIsSubmitting(true);
      try {
        await deleteIncome(editingDate, id);
        refreshData();
      } catch (err) {
        console.error("Error deleting income:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingDate, deleteIncome, refreshData, isSubmitting]
  );

  const formattedDate = editingDate
    ? new Date(editingDate + "T12:00:00").toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  const hasIncomes = dayIncomes.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-[#171717] border-[#2e2e2e] text-[#fafafa] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-medium capitalize">
            {formattedDate}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalle de ingresos y gastos del día
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* ---- INCOMES ---- */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#3ecf8e] flex items-center gap-1.5">
                <ArrowDownLeft className="size-3.5" />
                Ingresos
              </h3>
              <Button
                size="sm"
                onClick={() => setShowIncomeForm(!showIncomeForm)}
                className="bg-transparent hover:bg-[rgba(62,207,142,0.1)] text-[#3ecf8e] border border-[#3ecf8e]/30 h-7 px-2 text-xs rounded-full"
              >
                <Plus className="size-3" />
                Agregar
              </Button>
            </div>

            {dayIncomes.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {dayIncomes.map((inc) => {
                  const walletType = getWalletType(inc.walletId);
                  const Icon = WALLET_TYPE_ICONS[walletType];
                  return (
                    <div
                      key={inc.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-[#2e2e2e] bg-[#0f0f0f]"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-[#fafafa]">
                          {inc.title}
                        </span>
                        <span className="text-xs text-[#898989] flex items-center gap-1">
                          <span
                            className="size-2 rounded-full inline-block"
                            style={{
                              backgroundColor: getWalletColor(inc.walletId),
                            }}
                          />
                          {getWalletName(inc.walletId)}
                          {inc.description && ` · ${inc.description}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#3ecf8e]">
                          +{formatCurrency(inc.amount)}
                        </span>
                        <button
                          onClick={() => handleDeleteIncome(inc.id)}
                          disabled={isSubmitting}
                          className="text-[#898989] hover:text-[#ef4444] transition-colors disabled:opacity-50"
                          aria-label="Eliminar ingreso"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#4d4d4d] italic">
                Sin ingresos este día
              </p>
            )}

            {/* Income form */}
            {showIncomeForm && (
              <div className="flex flex-col gap-2 p-3 rounded-lg border border-[#3ecf8e]/20 bg-[rgba(62,207,142,0.03)]">
                <Input
                  placeholder="Título (ej: Sueldo, Propinas)"
                  value={incTitle}
                  onChange={(e) => setIncTitle(e.target.value)}
                  className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm"
                />
                <Input
                  placeholder="Descripción (opcional)"
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm"
                />
                <div className="flex gap-2">
                  <Select value={incWalletId} onValueChange={setIncWalletId}>
                    <SelectTrigger className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm flex-1">
                      <SelectValue placeholder="Billetera" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#171717] border-[#2e2e2e]">
                      {wallets.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Monto"
                    value={incAmount}
                    onChange={(e) => setIncAmount(e.target.value)}
                    className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm w-28"
                    min="0"
                    step="0.01"
                  />
                </div>
                {wallets.length === 0 && (
                  <p className="text-xs text-[#eab308] bg-[rgba(234,179,8,0.1)] border border-[#eab308]/20 rounded-lg p-2">
                    ⚠️ Creá una billetera primero para poder registrar ingresos.
                  </p>
                )}
                <Button
                  onClick={handleAddIncome}
                  disabled={!incTitle || !incAmount || !incWalletId || isSubmitting}
                  className="bg-[#3ecf8e] hover:bg-[#35b57a] text-[#0f0f0f] font-medium rounded-full h-8 text-xs disabled:opacity-30"
                >
                  Guardar ingreso
                </Button>
              </div>
            )}
          </div>

          {/* ---- EXPENSES ---- */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#ef4444] flex items-center gap-1.5">
                <ArrowUpRight className="size-3.5" />
                Gastos
              </h3>
              <Button
                size="sm"
                onClick={() => {
                  setShowExpenseForm(!showExpenseForm);
                  setInsufficientFunds(false);
                }}
                className="bg-transparent hover:bg-[rgba(239,68,68,0.1)] text-[#ef4444] border border-[#ef4444]/30 h-7 px-2 text-xs rounded-full"
              >
                <Plus className="size-3" />
                Agregar
              </Button>
            </div>

            {dayExpenses.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {dayExpenses.map((exp) => {
                  const walletType = getWalletType(exp.walletId);
                  const Icon = WALLET_TYPE_ICONS[walletType];
                  const cat = getCategoryById(exp.categoryId);
                  return (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-[#2e2e2e] bg-[#0f0f0f]"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-[#fafafa]">
                          {exp.title}
                          {cat && (
                            <span
                              className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${cat.color}20`,
                                color: cat.color,
                              }}
                            >
                              {cat.name}
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-[#898989] flex items-center gap-1">
                          <span
                            className="size-2 rounded-full inline-block"
                            style={{
                              backgroundColor: getWalletColor(exp.walletId),
                            }}
                          />
                          {getWalletName(exp.walletId)}
                          {exp.description && ` · ${exp.description}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#ef4444]">
                          -{formatCurrency(exp.amount)}
                        </span>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          disabled={isSubmitting}
                          className="text-[#898989] hover:text-[#ef4444] transition-colors disabled:opacity-50"
                          aria-label="Eliminar gasto"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#4d4d4d] italic">
                Sin gastos este día
              </p>
            )}

            {/* Expense form */}
            {showExpenseForm && (
              <div className="flex flex-col gap-2 p-3 rounded-lg border border-[#ef4444]/20 bg-[rgba(239,68,68,0.03)]">
                {wallets.length === 0 && (
                  <p className="text-xs text-[#eab308] bg-[rgba(234,179,8,0.1)] border border-[#eab308]/20 rounded-lg p-2">
                    ⚠️ Creá una billetera primero para poder registrar gastos.
                  </p>
                )}
                {!hasIncomes && wallets.length > 0 && (
                  <p className="text-xs text-[#eab308] bg-[rgba(234,179,8,0.1)] border border-[#eab308]/20 rounded-lg p-2">
                    ⚠️ Cargá un ingreso primero para tener fondos disponibles.
                  </p>
                )}
                {insufficientFunds && (
                  <p className="text-xs text-[#ef4444] bg-[rgba(239,68,68,0.1)] border border-[#ef4444]/20 rounded-lg p-2">
                    ❌ Fondos insuficientes en la billetera seleccionada.
                    Cargá un ingreso o cambiá la billetera.
                  </p>
                )}
                <Input
                  placeholder="Título (ej: Almuerzo, Spotify)"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm"
                />
                <Input
                  placeholder="Descripción (opcional)"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm"
                />
                <div className="flex gap-2">
                  <Select
                    value={expCategoryId}
                    onValueChange={setExpCategoryId}
                  >
                    <SelectTrigger className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm flex-1">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#171717] border-[#2e2e2e]">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={expWalletId} onValueChange={setExpWalletId}>
                    <SelectTrigger className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm w-40">
                      <SelectValue placeholder="Billetera" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#171717] border-[#2e2e2e]">
                      {wallets.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} ({formatCurrency(w.balance)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {hasInsufficientBalance && (
                  <div className="flex items-center gap-1.5 text-xs text-[#eab308]">
                    <AlertTriangle className="size-3" />
                    Saldo insuficiente: {formatCurrency(selectedExpenseWallet!.balance)}
                  </div>
                )}
                <Input
                  type="number"
                  placeholder="Monto"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm"
                  min="0"
                  step="0.01"
                />
                <Button
                  onClick={handleAddExpense}
                  disabled={!expTitle || !expCategoryId || !expAmount || !expWalletId || isSubmitting}
                  className="bg-[#ef4444] hover:bg-[#dc2626] text-[#fafafa] font-medium rounded-full h-8 text-xs disabled:opacity-30"
                >
                  Guardar gasto
                </Button>
              </div>
            )}
          </div>

          {/* ---- DAY TOTAL ---- */}
          {(dayExpenses.length > 0 || dayIncomes.length > 0) && (
            <div className="flex items-center justify-between pt-3 border-t border-[#2e2e2e]">
              <span className="text-xs text-[#898989] uppercase tracking-wider">
                Balance del día
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  dayIncomes.reduce((s, i) => s + i.amount, 0) -
                    dayExpenses.reduce((s, e) => s + e.amount, 0) >=
                    0
                    ? "text-[#3ecf8e]"
                    : "text-[#ef4444]"
                )}
              >
                {formatCurrency(
                  dayIncomes.reduce((s, i) => s + i.amount, 0) -
                    dayExpenses.reduce((s, e) => s + e.amount, 0)
                )}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
