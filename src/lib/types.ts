export interface DailySale {
  id: string;
  date: string; // "YYYY-MM-DD" — ISO date, no timezone issues
  salesAmount: number; // in ARS, 2 decimal precision
  commission: number; // salesAmount * 0.0275, rounded
  tip: number; // propina, 0 by default
  createdAt: string; // ISO timestamp
}

export interface MonthlyData {
  month: number; // 0-11
  year: number;
  sales: DailySale[];
  totalSales: number;
  totalCommission: number;
  daysLogged: number;
}

export interface SalesState {
  sales: DailySale[];
  selectedMonth: number;
  selectedYear: number;
  editingDate: string; // "YYYY-MM-DD" — date being edited, defaults to today
  isLoading: boolean;
}

export type SalesAction =
  | { type: "LOAD_SALES"; payload: DailySale[] }
  | { type: "SAVE_SALE"; payload: DailySale }
  | { type: "DELETE_SALE"; payload: string }
  | { type: "SET_MONTH"; payload: { month: number; year: number } }
  | { type: "SET_EDITING_DATE"; payload: string };
