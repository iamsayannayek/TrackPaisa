import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp, Account, AccountType } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { AmountText, fmt } from "@/components/ui/AmountText";
import { ProgressBar } from "@/components/ui/ProgressBar";

const TYPE_ORDER: AccountType[] = ["BANK", "CASH_WALLET", "CREDIT_CARD", "INVESTMENT"];
const TYPE_LABEL: Record<AccountType, string> = {
  BANK: "Bank Accounts",
  CREDIT_CARD: "Credit Cards",
  CASH_WALLET: "Cash & Wallets",
  INVESTMENT: "Investment Accounts",
};

function AccountCard({ acc, onEdit, onDelete }: { acc: Account; onEdit: () => void; onDelete: () => void }) {
  const c = useColors();
  const isCreditCard = acc.type === "CREDIT_CARD";
  const limit = acc.bankLimit || acc.selfLimit || 0;
  const used = isCreditCard ? Math.abs(acc.balance) : 0;
  const usedPct = limit > 0 ? Math.min(used / limit, 1) : 0;
  const barColor = usedPct > 0.8 ? c.expense : usedPct > 0.5 ? c.warning : c.income;

  return (
    <View style={[styles.accountCard, { backgroundColor: c.card }]}>
      <View style={[styles.accentBar, { backgroundColor: acc.color }]} />
      <View style={{ flex: 1 }}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.foreground, fontSize: 15, fontWeight: "700" }} numberOfLines={1}>{acc.name}</Text>
            <Text style={{ color: c.mutedForeground, fontSize: 11, marginTop: 2 }}>{TYPE_LABEL[acc.type]}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <AmountText amount={acc.balance} style={{ fontSize: 16, fontWeight: "800" }} colored incomeColor={c.foreground} expenseColor={c.expense} />
          </View>
        </View>
        {isCreditCard && limit > 0 && (
          <View style={{ marginTop: 10, gap: 4 }}>
            <ProgressBar progress={usedPct} color={barColor} backgroundColor={c.muted} height={5} />
            <View style={styles.rowBetween}>
              <Text style={{ color: c.mutedForeground, fontSize: 10 }}>Used {fmt(used)}</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 10 }}>Limit {fmt(limit)}</Text>
            </View>
          </View>
        )}
      </View>
      <View style={{ gap: 6, marginLeft: 8 }}>
        <TouchableOpacity onPress={onEdit} style={[styles.iconBtn, { backgroundColor: c.secondary }]}>
          <Feather name="edit-2" size={13} color={c.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={[styles.iconBtn, { backgroundColor: c.destructive + "15" }]}>
          <Feather name="trash-2" size={13} color={c.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AccountsScreen() {
  const app = useApp();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  const grouped = useMemo(() => {
    const map: Partial<Record<AccountType, Account[]>> = {};
    for (const acc of app.accounts) {
      if (!map[acc.type]) map[acc.type] = [];
      map[acc.type]!.push(acc);
    }
    return map;
  }, [app.accounts]);

  const liquidCash = app.accounts.filter((a) => a.type === "BANK" || a.type === "CASH_WALLET").reduce((s, a) => s + a.balance, 0);
  const ccBalance = app.accounts.filter((a) => a.type === "CREDIT_CARD").reduce((s, a) => s + a.balance, 0);
  const netWorth = app.getNetWorth();

  const handleDelete = (id: string) => {
    Alert.alert("Delete Account", "This will permanently delete this account.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => app.deleteAccount(id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPadding + 60, paddingBottom: (isWeb ? 84 : insets.bottom + 80) + bottomPad, paddingHorizontal: 16, gap: 16 }}
      >
        {/* Summary */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: "Liquid Cash", value: liquidCash, color: c.income },
            { label: "CC Balance", value: ccBalance, color: ccBalance < 0 ? c.expense : c.foreground },
            { label: "Net Worth", value: netWorth, color: c.primary },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: c.card, flex: 1 }]}>
              <Text style={{ color: c.mutedForeground, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }} numberOfLines={1}>{s.label}</Text>
              <AmountText amount={s.value} style={{ color: s.color, fontSize: 13, fontWeight: "800", marginTop: 4 }} />
            </View>
          ))}
        </View>

        {/* Grouped Accounts */}
        {TYPE_ORDER.map((type) => {
          const accs = grouped[type];
          if (!accs || accs.length === 0) return null;
          return (
            <View key={type}>
              <Text style={{ color: c.mutedForeground, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                {TYPE_LABEL[type]}
              </Text>
              <View style={{ gap: 10 }}>
                {accs.map((acc) => (
                  <AccountCard
                    key={acc.id}
                    acc={acc}
                    onEdit={() => app.openAccountModal(acc)}
                    onDelete={() => handleDelete(acc.id)}
                  />
                ))}
              </View>
            </View>
          );
        })}

        {app.accounts.length === 0 && (
          <View style={{ paddingVertical: 48, alignItems: "center", gap: 12 }}>
            <Feather name="credit-card" size={36} color={c.mutedForeground} />
            <Text style={{ color: c.mutedForeground, fontSize: 15, fontWeight: "600" }}>No accounts yet</Text>
            <Text style={{ color: c.mutedForeground, fontSize: 13, textAlign: "center" }}>Add your bank accounts, credit cards, and wallets</Text>
          </View>
        )}
      </ScrollView>

      {/* Header */}
      <View style={[styles.header, { top: topPadding, backgroundColor: c.background }]}>
        <Text style={{ color: c.foreground, fontSize: 20, fontWeight: "800" }}>Accounts</Text>
        <TouchableOpacity onPress={() => app.openAccountModal()} style={[styles.addBtn, { backgroundColor: c.primary }]}>
          <Feather name="plus" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, height: 56 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  accountCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, gap: 12, overflow: "hidden" },
  accentBar: { width: 4, height: "100%", borderRadius: 2, position: "absolute", left: 0, top: 0, bottom: 0 },
  statCard: { borderRadius: 14, padding: 12 },
  iconBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  addBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
});
