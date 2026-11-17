import { DownloadSimple, ShareNetwork, X } from '@phosphor-icons/react';

interface PostcardModalProps {
  open: boolean;
  dataUrl: string;
  landmarkName: string;
  onShare: () => void;
  onDownload: () => void;
  onClose: () => void;
}

export function PostcardModal({
  open,
  dataUrl,
  landmarkName,
  onShare,
  onDownload,
  onClose,
}: PostcardModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="3D Landmark Postcard"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#14161e] border border-white/15 rounded-3xl p-4 shadow-2xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="font-serif-display italic text-[18px] text-[#f3efe6]">
            {landmarkName}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close postcard"
            className="w-8 h-8 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0e0f13]">
          {dataUrl && (
            <img
              src={dataUrl}
              alt={`${landmarkName} 3D postcard`}
              className="w-full h-auto block"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onShare}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-white/[0.06] border border-white/15 text-[13px] text-[#f3efe6] hover:border-[#e8b04a] cursor-pointer"
          >
            <ShareNetwork size={16} />
            Share
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[#e8b04a] text-[#1a1405] text-[13px] font-semibold hover:brightness-110 cursor-pointer"
          >
            <DownloadSimple size={16} weight="bold" />
            Save PNG
          </button>
        </div>
      </div>
    </div>
  );
}
