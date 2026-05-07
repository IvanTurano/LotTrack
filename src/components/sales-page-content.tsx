"use client";

import { MonthNavigator } from "@/components/month-navigator";
import { MonthlySummary } from "@/components/monthly-summary";
import { CalendarGrid } from "@/components/calendar-grid";
import { SalesInputSheet } from "@/components/sales-input-sheet";

export function SalesPageContent() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full px-3 sm:px-6 py-4 sm:py-6">
      <MonthNavigator />
      <MonthlySummary />
      <SalesInputSheet />
      <CalendarGrid />
    </div>
  );
}
