import React, { useState, useRef } from 'react';
import { Member, isDeveloperUser, ROLE_LABELS } from '../types';
import { Storage } from '../utils/storage';
import { requestNotificationToken } from '../utils/firebaseService';
import { supabase, runHardcoreDemoCleanup } from '../utils/supabase';
import { MemberAvatar } from '../components/MemberAvatar';
import { AvatarPreviewModal, AvatarPreviewData } from '../components/AvatarPreviewModal';
import { processProfileImage, uploadProfilePhotoToStorage } from '../utils/imageUtils';
import {
  Settings,
  Shield,
  User,
  CheckCircle,
  RefreshCw,
  Info,
  ArrowRight,
  Trash2,
  Camera,
  Image as ImageIcon,
  Loader2,
  X,
} from 'lucide-react';
import { TabType } from '../components/BottomNav';

interface SettingsPageProps {
  currentUser: Member | null;
  onOpenLogin: () => void;
  onDataChanged: () => void;
  onNavigate?: (tab: TabType) => void;
  dataVersion?: number;
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

  // Photo state & modal
  const [showPhotoOptionsModal, setShowPhotoOptionsModal] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewAvatar, setPreviewAvatar] = useState<AvatarPreviewData | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploadingPhoto(true);
    setUploadError('');
    setShowPhotoOptionsModal(false);

    try {
      // 1. Crop to square 1:1, compress to max 100KB with width 300px
      const processed = await processProfileImage(file);

      // 2. Upload to Firebase Storage path profile_pics/{userId}.jpg
      const photoUrl = await uploadProfilePhotoToStorage(
        currentUser.id,
        processed.blob,
        processed.dataUrl
      );

      // 3. Save download URL to member's photoUrl
      const updatedMember: Member = {
        ...currentUser,
        photoUrl,
        avatarUrl: photoUrl,
      };

      Storage.updateMember(updatedMember);
      onDataChanged();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err: any) {
      console.error('Profile photo error:', err);
      setUploadError(err.message || 'Thlalak upload theih a ni lo tlat.');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    if (!currentUser) return;
    if (window.confirm('I profile picture hi paih i duh takzet em?')) {
      const updatedMember: Member = {
        ...currentUser,
        photoUrl: undefined,
        avatarUrl: undefined,
      };
      Storage.updateMember(updatedMember);
      setShowPhotoOptionsModal(false);
      onDataChanged();
    }
  };

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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {/* CENTER TOP: BIG CIRCULAR AVATAR 120px */}
          <div className="flex flex-col items-center justify-center text-center pb-6 mb-6 border-b border-slate-100">
            <div className="relative group">
              <MemberAvatar
                name={currentUser.hming}
                photoUrl={currentUser.photoUrl || currentUser.avatarUrl}
                size={120}
                onClick={() =>
                  setPreviewAvatar({
                    name: currentUser.hming,
                    photoUrl: currentUser.photoUrl || currentUser.avatarUrl,
                    veng: currentUser.veng,
                    role: currentUser.role,
                  })
                }
                className="ring-4 ring-slate-100 shadow-xl"
              />

              <button
                type="button"
                onClick={() => setShowPhotoOptionsModal(true)}
                disabled={isUploadingPhoto}
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-blue-700 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white transition active:scale-95"
                title="Edit Photo"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* BUTTON "Edit Photo" */}
            <button
              type="button"
              onClick={() => setShowPhotoOptionsModal(true)}
              disabled={isUploadingPhoto}
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
            >
              {isUploadingPhoto ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Processing & Uploading...</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 text-blue-700" />
                  <span>Edit Photo</span>
                </>
              )}
            </button>

            {/* Member Details */}
            <h2 className="text-xl font-black text-slate-900 mt-3 tracking-tight">
              {currentUser.hming}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              {currentUser.role !== 'MEMBER' && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {ROLE_LABELS[currentUser.role] || currentUser.role}
                </span>
              )}
              <span className="text-xs text-slate-500 font-medium">
                {currentUser.veng}
              </span>
            </div>

            {uploadError && (
              <p className="mt-2 text-xs text-rose-600 font-medium">{uploadError}</p>
            )}
          </div>

          {/* HIDDEN INPUTS FOR CAMERA & GALLERY */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoFileSelected}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoFileSelected}
          />

          <h3 className="text-sm font-bold text-slate-900 mb-1">Personal Details</h3>
          <p className="text-xs text-slate-500 mb-4">I contact information siamthatna</p>

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
                Notifications
              </label>
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Push Notifications</span>
                <button
                  type="button"
                  onClick={async () => {
                    const enabled = !currentUser?.notificationsEnabled;
                    if (enabled) {
                      const permission = await Notification.requestPermission();
                      if (permission !== 'granted') {
                        alert('Browser-ah notification i block tlat a, settings-ah rawn en nawn leh rawh.');
                        return;
                      }
                      // VAPID Key will be inserted here
                      const token = await requestNotificationToken('YOUR_VAPID_KEY_HERE');
                      if (token) {
                         // TODO: Store token in Firestore for this user
                      }
                    }
                    Storage.updateMember({ ...currentUser!, notificationsEnabled: enabled });
                    onDataChanged();
                  }}
                  className={`w-10 h-5 rounded-full p-0.5 transition ${currentUser?.notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition ${currentUser?.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
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

      {/* MODAL: PHOTO OPTIONS (Take Photo / Choose Gallery) */}
      {showPhotoOptionsModal && (
        <div
          onClick={() => setShowPhotoOptionsModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Profile Photo</h3>
                  <p className="text-[11px] text-slate-500">Square 1:1, Max 100KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoOptionsModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {/* Option 1: Take Photo */}
              <button
                type="button"
                onClick={() => {
                  cameraInputRef.current?.click();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Take Photo (Camera)</div>
                  <p className="text-[11px] text-slate-500">Phone camera hmangin thla la nghal rawh</p>
                </div>
              </button>

              {/* Option 2: Choose Gallery */}
              <button
                type="button"
                onClick={() => {
                  galleryInputRef.current?.click();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Choose from Gallery</div>
                  <p className="text-[11px] text-slate-500">Phone gallery-a thlalak awmsa thlang rawh</p>
                </div>
              </button>

              {/* Option 3: Remove photo (if exists) */}
              {(currentUser?.photoUrl || currentUser?.avatarUrl) && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-rose-100 hover:border-rose-300 hover:bg-rose-50/60 transition text-left text-rose-600"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Remove Photo</div>
                    <p className="text-[11px] text-rose-400">Profile picture paih leh hming hmasa chauh tarlang rawh</p>
                  </div>
                </button>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPhotoOptionsModal(false)}
                className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Avatar Preview Modal */}
      <AvatarPreviewModal
        isOpen={Boolean(previewAvatar)}
        onClose={() => setPreviewAvatar(null)}
        data={previewAvatar}
      />
    </div>
  );
};
