import React, { useState } from 'react';
import { Camera, Download, Share2, X, Sparkles, Sliders } from 'lucide-react';

interface PhotoBoothModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasElement: HTMLCanvasElement | null;
}

export const PhotoBoothModal: React.FC<PhotoBoothModalProps> = ({
  isOpen,
  onClose,
  canvasElement,
}) => {
  const [filter, setFilter] = useState<'NONE' | 'GOLDEN' | 'CYBERPUNK' | 'VINTAGE' | 'NOIR'>('GOLDEN');
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  // Capture current canvas frame on open if not already captured
  if (!snapshotUrl && canvasElement) {
    try {
      const dataUrl = canvasElement.toDataURL('image/png');
      setSnapshotUrl(dataUrl);
    } catch (_) {}
  }

  const handleDownload = () => {
    if (!canvasElement) return;

    // Create export canvas with filter & watermark
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvasElement.width;
    exportCanvas.height = canvasElement.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Draw base screenshot
    ctx.drawImage(canvasElement, 0, 0);

    // Apply color grading filter
    if (filter === 'GOLDEN') {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.18)';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    } else if (filter === 'CYBERPUNK') {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      ctx.fillStyle = 'rgba(255, 0, 122, 0.12)';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height / 2);
    } else if (filter === 'VINTAGE') {
      ctx.fillStyle = 'rgba(180, 130, 80, 0.25)';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    // Add Official Aesthetic Watermark
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Outfit, sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText('📢 AWAAZ • JANTAR MANTAR, NEW DELHI', 40, exportCanvas.height - 50);

    ctx.font = '22px Space Grotesk, monospace';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('#GenZActivism #RaiseYourVoice #DelhiUnited', 40, exportCanvas.height - 20);

    // Trigger download
    const link = document.createElement('a');
    link.download = `Awaaz_Jantar_Mantar_${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  const filterStyle =
    filter === 'GOLDEN'
      ? 'sepia(30%) saturate(140%) contrast(105%)'
      : filter === 'CYBERPUNK'
      ? 'hue-rotate(280deg) saturate(160%) contrast(110%)'
      : filter === 'VINTAGE'
      ? 'sepia(70%) contrast(90%)'
      : filter === 'NOIR'
      ? 'grayscale(100%) contrast(125%)'
      : 'none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-3xl glass-panel p-5 sm:p-8 rounded-3xl border border-white/20 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              Protest Photo Booth
            </h2>
          </div>
          <button
            onClick={() => {
              setSnapshotUrl(null);
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Snapshot Preview with Filter applied */}
        <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/60 aspect-video flex items-center justify-center shadow-2xl">
          {snapshotUrl ? (
            <img
              src={snapshotUrl}
              alt="Snapshot"
              className="w-full h-full object-cover transition-all duration-300"
              style={{ filter: filterStyle }}
            />
          ) : (
            <div className="text-slate-400 text-sm">Capturing frame...</div>
          )}

          {/* Aesthetic Watermark Overlay */}
          <div className="absolute bottom-3 left-4 pointer-events-none drop-shadow-lg">
            <div className="text-sm sm:text-base font-black text-white tracking-wider uppercase">
              📢 AWAAZ: JANTAR MANTAR
            </div>
            <div className="text-[10px] font-mono text-amber-300">
              #YouthSolidarity #DelhiProtest #NonViolence
            </div>
          </div>
        </div>

        {/* Filter Selection Chips */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-pink-400" />
            Color Filter:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'NONE', label: 'Raw HDR' },
              { id: 'GOLDEN', label: 'Golden Hour' },
              { id: 'CYBERPUNK', label: 'Cyberpunk' },
              { id: 'VINTAGE', label: '1970s Vintage' },
              { id: 'NOIR', label: 'Noir B&W' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  filter === f.id
                    ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white border-white shadow-md'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Download & Share Actions */}
        <div className="flex gap-3 pt-2 border-t border-white/10">
          <button
            onClick={handleDownload}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 text-white font-bold text-sm uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD HD POSTER</span>
          </button>
        </div>
      </div>
    </div>
  );
};
