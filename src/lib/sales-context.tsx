import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { DailySale, SalesState, SalesAction } from "./types";
import { storageService } from "./storage";

const now = new Date();
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const initialState: SalesState = {
  sales: [],
  selectedMonth: now.getMonth(),
  selectedYear: now.getFullYear(),
  editingDate: todayStr,
  isLoading: true,
};

function salesReducer(state: SalesState, action: SalesAction): SalesState {
  switch (action.type) {
    case "LOAD_SALES":
      return { ...state, sales: action.payload, isLoading: false };
    case "SAVE_SALE": {
      const existingIndex = state.sales.findIndex(
        (s) => s.date === action.payload.date
      );
      const updated =
        existingIndex >= 0
          ? state.sales.map((s, i) =>
              i === existingIndex ? action.payload : s
            )
          : [...state.sales, action.payload];
      return { ...state, sales: updated };
    }
    case "DELETE_SALE":
      return {
        ...state,
        sales: state.sales.filter((s) => s.id !== action.payload),
      };
    case "SET_MONTH":
      return {
        ...state,
        selectedMonth: action.payload.month,
        selectedYear: action.payload.year,
      };
    case "SET_EDITING_DATE":
      return {
        ...state,
        editingDate: action.payload,
      };
    default:
      return state;
  }
}

interface SalesContextValue {
  state: SalesState;
  dispatch: React.Dispatch<SalesAction>;
  saveSale: (sale: DailySale) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  monthlySales: DailySale[];
  saleByDate: (date: string) => DailySale | undefined;
}

const SalesContext = createContext<SalesContextValue | null>(null);

export function SalesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(salesReducer, initialState);

  useEffect(() => {
    let cancelled = false;
    storageService.getSales().then((sales) => {
      if (!cancelled) {
        dispatch({ type: "LOAD_SALES", payload: sales });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveSale = useCallback(async (sale: DailySale): Promise<void> => {
    await storageService.saveSale(sale);
    dispatch({ type: "SAVE_SALE", payload: sale });
  }, []);

  const deleteSale = useCallback(async (id: string): Promise<void> => {
    await storageService.deleteSale(id);
    dispatch({ type: "DELETE_SALE", payload: id });
  }, []);

  // Derived state: memoized so consumers only re-render when the result changes
  const monthlySales = useMemo(
    () =>
      state.sales.filter((sale) => {
        const [y, m] = sale.date.split("-").map(Number);
        return y === state.selectedYear && m === state.selectedMonth + 1;
      }),
    [state.sales, state.selectedMonth, state.selectedYear]
  );

  // Build a Map from the full sales array for O(1) date lookups
  const salesByDateMap = useMemo(() => {
    const map = new Map<string, DailySale>();
    for (const sale of state.sales) {
      map.set(sale.date, sale);
    }
    return map;
  }, [state.sales]);

  const saleByDate = useCallback(
    (date: string): DailySale | undefined => salesByDateMap.get(date),
    [salesByDateMap]
  );

  // Memoize context value to prevent unnecessary re-renders of all consumers
  const value = useMemo<SalesContextValue>(
    () => ({
      state,
      dispatch,
      saveSale,
      deleteSale,
      monthlySales,
      saleByDate,
    }),
    [state, dispatch, saveSale, deleteSale, monthlySales, saleByDate]
  );

  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
}

export function useSales(): SalesContextValue {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error("useSales must be used within a SalesProvider");
  }
  return context;
}

/**
 * Convenience hook: select only the derived monthly sales.
 * Prevents re-renders when other parts of state change (e.g. editingDate).
 */
export function useMonthlySales() {
  const { monthlySales } = useContext(SalesContext)!;
  return monthlySales;
}
