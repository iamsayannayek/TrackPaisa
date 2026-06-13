import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// --- TYPES ---
export type AccountType = "BANK" | "CREDIT_CARD" | "CASH_WALLET" | "INVESTMENT";
export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  purpose: string;
  bankLimit?: number;
  selfLimit?: number;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  sourceId: string;
  destId?: string;
  category: string;
  note: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  color: string;
  icon: string;
  month: string;
}

export interface Commitment {
  id: string;
  title: string;
  amount: number;
  date: string;
  sourceId: string;
  destId?: string;
  linkedBudgetId?: string;
  isPaid?: boolean;
  isSkipped?: boolean;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
  accountId: string;
}

export interface Investment {
  id: string;
  name: string;
  type: string;
  monthlyContribution: number;
  frequency?: string;
  totalInvested: number;
  currentValue: number;
  treatAsExpense: boolean;
  showReturns?: boolean;
  interestRate?: number;
  durationDays?: number;

  // Scheduling & tracking
  tenureYears?: number;
  paidCount?: number;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  autoSchedule?: boolean;
  skippedCount?: number;
}

export interface MonthEndTask {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

// --- MODAL FORM TYPES ---
export interface ModalState {
  isTxModalOpen: boolean;
  isAccModalOpen: boolean;
  isBudgetModalOpen: boolean;
  isCommitmentModalOpen: boolean;
  isGoalModalOpen: boolean;
  isInvModalOpen: boolean;
  isTaskModalOpen: boolean;
  editingTx?: Transaction;
  editingAcc?: Account;
  editingBudget?: Budget;
  editingCommitment?: Commitment;
  editingGoal?: Goal;
  editingInv?: Investment;
  editingTask?: MonthEndTask;
  txForm: Partial<Transaction>;
  accForm: Partial<Account>;
  budgetForm: Partial<Budget>;
  commitmentForm: Partial<Commitment>;
  goalForm: Partial<Goal>;
  invForm: Partial<Investment>;
  taskForm: Partial<MonthEndTask>;
}

export interface AppState extends ModalState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  activeTab: string;
  setActiveTab: (t: string) => void;
  currentMonth: string;
  setCurrentMonth: (m: string) => void;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  commitments: Commitment[];
  goals: Goal[];
  investments: Investment[];
  monthEndTasks: MonthEndTask[];
  isLoaded: boolean;
  profile: UserProfile;
  setProfile: (p: UserProfile | ((prev: UserProfile) => UserProfile)) => void;

  setTxForm: (
    f:
      | Partial<Transaction>
      | ((prev: Partial<Transaction>) => Partial<Transaction>),
  ) => void;
  setAccForm: (
    f: Partial<Account> | ((prev: Partial<Account>) => Partial<Account>),
  ) => void;
  setBudgetForm: (
    f: Partial<Budget> | ((prev: Partial<Budget>) => Partial<Budget>),
  ) => void;
  setCommitmentForm: (
    f:
      | Partial<Commitment>
      | ((prev: Partial<Commitment>) => Partial<Commitment>),
  ) => void;
  setGoalForm: (
    f: Partial<Goal> | ((prev: Partial<Goal>) => Partial<Goal>),
  ) => void;
  setInvForm: (
    f:
      | Partial<Investment>
      | ((prev: Partial<Investment>) => Partial<Investment>),
  ) => void;
  setTaskForm: (
    f:
      | Partial<MonthEndTask>
      | ((prev: Partial<MonthEndTask>) => Partial<MonthEndTask>),
  ) => void;

  openTxModal: (t?: Transaction) => void;
  closeTxModal: () => void;
  handleSaveTx: () => void;
  handleDeleteTx: () => void;

  openAccountModal: (acc?: Account) => void;
  closeAccModal: () => void;
  handleSaveAccount: () => void;
  handleDeleteAccount: () => void;

  openBudgetModal: (b?: Budget) => void;
  closeBudgetModal: () => void;
  handleSaveBudget: () => void;
  handleDeleteBudget: () => void;
  copyBudgets: (fromMonth: string, toMonth: string) => void;

  openCommitmentModal: (c?: Commitment) => void;
  closeCommitmentModal: () => void;
  handleSaveCommitment: () => void;
  handleDeleteCommitment: () => void;
  markCommitmentPaid: (id: string) => void;
  skipCommitment: (id: string) => void;
  undoCommitment: (id: string) => void;

  openGoalModal: (g?: Goal) => void;
  closeGoalModal: () => void;
  handleSaveGoal: () => void;
  handleDeleteGoal: () => void;

  openInvestmentModal: (i?: Investment) => void;
  closeInvModal: () => void;
  handleSaveInvestment: () => void;
  handleDeleteInvestment: () => void;

  openTaskModal: (t?: MonthEndTask) => void;
  closeTaskModal: () => void;
  handleSaveTask: () => void;
  handleDeleteTask: () => void;
  toggleMonthEndTask: (id: string) => void;
  resetApp: () => void;

