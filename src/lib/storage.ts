import type { DailySale } from "./types";
import { supabase } from "@/utils/supabase/client";

export interface StorageService {
  getSales(): Promise<DailySale[]>;
  saveSale(sale: DailySale): Promise<void>;
  deleteSale(id: string): Promise<void>;
  getSalesByMonth(month: number, year: number): Promise<DailySale[]>;
}

// ---- Mapping helpers ----

interface SaleRow {
  id: string;
  user_id: string;
  date: string;
  sales_amount: number;
  commission: number;
  tip: number;
  created_at: string;
}

function rowToSale(row: SaleRow): DailySale {
  return {
    id: row.id,
    date: row.date,
    salesAmount: Number(row.sales_amount),
    commission: Number(row.commission),
    tip: Number(row.tip),
    createdAt: row.created_at,
  };
}

function saleToRow(sale: DailySale, userId: string): Omit<SaleRow, "created_at"> {
  return {
    id: sale.id,
    user_id: userId,
    date: sale.date,
    sales_amount: sale.salesAmount,
    commission: sale.commission,
    tip: sale.tip,
  };
}

// ---- Supabase Service ----

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Usuario no autenticado");
  return user.id;
}

export class SupabaseStorageService implements StorageService {
  async getSales(): Promise<DailySale[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching sales:", error);
      return [];
    }

    return (data ?? []).map(rowToSale);
  }

  async saveSale(sale: DailySale): Promise<void> {
    const userId = await getUserId();
    const row = saleToRow(sale, userId);

    const { error } = await supabase
      .from("sales")
      .upsert(row, { onConflict: "user_id,date" });

    if (error) {
      console.error("Error saving sale:", error);
      throw error;
    }
  }

  async deleteSale(id: string): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase
      .from("sales")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting sale:", error);
      throw error;
    }
  }

  async getSalesByMonth(month: number, year: number): Promise<DailySale[]> {
    const userId = await getUserId();
    const monthStr = String(month + 1).padStart(2, "0");
    const startDate = `${year}-${monthStr}-01`;
    const endMonth = month + 2 > 12 ? 1 : month + 2;
    const endYear = month + 2 > 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lt("date", endDate)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching sales by month:", error);
      return [];
    }

    return (data ?? []).map(rowToSale);
  }
}

export const storageService = new SupabaseStorageService();
