import React, { useState, useEffect } from "react";
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, KeyboardAvoidingView, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp, Account, Budget, Commitment, Investment, Goal, MonthEndTask, AccountType, TxType, InvestmentType, Frequency } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ModalShell({ visible, title, onClose, onSave, children }: {
  visible: boolean; title: string; onClose: () => void; onSave: () => void; children: React.ReactNode;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <View style={[styles.sheet, { backgroundColor: c.card, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={22} color={c.mutedForeground} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: c.foreground }]}>{title}</Text>
              <TouchableOpacity onPress={onSave}>
                <Text style={[styles.saveBtn, { color: c.primary }]}>Save</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: c.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );
}

function StyledInput({ value, onChangeText, placeholder, keyboardType, ...rest }: any) {
  const c = useColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.mutedForeground}
      keyboardType={keyboardType}
      style={[styles.input, { backgroundColor: c.secondary, color: c.foreground, borderColor: c.border }]}
      {...rest}
    />
  );
}

function ChipRow({ options, value, onChange, colors: c }: { options: string[]; value: string; onChange: (v: string) => void; colors: any }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
      <View style={{ flexDirection: "row", gap: 8, paddingVertical: 4 }}>
        {options.map((o) => (
          <TouchableOpacity
            key={o}
            onPress={() => onChange(o)}
            style={[styles.chip, { backgroundColor: value === o ? c.primary : c.secondary, borderColor: value === o ? c.primary : c.border }]}
          >
            <Text style={{ color: value === o ? c.primaryForeground : c.foreground, fontSize: 12, fontWeight: "600" }}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const ACCOUNT_COLORS = ["#10B981", "#0EA5E9", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6", "#F97316"];
const BUDGET_COLORS = ["#10B981", "#0EA5E9", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6", "#F97316"];

export default function GlobalModals() {
  const app = useApp();
  const c = useColors();

  return (
    <>
      <TransactionModal />
      <AccountModal />
      <BudgetModal />
      <CommitmentModal />
      <InvestmentModal />
      <GoalModal />
      <TaskModal />
    </>
  );
}

function TransactionModal() {
  const app = useApp();
  const c = useColors();
  const { modals, closeTxModal, addTransaction, updateTransaction, accounts, selectedMonth } = app;
  const editing = modals.editingTx;

  const [type, setType] = useState<TxType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setSourceId(editing.sourceId);
      setDestId(editing.destId ?? "");
      setCategory(editing.category);
      setNote(editing.note ?? "");
      setDate(editing.date);
    } else {
      setType("EXPENSE");
      setAmount("");
      setSourceId(accounts[0]?.id ?? "");
      setDestId("");
      setCategory("");
      setNote("");
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [modals.txModal, editing]);

  const save = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return Alert.alert("Error", "Enter a valid amount");
    if (!sourceId) return Alert.alert("Error", "Select an account");
    if (type === "TRANSFER" && !destId) return Alert.alert("Error", "Select destination account");
    const data = { type, amount: amt, sourceId, destId: type === "TRANSFER" ? destId : undefined, category: category || type, note, date };
    if (editing) updateTransaction({ ...editing, ...data });
    else addTransaction(data);
    closeTxModal();
  };

  const nonInv = accounts.filter((a) => a.type !== "INVESTMENT");

  return (
    <ModalShell visible={modals.txModal} title={editing ? "Edit Transaction" : "Add Transaction"} onClose={closeTxModal} onSave={save}>
      <Field label="Type">
        <ChipRow options={["EXPENSE", "INCOME", "TRANSFER"]} value={type} onChange={(v) => setType(v as TxType)} colors={c} />
      </Field>
      <Field label="Amount (₹)">
        <StyledInput value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" />
      </Field>
      <Field label={type === "TRANSFER" ? "From Account" : "Account"}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {nonInv.map((a) => (
              <TouchableOpacity key={a.id} onPress={() => setSourceId(a.id)}
                style={[styles.chip, { backgroundColor: sourceId === a.id ? c.primary : c.secondary, borderColor: sourceId === a.id ? c.primary : c.border }]}>
                <Text style={{ color: sourceId === a.id ? c.primaryForeground : c.foreground, fontSize: 12 }}>{a.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Field>
      {type === "TRANSFER" && (
        <Field label="To Account">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {accounts.filter((a) => a.id !== sourceId).map((a) => (
                <TouchableOpacity key={a.id} onPress={() => setDestId(a.id)}
                  style={[styles.chip, { backgroundColor: destId === a.id ? c.accent : c.secondary, borderColor: destId === a.id ? c.accent : c.border }]}>
                  <Text style={{ color: destId === a.id ? c.accentForeground : c.foreground, fontSize: 12 }}>{a.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Field>
      )}
      <Field label="Category">
        <StyledInput value={category} onChangeText={setCategory} placeholder="e.g. Groceries, Rent..." />
      </Field>
      <Field label="Note (optional)">
        <StyledInput value={note} onChangeText={setNote} placeholder="Add a note..." />
      </Field>
      <Field label="Date">
        <StyledInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
      </Field>
    </ModalShell>
  );
}

function AccountModal() {
  const app = useApp();
  const c = useColors();
  const { modals, closeAccountModal, addAccount, updateAccount } = app;
  const editing = modals.editingAccount;

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("BANK");
  const [balance, setBalance] = useState("");
  const [bankLimit, setBankLimit] = useState("");
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setType(editing.type);
      setBalance(String(editing.balance));
      setBankLimit(String(editing.bankLimit ?? ""));
      setColor(editing.color);
    } else {
      setName(""); setType("BANK"); setBalance(""); setBankLimit(""); setColor(ACCOUNT_COLORS[0]);
    }
  }, [modals.accountModal, editing]);

  const save = () => {
    if (!name.trim()) return Alert.alert("Error", "Enter account name");
    const bal = parseFloat(balance) || 0;
    const lim = parseFloat(bankLimit) || 0;
    const data = { name: name.trim(), type, balance: bal, bankLimit: type === "CREDIT_CARD" ? lim : undefined, selfLimit: undefined, icon: "credit-card", color };
    if (editing) updateAccount({ ...editing, ...data });
    else addAccount(data);
    closeAccountModal();
  };

  return (
    <ModalShell visible={modals.accountModal} title={editing ? "Edit Account" : "Add Account"} onClose={closeAccountModal} onSave={save}>
      <Field label="Name">
        <StyledInput value={name} onChangeText={setName} placeholder="e.g. HDFC Savings..." />
      </Field>
      <Field label="Type">
        <ChipRow options={["BANK", "CREDIT_CARD", "CASH_WALLET", "INVESTMENT"]} value={type} onChange={(v) => setType(v as AccountType)} colors={c} />
      </Field>
      <Field label={type === "CREDIT_CARD" ? "Current Balance (negative for debt)" : "Opening Balance (₹)"}>
        <StyledInput value={balance} onChangeText={setBalance} placeholder="0" keyboardType="numeric" />
      </Field>
      {type === "CREDIT_CARD" && (
        <Field label="Credit Limit (₹)">
          <StyledInput value={bankLimit} onChangeText={setBankLimit} placeholder="0" keyboardType="numeric" />
        </Field>
      )}
      <Field label="Color">
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {ACCOUNT_COLORS.map((col) => (
            <TouchableOpacity key={col} onPress={() => setColor(col)}
              style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: col, borderWidth: color === col ? 3 : 0, borderColor: c.foreground }} />
          ))}
        </View>
      </Field>
    </ModalShell>
  );
}

function BudgetModal() {
  const app = useApp();
  const c = useColors();
  const { modals, closeBudgetModal, addBudget, updateBudget, selectedMonth } = app;
  const editing = modals.editingBudget;

  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [color, setColor] = useState(BUDGET_COLORS[0]);

  useEffect(() => {
    if (editing) { setCategory(editing.category); setLimit(String(editing.limit)); setColor(editing.color); }
    else { setCategory(""); setLimit(""); setColor(BUDGET_COLORS[0]); }
  }, [modals.budgetModal, editing]);

  const save = () => {
    if (!category.trim()) return Alert.alert("Error", "Enter category name");
    const lim = parseFloat(limit);
    if (!lim || lim <= 0) return Alert.alert("Error", "Enter a valid limit");
    const data = { category: category.trim(), month: editing?.month ?? selectedMonth, limit: lim, color, icon: "tag" };
    if (editing) updateBudget({ ...editing, ...data });
    else addBudget(data);
    closeBudgetModal();
  };

  return (
    <ModalShell visible={modals.budgetModal} title={editing ? "Edit Budget" : "Add Budget"} onClose={closeBudgetModal} onSave={save}>
      <Field label="Category Name">
        <StyledInput value={category} onChangeText={setCategory} placeholder="e.g. Groceries, Rent..." />
      </Field>
      <Field label="Monthly Limit (₹)">
        <StyledInput value={limit} onChangeText={setLimit} placeholder="0" keyboardType="numeric" />
      </Field>
      <Field label="Color">
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {BUDGET_COLORS.map((col) => (
            <TouchableOpacity key={col} onPress={() => setColor(col)}
              style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: col, borderWidth: color === col ? 3 : 0, borderColor: c.foreground }} />
          ))}
        </View>
      </Field>
    </ModalShell>
  );
}

function CommitmentModal() {
  const app = useApp();
  const c = useColors();
  const { modals, closeCommitmentModal, addCommitment, updateCommitment, accounts, selectedMonth } = app;
  const editing = modals.editingCommitment;

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [dueDay, setDueDay] = useState("1");

  useEffect(() => {
    if (editing) { setName(editing.name); setAmount(String(editing.amount)); setSourceId(editing.sourceId); setDueDay(String(editing.dueDay)); }
    else { setName(""); setAmount(""); setSourceId(accounts[0]?.id ?? ""); setDueDay("1"); }
  }, [modals.commitmentModal, editing]);

  const save = () => {
    if (!name.trim()) return Alert.alert("Error", "Enter commitment name");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return Alert.alert("Error", "Enter a valid amount");
    const data = { name: name.trim(), amount: amt, sourceId, dueDay: parseInt(dueDay) || 1, isPaid: false, isSkipped: false, month: editing?.month ?? selectedMonth };
    if (editing) updateCommitment({ ...editing, ...data });
    else addCommitment(data);
    closeCommitmentModal();
  };

  return (
    <ModalShell visible={modals.commitmentModal} title={editing ? "Edit Commitment" : "Add Commitment"} onClose={closeCommitmentModal} onSave={save}>
      <Field label="Name">
        <StyledInput value={name} onChangeText={setName} placeholder="e.g. Netflix, Rent, SIP..." />
      </Field>
      <Field label="Amount (₹)">
        <StyledInput value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" />
      </Field>
      <Field label="Due Day of Month">
        <StyledInput value={dueDay} onChangeText={setDueDay} placeholder="1-31" keyboardType="numeric" />
      </Field>
      <Field label="Debit From Account">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {accounts.map((a) => (
              <TouchableOpacity key={a.id} onPress={() => setSourceId(a.id)}
                style={[styles.chip, { backgroundColor: sourceId === a.id ? c.primary : c.secondary, borderColor: sourceId === a.id ? c.primary : c.border }]}>
                <Text style={{ color: sourceId === a.id ? c.primaryForeground : c.foreground, fontSize: 12 }}>{a.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Field>
    </ModalShell>
  );
}

function InvestmentModal() {
  const app = useApp();
  const c = useColors();
  const { modals, closeInvestmentModal, addInvestment, updateInvestment } = app;
  const editing = modals.editingInvestment;

  const [name, setName] = useState("");
  const [type, setType] = useState<InvestmentType>("MUTUAL_FUND");
  const [monthlyContrib, setMonthlyContrib] = useState("");
  const [totalInvested, setTotalInvested] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("MONTHLY");
  const [treatAsExpense, setTreatAsExpense] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name); setType(editing.type); setMonthlyContrib(String(editing.monthlyContribution));
      setTotalInvested(String(editing.totalInvested)); setCurrentValue(String(editing.currentValue));
      setFrequency(editing.frequency); setTreatAsExpense(editing.treatAsExpense);
    } else {
      setName(""); setType("MUTUAL_FUND"); setMonthlyContrib(""); setTotalInvested("");
      setCurrentValue(""); setFrequency("MONTHLY"); setTreatAsExpense(false);
    }
  }, [modals.investmentModal, editing]);

  const save = () => {
    if (!name.trim()) return Alert.alert("Error", "Enter investment name");
    const data = {
      name: name.trim(), type, monthlyContribution: parseFloat(monthlyContrib) || 0,
      totalInvested: parseFloat(totalInvested) || 0, currentValue: parseFloat(currentValue) || 0,
      frequency, treatAsExpense, autoSchedule: false, skippedCount: 0, startDate: new Date().toISOString().split("T")[0],
    };
    if (editing) updateInvestment({ ...editing, ...data });
    else addInvestment(data);
    closeInvestmentModal();
  };

  return (
    <ModalShell visible={modals.investmentModal} title={editing ? "Edit Investment" : "Add Investment"} onClose={closeInvestmentModal} onSave={save}>
      <Field label="Name">
        <StyledInput value={name} onChangeText={setName} placeholder="e.g. Mirae ELSS, PPF..." />
      </Field>
      <Field label="Type">
        <ChipRow options={["MUTUAL_FUND", "PPF", "LIC", "FD", "STOCK", "OTHER"]} value={type} onChange={(v) => setType(v as InvestmentType)} colors={c} />
      </Field>
      <Field label="Monthly Contribution (₹)">
        <StyledInput value={monthlyContrib} onChangeText={setMonthlyContrib} placeholder="0" keyboardType="numeric" />
      </Field>
      <Field label="Total Invested (₹)">
        <StyledInput value={totalInvested} onChangeText={setTotalInvested} placeholder="0" keyboardType="numeric" />
      </Field>
      <Field label="Current Value (₹)">
        <StyledInput value={currentValue} onChangeText={setCurrentValue} placeholder="0" keyboardType="numeric" />
      </Field>
      <Field label="Frequency">
        <ChipRow options={["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"]} value={frequency} onChange={(v) => setFrequency(v as Frequency)} colors={c} />
      </Field>
    </ModalShell>
  );
}

function GoalModal() {
  const app = useApp();
  const c = useColors();
  const { modals, closeGoalModal, addGoal, updateGoal, accounts } = app;
  const editing = modals.editingGoal;

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [accountId, setAccountId] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (editing) { setName(editing.name); setTarget(String(editing.target)); setCurrent(String(editing.current)); setAccountId(editing.accountId); setDeadline(editing.deadline ?? ""); }
    else { setName(""); setTarget(""); setCurrent(""); setAccountId(accounts[0]?.id ?? ""); setDeadline(""); }
  }, [modals.goalModal, editing]);

  const save = () => {
    if (!name.trim()) return Alert.alert("Error", "Enter goal name");
    const tgt = parseFloat(target);
    if (!tgt || tgt <= 0) return Alert.alert("Error", "Enter a valid target amount");
    const data = { name: name.trim(), target: tgt, current: parseFloat(current) || 0, accountId, deadline: deadline || undefined };
    if (editing) updateGoal({ ...editing, ...data });
    else addGoal(data);
    closeGoalModal();
  };

  return (
    <ModalShell visible={modals.goalModal} title={editing ? "Edit Goal" : "Add Goal"} onClose={closeGoalModal} onSave={save}>
      <Field label="Goal Name">
        <StyledInput value={name} onChangeText={setName} placeholder="e.g. Emergency Fund, New Car..." />
      </Field>
      <Field label="Target Amount (₹)">
        <StyledInput value={target} onChangeText={setTarget} placeholder="0" keyboardType="numeric" />
      </Field>
      <Field label="Current Amount (₹)">
        <StyledInput value={current} onChangeText={setCurrent} placeholder="0" keyboardType="numeric" />
      </Field>
      <Field label="Linked Account">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {accounts.map((a) => (
              <TouchableOpacity key={a.id} onPress={() => setAccountId(a.id)}
                style={[styles.chip, { backgroundColor: accountId === a.id ? c.primary : c.secondary, borderColor: accountId === a.id ? c.primary : c.border }]}>
                <Text style={{ color: accountId === a.id ? c.primaryForeground : c.foreground, fontSize: 12 }}>{a.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Field>
      <Field label="Deadline (YYYY-MM-DD, optional)">
        <StyledInput value={deadline} onChangeText={setDeadline} placeholder="2026-12-31" />
      </Field>
    </ModalShell>
  );
}

function TaskModal() {
  const app = useApp();
  const c = useColors();
  const { modals, closeTaskModal, addTask, updateTask, selectedMonth } = app;
  const editing = modals.editingTask;
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (editing) setTitle(editing.title);
    else setTitle("");
  }, [modals.taskModal, editing]);

  const save = () => {
    if (!title.trim()) return Alert.alert("Error", "Enter task title");
    if (editing) updateTask({ ...editing, title: title.trim() });
    else addTask({ title: title.trim(), isDone: false, month: selectedMonth });
    closeTaskModal();
  };

  return (
    <ModalShell visible={modals.taskModal} title={editing ? "Edit Task" : "Add Task"} onClose={closeTaskModal} onSave={save}>
      <Field label="Task">
        <StyledInput value={title} onChangeText={setTitle} placeholder="e.g. Pay credit card bill..." />
      </Field>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, maxHeight: "85%", minHeight: 300 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0", alignSelf: "center", marginTop: 12, marginBottom: 8 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", marginBottom: 8 },
  sheetTitle: { fontSize: 16, fontWeight: "700" },
  saveBtn: { fontSize: 15, fontWeight: "700" },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
});
