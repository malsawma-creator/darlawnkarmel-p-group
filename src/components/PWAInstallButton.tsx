import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, CheckCircle, Share, PlusSquare, X } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'large' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'large' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (res) {
        setJustInstalled(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  if (isInstalled || justInstalled) {
    if (variant === 'compact') return null;
    return (
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>KPG App is installed & running in app mode</span>
      </div>
    );
  }

  return (
    <>
      {variant === 'large' ? (
        <button
          onClick={handleInstallClick}
          className="group relative w-full overflow-hidden rounded-2xl bg-white border border-amber-300 p-4 shadow-sm hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-sm">
                <Download className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black uppercase tracking-wider text-slate-900">
                    Install P Group App
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                    PWA • Fast
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add P Group, Darlawn Karmel to your phone home screen for offline access
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs">
              <Smartphone className="w-4 h-4" />
              <span>Install Now</span>
            </div>
          </div>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-amber-700" />
          <span>Install App</span>
        </button>
      )}

      {/* Installation Guide Modal (for iOS or Desktop Chrome) */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Install KPG App</h3>
                  <p className="text-xs text-slate-500">Add to Phone Home Screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-700 border border-slate-200">
              {isIOS ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white text-[11px]">
                      1
                    </span>
                    <span>
                      Tap the <strong className="text-blue-800">Share</strong> icon <Share className="inline w-3.5 h-3.5 mx-0.5 text-blue-600" /> in Safari's bottom toolbar.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white text-[11px]">
                      2
                    </span>
                    <span>
                      Scroll down and tap <strong className="text-blue-800">Add to Home Screen</strong> <PlusSquare className="inline w-3.5 h-3.5 mx-0.5 text-emerald-600" />.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white text-[11px]">
                      3
                    </span>
                    <span>Tap <strong className="text-blue-800">Add</strong> at the top right to complete.</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white text-[11px]">
                      1
                    </span>
                    <span>Tap the <strong className="text-blue-800">three dots</strong> (menu) in your browser.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white text-[11px]">
                      2
                    </span>
                    <span>Select <strong className="text-blue-800">Install app</strong> or <strong className="text-blue-800">Add to Home screen</strong>.</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-600 transition shadow-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
