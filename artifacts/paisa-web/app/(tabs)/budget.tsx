import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { AmountText, fmt } from "@/components/ui/AmountText";
import { ProgressBar } from "@/components/ui/ProgressBar";

function prevMonth(m: string) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(m: string) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function BudgetScreen() {
  const app = useApp();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  const month = app.selectedMonth;
  const monthTxs = useMemo(() => app.transactions.filter((t) => t.date.startsWith(month)), [app.transactions, month]);
  const monthBudgets = useMemo(() => app.budgets.filter((b) => b.month === month), [app.budgets, month]);

  const monthStats = app.getMonthStats(month);

  const nonExpenseInvestments = app.investments.filter((i) => !i.treatAsExpense).reduce((s, i) => s + i.monthlyContribution, 0);
  const fixedCommitments = app.commitments.filter((c) => c.month === month && !c.linkedBudgetId).reduce((s, c) => s + c.amount, 0);
  const trueSpendable = monthStats.income - nonExpenseInvestments - fixedCommitments;

  const totalBudgeted = monthBudgets.reduce((s, b) => s + b.limit, 0);

  const budgetItems = useMemo(() =>
    monthBudgets.map((b) => {
      const spent = monthTxs.filter((t) => t.type === "EXPENSE" && t.category === b.category).reduce((s, t) => s + t.amount, 0);
      const remaining = b.limit - spent;
      return { ...b, spent, remaining };
    }), [monthBudgets, monthTxs]);

  const totalSpent = budgetItems.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = budgetItems.reduce((s, b) => s + b.remaining, 0);

  const unbudgetedExpenses = monthTxs.filter((t) => t.type === "EXPENSE" && !monthBudgets.some((b) => b.category === t.category)).reduce((s, t) => s + t.amount, 0);

  const unallocated = trueSpendable - totalBudgeted;

  const handleDeleteBudget = (id: string) => {
    Alert.alert("Delete Budget", "Delete this budget category?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => app.deleteBudget(id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPadding + 60, paddingBottom: (isWeb ? 84 : insets.bottom + 80) + bottomPad, paddingHorizontal: 16, gap: 16 }}
      >
        {/* Month Nav */}
        <View style={[styles.monthNav, { backgroundColor: c.card }]}>
          <TouchableOpacity onPress={() => app.setSelectedMonth(prevMonth(month))} style={styles.navBtn}>
            <Feather name="chevron-left" size={20} color={c.foreground} />
          </TouchableOpacity>
          <Text style={{ color: c.foreground, fontSize: 15, fontWeight: "700" }}>{monthLabel(month)}</Text>
          <TouchableOpacity onPress={() => app.setSelectedMonth(nextMonth(month))} style={styles.navBtn}>
            <Feather name="chevron-right" size={20} color={c.foreground} />
          </TouchableOpacity>
        </View>

        {/* True Spendable */}
        <View style={[styles.card, { backgroundColor: unallocated >= 0 ? c.income + "18" : c.expense + "18", borderColor: unallocated >= 0 ? c.income + "44" : c.expense + "44", borderWidth: 1 }]}>
          <Text style={{ color: c.mutedForeground, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>True Spendable</Text>
          <AmountText amount={trueSpendable} style={{ color: c.foreground, fontSize: 24, fontWeight: "800", marginTop: 4 }} />
          <View style={{ marginTop: 8, gap: 4 }}>
            <View style={styles.rowBetween}>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>Monthly Income</Text>
              <AmountText amount={monthStats.income} style={{ color: c.foreground, fontSize: 12, fontWeight: "600" }} />
            </View>
            <View style={styles.rowBetween}>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>Investments</Text>
              <AmountText amount={-nonExpenseInvestments} style={{ color: c.expense, fontSize: 12, fontWeight: "600" }} showSign />
            </View>
            <View style={styles.rowBetween}>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>Fixed Commitments</Text>
              <AmountText amount={-fixedCommitments} style={{ color: c.expense, fontSize: 12, fontWeight: "600" }} showSign />
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: unallocated >= 0 ? c.income + "44" : c.expense + "44" }]} />
          <View style={styles.rowBetween}>
            <Text style={{ color: c.foreground, fontSize: 13, fontWeight: "700" }}>{unallocated >= 0 ? "Unallocated" : "Over Budgeted"}</Text>
            <AmountText amount={unallocated} style={{ color: unallocated >= 0 ? c.income : c.expense, fontSize: 14, fontWeight: "800" }} />
          </View>
        </View>

        {/* Budget Summary */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: "Budgeted", value: totalBudgeted, color: c.accent },
            { label: "Spent", value: totalSpent, color: c.expense },
            { label: "Remaining", value: totalRemaining, color: totalRemaining >= 0 ? c.income : c.expense },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: c.card, flex: 1 }]}>
              <Text style={{ color: c.mutedForeground, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</Text>
              <AmountText amount={s.value} style={{ color: s.color, fontSize: 13, fontWeight: "800", marginTop: 4 }} />
            </View>
          ))}
        </View>

        {/* Unbudgeted Warning */}
        {unbudgetedExpenses > 0 && (
          <View style={[styles.card, { backgroundColor: c.warning + "18", borderColor: c.warning + "44", borderWidth: 1 }]}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Feather name="alert-triangle" size={14} color={c.warning} />
                <Text style={{ color: c.foreground, fontSize: 13, fontWeight: "600" }}>Unbudgeted Expenses</Text>
              </View>
              <AmountText amount={unbudgetedExpenses} style={{ color: c.warning, fontSize: 13, fontWeight: "700" }} />
            </View>
          </View>
        )}

        {/* Budget Envelopes */}
        {budgetItems.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: "center", gap: 12 }}>
            <Feather name="pie-chart" size={36} color={c.mutedForeground} />
            <Text style={{ color: c.mutedForeground, fontSize: 15, fontWeight: "600" }}>No budgets for this month</Text>
            <TouchableOpacity onPress={() => app.copyBudgetsFromPreviousMonth()} style={[styles.copyBtn, { backgroundColor: c.secondary }]}>
              <Feather name="copy" size={14} color={c.foreground} />
              <Text style={{ color: c.foreground, fontSize: 13, fontWeight: "600" }}>Copy from previous month</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <View style={styles.rowBetween}>
              <Text style={{ color: c.mutedForeground, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 }}>Envelopes</Text>
              <TouchableOpacity onPress={() => app.copyBudgetsFromPreviousMonth()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Feather name="copy" size={12} color={c.mutedForeground} />
                <Text style={{ color: c.mutedForeground, fontSize: 11 }}>Copy previous</Text>
              </TouchableOpacity>
            </View>
            {budgetItems.map((b) => {
              const pct = b.limit > 0 ? Math.min(b.spent / b.limit, 1) : 0;
              const over = b.spent > b.limit;
              return (
                <View key={b.id} style={[styles.card, { backgroundColor: c.card }]}>
                  <View style={styles.rowBetween}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: b.color }} />
                      <Text style={{ color: c.foreground, fontSize: 14, fontWeight: "700", flex: 1 }} numberOfLines={1}>{b.category}</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                      <TouchableOpacity onPress={() => app.openBudgetModal(b)}>
                        <Feather name="edit-2" size={13} color={c.mutedForeground} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteBudget(b.id)}>
                        <Feather name="trash-2" size={13} color={c.destructive} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ marginTop: 10 }}>
                    <ProgressBar progress={pct} color={over ? c.expense : b.color} backgroundColor={c.muted} height={6} />
                  </View>
                  <View style={[styles.rowBetween, { marginTop: 6 }]}>
                    <Text style={{ color: c.mutedForeground, fontSize: 11 }}>{fmt(b.spent)} spent</Text>
                    <Text style={{ color: over ? c.expense : c.income, fontSize: 11, fontWeight: "700" }}>
                      {over ? `${fmt(b.spent - b.limit)} over` : `${fmt(b.remaining)} left`}
                    </Text>
                    <Text style={{ color: c.mutedForeground, fontSize: 11 }}>of {fmt(b.limit)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Header */}
      <View style={[styles.header, { top: topPadding, backgroundColor: c.background }]}>
        <Text style={{ color: c.foreground, fontSize: 20, fontWeight: "800" }}>Budget</Text>
        <TouchableOpacity onPress={() => app.openBudgetModal()} style={[styles.addBtn, { backgroundColor: c.primary }]}>
          <Feather name="plus" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, height: 56 },
  card: { borderRadius: 16, padding: 16 },
  statCard: { borderRadius: 14, padding: 12 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, padding: 4 },
  navBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, marginVertical: 8 },
  addBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
});
