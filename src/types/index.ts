export type UserRole =
  | 'SECRETARY'
  | 'LEADER'
  | 'ASST_LEADER'
  | 'ASST_SECRETARY'
  | 'TREASURER'
  | 'FINANCE_SECRETARY' // Finance Treasurer
  | 'COMMITTEE_OB'
  | 'MEMBER';

export const ROLE_LABELS: Record<UserRole, string> = {
  SECRETARY: 'Secretary',
  LEADER: 'Leader',
  ASST_LEADER: 'Asst. Leader',
  ASST_SECRETARY: 'Asst. Secretary',
  TREASURER: 'Treasurer',
  FINANCE_SECRETARY: 'Finance Treasurer',
  COMMITTEE_OB: 'Committee Member',
  MEMBER: 'Member',
};

export const ROLE_ORDER: Record<UserRole, number> = {
  LEADER: 1,
  ASST_LEADER: 2,
  SECRETARY: 3,
  ASST_SECRETARY: 4,
  TREASURER: 5,
  FINANCE_SECRETARY: 6,
  COMMITTEE_OB: 7,
  MEMBER: 8,
};

export function isOBRole(role?: UserRole): boolean {
  if (!role) return false;
  return role !== 'MEMBER';
}

export function isSecretaryRole(role?: UserRole): boolean {
  return role === 'SECRETARY';
}

export function isFinanceManager(role?: UserRole): boolean {
  if (!role) return false;
  return ['TREASURER', 'FINANCE_SECRETARY', 'SECRETARY', 'LEADER'].includes(role);
}

export function isDeveloperUser(user: Member | null | undefined): boolean {
  if (!user) return false;
  if (user.isDeveloper) return true;
  // Fallback check by Developer phone or email
  return user.phone === '9862123456' || user.email === 'jopes500@gmail.com';
}

/**
 * Returns true if the user is the Developer or an appointed Office Bearer (OB).
 * Used to enforce that only Developer & Appointed OB have administrative powers.
 */
export function isAppointedOBOrDev(user: Member | null | undefined): boolean {
  if (!user) return false;
  return isDeveloperUser(user) || isOBRole(user.role);
}

export interface PromiseBudget {
  id: string;
  memberId: string;
  memberHming: string;
  memberVeng: string;
  memberRole: UserRole;
  year: number;
  promisedAmount: number; // e.g. Leader: 1000, Secretary: 500, Member min: 100
  paidAmount: number;
  lastPaymentDate?: string;
  notes?: string;
}

export interface PaymentTransaction {
  id: string;
  budgetId: string;
  memberId: string;
  memberHming: string;
  amount: number;
  date: string;
  recordedBy: string;
  paymentMethod: 'Cash' | 'GPay / UPI' | 'Bank Transfer';
  notes?: string;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: 'Refreshment' | 'Camping' | 'Fellowship' | 'Sound & Tech' | 'Charity / Relief' | 'Stationery' | 'Other';
  amount: number;
  date: string;
  spentBy: string;
  approvedBy: string;
  notes?: string;
}

export type MemberStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Member {
  id: string;
  hming: string; // Name (Mizo label)
  veng: string;  // Neighborhood/Address (Mizo label)
  phone: string; // Phone (10 digits)
  role: UserRole;
  status?: MemberStatus;
  isDeveloper?: boolean;
  email?: string;
  joinedDate?: string;
  avatarUrl?: string;
  photoUrl?: string;
  notificationsEnabled?: boolean;
}

export interface GroupMember {
  id: string;
  hming: string;    // Name
  phone: string;    // Phone
  address: string;  // Address / Veng
  createdAt?: string;
  addedBy?: string;
}

export interface ExOfficio {
  id: string;
  hming: string;
  designation: string; // e.g. Kohhran Aiawh / Senior Adviser, Bial Pastor
  veng: string;
  phone: string;
  notes?: string;
  avatarUrl?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'Important' | 'General' | 'Fellowship' | 'Programme';
  postedBy: string;
  pinned?: boolean;
}

export type BibleCompetitionType =
  | 'mixed_mode'         // 🔀 Mixed Mode (Mix vek)
  | 'mcq_classic'        // 🧠 MCQ Classic - Zawhna pangngai
  | 'verse_detective'    // 🔍 Verse Detective - Chang dik leh dik lo zawn chhuah
  | 'connect_pair'       // 🧩 Connect The Pair - Thil inzawm zawm (Left & Right)
  | 'word_scramble'      // 🔤 Word Scramble - Thumal chhiarlet
  | 'emoji_story'        // 😇 Emoji Bible Story - Emoji atanga Bible chanchin hriat
  | 'two_truths_one_lie' // 🤥 2 Truths 1 Lie - Thu 2 dik, 1 daw
  | 'fill_blank';        // ✍️ Fill The Blank - Bible chang ruak hnawhkhah

