import React, { useEffect, useState } from 'react';
import { BottomSheet } from './BottomSheet';

interface PasteReportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onParseReport: (rawText: string) => { ok: boolean; error?: string };
}

export const PasteReportSheet: React.FC<PasteReportSheetProps> = ({
  isOpen,
  onClose,
  onParseReport,
}) => {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setText('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!text.trim()) {
      setError('Cole o texto do relatório antes de continuar.');
      return;
    }
    const result = onParseReport(text);
    if (!result.ok) {
      setError(result.error || 'Não foi possível identificar equipamentos no texto colado.');
      return;
    }
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Colar relatório anterior"
      subtitle="Substitui a lista atual mantendo serviços, vales e datas"
      footer={
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full min-h-[48px] rounded-[12px] bg-[#0f3b2c] hover:bg-[#144c39] text-white font-semibold text-[16px] active:scale-[0.99] transition-transform"
        >
          Ler relatório
        </button>
      }
    >
      <div className="space-y-3 h-full flex flex-col">
        <p className="text-[13px] leading-relaxed text-[#5c6c65] dark:text-[#98aaa3]">
          Copie a mensagem do último relatório enviado no WhatsApp e cole abaixo. Códigos e
          serviços novos serão salvos automaticamente.
        </p>

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Cole aqui o texto do relatório do WhatsApp..."
          rows={12}
          className="w-full flex-1 min-h-[260px] p-3.5 rounded-[12px] bg-[#f4f6f5] dark:bg-[#202d28] border border-[#dfe5e2] dark:border-[#2f3f38] text-[16px] leading-relaxed text-[#14201b] dark:text-[#eef3f1] placeholder:text-[#82918b] dark:placeholder:text-[#7c9088] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f3b2c]/30 dark:focus:ring-[#4ea885]/40 focus:border-[#0f3b2c]"
        />

        {error && (
          <div
            role="alert"
            className="px-3.5 py-2.5 rounded-[10px] bg-[#fdecec] dark:bg-[#3a1b1b] border border-[#f5c2c2] dark:border-[#6e2e2e] text-[13px] font-medium text-[#b91c1c] dark:text-[#fca5a5]"
          >
            {error}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
