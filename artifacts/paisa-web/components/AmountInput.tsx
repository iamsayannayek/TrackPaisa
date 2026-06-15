import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppColors } from "@/hooks/useAppColors";

interface AmountInputProps {
  value?: number; // 🔥 FIXED: Made optional so it accepts 'number | undefined'
  onChangeAmount: (val: number) => void;
  placeholder?: string;
  allowDecimals?: boolean;
}

// Formatters
const fmt = (n: number) =>
  `₹ ${Math.abs(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const cleanExpression = (exp: string) =>
  exp.replace(/×/g, "*").replace(/÷/g, "/");

// Safe Math Evaluator
const evaluateMath = (expr: string): number => {
  try {
    let sanitized = cleanExpression(expr);
    // Remove any trailing operators so partial equations evaluate safely
    sanitized = sanitized.replace(/[+\-*/.]$/, "");
    if (!sanitized) return 0;

    // Strict sanitization: Only allow numbers and basic math operators
    if (!/^[0-9+\-*/. ]+$/.test(sanitized)) return 0;

    const result = new Function("return " + sanitized)();
    return isFinite(result) ? Number(result) : 0;
  } catch {
    return 0;
  }
};

export default function AmountInput({
  value = 0, // 🔥 FIXED: Defaults to 0 if undefined is passed
  onChangeAmount,
  placeholder = "0",
  allowDecimals = true,
}: AmountInputProps) {
  const c = useAppColors();

  const [modalVisible, setModalVisible] = useState(false);
  const [expr, setExpr] = useState(value ? value.toString() : "0");

  // Whenever the modal opens, sync the internal expression with the actual saved value
  useEffect(() => {
    if (modalVisible) {
      setExpr(value ? value.toString() : "0");
    }
  }, [modalVisible, value]);

  const currentResult = useMemo(() => evaluateMath(expr), [expr]);

  // Handle Keypad Logic
  const handlePress = (key: string) => {
    setExpr((prev) => {
      const ops = ["+", "-", "×", "÷"];
      const lastChar = prev.slice(-1);

      // Backspace
      if (key === "⌫") {
        return prev.length > 1 ? prev.slice(0, -1) : "0";
      }

      // Operators
      if (ops.includes(key)) {
        // If last char is also an operator, replace it
        if (ops.includes(lastChar)) {
          return prev.slice(0, -1) + key;
        }
        return prev + key;
      }

      // Decimals
      if (key === ".") {
        if (!allowDecimals) return prev;
        // Prevent multiple decimals in the current number segment
        const parts = prev.split(/[+\-×÷]/);
        const currentPart = parts[parts.length - 1];
        if (currentPart.includes(".")) return prev;
        return prev + ".";
      }

      // Numbers
      if (prev === "0") {
        return key; // Replace initial zero
      }

      return prev + key;
    });
  };

  // Quick Add Shortcuts
  const handleQuickAdd = (amt: number) => {
    const newTotal = currentResult + amt;
    setExpr(newTotal.toString());
  };

  const handleSave = () => {
    onChangeAmount(currentResult);
    setModalVisible(false);
  };

  // Keypad Grid Layout
  const keypadLayout = [
    ["1", "2", "3", "÷"],
    ["4", "5", "6", "×"],
    ["7", "8", "9", "-"],
    [".", "0", "⌫", "+"],
  ];

  return (
    <>
      {/* THE TRIGGER INPUT */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
        style={{
          backgroundColor: c.inputBg,
          borderWidth: 1,
          borderColor: c.inputBorder,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: value > 0 ? c.text : c.mutedForeground,
            fontSize: 16,
            fontWeight: value > 0 ? "700" : "500",
          }}
        >
          {value > 0 ? fmt(value) : `₹ ${placeholder}`}
        </Text>
        <MaterialCommunityIcons
          name="calculator-variant-outline"
          size={20}
          color={c.textSecondary}
        />
      </TouchableOpacity>

      {/* THE SMART CALCULATOR MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />

          <View
            style={{
              backgroundColor: c.background,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingBottom: Platform.OS === "ios" ? 34 : 24,
              paddingTop: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 20,
            }}
          >
            {/* Grabber pill */}
            <View
              style={{
                width: 40,
                height: 5,
                backgroundColor: c.border,
                borderRadius: 3,
                alignSelf: "center",
                marginBottom: 20,
              }}
            />

            {/* DISPLAY SECTION */}
            <View
              style={{
                paddingHorizontal: 24,
                alignItems: "flex-end",
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 18,
                  fontWeight: "500",
                  minHeight: 24,
                  marginBottom: 4,
                  letterSpacing: 1,
                }}
                numberOfLines={1}
              >
                {expr !== currentResult.toString()
                  ? expr.replace(/\*/g, "×").replace(/\//g, "÷")
                  : ""}
              </Text>
              <Text
                style={{
                  color: c.text,
                  fontSize: 44,
                  fontWeight: "900",
                  letterSpacing: -1,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {fmt(currentResult)}
              </Text>
            </View>

            {/* QUICK ADD SHORTCUTS */}
            <View style={{ marginBottom: 20 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
              >
                {[100, 500, 1000, 5000].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    onPress={() => handleQuickAdd(amt)}
                    style={{
                      backgroundColor: c.surfaceElevated,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: c.border,
                    }}
                  >
                    <Text
                      style={{ color: c.text, fontSize: 15, fontWeight: "700" }}
                    >
                      + {amt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* KEYPAD GRID */}
            <View style={{ paddingHorizontal: 20, gap: 10 }}>
              {keypadLayout.map((row, rIdx) => (
                <View key={rIdx} style={{ flexDirection: "row", gap: 10 }}>
                  {row.map((btn) => {
                    const isOp = ["+", "-", "×", "÷"].includes(btn);
                    const isBack = btn === "⌫";

                    return (
                      <TouchableOpacity
                        key={btn}
                        onPress={() => handlePress(btn)}
                        onLongPress={isBack ? () => setExpr("0") : undefined} // Long press backspace to clear
                        style={{
                          flex: 1,
                          height: 60,
                          backgroundColor: isOp
                            ? c.primary + "1A"
                            : c.surfaceElevated,
                          borderRadius: 20,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1,
                          borderColor: isOp ? c.primary + "33" : c.border,
                        }}
                      >
                        {isBack ? (
                          <MaterialCommunityIcons
                            name="backspace-outline"
                            size={24}
                            color={c.text}
                          />
                        ) : (
                          <Text
                            style={{
                              color: isOp ? c.primary : c.text,
                              fontSize: 24,
                              fontWeight: "600",
                            }}
                          >
                            {btn}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* SAVE BUTTON */}
            <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
              <TouchableOpacity
                onPress={handleSave}
                style={{
                  backgroundColor: c.primary,
                  paddingVertical: 18,
                  borderRadius: 20,
                  alignItems: "center",
                  shadowColor: c.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}
                >
                  Confirm Amount
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
