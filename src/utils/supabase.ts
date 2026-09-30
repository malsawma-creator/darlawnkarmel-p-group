import { Storage } from './storage';
import {
  Member,
  PromiseBudget,
  PaymentTransaction,
  ExpenseRecord,
  Notice,
  Competition,
  Submission,
  CommitteeMeeting,
  CommitteeRecord,
  BookReview,
  Suggestion,
  ExOfficio,
  HlaItem,
} from '../types';

export interface SupabaseResponse<T = any> {
  data: T | null;
  error: { message: string } | null;
}

/**
 * Filter helper matching SQL ILIKE pattern '%term%'
 */
function matchesILike(val: any, pattern: string): boolean {
  if (val === null || val === undefined) return false;
  const str = String(val).toLowerCase();
  const cleaned = pattern.replace(/^%+|%+$/g, '').toLowerCase();
  return str.includes(cleaned);
}

/**
 * Supabase client compatible interface that integrates seamlessly
 * with the underlying reactive data layer and supports all required table operations.
 */
class QueryBuilder {
  private tableName: string;
  private action: 'delete' | 'select' | 'insert' | 'update' = 'select';
  private conditions: Array<{ type: 'eq' | 'neq' | 'ilike'; column: string; value: any }> = [];
  private payload: any = null;

