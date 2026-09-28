import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2,
  Share2
} from 'lucide-react';

export interface LightboxPhoto {
  url: string;
  title?: string;
  subtitle?: string;
  description?: string;
}

interface PhotoLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  photos: LightboxPhoto[];
  initialIndex?: number;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  isOpen,
  onClose,
  photos,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Sync initialIndex when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, photos.length - 1)));
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex, photos.length]);

  // Reset zoom & pan when switching photo
  const handleIndexChange = useCallback((newIndex: number) => {
    setCurrentIndex(newIndex);
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, []);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      handleIndexChange(currentIndex - 1);
    } else {
      handleIndexChange(photos.length - 1);
    }
  }, [currentIndex, photos.length, handleIndexChange]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      handleIndexChange(currentIndex + 1);
    } else {
      handleIndexChange(0);
    }
  }, [currentIndex, photos.length, handleIndexChange]);

  // Keyboard navigation & controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(z + 0.25, 4));
      } else if (e.key === '-' || e.key === '_') {
        setZoom((z) => Math.max(z - 0.25, 0.75));
      } else if (e.key === '0') {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Prevent background scrolling while lightbox is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 4));
  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(z - 0.5, 0.75);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleDoubleTap = () => {
    if (zoom > 1) {
      handleReset();
    } else {
      setZoom(2);
    }
  };

  // Dragging / panning when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || zoom > 1) return;
    const touchEnd = e.changedTouches[0];
    const diffX = touchEnd.clientX - touchStartRef.current.x;
    const diffY = touchEnd.clientY - touchStartRef.current.y;

    // Minimum swipe threshold
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    touchStartRef.current = null;
  };

  // Download handler
  const handleDownload = async () => {
    try {
      const url = currentPhoto.url;
      const safeTitle = (currentPhoto.title || 'kpg-photo')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 30);
      const filename = `${safeTitle}.jpg`;

      // If it's a data URL or blob URL
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Fetch external or server image to download safely
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(currentPhoto.url, '_blank');
    }
  };

  // Web Share handler
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentPhoto.title || 'Karmel P Group Photo',
          text: currentPhoto.subtitle || currentPhoto.description || 'P Group Darlawn Photo',
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-md select-none transition-opacity duration-200"
      onMouseUp={handleMouseUp}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60 border-b border-white/10 z-20">
        <div className="flex items-center gap-3 min-w-0 pr-2">
          {photos.length > 1 && (
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-xs font-mono font-semibold shrink-0">
              {currentIndex + 1} / {photos.length}
            </span>
          )}
          <div className="min-w-0">
            {currentPhoto.title && (
              <h2 className="text-white text-sm font-bold truncate">
                {currentPhoto.title}
              </h2>
            )}
            {currentPhoto.subtitle && (
              <p className="text-slate-400 text-xs truncate">
                {currentPhoto.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          {/* Reset Zoom */}
          {(zoom !== 1 || rotation !== 0) && (
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl text-blue-400 hover:text-blue-300 hover:bg-white/10 transition text-xs font-bold"
              title="Reset Zoom (0)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* Rotate */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-white/10 transition"
            title="Download Photo"
          >
            <Download className="w-5 h-5" />
          </button>

          {/* Web Share (if available) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition hidden sm:inline-flex"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}

          <div className="h-5 w-px bg-white/10 mx-1" />

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition"
            title="Close (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div 
        className="relative flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing p-2"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleTap}
      >
        {/* Navigation Arrow Left */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-slate-900/70 border border-white/10 text-white/80 hover:text-white hover:bg-slate-900 shadow-xl transition hover:scale-105 active:scale-95"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Displayed Image */}
        <div 
          className="relative max-h-full max-w-full flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom}) rotate(${rotation}deg)`,
          }}
        >
          <img
            src={currentPhoto.url}
            alt={currentPhoto.title || 'Photo'}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl pointer-events-none select-none"
            draggable={false}
          />
        </div>

        {/* Navigation Arrow Right */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-slate-900/70 border border-white/10 text-white/80 hover:text-white hover:bg-slate-900 shadow-xl transition hover:scale-105 active:scale-95"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Description & Instructions Bar */}
      <div className="px-4 py-2.5 bg-slate-900/80 border-t border-white/10 z-20 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="min-w-0">
          {currentPhoto.description && (
            <p className="text-slate-300 text-xs line-clamp-2 max-w-2xl">
              {currentPhoto.description}
            </p>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-3">
          <span>Double-click to zoom</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Use arrow keys or swipe to browse</span>
        </div>
      </div>
    </div>
  );
};
