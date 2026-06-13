import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { calculateNextDate } from "@/context/AppContext";
import { useAppColors } from "@/hooks/useAppColors";
import SelectPicker, { SelectOption } from "@/components/SelectPicker";
import DateInput from "@/components/DateInput";
import AmountInput from "@/components/AmountInput";
import ProfileSheet from "./ProfileSheet";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

// ---- Shared helpers ----

function AppModal({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <TouchableOpacity
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={{
            backgroundColor: c.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "90%",
            paddingBottom: insets.bottom,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
            }}
          >
            <Text style={{ color: c.text, fontSize: 17, fontWeight: "700" }}>
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                padding: 4,
                borderRadius: 20,
                backgroundColor: c.surfaceElevated,
              }}
            >
              <Feather name="x" size={18} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollViewCompat
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </KeyboardAwareScrollViewCompat>
        </View>
      </View>
    </Modal>
  );
}

function FieldLabel({ label }: { label: string }) {
  const c = useAppColors();
  return (
    <Text
      style={{
        color: c.textSecondary,
        fontSize: 11,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 6,
      }}
    >
      {label}
    </Text>
  );
}

function StyledInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?:
    | "default"
    | "numeric"
    | "decimal-pad"
    | "numbers-and-punctuation";
  multiline?: boolean;
}) {
  const c = useAppColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.mutedForeground}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      style={{
        backgroundColor: c.inputBg,
        borderWidth: 1,
        borderColor: c.inputBorder,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: c.text,
        fontSize: 14,
        textAlignVertical: multiline ? "top" : "center",
        minHeight: multiline ? 72 : undefined,
      }}
    />
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", gap: 12 }}>{children}</View>;
}

function Col({ children, flex }: { children: React.ReactNode; flex?: number }) {
  return <View style={{ flex: flex ?? 1 }}>{children}</View>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <FieldLabel label={label} />
      {children}
    </View>
  );
}

function SaveBtn({ onPress, label }: { onPress: () => void; label: string }) {
  const c = useAppColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: c.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        flex: 1,
      }}
      activeOpacity={0.85}
    >
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function DeleteBtn({ onPress }: { onPress: () => void }) {
  const c = useAppColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: c.destructive + "22",
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 18,
        alignItems: "center",
        borderWidth: 1,
        borderColor: c.destructive + "55",
      }}
      activeOpacity={0.85}
    >
      <Feather name="trash-2" size={18} color={c.destructive} />
    </TouchableOpacity>
  );
}

// ColorPicker and icon option constants (unchanged from original)
const COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#64748b",
  "#334155",
];

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {COLORS.map((col) => (
        <TouchableOpacity
          key={col}
          onPress={() => onChange(col)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: col,
            borderWidth: value === col ? 3 : 0,
            borderColor: "#fff",
          }}
        />
      ))}
    </View>
  );
}

const ACCOUNT_ICON_OPTIONS: SelectOption[] = [
  { value: "Landmark", label: "🏦 Bank" },
  { value: "CreditCard", label: "💳 Card" },
  { value: "Wallet", label: "👛 Wallet" },
  { value: "PiggyBank", label: "🐷 Piggy Bank" },
  { value: "Briefcase", label: "💼 Briefcase" },
  { value: "DollarSign", label: "💵 Dollar" },
];

const BUDGET_ICON_OPTIONS: SelectOption[] = [
  { value: "Wallet", label: "👛 Wallet" },
  { value: "Coffee", label: "☕ Food & Coffee" },
  { value: "Car", label: "🚗 Transport" },
  { value: "ShoppingCart", label: "🛒 Shopping" },
  { value: "Zap", label: "⚡ Bills" },
  { value: "Heart", label: "❤️ Family" },
  { value: "Activity", label: "🏃 Health" },
  { value: "Book", label: "📚 Education" },
  { value: "Music", label: "🎵 Entertainment" },
  { value: "Home", label: "🏠 Housing" },
  { value: "Gift", label: "🎁 Gifts" },
  { value: "Globe", label: "✈️ Travel" },
];

const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transport",
  "Shopping/Personal",
  "Bills & Utilities",
  "Family",
  "Rent / EMI",
  "Health",
  "Education",
  "Entertainment",
  "Travel",
  "Investment / Transfer",
  "Commitment",
  "Others",
];

