"use client";

import { useExpenses } from "@/lib/expense-context";
import { SPANISH_MONTHS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ExpenseMonthNavigator() {
  const { state, dispatch } = useExpenses();
  const { selectedMonth, selectedYear } = state;

  function navigateMonth(direction: -1 | 1) {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }

    dispatch({
      type: "SET_MONTH",
      payload: { month: newMonth, year: newYear },
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigateMonth(-1)}
        aria-label="Mes anterior"
        className="text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#2e2e2e] size-8"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <span className="text-sm text-[#fafafa] min-w-[120px] text-center">
        {SPANISH_MONTHS[selectedMonth]} {selectedYear}
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigateMonth(1)}
        aria-label="Mes siguiente"
        className="text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#2e2e2e] size-8"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
