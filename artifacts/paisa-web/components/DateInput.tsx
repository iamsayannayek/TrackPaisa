import React, { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useAppColors } from "@/hooks/useAppColors";

// YYYY-MM-DD → 8 raw digits
function toDigits(v: string): string {
  return v.replace(/\D/g, "").slice(0, 8);
}

// 8 raw digits → "YYYY-MM-DD" display
function formatDisplay(digits: string): string {
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

// Validate a complete YYYY-MM-DD
function validateDate(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12) return "Month must be 01–12";
  const daysInMonth = new Date(y, m, 0).getDate();
  if (d < 1 || d > daysInMonth) {
    if (m === 2) {
      const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      return `February ${y} has ${leap ? 29 : 28} days`;
    }
    return `Day must be 01–${daysInMonth} for this month`;
  }
  return null;
}

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function DateInput({ value, onChange, placeholder }: DateInputProps) {
  const c = useAppColors();
  const [digits, setDigits] = useState(() => toDigits(value));
  const [error, setError] = useState<string | null>(null);

  // When external value changes (e.g. modal re-opened), sync local digits
  useEffect(() => {
    setDigits(toDigits(value));
    setError(null);
  }, [value]);

  const handleChange = (raw: string) => {
    const d = toDigits(raw);
    setDigits(d);

    if (d.length < 8) {
      setError(null);
      onChange(formatDisplay(d));
      return;
    }

    const y = parseInt(d.slice(0, 4), 10);
    const m = parseInt(d.slice(4, 6), 10);
    const day = parseInt(d.slice(6, 8), 10);
    const err = validateDate(y, m, day);
    setError(err);

    const formatted = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    onChange(formatted);
  };

  const display = formatDisplay(digits);
  const isComplete = digits.length === 8;
  const borderColor = error ? c.expense : isComplete && !error ? c.income : c.inputBorder;

  return (
    <View>
      <TextInput
        value={display}
        onChangeText={handleChange}
        placeholder={placeholder ?? "YYYY-MM-DD"}
        placeholderTextColor={c.mutedForeground}
        keyboardType="numeric"
        maxLength={10}
        style={{
          backgroundColor: c.inputBg,
          borderWidth: 1,
          borderColor,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: c.text,
          fontSize: 14,
        }}
      />
      {error ? (
        <Text style={{ color: c.expense, fontSize: 11, marginTop: 4 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
