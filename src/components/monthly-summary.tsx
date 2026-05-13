"use client";

import { useMemo } from "react";
import { useMonthlySales } from "@/lib/sales-context";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, DollarSign, HandCoins } from "lucide-react";

export function MonthlySummary() {
  const monthlySales = useMonthlySales();

  const { totalCommission, totalTips, totalDelMes, daysLogged } = useMemo(
    () => {
      const totalCommission = monthlySales.reduce((sum, s) => sum + s.commission, 0);
      const totalTips = monthlySales.reduce((sum, s) => sum + (s.tip || 0), 0);
      return {
        totalCommission,
        totalTips,
        totalDelMes: totalCommission + totalTips,
        daysLogged: monthlySales.length,
      };
    },
    [monthlySales]
  );

  const stats = [
    {
      label: "Comisión total",
      value: formatCurrency(totalCommission),
      icon: TrendingUp,
    },
    {
      label: "Propinas",
      value: formatCurrency(totalTips),
      icon: HandCoins,
    },
    {
      label: "Total del mes",
      value: formatCurrency(totalDelMes),
      icon: DollarSign,
    },
    {
      label: "Días registrados",
      value: String(daysLogged),
      icon: Calendar,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="border-[#2e2e2e] bg-[#171717] rounded-xl"
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[#898989] text-xs uppercase tracking-wider">
              <stat.icon className="size-3.5" />
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-[#fafafa] leading-none">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
