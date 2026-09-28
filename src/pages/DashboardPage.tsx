import React, { useState } from 'react';
import { Member, CommitteeRecord, isOBRole, isDeveloperUser } from '../types';
import { Storage } from '../utils/storage';
import { PWAInstallButton } from '../components/PWAInstallButton';
import {
  Users,
  Award,
  ArrowRight,
  Sparkles,
  Wallet,
  Calendar,
  Video,
  FileText,
  Edit2,
  Trash2,
  X,
  Plus,
  Clock,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { TabType } from '../components/BottomNav';

interface DashboardPageProps {
  currentUser: Member | null;
  onNavigate: (tab: TabType) => void;
  onOpenLogin: () => void;
  onDataChanged: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentUser,
  onNavigate,
  onOpenLogin,
  onDataChanged,
}) => {
  const members = Storage.getMembers().filter((m) => m.status !== 'Pending');
  const obs = members.filter((m) => isOBRole(m.role));
  const meetings = Storage.getMeetings();
  const upcomingMeeting = meetings.find((m) => m.status === 'Scheduled');
  const records = Storage.getRecords();
  const finSummary = Storage.getFinanceSummary();

  const isOB = currentUser && isOBRole(currentUser.role);
  const isDev = isDeveloperUser(currentUser);
  const canEdit = isOB || isDev;

  // Edit / Add Record Modal state
  const [editingRecord, setEditingRecord] = useState<CommitteeRecord | null>(null);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [recordTitle, setRecordTitle] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordContent, setRecordContent] = useState('');

  const handleOpenEditRecord = (rec: CommitteeRecord) => {
    if (!canEdit) return;
    setEditingRecord(rec);
    setRecordTitle(rec.title);
    setRecordDate(rec.date);
    setRecordContent(rec.content);
  };

  const handleDeleteRecord = (id: string, title: string) => {
    if (!canEdit) return;
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      Storage.deleteRecord(id);
      onDataChanged();
    }
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordTitle.trim() || !recordContent.trim()) return;

    if (editingRecord) {
      Storage.updateRecord({
        ...editingRecord,
        title: recordTitle.trim(),
        date: recordDate,
        content: recordContent.trim(),
      });
      setEditingRecord(null);
    } else {
      Storage.addRecord({
        title: recordTitle.trim(),
        date: recordDate,
        content: recordContent.trim(),
        recordedBy: currentUser ? currentUser.hming : 'Office Bearer',
      });
      setShowAddRecordModal(false);
    }

    setRecordTitle('');
    setRecordContent('');
    onDataChanged();
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in">
      {/* ========================================================================= */}
      {/* 1. WELCOME BANNER (P Group, Darlawn Karmel Branch - NO Secretary Badge)    */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-0.5 text-xs font-bold text-amber-200 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Young Christian Youth • 2026 Online Portal</span>
            </div>

            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
              P Group, Darlawn Karmel Branch
            </h1>
            <p className="text-xs sm:text-sm font-medium text-blue-200 mt-0.5">
              Online Community, Records & Finance Hub
            </p>

            {/* Profile greeting on home - User name only, NO Secretary tag or Super Admin */}
            {currentUser && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1 text-xs text-white backdrop-blur-xs border border-white/10">
                <span>Chibai, <strong>{currentUser.hming}</strong></span>
              </div>
            )}
          </div>

          {!currentUser && (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-900 shadow hover:bg-amber-300 transition active:scale-95 self-start sm:self-center"
            >
              <span>Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* PWA Install helper */}
      <PWAInstallButton variant="large" />

      {/* ========================================================================= */}
      {/* 2. ONE SUM BAWM GREEN CARD (Balance, Progress %, Total)                    */}
      {/* ========================================================================= */}
      <div
        onClick={() => onNavigate('finance')}
        className="cursor-pointer group rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/70 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-emerald-400 transition"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-3.5 mb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-xs">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                  SUM BAWM (Kum 2026 Intiam Budget)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {finSummary.percentCollected}% Collected
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Faith Promise tlingkhawm leh Branch sum dinhmun
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-emerald-800 group-hover:text-emerald-900 transition">
            <span>View Full Finance Details</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Balance Display */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div className="sm:col-span-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Current Balance
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-800 font-mono tracking-tight mt-0.5">
              ₹{finSummary.currentBalance.toLocaleString()}
            </div>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">
                Hmuh tawh zat: <strong className="text-emerald-700 font-bold">₹{finSummary.totalCollected.toLocaleString()}</strong>
              </span>
              <span className="text-slate-500 font-mono">
                Target: ₹{finSummary.totalPromised.toLocaleString()}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden border border-emerald-100">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, finSummary.percentCollected)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>La hmuh hmabak: ₹{finSummary.totalPending.toLocaleString()}</span>
              <span>Expenses: ₹{finSummary.totalExpenses.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MEMBERS COUNT CARDS                                                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Total Members */}
        <div
          onClick={() => onNavigate('members')}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
              Directory
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {members.length}
            </div>
            <div className="text-xs font-bold text-slate-500 mt-0.5">Total Members</div>
          </div>
        </div>

        {/* Total Office Bearers */}
        <div
          onClick={() => onNavigate('hruaitute')}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm transition hover:border-amber-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              OB Committee
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
              {obs.length}
            </div>
            <div className="text-xs font-bold text-slate-500 mt-0.5">Office Bearers</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. UPCOMING MEETING                                                        */}
      {/* ========================================================================= */}
      {upcomingMeeting ? (
        <div
          onClick={() => onNavigate('hruaitute')}
          className="cursor-pointer rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/50 p-5 shadow-xs hover:border-blue-300 hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white shadow-xs shrink-0 mt-0.5">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                  Upcoming OB Committee
                </span>
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(upcomingMeeting.dateTime).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                  ,{' '}
                  {new Date(upcomingMeeting.dateTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {upcomingMeeting.title}
              </div>
              {upcomingMeeting.location && (
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{upcomingMeeting.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 self-start sm:self-auto">
            <span>View Meeting & Agenda</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Upcoming Meeting</div>
              <div className="text-[11px] text-slate-500">
                Tun dinhmunah Committee meeting ruahman thar a la awm lo.
              </div>
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => onNavigate('hruaitute')}
              className="text-xs font-bold text-blue-700 hover:underline"
            >
              Call Meeting →
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. RECENT RECORDS (With Edit & Delete Buttons for OB/Developer)            */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Recent Records & Minutes
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => {
                  setEditingRecord(null);
                  setRecordTitle('');
                  setRecordDate(new Date().toISOString().split('T')[0]);
                  setRecordContent('');
                  setShowAddRecordModal(true);
                }}
                className="text-xs font-bold text-white bg-blue-700 hover:bg-blue-600 px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('records')}
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="py-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
            Records ziah luh a la awm lo.
          </div>
        ) : (
          <div className="space-y-3">
            {records.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm hover:shadow transition space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{rec.title}</h3>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {rec.date} • Recorded by: <strong className="text-slate-700">{rec.recordedBy}</strong>
                    </div>
                  </div>

                  {/* EDIT & DELETE BUTTONS - Visible ONLY to OBs and Developer */}
                  {canEdit && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditRecord(rec)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition"
                        title="Edit Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(rec.id, rec.title)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                  {rec.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="pt-6 pb-2 text-center">
        <p className="text-[11px] text-slate-400 font-medium">
          © 2026 P Group, Darlawn Karmel Branch
        </p>
      </div>

      {/* MODAL: ADD / EDIT RECORD */}
      {(showAddRecordModal || editingRecord) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingRecord ? 'Edit Committee Record' : 'Add Committee Record'}
              </h3>
              <button
                onClick={() => {
                  setShowAddRecordModal(false);
                  setEditingRecord(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Title / Thupui
                </label>
                <input
                  type="text"
                  required
                  value={recordTitle}
                  onChange={(e) => setRecordTitle(e.target.value)}
                  placeholder="e.g. OB Meeting No. 5 Minutes..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Content / Thurelte
                </label>
                <textarea
                  rows={6}
                  required
                  value={recordContent}
                  onChange={(e) => setRecordContent(e.target.value)}
                  placeholder="Thurel kimchang ziak rawh..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRecordModal(false);
                    setEditingRecord(null);
                  }}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-600 shadow-sm"
                >
                  {editingRecord ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
