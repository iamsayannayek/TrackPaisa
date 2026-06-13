import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useAppColors } from "@/hooks/useAppColors";
import { DonutChart, SavingsLineChart } from "@/components/Charts";

const fmt = (n: number) =>
  `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;
const fmtK = (n: number) => {
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return fmt(n);
};

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  const c = useAppColors();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.card,
        borderRadius: c.radius,
        padding: 12,
        borderWidth: 1,
        borderColor: c.cardBorder,
      }}
    >
      <Text
        style={{
          color: c.textSecondary,
          fontSize: 10,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: color ?? c.text,
          fontSize: 17,
          fontWeight: "700",
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function SectionHeader({
  title,
  onAction,
  actionLabel,
  onAdd,
}: {
  title: string;
  onAction?: () => void;
  actionLabel?: string;
  onAdd?: () => void;
}) {
  const c = useAppColors();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
      }}
    >
      <Text style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>
        {title}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        {onAdd && (
          <TouchableOpacity
            onPress={onAdd}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: c.primary + "22",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
            }}
          >
            <Feather name="plus" size={14} color={c.primary} />
            <Text style={{ color: c.primary, fontSize: 12, fontWeight: "700" }}>
              Add
            </Text>
          </TouchableOpacity>
        )}
        {onAction && (
          <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
            <Text style={{ color: c.primary, fontSize: 13, fontWeight: "600" }}>
              {actionLabel ?? "See All"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// --- Financial Health Score Card ---
function HealthScoreCard({ score }: { score: number }) {
  const c = useAppColors();
  const color =
    score >= 70 ? c.income : score >= 40 ? c.warning : c.expense;
  const label =
    score >= 80
      ? "Excellent"
      : score >= 65
        ? "Good"
        : score >= 45
          ? "Fair"
          : score >= 25
            ? "Needs Work"
            : "Critical";

  const arcPercent = score / 100;
  const circumference = 2 * Math.PI * 36;
  const dash = arcPercent * circumference;
  const gap = circumference - dash;

  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: c.radius + 4,
        padding: 16,
        borderWidth: 1,
        borderColor: c.cardBorder,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
      }}
    >
      <View style={{ alignItems: "center", justifyContent: "center", width: 80, height: 80 }}>
        {/* Simple circular indicator using border trick */}
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            borderWidth: 6,
            borderColor: c.surfaceElevated,
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <View
            style={{
              position: "absolute",
              width: 72,
              height: 72,
              borderRadius: 36,
              borderWidth: 6,
              borderColor: color,
              borderTopColor: score >= 25 ? color : "transparent",
              borderRightColor: score >= 50 ? color : "transparent",
              borderBottomColor: score >= 75 ? color : "transparent",
              borderLeftColor: score >= 100 ? color : "transparent",
              transform: [{ rotate: "-135deg" }],
            }}
          />
          <Text
            style={{ color: color, fontSize: 18, fontWeight: "800", zIndex: 1 }}
          >
            {score}
          </Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: c.textSecondary,
            fontSize: 11,
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Financial Health
        </Text>
        <Text
          style={{
            color,
            fontSize: 20,
            fontWeight: "800",
            marginTop: 2,
          }}
        >
          {label}
        </Text>
        <View
          style={{
            marginTop: 6,
            backgroundColor: c.surfaceElevated,
            borderRadius: 4,
            height: 6,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: 6,
              width: `${score}%`,
              backgroundColor: color,
              borderRadius: 4,
            }}
          />
        </View>
        <Text style={{ color: c.textTertiary, fontSize: 11, marginTop: 4 }}>
          Based on savings, budgets & commitments
        </Text>
      </View>
    </View>
  );
}

// --- All Commitments Modal ---
function AllCommitmentsView({ onClose }: { onClose: () => void }) {
  const app = useApp();
  const c = useAppColors();
  const [filter, setFilter] = useState<"ALL" | "UPCOMING" | "PAID" | "SKIPPED">(
    "ALL",
  );
  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    let list = app.commitments;
    if (filter === "PAID") list = app.commitments.filter((c2) => c2.isPaid);
    else if (filter === "SKIPPED")
      list = app.commitments.filter((c2) => c2.isSkipped);
    else if (filter === "UPCOMING")
      list = app.commitments.filter((c2) => !c2.isPaid && !c2.isSkipped);

    return list.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [app.commitments, filter]);

  const getAccName = (id?: string) =>
    app.accounts.find((a) => a.id === id)?.name ?? id ?? "";
  const getDestName = (id?: string) => {
    if (!id) return null;
    return (
      app.accounts.find((a) => a.id === id)?.name ??
      app.investments.find((i) => i.id === id)?.name ??
      null
    );
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        edges={["top", "bottom"]}
        style={{ flex: 1, backgroundColor: c.background }}
      >
        <StatusBar barStyle="light-content" backgroundColor={c.background} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: c.border,
          }}
        >
          <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
            <Feather name="arrow-left" size={22} color={c.text} />
          </TouchableOpacity>
          <Text
            style={{ color: c.text, fontSize: 18, fontWeight: "700", flex: 1 }}
          >
            All Commitments
          </Text>
          <TouchableOpacity
            onPress={() => app.openCommitmentModal()}
            style={{
              backgroundColor: c.primary,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
              + Add
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", gap: 8, padding: 12 }}>
          {(["ALL", "UPCOMING", "PAID", "SKIPPED"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: filter === f ? c.primary : c.surface,
              }}
            >
              <Text
                style={{
                  color: filter === f ? "#fff" : c.textSecondary,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 32 }}>
          {filtered.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Feather name="calendar" size={40} color={c.mutedForeground} />
              <Text
                style={{ color: c.mutedForeground, marginTop: 12, fontSize: 15 }}
              >
                No commitments here
              </Text>
            </View>
          ) : (
            filtered.map((com) => {
              const destInv = app.investments.find((i) => i.id === com.destId);
              const isOverSkipped =
                destInv &&
                !destInv.treatAsExpense &&
                (destInv.skippedCount || 0) >= 2;
              const isAccumulated =
                destInv &&
                destInv.treatAsExpense &&
                (destInv.skippedCount || 0) > 0;
              const canUndo =
                com.isSkipped &&
                com.date >= today &&
                com.date.startsWith(app.currentMonth);

              return (
                <View
                  key={com.id}
                  style={{
                    backgroundColor: c.card,
                    borderRadius: c.radius,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: com.isPaid
                      ? c.income + "44"
                      : com.isSkipped
                        ? c.mutedForeground + "44"
                        : c.cardBorder,
                  }}
                >
                  {isOverSkipped && (
                    <View
                      style={{
                        backgroundColor: "#ef444422",
                        padding: 8,
                        borderRadius: 6,
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{ color: "#ef4444", fontSize: 12, fontWeight: "600" }}
                      >
                        ⚠️ Skipped {destInv.name} {destInv.skippedCount} times!
                      </Text>
                    </View>
                  )}
                  {isAccumulated && (
                    <View
                      style={{
                        backgroundColor: "#f59e0b22",
                        padding: 8,
                        borderRadius: 6,
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{ color: "#f59e0b", fontSize: 12, fontWeight: "600" }}
                      >
                        ⚠️ Amount includes {destInv.skippedCount} skipped premium(s).
                      </Text>
                    </View>
                  )}

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text
                        style={{ color: c.text, fontSize: 15, fontWeight: "700" }}
                      >
                        {com.title}
                      </Text>
                      <Text
                        style={{ color: c.textSecondary, fontSize: 12, marginTop: 3 }}
                      >
                        Due: {com.date} · From: {getAccName(com.sourceId)}
                        {getDestName(com.destId)
                          ? `  →  ${getDestName(com.destId)}`
                          : ""}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{
                          color: c.expense,
                          fontWeight: "700",
                          fontSize: 15,
                          marginBottom: 8,
                        }}
                      >
                        {fmt(com.amount)}
                      </Text>
                      {com.isPaid ? (
                        <View
                          style={{
                            backgroundColor: c.income + "22",
                            borderRadius: 12,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                          }}
                        >
                          <Text style={{ color: c.income, fontWeight: "700", fontSize: 11 }}>
                            PAID
                          </Text>
                        </View>
                      ) : canUndo ? (
                        <TouchableOpacity
                          onPress={() => app.undoCommitment(com.id)}
                          style={{
                            backgroundColor: c.warning + "22",
                            borderRadius: 8,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderWidth: 1,
                            borderColor: c.warning + "55",
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: c.warning, fontWeight: "700", fontSize: 11 }}>
                            UNDO
                          </Text>
                        </TouchableOpacity>
                      ) : com.isSkipped ? (
                        <View
                          style={{
                            backgroundColor: c.mutedForeground + "22",
                            borderRadius: 12,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                          }}
                        >
                          <Text style={{ color: c.mutedForeground, fontWeight: "700", fontSize: 11 }}>
                            SKIPPED
                          </Text>
                        </View>
                      ) : (
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <TouchableOpacity
                            onPress={() => app.openCommitmentModal(com)}
                            style={{
                              padding: 6,
                              backgroundColor: c.surfaceElevated,
                              borderRadius: 8,
                              justifyContent: "center",
                            }}
                          >
                            <Feather name="edit-2" size={14} color={c.textSecondary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => app.skipCommitment(com.id)}
                            style={{
                              backgroundColor: c.surfaceElevated,
                              borderRadius: 8,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              justifyContent: "center",
                              borderWidth: 1,
                              borderColor: c.border,
                            }}
                          >
                            <Text style={{ color: c.textSecondary, fontWeight: "700", fontSize: 11 }}>
                              Skip
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => app.markCommitmentPaid(com.id)}
                            style={{
                              backgroundColor: c.income + "22",
                              borderRadius: 8,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              justifyContent: "center",
                            }}
                          >
                            <Text style={{ color: c.income, fontWeight: "700", fontSize: 11 }}>
                              Mark Paid
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// --- All Transactions Modal ---
function AllTransactionsView({ onClose }: { onClose: () => void }) {
  const app = useApp();
  const c = useAppColors();
  const [filter, setFilter] = useState<"ALL" | "INCOME" | "EXPENSE" | "TRANSFER">("ALL");

  const filtered = useMemo(() => {
    const monthTxs = app.transactions.filter((t) =>
      t.date.startsWith(app.currentMonth),
    );
    return filter === "ALL"
      ? monthTxs
      : monthTxs.filter((t) => t.type === filter);
  }, [app.transactions, app.currentMonth, filter]);

  const getAccName = (id?: string) => {
    if (!id) return "";
    return (
      app.accounts.find((a) => a.id === id)?.name ??
      app.investments.find((i) => i.id === id)?.name ??
      id
    );
  };

  const txColor = (type: string) => {
    if (type === "INCOME") return c.income;
    if (type === "EXPENSE") return c.expense;
    return c.transfer;
  };
  const txSign = (type: string) =>
    type === "INCOME" ? "+" : type === "EXPENSE" ? "−" : "→";

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        edges={["top", "bottom"]}
        style={{ flex: 1, backgroundColor: c.background }}
      >
        <StatusBar barStyle="light-content" backgroundColor={c.background} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: c.border,
          }}
        >
          <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
            <Feather name="arrow-left" size={22} color={c.text} />
          </TouchableOpacity>
          <Text
            style={{ color: c.text, fontSize: 18, fontWeight: "700", flex: 1 }}
          >
            Transactions — {app.currentMonth}
          </Text>
          <TouchableOpacity
            onPress={() => app.openTxModal()}
            style={{
              backgroundColor: c.primary,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
              + Add
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", gap: 6, padding: 12 }}>
          {(["ALL", "INCOME", "EXPENSE", "TRANSFER"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: filter === f ? c.primary : c.surface,
              }}
            >
              <Text
                style={{
                  color: filter === f ? "#fff" : c.textSecondary,
                  fontWeight: "600",
                  fontSize: 11,
                }}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 32 }}>
          {filtered.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Feather name="inbox" size={40} color={c.mutedForeground} />
              <Text style={{ color: c.mutedForeground, marginTop: 12, fontSize: 15 }}>
                No transactions
              </Text>
            </View>
          ) : (
            filtered.map((tx) => (
              <TouchableOpacity
                key={tx.id}
                onPress={() => app.openTxModal(tx)}
                style={{
                  backgroundColor: c.card,
                  borderRadius: c.radius,
                  padding: 14,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: c.cardBorder,
                }}
                activeOpacity={0.75}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: "600" }}>
                      {tx.note || tx.category}
                    </Text>
                    <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 2 }}>
                      {tx.date} · {getAccName(tx.sourceId)}
                      {tx.destId ? ` → ${getAccName(tx.destId)}` : ""} ·{" "}
                      {tx.category}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: txColor(tx.type),
                      fontWeight: "700",
                      fontSize: 15,
                      marginLeft: 8,
                    }}
                  >
                    {txSign(tx.type)}
                    {fmt(tx.amount)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// --- Main Dashboard ---
export default function DashboardScreen() {
  const app = useApp();
  const c = useAppColors();
  const [chartFilter, setChartFilter] = useState<"both" | "spent" | "saved">("both");

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const monthTxs = useMemo(
    () =>
      app.transactions
        .filter((t) => t.date.startsWith(app.currentMonth))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [app.transactions, app.currentMonth],
  );

  const income = useMemo(
    () => monthTxs.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0),
    [monthTxs],
  );
  const expenses = useMemo(
    () => monthTxs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0),
    [monthTxs],
  );
  const netWorth = useMemo(() => {
    const accountTotal = app.accounts.reduce((s, a) => s + a.balance, 0);
    const investmentTotal = app.investments.reduce((s, i) => s + i.currentValue, 0);
    return accountTotal + investmentTotal;
  }, [app.accounts, app.investments]);

  // PART 10: Filter to current month; show undoable skipped items too
  const upcomingCommitments = useMemo(() => {
    return app.commitments
      .filter((c2) => {
        if (!c2.date.startsWith(app.currentMonth)) return false;
        if (c2.isPaid) return false;
        if (c2.isSkipped) {
          // Only show skipped ones where due date >= today (can still undo)
          return c2.date >= today;
        }
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [app.commitments, app.currentMonth, today]);

  const recentTxs = useMemo(() => monthTxs.slice(0, 6), [monthTxs]);

  const getAccName = (id?: string) =>
    app.accounts.find((a) => a.id === id)?.name ?? id ?? "";

  // PART 17: Financial Health Score (0–100)
  const healthScore = useMemo(() => {
    let score = 0;

    // 1. Savings rate (max 30 pts): 20%+ savings = full marks
    const savingsRate = income > 0 ? Math.max(0, income - expenses) / income : 0;
    score += Math.min(30, Math.round(savingsRate * 150));

    // 2. Budget discipline (max 25 pts)
    const monthBudgets = app.budgets.filter((b) => b.month === app.currentMonth);
    if (monthBudgets.length > 0) {
      const disciplineScore =
        monthBudgets.reduce((sum, b) => {
          const spent = monthTxs
            .filter((t) => t.type === "EXPENSE" && t.category === b.category)
            .reduce((s, t) => s + t.amount, 0);
          const ratio = b.limit > 0 ? spent / b.limit : 0;
          return sum + Math.max(0, 1 - ratio);
        }, 0) / monthBudgets.length;
      score += Math.round(disciplineScore * 25);
    } else {
      score += 15;
    }

    // 3. Commitment completion (max 25 pts)
    const monthCommits = app.commitments.filter((c2) =>
      c2.date.startsWith(app.currentMonth),
    );
    if (monthCommits.length > 0) {
      const paidCount = monthCommits.filter((c2) => c2.isPaid).length;
      const skippedCount = monthCommits.filter((c2) => c2.isSkipped).length;
      score += Math.round((paidCount / monthCommits.length) * 25);
      score -= Math.round((skippedCount / monthCommits.length) * 10);
    } else {
      score += 20;
    }

    // 4. Investment consistency (max 20 pts)
    const activeInvestments = app.investments.filter((i) => i.autoSchedule);
    if (activeInvestments.length > 0) {
      score += Math.min(20, 5 + activeInvestments.length * 3);
    }

    return Math.max(0, Math.min(100, score));
  }, [income, expenses, monthTxs, app.budgets, app.commitments, app.investments, app.currentMonth]);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const chartData = useMemo(() => {
    const monthsToShow = 5;
    const currentMonthParts = app.currentMonth.split("-");
    const currentYear = parseInt(currentMonthParts[0] ?? "2026", 10);
    const currentMonthIndex = Math.max(
      0,
      Math.min(11, parseInt(currentMonthParts[1] ?? "1", 10) - 1),
    );
    const currentDate = new Date(currentYear, currentMonthIndex, 1);

    return Array.from({ length: monthsToShow }, (_, index) => {
      const monthDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - (monthsToShow - 1 - index),
        1,
      );
      const monthKey = `${monthDate.getFullYear()}-${String(
        monthDate.getMonth() + 1,
      ).padStart(2, "0")}`;
      const monthLabel = monthNames[monthDate.getMonth()] ?? "Now";

      const monthTransactions = app.transactions.filter((t) =>
        t.date.startsWith(monthKey),
      );
      const monthIncome = monthTransactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + t.amount, 0);
      const monthExpenses = monthTransactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        name: monthLabel,
        spent: monthExpenses,
        saved: Math.max(0, monthIncome - monthExpenses),
      };
    });
  }, [app.transactions, app.currentMonth]);

  const donutData = useMemo(() => {
    const monthBudgets = app.budgets.filter((b) => b.month === app.currentMonth);
    return monthBudgets
      .map((b) => {
        const spent = monthTxs
          .filter((t) => t.type === "EXPENSE" && t.category === b.category)
          .reduce((s, t) => s + t.amount, 0);
        return { name: b.category, value: spent, color: b.color };
      })
      .filter((d) => d.value > 0);
  }, [app.budgets, monthTxs, app.currentMonth]);

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <StatusBar barStyle="light-content" backgroundColor={c.background} translucent={false} />

      {app.activeTab === "all_commitments" && (
        <AllCommitmentsView onClose={() => app.setActiveTab("dashboard")} />
      )}
      {app.activeTab === "all_transactions" && (
        <AllTransactionsView onClose={() => app.setActiveTab("dashboard")} />
      )}

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <View>
            <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: "500" }}>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Text style={{ color: c.text, fontSize: 22, fontWeight: "800", marginTop: 2 }}>
              {app.profile.name ? `Hi, ${app.profile.name.split(" ")[0]}! 👋` : "PaisaWeb 💸"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={app.toggleTheme}
            style={{
              backgroundColor: c.surfaceElevated,
              borderRadius: 20,
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name={app.isDarkMode ? "sun" : "moon"} size={18} color={c.text} />
          </TouchableOpacity>
        </View>

        {/* Net Worth Card */}
        <View
          style={{
            backgroundColor: c.primary + "1A",
            borderRadius: c.radius + 4,
            padding: 20,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: c.primary + "44",
          }}
        >
          <Text
            style={{
              color: c.primary,
              fontSize: 11,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Total Net Worth
          </Text>
          <Text style={{ color: c.text, fontSize: 32, fontWeight: "800", marginTop: 4 }}>
            ₹{netWorth.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 0 })}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 4 }}>
            {app.currentMonth} · {monthTxs.length} transactions
          </Text>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <StatCard label="Income" value={fmtK(income)} color={c.income} />
          <StatCard label="Expenses" value={fmtK(expenses)} color={c.expense} />
          <StatCard
            label="Saved"
            value={fmtK(Math.max(0, income - expenses))}
            color={c.transfer}
          />
        </View>

        {/* Financial Health Score */}
        <View style={{ marginBottom: 20 }}>
          <HealthScoreCard score={healthScore} />
        </View>

        {/* Charts Column */}
        <View style={{ flexDirection: "column", gap: 12, marginBottom: 20 }}>
          <View
            style={{
              backgroundColor: c.card,
              borderRadius: c.radius,
              padding: 14,
              borderWidth: 1,
              borderColor: c.cardBorder,
            }}
          >
            <Text style={{ color: c.text, fontSize: 13, fontWeight: "700", marginBottom: 8 }}>
              Savings vs Spending Trend
            </Text>
            <View style={{ flexDirection: "row", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              {(["both", "spent", "saved"] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setChartFilter(f)}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 10,
                    backgroundColor: chartFilter === f ? c.primary : c.surfaceElevated,
                  }}
                >
                  <Text
                    style={{
                      color: chartFilter === f ? "#fff" : c.mutedForeground,
                      fontSize: 10,
                      fontWeight: "600",
                    }}
                  >
                    {f === "both" ? "Both" : f === "spent" ? "Spent" : "Saved"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <SavingsLineChart data={chartData} filter={chartFilter} />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
              {(chartFilter === "both" || chartFilter === "spent") && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#f43f5e" }} />
                  <Text style={{ color: c.textSecondary, fontSize: 10 }}>Spent</Text>
                </View>
              )}
              {(chartFilter === "both" || chartFilter === "saved") && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#10b981" }} />
                  <Text style={{ color: c.textSecondary, fontSize: 10 }}>Saved</Text>
                </View>
              )}
            </View>
          </View>

          <View
            style={{
              backgroundColor: c.card,
              borderRadius: c.radius,
              padding: 14,
              borderWidth: 1,
              borderColor: c.cardBorder,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: c.text,
                fontSize: 13,
                fontWeight: "700",
                marginBottom: 8,
                alignSelf: "flex-start",
              }}
            >
              By Category
            </Text>
            <DonutChart data={donutData} />
            <View style={{ marginTop: 8, width: "100%" }}>
              {donutData.slice(0, 4).map((d, i) => (
                <View
                  key={i}
                  style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 }}
                >
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: d.color }} />
                  <Text style={{ color: c.textSecondary, fontSize: 9 }} numberOfLines={1}>
                    {d.name}
                  </Text>
                </View>
              ))}
              {donutData.length === 0 && (
                <Text style={{ color: c.mutedForeground, fontSize: 10, textAlign: "center" }}>
                  No data yet
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Upcoming Commitments — current month only */}
        <View style={{ marginBottom: 20 }}>
          <SectionHeader
            title={`Commitments — ${app.currentMonth}`}
            onAction={() => app.setActiveTab("all_commitments")}
            actionLabel="See All"
            onAdd={() => app.openCommitmentModal()}
          />
          {upcomingCommitments.length === 0 ? (
            <View
              style={{
                backgroundColor: c.card,
                borderRadius: c.radius,
                padding: 24,
                alignItems: "center",
                borderWidth: 1,
                borderColor: c.cardBorder,
              }}
            >
              <Text style={{ color: c.mutedForeground, fontSize: 14 }}>
                All commitments settled! 🎉
              </Text>
            </View>
          ) : (
            upcomingCommitments.map((com) => {
              const destInv = app.investments.find((i) => i.id === com.destId);
              const isOverSkipped =
                destInv && !destInv.treatAsExpense && (destInv.skippedCount || 0) >= 2;
              const isAccumulated =
                destInv && destInv.treatAsExpense && (destInv.skippedCount || 0) > 0;
              const canUndo = com.isSkipped && com.date >= today;

              return (
                <TouchableOpacity
                  key={com.id}
                  onPress={() => app.openCommitmentModal(com)}
                  activeOpacity={0.75}
                  style={{
                    backgroundColor: c.card,
                    borderRadius: c.radius,
                    padding: 14,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: com.isSkipped ? c.warning + "44" : c.cardBorder,
                    flexDirection: "column",
                  }}
                >
                  {isOverSkipped && (
                    <View
                      style={{
                        backgroundColor: "#ef444422",
                        padding: 8,
                        borderRadius: 6,
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "600" }}>
                        ⚠️ Skipped {destInv.name} {destInv.skippedCount} times!
                      </Text>
                    </View>
                  )}
                  {isAccumulated && (
                    <View
                      style={{
                        backgroundColor: "#f59e0b22",
                        padding: 8,
                        borderRadius: 6,
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ color: "#f59e0b", fontSize: 12, fontWeight: "600" }}>
                        ⚠️ Includes {destInv.skippedCount} skipped premium(s).
                      </Text>
                    </View>
                  )}

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 14, fontWeight: "600" }}>
                        {com.title}
                        {com.isSkipped ? " (Skipped)" : ""}
                      </Text>
                      <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 2 }}>
                        Due {com.date} · {getAccName(com.sourceId)}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{ color: c.expense, fontWeight: "700", marginBottom: 6 }}
                      >
                        {fmt(com.amount)}
                      </Text>

                      {canUndo ? (
                        // PART 11: UNDO button for recently-skipped commitments
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation?.();
                            app.undoCommitment(com.id);
                          }}
                          style={{
                            backgroundColor: c.warning + "22",
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 5,
                            borderWidth: 1,
                            borderColor: c.warning + "55",
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: c.warning, fontWeight: "700", fontSize: 12 }}>
                            ↩ UNDO
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation?.();
                              app.skipCommitment(com.id);
                            }}
                            style={{
                              backgroundColor: c.surfaceElevated,
                              borderRadius: 8,
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderWidth: 1,
                              borderColor: c.border,
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={{ color: c.textSecondary, fontWeight: "700", fontSize: 11 }}>
                              Skip
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation?.();
                              app.markCommitmentPaid(com.id);
                            }}
                            style={{
                              backgroundColor: c.income + "22",
                              borderRadius: 8,
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={{ color: c.income, fontWeight: "700", fontSize: 11 }}>
                              Mark Paid
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Recent Transactions */}
        <View>
          <SectionHeader
            title="Recent Transactions"
            onAction={() => app.setActiveTab("all_transactions")}
            actionLabel="See All"
          />
          {recentTxs.length === 0 ? (
            <View
              style={{
                backgroundColor: c.card,
                borderRadius: c.radius,
                padding: 24,
                alignItems: "center",
                borderWidth: 1,
                borderColor: c.cardBorder,
              }}
            >
              <Text style={{ color: c.mutedForeground, fontSize: 14 }}>
                No transactions this month
              </Text>
            </View>
          ) : (
            recentTxs.map((tx) => {
              const txColor =
                tx.type === "INCOME"
                  ? c.income
                  : tx.type === "EXPENSE"
                    ? c.expense
                    : c.transfer;
              const txSign =
                tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "−" : "→";
              return (
                <TouchableOpacity
                  key={tx.id}
                  onPress={() => app.openTxModal(tx)}
                  style={{
                    backgroundColor: c.card,
                    borderRadius: c.radius,
                    padding: 14,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: c.cardBorder,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  activeOpacity={0.75}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: txColor + "22",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ color: txColor, fontWeight: "700", fontSize: 13 }}>
                      {txSign}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: "600" }}>
                      {tx.note || tx.category}
                    </Text>
                    <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 1 }}>
                      {tx.date} · {tx.category}
                    </Text>
                  </View>
                  <Text style={{ color: txColor, fontWeight: "700", fontSize: 14 }}>
                    {txSign}
                    {fmt(tx.amount)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={() => app.openTxModal()}
        style={{
          position: "absolute",
          bottom: 110,
          right: 16,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: c.primary,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 5,
          zIndex: 10,
        }}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
