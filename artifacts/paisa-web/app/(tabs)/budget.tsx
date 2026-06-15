import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useAppColors } from "@/hooks/useAppColors";
import SelectPicker from "@/components/SelectPicker";

const fmt = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

// 🔥 SMART LEGACY MAPPER: Ensures budget icons render perfectly and fixes old DB entries
const getSafeIcon = (
  iconStr: string | undefined,
): keyof typeof MaterialCommunityIcons.glyphMap => {
  if (!iconStr) return "label-outline";

  const validIcons = [
    "home",
    "cart",
    "car",
    "gas-station",
    "food-fork-drink",
    "coffee",
    "lightning-bolt",
    "wifi",
    "movie-open",
    "baby-carriage",
    "paw",
    "face-woman-shimmer",
    "heart-pulse",
    "pill",
    "tshirt-crew",
    "dumbbell",
    "book-open-page-variant",
    "airplane",
    "gift",
    "bank-transfer",
    "shield-check",
    "piggy-bank",
    "palette",
    "label-outline",
    "wallet-bifold",
  ];
  if (validIcons.includes(iconStr)) {
    return iconStr as keyof typeof MaterialCommunityIcons.glyphMap;
  }

  const map: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    Wallet: "wallet-bifold",
    Coffee: "coffee",
    Car: "car",
    ShoppingCart: "cart",
    Zap: "lightning-bolt",
    Heart: "heart-pulse",
    Activity: "heart-pulse",
    Book: "book-open-page-variant",
    Music: "music",
    Home: "home",
    Gift: "gift",
    Globe: "airplane",
  };

  return map[iconStr] || "label-outline";
};

