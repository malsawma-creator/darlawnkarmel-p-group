import {
  Member,
  Notice,
  Competition,
  Submission,
  CommitteeMeeting,
  CommitteeRecord,
  BookReview,
  BookChallengeConfig,
  DEFAULT_BOOK_CHALLENGE_CONFIG,
  Suggestion,
  PromiseBudget,
  PaymentTransaction,
  ExpenseRecord,
  ExOfficio,
  GroupMember,
  UserRole,
  MemberStatus,
  HlaItem,
} from '../types';
import { NotificationService } from './notifications';
import { 
  addToFirestore, 
  updateInFirestore, 
  deleteFromFirestore, 
  clearCollectionInFirestore,
  seedFirestoreCollection,
  isFirestoreInitialized,
  markFirestoreInitialized,
  clearAllFirestoreCollections,
  COLLECTIONS 
} from './firebaseService';
import { safeSetItem } from './safeStorage';

const STORAGE_KEYS = {
  CURRENT_USER: 'kpg_current_user_v4',
  MEMBERS: 'kpg_members_v4',
  NOTICES: 'kpg_notices_v4',
  COMPETITIONS: 'kpg_competitions_v4',
  SUBMISSIONS: 'kpg_submissions_v4',
  MEETINGS: 'kpg_meetings_v4',
  RECORDS: 'kpg_records_v4',
  BOOK_REVIEWS: 'kpg_book_reviews_v4',
  SUGGESTIONS: 'kpg_suggestions_v4',
  PROMISE_BUDGETS: 'kpg_promise_budgets_v4',
  PAYMENTS: 'kpg_payments_v4',
  EXPENSES: 'kpg_expenses_v4',
  EX_OFFICIO: 'kpg_ex_officio_v4',
  HLA_BAWM: 'kpg_hla_bawm_v4',
  BOOK_CHALLENGE: 'kpg_book_challenge_v4',
  GROUP_MEMBER_LIST: 'kpg_group_member_list_v4',
  INITIALIZED: 'kpg_initialized_v4',
  CUSTOM_BANNER_BG: 'kpg_custom_banner_bg_v4',
};

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-3',
    hming: 'Joseph Malsawmzuala',
    veng: 'Kanan Veng',
    phone: '9862123456',
    email: 'jopes500@gmail.com',
    role: 'SECRETARY',
    status: 'Approved',
    isDeveloper: true,
    joinedDate: '2024-01-01',
  },
];

const INITIAL_PROMISE_BUDGETS: PromiseBudget[] = [];

const INITIAL_EXPENSES: ExpenseRecord[] = [];

const INITIAL_PAYMENTS: PaymentTransaction[] = [];

const INITIAL_NOTICES: Notice[] = [];

const INITIAL_COMPETITIONS: Competition[] = [];

const INITIAL_SUBMISSIONS: Submission[] = [];

const INITIAL_MEETINGS: CommitteeMeeting[] = [];

const INITIAL_RECORDS: CommitteeRecord[] = [];

const INITIAL_BOOK_REVIEWS: BookReview[] = [];

const INITIAL_EX_OFFICIO: ExOfficio[] = [];

const INITIAL_SUGGESTIONS: Suggestion[] = [];

const INITIAL_GROUP_MEMBERS: GroupMember[] = [];

