"use client";

import { useState, useCallback } from "react";
import { useExpenses } from "@/lib/expense-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Tag } from "lucide-react";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#8b5cf6",
  "#898989",
];

export function CategoryManager() {
  const { state, addCategory, updateCategory, deleteCategory } =
    useExpenses();
  const { categories } = state;

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = useCallback(() => {
    setName("");
    setColor(PRESET_COLORS[0]);
    setEditingId(null);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setIsOpen(true);
  }, [resetForm]);

  const openEdit = useCallback(
    (id: string, currentName: string, currentColor: string) => {
      setEditingId(id);
      setName(currentName);
      setColor(currentColor);
      setIsOpen(true);
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    try {
      if (editingId) {
        await updateCategory(editingId, name.trim(), color);
      } else {
        await addCategory(name.trim(), color);
      }

      resetForm();
      setIsOpen(false);
    } catch (err) {
      console.error("Error saving category:", err);
    } finally {
      setIsSaving(false);
    }
  }, [name, color, editingId, addCategory, updateCategory, resetForm, isSaving]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteCategory(id);
    },
    [deleteCategory]
  );

  return (
    <>
      <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-[#898989] text-xs uppercase tracking-wider">
              <Tag className="size-3.5" />
              Categorías
            </CardTitle>
            <Button
              size="sm"
              onClick={openCreate}
              className="bg-transparent hover:bg-[rgba(62,207,142,0.1)] text-[#3ecf8e] border border-[#3ecf8e]/30 h-7 px-2 text-xs rounded-full"
            >
              <Plus className="size-3" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-xs text-[#4d4d4d] italic">
              No hay categorías configuradas
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2e2e2e] bg-[#0f0f0f] group"
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-[#fafafa]">{cat.name}</span>
                  <button
                    onClick={() => openEdit(cat.id, cat.name, cat.color)}
                    className="text-[#4d4d4d] hover:text-[#fafafa] transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Editar"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-[#4d4d4d] hover:text-[#ef4444] transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
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
              {editingId ? "Editar categoría" : "Nueva categoría"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Nombre de la categoría"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-9 text-sm"
            />
            <div className="flex flex-col gap-2">
              <span className="text-xs text-[#898989]">Color</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`size-7 rounded-full transition-all ${
                      color === c
                        ? "ring-2 ring-[#fafafa] ring-offset-2 ring-offset-[#171717]"
                        : ""
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || isSaving}
              className="bg-[#3ecf8e] hover:bg-[#35b57a] text-[#0f0f0f] font-medium rounded-full h-9 text-sm disabled:opacity-30"
            >
              {editingId ? "Actualizar" : "Crear categoría"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
