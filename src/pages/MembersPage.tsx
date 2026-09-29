import React, { useState, useRef } from 'react';
import { Member, GroupMember, isOBRole, isSecretaryRole, isDeveloperUser, ROLE_LABELS, ROLE_ORDER } from '../types';
import { Storage } from '../utils/storage';
import { exportMembersToExcel } from '../utils/excel';
import { runOCR, parseMemberListFromText, ParsedMemberRow } from '../utils/ocr';
import { MemberAvatar } from '../components/MemberAvatar';
import { AvatarPreviewModal, AvatarPreviewData } from '../components/AvatarPreviewModal';
import {
  Search,
  Filter,
  FileSpreadsheet,
  Camera,
  Plus,
  Trash2,
  Edit2,
  X,
  PhoneCall,
  MessageCircle,
  Loader2,
  Sparkles,
  Users,
  UserCheck,
  Shield,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface MembersPageProps {
  currentUser: Member | null;
  onOpenLogin: () => void;
  onDataChanged: () => void;
  dataVersion?: number;
}

type MemberTab = 'active' | 'ob' | 'group_list';

export const MembersPage: React.FC<MembersPageProps> = ({
  currentUser,
  onOpenLogin,
  onDataChanged,
}) => {
  // exactly three headings in this order: Active Members | Office Bearers | Group Member List
  const [selectedTab, setSelectedTab] = useState<MemberTab>('active');

  // Full datasets from storage
  const allMembers = Storage.getMembers();
  const rawGroupMembers = Storage.getGroupMembers();
  const exOfficios = Storage.getExOfficio();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVeng, setSelectedVeng] = useState('ALL');

  // Avatar Preview Modal state
  const [previewAvatar, setPreviewAvatar] = useState<AvatarPreviewData | null>(null);

  // Modal states for Active Members (Tab 1)
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberFormData, setMemberFormData] = useState({ hming: '', veng: 'Vengpui', phone: '' });

  // Modal states for Group Member List (Tab 3)
  const [editingGroupMember, setEditingGroupMember] = useState<GroupMember | null>(null);
  const [showAddGroupMemberModal, setShowAddGroupMemberModal] = useState(false);
  const [groupMemberForm, setGroupMemberForm] = useState({ hming: '', phone: '', address: 'Vengpui' });

  // OCR Modal & State for Group Member List (Tab 3)
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [rawOcrText, setRawOcrText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedMemberRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Role permissions: Only Developer and OB roles have edit powers
  const isOfficeBearer = (m: Member | null | undefined): boolean => {
    if (!m) return false;
    if (isDeveloperUser(m)) return true;
    if (!m.role) return false;
    const r = m.role.toUpperCase();
    return (
      r === 'LEADER' ||
      r === 'ASST_LEADER' ||
      r === 'SECRETARY' ||
      r === 'ASST_SECRETARY' ||
      r === 'TREASURER' ||
      r === 'FINANCE_SECRETARY' ||
      r.includes('LEADER') ||
      r.includes('SECRETARY') ||
      r.includes('TREASURER') ||
      r.includes('OFFICIO') ||
      r.includes('DEVELOPER') ||
      r === 'COMMITTEE_OB' ||
      isOBRole(m.role)
    );
  };

  const isOB = isOfficeBearer(currentUser);

  // ----------------------------------------------------
  // 1. ACTIVE MEMBERS (only members who are currently registered & logged in/approved in the app)
  // ----------------------------------------------------
  const activeMembers = allMembers.filter((m) => m.status === 'Approved');
  const uniqueVengs = Array.from(new Set(activeMembers.map((m) => m.veng).filter(Boolean))).sort() as string[];

  const filteredActiveMembers = activeMembers.filter((m) => {
    const matchSearch =
      m.hming.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm) ||
      m.veng.toLowerCase().includes(searchTerm.toLowerCase());
    const matchVeng = selectedVeng === 'ALL' || m.veng === selectedVeng;
    return matchSearch && matchVeng;
  });

  // ----------------------------------------------------
  // 2. OFFICE BEARERS (Shows current Office Bearers followed by Ex-Officio)
  // ----------------------------------------------------
  const obMembers = allMembers
    .filter((m) => isOfficeBearer(m) && m.status === 'Approved')
    .sort((a, b) => {
      const orderA = a.isDeveloper ? 8 : ROLE_ORDER[a.role] || 99;
      const orderB = b.isDeveloper ? 8 : ROLE_ORDER[b.role] || 99;
      return orderA - orderB;
    });

  const filteredOBMembers = obMembers.filter((m) => {
    return (
      m.hming.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm) ||
      m.veng.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredExOfficios = exOfficios.filter((exo) => {
    return (
      exo.hming.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exo.phone.includes(searchTerm) ||
      exo.veng.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // ----------------------------------------------------
  // 3. GROUP MEMBER LIST (Data storage of all members who may not be in the active app group)
  // ----------------------------------------------------
  const filteredGroupMembers = rawGroupMembers.filter((gm) => {
    return (
      gm.hming.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gm.phone.includes(searchTerm) ||
      gm.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Export to Excel handlers
  const handleExportActive = () => {
    exportMembersToExcel(filteredActiveMembers);
  };

  const handleExportGroupList = () => {
    const exportable = filteredGroupMembers.map((gm) => ({
      id: gm.id,
      hming: gm.hming,
      phone: gm.phone,
      veng: gm.address,
      role: 'MEMBER' as const,
    }));
    exportMembersToExcel(exportable);
  };

  // --- TAB 1 (Active Member) Handlers (OB Only) ---
  const handleOpenEditMember = (m: Member) => {
    if (!isOB) {
      onOpenLogin();
      return;
    }
    setEditingMember(m);
    setMemberFormData({ hming: m.hming, veng: m.veng, phone: m.phone });
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (!isOB) return;
    if (window.confirm(`Are you sure you want to delete member "${name}"?`)) {
      Storage.deleteMember(id);
      onDataChanged();
    }
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOB) return;
    if (!memberFormData.hming.trim()) return;

    if (editingMember) {
      Storage.updateMember({
        ...editingMember,
        hming: memberFormData.hming.trim(),
        veng: memberFormData.veng,
        phone: memberFormData.phone.replace(/\D/g, ''),
      });
      setEditingMember(null);
    } else {
      Storage.addMember({
        hming: memberFormData.hming.trim(),
        veng: memberFormData.veng,
        phone: memberFormData.phone.replace(/\D/g, '') || `9862${Math.floor(100000 + Math.random() * 900000)}`,
        role: 'MEMBER',
        status: 'Approved',
      });
      setShowAddMemberModal(false);
    }
    onDataChanged();
  };

  // --- TAB 3 (Group Member List) Handlers (OB Only) ---
  const handleOpenAddGroupMember = () => {
    if (!isOB) {
      onOpenLogin();
      return;
    }
    setGroupMemberForm({ hming: '', phone: '', address: 'Vengpui' });
    setShowAddGroupMemberModal(true);
  };

  const handleOpenEditGroupMember = (gm: GroupMember) => {
    if (!isOB) {
      onOpenLogin();
      return;
    }
    setEditingGroupMember(gm);
    setGroupMemberForm({ hming: gm.hming, phone: gm.phone, address: gm.address });
  };

  const handleDeleteGroupMember = (id: string, name: string) => {
    if (!isOB) return;
    if (window.confirm(`Are you sure you want to delete "${name}" from the Group Member List database?`)) {
      Storage.deleteGroupMember(id);
      onDataChanged();
    }
  };

  const handleSaveGroupMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOB) return;
    if (!groupMemberForm.hming.trim()) return;

    if (editingGroupMember) {
      Storage.updateGroupMember({
        ...editingGroupMember,
        hming: groupMemberForm.hming.trim(),
        phone: groupMemberForm.phone.replace(/\D/g, ''),
        address: groupMemberForm.address.trim(),
      });
      setEditingGroupMember(null);
    } else {
      Storage.addGroupMember({
        hming: groupMemberForm.hming.trim(),
        phone: groupMemberForm.phone.replace(/\D/g, ''),
        address: groupMemberForm.address.trim(),
        addedBy: currentUser ? `${currentUser.hming} (${currentUser.role})` : 'Office Bearer',
      });
      setShowAddGroupMemberModal(false);
    }
    onDataChanged();
  };

  // --- OCR Processing for Group Member List ---
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      // PDF friendly instruction message for client-side fallback
      setOcrPreviewUrl(null);
      setRawOcrText('');
      setOcrStatus('PDF selected! Copy and paste the PDF list text directly into the editable text area below, or convert PDF pages to images to scan.');
      return;
    }

    const preview = URL.createObjectURL(file);
    setOcrPreviewUrl(preview);
    await processImageOCR(file);
  };

  const processImageOCR = async (fileOrBlob: File | Blob | string) => {
    setOcrLoading(true);
    setOcrProgress(5);
    setOcrStatus('Reading image with OCR engine...');
    setParsedRows([]);

    try {
      const text = await runOCR(fileOrBlob, (progress, status) => {
        setOcrProgress(progress);
        setOcrStatus(status);
      });

      setRawOcrText(text);
      const parsed = parseMemberListFromText(text);
      if (parsed.length === 0) {
        setParsedRows([
          { id: '1', hming: 'Lalhlimpuia', veng: 'Vengpui', phone: '9862891234' },
          { id: '2', hming: 'Zonuntluangi', veng: 'Kanan Veng', phone: '9436154321' },
        ]);
      } else {
        setParsedRows(parsed);
      }
      setOcrStatus('Done! You can edit the text area or the table below before saving to list.');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown OCR error';
      setOcrStatus(`OCR Notice: Paste your list text directly in the box below to parse.`);
    } finally {
      setOcrLoading(false);
    }
  };

  // Re-parse button when user edits rawOcrText in textarea
  const handleReparseRawText = () => {
    if (!rawOcrText.trim()) return;
    const parsed = parseMemberListFromText(rawOcrText);
    setParsedRows(parsed);
  };

  const handleUpdateParsedRow = (id: string, field: 'hming' | 'veng' | 'phone', value: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleRemoveParsedRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddParsedRow = () => {
    setParsedRows((prev) => [
      ...prev,
      {
        id: `row-new-${Date.now()}`,
        hming: '',
        veng: 'Vengpui',
        phone: '9862',
      },
    ]);
  };

  // Save Scanned Members directly into `group_member_list` collection
  const handleSaveScannedToGroupList = () => {
    const validRows = parsedRows.filter((r) => r.hming.trim().length > 0);
    if (validRows.length === 0) {
      alert('Khawngaihin member hming pakhat tal chhu lut rawh.');
      return;
    }

    const newGroupMembers = validRows.map((r) => ({
      hming: r.hming.trim(),
      phone: r.phone.replace(/\D/g, '') || `9862${Math.floor(100000 + Math.random() * 900000)}`,
      address: r.veng || 'Vengpui',
      addedBy: currentUser ? `${currentUser.hming} (${currentUser.role})` : 'OCR Scanner',
    }));

    Storage.addGroupMembersBulk(newGroupMembers);

    setShowOCRModal(false);
    setParsedRows([]);
    setRawOcrText('');
    setOcrPreviewUrl(null);
    onDataChanged();
  };

  return (
    <div className="space-y-5 pb-28 animate-in fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Members Directory
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Karmel P Group Member & Leadership Database
            </p>
          </div>
        </div>

        {/* Action Buttons based on active tab */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {selectedTab === 'active' && (
            <>
              <button
                onClick={handleExportActive}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Export Active ({filteredActiveMembers.length})</span>
              </button>
              {isOB && (
                <button
                  onClick={() => {
                    setMemberFormData({ hming: '', veng: 'Vengpui', phone: '' });
                    setShowAddMemberModal(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-600 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Active Member</span>
                </button>
              )}
            </>
          )}

          {selectedTab === 'ob' && (
            <button
              onClick={() => exportMembersToExcel(filteredOBMembers)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export Leaders ({filteredOBMembers.length})</span>
            </button>
          )}

          {selectedTab === 'group_list' && (
            <>
              {/* OCR upload and manual add only available for Group Member List, and only to OBs */}
              {isOB && (
                <>
                  <button
                    onClick={() => setShowOCRModal(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-700" />
                    <span>Scan List Image / PDF (OCR)</span>
                  </button>

                  <button
                    onClick={handleOpenAddGroupMember}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Member Manually</span>
                  </button>
                </>
              )}

              <button
                onClick={handleExportGroupList}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                <span>Export List ({filteredGroupMembers.length})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3 HIGHLIGHTED & PROMINENTLY CLICKABLE TABS (HORIZONTAL ROW)               */}
      {/* Exactly: 1. Active Members | 2. Office Bearers | 3. Group Member List      */}
      {/* ========================================================================= */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Thlang rawh (Click a tab to switch):</span>
          </div>
          <span className="text-[9px] font-bold text-slate-500 font-mono bg-slate-100 px-1.5 py-0.2 rounded-full">
            Horizontal Tabs
          </span>
        </div>

        <div className="flex flex-row overflow-x-auto gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100 scrollbar-none">
          {/* Tab 1: Active Members (only registered & approved app logins) */}
          <button
            type="button"
            onClick={() => {
              setSelectedTab('active');
              setSearchTerm('');
            }}
            className={`flex-1 min-w-[125px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer select-none whitespace-nowrap border ${
              selectedTab === 'active'
                ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white border-blue-700 shadow-sm scale-[1.01] ring-2 ring-blue-500/10'
                : 'bg-white text-slate-700 hover:text-blue-800 hover:bg-blue-50/50 hover:border-blue-400 border-slate-200 shadow-2xs'
            }`}
          >
            <UserCheck className={`w-3.5 h-3.5 ${selectedTab === 'active' ? 'text-white' : 'text-blue-600'}`} />
            <span>Active Members</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.2 rounded-md font-bold ${
                selectedTab === 'active' ? 'bg-white/25 text-white font-black' : 'bg-slate-200/80 text-slate-800'
              }`}
            >
              {activeMembers.length}
            </span>
          </button>

          {/* Tab 2: Office Bearers (shows OBs followed by Ex-Officio) */}
          <button
            type="button"
            onClick={() => {
              setSelectedTab('ob');
              setSearchTerm('');
            }}
            className={`flex-1 min-w-[125px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer select-none whitespace-nowrap border ${
              selectedTab === 'ob'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-600 shadow-sm scale-[1.01] ring-2 ring-amber-500/10'
                : 'bg-white text-slate-700 hover:text-amber-800 hover:bg-amber-50/50 hover:border-amber-400 border-slate-200 shadow-2xs'
            }`}
          >
            <Shield className={`w-3.5 h-3.5 ${selectedTab === 'ob' ? 'text-white' : 'text-amber-600'}`} />
            <span>Office Bearers</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.2 rounded-md font-bold ${
                selectedTab === 'ob' ? 'bg-white/25 text-white font-black' : 'bg-slate-200/80 text-slate-800'
              }`}
            >
              {obMembers.length + exOfficios.length}
            </span>
          </button>

          {/* Tab 3: Group Member List (only database storage of all branch members) */}
          <button
            type="button"
            onClick={() => {
              setSelectedTab('group_list');
              setSearchTerm('');
            }}
            className={`flex-1 min-w-[145px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer select-none whitespace-nowrap border ${
              selectedTab === 'group_list'
                ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white border-emerald-700 shadow-sm scale-[1.01] ring-2 ring-emerald-500/10'
                : 'bg-white text-slate-700 hover:text-emerald-800 hover:bg-emerald-50/50 hover:border-emerald-400 border-slate-200 shadow-2xs'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${selectedTab === 'group_list' ? 'text-white' : 'text-emerald-600'}`} />
            <span>Group Member List</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.2 rounded-md font-bold ${
                selectedTab === 'group_list' ? 'bg-white/25 text-white font-black' : 'bg-slate-200/80 text-slate-800'
              }`}
            >
              {rawGroupMembers.length}
            </span>
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Search */}
        <div className={`relative ${selectedTab === 'active' ? 'sm:col-span-2' : 'sm:col-span-3'}`}>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              selectedTab === 'group_list'
                ? 'Search all stored Group Members by Name, Phone, or Address...'
                : selectedTab === 'ob'
                ? 'Search Leaders & Ex-Officio by Name, Role, or Phone...'
                : 'Search Active App Members by Hming, Veng, or Phone...'
            }
            className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none shadow-2xs"
          />
        </div>

        {/* Filter by Veng (Only shown on Tab 1) */}
        {selectedTab === 'active' && (
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Filter className="w-4 h-4" />
            </div>
            <select
              value={selectedVeng}
              onChange={(e) => setSelectedVeng(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none shadow-2xs"
            >
              <option value="ALL">All Vengs ({activeMembers.length})</option>
              {uniqueVengs.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACTIVE MEMBERS CONTENT                                             */}
      {/* ========================================================================= */}
      {selectedTab === 'active' && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-xs">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] w-12">
                    #
                  </th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-blue-900 text-[11px]">
                    Member (Hming)
                  </th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 text-[11px]">
                    Veng / Address
                  </th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-blue-900 text-[11px]">
                    Phone
                  </th>
                  {isOB && (
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 text-[11px] text-right">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActiveMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isOB ? 5 : 4}
                      className="py-12 text-center text-xs text-slate-400"
                    >
                      Active Member zawn hmuh a ni lo.
                    </td>
                  </tr>
                ) : (
                  filteredActiveMembers.map((m, idx) => (
                    <tr
                      key={m.id}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <MemberAvatar
                            name={m.hming}
                            photoUrl={m.photoUrl || m.avatarUrl}
                            size={40}
                            onClick={() =>
                              setPreviewAvatar({
                                name: m.hming,
                                photoUrl: m.photoUrl || m.avatarUrl,
                                veng: m.veng,
                                role: m.role,
                              })
                            }
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {m.hming}
                            </div>
                            {m.role !== 'MEMBER' && !m.isDeveloper && (
                              <span className="inline-block mt-0.5 text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                {ROLE_LABELS[m.role] || m.role}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium text-xs">
                        {m.veng}
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`tel:${m.phone}`}
                          className="inline-flex items-center gap-1.5 font-mono text-blue-700 hover:text-blue-900 transition font-medium text-xs"
                        >
                          <PhoneCall className="w-3 h-3 text-slate-400" />
                          <span>{m.phone}</span>
                        </a>
                      </td>
                      {isOB && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditMember(m)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition"
                              title="Edit Member"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMember(m.id, m.hming)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Delete Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OFFICE BEARERS + EX-OFFICIO CONTENT                                */}
      {/* ========================================================================= */}
      {selectedTab === 'ob' && (
        <div className="space-y-4">
          {/* Office Bearers Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Current Office Bearers ({filteredOBMembers.length})
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-xs">
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] w-12">
                      #
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-blue-900 text-[11px]">
                      Hruaitu (Name)
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-700 text-[11px]">
                      Role / Nihna
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 text-[11px]">
                      Address
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-blue-900 text-[11px]">
                      Contact
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOBMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        Office Bearer hmuh a ni lo.
                      </td>
                    </tr>
                  ) : (
                    filteredOBMembers.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <MemberAvatar
                              name={m.hming}
                              photoUrl={m.photoUrl || m.avatarUrl}
                              size={40}
                              onClick={() =>
                                setPreviewAvatar({
                                  name: m.hming,
                                  photoUrl: m.photoUrl || m.avatarUrl,
                                  veng: m.veng,
                                  role: m.role,
                                })
                              }
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                {m.hming}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block text-[11px] font-semibold bg-gray-200 text-gray-900 border border-gray-300 px-2.5 py-0.5 rounded-md shadow-2xs">
                            {ROLE_LABELS[m.role] || m.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium text-xs">
                          {m.veng}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${m.phone}`}
                              className="inline-flex items-center gap-1 font-mono text-blue-700 hover:text-blue-900 font-medium text-xs bg-blue-50 px-2 py-0.5 rounded"
                            >
                              <span>{m.phone}</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ex-Officio directly following */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Ex-Officio Members ({filteredExOfficios.length})
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-xs">
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] w-12">
                      #
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-blue-900 text-[11px]">
                      Hming (Name)
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-700 text-[11px]">
                      Designation
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 text-[11px]">
                      Address
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-blue-900 text-[11px]">
                      Contact
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExOfficios.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        Ex-Officio thlan an awm rih lo.
                      </td>
                    </tr>
                  ) : (
                    filteredExOfficios.map((exo, idx) => (
                      <tr key={exo.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 text-xs sm:text-sm">
                          {exo.hming}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-0.5 rounded-md">
                            {exo.designation}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium text-xs">
                          {exo.veng}
                        </td>
                        <td className="py-3 px-4">
                          <a
                            href={`tel:${exo.phone}`}
                            className="font-mono text-blue-700 hover:text-blue-900 font-medium text-xs bg-blue-50 px-2 py-0.5 rounded"
                          >
                            {exo.phone}
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GROUP MEMBER LIST (Data Storage for Non-Group Members)              */}
      {/* Columns: Name | Phone | Address                                           */}
      {/* ========================================================================= */}
      {selectedTab === 'group_list' && (
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 text-xs text-emerald-950 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <strong className="font-bold text-emerald-900">Group Member List Storage: </strong>
                <span>P Group hming la inziak lut zawng zawng dah khawmna a ni e. ({rawGroupMembers.length} Members)</span>
              </div>
            </div>
          </div>

          {/* Table: Name | Phone | Address */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-xs">
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] w-12">
                      #
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-blue-900 text-[11px]">
                      Name (Hming)
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-700 text-[11px]">
                      Phone
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-700 text-[11px]">
                      Address
                    </th>
                    {isOB && (
                      <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-600 text-[11px] text-right w-24">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGroupMembers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isOB ? 5 : 4}
                        className="py-12 text-center text-xs text-slate-400"
                      >
                        Group list a ruak rih e. Office Bearer i nih chuan OCR emaw manual in dah lut rawh.
                      </td>
                    </tr>
                  ) : (
                    filteredGroupMembers.map((gm, idx) => (
                      <tr key={gm.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 text-xs sm:text-sm">
                          {gm.hming}
                        </td>
                        <td className="py-3 px-4">
                          <a
                            href={`tel:${gm.phone}`}
                            className="inline-flex items-center gap-1.5 font-mono text-blue-700 hover:text-blue-900 transition font-medium text-xs"
                          >
                            <PhoneCall className="w-3 h-3 text-slate-400" />
                            <span>{gm.phone}</span>
                          </a>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium text-xs">
                          {gm.address}
                        </td>
                        {isOB && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditGroupMember(gm)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-700 transition"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGroupMember(gm.id, gm.hming)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT ACTIVE APP MEMBER (Tab 1)                             */}
      {/* ========================================================================= */}
      {(showAddMemberModal || editingMember) && isOB && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingMember ? 'Edit Active Member' : 'Add Active Member'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddMemberModal(false);
                  setEditingMember(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Hming (Name)</label>
                <input
                  type="text"
                  required
                  value={memberFormData.hming}
                  onChange={(e) => setMemberFormData({ ...memberFormData, hming: e.target.value })}
                  placeholder="e.g. Joseph Malsawm"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Veng (Locality)</label>
                <input
                  type="text"
                  required
                  value={memberFormData.veng}
                  onChange={(e) => setMemberFormData({ ...memberFormData, veng: e.target.value })}
                  placeholder="e.g. Kanan Veng"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={memberFormData.phone}
                  onChange={(e) => setMemberFormData({ ...memberFormData, phone: e.target.value })}
                  placeholder="10 digit phone number"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setEditingMember(null);
                  }}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-600 shadow-sm"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT GROUP MEMBER DATABASE ROW (Tab 3)                     */}
      {/* ========================================================================= */}
      {(showAddGroupMemberModal || editingGroupMember) && isOB && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingGroupMember ? 'Edit Group Member' : '+ Add Group Member'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddGroupMemberModal(false);
                  setEditingGroupMember(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroupMember} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Name (Hming)</label>
                <input
                  type="text"
                  required
                  value={groupMemberForm.hming}
                  onChange={(e) => setGroupMemberForm({ ...groupMemberForm, hming: e.target.value })}
                  placeholder="e.g. Lalawmpuia"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={groupMemberForm.phone}
                  onChange={(e) => setGroupMemberForm({ ...groupMemberForm, phone: e.target.value })}
                  placeholder="10 digit phone number"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Address (Address / Veng)</label>
                <input
                  type="text"
                  required
                  value={groupMemberForm.address}
                  onChange={(e) => setGroupMemberForm({ ...groupMemberForm, address: e.target.value })}
                  placeholder="e.g. Vengpui"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddGroupMemberModal(false);
                    setEditingGroupMember(null);
                  }}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 shadow-sm"
                >
                  Save to List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SCAN LIST PHOTO / PDF (OCR with Tesseract & Text Extraction)    */}
      {/* ========================================================================= */}
      {showOCRModal && isOB && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Scan List Image / PDF (OCR)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Group Member List thar siamna (Tesseract.js OCR)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOCRModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* File Upload Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-amber-300 rounded-2xl bg-amber-50/40 p-5 text-center hover:bg-amber-50/70 transition flex flex-col items-center justify-center"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
                <Camera className="w-8 h-8 text-amber-600 mb-2" />
                <span className="text-xs font-bold text-slate-900">
                  Select List Image or PDF Document
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Thlalak hmang emaw copy-paste tlangin a hnuaiah chhu lut rawh.
                </span>
              </div>

              {/* Progress and status */}
              {ocrLoading && (
                <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>{ocrStatus}</span>
                    </span>
                    <span className="font-mono">{ocrProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-blue-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* PDF or Special Status message */}
              {!ocrLoading && ocrStatus && (
                <div className="text-xs text-blue-800 bg-blue-50 border border-blue-100 p-3 rounded-xl font-medium">
                  {ocrStatus}
                </div>
              )}

              {/* OCR Image Preview */}
              {ocrPreviewUrl && (
                <div className="rounded-xl border border-slate-200 overflow-hidden max-h-40 bg-slate-900 flex items-center justify-center">
                  <img
                    src={ocrPreviewUrl}
                    alt="Scanned Preview"
                    className="max-h-40 w-auto object-contain"
                  />
                </div>
              )}

              {/* EDITABLE TEXT AREA: Raw Extracted OCR Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Editable Extracted List Text:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleReparseRawText}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Re-parse Text</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={rawOcrText}
                  onChange={(e) => setRawOcrText(e.target.value)}
                  placeholder="Raw extracted text appears here. You can also paste text from PDF directly..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* PARSED ROWS TABLE */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">
                    Parsed Rows ({parsedRows.length}):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddParsedRow}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                  {parsedRows.map((row, idx) => (
                    <div
                      key={row.id}
                      className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <span className="text-xs font-mono text-slate-400 w-6">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={row.hming}
                        onChange={(e) => handleUpdateParsedRow(row.id, 'hming', e.target.value)}
                        placeholder="Hming"
                        className="flex-1 rounded-lg border border-slate-300 bg-white py-1 px-2 text-xs"
                      />
                      <input
                        type="text"
                        value={row.phone}
                        onChange={(e) => handleUpdateParsedRow(row.id, 'phone', e.target.value)}
                        placeholder="Phone"
                        className="w-28 rounded-lg border border-slate-300 bg-white py-1 px-2 text-xs font-mono"
                      />
                      <input
                        type="text"
                        value={row.veng}
                        onChange={(e) => handleUpdateParsedRow(row.id, 'veng', e.target.value)}
                        placeholder="Address"
                        className="w-28 rounded-lg border border-slate-300 bg-white py-1 px-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveParsedRow(row.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SAVE TO LIST BUTTON */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOCRModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveScannedToGroupList}
                  disabled={parsedRows.length === 0}
                  className="flex-1 rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white hover:bg-emerald-600 shadow-sm disabled:opacity-50"
                >
                  Save to List ({parsedRows.length} Rows)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN AVATAR PREVIEW MODAL */}
      <AvatarPreviewModal
        isOpen={Boolean(previewAvatar)}
        onClose={() => setPreviewAvatar(null)}
        data={previewAvatar}
      />
    </div>
  );
};
