"use client";

import { useState, useCallback, useEffect } from "react";
import { useSales } from "@/lib/sales-context";
import { calculateCommission } from "@/lib/commission";
import { formatCurrency, SPANISH_MONTHS } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Check, CalendarDays, Trash2 } from "lucide-react";

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${d} de ${SPANISH_MONTHS[m - 1]} ${y}`;
}

export function SalesInputSheet() {
  const { state, saveSale, deleteSale, getSaleByDate, dispatch } = useSales();
  const { editingDate } = state;
  const [inputValue, setInputValue] = useState("");
  const [tipValue, setTipValue] = useState("");
  const [saved, setSaved] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const todayStr = getTodayString();
  const isToday = editingDate === todayStr;
  const existingSale = getSaleByDate(editingDate);

  // Pre-fill input when editing date changes
  useEffect(() => {
    if (existingSale) {
      setInputValue(existingSale.salesAmount.toFixed(2));
      setTipValue(existingSale.tip > 0 ? existingSale.tip.toFixed(2) : "");
    } else {
      setInputValue("");
      setTipValue("");
    }
    setSaved(false);
    setDeleted(false);
  }, [editingDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const salesAmount = inputValue === "" ? 0 : parseFloat(inputValue) || 0;
  const tipAmount = tipValue === "" ? 0 : parseFloat(tipValue) || 0;
  const commission = calculateCommission(salesAmount);
  const isEmpty = inputValue.trim() === "";

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: "SET_EDITING_DATE", payload: e.target.value });
    },
    [dispatch]
  );

  const handleGoToToday = useCallback(() => {
    dispatch({ type: "SET_EDITING_DATE", payload: todayStr });
  }, [dispatch, todayStr]);

  const handleSave = useCallback(async () => {
    if (isEmpty || salesAmount <= 0 || isSaving) return;

    setIsSaving(true);
    try {
      const sale = {
        id: existingSale?.id ?? crypto.randomUUID(),
        date: editingDate,
        salesAmount,
        commission,
        tip: tipAmount,
        createdAt: existingSale?.createdAt ?? new Date().toISOString(),
      };

      await saveSale(sale);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      console.error("Error saving sale:", err);
    } finally {
      setIsSaving(false);
    }
  }, [isEmpty, salesAmount, commission, tipAmount, editingDate, existingSale, saveSale, isSaving]);

  const handleDelete = useCallback(async () => {
    if (!existingSale || isSaving) return;

    setIsSaving(true);
    try {
      await deleteSale(existingSale.id);
      setInputValue("");
      setDeleted(true);
      setTimeout(() => setDeleted(false), 1500);
    } catch (err) {
      console.error("Error deleting sale:", err);
    } finally {
      setIsSaving(false);
    }
  }, [existingSale, deleteSale, isSaving]);

  return (
    <div className="border border-[#2e2e2e] rounded-xl bg-[#171717] p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        {/* Date selector */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-[#898989]" />
            <label
              htmlFor="sale-date"
              className="text-xs text-[#898989] uppercase tracking-wider"
            >
              Fecha
            </label>
          </div>
          <div className="flex items-center gap-2">
            {!isToday && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoToToday}
                className="h-7 px-2 text-xs text-[#3ecf8e] hover:text-[#3ecf8e] hover:bg-[rgba(62,207,142,0.1)]"
              >
                Hoy
              </Button>
            )}
            <Input
              id="sale-date"
              type="date"
              value={editingDate}
              onChange={handleDateChange}
              max={todayStr}
              className="h-9 w-auto bg-[#0f0f0f] border-[#363636] text-[#fafafa] focus-visible:border-[#3ecf8e] focus-visible:ring-[rgba(62,207,142,0.2)] [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Date display */}
        <p className="text-sm text-[#b4b4b4]">
          {isToday ? "Hoy" : formatDateDisplay(editingDate)}
          {existingSale && (
            <span className="text-xs text-[#898989] ml-2">(editando)</span>
          )}
        </p>

        {/* Amount input */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="sales-amount"
            className="text-xs text-[#898989] uppercase tracking-wider"
          >
            Monto de ventas
          </label>
          <Input
            id="sales-amount"
            type="text"
            inputMode="decimal"
            aria-label="Monto de ventas del día"
            placeholder="0.00"
            value={inputValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                setInputValue(val);
              }
            }}
            className="h-12 text-xl bg-[#0f0f0f] border-[#363636] text-[#fafafa] placeholder:text-[#4d4d4d] focus-visible:border-[#3ecf8e] focus-visible:ring-[rgba(62,207,142,0.2)]"
          />
        </div>

        {/* Tip input */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="tip-amount"
            className="text-xs text-[#898989] uppercase tracking-wider"
          >
            Propina
          </label>
          <Input
            id="tip-amount"
            type="text"
            inputMode="decimal"
            aria-label="Propina del día"
            placeholder="0.00"
            value={tipValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                setTipValue(val);
              }
            }}
            className="h-12 text-xl bg-[#0f0f0f] border-[#363636] text-[#fafafa] placeholder:text-[#4d4d4d] focus-visible:border-[#3ecf8e] focus-visible:ring-[rgba(62,207,142,0.2)]"
          />
        </div>

        {/* Commission + Tip + Save + Delete */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-xs text-[#898989]">Comisión (2.75%)</span>
              <span className="text-lg text-[#b4b4b4]">
                {formatCurrency(commission)}
              </span>
            </div>
            {tipAmount > 0 && (
              <div className="flex flex-col">
                <span className="text-xs text-[#898989]">Propina</span>
                <span className="text-lg text-[#3ecf8e]">
                  {formatCurrency(tipAmount)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {existingSale && (
              <Button
                onClick={handleDelete}
                disabled={isSaving}
                aria-label="Eliminar venta del día"
                className="bg-transparent hover:bg-[rgba(239,68,68,0.1)] text-[#ef4444] border border-[#ef4444]/30 hover:border-[#ef4444]/50 font-medium rounded-full px-4 h-10 transition-all disabled:opacity-50"
              >
                {deleted ? (
                  <>
                    <Check className="size-4" />
                    Eliminado
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Eliminar
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={isEmpty || salesAmount <= 0 || isSaving}
              aria-label="Guardar venta"
              className="bg-[#3ecf8e] hover:bg-[#35b57a] text-[#0f0f0f] font-medium rounded-full px-6 h-10 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              {saved ? (
                <>
                  <Check className="size-4" />
                  Guardado
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  {existingSale ? "Actualizar" : "Guardar"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