function MonthNav({
  month,
  onChange,
}: {
  month: string;
  onChange: (m: string) => void;
}) {
  const c = useAppColors();
  const [year, mon] = month.split("-").map(Number);
  const prev = () => {
    const d = new Date(year, mon - 2, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const next = () => {
    const d = new Date(year, mon, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const label = new Date(year, mon - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: c.card,
        borderRadius: c.radius,
        padding: 4,
        borderWidth: 1,
        borderColor: c.cardBorder,
      }}
    >
      <TouchableOpacity onPress={prev} style={{ padding: 8, borderRadius: 8 }}>
        <MaterialCommunityIcons name="chevron-left" size={24} color={c.text} />
      </TouchableOpacity>
      <Text
        style={{
          color: c.text,
          fontWeight: "700",
          fontSize: 15,
          flex: 1,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
      <TouchableOpacity onPress={next} style={{ padding: 8, borderRadius: 8 }}>
        <MaterialCommunityIcons name="chevron-right" size={24} color={c.text} />
      </TouchableOpacity>
    </View>
  );
}

export default function BudgetScreen() {
  const app = useApp();
  const c = useAppColors();
  const [copyFromMonth, setCopyFromMonth] = useState("");

  const monthBudgets = useMemo(
    () => app.budgets.filter((b) => b.month === app.currentMonth),
    [app.budgets, app.currentMonth],
  );

  const monthTxs = useMemo(
    () => app.transactions.filter((t) => t.date.startsWith(app.currentMonth)),
    [app.transactions, app.currentMonth],
  );

  const budgetStats = useMemo(() => {
    return monthBudgets.map((b) => {
      const spent = monthTxs
        .filter((t) => t.type === "EXPENSE" && t.category === b.category)
        .reduce((s, t) => s + t.amount, 0);
      const pct = b.limit > 0 ? Math.min((spent / b.limit) * 100, 100) : 0;
      return { ...b, spent, remaining: b.limit - spent, pct };
    });
  }, [monthBudgets, monthTxs]);

  const totalBudgeted = budgetStats.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgetStats.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  const budgetedCategories = new Set(monthBudgets.map((b) => b.category));
  const unbudgetedExpenses = monthTxs.filter(
    (t) => t.type === "EXPENSE" && !budgetedCategories.has(t.category),
  );
  const unbudgetedTotal = unbudgetedExpenses.reduce((s, t) => s + t.amount, 0);

  const monthIncome = monthTxs
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);

  const monthCommitments = app.commitments
    .filter((c2) => {
      if (!c2.date.startsWith(app.currentMonth)) return false;
      const isNonExpenseInvestment = app.investments.some(
        (inv) => inv.id === c2.destId && !inv.treatAsExpense,
      );
      if (isNonExpenseInvestment) return false;
      if (c2.linkedBudgetId) return false;
      return true;
    })
    .reduce((s, c2) => s + c2.amount, 0);

  const monthInvestments = app.investments
    .filter((i) => !i.treatAsExpense)
    .reduce((s, i) => s + i.monthlyContribution, 0);

  const trueSpendable = monthIncome - monthInvestments - monthCommitments;
  const leftToBudget = trueSpendable - totalBudgeted;

  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(app.budgets.map((b) => b.month)))
      .sort()
      .reverse();
    return months
      .filter((m) => m !== app.currentMonth)
      .map((m) => {
        const [y, mo] = m.split("-").map(Number);
        const label = new Date(y, mo - 1, 1).toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        });
        return { value: m, label };
      });
  }, [app.budgets, app.currentMonth]);

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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <Text style={{ color: c.text, fontSize: 22, fontWeight: "800" }}>
            Budget Planner
          </Text>
          <TouchableOpacity
            onPress={() => app.openBudgetModal()}
            style={{
              backgroundColor: c.primary,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
              Add
            </Text>
          </TouchableOpacity>
        </View>
        <MonthNav month={app.currentMonth} onChange={app.setCurrentMonth} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        <View
          style={{
            backgroundColor: c.primary + "1A",
            borderRadius: c.radius,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: c.primary + "44",
          }}
        >
          <Text
            style={{
              color: c.primary,
              fontSize: 12,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 8,
            }}
          >
            True Spendable Calculator
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>Income</Text>
            <Text style={{ color: c.income, fontWeight: "600", fontSize: 13 }}>
              +{fmt(monthIncome)}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>
              Commitments
            </Text>
            <Text style={{ color: c.expense, fontWeight: "600", fontSize: 13 }}>
              -{fmt(monthCommitments)}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
            }}
          >
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>
              Investments (non-expense)
            </Text>
            <Text
              style={{ color: c.transfer, fontWeight: "600", fontSize: 13 }}
            >
              -{fmt(monthInvestments)}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>
              Available to Budget
            </Text>
            <Text
              style={{
                color: trueSpendable >= 0 ? c.income : c.expense,
                fontSize: 17,
                fontWeight: "800",
              }}
            >
              {fmt(trueSpendable)}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              backgroundColor:
                leftToBudget < 0 ? c.expense + "22" : c.surfaceElevated,
              padding: 10,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: leftToBudget < 0 ? c.expense : c.textSecondary,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {leftToBudget < 0 ? "Over Budgeted!" : "Unallocated Cash"}
            </Text>
            <Text
              style={{
                color: leftToBudget < 0 ? c.expense : c.text,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              {leftToBudget < 0 ? "" : "+"}
              {fmt(leftToBudget)}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
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
              }}
            >
              Budgeted
            </Text>
            <Text
              style={{
                color: c.text,
                fontSize: 15,
                fontWeight: "700",
                marginTop: 4,
              }}
            >
              {fmt(totalBudgeted)}
            </Text>
          </View>
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
              }}
            >
              Spent
            </Text>
            <Text
              style={{
                color: c.expense,
                fontSize: 15,
                fontWeight: "700",
                marginTop: 4,
              }}
            >
              {fmt(totalSpent)}
            </Text>
          </View>
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
              }}
            >
              Remaining
            </Text>
            <Text
              style={{
                color: totalRemaining >= 0 ? c.income : c.expense,
                fontSize: 15,
                fontWeight: "700",
                marginTop: 4,
              }}
            >
              {fmt(totalRemaining)}
            </Text>
          </View>
        </View>

        {budgetStats.length === 0 ? (
          <View
            style={{
              backgroundColor: c.card,
              borderRadius: c.radius,
              padding: 40,
              alignItems: "center",
              borderWidth: 1,
              borderColor: c.cardBorder,
              marginBottom: 16,
            }}
          >
            <MaterialCommunityIcons
              name="chart-donut"
              size={48}
              color={c.mutedForeground}
            />
            <Text
              style={{
                color: c.mutedForeground,
                fontSize: 15,
                marginTop: 16,
                textAlign: "center",
              }}
            >
              No budgets for this month{"\n"}Tap + Add to create one
            </Text>
          </View>
        ) : (
          <View style={{ marginBottom: 16 }}>
            {budgetStats.map((b) => (
              <TouchableOpacity
                key={b.id}
                onPress={() => app.openBudgetModal(b)}
                style={{
                  backgroundColor: c.card,
                  borderRadius: c.radius,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: c.cardBorder,
                }}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 44, // 🔥 BIGGER SIZE
                        height: 44, // 🔥 BIGGER SIZE
                        borderRadius: 14, // 🔥 SOFTER CORNERS MATCHING ACCOUNTS
                        backgroundColor: b.color + "22",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialCommunityIcons
                        name={getSafeIcon(b.icon)}
                        size={24}
                        color={b.color}
                      />
                    </View>
                    <View>
                      <Text
                        style={{
                          color: c.text,
                          fontSize: 16, // slightly bigger text to match icon
                          fontWeight: "700",
                        }}
                      >
                        {b.category}
                      </Text>
                      <Text
                        style={{
                          color: c.textSecondary,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {fmt(b.spent)} of {fmt(b.limit)}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        color: b.remaining >= 0 ? c.income : c.expense,
                        fontWeight: "700",
                        fontSize: 15,
                      }}
                    >
                      {b.remaining >= 0
                        ? fmt(b.remaining) + " left"
                        : fmt(Math.abs(b.remaining)) + " over"}
                    </Text>
                    <Text
                      style={{
                        color: b.pct > 90 ? c.expense : c.textSecondary,
                        fontSize: 12,
                        fontWeight: "600",
                        marginTop: 2,
                      }}
                    >
                      {b.pct.toFixed(0)}%
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    height: 7,
                    backgroundColor: c.border,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: 7,
                      borderRadius: 4,
                      width: `${b.pct}%`,
                      backgroundColor: b.pct > 90 ? c.expense : b.color,
                    }}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {unbudgetedTotal > 0 && (
          <View
            style={{
              backgroundColor: "#f59e0b22",
              borderRadius: c.radius,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#f59e0b44",
            }}
          >
            <Text
              style={{
                color: "#f59e0b",
                fontSize: 13,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              ⚠️ Unbudgeted Expenses: {fmt(unbudgetedTotal)}
            </Text>
            {Array.from(new Set(unbudgetedExpenses.map((t) => t.category))).map(
              (cat) => {
                const total = unbudgetedExpenses
                  .filter((t) => t.category === cat)
                  .reduce((s, t) => s + t.amount, 0);
                return (
                  <Text
                    key={cat}
                    style={{ color: c.textSecondary, fontSize: 12 }}
                  >
                    • {cat}: {fmt(total)}
                  </Text>
                );
              },
            )}
          </View>
        )}

        {availableMonths.length > 0 && (
          <View
            style={{
              backgroundColor: c.card,
              borderRadius: c.radius,
              padding: 16,
              borderWidth: 1,
              borderColor: c.cardBorder,
            }}
          >
            <Text
              style={{
                color: c.text,
                fontSize: 14,
                fontWeight: "700",
                marginBottom: 12,
              }}
            >
              📋 Copy Budgets From Another Month
            </Text>
            <SelectPicker
              options={availableMonths}
              value={copyFromMonth}
              onChange={setCopyFromMonth}
              placeholder="Select source month..."
            />
            {copyFromMonth && (
              <TouchableOpacity
                onPress={() => {
                  app.copyBudgets(copyFromMonth, app.currentMonth);
                  setCopyFromMonth("");
                }}
                style={{
                  backgroundColor: c.primary,
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Copy to {app.currentMonth}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
