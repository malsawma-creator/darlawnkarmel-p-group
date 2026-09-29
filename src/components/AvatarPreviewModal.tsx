import React, { useEffect } from 'react';
import { X, ZoomIn, User, MapPin } from 'lucide-react';
import { getAvatarColor, getFirstLetter } from './MemberAvatar';

export interface AvatarPreviewData {
  name: string;
  photoUrl?: string;
  veng?: string;
  role?: string;
}

interface AvatarPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AvatarPreviewData | null;
}

export const AvatarPreviewModal: React.FC<AvatarPreviewModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const bgGradient = getAvatarColor(data.name);
  const firstLetter = getFirstLetter(data.name);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      {/* Top right close button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-5 right-5 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors shadow-lg border border-white/10"
        title="Close preview"
      >
        <X className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Main card - stop propagation when clicking card content */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-sm w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
      >
        {/* Large Avatar container */}
        <div className="relative mb-6">
          {data.photoUrl ? (
            <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl shadow-black bg-slate-900 ring-4 ring-amber-400/40">
              <img
                src={data.photoUrl}
                alt={data.name}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          ) : (
            <div
              className={`w-60 h-60 sm:w-64 sm:h-64 rounded-full flex items-center justify-center border-4 border-white/20 shadow-2xl shadow-black select-none ${bgGradient} ring-4 ring-white/10`}
            >
              <span className="text-8xl font-black text-white drop-shadow-md">
                {firstLetter}
              </span>
            </div>
          )}
        </div>

        {/* Member Details */}
        <div className="space-y-1.5 px-4">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm">
            {data.name}
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {data.role && data.role !== 'MEMBER' && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-sm">
                {data.role.replace('_', ' ')}
              </span>
            )}
            {data.veng && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/15 text-slate-200 border border-white/10 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-300" />
                <span>{data.veng}</span>
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400 pt-3">
            Tap anywhere outside to close
          </p>
        </div>
      </div>
    </div>
  );
};
