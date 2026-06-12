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
import { useApp } from "@/context/AppContext";
import { useAppColors } from "@/hooks/useAppColors";

const fmt = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

export default function MonthEndScreen() {
  const app = useApp();
  const c = useAppColors();

  const completed = app.monthEndTasks.filter((t) => t.isCompleted).length;
  const total = app.monthEndTasks.length;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  const monthTxs = useMemo(
    () => app.transactions.filter((t) => t.date.startsWith(app.currentMonth)),
    [app.transactions, app.currentMonth],
  );

  const income = monthTxs
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const expenses = monthTxs
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  const unpaidCommitments = app.commitments.filter((c2) => !c2.isPaid).length;
  const budgetOverruns = useMemo(() => {
    const monthBudgets = app.budgets.filter(
      (b) => b.month === app.currentMonth,
    );
    return monthBudgets.filter((b) => {
      const spent = monthTxs
        .filter((t) => t.type === "EXPENSE" && t.category === b.category)
        .reduce((s, t) => s + t.amount, 0);
      return spent > b.limit;
    }).length;
  }, [app.budgets, monthTxs, app.currentMonth]);

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
            marginBottom: 2,
          }}
        >
          Month-End Closure
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>
          {app.currentMonth} · Wrap up & review
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        <View
          style={{
            backgroundColor: c.card,
            borderRadius: c.radius + 2,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: c.cardBorder,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <View>
              <Text style={{ color: c.text, fontSize: 17, fontWeight: "700" }}>
                Checklist Progress
              </Text>
              <Text
                style={{ color: c.textSecondary, fontSize: 13, marginTop: 2 }}
              >
                {completed} of {total} tasks done
              </Text>
            </View>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor:
                  pct === 100 ? c.income + "22" : c.primary + "22",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: pct === 100 ? c.income : c.primary,
              }}
            >
              <Text
                style={{
                  color: pct === 100 ? c.income : c.primary,
                  fontSize: 16,
                  fontWeight: "800",
                }}
              >
                {pct.toFixed(0)}%
              </Text>
            </View>
          </View>
          <View
            style={{
              height: 8,
              backgroundColor: c.border,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 8,
                borderRadius: 4,
                width: `${pct}%`,
                backgroundColor: pct === 100 ? c.income : c.primary,
              }}
            />
          </View>
          {pct === 100 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 12,
                backgroundColor: c.income + "11",
                borderRadius: 10,
                padding: 10,
              }}
            >
              <Feather name="check-circle" size={18} color={c.income} />
              <Text
                style={{ color: c.income, fontWeight: "700", fontSize: 14 }}
              >
                Month-end complete! Well done 🎉
              </Text>
            </View>
          )}
        </View>

        <View
          style={{
            backgroundColor: c.card,
            borderRadius: c.radius,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: c.cardBorder,
          }}
        >
          <Text
            style={{
              color: c.text,
              fontSize: 15,
              fontWeight: "700",
              marginBottom: 12,
            }}
          >
            📊 Month Summary
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: c.income + "11",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 10,
                  fontWeight: "600",
                  textTransform: "uppercase",
                }}
              >
                Income
              </Text>
              <Text
                style={{
                  color: c.income,
                  fontSize: 15,
                  fontWeight: "700",
                  marginTop: 4,
                }}
              >
                {fmt(income)}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: c.expense + "11",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 10,
                  fontWeight: "600",
                  textTransform: "uppercase",
                }}
              >
                Expenses
              </Text>
              <Text
                style={{
                  color: c.expense,
                  fontSize: 15,
                  fontWeight: "700",
                  marginTop: 4,
                }}
              >
                {fmt(expenses)}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: c.transfer + "11",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 10,
                  fontWeight: "600",
                  textTransform: "uppercase",
                }}
              >
                Net Savings
              </Text>
              <Text
                style={{
                  color: savings >= 0 ? c.income : c.expense,
                  fontSize: 15,
                  fontWeight: "700",
                  marginTop: 4,
                }}
              >
                {savings >= 0 ? "" : "−"}
                {fmt(savings)}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: c.primary + "11",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 10,
                  fontWeight: "600",
                  textTransform: "uppercase",
                }}
              >
                Savings Rate
              </Text>
              <Text
                style={{
                  color:
                    savingsRate >= 20
                      ? c.income
                      : savingsRate >= 10
                        ? "#f59e0b"
                        : c.expense,
                  fontSize: 15,
                  fontWeight: "700",
                  marginTop: 4,
                }}
              >
                {savingsRate.toFixed(1)}%
              </Text>
            </View>
          </View>

          {(unpaidCommitments > 0 || budgetOverruns > 0) && (
            <View
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: c.border,
              }}
            >
              {unpaidCommitments > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: "#f59e0b22",
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 8,
                  }}
                >
                  <Feather name="alert-triangle" size={16} color="#f59e0b" />
                  <Text
                    style={{
                      color: "#f59e0b",
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {unpaidCommitments} unpaid commitment
                    {unpaidCommitments > 1 ? "s" : ""}
                  </Text>
                </View>
              )}
              {budgetOverruns > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: c.expense + "22",
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <Feather name="alert-circle" size={16} color={c.expense} />
                  <Text
                    style={{
                      color: c.expense,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {budgetOverruns} budget categor
                    {budgetOverruns > 1 ? "ies" : "y"} over limit
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ color: c.text, fontSize: 17, fontWeight: "700" }}>
            ✅ Month-End Checklist
          </Text>
          <TouchableOpacity
            onPress={() => app.openTaskModal()}
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
              Add Task
            </Text>
          </TouchableOpacity>
        </View>

        {app.monthEndTasks.length === 0 ? (
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
            <Feather name="check-square" size={36} color={c.mutedForeground} />
            <Text
              style={{
                color: c.mutedForeground,
                fontSize: 14,
                marginTop: 12,
                textAlign: "center",
              }}
            >
              No tasks yet{"\n"}Add your month-end routine
            </Text>
          </View>
        ) : (
          app.monthEndTasks.map((task) => (
            <View
              key={task.id}
              style={{
                backgroundColor: c.card,
                borderRadius: c.radius,
                padding: 14,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: task.isCompleted ? c.income + "44" : c.cardBorder,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => app.toggleMonthEndTask(task.id)}
                style={{ marginRight: 12 }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: task.isCompleted ? c.income : c.border,
                    backgroundColor: task.isCompleted
                      ? c.income
                      : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {task.isCompleted && (
                    <Feather name="check" size={14} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
              <Text
                style={{
                  flex: 1,
                  color: task.isCompleted ? c.textTertiary : c.text,
                  fontSize: 14,
                  fontWeight: "500",
                  textDecorationLine: task.isCompleted
                    ? "line-through"
                    : "none",
                }}
              >
                {task.text}
              </Text>
              <TouchableOpacity
                onPress={() => app.openTaskModal(task)}
                style={{ padding: 6 }}
                activeOpacity={0.7}
              >
                <Feather name="edit-2" size={14} color={c.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
