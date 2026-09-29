import React, { useState } from 'react';
import {
  Member,
  PromiseBudget,
  PaymentTransaction,
  ExpenseRecord,
  isFinanceManager,
  isOBRole,
  ROLE_LABELS,
  isDeveloperUser,
} from '../types';
import { Storage } from '../utils/storage';
import * as XLSX from 'xlsx';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Receipt,
  User,
  Shield,
  CreditCard,
  Trash2,
  X,
  TrendingUp,
  Edit2,
} from 'lucide-react';

interface FinancePageProps {
  currentUser: Member | null;
  onOpenLogin: () => void;
  onDataChanged: () => void;
  dataVersion?: number;
}

type FinanceTab = 'budgets' | 'expenses' | 'transactions';

export const FinancePage: React.FC<FinancePageProps> = ({
  currentUser,
  onOpenLogin,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('budgets');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'OB' | 'MEMBER' | 'PENDING' | 'PAID'>('ALL');

  const budgets = Storage.getPromiseBudgets();
  const expenses = Storage.getExpenses();
  const payments = Storage.getPayments();
  const summary = Storage.getFinanceSummary();

  const isOB = (currentUser && isOBRole(currentUser.role)) || isDeveloperUser(currentUser);
  const isFinManager = isOB;
  const canManageFinance = isOB;
  const myBudget = currentUser ? budgets.find((b) => b.memberId === currentUser.id) : null;

  // Modals & Editing states
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const [editingBudget, setEditingBudget] = useState<PromiseBudget | null>(null);
  const [editBudgetAmount, setEditBudgetAmount] = useState<number>(100);
  const [editBudgetNotes, setEditBudgetNotes] = useState('');

  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  const [editingPayment, setEditingPayment] = useState<PaymentTransaction | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState<number>(100);
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentTransaction['paymentMethod']>('GPay / UPI');
  const [editPaymentNotes, setEditPaymentNotes] = useState('');

  const handleOpenEditBudget = (b: PromiseBudget) => {
    if (!canManageFinance) return;
    setEditingBudget(b);
    setEditBudgetAmount(b.promisedAmount);
    setEditBudgetNotes(b.notes || '');
  };

  const handleSaveEditBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageFinance || !editingBudget) return;
    Storage.updatePromiseBudget({
      ...editingBudget,
      promisedAmount: Number(editBudgetAmount),
      notes: editBudgetNotes.trim() || undefined,
    });
    setEditingBudget(null);
    onDataChanged();
  };

  const handleDeleteBudget = (id: string, name: string) => {
    if (!canManageFinance) return;
    if (window.confirm(`Are you sure you want to delete Promise Budget for "${name}"?`)) {
      Storage.deletePromiseBudget(id);
      onDataChanged();
    }
  };

  const handleOpenEditExpense = (exp: ExpenseRecord) => {
    if (!canManageFinance) return;
    setEditingExpense(exp);
    setExpenseTitle(exp.title);
    setExpenseCategory(exp.category);
    setExpenseAmount(exp.amount);
    setExpenseSpentBy(exp.spentBy);
    setExpenseNotes(exp.notes || '');
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = (id: string, title: string) => {
    if (!canManageFinance) return;
    if (window.confirm(`Are you sure you want to delete expense "${title}"?`)) {
      Storage.deleteExpense(id);
      onDataChanged();
    }
  };

  const handleOpenEditPayment = (p: PaymentTransaction) => {
    if (!canManageFinance) return;
    setEditingPayment(p);
    setEditPaymentAmount(p.amount);
    setEditPaymentMethod(p.paymentMethod);
    setEditPaymentNotes(p.notes || '');
  };

  const handleSaveEditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageFinance || !editingPayment) return;
    Storage.updatePayment({
      ...editingPayment,
      amount: Number(editPaymentAmount),
      paymentMethod: editPaymentMethod,
      notes: editPaymentNotes.trim() || undefined,
    });
    setEditingPayment(null);
    onDataChanged();
  };

  const handleDeletePayment = (id: string, memberHming: string, amount: number) => {
    if (!canManageFinance) return;
    if (window.confirm(`Are you sure you want to delete payment receipt of ₹${amount} for "${memberHming}"?`)) {
      Storage.deletePayment(id);
      onDataChanged();
    }
  };

  // Form states for Recording Payment
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(100);
  const [paymentMethod, setPaymentMethod] = useState<PaymentTransaction['paymentMethod']>('GPay / UPI');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Form states for Pledge / Promise Budget
  const [pledgeMemberId, setPledgeMemberId] = useState<string>(currentUser?.id || '');
  const [pledgeAmount, setPledgeAmount] = useState<number>(100);
  const [pledgeNotes, setPledgeNotes] = useState('');

  // Form states for Add Expense
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseRecord['category']>('Refreshment');
  const [expenseAmount, setExpenseAmount] = useState<number>(500);
  const [expenseSpentBy, setExpenseSpentBy] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Filtered Promise Budgets
  const filteredBudgets = budgets.filter((b) => {
    const matchSearch =
      b.memberHming.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.memberVeng.toLowerCase().includes(searchTerm.toLowerCase());

    const isOB = isOBRole(b.memberRole);
    const isPaid = b.paidAmount >= b.promisedAmount;

    let matchFilter = true;
    if (roleFilter === 'OB') matchFilter = isOB;
    if (roleFilter === 'MEMBER') matchFilter = !isOB;
    if (roleFilter === 'PAID') matchFilter = isPaid;
    if (roleFilter === 'PENDING') matchFilter = !isPaid;

    return matchSearch && matchFilter;
  });

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageFinance) return;
    if (!selectedBudgetId || paymentAmount <= 0) return;

    const targetBudget = budgets.find((b) => b.id === selectedBudgetId);
    if (!targetBudget) return;

    Storage.recordPayment({
      budgetId: targetBudget.id,
      memberId: targetBudget.memberId,
      memberHming: targetBudget.memberHming,
      amount: Number(paymentAmount),
      recordedBy: currentUser ? `${currentUser.hming} (${currentUser.role})` : 'Treasurer',
      paymentMethod,
      notes: paymentNotes.trim() || undefined,
    });

    setShowRecordPaymentModal(false);
    setSelectedBudgetId('');
    setPaymentAmount(100);
    setPaymentNotes('');
    onDataChanged();
  };

  const handlePledgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pledgeAmount < 100) {
      alert('Branch inremtihna angin Member budget chu cheng 100 aia tlem a theih loh a ni.');
      return;
    }

    const members = Storage.getMembers();
    const targetMember = members.find((m) => m.id === pledgeMemberId) || currentUser;
    if (!targetMember) return;

    Storage.createOrUpdatePromiseBudget({
      memberId: targetMember.id,
      memberHming: targetMember.hming,
      memberVeng: targetMember.veng,
      memberRole: targetMember.role,
      year: 2026,
      promisedAmount: Number(pledgeAmount),
      notes: pledgeNotes.trim() || undefined,
    });

    setShowPledgeModal(false);
    setPledgeNotes('');
    onDataChanged();
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageFinance) return;
    if (!expenseTitle.trim() || expenseAmount <= 0) return;

    if (editingExpense) {
      Storage.updateExpense({
        ...editingExpense,
        title: expenseTitle.trim(),
        category: expenseCategory,
        amount: Number(expenseAmount),
        spentBy: expenseSpentBy.trim() || (currentUser?.hming || 'Branch'),
        notes: expenseNotes.trim() || undefined,
      });
      setEditingExpense(null);
    } else {
      Storage.addExpense({
        title: expenseTitle.trim(),
        category: expenseCategory,
        amount: Number(expenseAmount),
        date: new Date().toISOString().split('T')[0],
        spentBy: expenseSpentBy.trim() || (currentUser?.hming || 'Branch'),
        approvedBy: currentUser ? `${currentUser.hming} (${currentUser.role})` : 'Treasurer',
        notes: expenseNotes.trim() || undefined,
      });
    }

    setShowExpenseModal(false);
    setExpenseTitle('');
    setExpenseSpentBy('');
    setExpenseNotes('');
    onDataChanged();
  };

  const handleExportFinanceExcel = () => {
    const data = budgets.map((b, idx) => ({
      'Sl No': idx + 1,
      'Hming': b.memberHming,
      'Veng': b.memberVeng,
      'Role': b.memberRole,
      'Intiam Zat (Rs)': b.promisedAmount,
      'Pek Tawh Zat (Rs)': b.paidAmount,
      'La Ba (Rs)': Math.max(0, b.promisedAmount - b.paidAmount),
      'Status': b.paidAmount >= b.promisedAmount ? 'Pek Kim' : 'Pending',
      'Last Payment Date': b.lastPaymentDate || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Promise Budget 2026');
    XLSX.writeFile(workbook, 'KPG_Darlawn_Finance_Budget_2026.xlsx');
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in">
      {/* Top Banner Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sum Dinhmun / Branch Finance 2026
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Intiam Budget (OBs voluntary & member min. Rs 100), Collections & Expenses
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportFinanceExcel}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export Report</span>
          </button>

          {/* Record payment (Treasurer/Fin Sec/OBs) */}
          {isFinManager && (
            <button
              onClick={() => {
                if (budgets.length > 0) setSelectedBudgetId(budgets[0].id);
                setShowRecordPaymentModal(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-600 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          )}

          {/* Member or OB set/update pledge */}
          <button
            onClick={() => {
              if (!currentUser) {
                onOpenLogin();
                return;
              }
              setPledgeMemberId(currentUser.id);
              setPledgeAmount(myBudget?.promisedAmount || 100);
              setShowPledgeModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-sm"
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Intiam Budget Thehlut</span>
          </button>
        </div>
      </div>

      {/* 4 CORE KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Promised */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Intiam Zawng Zawng</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ₹{summary.totalPromised.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            OB & Members Target
          </p>
        </div>

        {/* Total Collected */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Hmuh Tawh Zat</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            ₹{summary.totalCollected.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {summary.percentCollected}% Collected
          </p>
        </div>

        {/* Total Expenses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Sum Hmanral</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">
            ₹{summary.totalExpenses.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {expenses.length} Expense vouchers
          </p>
        </div>

        {/* Current Net Balance */}
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/50 p-4.5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <span>Sum Bawm Balance</span>
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-900">
            ₹{summary.currentBalance.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
            Current Available Fund
          </p>
        </div>
      </div>

      {/* COLLECTION PROGRESS BAR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-800">
            Promise Budget Collection Status ({summary.percentCollected}% of target)
          </span>
          <span className="text-slate-500">
            ₹{summary.totalCollected.toLocaleString()} / ₹{summary.totalPromised.toLocaleString()}
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-700 to-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, summary.percentCollected)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <span>La hmuh hmabak: ₹{summary.totalPending.toLocaleString()}</span>
          <span>Budget neitu: {summary.totalMembersWithBudget} members</span>
        </div>
      </div>

      {/* MY PROMISE BUDGET STATUS (For Logged in User) */}
      {currentUser && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {currentUser.hming} (I Sum Dinhmun)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Intiam zat:{' '}
                <strong className="text-slate-900 font-bold">
                  ₹{myBudget?.promisedAmount || 100}
                </strong>{' '}
                • Pek tawh zat:{' '}
                <strong className="text-emerald-700 font-bold">
                  ₹{myBudget?.paidAmount || 0}
                </strong>
                {myBudget && myBudget.promisedAmount > (myBudget.paidAmount || 0) && (
                  <span className="text-rose-600 ml-2 font-semibold">
                    (La ba: ₹{myBudget.promisedAmount - myBudget.paidAmount})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {myBudget && myBudget.paidAmount >= myBudget.promisedAmount ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Pek Kim Tawh ✓</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>La Pe Kim Lo</span>
              </span>
            )}

            <button
              onClick={() => {
                setPledgeMemberId(currentUser.id);
                setPledgeAmount(myBudget?.promisedAmount || 100);
                setShowPledgeModal(true);
              }}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 underline px-2 py-1"
            >
              Update Pledge
            </button>
          </div>
        </div>
      )}

      {/* NAVIGATION SUB-TABS */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('budgets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'budgets'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          <span>Intiam Budget ({budgets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'expenses'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Sum Hmanral ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'transactions'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Receipts Log ({payments.length})</span>
        </button>
      </div>

      {/* TAB 1: PROMISE BUDGETS DIRECTORY */}
      {activeTab === 'budgets' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="relative sm:col-span-2">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search member budget by hming or veng..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Filter className="w-4 h-4" />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
              >
                <option value="ALL">All Members & OBs</option>
                <option value="OB">Office Bearers (OBs)</option>
                <option value="MEMBER">General Members</option>
                <option value="PAID">Pek Kim (Paid)</option>
                <option value="PENDING">La Pe Kim Lo (Pending)</option>
              </select>
            </div>
          </div>

          {/* Budget Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <tr>
                    <th className="py-3 px-4 font-bold uppercase text-[11px] text-slate-500">
                      #
                    </th>
                    <th className="py-3 px-4 font-bold uppercase text-[11px] text-blue-900">
                      Hming & Role
                    </th>
                    <th className="py-3 px-4 font-bold uppercase text-[11px] text-blue-900">
                      Veng
                    </th>
                    <th className="py-3 px-4 font-bold uppercase text-[11px] text-blue-900">
                      Intiam Zat
                    </th>
                    <th className="py-3 px-4 font-bold uppercase text-[11px] text-emerald-800">
                      Pek Tawh
                    </th>
                    <th className="py-3 px-4 font-bold uppercase text-[11px] text-slate-600">
                      Status
                    </th>
                    {isFinManager && (
                      <th className="py-3 px-4 font-bold uppercase text-[11px] text-right text-slate-600">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBudgets.length === 0 ? (
                    <tr>
                      <td colSpan={isFinManager ? 7 : 6} className="py-8 text-center text-slate-400">
                        Budget zawn hmuh a ni lo.
                      </td>
                    </tr>
                  ) : (
                    filteredBudgets.map((b, idx) => {
                      const isComplete = b.paidAmount >= b.promisedAmount;
                      const balance = Math.max(0, b.promisedAmount - b.paidAmount);
                      return (
                        <tr key={b.id} className="hover:bg-blue-50/40 transition">
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                              {b.memberHming}
                            </div>
                            <span className="text-[10px] text-blue-700 font-semibold">
                              {ROLE_LABELS[b.memberRole]}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {b.memberVeng}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            ₹{b.promisedAmount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                            ₹{b.paidAmount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            {isComplete ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Pek Kim</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                                <span>Ba: ₹{balance}</span>
                              </span>
                            )}
                          </td>
                          {isFinManager && (
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedBudgetId(b.id);
                                    setPaymentAmount(balance > 0 ? balance : 100);
                                    setShowRecordPaymentModal(true);
                                  }}
                                  className="rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition"
                                >
                                  Record Pekna
                                </button>
                                <button
                                  onClick={() => handleOpenEditBudget(b)}
                                  className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition"
                                  title="Edit Budget"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBudget(b.id, b.memberHming)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title="Delete Budget"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BRANCH EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Sum Hmanral / Expense Vouchers ({expenses.length})
            </h3>
            {isFinManager && (
              <button
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                      {exp.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{exp.date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{exp.title}</h4>
                  {exp.notes && (
                    <p className="text-xs text-slate-600">{exp.notes}</p>
                  )}
                  <div className="text-[11px] text-slate-400">
                    Spent by: <strong className="text-slate-700">{exp.spentBy}</strong> • Approved by: <strong className="text-slate-700">{exp.approvedBy}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-lg font-black text-rose-600 font-mono">
                    -₹{exp.amount.toLocaleString()}
                  </span>
                  {isFinManager && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditExpense(exp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition"
                        title="Edit expense"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(exp.id, exp.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT RECEIPTS AUDIT LOG */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            All Payment Receipts ({payments.length})
          </h3>

          <div className="space-y-2.5">
            {payments.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {p.memberHming}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Method: <strong className="text-blue-700">{p.paymentMethod}</strong> • Date: {p.date}
                  </div>
                  {p.notes && <p className="text-slate-500 text-[11px] italic mt-0.5">"{p.notes}"</p>}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-700 font-mono">
                      +₹{p.amount.toLocaleString()}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      Recv by: {p.recordedBy}
                    </div>
                  </div>

                  {isFinManager && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditPayment(p)}
                        className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition"
                        title="Edit payment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(p.id, p.memberHming, p.amount)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete payment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: RECORD PAYMENT */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Member Payment</h3>
                <p className="text-xs text-slate-500">Pekna chhinchhiahna</p>
              </div>
              <button
                onClick={() => setShowRecordPaymentModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Thlang rawh Member
                </label>
                <select
                  value={selectedBudgetId}
                  onChange={(e) => setSelectedBudgetId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  {budgets.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.memberHming} ({b.memberVeng}) - Intiam: ₹{b.promisedAmount} (Pe tawh: ₹{b.paidAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="GPay / UPI">GPay / UPI</option>
                  <option value="Cash">Cash (Kut ngeiin)</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Notes / Receipt Remark (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. September thla pual..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-600 shadow-sm"
                >
                  Save Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INTIAM BUDGET (PROMISE BUDGET SETTING) */}
      {showPledgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Intiam Budget Thehlut (2026)</h3>
                <p className="text-xs text-slate-500">
                  OBs voluntary budget & Member budget (not less than Rs 100)
                </p>
              </div>
              <button
                onClick={() => setShowPledgeModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePledgeSubmit} className="mt-4 space-y-3.5">
              {isFinManager ? (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Member Thlang Rawh
                  </label>
                  <select
                    value={pledgeMemberId}
                    onChange={(e) => setPledgeMemberId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    {Storage.getMembers().map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.hming} ({m.veng}) - {ROLE_LABELS[m.role]}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 font-semibold">
                  Member: {currentUser?.hming} ({currentUser?.veng})
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase text-slate-700">
                    Kum 2026 Intiam Zat (₹) *
                  </label>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Min: ₹100
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min={100}
                  value={pledgeAmount}
                  onChange={(e) => setPledgeAmount(Number(e.target.value))}
                  placeholder="e.g. 100, 500, 1000..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Branch dan: Member budget chu cheng 100 aia tlem loh tur a ni.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Note / Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={pledgeNotes}
                  onChange={(e) => setPledgeNotes(e.target.value)}
                  placeholder="e.g. Leader budget / Mahni inpekna..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPledgeModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-sm"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD EXPENSE */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Branch Expense</h3>
                <p className="text-xs text-slate-500">Sum hmanral chhinchhiahna</p>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Expense Title / Thupui
                </label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. Fellowship Refreshment / Sound..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Refreshment">Refreshment</option>
                    <option value="Camping">Camping</option>
                    <option value="Fellowship">Fellowship</option>
                    <option value="Sound & Tech">Sound & Tech</option>
                    <option value="Charity / Relief">Charity</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Spent By (Tunge hmangtu)
                </label>
                <input
                  type="text"
                  value={expenseSpentBy}
                  onChange={(e) => setExpenseSpentBy(e.target.value)}
                  placeholder="e.g. Pu Lalmuanpuia / Refreshment sub-committee"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Notes / Voucher No.
                </label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="e.g. Bill no. 124 / Voucher verified"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-500 shadow-sm"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: EDIT PROMISE BUDGET */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Promise Budget</h3>
                <p className="text-xs text-slate-500">{editingBudget.memberHming} ({editingBudget.memberVeng})</p>
              </div>
              <button
                onClick={() => setEditingBudget(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBudget} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Promised Amount / Intiam Zat (₹)
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  value={editBudgetAmount}
                  onChange={(e) => setEditBudgetAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={editBudgetNotes}
                  onChange={(e) => setEditBudgetNotes(e.target.value)}
                  placeholder="e.g. Paid in installments..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-600 shadow-sm"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PAYMENT RECEIPT */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Payment Receipt</h3>
                <p className="text-xs text-slate-500">{editingPayment.memberHming} ({editingPayment.date})</p>
              </div>
              <button
                onClick={() => setEditingPayment(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPayment} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editPaymentAmount}
                  onChange={(e) => setEditPaymentAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm font-bold text-emerald-800 focus:border-blue-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value as PaymentTransaction['paymentMethod'])}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="GPay / UPI">GPay / UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={editPaymentNotes}
                  onChange={(e) => setEditPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid in full..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm"
                >
                  Save Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
