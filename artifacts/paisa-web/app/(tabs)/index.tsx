import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { AmountText, fmt } from "@/components/ui/AmountText";
import { DonutChart } from "@/components/charts/DonutChart";
import { SavingsLineChart } from "@/components/charts/LineChart";

const { width: SCREEN_W } = Dimensions.get("window");

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export default function DashboardScreen() {
  const app = useApp();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const month = currentMonth();
  const stats = app.getMonthStats(month);
  const netWorth = app.getNetWorth();

  const monthTxs = useMemo(() => app.transactions.filter((t) => t.date.startsWith(month)), [app.transactions, month]);
  const recentTxs = monthTxs.slice(0, 6);

  const pendingCommitments = app.commitments.filter((c) => c.month === month && !c.isPaid && !c.isSkipped).slice(0, 4);

  const last5Months = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return months.map((m) => {
      const s = app.getMonthStats(m);
      return { label: monthLabel(m), spent: s.expense, saved: s.saved };
    });
  }, [app.transactions]);

  const donutData = useMemo(() => {
    const monthBudgets = app.budgets.filter((b) => b.month === month);
    return monthBudgets.map((b) => {
      const spent = monthTxs.filter((t) => t.type === "EXPENSE" && t.category === b.category).reduce((s, t) => s + t.amount, 0);
      return { label: b.category, value: spent, color: b.color };
    }).filter((d) => d.value > 0);
  }, [app.budgets, monthTxs, month]);

  const topPadding = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPadding + 60, paddingBottom: (isWeb ? 84 : insets.bottom + 80) + bottomPad, paddingHorizontal: 16, gap: 16 }}
      >
        {/* Net Worth */}
        <View style={[styles.card, { backgroundColor: c.primary }]}>
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>Net Worth</Text>
          <Text style={{ color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 4 }}>
            ₹{netWorth.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: "Income", value: stats.income, color: c.income },
            { label: "Expense", value: stats.expense, color: c.expense },
            { label: "Saved", value: stats.saved, color: stats.saved >= 0 ? c.income : c.expense },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: c.card, flex: 1 }]}>
              <Text style={{ color: c.mutedForeground, fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</Text>
              <AmountText amount={s.value} style={{ color: s.color, fontSize: 14, fontWeight: "800", marginTop: 4 }} />
            </View>
          ))}
        </View>

        {/* Savings Chart */}
        <View style={[styles.card, { backgroundColor: c.card }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Savings vs Spending</Text>
          <View style={{ marginTop: 12 }}>
            <SavingsLineChart data={last5Months} width={SCREEN_W - 64} />
          </View>
        </View>

        {/* Donut + Budgets */}
        {donutData.length > 0 && (
          <View style={[styles.card, { backgroundColor: c.card }]}>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>Spending by Category</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12 }}>
              <DonutChart data={donutData} size={130} centerLabel="spent" centerValue={fmt(donutData.reduce((s, d) => s + d.value, 0))} />
              <View style={{ flex: 1, gap: 8 }}>
                {donutData.slice(0, 5).map((d) => (
                  <View key={d.label} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.color }} />
                    <Text style={{ color: c.mutedForeground, fontSize: 11, flex: 1 }} numberOfLines={1}>{d.label}</Text>
                    <Text style={{ color: c.foreground, fontSize: 11, fontWeight: "700" }}>₹{d.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Upcoming Commitments */}
        {pendingCommitments.length > 0 && (
          <View style={[styles.card, { backgroundColor: c.card }]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Upcoming Bills</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>{pendingCommitments.length} pending</Text>
            </View>
            <View style={{ gap: 10, marginTop: 12 }}>
              {pendingCommitments.map((comm) => (
                <View key={comm.id} style={[styles.rowBetween, { paddingVertical: 6 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.foreground, fontSize: 14, fontWeight: "600" }}>{comm.name}</Text>
                    <Text style={{ color: c.mutedForeground, fontSize: 12 }}>Due day {comm.dueDay}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <AmountText amount={comm.amount} style={{ color: c.expense, fontSize: 14, fontWeight: "700" }} />
                    <TouchableOpacity onPress={() => app.skipCommitment(comm.id)}
                      style={[styles.actionBtn, { backgroundColor: c.muted }]}>
                      <Feather name="skip-forward" size={13} color={c.mutedForeground} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => app.markCommitmentPaid(comm.id)}
                      style={[styles.actionBtn, { backgroundColor: c.income + "22" }]}>
                      <Feather name="check" size={13} color={c.income} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={[styles.card, { backgroundColor: c.card }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>Recent Transactions</Text>
          </View>
          {recentTxs.length === 0 ? (
            <View style={{ paddingVertical: 24, alignItems: "center", gap: 8 }}>
              <Feather name="inbox" size={28} color={c.mutedForeground} />
              <Text style={{ color: c.mutedForeground, fontSize: 13 }}>No transactions this month</Text>
            </View>
          ) : (
            <View style={{ gap: 2, marginTop: 10 }}>
              {recentTxs.map((tx) => {
                const acc = app.accounts.find((a) => a.id === tx.sourceId);
                return (
                  <View key={tx.id} style={[styles.txRow, { borderBottomColor: c.border }]}>
                    <View style={[styles.txIcon, { backgroundColor: tx.type === "INCOME" ? c.income + "22" : tx.type === "TRANSFER" ? c.transfer + "22" : c.expense + "22" }]}>
                      <Feather name={tx.type === "INCOME" ? "trending-up" : tx.type === "TRANSFER" ? "repeat" : "trending-down"} size={14} color={tx.type === "INCOME" ? c.income : tx.type === "TRANSFER" ? c.transfer : c.expense} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.foreground, fontSize: 13, fontWeight: "600" }} numberOfLines={1}>{tx.category}</Text>
                      <Text style={{ color: c.mutedForeground, fontSize: 11 }}>{acc?.name ?? "Unknown"} · {tx.date}</Text>
                    </View>
                    <AmountText amount={tx.type === "INCOME" ? tx.amount : -tx.amount} style={{ fontSize: 13, fontWeight: "700" }} showSign colored incomeColor={c.income} expenseColor={c.expense} />
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Header */}
      <View style={[styles.header, { top: topPadding, backgroundColor: c.background }]}>
        <View>
          <Text style={{ color: c.foreground, fontSize: 20, fontWeight: "800" }}>PaisaWeb</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity onPress={() => app.toggleDarkMode()} style={[styles.iconBtn, { backgroundColor: c.secondary }]}>
            <Feather name={app.isDarkMode ? "sun" : "moon"} size={16} color={c.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => app.openTxModal()}
        style={[styles.fab, { backgroundColor: c.primary, bottom: isWeb ? 100 : insets.bottom + 70 }]}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, height: 56 },
  card: { borderRadius: 16, padding: 16 },
  statCard: { borderRadius: 14, padding: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  txIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  fab: { position: "absolute", right: 20, width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  actionBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});
