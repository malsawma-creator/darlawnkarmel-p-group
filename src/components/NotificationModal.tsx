import React from 'react';
import { Member, isDeveloperUser } from '../types';
import { NotificationService } from '../utils/notifications';
import { Bell, Check, X, ShieldAlert, Sparkles, Clock, Trash2, Mail } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Member | null;
  onDataChanged: () => void;
  onNavigateToManageMembers?: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onDataChanged,
  onNavigateToManageMembers,
}) => {
  if (!isOpen) return null;

  const notifications = NotificationService.getUserNotifications(currentUser);
  const isDev = isDeveloperUser(currentUser);
  const unreadCount = NotificationService.getUnreadCount(currentUser);
  const hasPush = NotificationService.hasPermission();

  const handleMarkAllRead = () => {
    NotificationService.markAllAsRead(currentUser);
    onDataChanged();
  };

  const handleDelete = (id: string) => {
    NotificationService.deleteNotification(id);
    onDataChanged();
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all notifications?')) {
      NotificationService.clearAllNotifications();
      onDataChanged();
    }
  };

  const handleEnablePush = async () => {
    const granted = await NotificationService.requestPermission();
    if (granted) {
      NotificationService.showBrowserNotification(
        'P Group Darlawn',
        'Push notifications are enabled successfully!'
      );
    }
    onDataChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 text-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Notifications</h2>
              <p className="text-[11px] text-slate-500">
                P Group Darlawn Updates & Alerts {unreadCount > 0 && `(${unreadCount} unread)`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Push notification banner if not enabled */}
        {!hasPush && (
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3 flex items-center justify-between gap-2">
            <div className="text-xs text-blue-900 font-medium">
              📱 Receive push notifications on your phone/device?
            </div>
            <button
              onClick={handleEnablePush}
              className="text-xs font-bold text-white bg-blue-700 hover:bg-blue-600 px-3 py-1.5 rounded-lg shrink-0 transition"
            >
              Enable
            </button>
          </div>
        )}

        {/* Notifications list */}
        <div className="mt-3.5 max-h-80 overflow-y-auto space-y-2.5 pr-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
              <Bell className="w-8 h-8 text-slate-300 mb-2" />
              <span>No notifications yet.</span>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = !n.readBy.includes(currentUser?.id || 'guest');
              return (
                <div
                  key={n.id}
                  className={`rounded-xl border p-3 text-xs transition relative group ${
                    isUnread
                      ? 'border-blue-300 bg-blue-50/40 shadow-xs'
                      : 'border-slate-100 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {n.type === 'suggestion' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                          <Mail className="w-3 h-3 text-purple-700" />
                          <span>Thurawn / Suggestion</span>
                        </span>
                      ) : n.forDeveloperOnly ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          <ShieldAlert className="w-3 h-3 text-amber-700" />
                          <span>Developer Approval</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                          <Sparkles className="w-3 h-3 text-blue-700" />
                          <span>Branch Update</span>
                        </span>
                      )}
                      <span className="font-bold text-slate-900">{n.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(n.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-600 leading-relaxed text-[11px]">{n.message}</p>

                  {n.forDeveloperOnly && isDev && onNavigateToManageMembers && (
                    <div className="mt-2 pt-2 border-t border-amber-200/50 flex justify-end">
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToManageMembers();
                        }}
                        className="text-[11px] font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition"
                      >
                        Open Manage Members →
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear all</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
