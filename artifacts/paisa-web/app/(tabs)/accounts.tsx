import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { useApp, Account } from "@/context/AppContext";
import { useAppColors } from "@/hooks/useAppColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const fmt = (n: number) =>
  `₹${Math.abs(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;

// Safely map both OLD legacy icons and NEW premium icons
const getSafeIcon = (
  iconStr: string,
): keyof typeof MaterialCommunityIcons.glyphMap => {
  if (!iconStr) return "bank"; // Absolute fallback

  const validIcons = [
    "bank",
    "credit-card-multiple",
    "wallet-bifold",
    "piggy-bank",
    "safe",
    "cellphone-nfc",
    "finance",
    "bitcoin",
    "cash-multiple",
    "briefcase",
    "cash",
    "hand-coin",
  ];
  if (validIcons.includes(iconStr)) {
    return iconStr as keyof typeof MaterialCommunityIcons.glyphMap;
  }

  const map: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    Landmark: "bank",
    CreditCard: "credit-card-multiple",
    Wallet: "wallet-bifold",
    PiggyBank: "piggy-bank",
    Briefcase: "briefcase",
    DollarSign: "cash",
  };

  return map[iconStr] || "bank";
};

export default function AccountsScreen() {
  const app = useApp();
  const c = useAppColors();

  const [selectedAcc, setSelectedAcc] = useState<Account | null>(null);
  const [txFilter, setTxFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");

  // --- 1. MAIN SCREEN CALCULATIONS ---
  const totalBalance = useMemo(
    () => app.accounts.reduce((sum, a) => sum + a.balance, 0),
    [app.accounts],
  );

  // Group accounts logically for the UI Sections
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, Account[]> = {
      CASH_WALLET: [],
      BANK: [],
      CREDIT_CARD: [],
      INVESTMENT: [],
    };
    app.accounts.forEach((a) => {
      if (groups[a.type]) groups[a.type].push(a);
    });

    return [
      { title: "Cash", data: groups.CASH_WALLET },
      { title: "Bank Accounts", data: groups.BANK },
      { title: "Credit Cards", data: groups.CREDIT_CARD },
      { title: "Investments", data: groups.INVESTMENT },
    ].filter((g) => g.data.length > 0);
  }, [app.accounts]);

  // --- 2. DETAILS MODAL CALCULATIONS (CHART & STATS) ---
  const accDetails = useMemo(() => {
    if (!selectedAcc)
      return {
        chartData: [],
        minVal: 0,
        maxVal: 0,
        moneyIn: 0,
        moneyOut: 0,
        txs: [],
      };

    const txs = app.transactions
      .filter(
        (t) => t.sourceId === selectedAcc.id || t.destId === selectedAcc.id,
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let moneyIn = 0;
    let moneyOut = 0;
    let currentBal = selectedAcc.balance;
    const history = [{ val: currentBal }];

    txs.forEach((t) => {
      const isIncome =
        (t.type === "INCOME" && t.sourceId === selectedAcc.id) ||
        (t.type === "TRANSFER" && t.destId === selectedAcc.id);
      const isExpense =
        (t.type === "EXPENSE" && t.sourceId === selectedAcc.id) ||
        (t.type === "TRANSFER" && t.sourceId === selectedAcc.id);

      if (isIncome) {
        moneyIn += t.amount;
        currentBal -= t.amount;
      } else if (isExpense) {
        moneyOut += t.amount;
        currentBal += t.amount;
      }
      history.push({ val: currentBal });
    });

    history.reverse();
    if (history.length === 1) history.push({ val: history[0].val });
    const pts = history.slice(-15);
    const vals = pts.map((p) => p.val);
    const min = Math.min(...vals);
    const max = Math.max(...vals);

    return {
      chartData: vals,
      minVal: min,
      maxVal: max,
      moneyIn,
      moneyOut,
      txs,
    };
  }, [selectedAcc, app.transactions]);

  // --- 3. RECENT ACTIVITY FILTERING ---
  const filteredTxs = useMemo(() => {
    if (!selectedAcc) return [];
    return accDetails.txs.filter((tx) => {
      const isMoneyIn =
        (tx.type === "INCOME" && tx.sourceId === selectedAcc.id) ||
        (tx.type === "TRANSFER" && tx.destId === selectedAcc.id);

      if (txFilter === "ALL") return true;
      if (txFilter === "INCOME") return isMoneyIn;
      if (txFilter === "EXPENSE") return !isMoneyIn;
      return true;
    });
  }, [accDetails.txs, txFilter, selectedAcc]);

  const getAccName = (id?: string) =>
    app.accounts.find((a) => a.id === id)?.name ?? id ?? "";

  // --- SVG CHART RENDERER ---
  const renderChart = () => {
    const { chartData, minVal, maxVal } = accDetails;
    if (chartData.length < 2) return null;

    const chartW = SCREEN_WIDTH;
    const chartH = 120;
    const pad = 15;

    const points = chartData
      .map((val, i) => {
        const x = (i / (chartData.length - 1)) * chartW;
        const range = maxVal - minVal || 1;
        const y = chartH - pad - ((val - minVal) / range) * (chartH - pad * 2);
        return `${x},${y}`;
      })
      .join(" L ");

    const dLine = `M ${points}`;
    const dArea = `${dLine} L ${chartW},${chartH} L 0,${chartH} Z`;

    return (
      <View style={{ width: chartW, height: chartH, marginVertical: 16 }}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop
                offset="0"
                stopColor={selectedAcc?.color || c.primary}
                stopOpacity="0.2"
              />
              <Stop
                offset="1"
                stopColor={selectedAcc?.color || c.primary}
                stopOpacity="0"
              />
            </LinearGradient>
          </Defs>
          <Path d={dArea} fill="url(#grad)" />
          <Path
            d={dLine}
            fill="none"
            stroke={selectedAcc?.color || c.primary}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: c.background }}
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
            marginBottom: 20,
          }}
        >
          <Text style={{ color: c.text, fontSize: 24, fontWeight: "800" }}>
            Accounts
          </Text>
          <TouchableOpacity
            onPress={() => app.openAccountModal()}
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

        {/* --- TOTAL BALANCE CARD --- */}
        <View
          style={{
            backgroundColor: c.surfaceElevated,
            borderRadius: c.radius + 4,
            padding: 20,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: c.border,
          }}
        >
          <Text
            style={{
              color: c.textSecondary,
              fontSize: 12,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Total Balance
          </Text>
          <Text style={{ color: c.text, fontSize: 32, fontWeight: "800" }}>
            {fmt(totalBalance)}
          </Text>
        </View>
      </View>

      {/* --- GROUPED LIST & CC PROGRESS BAR RESTORED --- */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        {groupedAccounts.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              padding: 40,
              backgroundColor: c.card,
              borderRadius: c.radius,
              borderWidth: 1,
              borderColor: c.cardBorder,
            }}
          >
            <MaterialCommunityIcons
              name="wallet-outline"
              size={48}
              color={c.mutedForeground}
            />
            <Text
              style={{ color: c.mutedForeground, marginTop: 12, fontSize: 15 }}
            >
              No accounts yet
            </Text>
          </View>
        ) : (
          groupedAccounts.map((group) => (
            <View key={group.title} style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 10,
                  paddingLeft: 4,
                }}
              >
                {group.title}
              </Text>

              {group.data.map((acc) => {
                // RESTORED CREDIT CARD PROGRESS BAR LOGIC
                const isCC = acc.type === "CREDIT_CARD";
                const limit = acc.selfLimit || acc.bankLimit || 0;
                const spent = acc.balance < 0 ? Math.abs(acc.balance) : 0;
                const pct =
                  limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

                return (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => {
                      setSelectedAcc(acc);
                      setTxFilter("ALL");
                    }}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: c.card,
                      borderRadius: c.radius,
                      padding: 16,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: c.cardBorder,
                      flexDirection: "column", // Allow stacking for progress bar
                    }}
                  >
                    {/* Top Row: Icon, Details, Balance */}
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: acc.color + "22",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 14,
                        }}
                      >
                        <MaterialCommunityIcons
                          name={getSafeIcon(acc.icon)}
                          size={24}
                          color={acc.color}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: c.text,
                            fontSize: 16,
                            fontWeight: "700",
                          }}
                        >
                          {acc.name}
                        </Text>
                        {acc.purpose ? (
                          <Text
                            style={{
                              color: c.textSecondary,
                              fontSize: 12,
                              marginTop: 2,
                            }}
                          >
                            {acc.purpose}
                          </Text>
                        ) : null}
                      </View>

                      <View style={{ alignItems: "flex-end" }}>
                        <Text
                          style={{
                            color: acc.balance >= 0 ? c.text : c.expense,
                            fontSize: 16,
                            fontWeight: "700",
                          }}
                        >
                          {acc.balance < 0 ? "-" : ""}
                          {fmt(acc.balance)}
                        </Text>
                      </View>
                    </View>

                    {/* Bottom Row: Restored Progress Bar (Only for Credit Cards) */}
                    {isCC && limit > 0 && (
                      <View
                        style={{
                          marginTop: 16,
                          paddingTop: 12,
                          borderTopWidth: 1,
                          borderTopColor: c.border,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: c.textSecondary,
                              fontSize: 11,
                              fontWeight: "600",
                            }}
                          >
                            {fmt(spent)} used
                          </Text>
                          <Text
                            style={{
                              color: c.textSecondary,
                              fontSize: 11,
                              fontWeight: "600",
                            }}
                          >
                            {fmt(limit)} limit
                          </Text>
                        </View>
                        <View
                          style={{
                            height: 6,
                            backgroundColor: c.border,
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <View
                            style={{
                              height: 6,
                              width: `${pct}%`,
                              backgroundColor: pct > 85 ? c.expense : acc.color,
                              borderRadius: 3,
                            }}
                          />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {/* --- CASHEW-STYLE ACCOUNT DETAILS MODAL (KEPT EXACTLY THE SAME) --- */}
      <Modal
        visible={!!selectedAcc}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedAcc(null)}
      >
        {selectedAcc && (
          <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
            <StatusBar
              barStyle="light-content"
              backgroundColor={c.background}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 16,
              }}
            >
              <TouchableOpacity
                onPress={() => setSelectedAcc(null)}
                style={{
                  padding: 8,
                  backgroundColor: c.surfaceElevated,
                  borderRadius: 12,
                }}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={24}
                  color={c.text}
                />
              </TouchableOpacity>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>
                {selectedAcc.name}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  app.openAccountModal(selectedAcc);
                  setSelectedAcc(null);
                }}
                style={{
                  padding: 8,
                  backgroundColor: selectedAcc.color + "22",
                  borderRadius: 12,
                }}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={20}
                  color={selectedAcc.color}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 60 }}
            >
              <View style={{ alignItems: "center", paddingTop: 16 }}>
                <Text
                  style={{
                    color: c.textSecondary,
                    fontSize: 13,
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  Current Balance
                </Text>
                <Text
                  style={{
                    color: selectedAcc.balance >= 0 ? c.text : c.expense,
                    fontSize: 40,
                    fontWeight: "800",
                  }}
                >
                  {selectedAcc.balance < 0 ? "-" : ""}
                  {fmt(selectedAcc.balance)}
                </Text>
                {renderChart()}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  paddingHorizontal: 16,
                  gap: 12,
                  marginBottom: 32,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: c.card,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: c.cardBorder,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: c.income + "22",
                        padding: 4,
                        borderRadius: 8,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="arrow-bottom-left"
                        size={16}
                        color={c.income}
                      />
                    </View>
                    <Text
                      style={{
                        color: c.textSecondary,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      Money In
                    </Text>
                  </View>
                  <Text
                    style={{ color: c.text, fontSize: 18, fontWeight: "800" }}
                  >
                    {fmt(accDetails.moneyIn)}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: c.card,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: c.cardBorder,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: c.expense + "22",
                        padding: 4,
                        borderRadius: 8,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="arrow-top-right"
                        size={16}
                        color={c.expense}
                      />
                    </View>
                    <Text
                      style={{
                        color: c.textSecondary,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      Money Out
                    </Text>
                  </View>
                  <Text
                    style={{ color: c.text, fontSize: 18, fontWeight: "800" }}
                  >
                    {fmt(accDetails.moneyOut)}
                  </Text>
                </View>
              </View>

              <View style={{ paddingHorizontal: 16 }}>
                <Text
                  style={{
                    color: c.text,
                    fontSize: 18,
                    fontWeight: "800",
                    marginBottom: 12,
                  }}
                >
                  Recent Activity
                </Text>

                <View
                  style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}
                >
                  {(["ALL", "INCOME", "EXPENSE"] as const).map((filterOpt) => (
                    <TouchableOpacity
                      key={filterOpt}
                      onPress={() => setTxFilter(filterOpt)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor:
                          txFilter === filterOpt
                            ? c.primary
                            : c.surfaceElevated,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            txFilter === filterOpt ? "#fff" : c.textSecondary,
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {filterOpt === "ALL"
                          ? "All"
                          : filterOpt === "INCOME"
                            ? "Income"
                            : "Expenses"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {filteredTxs.length === 0 ? (
                  <View
                    style={{
                      alignItems: "center",
                      padding: 32,
                      backgroundColor: c.card,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: c.cardBorder,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="inbox-outline"
                      size={40}
                      color={c.mutedForeground}
                    />
                    <Text
                      style={{
                        color: c.mutedForeground,
                        marginTop: 12,
                        fontSize: 14,
                      }}
                    >
                      No {txFilter === "ALL" ? "" : txFilter.toLowerCase()}{" "}
                      transactions found
                    </Text>
                  </View>
                ) : (
                  filteredTxs.map((tx) => {
                    const isMoneyIn =
                      (tx.type === "INCOME" &&
                        tx.sourceId === selectedAcc.id) ||
                      (tx.type === "TRANSFER" && tx.destId === selectedAcc.id);
                    const txColor = isMoneyIn
                      ? c.income
                      : tx.type === "TRANSFER"
                        ? c.transfer
                        : c.expense;
                    const txSign = isMoneyIn ? "+" : "-";

                    return (
                      <TouchableOpacity
                        key={tx.id}
                        onPress={() => {
                          setSelectedAcc(null);
                          app.openTxModal(tx);
                        }}
                        style={{
                          backgroundColor: c.card,
                          borderRadius: c.radius,
                          padding: 14,
                          marginBottom: 10,
                          borderWidth: 1,
                          borderColor: c.cardBorder,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                        activeOpacity={0.7}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: txColor + "1A",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <MaterialCommunityIcons
                            name={
                              isMoneyIn
                                ? "arrow-bottom-left"
                                : "arrow-top-right"
                            }
                            size={20}
                            color={txColor}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: c.text,
                              fontSize: 15,
                              fontWeight: "700",
                            }}
                          >
                            {tx.note || tx.category}
                          </Text>
                          <Text
                            style={{
                              color: c.textSecondary,
                              fontSize: 12,
                              marginTop: 3,
                            }}
                          >
                            {tx.date} ·{" "}
                            {tx.type === "TRANSFER"
                              ? isMoneyIn
                                ? `From ${getAccName(tx.sourceId)}`
                                : `To ${getAccName(tx.destId)}`
                              : tx.category}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: txColor,
                            fontWeight: "700",
                            fontSize: 15,
                          }}
                        >
                          {txSign}
                          {fmt(tx.amount)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}
