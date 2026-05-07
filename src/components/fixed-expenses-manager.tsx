"use client";

import { useState, useCallback } from "react";
import { useExpenses } from "@/lib/expense-context";
import { formatCurrency } from "@/lib/utils";
import type { FixedExpense } from "@/lib/expense-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Pencil,
  Repeat,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export function FixedExpensesManager() {
  const {
    state,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
  } = useExpenses();
  const { fixedExpenses, categories, wallets } = state;

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");

  const getWalletName = (id: string) =>
    wallets.find((w) => w.id === id)?.name ?? "Sin billetera";

  const resetForm = useCallback(() => {
    setTitle("");
    setDesc("");
    setCategoryId("");
    setWalletId("");
    setAmount("");
    setDayOfMonth("1");
    setEditingId(null);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setIsOpen(true);
  }, [resetForm]);

  const openEdit = useCallback(
    (fe: FixedExpense) => {
      setEditingId(fe.id);
      setTitle(fe.title);
      setDesc(fe.description || "");
      setCategoryId(fe.categoryId);
      setWalletId(fe.walletId);
      setAmount(String(fe.amount));
      setDayOfMonth(String(fe.dayOfMonth));
      setIsOpen(true);
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!title || !categoryId || !amount || isSaving) return;
    const numAmount = parseFloat(amount);
    const numDay = parseInt(dayOfMonth, 10);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (isNaN(numDay) || numDay < 1 || numDay > 31) return;

    setIsSaving(true);
    try {
      if (editingId) {
        await updateFixedExpense(editingId, {
          title,
          description: desc || undefined,
          categoryId,
          walletId,
          amount: numAmount,
          dayOfMonth: numDay,
        });
      } else {
        await addFixedExpense({
          title,
          description: desc || undefined,
          categoryId,
          walletId,
          amount: numAmount,
          dayOfMonth: numDay,
          active: true,
        });
      }

      resetForm();
      setIsOpen(false);
    } catch (err) {
      console.error("Error saving fixed expense:", err);
    } finally {
      setIsSaving(false);
    }
  }, [
    title,
    desc,
    categoryId,
    walletId,
    amount,
    dayOfMonth,
    editingId,
    addFixedExpense,
    updateFixedExpense,
    resetForm,
    isSaving,
  ]);

  const handleToggle = useCallback(
    async (id: string, current: boolean) => {
      await updateFixedExpense(id, { active: !current });
    },
    [updateFixedExpense]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteFixedExpense(id);
    },
    [deleteFixedExpense]
  );

  const totalMonthly = fixedExpenses
    .filter((f) => f.active)
    .reduce((s, f) => s + f.amount, 0);

  return (
    <>
      <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-[#898989] text-xs uppercase tracking-wider">
              <Repeat className="size-3.5" />
              Gastos fijos mensuales
            </CardTitle>
            <Button
              size="sm"
              onClick={openCreate}
              className="bg-transparent hover:bg-[rgba(139,92,246,0.1)] text-[#8b5cf6] border border-[#8b5cf6]/30 h-7 px-2 text-xs rounded-full"
            >
              <Plus className="size-3" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fixedExpenses.length === 0 ? (
            <p className="text-xs text-[#4d4d4d] italic">
              No hay gastos fijos configurados
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {fixedExpenses.map((fe) => {
                const cat = categories.find((c) => c.id === fe.categoryId);
                return (
                  <div
                    key={fe.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-opacity ${
                      fe.active
                        ? "border-[#2e2e2e] bg-[#0f0f0f]"
                        : "border-[#242424] bg-[#0f0f0f] opacity-50"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-[#fafafa]">
                        {fe.title}
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
                      <span className="text-xs text-[#898989]">
                        Día {fe.dayOfMonth} ·{" "}
                        {getWalletName(fe.walletId)}
                        {fe.description && ` · ${fe.description}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#fafafa]">
                        {formatCurrency(fe.amount)}
                      </span>
                      <button
                        onClick={() => handleToggle(fe.id, fe.active)}
                        className="text-[#898989] hover:text-[#3ecf8e] transition-colors"
                        aria-label={
                          fe.active ? "Desactivar" : "Activar"
                        }
                      >
                        {fe.active ? (
                          <ToggleRight className="size-5 text-[#3ecf8e]" />
                        ) : (
                          <ToggleLeft className="size-5" />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(fe)}
                        className="text-[#898989] hover:text-[#fafafa] transition-colors"
                        aria-label="Editar"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(fe.id)}
                        className="text-[#898989] hover:text-[#ef4444] transition-colors"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-2 border-t border-[#242424]">
                <span className="text-xs text-[#898989]">
                  Total mensual
                </span>
                <span className="text-sm text-[#fafafa]">
                  {formatCurrency(totalMonthly)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit dialog */}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
            setIsOpen(false);
          }
        }}
      >
        <DialogContent className="bg-[#171717] border-[#2e2e2e] text-[#fafafa] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              {editingId ? "Editar gasto fijo" : "Nuevo gasto fijo"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Título (ej: Spotify, Gym)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm"
            />
            <Input
              placeholder="Descripción (opcional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm"
            />
            <div className="flex gap-2">
              <Select value={categoryId} onValueChange={setCategoryId}>
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
              <Select value={walletId} onValueChange={setWalletId}>
                <SelectTrigger className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm w-36">
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
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Monto"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm flex-1"
                min="0"
                step="0.01"
              />
              <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                <SelectTrigger className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#171717] border-[#2e2e2e]">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(
                    (d) => (
                      <SelectItem key={d} value={String(d)}>
                        Día {d}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSave}
              disabled={!title || !categoryId || !walletId || !amount || isSaving}
              className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-[#fafafa] font-medium rounded-full h-9 text-sm disabled:opacity-30"
            >
              {editingId ? "Actualizar" : "Crear gasto fijo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
