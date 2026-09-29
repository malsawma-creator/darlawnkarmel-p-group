import React, { useState } from 'react';

interface MemberAvatarProps {
  name: string;
  photoUrl?: string;
  size?: number | 'sm' | 'md' | 'lg' | 'profile'; // 'sm'=32, 'md'=40, 'lg'=48, 'profile'=120
  className?: string;
  onClick?: () => void;
  showShadow?: boolean;
}

// Color palette: Blue, Green, Orange, Purple, Teal
const COLOR_PALETTE = [
  'bg-gradient-to-br from-blue-500 to-blue-700 text-white',
  'bg-gradient-to-br from-emerald-500 to-teal-700 text-white',
  'bg-gradient-to-br from-amber-500 to-orange-600 text-white',
  'bg-gradient-to-br from-purple-500 to-indigo-700 text-white',
  'bg-gradient-to-br from-teal-500 to-cyan-700 text-white',
];

export function getAvatarColor(name: string): string {
  if (!name) return COLOR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

export function getFirstLetter(name: string): string {
  if (!name) return '?';
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : '?';
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({
  name,
  photoUrl,
  size = 40,
  className = '',
  onClick,
  showShadow = true,
}) => {
  const [imageError, setImageError] = useState(false);

  // Compute size styles
  let sizeStyle: React.CSSProperties = {};
  let sizeClass = '';
  let fontSizeClass = 'text-sm font-bold';

  if (typeof size === 'number') {
    sizeStyle = { width: `${size}px`, height: `${size}px`, minWidth: `${size}px` };
    if (size >= 100) fontSizeClass = 'text-4xl font-black tracking-tight';
    else if (size >= 50) fontSizeClass = 'text-xl font-bold';
    else if (size >= 40) fontSizeClass = 'text-sm font-bold';
    else fontSizeClass = 'text-xs font-bold';
  } else if (size === 'profile') {
    sizeStyle = { width: '120px', height: '120px', minWidth: '120px' };
    fontSizeClass = 'text-4xl font-black tracking-tight';
  } else if (size === 'lg') {
    sizeStyle = { width: '48px', height: '48px', minWidth: '48px' };
    fontSizeClass = 'text-base font-bold';
  } else if (size === 'sm') {
    sizeStyle = { width: '32px', height: '32px', minWidth: '32px' };
    fontSizeClass = 'text-xs font-bold';
  } else {
    // 'md' default 40px
    sizeStyle = { width: '40px', height: '40px', minWidth: '40px' };
    fontSizeClass = 'text-sm font-bold';
  }

  const bgGradient = getAvatarColor(name);
  const firstLetter = getFirstLetter(name);
  const hasValidPhoto = Boolean(photoUrl && !imageError);

  const shadowClass = showShadow ? 'shadow-md shadow-slate-900/10' : '';

  return (
    <div
      style={sizeStyle}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none border-2 border-white transition-transform ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${shadowClass} ${className} ${hasValidPhoto ? 'bg-slate-100' : bgGradient}`}
      title={name}
    >
      {hasValidPhoto ? (
        <img
          src={photoUrl}
          alt={name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover rounded-full"
          loading="lazy"
        />
      ) : (
        <span className={`${fontSizeClass} leading-none tracking-wider drop-shadow-xs`}>
          {firstLetter}
        </span>
      )}
    </div>
  );
};
