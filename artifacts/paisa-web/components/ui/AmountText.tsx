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
  return `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function AmountText({ amount, style, showSign, colored, incomeColor = "#10B981", expenseColor = "#EF4444" }: AmountTextProps) {
  const color = colored ? (amount >= 0 ? incomeColor : expenseColor) : undefined;
  const prefix = showSign ? (amount >= 0 ? "+" : "-") : "";
  return (
    <Text style={[style, color ? { color } : undefined]}>
      {prefix}₹{Math.abs(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
    </Text>
  );
}
