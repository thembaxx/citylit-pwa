import { DownloadSimple, ShareNetwork, X } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { SPRING } from '../lib/motion';
import { SettleModal } from './ui/SettleModal';

interface PostcardModalProps {
  open: boolean;
  dataUrl: string;
  landmarkName: string;
  reducedMotion?: boolean;
  onShare: () => void;
  onDownload: () => void;
  onClose: () => void;
}

export function PostcardModal({
  open,
  dataUrl,
  landmarkName,
  reducedMotion = false,
  onShare,
  onDownload,
  onClose,
}: PostcardModalProps) {
  return (
    <SettleModal
      open={open}
      onClose={onClose}
      reducedMotion={reducedMotion}
      title="3D Landmark Postcard"
    >
      <div className="flex items-center justify-between">
        <span className="font-serif-display italic text-[18px] text-[#f3efe6]">{landmarkName}</span>
        <motion.button
          type="button"
          whileTap={reducedMotion ? undefined : { scale: 0.9 }}
          onClick={onClose}
          aria-label="Close postcard"
          className="w-8 h-8 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] cursor-pointer"
        >
          <X size={16} />
        </motion.button>
      </div>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={SPRING.morph}
        className="mt-3 rounded-2xl overflow-hidden border border-white/10 bg-[#0e0f13]"
      >
        {dataUrl && (
          <img src={dataUrl} alt={`${landmarkName} 3D postcard`} className="w-full h-auto block" />
        )}
      </motion.div>

      <div className="mt-3 flex items-center gap-2">
        {[
          { label: 'Share', icon: ShareNetwork, onClick: onShare, accent: false },
          { label: 'Save PNG', icon: DownloadSimple, onClick: onDownload, accent: true },
        ].map(({ label, icon: Icon, onClick, accent }) => (
          <motion.button
            key={label}
            type="button"
            whileTap={reducedMotion ? undefined : { scale: 0.97 }}
            onClick={onClick}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[13px] cursor-pointer ${
              accent
                ? 'bg-[#e8b04a] text-[#1a1405] font-semibold'
                : 'bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a]'
            }`}
          >
            <Icon size={16} weight={accent ? 'bold' : 'regular'} />
            {label}
          </motion.button>
        ))}
      </div>
    </SettleModal>
  );
}
