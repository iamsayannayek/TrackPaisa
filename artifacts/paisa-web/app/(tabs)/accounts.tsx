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
import { useApp, Account } from "@/context/AppContext";
import { useAppColors } from "@/hooks/useAppColors";

const fmt = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

function AccountCard({ acc, onPress }: { acc: Account; onPress: () => void }) {
  const c = useAppColors();
  const isCreditCard = acc.type === "CREDIT_CARD";
  const limit = acc.selfLimit || acc.bankLimit || 0;
  const used = isCreditCard ? Math.abs(acc.balance) : 0;
  const usedPct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  const typeLabel =
    {
      BANK: "Bank Account",
      CREDIT_CARD: "Credit Card",
      CASH_WALLET: "Cash Wallet",
      INVESTMENT: "Investment",
    }[acc.type] ?? acc.type;

  const balanceColor = isCreditCard
    ? usedPct > 80
      ? c.expense
      : usedPct > 50
        ? (c.warning ?? "#f59e0b")
        : c.income
    : acc.balance < 0
      ? c.expense
      : c.text;

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
        borderLeftColor: acc.color ?? c.primary,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: (acc.color ?? c.primary) + "22",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather
                name={
                  acc.icon === "CreditCard"
                    ? "credit-card"
                    : acc.icon === "Wallet"
                      ? "pocket"
                      : "archive"
                }
                size={16}
                color={acc.color ?? c.primary}
              />
            </View>
            <View>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>
                {acc.name}
              </Text>
              <Text style={{ color: c.textSecondary, fontSize: 11 }}>
                {typeLabel}
              </Text>
            </View>
          </View>
          <Text
            style={{ color: c.textTertiary, fontSize: 12 }}
            numberOfLines={1}
          >
            {acc.purpose}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{ color: balanceColor, fontSize: 18, fontWeight: "800" }}
          >
            {isCreditCard && acc.balance < 0 ? "−" : ""}
            {fmt(acc.balance)}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 11 }}>Balance</Text>
        </View>
      </View>

      {isCreditCard && limit > 0 && (
        <View style={{ marginTop: 8 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <Text style={{ color: c.textSecondary, fontSize: 11 }}>
              Used: {fmt(used)} of {fmt(limit)} limit
            </Text>
            <Text
              style={{
                color: usedPct > 80 ? c.expense : c.textSecondary,
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              {usedPct.toFixed(0)}%
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
                borderRadius: 3,
                width: `${usedPct}%`,
                backgroundColor:
                  usedPct > 80
                    ? c.expense
                    : usedPct > 50
                      ? "#f59e0b"
                      : c.income,
              }}
            />
          </View>
          {acc.bankLimit && acc.selfLimit && (
            <Text style={{ color: c.textTertiary, fontSize: 10, marginTop: 4 }}>
              Bank limit: {fmt(acc.bankLimit)} · Self limit:{" "}
              {fmt(acc.selfLimit)}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function AccountsScreen() {
  const app = useApp();
  const c = useAppColors();

  const grouped = useMemo(() => {
    const groups: Record<string, Account[]> = {};
    app.accounts.forEach((a) => {
      if (!groups[a.type]) groups[a.type] = [];
      groups[a.type].push(a);
    });
    return groups;
  }, [app.accounts]);

  const totalLiquid = useMemo(
    () =>
      app.accounts
        .filter((a) => a.type === "BANK" || a.type === "CASH_WALLET")
        .reduce((s, a) => s + a.balance, 0),
    [app.accounts],
  );
  const totalCCDebt = useMemo(
    () =>
      app.accounts
        .filter((a) => a.type === "CREDIT_CARD")
        .reduce((s, a) => s + a.balance, 0),
    [app.accounts],
  );
  const netWorth = useMemo(() => {
    const accountTotal = app.accounts.reduce((s, a) => s + a.balance, 0);
    const investmentTotal = app.investments.reduce(
      (s, i) => s + i.currentValue,
      0,
    );
    return accountTotal + investmentTotal;
  }, [app.accounts, app.investments]);

  const typeLabels: Record<string, string> = {
    BANK: "Bank Accounts",
    CREDIT_CARD: "Credit Cards",
    CASH_WALLET: "Cash Wallets",
    INVESTMENT: "Investment Accounts",
  };

  const typeOrder = ["BANK", "CREDIT_CARD", "CASH_WALLET", "INVESTMENT"];

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

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 16,
          paddingBottom: 8,
        }}
      >
        <Text style={{ color: c.text, fontSize: 22, fontWeight: "800" }}>
          Accounts & Wallets
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
          <Feather name="plus" size={16} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
            Add
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
          paddingHorizontal: 16,
          paddingBottom: 16,
        }}
      >
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
            Liquid Cash
          </Text>
          <Text
            style={{
              color: c.income,
              fontSize: 16,
              fontWeight: "700",
              marginTop: 4,
            }}
          >
            ₹{totalLiquid.toLocaleString("en-IN")}
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
            CC Balance
          </Text>
          <Text
            style={{
              color: totalCCDebt < 0 ? c.expense : c.text,
              fontSize: 16,
              fontWeight: "700",
              marginTop: 4,
            }}
          >
            ₹{Math.abs(totalCCDebt).toLocaleString("en-IN")}
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
            Net Worth
          </Text>
          <Text
            style={{
              color: c.primary,
              fontSize: 16,
              fontWeight: "700",
              marginTop: 4,
            }}
          >
            ₹{netWorth.toLocaleString("en-IN")}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
      >
        {typeOrder
          .filter((t) => grouped[t]?.length > 0)
          .map((type) => (
            <View key={type} style={{ marginBottom: 8 }}>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 11,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 10,
                }}
              >
                {typeLabels[type] ?? type}
              </Text>
              {grouped[type].map((acc) => (
                <AccountCard
                  key={acc.id}
                  acc={acc}
                  onPress={() => app.openAccountModal(acc)}
                />
              ))}
            </View>
          ))}

        {app.accounts.length === 0 && (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Feather name="pocket" size={48} color={c.mutedForeground} />
            <Text
              style={{
                color: c.mutedForeground,
                fontSize: 16,
                marginTop: 16,
                textAlign: "center",
              }}
            >
              No accounts yet{"\n"}Tap + Add to create one
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
