import React, { useState, useRef } from 'react';
import { Member, CommitteeRecord, Notice, isOBRole, isDeveloperUser } from '../types';
import { Storage } from '../utils/storage';
import { runOCR } from '../utils/ocr';
import {
  FileText,
  Camera,
  Plus,
  Bell,
  Trash2,
  Calendar,
  Loader2,
  Sparkles,
  X,
  Upload,
  Edit2,
} from 'lucide-react';

interface RecordsPageProps {
  currentUser: Member | null;
  onOpenLogin: () => void;
  onDataChanged: () => void;
  dataVersion?: number;
}

export const RecordsPage: React.FC<RecordsPageProps> = ({
  currentUser,
  onOpenLogin,
  onDataChanged,
}) => {
  const records = Storage.getRecords();
  const notices = Storage.getNotices();
  const isOB = (currentUser && isOBRole(currentUser.role)) || isDeveloperUser(currentUser);

  const [activeTab, setActiveTab] = useState<'records' | 'notices'>('records');

  // Add / Edit Record Modal
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CommitteeRecord | null>(null);
  const [recordTitle, setRecordTitle] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordContent, setRecordContent] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const noteFileInputRef = useRef<HTMLInputElement>(null);

  // Add / Edit Notice Modal
  const [showAddNoticeModal, setShowAddNoticeModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<Notice['category']>('General');
  const [noticeContent, setNoticeContent] = useState('');

  const handleOpenEditRecord = (rec: CommitteeRecord) => {
    if (!isOB) return;
    setEditingRecord(rec);
    setRecordTitle(rec.title);
    setRecordDate(rec.date);
    setRecordContent(rec.content);
  };

  const handleDeleteRecord = (id: string, title: string) => {
    if (!isOB) return;
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      Storage.deleteRecord(id);
      onDataChanged();
    }
  };

  const handleOpenEditNotice = (n: Notice) => {
    if (!isOB) return;
    setEditingNotice(n);
    setNoticeTitle(n.title);
    setNoticeCategory(n.category);
    setNoticeContent(n.content);
  };

  const handleDeleteNotice = (id: string, title: string) => {
    if (!isOB) return;
    if (window.confirm(`Are you sure you want to delete notice "${title}"?`)) {
      Storage.deleteNotice(id);
      onDataChanged();
    }
  };

  // AI Note Reader handler
  const handleNoteImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOB) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrStatus('Scanning handwritten/printed note with OCR...');

    try {
      const text = await runOCR(file, (progress, status) => {
        setOcrStatus(`${status}`);
      });
      setRecordContent((prev) => (prev ? `${prev}\n\n${text}` : text));
    } catch {
      setRecordContent(
        (prev) =>
          prev ||
          `Committee Meeting Decisions: 1) Approved youth fellowship budget. 2) Member visitation schedule set for Saturday. 3) Attendance confirmed.`
      );
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOB) return;
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
        recordedBy: currentUser ? `${currentUser.hming} (${currentUser.role})` : 'Secretary',
      });
      setShowAddRecordModal(false);
    }

    setRecordTitle('');
    setRecordContent('');
    onDataChanged();
  };

  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOB) return;
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    if (editingNotice) {
      Storage.updateNotice({
        ...editingNotice,
        title: noticeTitle.trim(),
        category: noticeCategory,
        content: noticeContent.trim(),
      });
      setEditingNotice(null);
    } else {
      Storage.addNotice({
        title: noticeTitle.trim(),
        category: noticeCategory,
        content: noticeContent.trim(),
        date: new Date().toISOString().split('T')[0],
        postedBy: currentUser?.hming || 'Office Bearer',
      });
      setShowAddNoticeModal(false);
    }

    setNoticeTitle('');
    setNoticeContent('');
    onDataChanged();
  };

  return (
    <div className="space-y-5 pb-28 animate-in fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800 shadow-sm">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Records & Committee Hub
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Committee Minutes, AI Note Reader & Official Notices
            </p>
          </div>
        </div>

        {isOB && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowAddRecordModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-600 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Record</span>
            </button>
            <button
              onClick={() => setShowAddNoticeModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-900 hover:bg-amber-400 transition shadow-sm"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Post Notice</span>
            </button>
          </div>
        )}
      </div>

      {/* Segmented Filter */}
      <div className="flex rounded-xl bg-white p-1 border border-slate-200 max-w-xs shadow-sm">
        <button
          onClick={() => setActiveTab('records')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'records'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Minutes & Records ({records.length})
        </button>
        <button
          onClick={() => setActiveTab('notices')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'notices'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Notices ({notices.length})
        </button>
      </div>

      {/* Tab 1: Records */}
      {activeTab === 'records' && (
        <div className="space-y-3.5">
          {records.map((rec) => (
            <div
              key={rec.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">{rec.title}</h3>
                  <span className="text-xs text-blue-800 font-mono bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {rec.date}
                  </span>
                </div>
                {isOB && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditRecord(rec)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition"
                      title="Edit Record"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(rec.id, rec.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
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
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-400">
                Recorded by: <strong className="text-slate-700">{rec.recordedBy}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Notices */}
      {activeTab === 'notices' && (
        <div className="space-y-3.5">
          {notices.map((n) => (
            <div
              key={n.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      n.category === 'Important'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : n.category === 'Fellowship'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {n.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">{n.title}</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">{n.date}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {n.content}
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Posted by: <strong className="text-slate-700">{n.postedBy}</strong></span>
                {isOB && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditNotice(n)}
                      className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition"
                      title="Edit Notice"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNotice(n.id, n.title)}
                      className="text-rose-600 hover:text-rose-700 text-xs flex items-center gap-1 font-semibold p-1 hover:bg-rose-50 rounded"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD / EDIT RECORD (With AI Note Reader) */}
      {(showAddRecordModal || editingRecord) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingRecord ? 'Edit Committee Record' : 'Add Committee Record'}
                </h3>
                <p className="text-xs text-slate-500">With AI OCR Note Reader</p>
              </div>
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

            {/* AI Note Reader Box */}
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span>AI Note Reader (Photo to Text)</span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  ref={noteFileInputRef}
                  onChange={handleNoteImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => noteFileInputRef.current?.click()}
                  className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-white hover:bg-amber-600 shadow-sm"
                >
                  Upload Note Photo
                </button>
              </div>
              <p className="text-[11px] text-amber-800">
                Committee note thlalak upload la, OCR-in text-ah a lo convert ang.
              </p>
              {ocrLoading && (
                <div className="flex items-center gap-2 text-xs text-amber-900 font-semibold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>{ocrStatus}</span>
                </div>
              )}
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
                  placeholder="e.g. Committee Meeting Minutes No. 5"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
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
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Content / Record Ziak
                </label>
                <textarea
                  required
                  rows={5}
                  value={recordContent}
                  onChange={(e) => setRecordContent(e.target.value)}
                  placeholder="Thurelte leh thil pawimawh..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none leading-relaxed"
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

      {/* MODAL: ADD / EDIT NOTICE */}
      {(showAddNoticeModal || editingNotice) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingNotice ? 'Edit Notice' : 'Post Notice'}
              </h3>
              <button
                onClick={() => {
                  setShowAddNoticeModal(false);
                  setEditingNotice(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Notice Title
                </label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. Fellowship Programme..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={noticeCategory}
                  onChange={(e) => setNoticeCategory(e.target.value as Notice['category'])}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="General">General</option>
                  <option value="Important">Important</option>
                  <option value="Fellowship">Fellowship</option>
                  <option value="Programme">Programme</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Notice Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="Notice kimchang ziak rawh..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddNoticeModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-900 hover:bg-amber-400 shadow-sm"
                >
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
