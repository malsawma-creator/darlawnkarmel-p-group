import React, { useState } from 'react';
import { Member, CommitteeMeeting, ExOfficio, isOBRole, isSecretaryRole, ROLE_ORDER, ROLE_LABELS, isDeveloperUser, UserRole } from '../types';
import { Storage } from '../utils/storage';
import {
  Crown,
  Video,
  ExternalLink,
  CheckCircle,
  Calendar,
  Plus,
  PhoneCall,
  MessageCircle,
  Shield,
  Users,
  X,
  Sparkles,
  Lock,
  Share2,
  Trash2,
  UserMinus,
  Copy,
  Clock,
  MapPin,
  ListPlus,
  Edit2,
} from 'lucide-react';

interface HruaitutePageProps {
  currentUser: Member | null;
  onOpenLogin: () => void;
  onDataChanged: () => void;
  dataVersion?: number;
}

export const HruaitutePage: React.FC<HruaitutePageProps> = ({
  currentUser,
  onOpenLogin,
  onDataChanged,
}) => {
  const members = Storage.getMembers();
  const meetings = Storage.getMeetings();
  const exOfficio = Storage.getExOfficio();

  const obs = members
    .filter((m) => isOBRole(m.role))
    .sort((a, b) => (ROLE_ORDER[a.role] || 99) - (ROLE_ORDER[b.role] || 99));

  const leader = obs.find((m) => m.role === 'LEADER');
  const otherOBs = obs.filter((m) => m.role !== 'LEADER');

  const isOB = (currentUser && isOBRole(currentUser.role)) || isDeveloperUser(currentUser);

  // Meeting states
  const [showCreateMeetingModal, setShowCreateMeetingModal] = useState(false);
  const [meetTitle, setMeetTitle] = useState('KPG OB Committee Meeting');
  const [meetLocation, setMeetLocation] = useState('Secretary In (Darlawn Vengpui)');
  const [meetUrl, setMeetUrl] = useState('https://meet.google.com/kpg-darl-awn');
  const [meetDateTime, setMeetDateTime] = useState('');
  const [meetAgenda, setMeetAgenda] = useState('1. Branch hmalakna thlirletna\n2. Budget & Sum dinhmun\n3. Programme thar buatsaih');
  const [copiedMeetingId, setCopiedMeetingId] = useState<string | null>(null);

  // Agenda Submission states (OBs Only)
  const [showAddAgendaModal, setShowAddAgendaModal] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [agendaTopic, setAgendaTopic] = useState('');
  const [agendaDesc, setAgendaDesc] = useState('');

  // Ex-Officio Modal states
  const [showAddExOfficioModal, setShowAddExOfficioModal] = useState(false);
  const [editingExo, setEditingExo] = useState<ExOfficio | null>(null);
  const [exoHming, setExoHming] = useState('');
  const [exoDesignation, setExoDesignation] = useState('Senior Adviser');
  const [exoVeng, setExoVeng] = useState('Vengpui');
  const [exoPhone, setExoPhone] = useState('');
  const [exoNotes, setExoNotes] = useState('');

  // Edit OB states
  const [editingOB, setEditingOB] = useState<Member | null>(null);
  const [editOBPhone, setEditOBPhone] = useState('');
  const [editOBVeng, setEditOBVeng] = useState('Vengpui');
  const [editOBRole, setEditOBRole] = useState<UserRole>('COMMITTEE_OB');

  const handleOpenEditOB = (ob: Member) => {
    setEditingOB(ob);
    setEditOBPhone(ob.phone);
    setEditOBVeng(ob.veng);
    setEditOBRole(ob.role);
  };

  const handleSaveEditOB = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOB) return;
    Storage.updateMember({
      ...editingOB,
      phone: editOBPhone.replace(/\D/g, ''),
      veng: editOBVeng,
      role: editOBRole,
    });
    setEditingOB(null);
    onDataChanged();
  };

  const handleRemoveOB = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from Office Bearers? (This will keep them as a normal member)`)) {
      Storage.assignMemberDesignation(id, 'MEMBER');
      onDataChanged();
    }
  };

  const handleDeleteMemberCompletely = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" permanently from the database?\n\nThis will completely remove them from the group directory and delete their budgets.`)) {
      Storage.deleteMember(id);
      onDataChanged();
    }
  };

  const handleOpenEditExo = (exo: ExOfficio) => {
    setEditingExo(exo);
    setExoHming(exo.hming);
    setExoDesignation(exo.designation);
    setExoVeng(exo.veng);
    setExoPhone(exo.phone);
    setExoNotes(exo.notes || '');
  };

  const handleSaveEditExo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExo) return;
    Storage.updateExOfficio({
      ...editingExo,
      hming: exoHming.trim(),
      designation: exoDesignation,
      veng: exoVeng,
      phone: exoPhone.replace(/\D/g, ''),
      notes: exoNotes.trim() || undefined,
    });
    setEditingExo(null);
    onDataChanged();
  };

  const handleDeleteExo = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete Ex-Officio "${name}"?`)) {
      Storage.deleteExOfficio(id);
      onDataChanged();
    }
  };

  const handleDeleteMeeting = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete meeting "${title}"?`)) {
      Storage.deleteMeeting(id);
      onDataChanged();
    }
  };

  const handleAddExOfficioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exoHming.trim()) return;
    Storage.addExOfficio({
      hming: exoHming.trim(),
      designation: exoDesignation,
      veng: exoVeng,
      phone: exoPhone.replace(/\D/g, '') || `9436${Math.floor(100000 + Math.random() * 900000)}`,
      notes: exoNotes.trim() || undefined,
    });
    setExoHming('');
    setExoPhone('');
    setExoNotes('');
    setShowAddExOfficioModal(false);
    onDataChanged();
  };

  const handleMarkPresent = (meetingId: string) => {
    if (!currentUser || !isOB) {
      onOpenLogin();
      return;
    }
    Storage.markMeetingAttendance(meetingId, currentUser);
    onDataChanged();
  };

  const handleCreateMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isOB) {
      onOpenLogin();
      return;
    }
    if (!meetTitle.trim() || !meetUrl.trim() || !meetDateTime) return;

    Storage.addMeeting({
      title: meetTitle.trim(),
      meetUrl: meetUrl.trim(),
      location: meetLocation.trim() || 'Secretary In / Google Meet',
      dateTime: meetDateTime,
      agenda: meetAgenda.trim(),
      createdBy: `${currentUser.hming} (${ROLE_LABELS[currentUser.role] || currentUser.role})`,
    });

    setShowCreateMeetingModal(false);
    setMeetTitle('KPG OB Committee Meeting');
    setMeetLocation('Secretary In (Darlawn Vengpui)');
    setMeetAgenda('');
    onDataChanged();
  };

  const handleOpenAddAgenda = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setAgendaTopic('');
    setAgendaDesc('');
    setShowAddAgendaModal(true);
  };

  const handleAddAgendaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isOB || !selectedMeetingId || !agendaTopic.trim()) return;

    Storage.addMeetingAgendaItem(selectedMeetingId, {
      topic: agendaTopic.trim(),
      description: agendaDesc.trim() || undefined,
      proposedBy: currentUser.hming,
      proposedByRole: ROLE_LABELS[currentUser.role] || currentUser.role,
    });

    setShowAddAgendaModal(false);
    setAgendaTopic('');
    setAgendaDesc('');
    onDataChanged();
  };

  const handleDeleteAgendaItem = (meetingId: string, agendaItemId: string) => {
    if (!isOB) return;
    if (window.confirm('He Agenda rawtna hi paih i duh em?')) {
      Storage.deleteMeetingAgendaItem(meetingId, agendaItemId);
      onDataChanged();
    }
  };

  const handleCopyMeetingDetails = (meeting: CommitteeMeeting) => {
    const formattedDate = new Date(meeting.dateTime).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    
    let agendaContent = meeting.agenda;
    if (meeting.agendaItems && meeting.agendaItems.length > 0) {
      agendaContent += `\n\n📌 *Agenda Thehluh Te (Submitted by OBs):*\n` + 
        meeting.agendaItems.map((a, i) => `${i + 1}. ${a.topic} [${a.proposedBy} - ${a.proposedByRole}]`).join('\n');
    }

    const text = `📢 *KPG DARLAWN BRANCH OB COMMITTEE MEETING*\n\n📌 *Thupui:* ${meeting.title}\n📅 *Hunchhung:* ${formattedDate}\n📍 *Hmun (Place):* ${meeting.location || 'Secretary In / Google Meet'}\n\n📝 *Agenda:*\n${agendaContent}\n\n🎥 *Video Meeting Link (OB Access Only):*\n${meeting.meetUrl}\n\n(Hruaitute kim taka tel turin kan inngen a ni e)`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMeetingId(meeting.id);
      setTimeout(() => setCopiedMeetingId(null), 2500);
    }
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Hruaitute / Office Bearers
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                Kum 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              P Group, Darlawn Karmel Branch Leadership Team & OB Committee
            </p>
          </div>
        </div>

        {/* Call Committee Meeting Button: OB ONLY */}
        {isOB && (
          <button
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(19, 30, 0, 0);
              const iso = tomorrow.toISOString().slice(0, 16);
              setMeetDateTime(iso);
              setShowCreateMeetingModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-600 transition shadow-sm self-start sm:self-auto"
          >
            <Video className="w-4 h-4" />
            <span>Call Committee Meeting</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ONLINE COMMITTEE MEETING & AGENDA SECTION - STRICTLY FOR OBS ONLY         */}
      {/* ========================================================================= */}
      {isOB ? (
        <div className="space-y-4 rounded-2xl border-2 border-blue-200 bg-blue-50/40 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-700 text-white shadow-xs">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    OB Committee Portal
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 font-mono">
                    OB Access Only
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Logged in as <strong className="text-slate-800">{currentUser?.hming}</strong> ({ROLE_LABELS[currentUser?.role || 'MEMBER']})
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(19, 30, 0, 0);
                const iso = tomorrow.toISOString().slice(0, 16);
                setMeetDateTime(iso);
                setShowCreateMeetingModal(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-600 transition shadow-sm self-start sm:self-auto"
            >
              <Video className="w-4 h-4" />
              <span>Call Next Committee</span>
            </button>
          </div>

          {meetings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-blue-200 bg-white p-6 text-center text-slate-500 text-xs">
              <Video className="w-8 h-8 mx-auto text-blue-300 mb-2" />
              <p className="font-semibold text-slate-700">Tuna atan Committee Meeting ruahman a la awm lo.</p>
              <p className="text-slate-400 mt-0.5">
                Committee thar ko turin "Call Next Committee" button hmet rawh.
              </p>
            </div>
          ) : (
            meetings.map((meeting) => {
              const hasMarked =
                currentUser &&
                meeting.attendees?.some((a) => a.memberId === currentUser.id);

              return (
                <div
                  key={meeting.id}
                  className="relative overflow-hidden rounded-2xl border border-blue-200 bg-white p-4 sm:p-5 shadow-sm space-y-4"
                >
                  {/* Top Meeting Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white shadow-xs flex-shrink-0 mt-0.5">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-bold text-slate-900">
                          {meeting.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                          <span className="flex items-center gap-1 font-semibold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                            <Calendar className="w-3.5 h-3.5 text-blue-700" />
                            {new Date(meeting.dateTime).toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>

                          <span className="flex items-center gap-1 font-semibold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-100">
                            <MapPin className="w-3.5 h-3.5 text-purple-700" />
                            {meeting.location || 'Secretary In (Darlawn)'}
                          </span>

                          <span className="text-[11px] text-slate-500 font-mono">
                            • {meeting.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => handleCopyMeetingDetails(meeting)}
                        className="flex items-center gap-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                        title="Copy meeting notice to share on WhatsApp"
                      >
                        {copiedMeetingId === meeting.id ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Share Info</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteMeeting(meeting.id, meeting.title)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Meeting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Video Link + Mark Attendance Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Left: Meeting Notice & Video Join */}
                    <div className="space-y-3">
                      {meeting.agenda && (
                        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
                          <span className="font-bold text-slate-900 block mb-1 uppercase text-[10px] tracking-wider text-blue-900">
                            Meeting Notice / Thupui:
                          </span>
                          <p className="text-slate-700 whitespace-pre-line text-xs leading-relaxed font-sans">
                            {meeting.agenda}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2.5 pt-1">
                        <a
                          href={meeting.meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-600 transition shadow-sm"
                        >
                          <Video className="w-4 h-4" />
                          <span>Join Video Meeting</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>

                        <button
                          onClick={() => handleMarkPresent(meeting.id)}
                          disabled={!!hasMarked}
                          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                            hasMarked
                              ? 'bg-emerald-100 border border-emerald-300 text-emerald-900 cursor-default'
                              : 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{hasMarked ? 'Present Marked ✓' : 'Mark Present'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Right: Attendees List */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-700" />
                          <span>Hruaitu Kal Te (Attendees)</span>
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 font-mono">
                          {meeting.attendees?.length || 0} Present
                        </span>
                      </div>

                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                        {!meeting.attendees || meeting.attendees.length === 0 ? (
                          <div className="py-4 text-center text-slate-400 text-[11px]">
                            Hruaitu in-present an la awm lo.
                          </div>
                        ) : (
                          meeting.attendees.map((a) => (
                            <div
                              key={a.memberId}
                              className="flex items-center justify-between rounded-lg bg-white p-2 text-[11px] border border-slate-200 shadow-2xs"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                <div>
                                  <span className="font-bold text-slate-900">{a.hming}</span>
                                  <span className="text-slate-500 ml-1">({a.role})</span>
                                </div>
                              </div>
                              <span className="text-slate-400 font-mono text-[10px]">
                                {new Date(a.presentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AGENDA SUBMISSION SECTION FOR NEXT COMT */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ListPlus className="w-4 h-4 text-blue-700" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Thurel Tur Rawtna / Agenda Thehluh Te ({meeting.agendaItems?.length || 0})
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenAddAgenda(meeting.id)}
                        className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-200 transition shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Submit Agenda</span>
                      </button>
                    </div>

                    {!meeting.agendaItems || meeting.agendaItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                        <p className="text-xs text-slate-500">
                          He meeting atana agenda rawtna thehluh a la awm lo.
                        </p>
                        <button
                          onClick={() => handleOpenAddAgenda(meeting.id)}
                          className="mt-1 text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                        >
                          <span>+ Agenda thar thehlut rawh</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {meeting.agendaItems.map((ag) => (
                          <div
                            key={ag.id}
                            className="rounded-xl border border-blue-100 bg-blue-50/30 p-3 flex flex-col justify-between space-y-2 hover:bg-blue-50/50 transition shadow-2xs"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-slate-900">
                                  {ag.topic}
                                </span>
                                <button
                                  onClick={() => handleDeleteAgendaItem(meeting.id, ag.id)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5"
                                  title="Paih"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {ag.description && (
                                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                  {ag.description}
                                </p>
                              )}
                            </div>

                            <div className="border-t border-blue-100/70 pt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                              <span className="font-semibold text-blue-900">
                                Proposer: {ag.proposedBy} ({ag.proposedByRole})
                              </span>
                              <span className="font-mono text-slate-400">
                                {new Date(ag.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 1. BRANCH LEADER ON TOP (SPECIAL GOLD ACCENT CARD)                       */}
      {/* ========================================================================= */}
      {leader && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-50/60 via-white to-amber-50/30 p-5 sm:p-6 shadow-sm">
          <div className="absolute top-0 right-0 rounded-bl-xl bg-amber-500 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-xs">
            👑 Branch Leader
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-2xl font-black text-slate-950 shadow-md">
                {leader.hming.charAt(0)}
                <div className="absolute -top-2 -right-2 rounded-full bg-slate-900 p-1 text-amber-400">
                  <Crown className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-900 mb-1">
                  KPG Leader 2026
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {leader.hming}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {leader.veng} • Phone: <strong className="text-slate-700">{leader.phone}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <a
                href={`tel:${leader.phone}`}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5 text-blue-700" />
                <span>Call</span>
              </a>
              <a
                href={`https://wa.me/91${leader.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              {/* EDIT & DELETE BUTTONS - Visible ONLY to OBs and Developer */}
              {isOB && (
                <div className="flex items-center gap-1 ml-1">
                  <button
                    onClick={() => handleOpenEditOB(leader)}
                    className="p-2 rounded-xl border border-slate-300 bg-white text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition shadow-2xs"
                    title="Edit Leader Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemoveOB(leader.id, leader.hming)}
                    className="p-2 rounded-xl border border-slate-300 bg-white text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition shadow-2xs"
                    title="Remove from OB (Keep as Member)"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMemberCompletely(leader.id, leader.hming)}
                    className="p-2 rounded-xl border border-slate-300 bg-white text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition shadow-2xs"
                    title="Delete Member Completely"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OTHER OFFICE BEARERS & COMMITTEE DIRECTORY                              */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Executive Office Bearers & Committee ({obs.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {otherOBs.map((ob) => (
            <div
              key={ob.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    {ROLE_LABELS[ob.role]}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ob.veng}
                    </span>
                    {isOB && (
                      <div className="flex items-center gap-0.5 ml-1">
                        <button
                          onClick={() => handleOpenEditOB(ob)}
                          className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition"
                          title="Edit OB"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveOB(ob.id, ob.hming)}
                          className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                          title="Remove from OB (Keep as Member)"
                        >
                          <UserMinus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteMemberCompletely(ob.id, ob.hming)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Member Completely"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="font-bold text-sm text-slate-900">
                  {ob.hming}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {ob.phone}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={`tel:${ob.phone}`}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <PhoneCall className="w-3 h-3 text-blue-700" />
                  <span>Call</span>
                </a>
                <a
                  href={`https://wa.me/91${ob.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition"
                >
                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. EX-OFFICIO MEMBERS (ADVISERS & REPRESENTATIVES)                        */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Ex-Officio ({exOfficio.length})
            </h3>
          </div>
          {isOB && (
            <button
              onClick={() => setShowAddExOfficioModal(true)}
              className="flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 px-2.5 py-1.5 rounded-xl border border-purple-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ex-Officio</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {exOfficio.map((exo) => (
            <div
              key={exo.id}
              className="rounded-2xl border border-purple-100 bg-gradient-to-b from-purple-50/40 to-white p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full border border-purple-200">
                    {exo.designation}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {exo.veng}
                    </span>
                    {isOB && (
                      <div className="flex items-center gap-0.5 ml-1">
                        <button
                          onClick={() => handleOpenEditExo(exo)}
                          className="p-1 rounded text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition"
                          title="Edit Ex-Officio"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteExo(exo.id, exo.hming)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Ex-Officio"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="font-bold text-sm text-slate-900 pt-1">
                  {exo.hming}
                </div>

                {exo.notes && (
                  <p className="text-[11px] text-slate-600 italic">
                    "{exo.notes}"
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-purple-100 flex items-center justify-between gap-2">
                <a
                  href={`tel:${exo.phone}`}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <PhoneCall className="w-3 h-3 text-purple-700" />
                  <span>Call</span>
                </a>
                <a
                  href={`https://wa.me/91${exo.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition"
                >
                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: POST COMMITTEE MEETING */}
      {showCreateMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Post Committee Meeting</h3>
                <p className="text-xs text-slate-500">OBs Committee date, time, agenda & video meeting</p>
              </div>
              <button
                onClick={() => setShowCreateMeetingModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeetingSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Meeting Title / Thupui
                </label>
                <input
                  type="text"
                  required
                  value={meetTitle}
                  onChange={(e) => setMeetTitle(e.target.value)}
                  placeholder="e.g. KPG OB Committee Meeting No. 5/2026"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={meetDateTime}
                  onChange={(e) => setMeetDateTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase text-slate-700">
                    Video Meeting URL (Google Meet / Zoom)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomId = Math.random().toString(36).substring(2, 6);
                      setMeetUrl(`https://meet.google.com/kpg-ob-${randomId}`);
                    }}
                    className="text-[10px] font-bold text-blue-700 hover:underline"
                  >
                    Generate Link
                  </button>
                </div>
                <input
                  type="url"
                  required
                  value={meetUrl}
                  onChange={(e) => setMeetUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Agenda (Point tin te)
                </label>
                <textarea
                  rows={4}
                  required
                  value={meetAgenda}
                  onChange={(e) => setMeetAgenda(e.target.value)}
                  placeholder="1. Branch inkhawm chungchang&#10;2. Sum dinhmun thlirletna&#10;3. Youth camping buatsaih dan..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateMeetingModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-600 shadow-sm"
                >
                  Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EX-OFFICIO */}
      {showAddExOfficioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Ex-Officio</h3>
                <p className="text-xs text-slate-500">Branch Adviser & Representative</p>
              </div>
              <button
                onClick={() => setShowAddExOfficioModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExOfficioSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={exoHming}
                  onChange={(e) => setExoHming(e.target.value)}
                  placeholder="e.g. Upa C. Lalbiakzuala"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Designation
                  </label>
                  <select
                    value={exoDesignation}
                    onChange={(e) => setExoDesignation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Senior Adviser">Senior Adviser</option>
                    <option value="Patron / Pastor">Patron / Pastor</option>
                    <option value="Church Representative">Church Representative</option>
                    <option value="Adviser">Adviser</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Address / Veng
                  </label>
                  <input
                    type="text"
                    required
                    value={exoVeng}
                    onChange={(e) => setExoVeng(e.target.value)}
                    placeholder="e.g. Vengpui"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  value={exoPhone}
                  onChange={(e) => setExoPhone(e.target.value)}
                  placeholder="10-digit Phone Number"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Notes / Role
                </label>
                <input
                  type="text"
                  value={exoNotes}
                  onChange={(e) => setExoNotes(e.target.value)}
                  placeholder="e.g. Senior Adviser & Church Representative"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExOfficioModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-700 py-2.5 text-xs font-bold text-white hover:bg-purple-600 shadow-sm"
                >
                  Save Ex-Officio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: EDIT OB */}
      {editingOB && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Office Bearer</h3>
                <p className="text-xs text-slate-500">{editingOB.hming}</p>
              </div>
              <button
                onClick={() => setEditingOB(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOB} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Designation / Role
                </label>
                <select
                  value={editOBRole}
                  onChange={(e) => setEditOBRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="LEADER">Leader</option>
                  <option value="ASST_LEADER">Asst. Leader</option>
                  <option value="SECRETARY">Secretary</option>
                  <option value="ASST_SECRETARY">Asst. Secretary</option>
                  <option value="TREASURER">Treasurer</option>
                  <option value="FINANCE_SECRETARY">Asst. Treasurer</option>
                  <option value="COMMITTEE_OB">Committee Member</option>
                  <option value="MEMBER">Member (Normal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Veng (Locality)
                </label>
                <input
                  type="text"
                  required
                  value={editOBVeng}
                  onChange={(e) => setEditOBVeng(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={editOBPhone}
                  onChange={(e) => setEditOBPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingOB(null)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-600 shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT EX-OFFICIO */}
      {editingExo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Ex-Officio</h3>
                <p className="text-xs text-slate-500">{editingExo.hming}</p>
              </div>
              <button
                onClick={() => setEditingExo(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditExo} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={exoHming}
                  onChange={(e) => setExoHming(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    required
                    value={exoDesignation}
                    onChange={(e) => setExoDesignation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Veng
                  </label>
                  <input
                    type="text"
                    required
                    value={exoVeng}
                    onChange={(e) => setExoVeng(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  value={exoPhone}
                  onChange={(e) => setExoPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={exoNotes}
                  onChange={(e) => setExoNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExo(null)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-700 py-2.5 text-xs font-bold text-white hover:bg-purple-600 shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
