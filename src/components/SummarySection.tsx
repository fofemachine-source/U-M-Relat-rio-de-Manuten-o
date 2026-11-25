import React from 'react';
import { ArrowUpDown, Check, Copy, Send } from 'lucide-react';
import { EquipmentEntry } from '../types';
import { addDaysISO, formatShortDateBR } from '../utils/reportUtils';

interface SummarySectionProps {
  reportDate: string;
  eqs: EquipmentEntry[];
  reportText: string;
  whatsappUrl: string;
  copied: boolean;
  onSortByDue: () => void;
  onCopy: () => void;
  onSelectEquipment: (id: string) => void;
}

/** Safely renders WhatsApp *bold* spans as <strong> elements without innerHTML */
function renderWhatsAppLine(line: string, lineIdx: number): React.ReactNode {
  if (!line) {
    return <span className="block h-3" aria-hidden="true" />;
  }

  const parts = line.split(/(\*[^*\n]+\*)/g);
  return (
    <span className="block leading-[1.42] break-words">
      {parts.map((part, idx) => {
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <strong key={`${lineIdx}-${idx}`} className="font-bold">
              {part.slice(1, -1)}
            </strong>
          );
        }
        return <React.Fragment key={`${lineIdx}-${idx}`}>{part}</React.Fragment>;
      })}
    </span>
  );
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  reportDate,
  eqs,
  reportText,
  whatsappUrl,
  copied,
  onSortByDue,
  onCopy,
  onSelectEquipment,
}) => {
  const validEqs = eqs.filter((eq) => eq.code.trim().length > 0);
  const tomorrowISO = addDaysISO(reportDate, 1);
  const dueByTomorrowCount = validEqs.filter(
    (eq) => eq.due && eq.due <= tomorrowISO
  ).length;

  const lines = reportText.split('\n');

  return (
    <section id="resumo-section" className="space-y-3 scroll-mt-4">
      {/* Section Header */}
      <div className="flex items-center gap-2.5">
        <span className="w-[26px] h-[26px] rounded-[7px] bg-[#0f3b2c] text-white text-[13px] font-bold flex items-center justify-center shrink-0">
          3
        </span>
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#182620] dark:text-[#e6efeb]">
          Resumo do relatório
        </h2>
      </div>

      {/* Stat Cards Side-by-Side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[12px] p-3.5 bg-[#e6f5ee] dark:bg-[#122b21] border border-[#c9e4d6] dark:border-[#1e4a38] space-y-1">
          <div className="text-[28px] leading-none font-bold text-[#0f3b2c] dark:text-[#6fd1a9] tabular-nums">
            {validEqs.length}
          </div>
          <div className="text-[12px] font-semibold leading-snug text-[#1c4b3a] dark:text-[#a8dcc5]">
            Equipamentos em manutenção
          </div>
        </div>

        <div className="rounded-[12px] p-3.5 bg-[#fff4e6] dark:bg-[#2a1f14] border border-[#f7d6ac] dark:border-[#563c1e] space-y-1">
          <div className="text-[28px] leading-none font-bold text-[#c2590a] dark:text-[#fb923c] tabular-nums">
            {dueByTomorrowCount}
          </div>
          <div className="text-[12px] font-semibold leading-snug text-[#8b4109] dark:text-[#f6be8a]">
            Liberação até amanhã
          </div>
        </div>
      </div>

      {/* Equipamentos no relatório list */}
      <div className="bg-white dark:bg-[#18221e] border border-[#dfe5e2] dark:border-[#2a3832] rounded-[12px] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#66756f] dark:text-[#92a59e]">
            Equipamentos no relatório
          </h3>
          {eqs.length > 1 && (
            <button
              type="button"
              onClick={onSortByDue}
              className="min-h-[44px] px-3 rounded-[9px] border border-[#dce3df] dark:border-[#2f3f38] bg-[#f7f9f8] dark:bg-[#202d28] text-[#0f3b2c] dark:text-[#76d8b0] text-[12px] font-semibold inline-flex items-center gap-1.5 active:scale-95 transition-transform shrink-0"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Ordenar por previsão</span>
            </button>
          )}
        </div>

        {validEqs.length === 0 ? (
          <p className="text-[14px] text-[#75847e] dark:text-[#869991] py-2">
            Nenhum equipamento adicionado ainda.
          </p>
        ) : (
          <div className="divide-y divide-[#eef1ef] dark:divide-[#24322c]">
            {validEqs.map((eq) => {
              const isUrgent = Boolean(eq.due && eq.due <= tomorrowISO);
              return (
                <button
                  key={eq.id}
                  type="button"
                  onClick={() => onSelectEquipment(eq.id)}
                  className="w-full min-h-[46px] py-2 flex items-center justify-between gap-3 text-left active:bg-[#f6f8f7] dark:active:bg-[#1f2c26] transition-colors"
                >
                  <span className="font-bold text-[15px] text-[#14201b] dark:text-[#eef3f1] tabular-nums">
                    {eq.code}
                  </span>
                  <span
                    className={`text-[14px] font-medium tabular-nums ${
                      isUrgent
                        ? 'text-[#c2590a] dark:text-[#fb923c] font-semibold'
                        : eq.due
                          ? 'text-[#4f5f58] dark:text-[#a2b3ac]'
                          : 'text-[#899791] dark:text-[#73857e]'
                    }`}
                  >
                    {eq.due ? formatShortDateBR(eq.due) : 'a definir'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mensagem do WhatsApp preview + actions */}
      <div className="bg-white dark:bg-[#18221e] border border-[#dfe5e2] dark:border-[#2a3832] rounded-[12px] p-4 space-y-3.5">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#66756f] dark:text-[#92a59e]">
          Mensagem do WhatsApp
        </h3>

        {/* WhatsApp chat canvas + green sent bubble */}
        <div className="rounded-[12px] p-3 bg-[#e7e1d7] dark:bg-[#0c1418] border border-[#dad3c7] dark:border-[#1d2b30]">
          <div className="rounded-[10px] rounded-tr-[3px] bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] px-3.5 py-3 shadow-xs text-[13.5px] font-normal select-text">
            {lines.map((line, i) => (
              <React.Fragment key={i}>{renderWhatsAppLine(line, i)}</React.Fragment>
            ))}
          </div>
        </div>

        {/* Action buttons: Copiar & Enviar no WhatsApp */}
        <div className="grid grid-cols-2 gap-2.5 pt-0.5">
          <button
            type="button"
            onClick={onCopy}
            className="min-h-[48px] px-3 rounded-[10px] border border-[#cfd9d4] dark:border-[#32453d] bg-white dark:bg-[#202d28] text-[#14201b] dark:text-[#eef3f1] font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            {copied ? (
              <>
                <Check className="w-[18px] h-[18px] text-[#0f3b2c] dark:text-[#6fd1a9]" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-[18px] h-[18px] text-[#45564f] dark:text-[#a2b3ac]" />
                <span>Copiar</span>
              </>
            )}
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[48px] px-3 rounded-[10px] bg-[#0f3b2c] hover:bg-[#144d39] text-white font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-center"
          >
            <Send className="w-[17px] h-[17px] shrink-0" />
            <span className="leading-tight">Enviar no WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
};
