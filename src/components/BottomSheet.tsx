import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  footer,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-[1px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet container (~88% viewport height, constrained to mobile width) */}
      <div className="relative z-10 w-full max-w-[430px] h-[88dvh] max-h-[88dvh] flex flex-col bg-white dark:bg-[#16201c] rounded-t-[20px] shadow-2xl overflow-hidden animate-sheet-up border-t border-x border-[#dfe5e2] dark:border-[#2a3832]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-[#e8eeeb] dark:border-[#25332d] shrink-0">
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-[#14201b] dark:text-[#eef3f1] truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[12px] text-[#66756f] dark:text-[#92a59e] mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#f0f3f1] dark:bg-[#22302a] text-[#35443e] dark:text-[#c7d6d0] flex items-center justify-center active:scale-95 transition-transform shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3.5">
          {children}
        </div>

        {/* Optional sticky footer */}
        {footer && (
          <div className="shrink-0 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white dark:bg-[#16201c] border-t border-[#e8eeeb] dark:border-[#25332d]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