  addTransaction: (t: Omit<Transaction, "id">) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
}

// --- SEED DATA ---
const SEED_ACCOUNTS: Account[] = [
  {
    id: "a1",
    name: "HDFC Bank",
    type: "BANK",
    balance: 12000,
    purpose: "Primary spending (Salary)",
    icon: "Landmark",
    color: "#1d4ed8",
  },
  {
    id: "a2",
    name: "HDFC Tata Neu",
    type: "CREDIT_CARD",
    balance: -2500,
    bankLimit: 90000,
    selfLimit: 15000,
    purpose: "Monthly spend",
    icon: "CreditCard",
    color: "#6d28d9",
  },
  {
    id: "a3",
    name: "SBI Bank",
    type: "BANK",
    balance: 85000,
    purpose: "Emergency",
    icon: "Landmark",
    color: "#0369a1",
  },
  {
    id: "a4",
    name: "Canara Bank",
    type: "BANK",
    balance: 25000,
    purpose: "MF linked + Backup",
    icon: "Landmark",
    color: "#b91c1c",
  },
  {
    id: "a5",
    name: "Black Wallet 1",
    type: "CASH_WALLET",
    balance: 1500,
    purpose: "Daily cash",
    icon: "Wallet",
    color: "#334155",
  },
  {
    id: "a6",
    name: "Black Wallet 2",
    type: "CASH_WALLET",
    balance: 2000,
    purpose: "Emergency bag cash",
    icon: "Wallet",
    color: "#0f172a",
  },
];

const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    date: "2026-05-01",
    amount: 25000,
    type: "INCOME",
    sourceId: "a1",
    category: "Salary",
    note: "May Salary",
  },
  {
    id: "t2",
    date: "2026-05-02",
    amount: 8000,
    type: "EXPENSE",
    sourceId: "a1",
    category: "Family",
    note: "Home Remittance",
  },
  {
    id: "t3",
    date: "2026-05-03",
    amount: 1500,
    type: "TRANSFER",
    sourceId: "a1",
    destId: "i1",
    category: "Investment",
    note: "MF Transfer",
  },
  {
    id: "t4",
    date: "2026-05-03",
    amount: 500,
    type: "TRANSFER",
    sourceId: "a1",
    destId: "i2",
    category: "Investment",
    note: "PPF Transfer",
  },
  {
    id: "t5",
    date: "2026-05-04",
    amount: 1763,
    type: "TRANSFER",
    sourceId: "a1",
    destId: "i3",
    category: "Sinking Fund",
    note: "LIC Monthly Provision",
  },
  {
    id: "t6",
    date: "2026-05-05",
    amount: 1500,
    type: "TRANSFER",
    sourceId: "a1",
    destId: "a5",
    category: "Withdrawal",
    note: "Daily Transport Cash",
  },
  {
    id: "t7",
    date: "2026-05-06",
    amount: 120,
    type: "EXPENSE",
    sourceId: "a5",
    category: "Transport",
    note: "Bus Ticket",
  },
  {
    id: "t8",
    date: "2026-05-10",
    amount: 850,
    type: "EXPENSE",
    sourceId: "a2",
    category: "Food & Dining",
    note: "Groceries",
  },
  {
    id: "t9",
    date: "2026-05-15",
    amount: 300,
    type: "EXPENSE",
    sourceId: "a2",
    category: "Bills & Utilities",
    note: "Mobile Bill",
  },
];

const SEED_BUDGETS: Budget[] = [
  {
    id: "b1",
    category: "Transport",
    limit: 1500,
    color: "#f59e0b",
    icon: "Car",
    month: "2026-05",
  },
  {
    id: "b2",
    category: "Food & Dining",
    limit: 4000,
    color: "#10b981",
    icon: "Coffee",
    month: "2026-05",
  },
  {
    id: "b3",
    category: "Shopping/Personal",
    limit: 2000,
    color: "#8b5cf6",
    icon: "ShoppingCart",
    month: "2026-05",
  },
  {
    id: "b4",
    category: "Bills & Utilities",
    limit: 1000,
    color: "#3b82f6",
    icon: "Zap",
    month: "2026-05",
  },
  {
    id: "b5",
    category: "Family",
    limit: 10000,
    color: "#f43f5e",
    icon: "Heart",
    month: "2026-05",
  },
];

