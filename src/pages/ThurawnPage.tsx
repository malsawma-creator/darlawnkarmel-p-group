import React, { useState } from 'react';
import { Member, Suggestion, isOBRole, isDeveloperUser } from '../types';
import { Storage } from '../utils/storage';
import { NotificationService } from '../utils/notifications';
import {
  Mail,
  Plus,
  EyeOff,
  User,
  Shield,
  CheckCircle,
  X,
  Send,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ThurawnPageProps {
  currentUser: Member | null;
  onOpenLogin: () => void;
  onDataChanged: () => void;
  dataVersion?: number;
}

export const ThurawnPage: React.FC<ThurawnPageProps> = ({
  currentUser,
  onOpenLogin,
  onDataChanged,
}) => {
  const suggestions = Storage.getSuggestions();
  const isOB = (currentUser && isOBRole(currentUser.role)) || isDeveloperUser(currentUser);

  // Filter user's own submitted suggestions for regular member view
  const mySuggestions = suggestions.filter(
    (s) =>
      (currentUser?.id && s.senderId === currentUser.id) ||
      (currentUser?.phone && s.senderPhone === currentUser.phone) ||
      (!s.isAnonymous && currentUser?.hming && s.senderHming === currentUser.hming)
  );

  const [showModal, setShowModal] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editStatus, setEditStatus] = useState<Suggestion['status']>('New');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  const handleOpenEditSuggestion = (s: Suggestion) => {
    if (!isOB) return;
    setEditingSuggestion(s);
    setEditContent(s.content);
    setEditStatus(s.status);
  };

  const handleSaveEditSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOB) return;
    if (!editingSuggestion) return;
    Storage.updateSuggestion({
      ...editingSuggestion,
      content: editContent.trim(),
      status: editStatus,
    });
    setEditingSuggestion(null);
    onDataChanged();
  };

  const handleDeleteSuggestion = (id: string) => {
    if (!isOB) return;
    if (window.confirm('Are you sure you want to delete this suggestion?')) {
      Storage.deleteSuggestion(id);
      onDataChanged();
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const senderHming = currentUser?.hming || 'Group Member';

    Storage.addSuggestion({
      content: content.trim(),
      isAnonymous,
      senderHming: isAnonymous ? undefined : senderHming,
      senderPhone: isAnonymous ? undefined : currentUser?.phone,
      senderId: currentUser?.id,
    });

    // Notify OBs & Developer
    NotificationService.notifyNewSuggestion(senderHming, isAnonymous);

    setContent('');
    setShowModal(false);
    alert('I thurawn chu Hruaitute hnenah a thleng fel e. Ka lawm e!');
    onDataChanged();
  };

  return (
    <div className="space-y-5 pb-28 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shadow-sm">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Thurawn Bawm / Suggestion Box
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Group hmasawnna tura rawtna leh thurawn (OBs te chauhin an hmu thei)
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-700 to-blue-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-blue-600 hover:to-blue-700 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thurawn Thehlut</span>
        </button>
      </div>

      {/* If OB: view ALL suggestions */}
      {isOB ? (
        <div className="space-y-3.5">
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 flex items-center justify-between gap-2 font-medium">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-700 flex-shrink-0" />
              <span>
                OB View: Heng thurawnte hi group member-te thehluh a ni e ({suggestions.length}).
              </span>
            </div>
          </div>

          {suggestions.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-6">
              <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">Thurawn thehlut an la awm lo.</p>
            </div>
          ) : (
            suggestions.map((sug) => (
              <div
                key={sug.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    {sug.isAnonymous ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-600">Hming Thup (Anonymous)</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5 text-blue-700" />
                        <span>{sug.senderHming || 'Member'} {sug.senderPhone ? `(+91 ${sug.senderPhone})` : ''}</span>
                      </>
                    )}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(sug.createdAt).toLocaleDateString()}
                    </span>
                    {/* EDIT & DELETE BUTTONS - Visible to OBs */}
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleOpenEditSuggestion(sug)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition"
                        title="Edit Suggestion"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSuggestion(sug.id)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Delete Suggestion"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {sug.content}
                </p>

                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Status:{' '}
                    <strong
                      className={`ml-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                        sug.status === 'In Action'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sug.status === 'Reviewed'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {sug.status}
                    </strong>
                  </span>
                  <div className="flex gap-1.5">
                    {sug.status !== 'Reviewed' && (
                      <button
                        onClick={() => {
                          Storage.updateSuggestionStatus(sug.id, 'Reviewed');
                          onDataChanged();
                        }}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
                      >
                        Mark Reviewed
                      </button>
                    )}
                    {sug.status !== 'In Action' && (
                      <button
                        onClick={() => {
                          Storage.updateSuggestionStatus(sug.id, 'In Action');
                          onDataChanged();
                        }}
                        className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        In Action
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Regular Member View */
        <div className="space-y-5">
          {/* Action Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center text-slate-600 shadow-sm space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto shadow-sm">
              <Mail className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Thurawn I Nei Em?</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Group hmasawnna tura rawtna leh thurawn i neih chuan a hnuai button hmang hian OB te hnenah thawn rawh le. Hming thup (anonymous)-in a thawn theih bawk e.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-600 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thurawn Thehlut</span>
            </button>
          </div>

          {/* Member's Own Submitted Suggestions */}
          {mySuggestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>I Thurawn Thehluh Tawhte ({mySuggestions.length})</span>
              </h2>

              {mySuggestions.map((sug) => (
                <div
                  key={sug.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-600 flex items-center gap-1">
                      {sug.isAnonymous ? (
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span>{sug.isAnonymous ? 'Hming Thup' : 'I hming langin'}</span>
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(sug.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                    {sug.content}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Status:{' '}
                      <strong
                        className={`ml-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                          sug.status === 'In Action'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sug.status === 'Reviewed'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {sug.status}
                      </strong>
                    </span>
                    <button
                      onClick={() => handleDeleteSuggestion(sug.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: SUBMIT SUGGESTION */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Thurawn Thehlut</h3>
                <p className="text-xs text-slate-500">OBs te hnenah direct-in a thleng ang</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSend} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  I Thurawn / Suggestion
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="KPG Darlawn Karmel Branch Group tana i rawtna..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Anonymous Toggle */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-slate-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Hming Thup (Anonymous)</div>
                    <div className="text-[10px] text-slate-500">
                      {isAnonymous ? 'I hming a lang dawn lo' : 'I hming a lang dawn'}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-600 shadow-sm"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SUGGESTION (OB / Developer Only) */}
      {editingSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Suggestion</h3>
                <p className="text-xs text-slate-500">Update suggestion text or status</p>
              </div>
              <button
                onClick={() => setEditingSuggestion(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSuggestion} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Thurawn Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Suggestion['status'])}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="New">New</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="In Action">In Action</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSuggestion(null)}
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
    </div>
  );
};