// ---- Transaction Modal ----
export function TxModal() {
  const app = useApp();
  const c = useAppColors();
  const form = app.txForm;
  const set = app.setTxForm;

  const txTypes: ("INCOME" | "EXPENSE" | "TRANSFER")[] = [
    "INCOME",
    "EXPENSE",
    "TRANSFER",
  ];
  const accOptions: SelectOption[] = app.accounts.map((a) => ({
    value: a.id,
    label: a.name,
  }));
  const destOptions: SelectOption[] = [
    ...app.accounts.map((a) => ({
      value: a.id,
      label: a.name,
      group: "Accounts",
    })),
    ...app.investments.map((i) => ({
      value: i.id,
      label: i.name,
      group: "Investments",
    })),
  ];
  const dynamicCategories = Array.from(
    new Set([...app.budgets.map((b) => b.category), ...EXPENSE_CATEGORIES]),
  ).sort();

  const catOptions: SelectOption[] = dynamicCategories.map((cat) => ({
    value: cat,
    label: cat,
  }));
  return (
    <AppModal
      visible={app.isTxModalOpen}
      onClose={app.closeTxModal}
      title={app.editingTx ? "Edit Transaction" : "New Transaction"}
    >
      <View
        style={{
          flexDirection: "row",
          backgroundColor: c.surfaceElevated,
          borderRadius: 12,
          padding: 4,
          marginBottom: 16,
        }}
      >
        {txTypes.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => set((p) => ({ ...p, type: t }))}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 8,
              alignItems: "center",
              backgroundColor: form.type === t ? c.surface : "transparent",
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: form.type === t ? c.text : c.mutedForeground,
                fontWeight: form.type === t ? "600" : "400",
                fontSize: 13,
              }}
            >
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Field label="Amount">
        <AmountInput
          value={form.amount}
          onChangeAmount={(v) => set((p) => ({ ...p, amount: v }))}
          placeholder="0.00"
        />
      </Field>

      <Row>
        <Col>
          <Field label="From Account">
            <SelectPicker
              options={accOptions}
              value={form.sourceId ?? ""}
              onChange={(v) => set((p) => ({ ...p, sourceId: v }))}
              placeholder="Select account..."
            />
          </Field>
        </Col>
        <Col>
          {form.type === "TRANSFER" ? (
            <Field label="To Destination">
              <SelectPicker
                options={destOptions}
                value={form.destId ?? ""}
                onChange={(v) => set((p) => ({ ...p, destId: v }))}
                placeholder="Select..."
              />
            </Field>
          ) : (
            <Field label="Category">
              <SelectPicker
                options={catOptions}
                value={form.category ?? ""}
                onChange={(v) => set((p) => ({ ...p, category: v }))}
                placeholder="Select..."
              />
            </Field>
          )}
        </Col>
      </Row>

      <Field label="Date">
        <DateInput
          value={form.date ?? ""}
          onChange={(v) => set((p) => ({ ...p, date: v }))}
        />
      </Field>

      <Field label="Note / Merchant">
        <StyledInput
          value={form.note ?? ""}
          onChangeText={(v) => set((p) => ({ ...p, note: v }))}
          placeholder="What was this for?"
        />
      </Field>

      <Row>
        {app.editingTx && <DeleteBtn onPress={app.handleDeleteTx} />}
        <SaveBtn onPress={app.handleSaveTx} label="Save Transaction" />
      </Row>
    </AppModal>
  );
}

