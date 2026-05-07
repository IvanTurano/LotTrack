"use client";

import { useState, useCallback, useMemo } from "react";
import { useExpenses } from "@/lib/expense-context";
import { formatCurrency } from "@/lib/utils";
import {
  WALLET_TYPE_LABELS,
} from "@/lib/expense-types";
import type { WalletType } from "@/lib/expense-types";
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
  ArrowRightLeft,
  Wallet,
  PiggyBank,
  CreditCard,
  Smartphone,
} from "lucide-react";

const WALLET_TYPE_ICONS: Record<WalletType, typeof Wallet> = {
  cash: PiggyBank,
  bank: CreditCard,
  virtual: Smartphone,
};

const PRESET_COLORS = [
  "#3ecf8e",
  "#6366f1",
  "#f97316",
  "#ef4444",
  "#eab308",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#f43f5e",
  "#898989",
];

export function WalletManager() {
  const {
    state,
    addWallet,
    updateWallet,
    deleteWallet,
    transferBetweenWallets,
  } = useExpenses();
  const { wallets } = state;

  // Create/Edit dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<WalletType>("cash");
  const [color, setColor] = useState("#3ecf8e");

  // Transfer dialog state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const totalBalance = useMemo(
    () => wallets.reduce((sum, w) => sum + w.balance, 0),
    [wallets]
  );

  const resetForm = useCallback(() => {
    setName("");
    setType("cash");
    setColor("#3ecf8e");
    setEditingId(null);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setIsOpen(true);
  }, [resetForm]);

  const openEdit = useCallback(
    (id: string) => {
      const wallet = wallets.find((w) => w.id === id);
      if (!wallet) return;
      setEditingId(wallet.id);
      setName(wallet.name);
      setType(wallet.type);
      setColor(wallet.color);
      setIsOpen(true);
    },
    [wallets]
  );

  const handleSave = useCallback(async () => {
    if (!name || isSaving) return;
    setIsSaving(true);
    try {
      if (editingId) {
        await updateWallet(editingId, { name, type, color });
      } else {
        await addWallet({ name, type, color });
      }
      resetForm();
      setIsOpen(false);
    } catch (err) {
      console.error("Error saving wallet:", err);
    } finally {
      setIsSaving(false);
    }
  }, [name, type, color, editingId, addWallet, updateWallet, resetForm, isSaving]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteWallet(id);
    },
    [deleteWallet]
  );

  const handleTransfer = useCallback(async () => {
    if (!transferFrom || !transferTo || !transferAmount || isTransferring) return;
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) return;

    const sourceWallet = wallets.find((w) => w.id === transferFrom);
    if (!sourceWallet || sourceWallet.balance < amount) return;

    setIsTransferring(true);
    try {
      await transferBetweenWallets(transferFrom, transferTo, amount);
      setTransferFrom("");
      setTransferTo("");
      setTransferAmount("");
      setIsTransferOpen(false);
    } catch (err) {
      console.error("Error transferring:", err);
    } finally {
      setIsTransferring(false);
    }
  }, [transferFrom, transferTo, transferAmount, wallets, transferBetweenWallets, isTransferring]);

  return (
    <>
      <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-[#898989] text-xs uppercase tracking-wider">
              <Wallet className="size-3.5" />
              Billeteras
            </CardTitle>
            <div className="flex gap-2">
              {wallets.length >= 2 && (
                <Button
                  size="sm"
                  onClick={() => setIsTransferOpen(true)}
                  className="bg-transparent hover:bg-[rgba(99,102,241,0.1)] text-[#6366f1] border border-[#6366f1]/30 h-7 px-2 text-xs rounded-full"
                >
                  <ArrowRightLeft className="size-3" />
                  Transferir
                </Button>
              )}
              <Button
                size="sm"
                onClick={openCreate}
                className="bg-transparent hover:bg-[rgba(62,207,142,0.1)] text-[#3ecf8e] border border-[#3ecf8e]/30 h-7 px-2 text-xs rounded-full"
              >
                <Plus className="size-3" />
                Agregar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {wallets.length === 0 ? (
            <p className="text-xs text-[#4d4d4d] italic">
              Creá tu primera billetera para empezar a trackear gastos
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {wallets.map((wallet) => {
                const Icon = WALLET_TYPE_ICONS[wallet.type];
                return (
                  <div
                    key={wallet.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[#2e2e2e] bg-[#0f0f0f]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="size-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${wallet.color}20` }}
                      >
                        <Icon
                          className="size-4"
                          style={{ color: wallet.color }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-[#fafafa]">
                          {wallet.name}
                        </span>
                        <span className="text-xs text-[#898989]">
                          {WALLET_TYPE_LABELS[wallet.type]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          wallet.balance >= 0
                            ? "text-[#fafafa]"
                            : "text-[#ef4444]"
                        }`}
                      >
                        {formatCurrency(wallet.balance)}
                      </span>
                      <button
                        onClick={() => openEdit(wallet.id)}
                        className="text-[#898989] hover:text-[#fafafa] transition-colors"
                        aria-label="Editar"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(wallet.id)}
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
                <span className="text-xs text-[#898989]">Total</span>
                <span
                  className={`text-sm font-medium ${
                    totalBalance >= 0 ? "text-[#fafafa]" : "text-[#ef4444]"
                  }`}
                >
                  {formatCurrency(totalBalance)}
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
              {editingId ? "Editar billetera" : "Nueva billetera"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Nombre (ej: Efectivo, Mercado Pago)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm"
            />
            <Select value={type} onValueChange={(v) => setType(v as WalletType)}>
              <SelectTrigger className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#171717] border-[#2e2e2e]">
                {Object.entries(WALLET_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-[#898989]">Color</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`size-7 rounded-full transition-all ${
                      color === c
                        ? "ring-2 ring-[#fafafa] ring-offset-2 ring-offset-[#171717]"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={!name || isSaving}
              className="bg-[#3ecf8e] hover:bg-[#35b57a] text-[#0f0f0f] font-medium rounded-full h-9 text-sm disabled:opacity-30"
            >
              {editingId ? "Actualizar" : "Crear billetera"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer dialog */}
      <Dialog
        open={isTransferOpen}
        onOpenChange={(open) => {
          if (!open) {
            setTransferFrom("");
            setTransferTo("");
            setTransferAmount("");
            setIsTransferOpen(false);
          }
        }}
      >
        <DialogContent className="bg-[#171717] border-[#2e2e2e] text-[#fafafa] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              Transferir entre billeteras
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-[#898989]">Desde</span>
              <Select value={transferFrom} onValueChange={setTransferFrom}>
                <SelectTrigger className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm">
                  <SelectValue placeholder="Seleccionar origen" />
                </SelectTrigger>
                <SelectContent className="bg-[#171717] border-[#2e2e2e]">
                  {wallets
                    .filter((w) => w.id !== transferTo)
                    .map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({formatCurrency(w.balance)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-[#898989]">Hacia</span>
              <Select value={transferTo} onValueChange={setTransferTo}>
                <SelectTrigger className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm">
                  <SelectValue placeholder="Seleccionar destino" />
                </SelectTrigger>
                <SelectContent className="bg-[#171717] border-[#2e2e2e]">
                  {wallets
                    .filter((w) => w.id !== transferFrom)
                    .map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({formatCurrency(w.balance)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              type="number"
              placeholder="Monto"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm"
              min="0"
              step="0.01"
            />
            {transferFrom &&
              transferAmount &&
              (() => {
                const source = wallets.find((w) => w.id === transferFrom);
                const amount = parseFloat(transferAmount);
                if (source && !isNaN(amount) && source.balance < amount) {
                  return (
                    <p className="text-xs text-[#ef4444] bg-[rgba(239,68,68,0.1)] border border-[#ef4444]/20 rounded-lg p-2">
                      ❌ Fondos insuficientes en {source.name}
                    </p>
                  );
                }
                return null;
              })()}
            <Button
              onClick={handleTransfer}
              disabled={
                !transferFrom ||
                !transferTo ||
                !transferAmount ||
                isTransferring
              }
              className="bg-[#6366f1] hover:bg-[#4f46e5] text-[#fafafa] font-medium rounded-full h-9 text-sm disabled:opacity-30"
            >
              Transferir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
