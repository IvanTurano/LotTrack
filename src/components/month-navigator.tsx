"use client";

import { useSales } from "@/lib/sales-context";
import { SPANISH_MONTHS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MonthNavigator() {
  const { state, dispatch } = useSales();
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

    dispatch({ type: "SET_MONTH", payload: { month: newMonth, year: newYear } });
  }

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigateMonth(-1)}
        aria-label="Mes anterior"
        className="text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#2e2e2e]"
      >
        <ChevronLeft className="size-5" />
      </Button>

      <h2 className="text-lg text-[#fafafa] tracking-tight">
        {SPANISH_MONTHS[selectedMonth]} {selectedYear}
      </h2>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigateMonth(1)}
        aria-label="Mes siguiente"
        className="text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#2e2e2e]"
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}
