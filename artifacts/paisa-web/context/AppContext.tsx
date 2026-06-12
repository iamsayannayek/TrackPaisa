import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type AccountType = "BANK" | "CREDIT_CARD" | "CASH_WALLET" | "INVESTMENT";
export type TxType = "INCOME" | "EXPENSE" | "TRANSFER";
export type InvestmentType = "MUTUAL_FUND" | "PPF" | "LIC" | "FD" | "STOCK" | "OTHER";
export type Frequency = "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONE_TIME";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  bankLimit?: number;
  selfLimit?: number;
  icon: string;
  color: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  sourceId: string;
  destId?: string;
  category: string;
  note?: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  month: string;
  limit: number;
  color: string;
  icon: string;
  createdAt: string;
}

export interface Commitment {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  sourceId: string;
  destId?: string;
  linkedBudgetId?: string;
  linkedInvestmentId?: string;
  isPaid: boolean;
  isSkipped: boolean;
  month: string;
  createdAt: string;
}

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  monthlyContribution: number;
  frequency: Frequency;
  totalInvested: number;
  currentValue: number;
  treatAsExpense: boolean;
  autoSchedule: boolean;
  nextPaymentDate?: string;
  skippedCount: number;
  linkedAccountId?: string;
  startDate: string;
  maturityDate?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string;
  accountId: string;
  createdAt: string;
}

export interface MonthEndTask {
  id: string;
  title: string;
  isDone: boolean;
  month: string;
  createdAt: string;
}

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

interface ModalState {
  txModal: boolean;
  accountModal: boolean;
  budgetModal: boolean;
  commitmentModal: boolean;
  investmentModal: boolean;
  goalModal: boolean;
  taskModal: boolean;
  editingTx: Transaction | null;
  editingAccount: Account | null;
  editingBudget: Budget | null;
  editingCommitment: Commitment | null;
  editingInvestment: Investment | null;
  editingGoal: Goal | null;
  editingTask: MonthEndTask | null;
}

interface AppContextValue {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  commitments: Commitment[];
  investments: Investment[];
  goals: Goal[];
  tasks: MonthEndTask[];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  modals: ModalState;
  openTxModal: (tx?: Transaction) => void;
  closeTxModal: () => void;
  openAccountModal: (acc?: Account) => void;
  closeAccountModal: () => void;
  openBudgetModal: (b?: Budget) => void;
  closeBudgetModal: () => void;
  openCommitmentModal: (c?: Commitment) => void;
  closeCommitmentModal: () => void;
  openInvestmentModal: (inv?: Investment) => void;
  closeInvestmentModal: () => void;
  openGoalModal: (g?: Goal) => void;
  closeGoalModal: () => void;
  openTaskModal: (t?: MonthEndTask) => void;
  closeTaskModal: () => void;
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (acc: Omit<Account, "id" | "createdAt">) => void;
  updateAccount: (acc: Account) => void;
  deleteAccount: (id: string) => void;
  addBudget: (b: Omit<Budget, "id" | "createdAt">) => void;
  updateBudget: (b: Budget) => void;
  deleteBudget: (id: string) => void;
  addCommitment: (c: Omit<Commitment, "id" | "createdAt">) => void;
  updateCommitment: (c: Commitment) => void;
  deleteCommitment: (id: string) => void;
  markCommitmentPaid: (id: string) => void;
  skipCommitment: (id: string) => void;
  addInvestment: (inv: Omit<Investment, "id" | "createdAt">) => void;
  updateInvestment: (inv: Investment) => void;
  deleteInvestment: (id: string) => void;
  addGoal: (g: Omit<Goal, "id" | "createdAt">) => void;
  updateGoal: (g: Goal) => void;
  deleteGoal: (id: string) => void;
  addTask: (t: Omit<MonthEndTask, "id" | "createdAt">) => void;
  updateTask: (t: MonthEndTask) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  copyBudgetsFromPreviousMonth: () => void;
  resetAllData: () => void;
  getMonthStats: (month: string) => { income: number; expense: number; saved: number };
  getNetWorth: () => number;
}