// ---- Account Modal ----
export function AccountModal() {
  const app = useApp();
  const c = useAppColors();
  const form = app.accForm;
  const set = app.setAccForm;

  const accTypes: SelectOption[] = [
    { value: "BANK", label: "Bank Account" },
    { value: "CASH_WALLET", label: "Physical Wallet" },
    { value: "CREDIT_CARD", label: "Credit Card" },
  ];

  return (
    <AppModal
      visible={app.isAccModalOpen}
      onClose={app.closeAccModal}
      title={app.editingAcc ? "Edit Account" : "Add Account"}
    >
      <Field label="Account Name">
        <StyledInput
          value={form.name ?? ""}
          onChangeText={(v) => set((p) => ({ ...p, name: v }))}
          placeholder="e.g. Secret Stash"
        />
      </Field>
      <Row>
        <Col>
          <Field label="Type">
            <SelectPicker
              options={accTypes}
              value={form.type ?? "BANK"}
              onChange={(v) => set((p) => ({ ...p, type: v as any }))}
              placeholder="Select type..."
            />
          </Field>
        </Col>
        <Col>
          <Field label="Balance (₹)">
            <AmountInput
              value={form.balance}
              onChangeAmount={(v) => set((p) => ({ ...p, balance: v }))}
              placeholder="0"
            />
          </Field>
        </Col>
      </Row>

      {form.type === "CREDIT_CARD" && (
        <Row>
          <Col>
            <Field label="Bank Limit (₹)">
              <AmountInput
                value={form.bankLimit}
                onChangeAmount={(v) => set((p) => ({ ...p, bankLimit: v }))}
                placeholder="0"
              />
            </Field>
          </Col>
          <Col>
            <Field label="Self Limit (₹)">
              <AmountInput
                value={form.selfLimit}
                onChangeAmount={(v) => set((p) => ({ ...p, selfLimit: v }))}
                placeholder="0"
              />
            </Field>
          </Col>
        </Row>
      )}

      <Field label="Purpose / Note">
        <StyledInput
          value={form.purpose ?? ""}
          onChangeText={(v) => set((p) => ({ ...p, purpose: v }))}
          placeholder="What is this money for?"
        />
      </Field>

      <Field label="Icon">
        <SelectPicker
          options={ACCOUNT_ICON_OPTIONS}
          value={form.icon ?? "Landmark"}
          onChange={(v) => set((p) => ({ ...p, icon: v }))}
          placeholder="Select icon..."
        />
      </Field>

      <Field label="Color">
        <ColorPicker
          value={form.color ?? "#1d4ed8"}
          onChange={(v) => set((p) => ({ ...p, color: v }))}
        />
      </Field>

      <Row>
        {app.editingAcc && <DeleteBtn onPress={app.handleDeleteAccount} />}
        <SaveBtn onPress={app.handleSaveAccount} label="Save Account" />
      </Row>
    </AppModal>
  );
}

// ---- Budget Modal ----
export function BudgetModal() {
  const app = useApp();
  const form = app.budgetForm;
  const set = app.setBudgetForm;

  return (
    <AppModal
      visible={app.isBudgetModalOpen}
      onClose={app.closeBudgetModal}
      title={app.editingBudget ? "Edit Budget" : "New Budget"}
    >
      <Field label="Category Name">
        <StyledInput
          value={form.category ?? ""}
          onChangeText={(v) => set((p) => ({ ...p, category: v }))}
          placeholder="e.g. Dining Out"
        />
      </Field>
      <Field label="Monthly Limit (₹)">
        <AmountInput
          value={form.limit}
          onChangeAmount={(v) => set((p) => ({ ...p, limit: v }))}
          placeholder="0"
        />
      </Field>
      <Field label="Icon">
        <SelectPicker
          options={BUDGET_ICON_OPTIONS}
          value={form.icon ?? "Wallet"}
          onChange={(v) => set((p) => ({ ...p, icon: v }))}
          placeholder="Select icon..."
        />
      </Field>
      <Field label="Color">
        <ColorPicker
          value={form.color ?? "#3b82f6"}
          onChange={(v) => set((p) => ({ ...p, color: v }))}
        />
      </Field>
      <Row>
        {app.editingBudget && <DeleteBtn onPress={app.handleDeleteBudget} />}
        <SaveBtn onPress={app.handleSaveBudget} label="Save Budget" />
      </Row>
    </AppModal>
  );
}

