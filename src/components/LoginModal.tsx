import React, { useState } from 'react';
import { Member } from '../types';
import { Storage } from '../utils/storage';
import { Phone, User, MapPin, Lock, Shield, ArrowRight, X, CheckCircle, Clock } from 'lucide-react';
import { KPGLogo } from './KPGLogo';
import { NotificationService } from '../utils/notifications';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (member: Member) => void;
}

type LoginMode = 'member_login' | 'register' | 'developer_login';

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<LoginMode>('member_login');

  // Member Login fields
  const [phone, setPhone] = useState('');

  // Register fields (3 fields only: Hming, Veng, Phone - NO PASSWORD)
  const [hming, setHming] = useState('');
  const [veng, setVeng] = useState('Vengpui');
  const [regPhone, setRegPhone] = useState('');
  const [groupPasscode, setGroupPasscode] = useState('');

  // Developer Login fields
  const [devEmail, setDevEmail] = useState('');
  const [devPassword, setDevPassword] = useState('');

  // Status & error states
  const [error, setError] = useState('');
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const [isAutoApproved, setIsAutoApproved] = useState(false);

  if (!isOpen) return null;

  // 1. Member Login (Phone only)
  const handleMemberLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setError('Khawngaihin phone number dik (digit 10) chhu lut rawh.');
      return;
    }

    const members = Storage.getMembers();
    const found = members.find((m) => m.phone.endsWith(clean.slice(-10)));

    if (!found) {
      setError('He phone number hi a la inziak lut lo. "Register" hmetin inziak lut thar rawh le.');
      return;
    }

    if (found.status === 'Pending') {
      setError(
        'I inziahluh dilna hi Developer/Secretary approval a nghak mek e. Approval i hmuh veleh i lut thei ang.'
      );
      return;
    }

    if (found.status === 'Rejected') {
      setError('I account hi remtih a ni lo.');
      return;
    }

    // Approved: Log in immediately without password!
    Storage.setCurrentUser(found);
    onLoginSuccess(found);
    // Ask push permission politely
    NotificationService.requestPermission();
    onClose();
  };

  // 2. Normal Member Registration (Only 3 fields - NO PASSWORD)
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!hming.trim()) {
      setError('Hming chhu lut rawh.');
      return;
    }
    const clean = regPhone.replace(/\D/g, '');
    if (clean.length < 10) {
      setError('Phone number dik (digit 10) chhu lut rawh.');
      return;
    }

    const members = Storage.getMembers();
    const existing = members.find((m) => m.phone.endsWith(clean.slice(-10)));
    if (existing) {
      setError('He phone number hi a inziak lut tawh. Member Login hmangin lut rawh.');
      return;
    }

    // Check if group passcode is entered correctly
    const isPasscodeCorrect = groupPasscode.trim().toUpperCase() === 'KPG2026' || groupPasscode.trim() === 'darlawn2026';
    const statusVal = isPasscodeCorrect ? 'Approved' : 'Pending';

    // Create member
    const newMember = Storage.addMember(
      {
        hming: hming.trim(),
        veng,
        phone: clean,
        role: 'MEMBER',
        status: statusVal,
      },
      true
    );

    if (isPasscodeCorrect) {
      // Auto login them instantly!
      Storage.setCurrentUser(newMember);
      onLoginSuccess(newMember);
      setIsAutoApproved(true);
      NotificationService.requestPermission();
    } else {
      setIsAutoApproved(false);
    }

    setRegistrationSubmitted(true);
  };

  // 3. Developer Login (Secret Email + Password)
  const handleDeveloperLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = devEmail.trim().toLowerCase();
    // Developer Secret validation (jopes500@gmail.com and password darlawn2026 or developer master key)
    if (
      (cleanEmail === 'jopes500@gmail.com' || cleanEmail === 'developer@kpg.org') &&
      (devPassword === 'darlawn2026' || devPassword === 'jopes2026' || devPassword === 'admin2026')
    ) {
      const members = Storage.getMembers();
      let dev = members.find((m) => m.isDeveloper || m.email === 'jopes500@gmail.com');

      if (!dev) {
        // Fallback create Joseph Malsawmzuala Developer
        dev = Storage.addMember({
          hming: 'Joseph Malsawmzuala',
          veng: 'Kanan Veng',
          phone: '9862123456',
          email: 'jopes500@gmail.com',
          role: 'SECRETARY',
          status: 'Approved',
          isDeveloper: true,
        });
      } else {
        dev.isDeveloper = true;
        dev.role = 'SECRETARY';
        Storage.updateMember(dev);
      }

      Storage.setCurrentUser(dev);
      onLoginSuccess(dev);
      NotificationService.requestPermission();
      onClose();
    } else {
      setError('Developer Email emaw Password a dik lo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 text-slate-800 shadow-2xl">
        {/* Header with Close */}
        <div className="flex items-center justify-between">
          <KPGLogo size="sm" showSubtitle={false} lightMode={true} />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-4 flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
          <button
            onClick={() => {
              setMode('member_login');
              setError('');
              setRegistrationSubmitted(false);
            }}
            className={`flex-1 rounded-lg py-2 transition ${
              mode === 'member_login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Member Login
          </button>

          <button
            onClick={() => {
              setMode('register');
              setError('');
              setRegistrationSubmitted(false);
            }}
            className={`flex-1 rounded-lg py-2 transition ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Inziak Lut (3 fields)
          </button>

          <button
            onClick={() => {
              setMode('developer_login');
              setError('');
              setRegistrationSubmitted(false);
            }}
            className={`flex items-center justify-center gap-1 px-3 rounded-lg py-2 transition ${
              mode === 'developer_login'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'hover:text-amber-800'
            }`}
            title="Developer / Secretary Login"
          >
            <Lock className="w-3 h-3" />
            <span>Developer</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. MEMBER LOGIN (PHONE NUMBER ONLY - NO PASSWORD)                         */}
        {/* ========================================================================= */}
        {mode === 'member_login' && (
          <div className="mt-4 space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-black text-slate-900">Member Login</h2>
              <p className="mt-1 text-xs text-slate-500">
                Chhu lut rawh i Phone Number (Password a ngai lo)
              </p>
            </div>

            <form onSubmit={handleMemberLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9862345678"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm font-mono text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-600 transition active:scale-95"
              >
                <span>Lut Rawh (Login)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                I la inziak lut lo em? Heta hian inziak lut rawh →
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. MEMBER REGISTRATION (ONLY 3 FIELDS - NO PASSWORD)                      */}
        {/* ========================================================================= */}
        {mode === 'register' && (
          <div className="mt-4">
            {registrationSubmitted ? (
              isAutoApproved ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm animate-bounce">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Inziahluhna A Tling Nghal E!
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed px-2">
                    KPG Group Passcode dik tak i hman avangin i account approval a tling nghal e. I lut tlang nghal bawk e!
                  </p>
                  <button
                    onClick={() => {
                      setRegistrationSubmitted(false);
                      onClose();
                    }}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition w-full"
                  >
                    Hawt Rawh (Go to Dashboard)
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    I Dilna Thehluh Fel A Ni!
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed px-2">
                    I inziahluhna hi Developer (Joseph Malsawmzuala) hnenah thehluh a ni a, approval a
                    nghak mek e. Approval i hmuh veleh i phone number hmangin i lut thei ang.
                  </p>
                  <button
                    onClick={() => {
                      setRegistrationSubmitted(false);
                      setMode('member_login');
                    }}
                    className="rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-600 transition"
                  >
                    Back to Login
                  </button>
                </div>
              )
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-lg font-black text-slate-900">Member Inziahluhna Thar</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Thil chhu lut la, Group Passcode i hman chuan i lut tlang thei nghal ang.
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-3.5">
                  {/* Field 1: Hming */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      1. Hming (Full Name)
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={hming}
                        onChange={(e) => setHming(e.target.value)}
                        placeholder="I hming pum"
                        className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Field 2: Veng */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      2. Veng (Locality)
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={veng}
                        onChange={(e) => setVeng(e.target.value)}
                        placeholder="e.g. Vengpui, Venghlun, Kanan, Zion, etc."
                        className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Field 3: Phone Number */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      3. Phone Number
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Field 4: Group Passcode */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        4. Group Passcode (A duh tan)
                      </label>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
                        Auto-Approve ⚡
                      </span>
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={groupPasscode}
                        onChange={(e) => setGroupPasscode(e.target.value)}
                        placeholder="KPG2026 (Instant approve leh login nan)"
                        className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      KPG group passcode (<strong>KPG2026</strong>) chhu luttute chu approval nghak lovin automatic-in an lut tlang thei nghal ang!
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-600 transition active:scale-95 text-center cursor-pointer"
                  >
                    <span>Inziak Lut Rawh (Register)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. DEVELOPER LOGIN (SECRET EMAIL + PASSWORD)                              */}
        {/* ========================================================================= */}
        {mode === 'developer_login' && (
          <div className="mt-4 space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300 mb-1">
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                <span>Protected Developer Route</span>
              </div>
              <h2 className="text-lg font-black text-slate-900">Developer / Secretary Login</h2>
              <p className="text-xs text-slate-500">
                Secret credentials hmangin Developer account-ah lut rawh
              </p>
            </div>

            <form onSubmit={handleDeveloperLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Developer Email
                </label>
                <input
                  type="email"
                  required
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="Enter developer email"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Secret Password
                </label>
                <input
                  type="password"
                  required
                  value={devPassword}
                  onChange={(e) => setDevPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Developer verification is required.
                </span>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition active:scale-95"
              >
                <span>Authorize & Login as Developer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