export const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  accounts: "@paisaweb/accounts",
  transactions: "@paisaweb/transactions",
  budgets: "@paisaweb/budgets",
  commitments: "@paisaweb/commitments",
  investments: "@paisaweb/investments",
  goals: "@paisaweb/goals",
  tasks: "@paisaweb/tasks",
  darkMode: "@paisaweb/darkMode",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<MonthEndTask[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [modals, setModals] = useState<ModalState>({
    txModal: false,
    accountModal: false,
    budgetModal: false,
    commitmentModal: false,
    investmentModal: false,
    goalModal: false,
    taskModal: false,
    editingTx: null,
    editingAccount: null,
    editingBudget: null,
    editingCommitment: null,
    editingInvestment: null,
    editingGoal: null,
    editingTask: null,
  });

  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [accs, txs, buds, comms, invs, gls, tks, dm] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.accounts),
          AsyncStorage.getItem(STORAGE_KEYS.transactions),
          AsyncStorage.getItem(STORAGE_KEYS.budgets),
          AsyncStorage.getItem(STORAGE_KEYS.commitments),
          AsyncStorage.getItem(STORAGE_KEYS.investments),
          AsyncStorage.getItem(STORAGE_KEYS.goals),
          AsyncStorage.getItem(STORAGE_KEYS.tasks),
          AsyncStorage.getItem(STORAGE_KEYS.darkMode),
        ]);
        if (accs) setAccounts(JSON.parse(accs));
        if (txs) setTransactions(JSON.parse(txs));
        if (buds) setBudgets(JSON.parse(buds));
        if (comms) setCommitments(JSON.parse(comms));
        if (invs) setInvestments(JSON.parse(invs));
        if (gls) setGoals(JSON.parse(gls));
        if (tks) setTasks(JSON.parse(tks));
        if (dm) setIsDarkMode(JSON.parse(dm));
      } catch (e) {}
      loaded.current = true;
    })();
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.commitments, JSON.stringify(commitments));
  }, [commitments]);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.investments, JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.darkMode, JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const applyTxToAccounts = useCallback(
    (tx: Transaction, direction: 1 | -1, accs: Account[]) => {
      return accs.map((acc) => {
        if (acc.id === tx.sourceId) {
          if (tx.type === "INCOME") return { ...acc, balance: acc.balance + direction * tx.amount };
          if (tx.type === "EXPENSE") return { ...acc, balance: acc.balance - direction * tx.amount };
          if (tx.type === "TRANSFER") return { ...acc, balance: acc.balance - direction * tx.amount };
        }
        if (acc.id === tx.destId && tx.type === "TRANSFER") {
          return { ...acc, balance: acc.balance + direction * tx.amount };
        }
        return acc;
      });
    },
    []
  );

  const addTransaction = useCallback((txData: Omit<Transaction, "id" | "createdAt">) => {
    const tx: Transaction = { ...txData, id: genId(), createdAt: new Date().toISOString() };
    setTransactions((prev) => [tx, ...prev]);
    setAccounts((prev) => applyTxToAccounts(tx, 1, prev));
  }, [applyTxToAccounts]);

  const updateTransaction = useCallback((tx: Transaction) => {
    setTransactions((prev) => {
      const old = prev.find((t) => t.id === tx.id);
      if (!old) return prev;
      setAccounts((accs) => {
        const reverted = applyTxToAccounts(old, -1, accs);
        return applyTxToAccounts(tx, 1, reverted);
      });
      return prev.map((t) => (t.id === tx.id ? tx : t));
    });
  }, [applyTxToAccounts]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => {
      const tx = prev.find((t) => t.id === id);
      if (tx) setAccounts((accs) => applyTxToAccounts(tx, -1, accs));
      return prev.filter((t) => t.id !== id);
    });
  }, [applyTxToAccounts]);

  const addAccount = useCallback((data: Omit<Account, "id" | "createdAt">) => {
    setAccounts((prev) => [...prev, { ...data, id: genId(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateAccount = useCallback((acc: Account) => {
    setAccounts((prev) => prev.map((a) => (a.id === acc.id ? acc : a)));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addBudget = useCallback((data: Omit<Budget, "id" | "createdAt">) => {
    setBudgets((prev) => [...prev, { ...data, id: genId(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateBudget = useCallback((b: Budget) => {
    setBudgets((prev) => prev.map((x) => (x.id === b.id ? b : x)));
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setBudgets((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addCommitment = useCallback((data: Omit<Commitment, "id" | "createdAt">) => {
    setCommitments((prev) => [...prev, { ...data, id: genId(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateCommitment = useCallback((c: Commitment) => {
    setCommitments((prev) => prev.map((x) => (x.id === c.id ? c : x)));
  }, []);

  const deleteCommitment = useCallback((id: string) => {
    setCommitments((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const markCommitmentPaid = useCallback((id: string) => {
    setCommitments((prev) => {
      const comm = prev.find((c) => c.id === id);
      if (!comm || comm.isPaid) return prev;
      const tx: Transaction = {
        id: genId(),
        type: "EXPENSE",
        amount: comm.amount,
        sourceId: comm.sourceId,
        destId: comm.destId,
        category: comm.name,
        note: `Payment: ${comm.name}`,
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      };
      setTransactions((txs) => [tx, ...txs]);
      setAccounts((accs) => applyTxToAccounts(tx, 1, accs));
      return prev.map((c) => (c.id === id ? { ...c, isPaid: true } : c));
    });
  }, [applyTxToAccounts]);

  const skipCommitment = useCallback((id: string) => {
    setCommitments((prev) => prev.map((c) => (c.id === id ? { ...c, isSkipped: true } : c)));
  }, []);

  const addInvestment = useCallback((data: Omit<Investment, "id" | "createdAt">) => {
    setInvestments((prev) => [...prev, { ...data, id: genId(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateInvestment = useCallback((inv: Investment) => {
    setInvestments((prev) => prev.map((x) => (x.id === inv.id ? inv : x)));
  }, []);

  const deleteInvestment = useCallback((id: string) => {
    setInvestments((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addGoal = useCallback((data: Omit<Goal, "id" | "createdAt">) => {
    setGoals((prev) => [...prev, { ...data, id: genId(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateGoal = useCallback((g: Goal) => {
    setGoals((prev) => prev.map((x) => (x.id === g.id ? g : x)));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addTask = useCallback((data: Omit<MonthEndTask, "id" | "createdAt">) => {
    setTasks((prev) => [...prev, { ...data, id: genId(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateTask = useCallback((t: MonthEndTask) => {
    setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, isDone: !t.isDone } : t)));
  }, []);

  const copyBudgetsFromPreviousMonth = useCallback(() => {
    const [y, mo] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(y, mo - 2, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    const prevBudgets = budgets.filter((b) => b.month === prevMonth);
    const existingCats = new Set(budgets.filter((b) => b.month === selectedMonth).map((b) => b.category));
    const toAdd = prevBudgets.filter((b) => !existingCats.has(b.category)).map((b) => ({
      ...b,
      id: genId(),
      month: selectedMonth,
      createdAt: new Date().toISOString(),
    }));
    if (toAdd.length > 0) setBudgets((prev) => [...prev, ...toAdd]);
  }, [selectedMonth, budgets]);

  const resetAllData = useCallback(async () => {
    setAccounts([]);
    setTransactions([]);
    setBudgets([]);
    setCommitments([]);
    setInvestments([]);
    setGoals([]);
    setTasks([]);
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  }, []);

  const getMonthStats = useCallback((month: string) => {
    const monthTxs = transactions.filter((t) => t.date.startsWith(month));
    const income = monthTxs.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const expense = monthTxs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    return { income, expense, saved: income - expense };
  }, [transactions]);

  const getNetWorth = useCallback(() => {
    const accountTotal = accounts.filter((a) => a.type !== "INVESTMENT").reduce((s, a) => s + a.balance, 0);
    const investmentTotal = investments.reduce((s, i) => s + i.currentValue, 0);
    return accountTotal + investmentTotal;
  }, [accounts, investments]);

  const openTxModal = useCallback((tx?: Transaction) => {
    setModals((m) => ({ ...m, txModal: true, editingTx: tx ?? null }));
  }, []);
  const closeTxModal = useCallback(() => setModals((m) => ({ ...m, txModal: false, editingTx: null })), []);

  const openAccountModal = useCallback((acc?: Account) => {
    setModals((m) => ({ ...m, accountModal: true, editingAccount: acc ?? null }));
  }, []);
  const closeAccountModal = useCallback(() => setModals((m) => ({ ...m, accountModal: false, editingAccount: null })), []);

  const openBudgetModal = useCallback((b?: Budget) => {
    setModals((m) => ({ ...m, budgetModal: true, editingBudget: b ?? null }));
  }, []);
  const closeBudgetModal = useCallback(() => setModals((m) => ({ ...m, budgetModal: false, editingBudget: null })), []);

  const openCommitmentModal = useCallback((c?: Commitment) => {
    setModals((m) => ({ ...m, commitmentModal: true, editingCommitment: c ?? null }));
  }, []);
  const closeCommitmentModal = useCallback(() => setModals((m) => ({ ...m, commitmentModal: false, editingCommitment: null })), []);

  const openInvestmentModal = useCallback((inv?: Investment) => {
    setModals((m) => ({ ...m, investmentModal: true, editingInvestment: inv ?? null }));
  }, []);
  const closeInvestmentModal = useCallback(() => setModals((m) => ({ ...m, investmentModal: false, editingInvestment: null })), []);

  const openGoalModal = useCallback((g?: Goal) => {
    setModals((m) => ({ ...m, goalModal: true, editingGoal: g ?? null }));
  }, []);
  const closeGoalModal = useCallback(() => setModals((m) => ({ ...m, goalModal: false, editingGoal: null })), []);

  const openTaskModal = useCallback((t?: MonthEndTask) => {
    setModals((m) => ({ ...m, taskModal: true, editingTask: t ?? null }));
  }, []);
  const closeTaskModal = useCallback(() => setModals((m) => ({ ...m, taskModal: false, editingTask: null })), []);

  const value = useMemo<AppContextValue>(
    () => ({
      accounts, transactions, budgets, commitments, investments, goals, tasks,
      isDarkMode, toggleDarkMode: () => setIsDarkMode((d) => !d),
      selectedMonth, setSelectedMonth,
      modals,
      openTxModal, closeTxModal,
      openAccountModal, closeAccountModal,
      openBudgetModal, closeBudgetModal,
      openCommitmentModal, closeCommitmentModal,
      openInvestmentModal, closeInvestmentModal,
      openGoalModal, closeGoalModal,
      openTaskModal, closeTaskModal,
      addTransaction, updateTransaction, deleteTransaction,
      addAccount, updateAccount, deleteAccount,
      addBudget, updateBudget, deleteBudget,
      addCommitment, updateCommitment, deleteCommitment, markCommitmentPaid, skipCommitment,
      addInvestment, updateInvestment, deleteInvestment,
      addGoal, updateGoal, deleteGoal,
      addTask, updateTask, deleteTask, toggleTask,
      copyBudgetsFromPreviousMonth,
      resetAllData,
      getMonthStats,
      getNetWorth,
    }),
    [
      accounts, transactions, budgets, commitments, investments, goals, tasks,
      isDarkMode, selectedMonth, modals,
      openTxModal, closeTxModal, openAccountModal, closeAccountModal,
      openBudgetModal, closeBudgetModal, openCommitmentModal, closeCommitmentModal,
      openInvestmentModal, closeInvestmentModal, openGoalModal, closeGoalModal,
      openTaskModal, closeTaskModal,
      addTransaction, updateTransaction, deleteTransaction,
      addAccount, updateAccount, deleteAccount,
      addBudget, updateBudget, deleteBudget,
      addCommitment, updateCommitment, deleteCommitment, markCommitmentPaid, skipCommitment,
      addInvestment, updateInvestment, deleteInvestment,
      addGoal, updateGoal, deleteGoal,
      addTask, updateTask, deleteTask, toggleTask,
      copyBudgetsFromPreviousMonth, resetAllData, getMonthStats, getNetWorth,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
