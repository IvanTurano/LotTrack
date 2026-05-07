import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
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
  getMonthlySales: () => DailySale[];
  getSaleByDate: (date: string) => DailySale | undefined;
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

  const getMonthlySales = useCallback((): DailySale[] => {
    return state.sales.filter((sale) => {
      const [y, m] = sale.date.split("-").map(Number);
      return y === state.selectedYear && m === state.selectedMonth + 1;
    });
  }, [state.sales, state.selectedMonth, state.selectedYear]);

  const getSaleByDate = useCallback(
    (date: string): DailySale | undefined => {
      return state.sales.find((s) => s.date === date);
    },
    [state.sales]
  );

  return (
    <SalesContext.Provider
      value={{
        state,
        dispatch,
        saveSale,
        deleteSale,
        getMonthlySales,
        getSaleByDate,
      }}
    >
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
