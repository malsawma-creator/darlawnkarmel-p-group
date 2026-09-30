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
  ChevronRight,
  Maximize2,
  Camera,
} from 'lucide-react';
import { TabType } from '../components/BottomNav';
import { PhotoLightbox, LightboxPhoto } from '../components/PhotoLightbox';
import { MemberAvatar } from '../components/MemberAvatar';

interface DashboardPageProps {
  currentUser: Member | null;
  onNavigate: (tab: TabType) => void;
  onOpenLogin: () => void;
  onDataChanged: () => void;
  dataVersion?: number;
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

  // Feed Filter state
  const [feedFilter, setFeedFilter] = useState<'all' | 'notices' | 'competitions' | 'info'>('all');

  // Custom Banner State
  const [bannerBg, setBannerBg] = useState<string | null>(Storage.getCustomBannerBg());
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        Storage.setCustomBannerBg(result);
        setBannerBg(result);
        onDataChanged();
      }
    };
    reader.readAsDataURL(file);
  };

  // Photo Lightbox state
  const [lightboxPhotos, setLightboxPhotos] = useState<LightboxPhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  // Group Photo Banner state (Option 1)
  const [showGroupPhoto, setShowGroupPhoto] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kpg_hide_group_photo') !== 'true';
    } catch {
      return true;
    }
  });

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
    if (!canEdit) return;
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
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 pl-1.5 pr-3.5 py-1 text-xs text-white backdrop-blur-xs border border-white/15 shadow-xs">
                <MemberAvatar
                  name={currentUser.hming}
                  photoUrl={currentUser.photoUrl || currentUser.avatarUrl}
                  size={26}
                  showShadow={false}
                />
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
      {/* PROFESSIONAL & FANCY FILTERED TIMELINE NOTICE BOARD FEED                    */}
      {/* ========================================================================= */}
      {(() => {
        const notices = Storage.getNotices();
        const records = Storage.getRecords();
        const competitions = Storage.getCompetitions();
        const meetings = Storage.getMeetings();

        const allFeedItems = [
          ...notices.map((n) => ({
            id: n.id,
            type: 'notice' as const,
            badge: 'NOTICE',
            badgeClass: 'bg-rose-50 text-rose-700 border border-rose-100',
            dotClass: 'bg-rose-500 ring-4 ring-rose-50',
            title: n.title,
            snippet: n.content,
            timestamp: new Date(n.date || Date.now()).getTime(),
            path: `/notices/${n.id}`,
            raw: n,
          })),
          ...competitions.map((c) => ({
            id: c.id,
            type: 'competitions' as const,
            badge: c.type === 'quiz' ? 'QUIZ' : 'COMPETITION',
            badgeClass: 'bg-amber-50 text-amber-700 border border-amber-100',
            dotClass: 'bg-amber-500 ring-4 ring-amber-50',
            title: c.title,
            snippet: c.description,
            timestamp: new Date(c.createdAt || Date.now()).getTime(),
            path: `/competitions/${c.id}`,
            raw: c,
          })),
          ...records.map((r) => ({
            id: r.id,
            type: 'info' as const,
            badge: 'RECORD',
            badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
            dotClass: 'bg-emerald-500 ring-4 ring-emerald-50',
            title: r.title,
            snippet: r.content,
            timestamp: new Date(r.date || Date.now()).getTime(),
            path: `/information/${r.id}`,
            raw: r,
          })),
          ...meetings.map((m) => ({
            id: m.id,
            type: 'info' as const,
            badge: 'MEETING',
            badgeClass: 'bg-blue-50 text-blue-700 border border-blue-100',
            dotClass: 'bg-blue-500 ring-4 ring-blue-50',
            title: m.title,
            snippet: m.location ? `Meeting Hmun: ${m.location}` : 'OB & Committee Meeting',
            timestamp: new Date(m.dateTime || Date.now()).getTime(),
            path: `/meetings/${m.id}`,
            raw: m,
          })),
        ].sort((a, b) => b.timestamp - a.timestamp);

        const noticesCount = allFeedItems.filter(i => i.type === 'notice').length;
        const competitionsCount = allFeedItems.filter(i => i.type === 'competitions').length;
        const infoCount = allFeedItems.filter(i => i.type === 'info').length;

        const filteredItems = allFeedItems.filter(item => {
          if (feedFilter === 'notices') return item.type === 'notice';
          if (feedFilter === 'competitions') return item.type === 'competitions';
          if (feedFilter === 'info') return item.type === 'info';
          return true;
        }).slice(0, 20);

        const now = Date.now();
        const oneDay = 86400000;
        const oneWeek = oneDay * 7;

        const todayItems = filteredItems.filter((i) => (now - i.timestamp) < oneDay);
        const thisWeekItems = filteredItems.filter((i) => (now - i.timestamp) >= oneDay && (now - i.timestamp) < oneWeek);
        const earlierItems = filteredItems.filter((i) => (now - i.timestamp) >= oneWeek);

        const getRelativeTime = (ts: number) => {
          const diffMs = Date.now() - ts;
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);
          if (diffMins < 1) return 'Just now';
          if (diffMins < 60) return `${diffMins}m ago`;
          if (diffHours < 24) return `${diffHours}h ago`;
          if (diffDays === 1) return 'Yesterday';
          if (diffDays < 7) return `${diffDays}d ago`;
          return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
        };

        const renderCard = (item: any) => {
          return (
            <div
              key={item.id}
              onClick={() => {
                if (item.type === 'notice' || item.type === 'info') {
                  if (item.badge === 'MEETING') {
                    onNavigate('members');
                  } else {
                    onNavigate('records');
                  }
                } else if (item.type === 'competitions') {
                  try {
                    sessionStorage.setItem('kpg_intihsiakna_tab', item.badge === 'QUIZ' ? 'quizzes' : 'contests');
                  } catch {}
                  onNavigate('intihsiakna');
                }
              }}
              className="group relative flex items-start gap-3.5 cursor-pointer rounded-2xl border border-slate-100 bg-white p-4 shadow-xs transition hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5"
            >
              {/* Timeline Dot */}
              <div className={`mt-1.5 w-3 h-3 rounded-full shrink-0 z-10 ${item.dotClass}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${item.badgeClass}`}>
                      {item.badge}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition line-clamp-1">
                      {item.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap font-mono">
                      {getRelativeTime(item.timestamp)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>

                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.snippet}
                  </p>
                </div>
              </div>
            </div>
          );
        };

        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </div>
                <h2 className="text-base font-black tracking-tight text-slate-900">
                  Karmel P Group Updates
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-full">
                {allFeedItems.length} active
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar px-1">
              <button
                type="button"
                onClick={() => setFeedFilter('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${feedFilter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                All ({allFeedItems.length})
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('notices')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${feedFilter === 'notices' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Notices ({noticesCount})
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('competitions')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${feedFilter === 'competitions' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Quizzes & Competitions ({competitionsCount})
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('info')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${feedFilter === 'info' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Minutes & Info ({infoCount})
              </button>
            </div>

            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 shadow-sm">
                Tun dinhmunah thuchhuah/thaw thar he filter-ah hian a la awm lo.
              </div>
            ) : (
              <div className="relative space-y-4 pl-1">
                {/* Timeline vertical line */}
                <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-slate-200 pointer-events-none" />

                {todayItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-8">
                      Today
                    </div>
                    <div className="space-y-2.5">
                      {todayItems.map(renderCard)}
                    </div>
                  </div>
                )}

                {thisWeekItems.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-8">
                      This Week
                    </div>
                    <div className="space-y-2.5">
                      {thisWeekItems.map(renderCard)}
                    </div>
                  </div>
                )}

                {earlierItems.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-8">
                      Earlier
                    </div>
                    <div className="space-y-2.5">
                      {earlierItems.map(renderCard)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Separation divider between feed and finance card */}
      <div className="my-4 border-t border-slate-200" />

      {/* ========================================================================= */}
      {/* 2. ONE SUM BAWM GREEN CARD (Balance, Progress %, Total) - 40% More Compact */}
      {/* ========================================================================= */}
      <div
        onClick={() => onNavigate('finance')}
        className="cursor-pointer group rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/50 via-white to-emerald-50/40 p-3 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        {/* Left part: Title & Current Balance */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-950 leading-none">
              SUM BAWM (Kum 2026 Intiam Budget)
            </div>
            <div className="text-lg font-black text-emerald-800 font-mono tracking-tight mt-0.5 leading-none">
              ₹{finSummary.currentBalance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Right part: Progress Bar, Target & Progress details in one row */}
        <div className="flex-1 w-full max-w-xl flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3.5 justify-end text-[11px] font-semibold">
          <div className="text-slate-600 shrink-0 font-medium leading-none text-right">
            Hmuh tawh: <strong className="text-emerald-700 font-black">₹{finSummary.totalCollected.toLocaleString()}</strong> <span className="text-slate-300">/</span> <span className="text-slate-500 font-mono">Target: ₹{finSummary.totalPromised.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[120px]">
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-emerald-100/50">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, finSummary.percentCollected)}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 font-mono shrink-0 leading-none">
              {finSummary.percentCollected}%
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MEMBERS DIRECTORY CARD (Compact Smaller Height Banner style)           */}
      {/* ========================================================================= */}
      <div
        onClick={() => onNavigate('members')}
        className="group cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs transition hover:border-blue-300 hover:shadow-xs flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-800 leading-tight">Members Directory</div>
            <div className="text-[10px] text-slate-500 leading-none mt-0.5">Darlawn Karmel Branch P Group Members List</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full font-mono border border-blue-100">
            {members.length} Members
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. UPCOMING MEETING (Compact Single-Row style)                           */}
      {/* ========================================================================= */}
      {upcomingMeeting ? (
        <div
          onClick={() => onNavigate('members')}
          className="cursor-pointer rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/40 via-white to-blue-50/20 px-3.5 py-2.5 shadow-2xs hover:border-blue-300 transition flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700 text-white shrink-0 shadow-2xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 leading-none truncate">
                {upcomingMeeting.title}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                {new Date(upcomingMeeting.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(upcomingMeeting.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {upcomingMeeting.location && ` • Location: ${upcomingMeeting.location}`}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-400 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800 leading-none">Upcoming Meeting</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Tun dinhmunah Committee meeting thar a awm rih lo.</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. RECENT RECORDS (Compact minutes list with less padding)                 */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 pb-1">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
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
                className="text-[10px] font-black text-white bg-blue-700 hover:bg-blue-600 px-2 py-0.5 rounded transition inline-flex items-center gap-0.5 shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>Add Record</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('records')}
              className="text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="py-6 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
            Records ziah luh a la awm lo.
          </div>
        ) : (
          <div className="space-y-2">
            {records.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:shadow-xs transition space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-1">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{rec.title}</h3>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {rec.date} • Recorded by: <strong className="text-slate-600">{rec.recordedBy}</strong>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => handleOpenEditRecord(rec)}
                        className="rounded p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-700 transition"
                        title="Edit Record"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(rec.id, rec.title)}
                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed line-clamp-3">
                  {rec.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="pt-4 pb-2 text-center">
        <p className="text-[10px] text-slate-400 font-semibold">
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

      {/* Full-Screen Photo Lightbox */}
      <PhotoLightbox
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
        photos={lightboxPhotos}
        initialIndex={lightboxIndex}
      />
    </div>
  );
};
