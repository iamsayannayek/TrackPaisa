import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppColors } from "@/hooks/useAppColors";
import { useApp } from "@/context/AppContext";

interface DateInputProps {
  value: string; // YYYY-MM-DD format
  onChange: (val: string) => void;
}

export default function DateInput({ value, onChange }: DateInputProps) {
  const app = useApp();
  const c = useAppColors();

  const [localText, setLocalText] = useState(value || "");
  const [showPicker, setShowPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync with external state changes (e.g., when editing an existing transaction)
  useEffect(() => {
    if (value !== localText) {
      setLocalText(value || "");
    }
  }, [value]);

  const handleTextChange = (text: string) => {
    // Allow user to safely backspace over dashes
    if (
      localText.length > text.length &&
      localText.endsWith("-") &&
      text.length === localText.length - 1
    ) {
      setLocalText(text);
      return;
    }

    // Strip out all non-numeric characters
    const digits = text.replace(/[^0-9]/g, "");
    let formatted = digits;

    // Auto-insert dashes at the correct positions (YYYY-MM-DD)
    if (digits.length > 4) {
      formatted = digits.slice(0, 4) + "-" + digits.slice(4);
    }
    if (digits.length > 6) {
      formatted = formatted.slice(0, 7) + "-" + digits.slice(6, 8);
    }

    setLocalText(formatted);

    // Validate the date only when it's fully typed out
    if (formatted.length === 10) {
      validateAndSave(formatted);
    } else {
      setErrorMsg(null);
    }
  };

  const validateAndSave = (dateStr: string) => {
    const parts = dateStr.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);

    if (y < 1900 || y > 2100) {
      setErrorMsg("Invalid year");
      return;
    }
    if (m < 1 || m > 12) {
      setErrorMsg("Invalid month");
      return;
    }

    // Leap year logic
    const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const daysInM = [
      31,
      isLeap ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ][m - 1];

    if (d < 1 || d > daysInM) {
      setErrorMsg(`Invalid day for month ${m}`);
      return;
    }

    // If completely valid, clear error and save to Context
    setErrorMsg(null);
    onChange(dateStr);
  };

  // Feature: Auto-pad single digits when leaving the input field (e.g. 2026-6-5 -> 2026-06-05)
  const handleBlur = () => {
    setIsFocused(false);
    if (localText && localText.length < 10) {
      const parts = localText.split("-");
      if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1].padStart(2, "0");
        const d = parts[2].padStart(2, "0");

        if (y.length === 4) {
          const padded = `${y}-${m}-${d}`;
          setLocalText(padded);
          validateAndSave(padded);
        }
      }
    }
  };

  const handlePickerChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (event.type === "set" && selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const dd = String(selectedDate.getDate()).padStart(2, "0");
      const finalStr = `${yyyy}-${mm}-${dd}`;

      setLocalText(finalStr);
      onChange(finalStr);
      setErrorMsg(null);
    }
  };

  const pickerDate =
    value && value.length === 10 ? new Date(value) : new Date();

  return (
    <View style={{ marginBottom: errorMsg ? 18 : 0 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: c.inputBg,
          borderWidth: 1,
          borderColor: errorMsg
            ? c.expense
            : isFocused
              ? c.primary
              : c.inputBorder,
          borderRadius: 10,
          paddingHorizontal: 12,
        }}
      >
        <TextInput
          value={localText}
          onChangeText={handleTextChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={c.mutedForeground}
          keyboardType="number-pad"
          maxLength={10}
          selectionColor={c.primary}
          style={{
            flex: 1,
            color: c.text, // Explicitly uses your Theme's text color globally
            fontSize: 14,
            paddingVertical: 10,
          }}
        />

        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={{ padding: 8, marginLeft: 4 }}
        >
          <Feather name="calendar" size={18} color={c.textSecondary} />
        </TouchableOpacity>
      </View>

      {errorMsg && (
        <Text
          style={{
            color: c.expense,
            fontSize: 11,
            position: "absolute",
            bottom: -18,
          }}
        >
          {errorMsg}
        </Text>
      )}

      {/* --- Native Modals --- */}
      {showPicker && Platform.OS === "android" && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="calendar"
          onChange={handlePickerChange}
        />
      )}

      {showPicker && Platform.OS === "ios" && (
        <Modal transparent animationType="fade">
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          >
            <View
              style={{
                backgroundColor: c.surface,
                paddingBottom: 24,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: c.border,
                }}
              >
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text
                    style={{
                      color: c.primary,
                      fontWeight: "600",
                      fontSize: 16,
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                themeVariant={app.isDarkMode ? "dark" : "light"}
                textColor={c.text}
                onChange={handlePickerChange}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}