const SEED_INVESTMENTS: Investment[] = [
  {
    id: "i1",
    name: "Mutual Fund (Equity)",
    type: "MF",
    monthlyContribution: 1500,
    frequency: "Monthly",
    totalInvested: 45000,
    currentValue: 52300,
    treatAsExpense: false,
    showReturns: true,
    autoSchedule: true,
  },
  {
    id: "i2",
    name: "PPF",
    type: "PPF",
    monthlyContribution: 500,
    frequency: "Monthly",
    totalInvested: 15000,
    currentValue: 16100,
    treatAsExpense: false,
    showReturns: false,
    autoSchedule: true,
  },
  {
    id: "i3",
    name: "LIC Jeevan Umang (745)",
    type: "LIC",
    monthlyContribution: 5300,
    frequency: "Quarterly",
    totalInvested: 21156,
    currentValue: 9500,
    treatAsExpense: true,
    showReturns: false,
    autoSchedule: true,
  },
];

const SEED_COMMITMENTS: Commitment[] = [
  {
    id: "c1",
    title: "Home Remittance",
    amount: 8000,
    date: "2026-05-02",
    sourceId: "a1",
    isPaid: false,
  },
  {
    id: "c2",
    title: "Mutual Fund SIPs",
    amount: 1500,
    date: "2026-05-05",
    sourceId: "a4",
    destId: "i1",
    isPaid: false,
  },
  {
    id: "c3",
    title: "PPF Investment",
    amount: 500,
    date: "2026-05-05",
    sourceId: "a3",
    destId: "i2",
    isPaid: false,
  },
  {
    id: "c4",
    title: "LIC Premium (QTR)",
    amount: 5300,
    date: "2026-05-28",
    sourceId: "a4",
    destId: "i3",
    isPaid: false,
  },
  {
    id: "c5",
    title: "Train Pass",
    amount: 500,
    date: "2026-05-01",
    sourceId: "a5",
    isPaid: false,
  },
  {
    id: "c6",
    title: "Daily Transport Cash",
    amount: 1500,
    date: "2026-05-01",
    sourceId: "a1",
    destId: "a5",
    isPaid: false,
  },
];

const SEED_GOALS: Goal[] = [
  {
    id: "g1",
    name: "1BHK Flat Downpayment",
    target: 500000,
    current: 85000,
    deadline: "2030-12-31",
    accountId: "a3",
  },
  {
    id: "g2",
    name: "Emergency Fund (6 Months)",
    target: 120000,
    current: 85000,
    deadline: "2027-06-30",
    accountId: "a3",
  },
];

const SEED_TASKS: MonthEndTask[] = [
  {
    id: "tk1",
    text: "Reconcile physical cash in Black & Brown wallets",
    isCompleted: false,
  },
  {
    id: "tk2",
    text: "Pay HDFC Tata Neu CC bill in full from Salary account",
    isCompleted: false,
  },
  {
    id: "tk3",
    text: "Move provisions for next month (LIC, Train) to Canara Bank",
    isCompleted: false,
  },
  {
    id: "tk4",
    text: "Sweep all remaining HDFC buffer into SBI Emergency Fund",
    isCompleted: false,
  },
  {
    id: "tk5",
    text: "Withdraw cash for next month's daily transport",
    isCompleted: false,
  },
];

// --- CONTEXT ---
export const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