// ---- Commitment Modal ----
export function CommitmentModal() {
  const app = useApp();
  const form = app.commitmentForm;
  const set = app.setCommitmentForm;

  const accOptions: SelectOption[] = app.accounts.map((a) => ({
    value: a.id,
    label: a.name,
  }));
  const destOptions: SelectOption[] = [
    { value: "", label: "-- None (Treat as Expense) --" },
    ...app.accounts.map((a) => ({
      value: a.id,
      label: a.name,
      group: "Accounts",
    })),
    ...app.investments.map((i) => ({
      value: i.id,
      label: i.name,
      group: "Investments",
    })),
  ];
  const budgetOpts: SelectOption[] = [
    { value: "", label: "-- No link --" },
    ...app.budgets
      .filter((b) => b.month === app.currentMonth)
      .map((b) => ({ value: b.id, label: b.category })),
  ];

  return (
    <AppModal
      visible={app.isCommitmentModalOpen}
      onClose={app.closeCommitmentModal}
      title={app.editingCommitment ? "Edit Commitment" : "New Commitment"}
    >
      <Field label="Commitment Title">
        <StyledInput
          value={form.title ?? ""}
          onChangeText={(v) => set((p) => ({ ...p, title: v }))}
          placeholder="e.g. LIC Premium (QTR)"
        />
      </Field>
      <Row>
        <Col>
          <Field label="Amount (₹)">
            <AmountInput
              value={form.amount}
              onChangeAmount={(v) => set((p) => ({ ...p, amount: v }))}
              placeholder="0.00"
            />
          </Field>
        </Col>
        <Col>
          <Field label="Due Date">
            <DateInput
              value={form.date ?? ""}
              onChange={(v) => set((p) => ({ ...p, date: v }))}
            />
          </Field>
        </Col>
      </Row>
      <Field label="Source Account">
        <SelectPicker
          options={accOptions}
          value={form.sourceId ?? ""}
          onChange={(v) => set((p) => ({ ...p, sourceId: v }))}
          placeholder="Select source..."
        />
      </Field>
      <Field label="Destination (If Transfer/Investment)">
        <SelectPicker
          options={destOptions}
          value={form.destId ?? ""}
          onChange={(v) => set((p) => ({ ...p, destId: v }))}
          placeholder="None (Expense)"
        />
      </Field>
      <Field label="Link to Budget Category (Optional)">
        <SelectPicker
          options={budgetOpts}
          value={form.linkedBudgetId ?? ""}
          onChange={(v) => set((p) => ({ ...p, linkedBudgetId: v }))}
          placeholder="No link"
        />
      </Field>
      <Row>
        {app.editingCommitment && (
          <DeleteBtn onPress={app.handleDeleteCommitment} />
        )}
        <SaveBtn onPress={app.handleSaveCommitment} label="Save Commitment" />
      </Row>
    </AppModal>
  );
}

// ---- Goal Modal ----
export function GoalModal() {
  const app = useApp();
  const form = app.goalForm;
  const set = app.setGoalForm;
  const accOptions: SelectOption[] = app.accounts.map((a) => ({
    value: a.id,
    label: a.name,
  }));

  return (
    <AppModal
      visible={app.isGoalModalOpen}
      onClose={app.closeGoalModal}
      title={app.editingGoal ? "Edit Goal" : "New Goal"}
    >
      <Field label="Goal Name">
        <StyledInput
          value={form.name ?? ""}
          onChangeText={(v) => set((p) => ({ ...p, name: v }))}
          placeholder="e.g. Vacation Fund"
        />
      </Field>
      <Row>
        <Col>
          <Field label="Target Amount (₹)">
            <AmountInput
              value={form.target}
              onChangeAmount={(v) => set((p) => ({ ...p, target: v }))}
              placeholder="0"
            />
          </Field>
        </Col>
        <Col>
          <Field label="Current Saved (₹)">
            <AmountInput
              value={form.current}
              onChangeAmount={(v) => set((p) => ({ ...p, current: v }))}
              placeholder="0"
            />
          </Field>
        </Col>
      </Row>
      <Field label="Target Date">
        <DateInput
          value={form.deadline ?? ""}
          onChange={(v) => set((p) => ({ ...p, deadline: v }))}
        />
      </Field>
      <Field label="Linked Account">
        <SelectPicker
          options={accOptions}
          value={form.accountId ?? ""}
          onChange={(v) => set((p) => ({ ...p, accountId: v }))}
          placeholder="Select account..."
        />
      </Field>
      <Row>
        {app.editingGoal && <DeleteBtn onPress={app.handleDeleteGoal} />}
        <SaveBtn onPress={app.handleSaveGoal} label="Save Goal" />
      </Row>
    </AppModal>
  );
}

