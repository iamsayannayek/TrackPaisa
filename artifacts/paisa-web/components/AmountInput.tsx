import React, { useEffect, useState } from "react";
import { TextInput, View, Text, Platform } from "react-native";
import { useAppColors } from "@/hooks/useAppColors";

interface AmountInputProps {
  value: number | undefined;
  onChangeAmount: (val: number) => void;
  placeholder?: string;
  allowDecimals?: boolean;
}

export default function AmountInput({
  value,
  onChangeAmount,
  placeholder = "0.00",
  allowDecimals = true,
}: AmountInputProps) {
  const c = useAppColors();
  const [text, setText] = useState(value ? String(value) : "");
  const [error, setError] = useState("");

  useEffect(() => {
    // Sync external value changes safely.
    // Allows user to pause typing at "12." without the UI resetting to "12"
    let num = 0;
    if (text !== "" && text !== ".") {
      num = parseFloat(text);
    }
    const val = value || 0;

    if (val !== num && !isNaN(num)) {
      setText(value ? String(value) : "");
      setError("");
    }
  }, [value]);

  const handleChange = (v: string) => {
    if (v.includes("-")) {
      setError("Negative amounts are not allowed");
      return;
    }

    if (/[^0-9.]/.test(v)) {
      setError("Only numbers are allowed");
      return;
    }

    if (!allowDecimals && v.includes(".")) {
      setError("Decimals are not allowed here");
      return;
    }

    const parts = v.split(".");
    if (parts.length > 2) {
      setError("Only one decimal point is allowed");
      return;
    }

    setError("");
    setText(v);

    if (v === "" || v === ".") {
      onChangeAmount(0);
    } else {
      const num = parseFloat(v);
      if (!isNaN(num)) {
        onChangeAmount(num);
      }
    }
  };

  return (
    <View style={{ marginBottom: error ? 16 : 0 }}>
      <TextInput
        value={text}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={c.mutedForeground}
        keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
        style={{
          backgroundColor: c.inputBg,
          borderWidth: 1,
          borderColor: error ? c.expense : c.inputBorder,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: c.text,
          fontSize: 14,
        }}
      />
      {error ? (
        <Text
          style={{
            color: c.expense,
            fontSize: 11,
            marginTop: 4,
            position: "absolute",
            bottom: -18,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
