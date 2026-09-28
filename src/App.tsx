import React, { useState, useEffect } from 'react';
import { Storage } from './utils/storage';
import { syncAllCollections } from './utils/firebaseService';
import { Member } from './types';
import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { HruaitutePage } from './pages/HruaitutePage';
import { IntihsiaknaPage } from './pages/IntihsiaknaPage';
import { FinancePage } from './pages/FinancePage';
import { RecordsPage } from './pages/RecordsPage';
import { ThurawnPage } from './pages/ThurawnPage';
import { SettingsPage } from './pages/SettingsPage';
import { RoleManagementPage } from './pages/RoleManagementPage';
import { LoginModal } from './components/LoginModal';
import { NotificationService } from './utils/notifications';
import { Clock, LogOut, RefreshCw, Phone, Lock, Shield, ArrowRight } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    Storage.init();
    
    // Seed Firestore with initial mock data if empty
    Storage.seedInitialData().catch(console.error);

    const user = Storage.getCurrentUser();
    setCurrentUser(user);

    // Start real-time sync with central Firebase Cloud Database
    const unsubscribeSync = syncAllCollections(() => {
      setDataVersion((v) => v + 1);
      setCurrentUser(Storage.getCurrentUser());
    });

    // Request notification permission politely on start/install
    NotificationService.requestPermission();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeSync();
    };
  }, []);

  const handleDataChanged = () => {
    setDataVersion((v) => v + 1);
    setCurrentUser(Storage.getCurrentUser());
  };

  const handleLogout = () => {
    Storage.setCurrentUser(null);
    setCurrentUser(null);
    handleDataChanged();
  };

  // Embedded login states & handlers
  const [loginMode, setLoginMode] = useState<'member_login' | 'register' | 'developer_login'>('member_login');
  const [phone, setPhone] = useState('');
  const [hming, setHming] = useState('');
  const [veng, setVeng] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [inlinePasscode, setInlinePasscode] = useState('');
  const [bypassPasscode, setBypassPasscode] = useState('');
  const [bypassError, setBypassError] = useState('');
  const [devEmail, setDevEmail] = useState('');
  const [devPassword, setDevPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const handlePasscodeBypass = (e: React.FormEvent) => {
    e.preventDefault();
    setBypassError('');
    if (!currentUser) return;
    const codeClean = bypassPasscode.trim().toUpperCase().replace(/\s/g, '');
    const isPasscodeCorrect = 
      codeClean === 'KPG2026' || 
      codeClean === 'KGP2026' || 
      codeClean === 'KPG' || 
      codeClean === 'KGP' || 
      codeClean === 'DARLAWN2026' || 
      codeClean === 'DARLAWN';

    if (isPasscodeCorrect) {
      const updated = { ...currentUser, status: 'Approved' as const };
      Storage.updateMember(updated);
      Storage.setCurrentUser(updated);
      setCurrentUser(updated);
      handleDataChanged();
    } else {
      setBypassError('Passcode a dik lo. KPG2026 emaw KGP2026 hmang rawh.');
    }
  };

  const handleInlineMemberLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setLoginError('Khawngaihin phone number dik (digit 10) chhu lut rawh.');
      return;
    }

    const members = Storage.getMembers();
    const found = members.find((m) => m.phone.endsWith(clean.slice(-10)));

    if (!found) {
      setLoginError('He phone number hi a la inziak lut lo. "Register" hmetin inziak lut thar rawh le.');
      return;
    }

    if (found.status === 'Rejected') {
      setLoginError('I account hi remtih a ni lo.');
      return;
    }

    Storage.setCurrentUser(found);
    setCurrentUser(found);
    handleDataChanged();
  };

  const handleInlineRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!hming.trim()) {
      setLoginError('Hming chhu lut rawh.');
      return;
    }
    const clean = regPhone.replace(/\D/g, '');
    if (clean.length < 10) {
      setLoginError('Phone number dik (digit 10) chhu lut rawh.');
      return;
    }

    const members = Storage.getMembers();
    const existing = members.find((m) => m.phone.endsWith(clean.slice(-10)));
    if (existing) {
      setLoginError('He phone number hi a inziak lut tawh. Member Login hmangin lut rawh.');
      return;
    }

    const codeClean = inlinePasscode.trim().toUpperCase().replace(/\s/g, '');
    const isPasscodeCorrect = 
      codeClean === 'KPG2026' || 
      codeClean === 'KGP2026' || 
      codeClean === 'KPG' || 
      codeClean === 'KGP' || 
      codeClean === 'DARLAWN2026' || 
      codeClean === 'DARLAWN';
    const statusVal = isPasscodeCorrect ? 'Approved' : 'Pending';

    const newMember = Storage.addMember({
      hming: hming.trim(),
      veng,
      phone: clean,
      role: 'MEMBER',
      status: statusVal,
    }, true);

    if (isPasscodeCorrect) {
      Storage.setCurrentUser(newMember);
      setCurrentUser(newMember);
      handleDataChanged();
    } else {
      setRegSuccess(true);
    }
  };

  const handleInlineDevLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanEmail = devEmail.trim().toLowerCase();
    if (
      (cleanEmail === 'jopes500@gmail.com' || cleanEmail === 'developer@kpg.org') &&
      (devPassword === 'darlawn2026' || devPassword === 'jopes2026' || devPassword === 'admin2026')
    ) {
      const members = Storage.getMembers();
      let dev = members.find((m) => m.isDeveloper || m.email === 'jopes500@gmail.com');
      if (!dev) {
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
      setCurrentUser(dev);
      handleDataChanged();
    } else {
      setLoginError('Developer Email emaw Password a dik lo.');
    }
  };

  // If user registered and is currently in PENDING state: CANNOT see app data!
  const isPendingUser = currentUser && currentUser.status === 'Pending';

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 selection:bg-amber-100 selection:text-blue-900 flex flex-col font-sans">
      {/* Subtle Light Christian Cross ✝️ Background Watermark */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10v40M20 22h20' stroke='%231E3A8A' stroke-width='2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenLogin={() => setShowLoginModal(true)}
        onUserChanged={(u) => {
          setCurrentUser(u);
          handleDataChanged();
        }}
        onNavigate={(tab) => setCurrentTab(tab)}
        isOnline={isOnline}
      />

      {/* Main Container */}
      <main className="relative z-10 flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 pt-4">
        {!currentUser ? (
          /* STUNNING EMBEDDED LOCK SCREEN */
          <div className="py-8 sm:py-12 flex flex-col items-center justify-center animate-in fade-in max-w-md mx-auto">
            <div className="w-full bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-2xs">
                  ✝️
                </div>
                <h2 className="text-xl font-black text-slate-950 tracking-tight">KPG Darlawn</h2>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Karmel Branch P Group member management & activity hub ah hian khawngaihin inziaklut/lut hmasa rawh le.
                </p>
              </div>

              {/* Mode Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => { setLoginMode('member_login'); setLoginError(''); setRegSuccess(false); }}
                  className={`flex-1 rounded-lg py-2 transition ${loginMode === 'member_login' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'}`}
                >
                  Member Login
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode('register'); setLoginError(''); setRegSuccess(false); }}
                  className={`flex-1 rounded-lg py-2 transition ${loginMode === 'register' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'}`}
                >
                  Inziak Lut
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode('developer_login'); setLoginError(''); setRegSuccess(false); }}
                  className={`flex items-center justify-center gap-1 px-3 rounded-lg py-2 transition ${loginMode === 'developer_login' ? 'bg-amber-400 text-slate-950 shadow-2xs' : 'hover:text-amber-800'}`}
                >
                  <Lock className="w-3 h-3" />
                  <span>Admin</span>
                </button>
              </div>

              {loginError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
                  {loginError}
                </div>
              )}

              {/* Form Render */}
              {loginMode === 'member_login' && (
                <form onSubmit={handleInlineMemberLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Phone Number</label>
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
                  <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-600 transition">
                    <span>Lut Rawh (Login)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {loginMode === 'register' && (
                <div>
                  {regSuccess ? (
                    <div className="text-center py-4 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
                        <Clock className="w-6 h-6 animate-pulse" />
                      </div>
                      <h3 className="text-base font-bold text-slate-950">Dilna Thehluh A Ni!</h3>
                      <p className="text-xs text-slate-600 leading-relaxed px-1">
                        I inziahluhna hi Developer (Joseph Malsawmzuala) approval a nghak mek e. Lo nghak hlek rawh le.
                      </p>
                      <button
                        onClick={() => { setRegSuccess(false); setLoginMode('member_login'); }}
                        className="text-xs text-blue-700 font-bold hover:underline"
                      >
                        Back to Login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleInlineRegister} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Hming (Full Name)</label>
                        <input
                          type="text"
                          required
                          value={hming}
                          onChange={(e) => setHming(e.target.value)}
                          placeholder="F. Laltanpuia"
                          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Veng (Locality / Address)</label>
                        <input
                          type="text"
                          required
                          value={veng}
                          onChange={(e) => setVeng(e.target.value)}
                          placeholder="e.g. Vengpui"
                          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="Phone number dik (digit 10)"
                          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Group Passcode (Optional)</label>
                        <input
                          type="text"
                          value={inlinePasscode}
                          onChange={(e) => setInlinePasscode(e.target.value)}
                          placeholder="KPG2026 (Instant approval nan)"
                          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500 mt-1.5 block leading-relaxed">
                          Group passcode (<strong>KPG2026</strong>) hmangtute chu approval nghak lovin automatic-in an lut tlang nghal thei ang!
                        </span>
                      </div>
                      <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-600 transition">
                        <span>Inziak Lut Rawh</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              )}

              {loginMode === 'developer_login' && (
                <form onSubmit={handleInlineDevLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Developer Email</label>
                    <input
                      type="email"
                      required
                      value={devEmail}
                      onChange={(e) => setDevEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Secret Password</label>
                    <input
                      type="password"
                      required
                      value={devPassword}
                      onChange={(e) => setDevPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block font-semibold">
                      Developer verification is required.
                    </span>
                  </div>
                  <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition">
                    <span>Lut Rawh (Admin)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : isPendingUser ? (
          /* PENDING SCREEN: cannot see app data until approved by Developer */
          <div className="py-16 text-center space-y-4 max-w-md mx-auto animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Registration Approval Nghak Mek
            </h2>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Hming:</span>
                <span className="font-bold text-slate-900">{currentUser.hming}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Veng:</span>
                <span className="font-bold text-slate-900">{currentUser.veng}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Phone Number:</span>
                <span className="font-mono font-bold text-slate-900">+91 {currentUser.phone}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                  Pending Approval
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed px-2">
              I inziahluh dilna hi Developer/Secretary-in a lo hmu tawh a, a approve veleh app chhung
              data zawng zawng i en thei ang. Khawngaihin lo nghak rih rawh le.
            </p>
            <form onSubmit={handlePasscodeBypass} className="bg-white border border-slate-200 rounded-2xl p-4 max-w-md mx-auto space-y-3 shadow-2xs">
              <label className="block text-xs font-bold uppercase text-slate-700 text-left">
                Group Passcode hmangin approve nghal rawh:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. KPG2026"
                  value={bypassPasscode}
                  onChange={(e) => setBypassPasscode(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 transition"
                >
                  Unlock
                </button>
              </div>
              {bypassError && (
                <p className="text-[10px] font-semibold text-rose-600 text-left">{bypassError}</p>
              )}
            </form>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={handleDataChanged}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check Status</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardPage
                key="dash-page"
                dataVersion={dataVersion}
                currentUser={currentUser}
                onNavigate={(tab) => setCurrentTab(tab)}
                onOpenLogin={() => setShowLoginModal(true)}
                onDataChanged={handleDataChanged}
              />
            )}

            {currentTab === 'members' && (
              <MembersPage
                key="mem-page"
                dataVersion={dataVersion}
                currentUser={currentUser}
                onOpenLogin={() => setShowLoginModal(true)}
                onDataChanged={handleDataChanged}
              />
            )}

            {currentTab === 'hruaitute' && (
              <HruaitutePage
                key="hruai-page"
                dataVersion={dataVersion}
                currentUser={currentUser}
                onOpenLogin={() => setShowLoginModal(true)}
                onDataChanged={handleDataChanged}
              />
            )}

            {currentTab === 'intihsiakna' && (
              <IntihsiaknaPage
                key="comp-page"
                dataVersion={dataVersion}
                currentUser={currentUser}
                onOpenLogin={() => setShowLoginModal(true)}
                onDataChanged={handleDataChanged}
              />
            )}

            {currentTab === 'finance' && (
              <FinancePage
                key="fin-page"
                dataVersion={dataVersion}
                currentUser={currentUser}
                onOpenLogin={() => setShowLoginModal(true)}
                onDataChanged={handleDataChanged}
              />
            )}

            {currentTab === 'records' && (
              <RecordsPage
                key="rec-page"
                dataVersion={dataVersion}
                currentUser={currentUser}
                onOpenLogin={() => setShowLoginModal(true)}
                onDataChanged={handleDataChanged}
              />
            )}

            {currentTab === 'thurawn' && (
              <ThurawnPage
                key="thu-page"
                dataVersion={dataVersion}
                currentUser={currentUser}
                onOpenLogin={() => setShowLoginModal(true)}
                onDataChanged={handleDataChanged}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsPage
                key="set-page"
                dataVersion={dataVersion}
                currentUser={currentUser}
                onOpenLogin={() => setShowLoginModal(true)}
                onDataChanged={handleDataChanged}
                onNavigate={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'role_management' && (
              <RoleManagementPage
                key="role-page"
                dataVersion={dataVersion}
                currentUser={currentUser}
                onOpenLogin={() => setShowLoginModal(true)}
                onDataChanged={handleDataChanged}
              />
            )}
          </>
        )}
      </main>

      {/* Direct Bottom Navigation (NO 'More' column!) */}
      {!isPendingUser && currentUser && (
        <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={(m) => {
          setCurrentUser(m);
          handleDataChanged();
        }}
      />
    </div>
  );
}
