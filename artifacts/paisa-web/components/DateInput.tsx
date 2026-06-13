import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppColors } from "@/hooks/useAppColors";

interface DateInputProps {
  value: string; // YYYY-MM-DD format
  onChange: (val: string) => void;
}

// --- Validation Helpers ---
const isLeapYear = (year: number) => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

const getDaysInMonth = (month: number, year: number) => {
  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28, // Feb
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
  ];
  return daysInMonth[month - 1] || 31;
};

export default function DateInput({ value, onChange }: DateInputProps) {
  const c = useAppColors();

  const [localText, setLocalText] = useState(value || "");
  const [showPicker, setShowPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Sync with external state changes (e.g. modal resets)
  useEffect(() => {
    if (value !== localText) {
      setLocalText(value || "");
    }
  }, [value]);

  // --- Smart Parser & Formatter ---
  // Transforms raw digits into formatted string, auto-padding single digits if they exceed logical limits
  const handleTextChange = (text: string) => {
    // Strip everything except numbers
    let digits = text.replace(/[^0-9]/g, "");

    let y = digits.substring(0, 4);
    let rest = digits.substring(4);

    let m = "";
    if (rest.length > 0) {
      if (rest.length === 1 && parseInt(rest[0], 10) > 1) {
        // Feature: Auto-pad month (e.g. typing '6' becomes '06')
        m = "0" + rest[0];
        rest = rest.substring(1);
      } else if (rest.length >= 2) {
        m = rest.substring(0, 2);
        rest = rest.substring(2);
      } else {
        m = rest;
        rest = "";
      }
    }

    let d = "";
    if (rest.length > 0) {
      if (rest.length === 1 && parseInt(rest[0], 10) > 3) {
        // Feature: Auto-pad day (e.g. typing '5' becomes '05')
        d = "0" + rest[0];
      } else if (rest.length >= 2) {
        d = rest.substring(0, 2);
      } else {
        d = rest;
      }
    }

    // Reconstruct with dashes
    let formatted = y;
    if (y.length === 4 && m.length > 0) formatted += "-" + m;
    if (m.length === 2 && d.length > 0) formatted += "-" + d;

    setLocalText(formatted);
    validateAndPropagate(y, m, d, formatted);
  };

  // Feature: Auto Padding During Editing (onBlur)
  const handleBlur = () => {
    setIsFocused(false);
    const parts = localText.split("-");
    let y = parts[0] || "";
    let m = parts[1] || "";
    let d = parts[2] || "";

    if (m.length === 1) m = "0" + m;
    if (d.length === 1) d = "0" + d;

    let final = y;
    if (y.length === 4 && m.length === 2) final += "-" + m;
    if (m.length === 2 && d.length === 2) final += "-" + d;

    if (final !== localText) {
      setLocalText(final);
      validateAndPropagate(y, m, d, final);
    }
  };

  // --- Segment Validation Engine ---
  const validateAndPropagate = (
    y: string,
    m: string,
    d: string,
    full: string,
  ) => {
    const yNum = parseInt(y, 10);
    const mNum = parseInt(m, 10);
    const dNum = parseInt(d, 10);

    const isYValid = y.length === 4 && yNum >= 1900 && yNum <= 2100;
    const isMValid = m.length === 2 && mNum >= 1 && mNum <= 12;
    const isDValid =
      d.length === 2 && dNum >= 1 && dNum <= getDaysInMonth(mNum, yNum || 2024);

    // Only broadcast up to Context if strictly valid to protect the database
    if (isYValid && isMValid && isDValid) {
      onChange(full);
    }
  };

  // Extract current segments for UI rendering
  const parts = localText.split("-");
  const cy = parts[0] || "";
  const cm = parts[1] || "";
  const cd = parts[2] || "";

  // Segment Error State Flags
  const errY =
    cy.length === 4 && (parseInt(cy, 10) < 1900 || parseInt(cy, 10) > 2100);
  const errM =
    cm.length === 2 && (parseInt(cm, 10) < 1 || parseInt(cm, 10) > 12);
  const errD =
    cd.length === 2 &&
    (parseInt(cd, 10) < 1 ||
      parseInt(cd, 10) >
        getDaysInMonth(parseInt(cm, 10), parseInt(cy, 10) || 2024));
  const hasError = errY || errM || errD;

  // Real-time helper text
  const errorMessage = useMemo(() => {
    if (errY) return "Please enter a valid year.";
    if (errM) return "Month must be between 01 and 12.";
    if (errD)
      return `Month ${cm} has only ${getDaysInMonth(parseInt(cm, 10), parseInt(cy, 10))} days.`;
    return null;
  }, [errY, errM, errD, cm, cy]);

  // Native Picker Handlers
  const handlePickerChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (event.type === "set" && selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const dd = String(selectedDate.getDate()).padStart(2, "0");
      const finalStr = `${yyyy}-${mm}-${dd}`;
      setLocalText(finalStr);
      onChange(finalStr);
    }
  };

  // Parse existing date for the picker fallback
  const pickerDate =
    value && value.length === 10 ? new Date(value) : new Date();

  return (
    <View style={{ marginBottom: hasError ? 18 : 0 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: c.inputBg,
          borderWidth: 1,
          borderColor: hasError
            ? c.expense
            : isFocused
              ? c.primary
              : c.inputBorder,
          borderRadius: 10,
          paddingHorizontal: 12,
        }}
      >
        {/* Input Wrapper - Contains Mask & Invisible Field */}
        <View style={{ flex: 1, height: 42, justifyContent: "center" }}>
          {/* Feature: Progressive Placeholder & Segment Coloring Layer */}
          <View
            style={{
              position: "absolute",
              flexDirection: "row",
              pointerEvents: "none",
            }}
          >
            {/* YEAR */}
            <Text>
              <Text style={{ color: errY ? c.expense : c.text, fontSize: 14 }}>
                {cy}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 14 }}>
                {"YYYY".substring(cy.length)}
              </Text>
            </Text>

            <Text
              style={{
                color: cy.length === 4 ? c.text : c.mutedForeground,
                fontSize: 14,
              }}
            >
              -
            </Text>

            {/* MONTH */}
            <Text>
              <Text style={{ color: errM ? c.expense : c.text, fontSize: 14 }}>
                {cm}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 14 }}>
                {"MM".substring(cm.length)}
              </Text>
            </Text>

            <Text
              style={{
                color: cm.length === 2 ? c.text : c.mutedForeground,
                fontSize: 14,
              }}
            >
              -
            </Text>

            {/* DAY */}
            <Text>
              <Text style={{ color: errD ? c.expense : c.text, fontSize: 14 }}>
                {cd}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 14 }}>
                {"DD".substring(cd.length)}
              </Text>
            </Text>
          </View>

          {/* Actual Keyboard Input - Invisible but receives typing/focus */}
          <TextInput
            value={localText}
            onChangeText={handleTextChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            keyboardType="number-pad"
            maxLength={10}
            selectionColor={c.primary}
            style={{
              flex: 1,
              color: "transparent", // Text hidden, only caret visible
              fontSize: 14,
              padding: 0,
            }}
          />
        </View>

        {/* Date Picker Trigger Icon */}
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={{ padding: 8, marginLeft: 4 }}
        >
          <Feather name="calendar" size={18} color={c.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Real-time Error Feedback */}
      {hasError && errorMessage && (
        <Text
          style={{
            color: c.expense,
            fontSize: 11,
            position: "absolute",
            bottom: -18,
          }}
        >
          {errorMessage}
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
