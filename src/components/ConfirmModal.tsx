import React, { useEffect } from 'react';
import { ConfirmModalConfig } from '../types';

interface ConfirmModalProps {
  config: ConfirmModalConfig | null;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ config, onClose }) => {
  useEffect(() => {
    if (!config) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [config, onClose]);

  if (!config) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-[1px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-[360px] bg-white dark:bg-[#18221e] rounded-[16px] border border-[#dfe5e2] dark:border-[#2c3c35] shadow-2xl p-5 space-y-4">
        <div className="space-y-1.5">
          <h3
            id="confirm-modal-title"
            className="text-[17px] font-bold text-[#14201b] dark:text-[#eef3f1]"
          >
            {config.title}
          </h3>
          <p
            id="confirm-modal-desc"
            className="text-[14px] leading-relaxed text-[#52625b] dark:text-[#a2b3ac]"
          >
            {config.message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] px-4 rounded-[10px] border border-[#d6deda] dark:border-[#31423b] bg-white dark:bg-[#202d28] text-[#2c3b35] dark:text-[#d5e0db] font-semibold text-[14px] active:scale-[0.98] transition-transform"
          >
            {config.cancelLabel || 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={() => {
              config.onConfirm();
              onClose();
            }}
            className={`flex-1 min-h-[44px] px-4 rounded-[10px] font-semibold text-[14px] text-white active:scale-[0.98] transition-transform ${
              config.destructive
                ? 'bg-[#c62828] hover:bg-[#b71c1c] dark:bg-[#d32f2f]'
                : 'bg-[#0f3b2c] hover:bg-[#144d3a]'
            }`}
          >
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
