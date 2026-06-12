import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useApp, MonthEndTask } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { AmountText, fmt } from "@/components/ui/AmountText";
import * as Haptics from "expo-haptics";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ProgressRing({ progress, size = 96, strokeWidth = 8, color }: { progress: number; size?: number; strokeWidth?: number; color: string }) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const dash = progress * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} rotation={-90} origin={`${cx},${cx}`}>
        <Circle cx={cx} cy={cx} r={r} stroke="#E2E8F0" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={cx} cy={cx} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ fontSize: 18, fontWeight: "800", color }}>{(progress * 100).toFixed(0)}%</Text>
      </View>
    </View>
  );
}

export default function MonthEndScreen() {
  const app = useApp();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  const month = currentMonth();
  const stats = app.getMonthStats(month);
  const savingsRate = stats.income > 0 ? (stats.saved / stats.income) * 100 : 0;

  const monthTasks = app.tasks.filter((t) => t.month === month);
  const doneTasks = monthTasks.filter((t) => t.isDone);
  const progress = monthTasks.length > 0 ? doneTasks.length / monthTasks.length : 0;

  const unpaidCommitments = app.commitments.filter((c) => c.month === month && !c.isPaid && !c.isSkipped);
  const overBudgets = useMemo(() => {
    const monthTxs = app.transactions.filter((t) => t.date.startsWith(month));
    return app.budgets.filter((b) => {
      if (b.month !== month) return false;
      const spent = monthTxs.filter((t) => t.type === "EXPENSE" && t.category === b.category).reduce((s, t) => s + t.amount, 0);
      return spent > b.limit;
    });
  }, [app.transactions, app.budgets, month]);

  const handleToggle = (id: string) => {
    app.toggleTask(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Task", "Remove this task?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => app.deleteTask(id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPadding + 60, paddingBottom: (isWeb ? 84 : insets.bottom + 80) + bottomPad, paddingHorizontal: 16, gap: 16 }}
      >
        {/* Progress + Summary */}
        <View style={[styles.card, { backgroundColor: c.card }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
            <ProgressRing progress={progress} color={progress === 1 ? c.income : c.primary} />
            <View style={{ flex: 1, gap: 10 }}>
              {[
                { label: "Income", value: stats.income, color: c.income },
                { label: "Expenses", value: stats.expense, color: c.expense },
                { label: "Net Savings", value: stats.saved, color: stats.saved >= 0 ? c.income : c.expense },
              ].map((s) => (
                <View key={s.label} style={styles.rowBetween}>
                  <Text style={{ color: c.mutedForeground, fontSize: 12 }}>{s.label}</Text>
                  <AmountText amount={s.value} style={{ color: s.color, fontSize: 13, fontWeight: "700" }} />
                </View>
              ))}
              <View style={styles.rowBetween}>
                <Text style={{ color: c.mutedForeground, fontSize: 12 }}>Savings Rate</Text>
                <Text style={{ color: savingsRate >= 20 ? c.income : c.warning, fontSize: 13, fontWeight: "700" }}>{savingsRate.toFixed(1)}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Alerts */}
        {(unpaidCommitments.length > 0 || overBudgets.length > 0) && (
          <View style={{ gap: 8 }}>
            <Text style={{ color: c.mutedForeground, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 }}>Alerts</Text>
            {unpaidCommitments.length > 0 && (
              <View style={[styles.alertCard, { backgroundColor: c.expense + "15", borderColor: c.expense + "44" }]}>
                <Feather name="alert-circle" size={14} color={c.expense} />
                <Text style={{ color: c.expense, fontSize: 13, fontWeight: "600", flex: 1 }}>
                  {unpaidCommitments.length} unpaid commitment{unpaidCommitments.length > 1 ? "s" : ""}
                </Text>
              </View>
            )}
            {overBudgets.map((b) => (
              <View key={b.id} style={[styles.alertCard, { backgroundColor: c.warning + "15", borderColor: c.warning + "44" }]}>
                <Feather name="alert-triangle" size={14} color={c.warning} />
                <Text style={{ color: c.warning, fontSize: 13, fontWeight: "600", flex: 1 }}>
                  {b.category} budget exceeded
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Checklist */}
        <View>
          <View style={[styles.rowBetween, { marginBottom: 10 }]}>
            <Text style={{ color: c.mutedForeground, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 }}>
              Checklist ({doneTasks.length}/{monthTasks.length})
            </Text>
            <TouchableOpacity onPress={() => app.openTaskModal()} style={[styles.addSmallBtn, { backgroundColor: c.secondary }]}>
              <Feather name="plus" size={14} color={c.foreground} />
            </TouchableOpacity>
          </View>

          {monthTasks.length === 0 ? (
            <View style={[styles.card, { backgroundColor: c.card, paddingVertical: 32, alignItems: "center", gap: 10 }]}>
              <Feather name="check-square" size={28} color={c.mutedForeground} />
              <Text style={{ color: c.mutedForeground, fontSize: 14, fontWeight: "600" }}>No tasks added</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12, textAlign: "center" }}>Add your month-end tasks like "Pay CC bill" or "Reconcile accounts"</Text>
              <TouchableOpacity onPress={() => app.openTaskModal()} style={[{ backgroundColor: c.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }]}>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>Add Task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {monthTasks.map((task) => (
                <View key={task.id} style={[styles.taskCard, { backgroundColor: c.card }]}>
                  <TouchableOpacity onPress={() => handleToggle(task.id)} style={[styles.checkbox, { borderColor: task.isDone ? c.income : c.border, backgroundColor: task.isDone ? c.income : "transparent" }]}>
                    {task.isDone && <Feather name="check" size={12} color="#fff" />}
                  </TouchableOpacity>
                  <Text style={{ color: task.isDone ? c.mutedForeground : c.foreground, fontSize: 14, flex: 1, textDecorationLine: task.isDone ? "line-through" : "none" }}>
                    {task.title}
                  </Text>
                  <TouchableOpacity onPress={() => app.openTaskModal(task)} style={{ padding: 4 }}>
                    <Feather name="edit-2" size={13} color={c.mutedForeground} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(task.id)} style={{ padding: 4 }}>
                    <Feather name="trash-2" size={13} color={c.destructive} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Header */}
      <View style={[styles.header, { top: topPadding, backgroundColor: c.background }]}>
        <Text style={{ color: c.foreground, fontSize: 20, fontWeight: "800" }}>Month End</Text>
        <TouchableOpacity onPress={() => app.openCommitmentModal()} style={[styles.addBtn, { backgroundColor: c.primary }]}>
          <Feather name="plus" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, height: 56 },
  card: { borderRadius: 16, padding: 16 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  alertCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  taskCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  addBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  addSmallBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
});
