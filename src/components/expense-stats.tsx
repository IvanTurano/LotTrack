"use client";

import { useMemo } from "react";
import { useExpenses } from "@/lib/expense-context";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { PieChartIcon, BarChart3, TrendingDown } from "lucide-react";

export function ExpenseStats() {
  const { getMonthlyExpenses, getMonthlyIncomes, state } = useExpenses();
  const { categories } = state;

  const monthlyExpenses = getMonthlyExpenses();
  const monthlyIncomes = getMonthlyIncomes();

  // --- Chart 1: Spending by category (donut) ---
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of monthlyExpenses) {
      map.set(exp.categoryId, (map.get(exp.categoryId) || 0) + exp.amount);
    }
    return Array.from(map.entries())
      .map(([catId, total]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          name: cat?.name || "Sin categoría",
          value: total,
          color: cat?.color || "#898989",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [monthlyExpenses, categories]);

  const categoryChartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    for (const item of categoryData) {
      config[item.name] = { label: item.name, color: item.color };
    }
    return config;
  }, [categoryData]);

  // --- Chart 2: Daily income vs expenses (bar) ---
  const dailyData = useMemo(() => {
    const daysInMonth = new Date(
      state.selectedYear,
      state.selectedMonth + 1,
      0
    ).getDate();

    // Group by day
    const expByDay = new Map<number, number>();
    const incByDay = new Map<number, number>();

    for (const exp of monthlyExpenses) {
      const day = parseInt(exp.date.split("-")[2], 10);
      expByDay.set(day, (expByDay.get(day) || 0) + exp.amount);
    }
    for (const inc of monthlyIncomes) {
      const day = parseInt(inc.date.split("-")[2], 10);
      incByDay.set(day, (incByDay.get(day) || 0) + inc.amount);
    }

    const data = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const inc = incByDay.get(d) || 0;
      const exp = expByDay.get(d) || 0;
      if (inc > 0 || exp > 0) {
        data.push({ day: String(d), ingresos: inc, gastos: exp });
      }
    }
    return data;
  }, [monthlyExpenses, monthlyIncomes, state.selectedMonth, state.selectedYear]);

  const barChartConfig: ChartConfig = {
    ingresos: { label: "Ingresos", color: "#3ecf8e" },
    gastos: { label: "Gastos", color: "#ef4444" },
  };

  // --- Chart 3: Top spending categories bar ---
  const topCategories = useMemo(() => {
    return categoryData.slice(0, 5);
  }, [categoryData]);

  const topCatChartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    for (const item of topCategories) {
      config[item.name] = { label: item.name, color: item.color };
    }
    return config;
  }, [topCategories]);

  // Summary numbers
  const totalExpenses = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
  const totalIncomes = monthlyIncomes.reduce((s, i) => s + i.amount, 0);

  if (monthlyExpenses.length === 0 && monthlyIncomes.length === 0) {
    return (
      <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl">
        <CardContent className="py-8">
          <p className="text-sm text-[#4d4d4d] text-center italic">
            No hay datos este mes para mostrar estadísticas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Donut: spending by category */}
      {categoryData.length > 0 && (
        <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[#898989] text-xs uppercase tracking-wider">
              <PieChartIcon className="size-3.5" />
              Por categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={categoryChartConfig}
              className="mx-auto aspect-square max-h-[200px]"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="name"
                      formatter={(value) => formatCurrency(value as number)}
                    />
                  }
                />
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  strokeWidth={0}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex flex-col gap-1 mt-2">
              {categoryData.slice(0, 4).map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[#b4b4b4]">{item.name}</span>
                  </span>
                  <span className="text-[#fafafa]">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bar: income vs expenses */}
      {dailyData.length > 0 && (
        <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[#898989] text-xs uppercase tracking-wider">
              <BarChart3 className="size-3.5" />
              Ingresos vs Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={barChartConfig}
              className="aspect-auto h-[200px] w-full"
            >
              <BarChart data={dailyData}>
                <CartesianGrid
                  vertical={false}
                  stroke="#242424"
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "#898989" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "#898989" }}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number)}
                    />
                  }
                />
                <Bar
                  dataKey="ingresos"
                  fill="#3ecf8e"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="gastos"
                  fill="#ef4444"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Summary card */}
      <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[#898989] text-xs uppercase tracking-wider">
            <TrendingDown className="size-3.5" />
            Resumen del mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-[#898989]">Total ingresos</span>
              <span className="text-lg text-[#3ecf8e]">
                +{formatCurrency(totalIncomes)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-[#898989]">Total gastos</span>
              <span className="text-lg text-[#ef4444]">
                -{formatCurrency(totalExpenses)}
              </span>
            </div>
            <div className="border-t border-[#2e2e2e] pt-2">
              <span className="text-xs text-[#898989]">
                Balance del mes
              </span>
              <span
                className={`text-xl block ${
                  totalIncomes - totalExpenses >= 0
                    ? "text-[#3ecf8e]"
                    : "text-[#ef4444]"
                }`}
              >
                {formatCurrency(totalIncomes - totalExpenses)}
              </span>
            </div>
            {monthlyExpenses.length > 0 && (
              <div className="flex flex-col">
                <span className="text-xs text-[#898989]">
                  Gasto diario promedio
                </span>
                <span className="text-sm text-[#fafafa]">
                  {formatCurrency(
                    totalExpenses /
                      new Set(monthlyExpenses.map((e) => e.date)).size
                  )}
                </span>
              </div>
            )}
            {topCategories.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#898989]">
                  Top categoría
                </span>
                <span className="text-sm text-[#fafafa] flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: topCategories[0].color }}
                  />
                  {topCategories[0].name} (
                  {formatCurrency(topCategories[0].value)})
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
