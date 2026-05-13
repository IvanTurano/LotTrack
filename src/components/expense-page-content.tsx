"use client";

import { useEffect } from "react";
import { useExpenses } from "@/lib/expense-context";
import { ExpenseBalanceDisplay } from "./expense-balance-display";
import { ExpenseCalendarGrid } from "./expense-calendar-grid";
import { ExpenseDayModal } from "./expense-day-modal";
import { ExpenseStats } from "./expense-stats";
import { FixedExpensesManager } from "./fixed-expenses-manager";
import { CategoryManager } from "./category-manager";
import { WalletManager } from "./wallet-manager";
import { ExpenseMonthNavigator } from "./expense-month-navigator";
import { SPANISH_MONTHS } from "@/lib/utils";

export function ExpensePageContent() {
  const { state, applyFixedExpenses } = useExpenses();
  const { selectedMonth, selectedYear, fixedExpenses } = state;

  // Auto-apply fixed expenses when month changes or when fixed expenses are added/updated
  useEffect(() => {
    applyFixedExpenses();
  }, [selectedMonth, selectedYear, fixedExpenses, applyFixedExpenses]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 px-3 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl text-[#fafafa] font-medium">
          Gastos
        </h1>
        <ExpenseMonthNavigator />
      </div>

      {/* Balance */}
      <ExpenseBalanceDisplay />

      {/* Wallets */}
      <WalletManager />

      {/* Calendar */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm text-[#898989] uppercase tracking-wider">
          {SPANISH_MONTHS[selectedMonth]} {selectedYear}
        </h2>
        <ExpenseCalendarGrid />
      </div>

      {/* Day modal */}
      <ExpenseDayModal />

      {/* Stats */}
      <ExpenseStats />

      {/* Fixed expenses */}
      <FixedExpensesManager />

      {/* Categories */}
      <CategoryManager />
    </div>
  );
}
