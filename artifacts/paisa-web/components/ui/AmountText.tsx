import React from "react";
import { Text, TextStyle } from "react-native";

interface AmountTextProps {
  amount: number;
  style?: TextStyle;
  showSign?: boolean;
  colored?: boolean;
  incomeColor?: string;
  expenseColor?: string;
}

export function fmt(n: number) {
  const abs = Math.abs(n);
  return `₹${abs.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;
}

export function AmountText({ amount, style, showSign, colored, incomeColor = "#10B981", expenseColor = "#EF4444" }: AmountTextProps) {
  const color = colored ? (amount >= 0 ? incomeColor : expenseColor) : undefined;
  const prefix = showSign ? (amount >= 0 ? "+" : "-") : "";
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
  return (
    <Text style={[style, color ? { color } : undefined]}>
      {prefix}₹{formatted}
    </Text>
  );
}