function uid(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
  });

  const [accounts, setAccounts] = useState<Account[]>(SEED_ACCOUNTS);
  const [transactions, setTransactions] =
    useState<Transaction[]>(SEED_TRANSACTIONS);
  const [budgets, setBudgets] = useState<Budget[]>(SEED_BUDGETS);
  const [commitments, setCommitments] =
    useState<Commitment[]>(SEED_COMMITMENTS);
  const [goals, setGoals] = useState<Goal[]>(SEED_GOALS);
  const [investments, setInvestments] =
    useState<Investment[]>(SEED_INVESTMENTS);
  const [monthEndTasks, setMonthEndTasks] =
    useState<MonthEndTask[]>(SEED_TASKS);

  // Modal state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [editingTx, setEditingTx] = useState<Transaction | undefined>();
  const [editingAcc, setEditingAcc] = useState<Account | undefined>();
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>();
  const [editingCommitment, setEditingCommitment] = useState<
    Commitment | undefined
  >();
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const [editingInv, setEditingInv] = useState<Investment | undefined>();
  const [editingTask, setEditingTask] = useState<MonthEndTask | undefined>();

  const [txForm, setTxForm] = useState<Partial<Transaction>>({
    type: "EXPENSE",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
  });
  const [accForm, setAccForm] = useState<Partial<Account>>({
    type: "BANK",
    color: "#1d4ed8",
    icon: "Landmark",
  });
  const [budgetForm, setBudgetForm] = useState<Partial<Budget>>({
    color: "#3b82f6",
    icon: "Wallet",
    month: currentMonth,
  });
  const [commitmentForm, setCommitmentForm] = useState<Partial<Commitment>>({
    date: new Date().toISOString().split("T")[0],
    sourceId: "",
  });
  const [goalForm, setGoalForm] = useState<Partial<Goal>>({});
  const [invForm, setInvForm] = useState<Partial<Investment>>({
    treatAsExpense: false,
    type: "MF",
    frequency: "Monthly",
    showReturns: true,
    nextPaymentDate: new Date().toISOString().split("T")[0],
    paidCount: 0,
    autoSchedule: true,
  });
  const [taskForm, setTaskForm] = useState<Partial<MonthEndTask>>({ text: "" });

  // Load from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const keys = [
          "isDarkMode",
          "accounts",
          "transactions",
          "budgets",
          "commitments",
          "goals",
          "investments",
          "monthEndTasks",
          "profile",
        ];
        const values = await AsyncStorage.multiGet(keys);
        const map = Object.fromEntries(values.map(([k, v]) => [k, v]));
        if (map.isDarkMode !== null) setIsDarkMode(JSON.parse(map.isDarkMode));
        if (map.accounts) setAccounts(JSON.parse(map.accounts));
        if (map.transactions) setTransactions(JSON.parse(map.transactions));
        if (map.budgets) setBudgets(JSON.parse(map.budgets));
        if (map.commitments) setCommitments(JSON.parse(map.commitments));
        if (map.goals) setGoals(JSON.parse(map.goals));
        if (map.investments) setInvestments(JSON.parse(map.investments));
        if (map.monthEndTasks) setMonthEndTasks(JSON.parse(map.monthEndTasks));
        if (map.profile) setProfile(JSON.parse(map.profile));
      } catch {}
      setIsLoaded(true);
    })();
  }, []);

  // Persist to AsyncStorage
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.multiSet([
      ["isDarkMode", JSON.stringify(isDarkMode)],
      ["accounts", JSON.stringify(accounts)],
      ["transactions", JSON.stringify(transactions)],
      ["budgets", JSON.stringify(budgets)],
      ["commitments", JSON.stringify(commitments)],
      ["goals", JSON.stringify(goals)],
      ["investments", JSON.stringify(investments)],
      ["monthEndTasks", JSON.stringify(monthEndTasks)],
      ["profile", JSON.stringify(profile)],
    ]).catch(() => {});
  }, [
    isDarkMode,
    accounts,
    transactions,
    budgets,
    commitments,
    goals,
    investments,
    monthEndTasks,
    profile,
    isLoaded,
  ]);

  // --- Auto-Scheduler Engine ---
  useEffect(() => {
    if (!isLoaded) return;
    let newCommitments: Commitment[] = [];
    let madeChanges = false;

    investments.forEach((inv) => {
      if (inv.autoSchedule && inv.nextPaymentDate) {
        const nextMonth = inv.nextPaymentDate.substring(0, 7);

        if (nextMonth === currentMonth) {
          const alreadyExists = commitments.some(
            (c) =>
              c.destId === inv.id && c.date.substring(0, 7) === currentMonth,
          );

          if (!alreadyExists) {
            const multiplier = inv.treatAsExpense
              ? 1 + (inv.skippedCount || 0)
              : 1;
            const dueAmount = inv.monthlyContribution * multiplier;

            newCommitments.push({
              id: uid(),
              title: `${inv.name} Premium`,
              amount: dueAmount,
              date: inv.nextPaymentDate,
              sourceId: accounts[0]?.id || "",
              destId: inv.id,
              isPaid: false,
              isSkipped: false,
            });
            madeChanges = true;
          }
        }
      }
    });

    if (madeChanges) setCommitments((prev) => [...prev, ...newCommitments]);
  }, [currentMonth, investments, isLoaded]);

  // --- Core Accounting Engine ---
  const applyTransactionToAccounts = (
    t: Partial<Transaction>,
    revert = false,
  ) => {
    const m = revert ? -1 : 1;
    setAccounts((prev) =>
      prev.map((a) => {
        let b = a.balance;
        if (t.type === "INCOME" && a.id === t.sourceId)
          b += (t.amount || 0) * m;
        if (t.type === "EXPENSE" && a.id === t.sourceId)
          b -= (t.amount || 0) * m;
        if (t.type === "TRANSFER") {
          if (a.id === t.sourceId) b -= (t.amount || 0) * m;
          if (a.id === t.destId) b += (t.amount || 0) * m;
        }
        return { ...a, balance: b };
      }),
    );
  };

  const applyTransactionToInvestments = (
    t: Partial<Transaction>,
    revert = false,
  ) => {
    if (t.type === "TRANSFER" && t.destId) {
      const m = revert ? -1 : 1;
      setInvestments((prev) =>
        prev.map((inv) => {
          if (inv.id === t.destId) {
            return {
              ...inv,
              totalInvested: (inv.totalInvested || 0) + (t.amount || 0) * m,
              currentValue: (inv.currentValue || 0) + (t.amount || 0) * m,
            };
          }
          return inv;
        }),
      );
    }
  };

  const addTransaction = (t: Omit<Transaction, "id">) => {
    const newTx = { ...t, id: uid() };
    setTransactions((prev) => [newTx, ...prev]);
    applyTransactionToAccounts(newTx);
    applyTransactionToInvestments(newTx);
  };

  const updateTransaction = (id: string, newTx: Partial<Transaction>) => {
    const oldTx = transactions.find((t) => t.id === id);
    if (oldTx) {
      applyTransactionToAccounts(oldTx, true);
      applyTransactionToInvestments(oldTx, true);
    }
    const fullNewTx = { ...oldTx, ...newTx } as Transaction;
    setTransactions((prev) => prev.map((t) => (t.id === id ? fullNewTx : t)));
    applyTransactionToAccounts(fullNewTx);
    applyTransactionToInvestments(fullNewTx);
  };

  const deleteTransaction = (id: string) => {
    const oldTx = transactions.find((t) => t.id === id);
    if (oldTx) {
      applyTransactionToAccounts(oldTx, true);
      applyTransactionToInvestments(oldTx, true);
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Transaction Modal Handlers ---
  const openTxModal = (tx?: Transaction) => {
    if (tx) {
      setEditingTx(tx);
      setTxForm(tx);
    } else {
      setEditingTx(undefined);
      setTxForm({
        type: "EXPENSE",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        sourceId: accounts[0]?.id,
      });
    }
    setIsTxModalOpen(true);
  };
  const closeTxModal = () => setIsTxModalOpen(false);
  const handleSaveTx = () => {
    if (editingTx) {
      updateTransaction(editingTx.id, txForm as Partial<Transaction>);
    } else if (txForm.amount && txForm.sourceId) {
      addTransaction(txForm as Omit<Transaction, "id">);
    }
    setIsTxModalOpen(false);
  };
  const handleDeleteTx = () => {
    if (editingTx) {
      deleteTransaction(editingTx.id);
      setIsTxModalOpen(false);
    }
  };

  // --- Account Modal Handlers ---
  const openAccountModal = (acc?: Account) => {
    if (acc) {
      setEditingAcc(acc);
      setAccForm(acc);
    } else {
      setEditingAcc(undefined);
      setAccForm({
        name: "",
        type: "BANK",
        balance: 0,
        purpose: "",
        color: "#3b82f6",
        icon: "Landmark",
      });
    }
    setIsAccModalOpen(true);
  };
  const closeAccModal = () => setIsAccModalOpen(false);
  const handleSaveAccount = () => {
    const rawBalance = accForm.balance || 0;
    const finalBalance =
      accForm.type === "CREDIT_CARD"
        ? -Math.abs(rawBalance)
        : Math.abs(rawBalance);

    if (editingAcc) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === editingAcc.id
            ? ({ ...a, ...accForm, balance: finalBalance } as Account)
            : a,
        ),
      );
    } else {
      setAccounts((prev) => [
        ...prev,
        { ...accForm, balance: finalBalance, id: uid() } as Account,
      ]);
    }

    setIsAccModalOpen(false);
  };
  const handleDeleteAccount = () => {
    if (editingAcc) {
      setAccounts((prev) => prev.filter((a) => a.id !== editingAcc.id));
      setIsAccModalOpen(false);
    }
  };

  // --- Budget Modal Handlers ---
  const openBudgetModal = (b?: Budget) => {
    if (b) {
      setEditingBudget(b);
      setBudgetForm(b);
    } else {
      setEditingBudget(undefined);
      setBudgetForm({
        category: "",
        limit: 0,
        color: "#10b981",
        icon: "Wallet",
        month: currentMonth,
      });
    }
    setIsBudgetModalOpen(true);
  };
  const closeBudgetModal = () => setIsBudgetModalOpen(false);

  // PART 2 FIX: When category is renamed, migrate all matching transactions
  const handleSaveBudget = () => {
    if (editingBudget) {
      const oldCategory = editingBudget.category;
      const newCategory = budgetForm.category ?? editingBudget.category;
      const categoryChanged =
        oldCategory && newCategory && oldCategory !== newCategory;

      setBudgets((prev) =>
        prev.map((x) =>
          x.id === editingBudget.id ? ({ ...x, ...budgetForm } as Budget) : x,
        ),
      );

      if (categoryChanged) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.category === oldCategory ? { ...t, category: newCategory } : t,
          ),
        );
      }
    } else {
      setBudgets((prev) => [...prev, { ...budgetForm, id: uid() } as Budget]);
    }
    setIsBudgetModalOpen(false);
  };

  const handleDeleteBudget = () => {
    if (editingBudget) {
      setBudgets((prev) => prev.filter((x) => x.id !== editingBudget.id));
      setIsBudgetModalOpen(false);
    }
  };

  const copyBudgets = (fromMonth: string, toMonth: string) => {
    const prev = budgets.filter((b) => b.month === fromMonth);
    if (prev.length === 0) return;
    const newBudgets = prev.map((b) => ({ ...b, id: uid(), month: toMonth }));
    setBudgets((old) => [
      ...old.filter((b) => b.month !== toMonth),
      ...newBudgets,
    ]);
  };

  // --- Commitment Modal Handlers ---
  const openCommitmentModal = (c?: Commitment) => {
    if (c) {
      setEditingCommitment(c);
      setCommitmentForm({ ...c });
    } else {
      setEditingCommitment(undefined);
      setCommitmentForm({
        title: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        sourceId: accounts[0]?.id,
        destId: "",
        linkedBudgetId: "",
      });
    }
    setIsCommitmentModalOpen(true);
  };
  const closeCommitmentModal = () => setIsCommitmentModalOpen(false);
  const handleSaveCommitment = () => {
    if (editingCommitment) {
      setCommitments((prev) =>
        prev.map((x) =>
          x.id === editingCommitment.id
            ? ({ ...x, ...commitmentForm } as Commitment)
            : x,
        ),
      );
    } else {
      setCommitments((prev) => [
        ...prev,
        { ...commitmentForm, id: uid(), isPaid: false } as Commitment,
      ]);
    }
    setIsCommitmentModalOpen(false);
  };
  const handleDeleteCommitment = () => {
    if (editingCommitment) {
      setCommitments((prev) =>
        prev.filter((x) => x.id !== editingCommitment.id),
      );
      setIsCommitmentModalOpen(false);
    }
  };

  const markCommitmentPaid = (id: string) => {
    const c = commitments.find((x) => x.id === id);
    if (!c) return;

    setCommitments((prev) =>
      prev.map((x) => (x.id === id ? { ...x, isPaid: true } : x)),
    );

    const sourceId = c.sourceId || accounts[0]?.id || "";
    const linkedBudget = budgets.find((b) => b.id === c.linkedBudgetId);
    const isDestAccount = accounts.some((a) => a.id === c.destId);
    const destInvestment = investments.find((i) => i.id === c.destId);

    const isTransfer =
      isDestAccount || (destInvestment && !destInvestment.treatAsExpense);

    const category = linkedBudget
      ? linkedBudget.category
      : isTransfer
        ? "Investment / Transfer"
        : destInvestment
          ? destInvestment.name
          : "Commitment";

    addTransaction({
      date: c.date,
      amount: c.amount,
      type: isTransfer ? "TRANSFER" : "EXPENSE",
      sourceId,
      destId: c.destId,
      category,
      note: c.title,
    });

    if (destInvestment) {
      setInvestments((prev) =>
        prev.map((inv) => {
          if (inv.id === c.destId) {
            const periodsPaid = inv.treatAsExpense
              ? 1 + (inv.skippedCount || 0)
              : 1;
            return {
              ...inv,
              paidCount: (inv.paidCount || 0) + periodsPaid,
              skippedCount: 0,
              lastPaymentDate: c.date,
              nextPaymentDate: calculateNextDate(
                inv.nextPaymentDate || c.date,
                inv.frequency || "Monthly",
              ),
            };
          }
          return inv;
        }),
      );
    }
  };

  // PART 11 + 12: Skip with undo capability and auto-reschedule
  const skipCommitment = (id: string) => {
    const c = commitments.find((x) => x.id === id);
    if (!c) return;

    const destInvestment = investments.find((i) => i.id === c.destId);
    const newNextDate = destInvestment
      ? calculateNextDate(
          destInvestment.nextPaymentDate || c.date,
          destInvestment.frequency || "Monthly",
        )
      : "";

    setCommitments((prev) => {
      const updated = prev.map((x) =>
        x.id === id ? { ...x, isSkipped: true } : x,
      );

      // PART 12: Auto-create next period commitment if autoSchedule is on
      if (destInvestment?.autoSchedule && newNextDate) {
        const nextMonth = newNextDate.substring(0, 7);
        const alreadyExists = updated.some(
          (cm) =>
            cm.destId === c.destId &&
            cm.date.substring(0, 7) === nextMonth &&
            !cm.isSkipped &&
            !cm.isPaid,
        );
        if (!alreadyExists) {
          const multiplier = destInvestment.treatAsExpense
            ? 1 + ((destInvestment.skippedCount || 0) + 1)
            : 1;
          updated.push({
            id: uid(),
            title: c.title,
            amount: destInvestment.monthlyContribution * multiplier,
            date: newNextDate,
            sourceId: c.sourceId,
            destId: c.destId,
            linkedBudgetId: c.linkedBudgetId,
            isPaid: false,
            isSkipped: false,
          });
        }
      }

      return updated;
    });

    if (destInvestment) {
      setInvestments((prev) =>
        prev.map((inv) => {
          if (inv.id === c.destId) {
            return {
              ...inv,
              skippedCount: (inv.skippedCount || 0) + 1,
              nextPaymentDate: newNextDate || inv.nextPaymentDate,
            };
          }
          return inv;
        }),
      );
    }
  };

  // PART 11: Undo a skipped commitment (if still in current month & future)
  const undoCommitment = (id: string) => {
    setCommitments((prev) =>
      prev.map((x) => (x.id === id ? { ...x, isSkipped: false } : x)),
    );
    // Optionally reverse the skippedCount on linked investment
    const c = commitments.find((x) => x.id === id);
    if (c?.destId) {
      setInvestments((prev) =>
        prev.map((inv) => {
          if (inv.id === c.destId && (inv.skippedCount || 0) > 0) {
            return {
              ...inv,
              skippedCount: (inv.skippedCount || 0) - 1,
            };
          }
          return inv;
        }),
      );
    }
  };

  const resetApp = async () => {
    const resetMonth = new Date().toISOString().slice(0, 7);
    try {
      await AsyncStorage.clear();
    } catch {}

    setIsDarkMode(true);
    setActiveTab("dashboard");
    setCurrentMonth(resetMonth);
    setProfile({ name: "", email: "", phone: "" });

    setAccounts([]);
    setTransactions([]);
    setBudgets([]);
    setCommitments([]);
    setGoals([]);
    setInvestments([]);
    setMonthEndTasks([]);

    setIsTxModalOpen(false);
    setIsAccModalOpen(false);
    setIsBudgetModalOpen(false);
    setIsCommitmentModalOpen(false);
    setIsGoalModalOpen(false);
    setIsInvModalOpen(false);
    setIsTaskModalOpen(false);

    setEditingTx(undefined);
    setEditingAcc(undefined);
    setEditingBudget(undefined);
    setEditingCommitment(undefined);
    setEditingGoal(undefined);
    setEditingInv(undefined);
    setEditingTask(undefined);

    setTxForm({
      type: "EXPENSE",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
    });
    setAccForm({ type: "BANK", color: "#1d4ed8", icon: "Landmark" });
    setBudgetForm({ color: "#3b82f6", icon: "Wallet", month: resetMonth });
    setCommitmentForm({ date: new Date().toISOString().split("T")[0], sourceId: "" });
    setGoalForm({});
    setInvForm({ treatAsExpense: false, type: "MF", frequency: "Monthly", showReturns: true });
    setTaskForm({ text: "" });
  };

  // --- Goal Modal Handlers ---
  const openGoalModal = (g?: Goal) => {
    if (g) {
      setEditingGoal(g);
      setGoalForm(g);
    } else {
      setEditingGoal(undefined);
      setGoalForm({
        name: "",
        target: 0,
        current: 0,
        deadline: new Date().toISOString().split("T")[0],
        accountId: accounts[0]?.id,
      });
    }
    setIsGoalModalOpen(true);
  };
  const closeGoalModal = () => setIsGoalModalOpen(false);
  const handleSaveGoal = () => {
    if (editingGoal) {
      setGoals((prev) =>
        prev.map((x) =>
          x.id === editingGoal.id ? ({ ...x, ...goalForm } as Goal) : x,
        ),
      );
    } else {
      setGoals((prev) => [...prev, { ...goalForm, id: uid() } as Goal]);
    }
    setIsGoalModalOpen(false);
  };
  const handleDeleteGoal = () => {
    if (editingGoal) {
      setGoals((prev) => prev.filter((x) => x.id !== editingGoal.id));
      setIsGoalModalOpen(false);
    }
  };

  // --- Investment Modal Handlers ---
  const openInvestmentModal = (i?: Investment) => {
    if (i) {
      setEditingInv(i);
      setInvForm({
        ...i,
        frequency: i.frequency || "Monthly",
        showReturns: i.showReturns ?? true,
      });
    } else {
      setEditingInv(undefined);
      setInvForm({
        name: "",
        type: "MF",
        monthlyContribution: 0,
        frequency: "Monthly",
        totalInvested: 0,
        currentValue: 0,
        treatAsExpense: false,
        showReturns: true,
        nextPaymentDate: new Date().toISOString().split("T")[0],
        paidCount: 0,
        autoSchedule: true,
      });
    }
    setIsInvModalOpen(true);
  };
  const closeInvModal = () => setIsInvModalOpen(false);
  const handleSaveInvestment = () => {
    if (editingInv) {
      setInvestments((prev) =>
        prev.map((x) =>
          x.id === editingInv.id ? ({ ...x, ...invForm } as Investment) : x,
        ),
      );
    } else {
      setInvestments((prev) => [
        ...prev,
        { ...invForm, id: uid() } as Investment,
      ]);
    }
    setIsInvModalOpen(false);
  };
  const handleDeleteInvestment = () => {
    if (editingInv) {
      setInvestments((prev) => prev.filter((x) => x.id !== editingInv.id));
      setIsInvModalOpen(false);
    }
  };

  // --- Task Modal Handlers ---
  const openTaskModal = (t?: MonthEndTask) => {
    if (t) {
      setEditingTask(t);
      setTaskForm({ text: t.text });
    } else {
      setEditingTask(undefined);
      setTaskForm({ text: "" });
    }
    setIsTaskModalOpen(true);
  };
  const closeTaskModal = () => setIsTaskModalOpen(false);
  const handleSaveTask = () => {
    if (editingTask) {
      setMonthEndTasks((prev) =>
        prev.map((x) =>
          x.id === editingTask.id ? ({ ...x, ...taskForm } as MonthEndTask) : x,
        ),
      );
    } else {
      setMonthEndTasks((prev) => [
        ...prev,
        { ...taskForm, id: uid(), isCompleted: false } as MonthEndTask,
      ]);
    }
    setIsTaskModalOpen(false);
  };
  const handleDeleteTask = () => {
    if (editingTask) {
      setMonthEndTasks((prev) => prev.filter((x) => x.id !== editingTask.id));
      setIsTaskModalOpen(false);
    }
  };
  const toggleMonthEndTask = (id: string) => {
    setMonthEndTasks((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, isCompleted: !x.isCompleted } : x,
      ),
    );
  };

  // PART 15: Export all data as JSON string
  const exportData = (): string => {
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        accounts,
        transactions,
        budgets,
        commitments,
        goals,
        investments,
        monthEndTasks,
        profile,
      },
      null,
      2,
    );
  };

  // PART 15: Import data from JSON backup
  const importData = (json: string): boolean => {
    try {
      const data = JSON.parse(json);
      if (!data || typeof data !== "object") return false;
      if (Array.isArray(data.accounts)) setAccounts(data.accounts);
      if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (Array.isArray(data.budgets)) setBudgets(data.budgets);
      if (Array.isArray(data.commitments)) setCommitments(data.commitments);
      if (Array.isArray(data.goals)) setGoals(data.goals);
      if (Array.isArray(data.investments)) setInvestments(data.investments);
      if (Array.isArray(data.monthEndTasks))
        setMonthEndTasks(data.monthEndTasks);
      if (data.profile && typeof data.profile === "object")
        setProfile(data.profile);
      return true;
    } catch {
      return false;
    }
  };

  const value: AppState = {
    isDarkMode,
    toggleTheme: () => setIsDarkMode((v) => !v),
    activeTab,
    setActiveTab,
    currentMonth,
    setCurrentMonth,
    accounts,
    transactions,
    budgets,
    commitments,
    goals,
    investments,
    monthEndTasks,
    isLoaded,
    profile,
    setProfile,
    isTxModalOpen,
    isAccModalOpen,
    isBudgetModalOpen,
    isCommitmentModalOpen,
    isGoalModalOpen,
    isInvModalOpen,
    isTaskModalOpen,
    editingTx,
    editingAcc,
    editingBudget,
    editingCommitment,
    editingGoal,
    editingInv,
    editingTask,
    txForm,
    setTxForm,
    accForm,
    setAccForm,
    budgetForm,
    setBudgetForm,
    commitmentForm,
    setCommitmentForm,
    goalForm,
    setGoalForm,
    invForm,
    setInvForm,
    taskForm,
    setTaskForm,
    openTxModal,
    closeTxModal,
    handleSaveTx,
    handleDeleteTx,
    openAccountModal,
    closeAccModal,
    handleSaveAccount,
    handleDeleteAccount,
    openBudgetModal,
    closeBudgetModal,
    handleSaveBudget,
    handleDeleteBudget,
    copyBudgets,
    openCommitmentModal,
    closeCommitmentModal,
    handleSaveCommitment,
    handleDeleteCommitment,
    markCommitmentPaid,
    skipCommitment,
    undoCommitment,
    resetApp,
    openGoalModal,
    closeGoalModal,
    handleSaveGoal,
    handleDeleteGoal,
    openInvestmentModal,
    closeInvModal,
    handleSaveInvestment,
    handleDeleteInvestment,
    openTaskModal,
    closeTaskModal,
    handleSaveTask,
    handleDeleteTask,
    toggleMonthEndTask,
    addTransaction,
    exportData,
    importData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// PART 8: Complete frequency engine — Daily, Weekly, Monthly, Quarterly, Half-Yearly, Yearly
export const calculateNextDate = (
  currentDate: string,
  frequency: string,
): string => {
  if (!currentDate) return "";
  // Use noon UTC to avoid DST boundary bugs
  const d = new Date(currentDate + "T12:00:00Z");
  if (!isFinite(d.getTime())) return "";
  switch (frequency) {
    case "Daily":
      d.setUTCDate(d.getUTCDate() + 1);
      break;
    case "Weekly":
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case "Monthly":
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case "Quarterly":
      d.setUTCMonth(d.getUTCMonth() + 3);
      break;
    case "Half-Yearly":
      d.setUTCMonth(d.getUTCMonth() + 6);
      break;
    case "Yearly":
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
    default:
      d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return d.toISOString().split("T")[0];
};
