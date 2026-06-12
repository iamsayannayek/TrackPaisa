import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp, Investment, Goal } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { AmountText, fmt } from "@/components/ui/AmountText";
import { ProgressBar } from "@/components/ui/ProgressBar";

const INV_TYPE_LABEL: Record<string, string> = {
  MUTUAL_FUND: "MF",
  PPF: "PPF",
  LIC: "LIC",
  FD: "FD",
  STOCK: "Stock",
  OTHER: "Other",
};

function InvestmentCard({ inv, onEdit, onDelete }: { inv: Investment; onEdit: () => void; onDelete: () => void }) {
  const c = useColors();
  const returns = inv.currentValue - inv.totalInvested;
  const returnsPct = inv.totalInvested > 0 ? ((inv.currentValue - inv.totalInvested) / inv.totalInvested) * 100 : 0;

  return (
    <View style={[styles.card, { backgroundColor: c.card }]}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[styles.typeBadge, { backgroundColor: c.primary + "22" }]}>
              <Text style={{ color: c.primary, fontSize: 10, fontWeight: "700" }}>{INV_TYPE_LABEL[inv.type] ?? inv.type}</Text>
            </View>
            <Text style={{ color: c.foreground, fontSize: 14, fontWeight: "700", flex: 1 }} numberOfLines={1}>{inv.name}</Text>
          </View>
          {inv.skippedCount > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="alert-circle" size={11} color={c.warning} />
              <Text style={{ color: c.warning, fontSize: 10, fontWeight: "600" }}>{inv.skippedCount} payment(s) skipped</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <TouchableOpacity onPress={onEdit} style={[styles.iconBtn, { backgroundColor: c.secondary }]}>
            <Feather name="edit-2" size={12} color={c.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={[styles.iconBtn, { backgroundColor: c.destructive + "15" }]}>
            <Feather name="trash-2" size={12} color={c.destructive} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ marginTop: 12, gap: 8 }}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={{ color: c.mutedForeground, fontSize: 10, fontWeight: "600", textTransform: "uppercase" }}>Current Value</Text>
            <AmountText amount={inv.currentValue} style={{ color: c.foreground, fontSize: 16, fontWeight: "800", marginTop: 2 }} />
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: c.mutedForeground, fontSize: 10, fontWeight: "600", textTransform: "uppercase" }}>Returns</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
              <AmountText amount={returns} style={{ color: returns >= 0 ? c.income : c.expense, fontSize: 13, fontWeight: "700" }} showSign colored incomeColor={c.income} expenseColor={c.expense} />
              <Text style={{ color: returns >= 0 ? c.income : c.expense, fontSize: 11, fontWeight: "600" }}>
                ({returnsPct >= 0 ? "+" : ""}{returnsPct.toFixed(1)}%)
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.rowBetween}>
          <Text style={{ color: c.mutedForeground, fontSize: 12 }}>Invested: {fmt(inv.totalInvested)}</Text>
          <Text style={{ color: c.mutedForeground, fontSize: 12 }}>SIP: {fmt(inv.monthlyContribution)}/mo</Text>
        </View>
      </View>
    </View>
  );
}

function GoalCard({ goal, onEdit, onDelete }: { goal: Goal; onEdit: () => void; onDelete: () => void }) {
  const c = useColors();
  const pct = goal.target > 0 ? Math.min(goal.current / goal.target, 1) : 0;
  const remaining = goal.target - goal.current;
  const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000) : null;
  const monthsLeft = daysLeft != null ? Math.max(Math.ceil(daysLeft / 30), 1) : null;
  const monthlyNeeded = monthsLeft != null && remaining > 0 ? remaining / monthsLeft : 0;

  return (
    <View style={[styles.card, { backgroundColor: c.card }]}>
      <View style={styles.rowBetween}>
        <Text style={{ color: c.foreground, fontSize: 14, fontWeight: "700", flex: 1 }} numberOfLines={1}>{goal.name}</Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <TouchableOpacity onPress={onEdit} style={[styles.iconBtn, { backgroundColor: c.secondary }]}>
            <Feather name="edit-2" size={12} color={c.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={[styles.iconBtn, { backgroundColor: c.destructive + "15" }]}>
            <Feather name="trash-2" size={12} color={c.destructive} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ marginTop: 10 }}>
        <ProgressBar progress={pct} color={c.primary} backgroundColor={c.muted} height={6} />
      </View>
      <View style={[styles.rowBetween, { marginTop: 8 }]}>
        <Text style={{ color: c.mutedForeground, fontSize: 11 }}>{fmt(goal.current)} saved</Text>
        <Text style={{ color: c.primary, fontSize: 12, fontWeight: "700" }}>{(pct * 100).toFixed(0)}%</Text>
        <Text style={{ color: c.mutedForeground, fontSize: 11 }}>Goal: {fmt(goal.target)}</Text>
      </View>
      {daysLeft != null && daysLeft > 0 && (
        <View style={[styles.rowBetween, { marginTop: 6 }]}>
          <Text style={{ color: c.mutedForeground, fontSize: 11 }}>{daysLeft} days left</Text>
          {monthlyNeeded > 0 && <Text style={{ color: c.accent, fontSize: 11, fontWeight: "600" }}>Need {fmt(monthlyNeeded)}/mo</Text>}
        </View>
      )}
    </View>
  );
}

