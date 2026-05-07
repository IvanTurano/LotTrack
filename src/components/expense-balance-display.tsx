"use client";

import { useMemo } from "react";
import { useExpenses } from "@/lib/expense-context";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wallet,
  PiggyBank,
  CreditCard,
  Smartphone,
} from "lucide-react";
import type { WalletType } from "@/lib/expense-types";

const WALLET_TYPE_ICONS: Record<WalletType, typeof Wallet> = {
  cash: PiggyBank,
  bank: CreditCard,
  virtual: Smartphone,
};

export function ExpenseBalanceDisplay() {
  const { state } = useExpenses();
  const { wallets } = state;

  const totalBalance = useMemo(
    () => wallets.reduce((sum, w) => sum + w.balance, 0),
    [wallets]
  );

  if (wallets.length === 0) {
    return (
      <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl">
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-2">
            <Wallet className="size-8 text-[#4d4d4d]" />
            <p className="text-sm text-[#4d4d4d] italic">
              Creá tu primera billetera para empezar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Total balance */}
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
              totalBalance >= 0 ? "text-[#fafafa]" : "text-[#ef4444]"
            }`}
          >
            {formatCurrency(totalBalance)}
          </p>
        </CardContent>
      </Card>

      {/* Individual wallets */}
      <div className="grid grid-cols-2 gap-3">
        {wallets.map((wallet) => {
          const Icon = WALLET_TYPE_ICONS[wallet.type];
          return (
            <Card
              key={wallet.id}
              className="border-[#2e2e2e] bg-[#171717] rounded-xl"
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-[#898989] text-xs uppercase tracking-wider">
                  <Icon className="size-3.5" style={{ color: wallet.color }} />
                  {wallet.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-xl leading-none ${
                    wallet.balance >= 0 ? "text-[#fafafa]" : "text-[#ef4444]"
                  }`}
                >
                  {formatCurrency(wallet.balance)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
