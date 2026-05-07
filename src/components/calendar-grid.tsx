"use client";

import { useCallback } from "react";
import { useSales } from "@/lib/sales-context";
import { cn, formatCurrency } from "@/lib/utils";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number): number {
  // 0=Sunday, 1=Monday, ..., 6=Saturday → convert to Monday-first (0=Mon, 6=Sun)
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export function CalendarGrid() {
  const { state, getMonthlySales, dispatch } = useSales();
  const { selectedMonth, selectedYear, editingDate } = state;

  const monthlySales = getMonthlySales();
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
  const today = new Date();
  const isCurrentMonth =
    today.getMonth() === selectedMonth && today.getFullYear() === selectedYear;

  // Build a map of date → sale for quick lookup
  const salesMap = new Map<string, (typeof monthlySales)[0]>();
  for (const sale of monthlySales) {
    salesMap.set(sale.date, sale);
  }

  const handleDayClick = useCallback(
    (dateStr: string) => {
      dispatch({ type: "SET_EDITING_DATE", payload: dateStr });
    },
    [dispatch]
  );

  // --- Mobile: stacked list view (<600px) ---
  const mobileRows: React.ReactNode[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const sale = salesMap.get(dateStr);
    const isToday = isCurrentMonth && today.getDate() === day;
    const isEditing = editingDate === dateStr;
    const hasData = !!sale;

    mobileRows.push(
      <button
        key={`mobile-${day}`}
        type="button"
        onClick={() => handleDayClick(dateStr)}
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border transition-colors w-full text-left",
          isEditing
            ? "border-[#3ecf8e] bg-[rgba(62,207,142,0.05)]"
            : isToday
              ? "border-[rgba(62,207,142,0.3)]"
              : hasData
                ? "border-[#363636]"
                : "border-[#242424]"
        )}
        role="row"
        aria-label={`Día ${day}${sale ? `, ventas ${formatCurrency(sale.salesAmount)}` : ""}`}
      >
        <span
          className={cn(
            "text-sm font-medium tabular-nums",
            isEditing
              ? "text-[#3ecf8e]"
              : isToday
                ? "text-[#3ecf8e]"
                : "text-[#898989]"
          )}
        >
          {day}
        </span>
        {sale ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#fafafa]">
              {formatCurrency(sale.salesAmount)}
            </span>
            <span className="text-xs text-[#b4b4b4]">
              {formatCurrency(sale.commission)}
            </span>
            {sale.tip > 0 && (
              <span className="text-xs text-[#3ecf8e]">
                +{formatCurrency(sale.tip)}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-[#4d4d4d]">—</span>
        )}
      </button>
    );
  }

  // --- Desktop: 7-column grid (≥600px) ---
  const desktopCells: React.ReactNode[] = [];

  // Empty cells for alignment before the 1st
  for (let i = 0; i < firstDay; i++) {
    desktopCells.push(
      <div
        key={`empty-${i}`}
        className="border border-[#242424] rounded-lg min-h-[80px] sm:min-h-[100px]"
      />
    );
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const sale = salesMap.get(dateStr);
    const isToday = isCurrentMonth && today.getDate() === day;
    const isEditing = editingDate === dateStr;
    const hasData = !!sale;

    desktopCells.push(
      <button
        key={day}
        type="button"
        onClick={() => handleDayClick(dateStr)}
        className={cn(
          "border rounded-lg p-2 sm:p-3 min-h-[80px] sm:min-h-[100px] flex flex-col gap-1 transition-colors text-left cursor-pointer",
          isEditing
            ? "border-[#3ecf8e] bg-[rgba(62,207,142,0.05)]"
            : isToday
              ? "border-[rgba(62,207,142,0.3)]"
              : hasData
                ? "border-[#363636]"
                : "border-[#242424]"
        )}
      >
        <span
          className={cn(
            "text-xs font-medium",
            isEditing
              ? "text-[#3ecf8e]"
              : isToday
                ? "text-[#3ecf8e]"
                : "text-[#898989]"
          )}
        >
          {day}
        </span>
        {sale && (
          <>
            <span className="text-sm text-[#fafafa] leading-tight">
              {formatCurrency(sale.salesAmount)}
            </span>
            <span className="text-xs text-[#b4b4b4] leading-tight">
              {formatCurrency(sale.commission)}
            </span>
            {sale.tip > 0 && (
              <span className="text-xs text-[#3ecf8e] leading-tight">
                +{formatCurrency(sale.tip)}
              </span>
            )}
          </>
        )}
      </button>
    );
  }

  return (
    <>
      {/* Mobile view: stacked list */}
      <div
        className="flex flex-col gap-1 sm:hidden"
        role="table"
        aria-label="Calendario de ventas — vista móvil"
      >
        {mobileRows}
      </div>

      {/* Desktop view: 7-column grid */}
      <div className="hidden sm:flex sm:flex-col sm:gap-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs text-[#898989] py-1 font-medium"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">{desktopCells}</div>
      </div>
    </>
  );
}