export const Storage = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      safeSetItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
      safeSetItem(STORAGE_KEYS.NOTICES, JSON.stringify(INITIAL_NOTICES));
      safeSetItem(STORAGE_KEYS.COMPETITIONS, JSON.stringify(INITIAL_COMPETITIONS));
      safeSetItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
      safeSetItem(STORAGE_KEYS.MEETINGS, JSON.stringify(INITIAL_MEETINGS));
      safeSetItem(STORAGE_KEYS.RECORDS, JSON.stringify(INITIAL_RECORDS));
      safeSetItem(STORAGE_KEYS.BOOK_REVIEWS, JSON.stringify(INITIAL_BOOK_REVIEWS));
      safeSetItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(INITIAL_SUGGESTIONS));
      safeSetItem(STORAGE_KEYS.PROMISE_BUDGETS, JSON.stringify(INITIAL_PROMISE_BUDGETS));
      safeSetItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      safeSetItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
      safeSetItem(STORAGE_KEYS.EX_OFFICIO, JSON.stringify(INITIAL_EX_OFFICIO));
      safeSetItem(STORAGE_KEYS.HLA_BAWM, JSON.stringify([]));
      safeSetItem(STORAGE_KEYS.BOOK_CHALLENGE, JSON.stringify([DEFAULT_BOOK_CHALLENGE_CONFIG]));
      safeSetItem(STORAGE_KEYS.GROUP_MEMBER_LIST, JSON.stringify([]));
      safeSetItem(STORAGE_KEYS.INITIALIZED, 'true');
    }

    // Sanitize and remove all old hardcoded dummy/sample records if present
    this.cleanLocalStorageMockData();
  },

  cleanLocalStorageMockData() {
    const MOCK_MEMBER_IDS = ['mem-1', 'mem-2', 'mem-4', 'mem-5', 'mem-6', 'mem-7', 'mem-8', 'mem-9', 'mem-10', 'mem-11', 'mem-12', 'mem-pending-1'];
    const MOCK_NOTICE_IDS = ['not-1', 'not-2', 'not-3'];
    const MOCK_COMP_IDS = ['comp-1', 'comp-2'];
    const MOCK_MEET_IDS = ['meet-1'];
    const MOCK_REC_IDS = ['rec-1', 'rec-2'];
    const MOCK_SUG_IDS = ['sug-1', 'sug-2'];
    const MOCK_EXP_IDS = ['exp-1', 'exp-2', 'exp-3'];
    const MOCK_PAY_IDS = ['pay-1', 'pay-2', 'pay-3', 'pay-4'];
    const MOCK_PB_IDS = ['pb-1', 'pb-2', 'pb-4', 'pb-5', 'pb-6', 'pb-7', 'pb-8', 'pb-9', 'pb-10', 'pb-11', 'pb-12'];
    const MOCK_EXO_IDS = ['exo-1', 'exo-2', 'exo-3'];

    const filterOut = (key: string, mockIds: string[]) => {
      const str = localStorage.getItem(key);
      if (str) {
        try {
          const arr = JSON.parse(str);
          if (Array.isArray(arr)) {
            const filtered = arr.filter((item: any) => !mockIds.includes(item.id));
            if (filtered.length !== arr.length) {
              safeSetItem(key, JSON.stringify(filtered));
            }
          }
        } catch (e) {}
      }
    };

    filterOut(STORAGE_KEYS.MEMBERS, MOCK_MEMBER_IDS);
    filterOut(STORAGE_KEYS.NOTICES, MOCK_NOTICE_IDS);
    filterOut(STORAGE_KEYS.COMPETITIONS, MOCK_COMP_IDS);
    filterOut(STORAGE_KEYS.MEETINGS, MOCK_MEET_IDS);
    filterOut(STORAGE_KEYS.RECORDS, MOCK_REC_IDS);
    filterOut(STORAGE_KEYS.SUGGESTIONS, MOCK_SUG_IDS);
    filterOut(STORAGE_KEYS.EXPENSES, MOCK_EXP_IDS);
    filterOut(STORAGE_KEYS.PAYMENTS, MOCK_PAY_IDS);
    filterOut(STORAGE_KEYS.PROMISE_BUDGETS, MOCK_PB_IDS);
    filterOut(STORAGE_KEYS.EX_OFFICIO, MOCK_EXO_IDS);
  },

  getCurrentUser(): Member | null {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!str) {
      return null;
    }
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  },

  setCurrentUser(member: Member | null) {
    if (member) {
      safeSetItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(member));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getMembers(): Member[] {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    return str ? JSON.parse(str) : [];
  },

  saveMembers(members: Member[]) {
    safeSetItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  },

  // Add Member (Supports Pending status for self-registration)
  addMember(member: Omit<Member, 'id'>, isSelfRegistration = false): Member {
    const members = this.getMembers();
    const newMember: Member = {
      ...member,
      id: `mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: member.status || (isSelfRegistration ? 'Pending' : 'Approved'),
      joinedDate: member.joinedDate || new Date().toISOString().split('T')[0],
    };
    members.push(newMember);
    this.saveMembers(members);
    addToFirestore(COLLECTIONS.MEMBERS, newMember.id, newMember);

    // Auto pledge budget if approved
    if (newMember.status === 'Approved') {
      this.createOrUpdatePromiseBudget({
        memberId: newMember.id,
        memberHming: newMember.hming,
        memberVeng: newMember.veng,
        memberRole: newMember.role,
        year: 2026,
        promisedAmount: newMember.role === 'MEMBER' ? 100 : 300,
        paidAmount: 0,
      });
    }

    if (isSelfRegistration) {
      NotificationService.notifyNewMemberRegistered(
        newMember.hming,
        newMember.veng,
        newMember.phone
      );
    }

    return newMember;
  },

  updateMember(member: Member) {
    const members = this.getMembers().map((m) => (m.id === member.id ? member : m));
    this.saveMembers(members);
    updateInFirestore(COLLECTIONS.MEMBERS, member.id, member);

    // Sync in Promise budget
    const budgets = this.getPromiseBudgets();
    const bIndex = budgets.findIndex((b) => b.memberId === member.id);
    if (bIndex !== -1) {
      budgets[bIndex].memberHming = member.hming;
      budgets[bIndex].memberVeng = member.veng;
      budgets[bIndex].memberRole = member.role;
      this.savePromiseBudgets(budgets);
      updateInFirestore(COLLECTIONS.PROMISE_BUDGETS, budgets[bIndex].id, budgets[bIndex]);
    }

    const cur = this.getCurrentUser();
    if (cur && cur.id === member.id) {
      this.setCurrentUser(member);
    }
  },

  // Delete Member Permanently (Developer or OBs)
  deleteMember(id: string) {
    const members = this.getMembers().filter((m) => m.id !== id);
    this.saveMembers(members);
    deleteFromFirestore(COLLECTIONS.MEMBERS, id);

    // Also remove their promise budget
    const targetBudget = this.getPromiseBudgets().find((b) => b.memberId === id);
    if (targetBudget) {
      deleteFromFirestore(COLLECTIONS.PROMISE_BUDGETS, targetBudget.id);
    }
    const budgets = this.getPromiseBudgets().filter((b) => b.memberId !== id);
    this.savePromiseBudgets(budgets);

    const cur = this.getCurrentUser();
    if (cur && cur.id === id) {
      this.setCurrentUser(null);
    }
  },

  // Developer Only: Approve / Reject member
  updateMemberStatus(id: string, status: MemberStatus) {
    const members = this.getMembers();
    const member = members.find((m) => m.id === id);
    if (member) {
      member.status = status;
      this.saveMembers(members);
      updateInFirestore(COLLECTIONS.MEMBERS, id, { status });

      if (status === 'Approved') {
        this.createOrUpdatePromiseBudget({
          memberId: member.id,
          memberHming: member.hming,
          memberVeng: member.veng,
          memberRole: member.role,
          year: 2026,
          promisedAmount: member.role === 'MEMBER' ? 100 : 300,
          paidAmount: 0,
        });
      }
    }
  },

  // Developer Only: Assign Designation
  assignMemberDesignation(id: string, role: UserRole) {
    const members = this.getMembers();
    const member = members.find((m) => m.id === id);
    if (member) {
      member.role = role;
      this.saveMembers(members);
      updateInFirestore(COLLECTIONS.MEMBERS, id, { role });

      // Sync budget
      const budgets = this.getPromiseBudgets();
      const bIndex = budgets.findIndex((b) => b.memberId === id);
      if (bIndex !== -1) {
        budgets[bIndex].memberRole = role;
        this.savePromiseBudgets(budgets);
        updateInFirestore(COLLECTIONS.PROMISE_BUDGETS, budgets[bIndex].id, budgets[bIndex]);
      }

      const cur = this.getCurrentUser();
      if (cur && cur.id === id) {
        cur.role = role;
        this.setCurrentUser(cur);
      }
    }
  },

  // ---------------- FINANCE & SUM BAWM ----------------
  getPromiseBudgets(): PromiseBudget[] {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.PROMISE_BUDGETS);
    return str ? JSON.parse(str) : [];
  },

  savePromiseBudgets(budgets: PromiseBudget[]) {
    safeSetItem(STORAGE_KEYS.PROMISE_BUDGETS, JSON.stringify(budgets));
  },

  createOrUpdatePromiseBudget(data: Partial<PromiseBudget> & { memberId: string; promisedAmount: number }): PromiseBudget {
    const budgets = this.getPromiseBudgets();
    const existingIndex = budgets.findIndex((b) => b.memberId === data.memberId && (b.year === (data.year || 2026)));
    if (existingIndex !== -1) {
      budgets[existingIndex] = {
        ...budgets[existingIndex],
        ...data,
      };
      this.savePromiseBudgets(budgets);
      updateInFirestore(COLLECTIONS.PROMISE_BUDGETS, budgets[existingIndex].id, budgets[existingIndex]);
      return budgets[existingIndex];
    } else {
      const newBudget: PromiseBudget = {
        id: `pb-${Date.now()}`,
        memberId: data.memberId,
        memberHming: data.memberHming || 'Member',
        memberVeng: data.memberVeng || 'Darlawn',
        memberRole: data.memberRole || 'MEMBER',
        year: data.year || 2026,
        promisedAmount: data.promisedAmount,
        paidAmount: data.paidAmount || 0,
        notes: data.notes || '',
      };
      budgets.push(newBudget);
      this.savePromiseBudgets(budgets);
      addToFirestore(COLLECTIONS.PROMISE_BUDGETS, newBudget.id, newBudget);
      return newBudget;
    }
  },

  updatePromiseBudget(budget: PromiseBudget) {
    const budgets = this.getPromiseBudgets().map((b) => (b.id === budget.id ? budget : b));
    this.savePromiseBudgets(budgets);
    updateInFirestore(COLLECTIONS.PROMISE_BUDGETS, budget.id, budget);
  },

  deletePromiseBudget(id: string) {
    const budgets = this.getPromiseBudgets().filter((b) => b.id !== id);
    this.savePromiseBudgets(budgets);
    deleteFromFirestore(COLLECTIONS.PROMISE_BUDGETS, id);
  },

  getExpenses(): ExpenseRecord[] {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return str ? JSON.parse(str) : [];
  },

  addExpense(expense: Omit<ExpenseRecord, 'id'>): ExpenseRecord {
    const expenses = this.getExpenses();
    const newExp: ExpenseRecord = {
      ...expense,
      id: `exp-${Date.now()}`,
    };
    expenses.unshift(newExp);
    safeSetItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    addToFirestore(COLLECTIONS.EXPENSES, newExp.id, newExp);
    NotificationService.notifyNewUpdate('Sum Hmanral Thar', `${newExp.title}: ₹${newExp.amount}`);
    return newExp;
  },

  updateExpense(expense: ExpenseRecord) {
    const expenses = this.getExpenses().map((e) => (e.id === expense.id ? expense : e));
    safeSetItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    updateInFirestore(COLLECTIONS.EXPENSES, expense.id, expense);
  },

  deleteExpense(id: string) {
    const expenses = this.getExpenses().filter((e) => e.id !== id);
    safeSetItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    deleteFromFirestore(COLLECTIONS.EXPENSES, id);
  },

  getPayments(): PaymentTransaction[] {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return str ? JSON.parse(str) : [];
  },

  recordPayment(payment: Omit<PaymentTransaction, 'id' | 'date'>): PaymentTransaction {
    const payments = this.getPayments();
    const newPay: PaymentTransaction = {
      ...payment,
      id: `pay-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    payments.unshift(newPay);
    safeSetItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    addToFirestore(COLLECTIONS.PAYMENTS, newPay.id, newPay);

    // Update member's Promise Budget paidAmount
    const budgets = this.getPromiseBudgets();
    const budget = budgets.find((b) => b.id === payment.budgetId || b.memberId === payment.memberId);
    if (budget) {
      budget.paidAmount = (budget.paidAmount || 0) + payment.amount;
      budget.lastPaymentDate = newPay.date;
      this.savePromiseBudgets(budgets);
      updateInFirestore(COLLECTIONS.PROMISE_BUDGETS, budget.id, budget);
    }

    return newPay;
  },

  updatePayment(payment: PaymentTransaction) {
    const payments = this.getPayments().map((p) => (p.id === payment.id ? payment : p));
    safeSetItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    updateInFirestore(COLLECTIONS.PAYMENTS, payment.id, payment);
  },

  deletePayment(id: string) {
    const payments = this.getPayments();
    const pay = payments.find((p) => p.id === id);
    if (pay) {
      // Revert paidAmount on budget
      const budgets = this.getPromiseBudgets();
      const budget = budgets.find((b) => b.id === pay.budgetId || b.memberId === pay.memberId);
      if (budget) {
        budget.paidAmount = Math.max(0, (budget.paidAmount || 0) - pay.amount);
        this.savePromiseBudgets(budgets);
        updateInFirestore(COLLECTIONS.PROMISE_BUDGETS, budget.id, budget);
      }
    }
    const filtered = payments.filter((p) => p.id !== id);
    safeSetItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(filtered));
    deleteFromFirestore(COLLECTIONS.PAYMENTS, id);
  },

  getFinanceSummary() {
    const budgets = this.getPromiseBudgets();
    const expenses = this.getExpenses();

    const totalPromised = budgets.reduce((acc, b) => acc + (b.promisedAmount || 0), 0);
    const totalCollected = budgets.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const currentBalance = totalCollected - totalExpenses;
    const totalPending = Math.max(0, totalPromised - totalCollected);
    const percentCollected = totalPromised > 0 ? Math.round((totalCollected / totalPromised) * 100) : 0;

    return {
      totalPromised,
      totalCollected,
      totalExpenses,
      currentBalance,
      totalPending,
      percentCollected,
      totalMembersWithBudget: budgets.length,
    };
  },

  // ---------------- NOTICES ----------------
  getNotices(): Notice[] {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.NOTICES);
    return str ? JSON.parse(str) : [];
  },

  addNotice(notice: Omit<Notice, 'id'>): Notice {
    const notices = this.getNotices();
    const newNotice: Notice = {
      ...notice,
      id: `not-${Date.now()}`,
    };
    notices.unshift(newNotice);
    safeSetItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
    addToFirestore(COLLECTIONS.NOTICES, newNotice.id, newNotice);
    NotificationService.notifyNewUpdate(`Thuchhuah: ${newNotice.title}`, newNotice.content.slice(0, 70));
    return newNotice;
  },

  updateNotice(notice: Notice) {
    const notices = this.getNotices().map((n) => (n.id === notice.id ? notice : n));
    safeSetItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
    updateInFirestore(COLLECTIONS.NOTICES, notice.id, notice);
  },

  deleteNotice(id: string) {
    const notices = this.getNotices().filter((n) => n.id !== id);
    safeSetItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
    deleteFromFirestore(COLLECTIONS.NOTICES, id);
  },

  // ---------------- COMPETITIONS & SUBMISSIONS ----------------
  getCompetitions(): Competition[] {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.COMPETITIONS);
    return str ? JSON.parse(str) : [];
  },

  addCompetition(comp: Omit<Competition, 'id' | 'createdAt' | 'status'>): Competition {
    const comps = this.getCompetitions();
    const newComp: Competition = {
      ...comp,
      id: `comp-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Active',
    };
    comps.unshift(newComp);
    safeSetItem(STORAGE_KEYS.COMPETITIONS, JSON.stringify(comps));
    addToFirestore(COLLECTIONS.COMPETITIONS, newComp.id, newComp);
    NotificationService.notifyNewUpdate(`Intihsiakna Thar: ${newComp.title}`);
    return newComp;
  },

  updateCompetition(comp: Competition) {
    const comps = this.getCompetitions().map((c) => (c.id === comp.id ? comp : c));
    safeSetItem(STORAGE_KEYS.COMPETITIONS, JSON.stringify(comps));
    updateInFirestore(COLLECTIONS.COMPETITIONS, comp.id, comp);
  },

  deleteCompetition(id: string) {
    const comps = this.getCompetitions().filter((c) => c.id !== id);
    safeSetItem(STORAGE_KEYS.COMPETITIONS, JSON.stringify(comps));
    deleteFromFirestore(COLLECTIONS.COMPETITIONS, id);
  },

  getSubmissions(competitionId?: string): Submission[] {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    const all: Submission[] = str ? JSON.parse(str) : [];
    if (competitionId) {
      return all.filter((s) => s.competitionId === competitionId);
    }
    return all;
  },

  addSubmission(sub: Omit<Submission, 'id' | 'submittedAt' | 'votes' | 'marks'>): Submission {
    const subs = this.getSubmissions();
    const newSub: Submission = {
      ...sub,
      id: `sub-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      votes: [],
      marks: {},
    };
    subs.unshift(newSub);
    safeSetItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(subs));
    addToFirestore(COLLECTIONS.SUBMISSIONS, newSub.id, newSub);
    NotificationService.notifyNewUpdate(`Thlalak/Item thar thehluh a ni`, `${newSub.title} by ${newSub.memberHming}`);
    return newSub;
  },

  updateSubmission(sub: Submission) {
    const subs = this.getSubmissions().map((s) => (s.id === sub.id ? sub : s));
    safeSetItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(subs));
    updateInFirestore(COLLECTIONS.SUBMISSIONS, sub.id, sub);
  },

  deleteSubmission(id: string) {
    const subs = this.getSubmissions().filter((s) => s.id !== id);
    safeSetItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(subs));
    deleteFromFirestore(COLLECTIONS.SUBMISSIONS, id);
  },

  voteSubmission(submissionId: string, memberId: string): Submission {
    const subs = this.getSubmissions();
    const sub = subs.find((s) => s.id === submissionId);
    if (sub) {
      if (sub.votes.includes(memberId)) {
        sub.votes = sub.votes.filter((id) => id !== memberId);
      } else {
        sub.votes.push(memberId);
      }
      safeSetItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(subs));
      updateInFirestore(COLLECTIONS.SUBMISSIONS, sub.id, sub);
      return sub;
    }
    throw new Error('Submission not found');
  },

  markSubmission(submissionId: string, obMemberId: string, mark: number): Submission {
    const subs = this.getSubmissions();
    const sub = subs.find((s) => s.id === submissionId);
    if (sub) {
      if (!sub.marks) sub.marks = {};
      sub.marks[obMemberId] = mark;
      safeSetItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(subs));
      updateInFirestore(COLLECTIONS.SUBMISSIONS, sub.id, sub);
      return sub;
    }
    throw new Error('Submission not found');
  },

  // ---------------- MEETINGS ----------------
  getMeetings(): CommitteeMeeting[] {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.MEETINGS);
    return str ? JSON.parse(str) : [];
  },

  addMeeting(meeting: Omit<CommitteeMeeting, 'id' | 'attendees' | 'status'>): CommitteeMeeting {
    const meetings = this.getMeetings();
    const newMeet: CommitteeMeeting = {
      ...meeting,
      id: `meet-${Date.now()}`,
      status: 'Scheduled',
      attendees: [],
    };
    meetings.unshift(newMeet);
    safeSetItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
    addToFirestore(COLLECTIONS.MEETINGS, newMeet.id, newMeet);
    NotificationService.notifyNewUpdate(`OB Committee Meeting: ${newMeet.title}`, newMeet.dateTime);
    return newMeet;
  },

  updateMeeting(meeting: CommitteeMeeting) {
    const meetings = this.getMeetings().map((m) => (m.id === meeting.id ? meeting : m));
    safeSetItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
    updateInFirestore(COLLECTIONS.MEETINGS, meeting.id, meeting);
  },

  markMeetingAttendance(meetingId: string, member: Member): CommitteeMeeting {
    const meetings = this.getMeetings();
    const m = meetings.find((meet) => meet.id === meetingId);
    if (m) {
      const exists = m.attendees.find((a) => a.memberId === member.id);
      if (!exists) {
        m.attendees.push({
          memberId: member.id,
          hming: member.hming,
          role: member.role,
          presentAt: new Date().toISOString(),
        });
        safeSetItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
        updateInFirestore(COLLECTIONS.MEETINGS, m.id, m);
      }
      return m;
    }
    throw new Error('Meeting not found');
  },

  deleteMeeting(id: string) {
    const meetings = this.getMeetings().filter((m) => m.id !== id);
    safeSetItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
    deleteFromFirestore(COLLECTIONS.MEETINGS, id);
  },

  addMeetingAgendaItem(
    meetingId: string,
    item: { topic: string; description?: string; proposedBy: string; proposedByRole: string }
  ): CommitteeMeeting {
    const meetings = this.getMeetings();
    const m = meetings.find((meet) => meet.id === meetingId);
    if (m) {
      if (!m.agendaItems) m.agendaItems = [];
      m.agendaItems.push({
        ...item,
        id: `ag-${Date.now()}`,
        submittedAt: new Date().toISOString(),
      });
      safeSetItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
      updateInFirestore(COLLECTIONS.MEETINGS, m.id, m);
      return m;
    }
    throw new Error('Meeting not found');
  },

  deleteMeetingAgendaItem(meetingId: string, agendaItemId: string): CommitteeMeeting {
    const meetings = this.getMeetings();
    const m = meetings.find((meet) => meet.id === meetingId);
    if (m && m.agendaItems) {
      m.agendaItems = m.agendaItems.filter((a) => a.id !== agendaItemId);
      safeSetItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
      updateInFirestore(COLLECTIONS.MEETINGS, m.id, m);
      return m;
    }
    throw new Error('Meeting not found');
  },

  // ---------------- EX-OFFICIO ----------------
  getExOfficio(): ExOfficio[] {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.EX_OFFICIO);
    return str ? JSON.parse(str) : INITIAL_EX_OFFICIO;
  },

  addExOfficio(item: Omit<ExOfficio, 'id'>): ExOfficio {
    const list = this.getExOfficio();
    const newItem: ExOfficio = {
      ...item,
      id: `exo-${Date.now()}`,
    };
    list.push(newItem);
    safeSetItem(STORAGE_KEYS.EX_OFFICIO, JSON.stringify(list));
    addToFirestore(COLLECTIONS.EX_OFFICIO, newItem.id, newItem);
    return newItem;
  },

  updateExOfficio(item: ExOfficio) {
    const list = this.getExOfficio().map((e) => (e.id === item.id ? item : e));
    safeSetItem(STORAGE_KEYS.EX_OFFICIO, JSON.stringify(list));
    updateInFirestore(COLLECTIONS.EX_OFFICIO, item.id, item);
  },

  deleteExOfficio(id: string) {
    const list = this.getExOfficio().filter((e) => e.id !== id);
    safeSetItem(STORAGE_KEYS.EX_OFFICIO, JSON.stringify(list));
    deleteFromFirestore(COLLECTIONS.EX_OFFICIO, id);
  },

  // ---------------- RECORDS ----------------
  getRecords(): CommitteeRecord[] {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return str ? JSON.parse(str) : [];
  },

  addRecord(record: Omit<CommitteeRecord, 'id'>): CommitteeRecord {
    const recs = this.getRecords();
    const newRec: CommitteeRecord = {
      ...record,
      id: `rec-${Date.now()}`,
    };
    recs.unshift(newRec);
    safeSetItem(STORAGE_KEYS.RECORDS, JSON.stringify(recs));
    addToFirestore(COLLECTIONS.RECORDS, newRec.id, newRec);
    NotificationService.notifyNewUpdate(`Record Thar: ${newRec.title}`, newRec.content.slice(0, 60));
    return newRec;
  },

  updateRecord(record: CommitteeRecord) {
    const recs = this.getRecords().map((r) => (r.id === record.id ? record : r));
    safeSetItem(STORAGE_KEYS.RECORDS, JSON.stringify(recs));
    updateInFirestore(COLLECTIONS.RECORDS, record.id, record);
  },

  deleteRecord(id: string) {
    const recs = this.getRecords().filter((r) => r.id !== id);
    safeSetItem(STORAGE_KEYS.RECORDS, JSON.stringify(recs));
    deleteFromFirestore(COLLECTIONS.RECORDS, id);
  },

  // ---------------- BOOK REVIEWS ----------------
  getBookReviews(): BookReview[] {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.BOOK_REVIEWS);
    return str ? JSON.parse(str) : [];
  },

  addBookReview(rev: Omit<BookReview, 'id' | 'createdAt' | 'goodReads'>): BookReview {
    const reviews = this.getBookReviews();
    const newRev: BookReview = {
      ...rev,
      id: `bk-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      goodReads: [],
    };
    reviews.unshift(newRev);
    safeSetItem(STORAGE_KEYS.BOOK_REVIEWS, JSON.stringify(reviews));
    addToFirestore(COLLECTIONS.BOOK_REVIEWS, newRev.id, newRev);
    NotificationService.notifyNewUpdate(`Book Review Thar: ${newRev.lehkhabuHming}`, `by ${newRev.memberHming}`);
    return newRev;
  },

  updateBookReview(rev: BookReview) {
    const reviews = this.getBookReviews().map((b) => (b.id === rev.id ? rev : b));
    safeSetItem(STORAGE_KEYS.BOOK_REVIEWS, JSON.stringify(reviews));
    updateInFirestore(COLLECTIONS.BOOK_REVIEWS, rev.id, rev);
  },

  deleteBookReview(id: string) {
    const reviews = this.getBookReviews().filter((b) => b.id !== id);
    safeSetItem(STORAGE_KEYS.BOOK_REVIEWS, JSON.stringify(reviews));
    deleteFromFirestore(COLLECTIONS.BOOK_REVIEWS, id);
  },

  clearAllBookReviews() {
    safeSetItem(STORAGE_KEYS.BOOK_REVIEWS, JSON.stringify([]));
    clearCollectionInFirestore(COLLECTIONS.BOOK_REVIEWS);
  },

  toggleChhiarTha(bookId: string, obMemberId: string): BookReview {
    const reviews = this.getBookReviews();
    const rev = reviews.find((r) => r.id === bookId);
    if (rev) {
      if (rev.goodReads.includes(obMemberId)) {
        rev.goodReads = rev.goodReads.filter((id) => id !== obMemberId);
      } else {
        rev.goodReads.push(obMemberId);
      }
      safeSetItem(STORAGE_KEYS.BOOK_REVIEWS, JSON.stringify(reviews));
      updateInFirestore(COLLECTIONS.BOOK_REVIEWS, rev.id, rev);
      return rev;
    }
    throw new Error('Book not found');
  },

  // ---------------- BOOK READING CHALLENGE CONFIG (EDITABLE BY OB / ADMIN) ----------------
  getBookChallengeConfig(): BookChallengeConfig {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.BOOK_CHALLENGE);
    if (str) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { ...DEFAULT_BOOK_CHALLENGE_CONFIG, ...parsed[0] };
        }
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_BOOK_CHALLENGE_CONFIG, ...parsed };
        }
      } catch {
        // ignore and fallback
      }
    }
    return DEFAULT_BOOK_CHALLENGE_CONFIG;
  },

  updateBookChallengeConfig(config: Partial<BookChallengeConfig>, updatedBy?: string): BookChallengeConfig {
    const current = this.getBookChallengeConfig();
    const updated: BookChallengeConfig = {
      ...current,
      ...config,
      id: 'current',
      updatedBy: updatedBy || current.updatedBy,
      updatedAt: new Date().toISOString(),
    };
    safeSetItem(STORAGE_KEYS.BOOK_CHALLENGE, JSON.stringify([updated]));
    addToFirestore(COLLECTIONS.BOOK_CHALLENGE, 'current', updated);
    NotificationService.notifyNewUpdate(
      `Lehkhabu Chhiar Dan Thar: ${updated.title}`,
      `Target: ${updated.targetBooks} Books. ${updated.rules.slice(0, 50)}...`
    );
    return updated;
  },

  // ---------------- GROUP MEMBER LIST (SEPARATE COLLECTION) ----------------
  getGroupMembers(): GroupMember[] {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.GROUP_MEMBER_LIST);
    if (!str) return [];
    try {
      const parsed = JSON.parse(str);
      if (!Array.isArray(parsed)) return [];
      // Remove any leftover demo ids gm-1 through gm-5
      const DEMO_IDS = ['gm-1', 'gm-2', 'gm-3', 'gm-4', 'gm-5'];
      return parsed.filter((m) => !DEMO_IDS.includes(m.id));
    } catch {
      return [];
    }
  },

  addGroupMember(member: Omit<GroupMember, 'id' | 'createdAt'>): GroupMember {
    const list = this.getGroupMembers();
    const newMember: GroupMember = {
      ...member,
      id: `gm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newMember);
    safeSetItem(STORAGE_KEYS.GROUP_MEMBER_LIST, JSON.stringify(list));
    addToFirestore(COLLECTIONS.GROUP_MEMBER_LIST, newMember.id, newMember);
    NotificationService.notifyNewUpdate(`Group Member thar dah a ni`, `${newMember.hming} (${newMember.address})`);
    return newMember;
  },

  addGroupMembersBulk(members: Omit<GroupMember, 'id' | 'createdAt'>[]): GroupMember[] {
    const list = this.getGroupMembers();
    const created: GroupMember[] = [];
    members.forEach((m, idx) => {
      const newMember: GroupMember = {
        ...m,
        id: `gm-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date().toISOString(),
      };
      list.unshift(newMember);
      created.push(newMember);
      addToFirestore(COLLECTIONS.GROUP_MEMBER_LIST, newMember.id, newMember);
    });
    safeSetItem(STORAGE_KEYS.GROUP_MEMBER_LIST, JSON.stringify(list));
    NotificationService.notifyNewUpdate(`Group Members thar (${created.length}) dah a ni`, `List a in-update e.`);
    return created;
  },

  updateGroupMember(member: GroupMember) {
    const list = this.getGroupMembers().map((m) => (m.id === member.id ? member : m));
    safeSetItem(STORAGE_KEYS.GROUP_MEMBER_LIST, JSON.stringify(list));
    updateInFirestore(COLLECTIONS.GROUP_MEMBER_LIST, member.id, member);
  },

  deleteGroupMember(id: string) {
    const list = this.getGroupMembers().filter((m) => m.id !== id);
    safeSetItem(STORAGE_KEYS.GROUP_MEMBER_LIST, JSON.stringify(list));
    deleteFromFirestore(COLLECTIONS.GROUP_MEMBER_LIST, id);
  },

  // ---------------- SUGGESTIONS ----------------
  getSuggestions(): Suggestion[] {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.SUGGESTIONS);
    return str ? JSON.parse(str) : [];
  },

  addSuggestion(sug: Omit<Suggestion, 'id' | 'createdAt' | 'status'>): Suggestion {
    const sugs = this.getSuggestions();
    const newSug: Suggestion = {
      ...sug,
      id: `sug-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'New',
    };
    sugs.unshift(newSug);
    safeSetItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(sugs));
    addToFirestore(COLLECTIONS.SUGGESTIONS, newSug.id, newSug);
    return newSug;
  },

  updateSuggestion(sug: Suggestion) {
    const sugs = this.getSuggestions().map((s) => (s.id === sug.id ? sug : s));
    safeSetItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(sugs));
    updateInFirestore(COLLECTIONS.SUGGESTIONS, sug.id, sug);
  },

  deleteSuggestion(id: string) {
    const sugs = this.getSuggestions().filter((s) => s.id !== id);
    safeSetItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(sugs));
    deleteFromFirestore(COLLECTIONS.SUGGESTIONS, id);
  },

  updateSuggestionStatus(id: string, status: Suggestion['status']) {
    const sugs = this.getSuggestions().map((s) => (s.id === id ? { ...s, status } : s));
    safeSetItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(sugs));
    updateInFirestore(COLLECTIONS.SUGGESTIONS, id, { status });
  },

  getHlaBawm(): HlaItem[] {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.HLA_BAWM);
    return str ? JSON.parse(str) : [];
  },

  deleteHlaItem(id: string) {
    const hla = this.getHlaBawm().filter((h) => h.id !== id);
    safeSetItem(STORAGE_KEYS.HLA_BAWM, JSON.stringify(hla));
    deleteFromFirestore(COLLECTIONS.HLA_BAWM, id);
  },

  async seedInitialData() {
    const initialized = await isFirestoreInitialized();
    if (!initialized) {
      console.log('Firestore not initialized. Seeding initial data...');
      await seedFirestoreCollection(COLLECTIONS.MEMBERS, INITIAL_MEMBERS);
      await seedFirestoreCollection(COLLECTIONS.NOTICES, INITIAL_NOTICES);
      await seedFirestoreCollection(COLLECTIONS.COMPETITIONS, INITIAL_COMPETITIONS);
      await seedFirestoreCollection(COLLECTIONS.SUBMISSIONS, INITIAL_SUBMISSIONS);
      await seedFirestoreCollection(COLLECTIONS.MEETINGS, INITIAL_MEETINGS);
      await seedFirestoreCollection(COLLECTIONS.RECORDS, INITIAL_RECORDS);
      await seedFirestoreCollection(COLLECTIONS.BOOK_REVIEWS, INITIAL_BOOK_REVIEWS);
      await seedFirestoreCollection(COLLECTIONS.SUGGESTIONS, INITIAL_SUGGESTIONS);
      await seedFirestoreCollection(COLLECTIONS.PROMISE_BUDGETS, INITIAL_PROMISE_BUDGETS);
      await seedFirestoreCollection(COLLECTIONS.EXPENSES, INITIAL_EXPENSES);
      await seedFirestoreCollection(COLLECTIONS.PAYMENTS, INITIAL_PAYMENTS);
      await seedFirestoreCollection(COLLECTIONS.EX_OFFICIO, INITIAL_EX_OFFICIO);
      await markFirestoreInitialized();
    }
  },

  async clearAllFirestoreData() {
    await clearAllFirestoreCollections();
  },

  async resetToDefault() {
    localStorage.clear();
    await clearAllFirestoreCollections();
    await seedFirestoreCollection(COLLECTIONS.MEMBERS, INITIAL_MEMBERS);
    await seedFirestoreCollection(COLLECTIONS.NOTICES, INITIAL_NOTICES);
    await seedFirestoreCollection(COLLECTIONS.COMPETITIONS, INITIAL_COMPETITIONS);
    await seedFirestoreCollection(COLLECTIONS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    await seedFirestoreCollection(COLLECTIONS.MEETINGS, INITIAL_MEETINGS);
    await seedFirestoreCollection(COLLECTIONS.RECORDS, INITIAL_RECORDS);
    await seedFirestoreCollection(COLLECTIONS.BOOK_REVIEWS, INITIAL_BOOK_REVIEWS);
    await seedFirestoreCollection(COLLECTIONS.SUGGESTIONS, INITIAL_SUGGESTIONS);
    await seedFirestoreCollection(COLLECTIONS.PROMISE_BUDGETS, INITIAL_PROMISE_BUDGETS);
    await seedFirestoreCollection(COLLECTIONS.EXPENSES, INITIAL_EXPENSES);
    await seedFirestoreCollection(COLLECTIONS.PAYMENTS, INITIAL_PAYMENTS);
    await seedFirestoreCollection(COLLECTIONS.EX_OFFICIO, INITIAL_EX_OFFICIO);
    await markFirestoreInitialized();
    this.init();
  },

  getCustomBannerBg(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_BANNER_BG);
  },

  setCustomBannerBg(base64: string | null) {
    if (base64) {
      safeSetItem(STORAGE_KEYS.CUSTOM_BANNER_BG, base64);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_BANNER_BG);
    }
  },
};