export default function WealthScreen() {
  const app = useApp();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  const totalInvested = app.investments.reduce((s, i) => s + i.totalInvested, 0);
  const currentValue = app.investments.reduce((s, i) => s + i.currentValue, 0);
  const totalReturns = currentValue - totalInvested;
  const returnsPct = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;
  const monthlySIP = app.investments.reduce((s, i) => s + (i.frequency === "MONTHLY" ? i.monthlyContribution : 0), 0);

  const avgGoalCompletion = useMemo(() => {
    if (app.goals.length === 0) return 0;
    const total = app.goals.reduce((s, g) => s + (g.target > 0 ? g.current / g.target : 0), 0);
    return (total / app.goals.length) * 100;
  }, [app.goals]);

  const handleDeleteInv = (id: string) => {
    Alert.alert("Delete Investment", "Delete this investment?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => app.deleteInvestment(id) },
    ]);
  };

  const handleDeleteGoal = (id: string) => {
    Alert.alert("Delete Goal", "Delete this goal?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => app.deleteGoal(id) },
    ]);
  };

  const [activeTab, setActiveTab] = React.useState<"investments" | "goals">("investments");

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPadding + 60, paddingBottom: (isWeb ? 84 : insets.bottom + 80) + bottomPad, paddingHorizontal: 16, gap: 16 }}
      >
        {/* Portfolio Overview */}
        <View style={[styles.card, { backgroundColor: c.card }]}>
          <Text style={{ color: c.mutedForeground, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Portfolio Value</Text>
          <AmountText amount={currentValue} style={{ color: c.foreground, fontSize: 28, fontWeight: "800", marginTop: 4 }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
            <Feather name={totalReturns >= 0 ? "trending-up" : "trending-down"} size={14} color={totalReturns >= 0 ? c.income : c.expense} />
            <AmountText amount={totalReturns} style={{ color: totalReturns >= 0 ? c.income : c.expense, fontSize: 13, fontWeight: "700" }} showSign colored incomeColor={c.income} expenseColor={c.expense} />
            <Text style={{ color: totalReturns >= 0 ? c.income : c.expense, fontSize: 12 }}>({returnsPct >= 0 ? "+" : ""}{returnsPct.toFixed(1)}%)</Text>
          </View>
          <View style={{ height: 1, backgroundColor: c.border, marginVertical: 12 }} />
          <View style={{ flexDirection: "row", gap: 0 }}>
            {[
              { label: "Invested", value: totalInvested },
              { label: "Monthly SIP", value: monthlySIP },
              { label: "Avg Goal", value: null, pct: avgGoalCompletion },
            ].map((item, i) => (
              <View key={item.label} style={{ flex: 1, alignItems: i === 1 ? "center" : i === 2 ? "flex-end" : "flex-start" }}>
                <Text style={{ color: c.mutedForeground, fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 }}>{item.label}</Text>
                {item.pct != null ? (
                  <Text style={{ color: c.primary, fontSize: 14, fontWeight: "800", marginTop: 2 }}>{item.pct.toFixed(0)}%</Text>
                ) : (
                  <AmountText amount={item.value!} style={{ color: c.foreground, fontSize: 14, fontWeight: "700", marginTop: 2 }} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { backgroundColor: c.secondary }]}>
          {(["investments", "goals"] as const).map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
              style={[styles.tabBtn, { backgroundColor: activeTab === tab ? c.primary : "transparent" }]}>
              <Text style={{ color: activeTab === tab ? "#fff" : c.mutedForeground, fontSize: 13, fontWeight: "700", textTransform: "capitalize" }}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "investments" && (
          <>
            {app.investments.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: "center", gap: 12 }}>
                <Feather name="trending-up" size={36} color={c.mutedForeground} />
                <Text style={{ color: c.mutedForeground, fontSize: 15, fontWeight: "600" }}>No investments yet</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {app.investments.map((inv) => (
                  <InvestmentCard key={inv.id} inv={inv} onEdit={() => app.openInvestmentModal(inv)} onDelete={() => handleDeleteInv(inv.id)} />
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === "goals" && (
          <>
            {app.goals.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: "center", gap: 12 }}>
                <Feather name="target" size={36} color={c.mutedForeground} />
                <Text style={{ color: c.mutedForeground, fontSize: 15, fontWeight: "600" }}>No goals yet</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {app.goals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} onEdit={() => app.openGoalModal(goal)} onDelete={() => handleDeleteGoal(goal.id)} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Header */}
      <View style={[styles.header, { top: topPadding, backgroundColor: c.background }]}>
        <Text style={{ color: c.foreground, fontSize: 20, fontWeight: "800" }}>Wealth</Text>
        <TouchableOpacity
          onPress={() => activeTab === "investments" ? app.openInvestmentModal() : app.openGoalModal()}
          style={[styles.addBtn, { backgroundColor: c.primary }]}
        >
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
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  iconBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  addBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  tabRow: { flexDirection: "row", borderRadius: 12, padding: 4, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
});