// ---- Investment Modal ----
export function InvestmentModal() {
  const app = useApp();
  const c = useAppColors();
  const form = app.invForm;
  const set = app.setInvForm;

  const invTypes: SelectOption[] = [
    { value: "MF", label: "Mutual Fund" },
    { value: "PPF", label: "PPF" },
    { value: "LIC", label: "LIC / Insurance" },
    { value: "FD", label: "Fixed Deposit" },
    { value: "RD", label: "Recurring Deposit" },
    { value: "STOCK", label: "Stocks" },
    { value: "Others", label: "Others" },
  ];
  const freqOptions: SelectOption[] = [
    { value: "Daily", label: "Daily" },
    { value: "Weekly", label: "Weekly" },
    { value: "Monthly", label: "Monthly" },
    { value: "Quarterly", label: "Quarterly" },
    { value: "Half-Yearly", label: "Half-Yearly" },
    { value: "Yearly", label: "Yearly" },
  ];

  const isMaturity = ["FD", "RD", "Others"].includes(form.type ?? "");
  const showTenureUI = ["LIC", "RD"].includes(form.type ?? "");

  const freqMultiplier =
    form.frequency === "Monthly"
      ? 12
      : form.frequency === "Quarterly"
        ? 4
        : form.frequency === "Half-Yearly"
          ? 2
          : 1;
  const periodLabel =
    form.frequency === "Monthly"
      ? "Months"
      : form.frequency === "Quarterly"
        ? "Quarters"
        : form.frequency === "Half-Yearly"
          ? "Half-Years"
          : "Years";
  const totalPeriods = showTenureUI
    ? (form.tenureYears || 0) * freqMultiplier
    : 0;
  const remainingPeriods = showTenureUI
    ? Math.max(totalPeriods - (form.paidCount || 0), 0)
    : 0;

  return (
    <AppModal
      visible={app.isInvModalOpen}
      onClose={app.closeInvModal}
      title={app.editingInv ? "Edit Investment/Plan" : "New Investment/Plan"}
    >
      <Field label="Plan Name">
        <StyledInput
          value={form.name ?? ""}
          onChangeText={(v) => set((p) => ({ ...p, name: v }))}
          placeholder="e.g. LIC Jeevan Umang"
        />
      </Field>

      <Row>
        <Col>
          <Field label="Type">
            <SelectPicker
              options={invTypes}
              value={form.type ?? "MF"}
              onChange={(v) => set((p) => ({ ...p, type: v }))}
              placeholder="Select type..."
            />
          </Field>
        </Col>
        <Col>
          <Field label="Frequency">
            <SelectPicker
              options={freqOptions}
              value={form.frequency ?? "Monthly"}
              onChange={(v) => {
                // Auto-calc next payment date when frequency changes
                const newNext = form.lastPaymentDate
                  ? calculateNextDate(form.lastPaymentDate, v)
                  : form.nextPaymentDate;
                set((p) => ({
                  ...p,
                  frequency: v,
                  nextPaymentDate: newNext || p.nextPaymentDate,
                }));
              }}
              placeholder="Select..."
            />
          </Field>
        </Col>
      </Row>

      <Row>
        <Col>
          <Field label="Contribution (₹)">
            <AmountInput
              value={form.monthlyContribution}
              onChangeAmount={(v) =>
                set((p) => ({ ...p, monthlyContribution: v }))
              }
              placeholder="0"
            />
          </Field>
        </Col>
        <Col>
          <Field label="Total Invested (₹)">
            <AmountInput
              value={form.totalInvested}
              onChangeAmount={(v) => set((p) => ({ ...p, totalInvested: v }))}
              placeholder="0"
            />
          </Field>
        </Col>
      </Row>

      <Field label="Current Value (₹)">
        <AmountInput
          value={form.currentValue}
          onChangeAmount={(v) => set((p) => ({ ...p, currentValue: v }))}
          placeholder="0"
        />
      </Field>

      {isMaturity && (
        <Row>
          <Col>
            <Field label="Interest Rate (%)">
              <AmountInput
                value={form.interestRate}
                onChangeAmount={(v) => set((p) => ({ ...p, interestRate: v }))}
                placeholder="7.5"
              />
            </Field>
          </Col>
          <Col>
            <Field label="Duration (Days)">
              <AmountInput
                value={form.durationDays}
                onChangeAmount={(v) => set((p) => ({ ...p, durationDays: v }))}
                placeholder="365"
                allowDecimals={false}
              />
            </Field>
          </Col>
        </Row>
      )}

      {showTenureUI && (
        <>
          <Row>
            <Col>
              <Field label="Tenure (Years)">
                <AmountInput
                  value={form.tenureYears}
                  onChangeAmount={(v) => set((p) => ({ ...p, tenureYears: v }))}
                  placeholder="e.g. 15"
                  allowDecimals={false}
                />
              </Field>
            </Col>
            <Col>
              <Field label={`Paid (${periodLabel})`}>
                <AmountInput
                  value={form.paidCount}
                  onChangeAmount={(v) => set((p) => ({ ...p, paidCount: v }))}
                  placeholder="e.g. 1"
                  allowDecimals={false}
                />
              </Field>
            </Col>
          </Row>

          {totalPeriods > 0 && (
            <View
              style={{
                backgroundColor: c.surfaceElevated,
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                Total Plan Duration: {totalPeriods} {periodLabel}
              </Text>
              <Text
                style={{
                  color: c.primary,
                  fontSize: 13,
                  fontWeight: "700",
                  marginTop: 4,
                }}
              >
                Remaining to Pay: {remainingPeriods} {periodLabel}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Last Paid Date + Next Due Date (single row, no duplicates) */}
      <Row>
        <Col>
          <Field label="Last Paid Date">
            <DateInput
              value={form.lastPaymentDate || ""}
              onChange={(v) => {
                // Auto-calc next payment when last paid date is entered
                const newNext = form.frequency
                  ? calculateNextDate(v, form.frequency)
                  : form.nextPaymentDate;
                set((p) => ({
                  ...p,
                  lastPaymentDate: v,
                  nextPaymentDate:
                    newNext && newNext.length === 10
                      ? newNext
                      : p.nextPaymentDate,
                }));
              }}
            />
          </Field>
        </Col>
        <Col>
          <Field label="Next Due Date">
            <DateInput
              value={form.nextPaymentDate || ""}
              onChange={(v) => set((p) => ({ ...p, nextPaymentDate: v }))}
            />
          </Field>
        </Col>
      </Row>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 12,
        }}
      >
        <Text
          style={{ color: c.text, fontSize: 14, fontWeight: "500", flex: 1 }}
        >
          Auto-Schedule Upcoming Payments
        </Text>
        <Switch
          value={!!form.autoSchedule}
          onValueChange={(v) => set((p) => ({ ...p, autoSchedule: v }))}
          thumbColor="#fff"
          trackColor={{ false: c.border, true: c.primary }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: c.border,
          marginTop: 4,
        }}
      >
        <Text
          style={{ color: c.text, fontSize: 14, fontWeight: "500", flex: 1 }}
        >
          Treat as Expense in Budgets
        </Text>
        <Switch
          value={!!form.treatAsExpense}
          onValueChange={(v) => set((p) => ({ ...p, treatAsExpense: v }))}
          thumbColor="#fff"
          trackColor={{ false: c.border, true: c.primary }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 12,
          marginBottom: 16,
        }}
      >
        <Text
          style={{ color: c.text, fontSize: 14, fontWeight: "500", flex: 1 }}
        >
          Track Performance (Show Returns %)
        </Text>
        <Switch
          value={!!form.showReturns}
          onValueChange={(v) => set((p) => ({ ...p, showReturns: v }))}
          thumbColor="#fff"
          trackColor={{ false: c.border, true: c.primary }}
        />
      </View>

      <Row>
        {app.editingInv && <DeleteBtn onPress={app.handleDeleteInvestment} />}
        <SaveBtn onPress={app.handleSaveInvestment} label="Save Investment" />
      </Row>
    </AppModal>
  );
}

// ---- Task Modal ----
export function TaskModal() {
  const app = useApp();
  const form = app.taskForm;
  const set = app.setTaskForm;

  return (
    <AppModal
      visible={app.isTaskModalOpen}
      onClose={app.closeTaskModal}
      title={app.editingTask ? "Edit Task" : "New Task"}
    >
      <Field label="Task Description">
        <StyledInput
          value={form.text ?? ""}
          onChangeText={(v) => set((p) => ({ ...p, text: v }))}
          placeholder="e.g. Move remaining balance to SBI"
          multiline
        />
      </Field>
      <Row>
        {app.editingTask && <DeleteBtn onPress={app.handleDeleteTask} />}
        <SaveBtn onPress={app.handleSaveTask} label="Save Task" />
      </Row>
    </AppModal>
  );
}

// ---- All Modals Combined ----
export default function GlobalModals() {
  return (
    <>
      <TxModal />
      <AccountModal />
      <BudgetModal />
      <CommitmentModal />
      <GoalModal />
      <InvestmentModal />
      <TaskModal />
      <ProfileSheet />
    </>
  );
}
