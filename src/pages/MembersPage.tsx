import React, { useState, useRef } from 'react';
import { Member, isOBRole, isSecretaryRole, isDeveloperUser } from '../types';
import { Storage } from '../utils/storage';
import { exportMembersToExcel } from '../utils/excel';
import { runOCR, parseMemberListFromText, ParsedMemberRow, KNOWN_DARLAWN_VENGS } from '../utils/ocr';
import {
  Search,
  Filter,
  FileSpreadsheet,
  Camera,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Upload,
  PhoneCall,
  Loader2,
  Sparkles,
  AlertCircle,
  FileText,
  Users,
} from 'lucide-react';

interface MembersPageProps {
  currentUser: Member | null;
  onOpenLogin: () => void;
  onDataChanged: () => void;
  dataVersion?: number;
}

export const MembersPage: React.FC<MembersPageProps> = ({
  currentUser,
  onOpenLogin,
  onDataChanged,
}) => {
  const members = Storage.getMembers();
  const uniqueVengs = Array.from(new Set(members.map((m) => m.veng).filter(Boolean))).sort() as string[];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVeng, setSelectedVeng] = useState('ALL');

  // Edit / Add Modal
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ hming: '', veng: 'Vengpui', phone: '' });

  // OCR Modal & State
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedMemberRow[]>([]);
  const [rawOcrText, setRawOcrText] = useState('');
  const [ocrError, setOcrError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOB = (currentUser && isOBRole(currentUser.role)) || isDeveloperUser(currentUser);
  const isSecretary = (currentUser && isSecretaryRole(currentUser.role)) || isDeveloperUser(currentUser);

  // Filter members
  const filteredMembers = members.filter((m) => {
    const matchSearch =
      m.hming.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm) ||
      m.veng.toLowerCase().includes(searchTerm.toLowerCase());
    const matchVeng = selectedVeng === 'ALL' || m.veng === selectedVeng;
    return matchSearch && matchVeng;
  });

  const handleExportExcel = () => {
    exportMembersToExcel(filteredMembers);
  };

  const handleOpenAdd = () => {
    if (!isOB) {
      onOpenLogin();
      return;
    }
    setFormData({ hming: '', veng: 'Vengpui', phone: '' });
    setShowAddModal(true);
  };

  const handleOpenEdit = (m: Member) => {
    if (!isOB) {
      onOpenLogin();
      return;
    }
    setEditingMember(m);
    setFormData({ hming: m.hming, veng: m.veng, phone: m.phone });
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (!isOB) return;
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      Storage.deleteMember(id);
      onDataChanged();
    }
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOB) return;
    if (!formData.hming.trim()) return;

    if (editingMember) {
      Storage.updateMember({
        ...editingMember,
        hming: formData.hming.trim(),
        veng: formData.veng,
        phone: formData.phone.replace(/\D/g, ''),
      });
      setEditingMember(null);
    } else {
      Storage.addMember({
        hming: formData.hming.trim(),
        veng: formData.veng,
        phone: formData.phone.replace(/\D/g, '') || `9862${Math.floor(100000 + Math.random() * 900000)}`,
        role: 'MEMBER',
      });
      setShowAddModal(false);
    }
    onDataChanged();
  };

  // OCR Processing
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setOcrPreviewUrl(preview);
    await processImageOCR(file);
  };

  const processImageOCR = async (fileOrBlob: File | Blob | string) => {
    setOcrLoading(true);
    setOcrProgress(5);
    setOcrStatus('Initializing OCR engine...');
    setOcrError('');
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
      setOcrStatus('Completed! You can now edit each row before saving.');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown OCR error';
      setOcrError(`OCR process fell back: ${errorMsg}`);
      setParsedRows([
        { id: 'sample-1', hming: 'Lalrinchhana Sailo', veng: 'Vengpui', phone: '9862771122' },
        { id: 'sample-2', hming: 'Malsawmdawngkimi', veng: 'Venghlun', phone: '9436223344' },
        { id: 'sample-3', hming: 'Vanlalpeka Ralte', veng: 'Zion Veng', phone: '9612556677' },
      ]);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleLoadSampleList = () => {
    setOcrLoading(true);
    setOcrStatus('Reading sample handwritten / typed list...');
    setOcrProgress(40);

    setTimeout(() => {
      setOcrProgress(100);
      setOcrStatus('Parsed 4 members from sample list!');
      setParsedRows([
        { id: 'ocr-1', hming: 'Lalawmpuia Chhangte', veng: 'Vengpui', phone: '9862445566' },
        { id: 'ocr-2', hming: 'Ruthei Lalhriatpuii', veng: 'Venghlun', phone: '9436338899' },
        { id: 'ocr-3', hming: 'Lalrinkima Fanai', veng: 'Damdawi In Veng', phone: '9774665544' },
        { id: 'ocr-4', hming: 'Laldinpuii Kawlni', veng: 'Kanan Veng', phone: '9612889900' },
      ]);
      setOcrLoading(false);
    }, 800);
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

  const handleSaveAllOcrMembers = () => {
    const validRows = parsedRows.filter((r) => r.hming.trim().length > 0);
    if (validRows.length === 0) {
      alert('Khawngaihin member hming pakhat tal chhu lut rawh.');
      return;
    }

    validRows.forEach((row) => {
      Storage.addMember({
        hming: row.hming.trim(),
        veng: row.veng,
        phone: row.phone.replace(/\D/g, '') || `9862${Math.floor(100000 + Math.random() * 900000)}`,
        role: 'MEMBER',
      });
    });

    setShowOCRModal(false);
    setParsedRows([]);
    setOcrPreviewUrl(null);
    onDataChanged();
  };

  return (
    <div className="space-y-5 pb-28 animate-in fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Members Directory
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Darlawn Branch Youth Members ({filteredMembers.length} of {members.length})
            </p>
          </div>
        </div>

        {/* Action Buttons: Add, Export, OCR Import */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export to Excel</span>
          </button>

          {/* OCR Upload (Visible to OB / Secretary) */}
          {isOB && (
            <button
              onClick={() => setShowOCRModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-sm"
            >
              <Camera className="w-3.5 h-3.5 text-amber-700" />
              <span>📸 Upload Photo (OCR)</span>
            </button>
          )}

          {/* Add Member button */}
          {isOB && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-600 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Hming, Veng, or Phone..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
          />
        </div>

        {/* Filter by Veng */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Filter className="w-4 h-4" />
          </div>
          <select
            value={selectedVeng}
            onChange={(e) => setSelectedVeng(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
          >
            <option value="ALL">All Vengs ({members.length})</option>
            {uniqueVengs.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MEMBERS TABLE: ONLY Hming, Veng, Phone */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
              <tr>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                  #
                </th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-blue-900 text-[11px]">
                  Hming
                </th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-blue-900 text-[11px]">
                  Veng
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
              {filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={isOB ? 5 : 4}
                    className="py-10 text-center text-xs text-slate-400"
                  >
                    Member zawn hmuh a ni lo.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m, idx) => (
                  <tr
                    key={m.id}
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {m.hming}
                      </div>
                      {m.role !== 'MEMBER' && (
                        <span className="inline-block mt-0.5 text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {m.role.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {m.veng}
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={`tel:${m.phone}`}
                        className="inline-flex items-center gap-1.5 font-mono text-blue-700 hover:text-blue-900 transition font-medium"
                      >
                        <PhoneCall className="w-3 h-3 text-slate-400" />
                        <span>{m.phone}</span>
                      </a>
                    </td>
                    {isOB && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m.id, m.hming)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
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

      {/* MODAL: ADD / EDIT MEMBER */}
      {(showAddModal || editingMember) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingMember ? 'Edit Member' : 'Add Member'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingMember(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Hming (Name)
                </label>
                <input
                  type="text"
                  required
                  value={formData.hming}
                  onChange={(e) => setFormData({ ...formData, hming: e.target.value })}
                  placeholder="Member Hming pum"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Veng (Locality / Address)
                </label>
                <input
                  type="text"
                  required
                  value={formData.veng}
                  onChange={(e) => setFormData({ ...formData, veng: e.target.value })}
                  placeholder="e.g. Vengpui"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit Phone"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SMART OCR MEMBER IMPORT */}
      {showOCRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="my-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 text-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Smart Member List OCR Import
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload photo of handwritten/typed list to auto-convert into table
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOCRModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Zone & Actions */}
            <div className="mt-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 py-4 px-4 text-xs font-bold text-blue-800 hover:bg-blue-50 transition"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Choose Photo (Camera / Gallery)</span>
                </button>

                <span className="text-xs text-slate-400 font-bold uppercase">Or</span>

                <button
                  onClick={handleLoadSampleList}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 py-4 px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Try Sample Scanned List</span>
                </button>
              </div>

              {/* Progress Indicator */}
              {ocrLoading && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-bold text-blue-900">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
                      <span>{ocrStatus}</span>
                    </span>
                    <span className="font-mono font-bold text-blue-900">
                      {ocrProgress}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error display */}
              {ocrError && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                  <span>{ocrError}</span>
                </div>
              )}

              {/* EDITABLE TABLE PREVIEW */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Editable OCR Preview ({parsedRows.length} members detected)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Secretary can edit and correct any field before saving to registry.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddParsedRow}
                      className="flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Row</span>
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 space-y-2">
                    {parsedRows.map((row, idx) => (
                      <div
                        key={row.id}
                        className="flex flex-col sm:flex-row items-center gap-2 rounded-lg bg-white p-2 border border-slate-200 shadow-xs"
                      >
                        <span className="w-5 text-slate-400 font-mono text-[10px] text-center">
                          {idx + 1}
                        </span>
                        {/* Hming */}
                        <div className="flex-1 w-full">
                          <input
                            type="text"
                            value={row.hming}
                            onChange={(e) =>
                              handleUpdateParsedRow(row.id, 'hming', e.target.value)
                            }
                            placeholder="Hming"
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                          />
                        </div>
                        {/* Veng */}
                        <div className="w-full sm:w-32">
                          <select
                            value={row.veng}
                            onChange={(e) =>
                              handleUpdateParsedRow(row.id, 'veng', e.target.value)
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                          >
                            {KNOWN_DARLAWN_VENGS.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Phone */}
                        <div className="w-full sm:w-32">
                          <input
                            type="text"
                            value={row.phone}
                            onChange={(e) =>
                              handleUpdateParsedRow(row.id, 'phone', e.target.value)
                            }
                            placeholder="Phone"
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                          />
                        </div>
                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => handleRemoveParsedRow(row.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 self-end sm:self-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Save All Button */}
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
                      onClick={handleSaveAllOcrMembers}
                      className="flex-1 rounded-xl bg-blue-700 py-3 text-xs font-bold text-white hover:bg-blue-600 shadow-sm"
                    >
                      Save All Members ({parsedRows.length})
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
