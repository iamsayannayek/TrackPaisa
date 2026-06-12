import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAppColors } from "@/hooks/useAppColors";

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

interface SelectPickerProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SelectPicker({
  options,
  value,
  onChange,
  placeholder = "Select...",
}: SelectPickerProps) {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  const grouped = useMemo(() => {
    const groups: { group: string; items: SelectOption[] }[] = [];
    const ungrouped: SelectOption[] = [];

    options.forEach((opt) => {
      if (opt.group) {
        const existing = groups.find((g) => g.group === opt.group);
        if (existing) existing.items.push(opt);
        else groups.push({ group: opt.group, items: [opt] });
      } else {
        ungrouped.push(opt);
      }
    });

    const result: { type: "header" | "item"; label: string; value?: string }[] = [];
    ungrouped.forEach((o) => result.push({ type: "item", label: o.label, value: o.value }));
    groups.forEach((g) => {
      result.push({ type: "header", label: g.group });
      g.items.forEach((o) => result.push({ type: "item", label: o.label, value: o.value }));
    });
    return result;
  }, [options]);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
        style={{
          backgroundColor: c.inputBg,
          borderWidth: 1,
          borderColor: c.inputBorder,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 40,
        }}
      >
        <Text
          style={{
            color: selected ? c.text : c.mutedForeground,
            fontSize: 14,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Feather name="chevron-down" size={16} color={c.mutedForeground} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <TouchableOpacity
            style={{ ...require("react-native").StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" }}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />

          <View
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "70%",
              paddingBottom: insets.bottom,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: c.border,
              }}
            >
              <Text style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>
                {placeholder}
              </Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Feather name="x" size={20} color={c.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={grouped}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => {
                if (item.type === "header") {
                  return (
                    <Text
                      style={{
                        color: c.textSecondary,
                        fontSize: 11,
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                        paddingHorizontal: 16,
                        paddingTop: 14,
                        paddingBottom: 6,
                      }}
                    >
                      {item.label}
                    </Text>
                  );
                }
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      onChange(item.value ?? "");
                      setOpen(false);
                    }}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      backgroundColor: isSelected ? c.primary + "22" : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        color: isSelected ? c.primary : c.text,
                        fontSize: 15,
                        fontWeight: isSelected ? "700" : "400",
                      }}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Feather name="check" size={16} color={c.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