  constructor(tableName: string) {
    this.tableName = tableName.toLowerCase();
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  select(fields = '*') {
    this.action = 'select';
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.payload = data;
    return this;
  }

  eq(column: string, value: any): Promise<SupabaseResponse> {
    this.conditions.push({ type: 'eq', column, value });
    return this.execute();
  }

  neq(column: string, value: any): QueryBuilder {
    this.conditions.push({ type: 'neq', column, value });
    return this;
  }

  ilike(column: string, pattern: string): Promise<SupabaseResponse> {
    this.conditions.push({ type: 'ilike', column, value: pattern });
    return this.execute();
  }

  // Allow chaining further filters before execute if returned as 'this'
  then(onfulfilled?: (value: SupabaseResponse) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<SupabaseResponse> {
    try {
      if (this.action === 'delete') {
        return this.executeDelete();
      } else if (this.action === 'select') {
        return this.executeSelect();
      }
      return { data: null, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || 'Supabase operation failed' } };
    }
  }

  private executeSelect(): SupabaseResponse {
    let items: any[] = [];
    switch (this.tableName) {
      case 'members':
      case 'mi':
        items = Storage.getMembers();
        break;
      case 'sum_bawm':
      case 'promise_budgets':
        items = Storage.getPromiseBudgets();
        break;
      case 'thurawn_bawm':
      case 'thurawn':
      case 'suggestions':
        items = Storage.getSuggestions();
        break;
      case 'hla_bawm':
      case 'hymns':
      case 'songs':
        items = Storage.getHlaBawm ? Storage.getHlaBawm() : [];
        break;
      case 'posts':
      case 'thupuan':
      case 'announcements':
      case 'notices':
        items = Storage.getNotices();
        break;
      case 'photo_contest':
      case 'submissions':
        items = Storage.getSubmissions();
        break;
      case 'competitions':
        items = Storage.getCompetitions();
        break;
      case 'events':
      case 'meetings':
        items = Storage.getMeetings();
        break;
      case 'records':
        items = Storage.getRecords();
        break;
      case 'book_reviews':
        items = Storage.getBookReviews();
        break;
      case 'expenses':
        items = Storage.getExpenses();
        break;
      case 'payments':
        items = Storage.getPayments();
        break;
      case 'ex_officio':
        items = Storage.getExOfficio();
        break;
      case 'league_scores':
      case 'league':
        items = (Storage.getLeagueScores ? Storage.getLeagueScores() : []).map((s: any) => ({
          user_id: s.userId,
          user_name: s.userName,
          total_points: s.totalPoints,
          weeks_played: s.weeksPlayed,
          current_streak: s.currentStreak,
          history: s.history,
        }));
        break;
      default:
        items = [];
    }

    // Apply conditions
    for (const cond of this.conditions) {
      if (cond.type === 'eq') {
        items = items.filter((x) => x[cond.column] === cond.value);
      } else if (cond.type === 'neq') {
        items = items.filter((x) => x[cond.column] !== cond.value);
      } else if (cond.type === 'ilike') {
        items = items.filter((x) => matchesILike(x[cond.column], cond.value));
      }
    }

    return { data: items, error: null };
  }

  private executeDelete(): SupabaseResponse {
    const isMatching = (item: any) => {
      if (this.conditions.length === 0) return true;
      return this.conditions.every((cond) => {
        let val = item[cond.column];
        // Handle alias field names
        if (val === undefined) {
          if (cond.column === 'name' && item.hming) val = item.hming;
          if (cond.column === 'hming' && item.name) val = item.name;
          if (cond.column === 'member_name') val = item.memberHming || item.member_name;
          if (cond.column === 'title' && item.lehkhabuHming) val = item.lehkhabuHming;
        }

        if (cond.type === 'eq') {
          return val === cond.value;
        } else if (cond.type === 'neq') {
          return val !== cond.value;
        } else if (cond.type === 'ilike') {
          return matchesILike(val, cond.value);
        }
        return true;
      });
    };

    switch (this.tableName) {
      case 'members':
      case 'mi': {
        const members = Storage.getMembers();
        const toDelete = members.filter(isMatching);
        toDelete.forEach((m) => Storage.deleteMember(m.id));
        return { data: toDelete, error: null };
      }

      case 'sum_bawm':
      case 'promise_budgets': {
        const budgets = Storage.getPromiseBudgets();
        const toDelete = budgets.filter(isMatching);
        toDelete.forEach((b) => Storage.deletePromiseBudget(b.id));
        return { data: toDelete, error: null };
      }

      case 'thurawn_bawm':
      case 'thurawn':
      case 'suggestions': {
        const sugs = Storage.getSuggestions();
        const toDelete = sugs.filter(isMatching);
        toDelete.forEach((s) => Storage.deleteSuggestion(s.id));
        return { data: toDelete, error: null };
      }

      case 'hla_bawm':
      case 'hymns':
      case 'songs': {
        const hymns = Storage.getHlaBawm();
        const toDelete = hymns.filter(isMatching);
        toDelete.forEach((h: HlaItem) => Storage.deleteHlaItem(h.id));
        return { data: toDelete, error: null };
      }

      case 'posts':
      case 'thupuan':
      case 'announcements':
      case 'notices': {
        const notices = Storage.getNotices();
        const toDelete = notices.filter(isMatching);
        toDelete.forEach((n) => Storage.deleteNotice(n.id));
        return { data: toDelete, error: null };
      }

      case 'photo_contest':
      case 'submissions': {
        const subs = Storage.getSubmissions();
        const toDelete = subs.filter(isMatching);
        toDelete.forEach((s) => Storage.deleteSubmission(s.id));
        return { data: toDelete, error: null };
      }

      case 'competitions': {
        const comps = Storage.getCompetitions();
        const toDelete = comps.filter(isMatching);
        toDelete.forEach((c) => Storage.deleteCompetition(c.id));
        return { data: toDelete, error: null };
      }

      case 'events':
      case 'meetings': {
        const meets = Storage.getMeetings();
        const toDelete = meets.filter(isMatching);
        toDelete.forEach((m) => Storage.deleteMeeting(m.id));
        return { data: toDelete, error: null };
      }

      case 'records': {
        const recs = Storage.getRecords();
        const toDelete = recs.filter(isMatching);
        toDelete.forEach((r) => Storage.deleteRecord(r.id));
        return { data: toDelete, error: null };
      }

      case 'book_reviews': {
        const bks = Storage.getBookReviews();
        const toDelete = bks.filter(isMatching);
        toDelete.forEach((b) => Storage.deleteBookReview(b.id));
        return { data: toDelete, error: null };
      }

      case 'expenses': {
        const exps = Storage.getExpenses();
        const toDelete = exps.filter(isMatching);
        toDelete.forEach((e) => Storage.deleteExpense(e.id));
        return { data: toDelete, error: null };
      }

      case 'payments': {
        const pays = Storage.getPayments();
        const toDelete = pays.filter(isMatching);
        toDelete.forEach((p) => Storage.deletePayment(p.id));
        return { data: toDelete, error: null };
      }

      case 'ex_officio': {
        const exos = Storage.getExOfficio();
        const toDelete = exos.filter(isMatching);
        toDelete.forEach((e) => Storage.deleteExOfficio(e.id));
        return { data: toDelete, error: null };
      }

      default:
        return { data: [], error: null };
    }
  }
}

export const supabase = {
  from(tableName: string) {
    return new QueryBuilder(tableName);
  },
};

/**
 * TASK 2: Hardcore delete of all demo data from all collections.
 * Executes the exact specified deletes:
 * - supabase.from('members').delete().ilike('name','%demo%')
 * - supabase.from('members').delete().ilike('name','%test%')
 * - supabase.from('members').delete().ilike('name','%John%')
 * - supabase.from('posts').delete().ilike('content','%demo%')
 * - supabase.from('thurawn_bawm').delete().ilike('title','%demo%')
 * - supabase.from('sum_bawm').delete().ilike('member_name','%demo%')
 * - supabase.from('photo_contest').delete().neq('id','00000000-0000-0000-0000-000000000000') // delete all demo photos, keep table empty for real uploads
 * - Do same ilike demo/test/lorem for ALL other tables
 */
export async function runHardcoreDemoCleanup(): Promise<void> {
  // Members
  await supabase.from('members').delete().ilike('name', '%demo%');
  await supabase.from('members').delete().ilike('name', '%test%');
  await supabase.from('members').delete().ilike('name', '%John%');

  // Posts / Thupuan / Announcements
  await supabase.from('posts').delete().ilike('content', '%demo%');
  await supabase.from('posts').delete().ilike('content', '%test%');
  await supabase.from('posts').delete().ilike('content', '%lorem%');
  await supabase.from('posts').delete().ilike('title', '%demo%');

  // Thurawn Bawm (Suggestions)
  await supabase.from('thurawn_bawm').delete().ilike('title', '%demo%');
  await supabase.from('thurawn_bawm').delete().ilike('content', '%demo%');
  await supabase.from('thurawn_bawm').delete().ilike('content', '%test%');

  // Sum Bawm (Promise Budgets / Finance)
  await supabase.from('sum_bawm').delete().ilike('member_name', '%demo%');
  await supabase.from('sum_bawm').delete().ilike('member_name', '%test%');
  await supabase.from('sum_bawm').delete().ilike('notes', '%demo%');

  // Photo contest - Delete all demo photos, keep empty for real uploads
  await supabase.from('photo_contest').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Competitions
  await supabase.from('competitions').delete().ilike('title', '%demo%');
  await supabase.from('competitions').delete().ilike('title', '%test%');

  // Events & Meetings
  await supabase.from('events').delete().ilike('title', '%demo%');
  await supabase.from('events').delete().ilike('title', '%test%');

  // Records
  await supabase.from('records').delete().ilike('title', '%demo%');
  await supabase.from('records').delete().ilike('title', '%test%');
  await supabase.from('records').delete().ilike('content', '%lorem%');

  // Book Reviews
  await supabase.from('book_reviews').delete().ilike('lehkhabuHming', '%demo%');
  await supabase.from('book_reviews').delete().ilike('lehkhabuHming', '%test%');
  await supabase.from('book_reviews').delete().ilike('lehkhabuHming', '%John%');

  // Hla Bawm
  await supabase.from('hla_bawm').delete().ilike('title', '%demo%');
  await supabase.from('hla_bawm').delete().ilike('title', '%test%');

  // Expenses & Payments
  await supabase.from('expenses').delete().ilike('title', '%demo%');
  await supabase.from('expenses').delete().ilike('title', '%test%');
  await supabase.from('payments').delete().ilike('notes', '%demo%');
  await supabase.from('payments').delete().ilike('notes', '%test%');
}