export interface BibleQuestion {
  id: string;
  type?: BibleCompetitionType;
  question: string;
  // For MCQ, Emoji Story, Fill The Blank
  options?: string[];
  correctAnswer?: number; // index of correct option
  // For Verse Detective (true/false)
  isCorrect?: boolean;
  correctionNote?: string;
  // For Word Scramble
  scrambledWord?: string;
  correctWord?: string;
  // For Connect The Pair
  pairs?: { left: string; right: string }[];
  // For 2 Truths 1 Lie
  statements?: { text: string; isLie: boolean }[];
  lieExplanation?: string;
  // Verse Reveal Feature (Must have)
  verseRef: string;
  verseText: string;
  points?: number;
  hasHiddenChest?: boolean;
}

export interface Competition {
  id: string;
  title: string;
  type: string; // Photography, Video, Essay, Singing, Art, Quiz, or BibleCompetitionType
  description: string;
  lastDate: string;
  createdBy: string;
  createdAt: string;
  status: 'Draft' | 'Active' | 'Closed';
  competitionType?: BibleCompetitionType;
  timerSeconds?: number;
  pointsPerQuestion?: number;
  weekTitle?: string;
  quizData?: {
    timerSeconds?: number;
    pointsPerQuestion?: number;
    competitionType?: BibleCompetitionType;
    questions: BibleQuestion[];
  };
}

export interface LeaguePlayHistory {
  competitionId: string;
  weekTitle: string;
  type: string;
  score: number;
  maxScore: number;
  date: string;
  speedBonus?: number;
  hiddenChestBonus?: number;
  streakBonus?: number;
  totalEarned: number;
}

export interface LeagueScore {
  id: string;
  userId: string;
  userName: string;
  userVeng?: string;
  totalPoints: number; // A pung zel, a bo ngai lo
  weeksPlayed: number;
  currentStreak: number;
  lastPlayedWeek?: string;
  history: LeaguePlayHistory[];
  updatedAt: string;
}

export interface Submission {
  id: string;
  competitionId: string;
  memberId: string;
  memberHming: string;
  memberVeng: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: 'image' | 'video' | 'document';
  submittedAt: string;
  votes: string[]; // Member IDs who liked/voted
  marks: Record<string, number>; // { [obMemberId]: score (1-10) }
}

export interface CommitteeAgendaItem {
  id: string;
  topic: string;
  description?: string;
  proposedBy: string;
  proposedByRole: string;
  submittedAt: string;
}

export interface CommitteeMeeting {
  id: string;
  title: string;
  meetUrl: string;
  location?: string;
  dateTime: string;
  agenda: string;
  agendaItems?: CommitteeAgendaItem[];
  status: 'Scheduled' | 'In Progress' | 'Completed';
  createdBy?: string;
  attendees: {
    memberId: string;
    hming: string;
    role: string;
    presentAt: string;
  }[];
}

export interface CommitteeRecord {
  id: string;
  title: string;
  date: string;
  content: string;
  recordedBy: string;
  photoUrl?: string;
}

export interface BookReview {
  id: string;
  lehkhabuHming: string;
  ziaktu?: string;
  review?: string;
  photo?: string;
  memberId: string;
  memberHming: string;
  createdAt: string;
  goodReads: string[];
}

export interface BookChallengeConfig {
  id: string; // 'current'
  title: string; // e.g. "5-Book Reading Challenge"
  targetBooks: number; // e.g. 5, or 3, or 10 - editable by OB
  rules: string; // e.g. "Reading a book which is not more than 100 pages..."
  rewardDescription: string; // e.g. "Branch hnen atangin Lawmman tha tak a hlan dawn e"
  isActive: boolean;
  updatedBy?: string;
  updatedAt?: string;
}

export const DEFAULT_BOOK_CHALLENGE_CONFIG: BookChallengeConfig = {
  id: 'current',
  title: '5-Book Reading Challenge',
  targetBooks: 5,
  rules: 'Kum 2026 chhung hian lehkhabu 5 tal chhiar chhuak la, lehkhabu chhiar thehlut rawh. Lehkhabu phêk 100 aia tam lo pawh chhiar theih a ni.',
  rewardDescription: 'Branch hnen atangin Lawmman tha tak a hlan dawn e.',
  isActive: true,
};

export interface Suggestion {
  id: string;
  content: string;
  isAnonymous: boolean;
  senderHming?: string;
  senderPhone?: string;
  senderId?: string;
  createdAt: string;
  status: 'New' | 'Reviewed' | 'In Action';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'member_registration' | 'update' | 'record' | 'contest' | 'suggestion';
  readBy: string[]; // Member IDs who have read
  forDeveloperOnly?: boolean;
  forOBOnly?: boolean;
}

export interface HlaItem {
  id: string;
  title: string;
  number?: string;
  artist?: string;
  category?: 'Branch Hla' | 'Pathian Ram Hla' | 'Thalai Hla' | 'Krismas Hla' | 'General';
  lyrics: string;
  submittedBy?: string;
  createdAt: string;
}

