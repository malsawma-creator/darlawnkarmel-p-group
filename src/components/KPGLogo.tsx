import React from 'react';

interface KPGLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  lightMode?: boolean;
  className?: string;
}

export const KPGLogo: React.FC<KPGLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  lightMode = true,
  className = '',
}) => {
  const dimensions = {
    sm: { box: 'w-8 h-8', text: 'text-xs' },
    md: { box: 'w-10 h-10', text: 'text-sm' },
    lg: { box: 'w-14 h-14', text: 'text-xl' },
    xl: { box: 'w-20 h-20', text: 'text-3xl' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Emblem Icon */}
      <div
        className={`${dimensions.box} relative flex-shrink-0 rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 border border-amber-400/40 shadow-sm flex items-center justify-center overflow-hidden group`}
      >
        {/* Golden Cross Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="w-1.5 h-6 bg-amber-400 rounded-sm"></div>
          <div className="absolute w-5 h-1.5 bg-amber-400 rounded-sm -translate-y-1"></div>
        </div>

        {/* Monogram text */}
        <span className={`relative font-black tracking-wider text-white font-sans ${dimensions.text} drop-shadow-sm`}>
          P<span className="text-amber-400">G</span>
        </span>

        {/* Corner golden spark */}
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-xs shadow-amber-300"></div>
      </div>

      {/* Typography text branding: P Group, Darlawn Karmel Branch */}
      {showSubtitle && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-base font-black tracking-tight ${
                lightMode ? 'text-slate-900' : 'text-white'
              }`}
            >
              P GROUP
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              2026
            </span>
          </div>
          <span
            className={`text-xs font-semibold tracking-wider ${
              lightMode ? 'text-blue-800' : 'text-blue-200'
            }`}
          >
            Darlawn Karmel Branch
          </span>
        </div>
      )}
    </div>
  );
};
