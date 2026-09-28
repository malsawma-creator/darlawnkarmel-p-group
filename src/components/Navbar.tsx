import React, { useState } from 'react';
import { Member, isDeveloperUser, ROLE_LABELS } from '../types';
import { KPGLogo } from './KPGLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { NotificationModal } from './NotificationModal';
import { NotificationService } from '../utils/notifications';
import { User, LogIn, LogOut, WifiOff, Settings, Bell, ShieldCheck } from 'lucide-react';
import { Storage } from '../utils/storage';
import { TabType } from './BottomNav';

interface NavbarProps {
  currentUser: Member | null;
  onOpenLogin: () => void;
  onUserChanged: (user: Member | null) => void;
  onNavigate: (tab: TabType) => void;
  isOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenLogin,
  onUserChanged,
  onNavigate,
  isOnline,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const isDev = isDeveloperUser(currentUser);
  const unreadCount = NotificationService.getUnreadCount(currentUser);

  const handleLogout = () => {
    Storage.setCurrentUser(null);
    onUserChanged(null);
    setShowUserMenu(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Left: Logo (P Group, Darlawn Karmel Branch) */}
          <div onClick={() => onNavigate('dashboard')} className="cursor-pointer">
            <KPGLogo size="md" showSubtitle={true} lightMode={true} />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {!isOnline && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                <WifiOff className="w-3 h-3" />
                <span className="hidden sm:inline">Offline</span>
              </div>
            )}

            {/* Bell Icon with Unread Count Badge */}
            <button
              onClick={() => setShowNotificationModal(true)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Compact Install Button */}
            <div className="hidden sm:block">
              <PWAInstallButton variant="compact" />
            </div>

            {/* Manage Members & Roles shortcut button - ONLY for Developer */}
            {isDev && (
              <button
                onClick={() => onNavigate('role_management')}
                className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 px-2.5 py-1.5 text-xs font-bold hover:bg-amber-200 transition shadow-2xs"
                title="Manage Members & Roles (Developer Only)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Manage Roles</span>
              </button>
            )}

            {/* Settings shortcut button */}
            <button
              onClick={() => onNavigate('settings')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-2 pr-3 text-xs text-slate-800 hover:bg-slate-100 transition shadow-xs"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700 text-white font-black shadow-xs">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  {/* Name with Secretary tag or Super Admin */}
                  <div className="text-left hidden sm:block">
                    <div className="font-bold text-slate-900 leading-none max-w-[130px] truncate">
                      {currentUser.hming}
                    </div>
                    <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block mt-0.5 leading-none">
                      {isDev ? 'Super Admin 👑' : (ROLE_LABELS[currentUser.role] || currentUser.role)}
                    </span>
                  </div>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-800 shadow-xl z-50 animate-in fade-in">
                    <div className="border-b border-slate-100 pb-2.5 mb-2.5">
                      <div className="font-bold text-sm text-slate-900 flex items-center justify-between gap-1.5">
                        <span>{currentUser.hming}</span>
                        {isDev ? (
                          <span className="rounded bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 tracking-wider uppercase">
                            Admin 👑
                          </span>
                        ) : (
                          <span className="rounded bg-slate-100 text-slate-700 font-bold text-[9px] px-1.5 py-0.5">
                            {ROLE_LABELS[currentUser.role]}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {currentUser.veng} • +91 {currentUser.phone}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      {/* Developer Only screen link */}
                      {isDev && (
                        <button
                          onClick={() => {
                            onNavigate('role_management');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold border border-amber-200 transition"
                        >
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                            <span>Manage Members & Roles</span>
                          </span>
                          <span className="text-[9px] uppercase font-mono bg-amber-200 px-1.5 py-0.5 rounded">
                            Dev
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onNavigate('settings');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Settings & Profile</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 rounded-xl bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-600 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Notifications Drawer/Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        currentUser={currentUser}
        onDataChanged={() => {}}
        onNavigateToManageMembers={() => onNavigate('role_management')}
      />
    </>
  );
};
