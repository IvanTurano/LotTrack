"use client";

import { useMemo } from "react";
import { useSales } from "@/lib/sales-context";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  HandCoins,
  TrendingDown,
  Wallet,
  BarChart3,
  PieChartIcon,
  Receipt,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
} from "lucide-react";

export function DashboardContent() {
  const { getMonthlySales } = useSales();
  const {
    state: expenseState,
    getMonthlyExpenses,
    getMonthlyIncomes,
  } = useExpenses();

  const monthlySales = getMonthlySales();
  const monthlyExpenses = getMonthlyExpenses();
  const monthlyIncomes = getMonthlyIncomes();

  // ---- Sueldo numbers ----
  const totalSales = monthlySales.reduce((s, v) => s + v.salesAmount, 0);
  const totalCommission = monthlySales.reduce((s, v) => s + v.commission, 0);
  const totalTips = monthlySales.reduce((s, v) => s + (v.tip || 0), 0);
  const totalEarnings = totalCommission + totalTips;

  // ---- Gastos numbers ----
  const totalExpenses = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
  const totalIncomes = monthlyIncomes.reduce((s, i) => s + i.amount, 0);
  const expenseBalance = totalIncomes - totalExpenses;

  // ---- Sueldo daily chart ----
  const salesDailyData = useMemo(() => {
    const daysInMonth = new Date(
      expenseState.selectedYear,
      expenseState.selectedMonth + 1,
      0
    ).getDate();

    const commByDay = new Map<number, number>();
    const tipsByDay = new Map<number, number>();

    for (const sale of monthlySales) {
      const day = parseInt(sale.date.split("-")[2], 10);
      commByDay.set(day, (commByDay.get(day) || 0) + sale.commission);
      tipsByDay.set(day, (tipsByDay.get(day) || 0) + (sale.tip || 0));
    }

    const data = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const comm = commByDay.get(d) || 0;
      const tips = tipsByDay.get(d) || 0;
      if (comm > 0 || tips > 0) {
        data.push({ day: String(d), comision: comm, propinas: tips });
      }
    }
    return data;
  }, [monthlySales, expenseState.selectedMonth, expenseState.selectedYear]);

  const salesBarConfig: ChartConfig = {
    comision: { label: "Comisión", color: "#3ecf8e" },
    propinas: { label: "Propinas", color: "#6ee7b7" },
  };

  // ---- Gastos daily chart ----
  const expenseDailyData = useMemo(() => {
    const daysInMonth = new Date(
      expenseState.selectedYear,
      expenseState.selectedMonth + 1,
      0
    ).getDate();

    const incByDay = new Map<number, number>();
    const expByDay = new Map<number, number>();

    for (const inc of monthlyIncomes) {
      const day = parseInt(inc.date.split("-")[2], 10);
      incByDay.set(day, (incByDay.get(day) || 0) + inc.amount);
    }
    for (const exp of monthlyExpenses) {
      const day = parseInt(exp.date.split("-")[2], 10);
      expByDay.set(day, (expByDay.get(day) || 0) + exp.amount);
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
  }, [
    monthlyIncomes,
    monthlyExpenses,
    expenseState.selectedMonth,
    expenseState.selectedYear,
  ]);

  const expenseBarConfig: ChartConfig = {
    ingresos: { label: "Ingresos", color: "#3ecf8e" },
    gastos: { label: "Gastos", color: "#ef4444" },
  };

  // ---- Category donut ----
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of monthlyExpenses) {
      map.set(exp.categoryId, (map.get(exp.categoryId) || 0) + exp.amount);
    }
    return Array.from(map.entries())
      .map(([catId, total]) => {
        const cat = expenseState.categories.find((c) => c.id === catId);
        return {
          name: cat?.name || "Sin categoría",
          value: total,
          color: cat?.color || "#898989",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [monthlyExpenses, expenseState.categories]);

  const pieConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    for (const item of categoryData) {
      config[item.name] = { label: item.name, color: item.color };
    }
    return config;
  }, [categoryData]);

  const daysInCurrentMonth = new Date(
    expenseState.selectedYear,
    expenseState.selectedMonth + 1,
    0
  ).getDate();

  return (
    <div className="flex flex-col gap-6 sm:gap-8 px-3 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[rgba(62,207,142,0.1)] border border-[#3ecf8e]/20 flex items-center justify-center">
          <Scale className="size-4.5 text-[#3ecf8e]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl text-[#fafafa] font-medium">
            Dashboard
          </h1>
          <p className="text-xs text-[#898989]">
            Resumen de tu actividad financiera
          </p>
        </div>
      </div>

      {/* ============================= */}
      {/* SECTION: SUELDO               */}
      {/* ============================= */}
      <SectionHeader
        icon={Receipt}
        label="Sueldo"
        subtitle="Ventas, comisión y propinas del trabajo"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Ventas del mes"
          value={formatCurrency(totalSales)}
          icon={Receipt}
          color="#b4b4b4"
          subtitle={`${monthlySales.length} días`}
        />
        <MetricCard
          label="Comisión (2.75%)"
          value={formatCurrency(totalCommission)}
          icon={TrendingUp}
          color="#3ecf8e"
        />
        <MetricCard
          label="Propinas"
          value={formatCurrency(totalTips)}
          icon={HandCoins}
          color="#6ee7b7"
        />
        <MetricCard
          label="Total ganado"
          value={formatCurrency(totalEarnings)}
          icon={TrendingUp}
          color="#3ecf8e"
          subtitle="Comisión + propinas"
          highlight
        />
      </div>

      {/* Sueldo chart */}
      {salesDailyData.length > 0 && (
        <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[#898989] text-xs uppercase tracking-wider">
              <BarChart3 className="size-3.5" />
              Ganancias diarias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={salesBarConfig}
              className="aspect-auto h-[200px] w-full"
            >
              <BarChart data={salesDailyData}>
                <CartesianGrid vertical={false} stroke="#242424" />
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
                      formatter={(value) =>
                        formatCurrency(value as number)
                      }
                    />
                  }
                />
                <Bar
                  dataKey="comision"
                  fill="#3ecf8e"
                  radius={[3, 3, 0, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="propinas"
                  fill="#6ee7b7"
                  radius={[3, 3, 0, 0]}
                  stackId="a"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Divider */}
      <div className="border-t border-[#2e2e2e]" />

      {/* ============================= */}
      {/* SECTION: GASTOS               */}
      {/* ============================= */}
      <SectionHeader
        icon={Wallet}
        label="Gastos"
        subtitle="Ingresos, gastos y balance personal"
      />

      {/* Gastos metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Ingresos"
          value={formatCurrency(totalIncomes)}
          icon={ArrowDownLeft}
          color="#3ecf8e"
          subtitle={`${monthlyIncomes.length} movimientos`}
        />
        <MetricCard
          label="Gastos"
          value={formatCurrency(totalExpenses)}
          icon={ArrowUpRight}
          color="#ef4444"
          subtitle={`${monthlyExpenses.length} movimientos`}
        />
        <MetricCard
          label="Balance del mes"
          value={formatCurrency(expenseBalance)}
          icon={TrendingDown}
          color={expenseBalance >= 0 ? "#3ecf8e" : "#ef4444"}
          subtitle={expenseBalance >= 0 ? "Positivo" : "Negativo"}
        />
        <MetricCard
          label="Días con gastos"
          value={String(
            new Set(monthlyExpenses.map((e) => e.date)).size
          )}
          icon={Calendar}
          color="#b4b4b4"
          subtitle={`de ${daysInCurrentMonth} días`}
        />
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[#898989] text-xs uppercase tracking-wider">
              <Wallet className="size-3.5" />
              Balance total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl leading-none ${
                expenseState.wallets.reduce((s, w) => s + w.balance, 0) >= 0
                  ? "text-[#fafafa]"
                  : "text-[#ef4444]"
              }`}
            >
              {formatCurrency(expenseState.wallets.reduce((s, w) => s + w.balance, 0))}
            </p>
            {expenseState.wallets.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {expenseState.wallets.map((w) => (
                  <span
                    key={w.id}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${w.color}20`,
                      color: w.color,
                    }}
                  >
                    {w.name}: {formatCurrency(w.balance)}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gastos charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Daily income vs expenses */}
        {expenseDailyData.length > 0 && (
          <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-[#898989] text-xs uppercase tracking-wider">
                <BarChart3 className="size-3.5" />
                Ingresos vs Gastos diarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={expenseBarConfig}
                className="aspect-auto h-[200px] w-full"
              >
                <BarChart data={expenseDailyData}>
                  <CartesianGrid vertical={false} stroke="#242424" />
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
                        formatter={(value) =>
                          formatCurrency(value as number)
                        }
                      />
                    }
                  />
                  <Bar
                    dataKey="ingresos"
                    fill="#3ecf8e"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="gastos"
                    fill="#ef4444"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Category donut */}
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
                config={pieConfig}
                className="mx-auto aspect-square max-h-[180px]"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="name"
                        formatter={(value) =>
                          formatCurrency(value as number)
                        }
                      />
                    }
                  />
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    strokeWidth={0}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex flex-col gap-1.5 mt-3">
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
                    <span className="text-[#fafafa] tabular-nums">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ---- Sub-components ----

function SectionHeader({
  icon: Icon,
  label,
  subtitle,
}: {
  icon: typeof Receipt;
  label: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center size-8 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e]">
        <Icon className="size-4 text-[#898989]" />
      </div>
      <div>
        <h2 className="text-base text-[#fafafa] font-medium">{label}</h2>
        <p className="text-xs text-[#4d4d4d]">{subtitle}</p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
  highlight,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  color: string;
  subtitle?: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`border-[#2e2e2e] bg-[#171717] rounded-xl ${
        highlight ? "ring-1 ring-[#3ecf8e]/20" : ""
      }`}
    >
      <CardHeader className="pb-1.5">
        <CardTitle className="flex items-center gap-2 text-[#898989] text-xs uppercase tracking-wider">
          <Icon className="size-3.5" style={{ color }} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl sm:text-2xl text-[#fafafa] leading-none">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-[#898989] mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
