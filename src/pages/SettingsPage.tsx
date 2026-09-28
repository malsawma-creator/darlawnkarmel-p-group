import React, { useState } from 'react';
import { Member, isDeveloperUser } from '../types';
import { Storage } from '../utils/storage';
import { supabase, runHardcoreDemoCleanup } from '../utils/supabase';
import {
  Settings,
  Shield,
  User,
  CheckCircle,
  RefreshCw,
  Info,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { TabType } from '../components/BottomNav';

interface SettingsPageProps {
  currentUser: Member | null;
  onOpenLogin: () => void;
  onDataChanged: () => void;
  onNavigate?: (tab: TabType) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  onOpenLogin,
  onDataChanged,
  onNavigate,
}) => {
  const isDev = isDeveloperUser(currentUser);

  // Profile Edit state
  const [editHming, setEditHming] = useState(currentUser?.hming || '');
  const [editVeng, setEditVeng] = useState(currentUser?.veng || 'Vengpui');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [profileSaved, setProfileSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    const updated: Member = {
      ...currentUser,
      hming: editHming.trim(),
      veng: editVeng,
      phone: editPhone.replace(/\D/g, ''),
    };

    Storage.updateMember(updated);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
    onDataChanged();
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleHardcoreDeleteDemo = async () => {
    if (!isDev) return;
    if (confirm("Database zawng zawng clear fai vek duh tak tak em? (Hei hian cloud database a clear vek dawn a, phone dang zawng zawngah pawh a bo nghal vek ang)")) {
      try {
        setIsProcessing(true);
        await Storage.clearAllFirestoreData();
        localStorage.clear();
        alert("Cloud database leh phone data zawng zawng clear fai vek a ni ta! App hi a lo in-reload ang.");
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("Error: Clear theih a ni lo tlat.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleResetData = async () => {
    if (!isDev) return;
    if (
      window.confirm(
        'Are you sure you want to reset all app data back to the default starting state? This will restore original mock members, meetings, and finance records across ALL devices.'
      )
    ) {
      try {
        setIsProcessing(true);
        await Storage.resetToDefault();
        alert("Application reset completion! Reloading now...");
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("Error in resetting database.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shadow-sm">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Settings & Management
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Personal contact details & system configuration
          </p>
        </div>
      </div>

      {/* PRIVATE ROLE MANAGEMENT LINK - DEVELOPER ONLY */}
      {isDev && onNavigate && (
        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-amber-950">
                  Manage Members & Roles
                </span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-200 text-amber-900 font-mono">
                  Private Developer Screen
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Approve pending requests, assign designations, remove fake accounts.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('role_management')}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 text-xs font-bold shadow-xs transition self-start sm:self-auto"
          >
            <span>Open Screen</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* USER PROFILE */}
      {currentUser ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1">My Profile</h2>
          <p className="text-xs text-slate-500 mb-4">Update your personal contact details</p>

          <form onSubmit={handleSaveProfile} className="space-y-3.5 max-w-md">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Hming (Name)
              </label>
              <input
                type="text"
                required
                value={editHming}
                onChange={(e) => setEditHming(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Veng (Locality)
              </label>
              <input
                type="text"
                required
                value={editVeng}
                onChange={(e) => setEditVeng(e.target.value)}
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
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 shadow-sm"
              >
                Save
              </button>
              {profileSaved && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Profile updated!
                </span>
              )}
            </div>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 mb-3">Profile edit turin login rawh le.</p>
          <button
            onClick={onOpenLogin}
            className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-600"
          >
            Login
          </button>
        </div>
      )}

      {/* ABOUT APPLICATION & DEVELOPER */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-800 shadow-xs">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">About Application</h2>
            <p className="text-xs text-slate-500">System Information & Developer Credits</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Branch</span>
            <span className="font-bold text-slate-900">P Group, Darlawn Karmel Branch</span>
          </div>

          <div className="border-t border-slate-200/60 pt-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Version</span>
            <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 text-[11px]">
              2026 Release (v1.2)
            </span>
          </div>

          <div className="border-t border-slate-200/60 pt-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Developed & Maintained by</span>
            <div className="text-right">
              {/* Joseph Malsawmzuala ONLY - Designation ONLY inside Office Bearers list */}
              <span className="font-bold text-slate-900">Joseph Malsawmzuala</span>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Platform</span>
            <span className="text-slate-700 font-medium">P Group Web & Progressive Web App (PWA)</span>
          </div>
        </div>
      </div>

      {/* Reset & Hardcore Delete Data - DEVELOPER ONLY */}
      {isDev && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-rose-300 bg-rose-50/60 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-rose-950">Hardcore Delete All Demo Data</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
                  FIREBASE CLOUD SYNC
                </span>
              </div>
              <div className="text-xs text-rose-800 mt-0.5">
                Paih fai vek: Demo members, demo budget, demo posts, demo rawtna, leh photo contest demo zawng zawng.
              </div>
            </div>
            <button
              onClick={handleHardcoreDeleteDemo}
              disabled={isProcessing}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm transition self-start sm:self-auto disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Processing...' : 'Delete All Demo Data'}</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">Reset Application Default</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Developer Only
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Restores standard 2026 branch starting structure.
              </div>
            </div>
            <button
              onClick={handleResetData}
              disabled={isProcessing}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-2xs transition self-start sm:self-auto disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Processing...' : 'Reset State'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
