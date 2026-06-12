import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp, Investment, Goal } from "@/context/AppContext";
import { useAppColors } from "@/hooks/useAppColors";

const fmt = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`;
const fmtL = (n: number) => {
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return fmt(n);
};

function GoalCard({ goal, onPress }: { goal: Goal; onPress: () => void }) {
  const app = useApp();
  const c = useAppColors();
  const pct =
    goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
  const linked = app.accounts.find((a) => a.id === goal.accountId);

  const deadline = new Date(goal.deadline);
  const today = new Date();
  const daysLeft = Math.ceil(
    (deadline.getTime() - today.getTime()) / (1000 * 86400),
  );
  const monthsLeft = Math.ceil(daysLeft / 30);
  const monthlyNeeded =
    monthsLeft > 0 ? (goal.target - goal.current) / monthsLeft : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: c.card,
        borderRadius: c.radius,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: c.cardBorder,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{
              color: c.text,
              fontSize: 15,
              fontWeight: "700",
              marginBottom: 4,
            }}
          >
            {goal.name}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            Linked: {linked?.name ?? "—"}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            Deadline: {goal.deadline}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: c.primary, fontSize: 18, fontWeight: "800" }}>
            {fmtL(goal.current)}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            of {fmtL(goal.target)}
          </Text>
        </View>
      </View>

      <View
        style={{
          height: 8,
          backgroundColor: c.border,
          borderRadius: 4,
          overflow: "hidden",
          marginBottom: 8,
        }}
      >
        <View
          style={{
            height: 8,
            borderRadius: 4,
            width: `${pct}%`,
            backgroundColor: pct >= 100 ? c.income : c.primary,
          }}
        />
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: c.textSecondary, fontSize: 11 }}>
          {pct.toFixed(1)}% complete
        </Text>
        <Text
          style={{
            color: pct >= 100 ? c.income : c.textSecondary,
            fontSize: 11,
          }}
        >
          {pct >= 100
            ? "🎉 Goal Reached!"
            : `${daysLeft > 0 ? daysLeft + " days left" : "Past deadline"}  ·  Need ${fmtL(monthlyNeeded)}/mo`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function InvestmentCard({
  inv,
  onPress,
}: {
  inv: Investment;
  onPress: () => void;
}) {
  const c = useAppColors();
  const returns = inv.currentValue - inv.totalInvested;
  const returnsPct =
    inv.totalInvested > 0 ? (returns / inv.totalInvested) * 100 : 0;

  const { nextDateStr, remainingText } = useMemo(() => {
    const nextDateStr = inv.nextPaymentDate
      ? new Date(inv.nextPaymentDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Not Set";

    let remainingText = null;

    if ((inv.type === "LIC" || inv.type === "RD") && inv.tenureYears) {
      let totalPayments = 0;
      if (inv.frequency === "Monthly") totalPayments = inv.tenureYears * 12;
      else if (inv.frequency === "Quarterly")
        totalPayments = inv.tenureYears * 4;
      else if (inv.frequency === "Yearly") totalPayments = inv.tenureYears;

      const paid = inv.paidCount || 0;
      const left = Math.max(0, totalPayments - paid);

      const term =
        inv.frequency === "Yearly"
          ? "Yrs"
          : inv.frequency === "Quarterly"
            ? "Qtrs"
            : "Mths";
      remainingText = `${left} ${term} left`;
    }

    return { nextDateStr, remainingText };
  }, [
    inv.nextPaymentDate,
    inv.type,
    inv.tenureYears,
    inv.frequency,
    inv.paidCount,
  ]);

  const typeColors: Record<string, string> = {
    MF: "#6366f1",
    PPF: "#10b981",
    LIC: "#f59e0b",
    FD: "#3b82f6",
    RD: "#8b5cf6",
    STOCK: "#f43f5e",
    Others: "#64748b",
  };
  const invColor = typeColors[inv.type] ?? c.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: c.card,
        borderRadius: c.radius,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: c.cardBorder,
        borderLeftWidth: 4,
        borderLeftColor: invColor,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
              flexWrap: "wrap",
            }}
          >
            <View
              style={{
                backgroundColor: invColor + "22",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 8,
              }}
            >
              <Text
                style={{ color: invColor, fontSize: 10, fontWeight: "700" }}
              >
                {inv.type}
              </Text>
            </View>
            {inv.treatAsExpense && (
              <View
                style={{
                  backgroundColor: c.expense + "22",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{ color: c.expense, fontSize: 9, fontWeight: "700" }}
                >
                  EXPENSE
                </Text>
              </View>
            )}

            {(inv.skippedCount ?? 0) > 0 && (
              <View
                style={{
                  backgroundColor: "#f59e0b22",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: "#f59e0b44",
                }}
              >
                <Text
                  style={{ color: "#f59e0b", fontSize: 9, fontWeight: "700" }}
                >
                  ⚠️ {inv.skippedCount} SKIPPED
                </Text>
              </View>
            )}
          </View>

          <Text
            style={{
              color: c.text,
              fontSize: 15,
              fontWeight: "700",
              marginBottom: 4,
            }}
          >
            {inv.name}
          </Text>

          <View style={{ marginTop: 2 }}>
            <Text style={{ color: c.textSecondary, fontSize: 12 }}>
              {fmt(inv.monthlyContribution)}/amt • {inv.frequency}
            </Text>

            {inv.autoSchedule && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 6,
                }}
              >
                <Feather name="calendar" size={12} color={c.primary} />
                <Text
                  style={{ color: c.primary, fontSize: 11, fontWeight: "700" }}
                >
                  Due: {nextDateStr}
                </Text>

                {remainingText && (
                  <>
                    <Text style={{ color: c.border, fontSize: 11 }}>|</Text>
                    <Text
                      style={{
                        color: c.warning ?? "#f59e0b",
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      {remainingText}
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: c.text, fontSize: 17, fontWeight: "800" }}>
            {fmtL(inv.currentValue)}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 11 }}>
            Current Value
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: 16,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: c.border,
        }}
      >
        <View>
          <Text
            style={{
              color: c.textSecondary,
              fontSize: 10,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Invested
          </Text>
          <Text
            style={{
              color: c.text,
              fontSize: 13,
              fontWeight: "700",
              marginTop: 2,
            }}
          >
            {fmtL(inv.totalInvested)}
          </Text>
        </View>
        {inv.showReturns !== false && (
          <View>
            <Text
              style={{
                color: c.textSecondary,
                fontSize: 10,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Returns
            </Text>
            <Text
              style={{
                color: returns >= 0 ? c.income : c.expense,
                fontSize: 13,
                fontWeight: "700",
                marginTop: 2,
              }}
            >
              {returns >= 0 ? "+" : "−"}
              {fmtL(Math.abs(returns))} ({returnsPct >= 0 ? "+" : ""}
              {returnsPct.toFixed(1)}%)
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function WealthScreen() {
  const app = useApp();
  const c = useAppColors();

  const totalInvested = useMemo(
    () => app.investments.reduce((s, i) => s + i.totalInvested, 0),
    [app.investments],
  );
  const totalCurrentValue = useMemo(
    () => app.investments.reduce((s, i) => s + i.currentValue, 0),
    [app.investments],
  );
  const totalReturns = totalCurrentValue - totalInvested;
  const overallReturnsPct =
    totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;
  const monthlyCommit = useMemo(
    () =>
      app.investments.reduce(
        (s, i) => s + (i.frequency === "Monthly" ? i.monthlyContribution : 0),
        0,
      ),
    [app.investments],
  );

  const goalProgress = useMemo(() => {
    if (app.goals.length === 0) return 0;
    const avg =
      app.goals.reduce(
        (s, g) => s + (g.target > 0 ? Math.min(g.current / g.target, 1) : 0),
        0,
      ) / app.goals.length;
    return avg * 100;
  }, [app.goals]);

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{
        flex: 1,
        backgroundColor: c.background,
      }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={c.background}
        translucent={false}
      />

      <View style={{ padding: 16, paddingBottom: 8 }}>
        <Text
          style={{
            color: c.text,
            fontSize: 22,
            fontWeight: "800",
            marginBottom: 4,
          }}
        >
          Wealth Tracker
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>
          Investments, Goals & Portfolio
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        <View
          style={{
            backgroundColor: c.primary + "1A",
            borderRadius: c.radius + 2,
            padding: 16,
            marginBottom: 20,
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
              letterSpacing: 0.8,
              marginBottom: 10,
            }}
          >
            Portfolio Overview
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <View>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 11,
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                Current Value
              </Text>
              <Text style={{ color: c.text, fontSize: 22, fontWeight: "800" }}>
                {fmtL(totalCurrentValue)}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 11,
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                Total Returns
              </Text>
              <Text
                style={{
                  color: totalReturns >= 0 ? c.income : c.expense,
                  fontSize: 18,
                  fontWeight: "800",
                }}
              >
                {totalReturns >= 0 ? "+" : "−"}
                {fmtL(Math.abs(totalReturns))}
              </Text>
              <Text
                style={{
                  color: totalReturns >= 0 ? c.income : c.expense,
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                ({overallReturnsPct >= 0 ? "+" : ""}
                {overallReturnsPct.toFixed(2)}%)
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: 16,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: c.border,
            }}
          >
            <View>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 10,
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                Invested
              </Text>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: "700" }}>
                {fmtL(totalInvested)}
              </Text>
            </View>
            <View>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 10,
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                Monthly SIP
              </Text>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: "700" }}>
                {fmt(monthlyCommit)}
              </Text>
            </View>
            <View>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 10,
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                Goals Avg
              </Text>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: "700" }}>
                {goalProgress.toFixed(0)}%
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 8 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ color: c.text, fontSize: 17, fontWeight: "700" }}>
              🎯 Financial Goals
            </Text>
            <TouchableOpacity
              onPress={() => app.openGoalModal()}
              style={{
                backgroundColor: c.primary,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                flexDirection: "row",
                gap: 4,
                alignItems: "center",
              }}
            >
              <Feather name="plus" size={14} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                Add
              </Text>
            </TouchableOpacity>
          </View>

          {app.goals.length === 0 ? (
            <View
              style={{
                backgroundColor: c.card,
                borderRadius: c.radius,
                padding: 32,
                alignItems: "center",
                borderWidth: 1,
                borderColor: c.cardBorder,
                marginBottom: 12,
              }}
            >
              <Feather name="target" size={36} color={c.mutedForeground} />
              <Text
                style={{
                  color: c.mutedForeground,
                  fontSize: 14,
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                No goals yet{"\n"}Tap + Add to set your first goal
              </Text>
            </View>
          ) : (
            app.goals.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onPress={() => app.openGoalModal(g)}
              />
            ))
          )}
        </View>

        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ color: c.text, fontSize: 17, fontWeight: "700" }}>
              📈 Investments
            </Text>
            <TouchableOpacity
              onPress={() => app.openInvestmentModal()}
              style={{
                backgroundColor: c.primary,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                flexDirection: "row",
                gap: 4,
                alignItems: "center",
              }}
            >
              <Feather name="plus" size={14} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                Add
              </Text>
            </TouchableOpacity>
          </View>

          {app.investments.length === 0 ? (
            <View
              style={{
                backgroundColor: c.card,
                borderRadius: c.radius,
                padding: 32,
                alignItems: "center",
                borderWidth: 1,
                borderColor: c.cardBorder,
              }}
            >
              <Feather name="trending-up" size={36} color={c.mutedForeground} />
              <Text
                style={{
                  color: c.mutedForeground,
                  fontSize: 14,
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                No investments tracked yet{"\n"}Tap + Add to get started
              </Text>
            </View>
          ) : (
            app.investments.map((i) => (
              <InvestmentCard
                key={i.id}
                inv={i}
                onPress={() => app.openInvestmentModal(i)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
