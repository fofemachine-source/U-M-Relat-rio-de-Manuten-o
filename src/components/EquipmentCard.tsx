import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { EquipmentEntry } from '../types';
import { DateField } from './DateField';
import { addDaysISO, buildValeText, isValeItem } from '../utils/reportUtils';

interface EquipmentCardProps {
  index: number;
  entry: EquipmentEntry;
  reportDate: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenEquipmentPicker: () => void;
  onOpenServicesPicker: () => void;
  onOpenValeTargetPicker: (onPicked: (code: string) => void) => void;
  onUpdateEntry: (updater: (prev: EquipmentEntry) => EquipmentEntry) => void;
  onRequestRemoveEntry: () => void;
  onRequestRemoveVales: (onConfirm: () => void) => void;
}

const DUE_SHORTCUTS = [
  { label: '+1 dia', days: 1 },
  { label: '+2 dias', days: 2 },
  { label: '+3 dias', days: 3 },
  { label: '+7 dias', days: 7 },
];

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  index,
  entry,
  reportDate,
  isOpen,
  onToggleOpen,
  onOpenEquipmentPicker,
  onOpenServicesPicker,
  onOpenValeTargetPicker,
  onUpdateEntry,
  onRequestRemoveEntry,
  onRequestRemoveVales,
}) => {
  const hasExistingVale = entry.items.some((item) => isValeItem(item));
  const [showValeBox, setShowValeBox] = useState<boolean>(hasExistingVale);
  const [valePiece, setValePiece] = useState('');
  const [valeTargetCode, setValeTargetCode] = useState('');
  const [valeError, setValeError] = useState<string | null>(null);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState('');

  // Keep Sim selected automatically when a vale item is added (e.g. via paste)
  useEffect(() => {
    if (hasExistingVale) {
      setShowValeBox(true);
    }
  }, [hasExistingVale]);

  // Reset inline edit state when card closes
  useEffect(() => {
    if (!isOpen) {
      setEditingIndex(null);
      setEditingDraft('');
    }
  }, [isOpen]);

  const startEditItem = (idx: number, currentText: string) => {
    setEditingIndex(idx);
    setEditingDraft(currentText);
  };

  const commitEditItem = () => {
    if (editingIndex === null) return;
    const cleaned = editingDraft.trim().replace(/\.+$/, '').trim();
    const targetIdx = editingIndex;
    setEditingIndex(null);
    setEditingDraft('');

    if (!cleaned) {
      onUpdateEntry((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== targetIdx),
      }));
      return;
    }

    onUpdateEntry((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === targetIdx ? cleaned : item)),
    }));
  };

  const removeItem = (idx: number) => {
    if (editingIndex === idx) {
      setEditingIndex(null);
      setEditingDraft('');
    }
    onUpdateEntry((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleSelectValeNo = () => {
    if (hasExistingVale) {
      onRequestRemoveVales(() => {
        onUpdateEntry((prev) => ({
          ...prev,
          items: prev.items.filter((item) => !isValeItem(item)),
        }));
        setShowValeBox(false);
        setValePiece('');
        setValeTargetCode('');
        setValeError(null);
      });
    } else {
      setShowValeBox(false);
      setValePiece('');
      setValeTargetCode('');
      setValeError(null);
    }
  };

  const handleIncludeVale = () => {
    if (!valePiece.trim()) {
      setValeError('Informe a peça retirada.');
      return;
    }
    if (!valeTargetCode.trim()) {
      setValeError('Selecione o equipamento que recebeu a peça.');
      return;
    }

    const valeText = buildValeText(valePiece, valeTargetCode);
    onUpdateEntry((prev) => ({
      ...prev,
      items: [...prev.items, valeText],
    }));
    setValePiece('');
    setValeTargetCode('');
    setValeError(null);
  };

  return (
    <div
      id={`equipment-card-${entry.id}`}
      className="bg-white dark:bg-[#18221e] border border-[#dfe5e2] dark:border-[#2a3832] rounded-[12px] overflow-hidden transition-colors"
    >
      {/* Accordion Header */}
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={isOpen}
        className="w-full min-h-[56px] px-4 py-3 flex items-center justify-between gap-3 text-left active:bg-[#f6f8f7] dark:active:bg-[#1e2a25] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-[26px] h-[26px] rounded-full bg-[#152921] dark:bg-[#0f3b2c] text-white text-[12px] font-bold flex items-center justify-center shrink-0 tabular-nums">
            {index + 1}
          </span>
          <span className="text-[15px] truncate">
            <strong className="font-bold text-[#14201b] dark:text-[#eef3f1]">
              Equipamento {index + 1}
            </strong>
            <span className="text-[#66756f] dark:text-[#92a59e] font-medium">
              {' '}
              – {entry.code || 'sem código'}
            </span>
          </span>
        </div>

        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[#5b6b64] dark:text-[#98aaa3] shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#5b6b64] dark:text-[#98aaa3] shrink-0" />
        )}
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="px-4 pb-4 pt-3.5 border-t border-[#eef1ef] dark:border-[#25332d] space-y-5">
          {/* 1. Equipamento */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#66756f] dark:text-[#92a59e]">
              Equipamento <span className="text-[#d32f2f]">*</span>
            </label>
            <button
              type="button"
              onClick={onOpenEquipmentPicker}
              className="w-full min-h-[46px] px-3.5 rounded-[10px] bg-[#f4f6f5] dark:bg-[#202d28] border border-[#dfe5e2] dark:border-[#2f3f38] flex items-center justify-between gap-2 text-left active:scale-[0.99] transition-transform"
            >
              <span
                className={`text-[16px] tabular-nums ${
                  entry.code
                    ? 'font-semibold text-[#14201b] dark:text-[#eef3f1]'
                    : 'text-[#82918b] dark:text-[#7c9088]'
                }`}
              >
                {entry.code || 'Selecione o equipamento'}
              </span>
              <ChevronDown className="w-[18px] h-[18px] text-[#5c6c65] dark:text-[#92a59e] shrink-0" />
            </button>
          </div>

          {/* 2. Previsão de liberação */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#66756f] dark:text-[#92a59e]">
              Previsão de liberação <span className="text-[#d32f2f]">*</span>
            </label>
            <DateField
              value={entry.due}
              onChange={(iso) => onUpdateEntry((prev) => ({ ...prev, due: iso }))}
              placeholder="A definir"
              allowClear
              ariaLabel={`Previsão de liberação do equipamento ${entry.code || index + 1}`}
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {DUE_SHORTCUTS.map((sc) => {
                const targetIso = addDaysISO(reportDate, sc.days);
                const active = entry.due === targetIso;
                return (
                  <button
                    key={sc.days}
                    type="button"
                    onClick={() => onUpdateEntry((prev) => ({ ...prev, due: targetIso }))}
                    className={`min-h-[44px] px-3 rounded-full text-[13px] font-semibold border transition-colors active:scale-95 ${
                      active
                        ? 'bg-[#0f3b2c] border-[#0f3b2c] text-white'
                        : 'bg-white dark:bg-[#1e2a25] border-[#dce3df] dark:border-[#2f3f38] text-[#26352f] dark:text-[#d5e0db]'
                    }`}
                  >
                    {sc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Serviços */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#66756f] dark:text-[#92a59e]">
              Serviços <span className="text-[#d32f2f]">*</span>
            </label>

            {entry.items.length > 0 && (
              <div className="space-y-2">
                {entry.items.map((item, idx) => {
                  const isEditing = editingIndex === idx;
                  return (
                    <div
                      key={`${idx}-${item.slice(0, 12)}`}
                      className="rounded-[10px] bg-[#f4f6f5] dark:bg-[#202d28] border border-[#e2e8e5] dark:border-[#2f3f38] pl-3 pr-1 py-1.5 flex items-center gap-2.5"
                    >
                      <span className="text-[16px] shrink-0 select-none" aria-hidden="true">
                        🔧
                      </span>

                      {isEditing ? (
                        <input
                          type="text"
                          value={editingDraft}
                          autoFocus
                          onChange={(e) => setEditingDraft(e.target.value)}
                          onBlur={commitEditItem}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              commitEditItem();
                            } else if (e.key === 'Escape') {
                              setEditingIndex(null);
                              setEditingDraft('');
                            }
                          }}
                          className="flex-1 min-w-0 min-h-[38px] px-2 py-1 rounded-[8px] bg-white dark:bg-[#16201c] border border-[#0f3b2c] dark:border-[#4ea885] text-[16px] text-[#14201b] dark:text-[#eef3f1] focus:outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditItem(idx, item)}
                          className="flex-1 min-w-0 min-h-[40px] py-1.5 text-left text-[15px] leading-snug text-[#1c2823] dark:text-[#e4ede9]"
                        >
                          {item}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        aria-label={`Remover serviço: ${item}`}
                        className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#74837c] dark:text-[#8ea199] hover:text-[#c62828] dark:hover:text-[#f87171] rounded-[8px] active:scale-90 transition-transform shrink-0"
                      >
                        <X className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                  );
                })}
                <p className="text-[12px] text-[#7a8983] dark:text-[#869991] pt-0.5">
                  Toque no texto de um serviço para corrigir.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={onOpenServicesPicker}
              className="w-full min-h-[46px] px-4 rounded-[10px] border border-dashed border-[#0f3b2c]/55 dark:border-[#4ea885]/60 bg-white dark:bg-[#18221e] text-[#0f3b2c] dark:text-[#6fd1a9] font-semibold text-[15px] flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Escolher serviços</span>
            </button>
          </div>

          {/* 4. Houve vale de peça? */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#66756f] dark:text-[#92a59e]">
                Houve vale de peça?
              </span>

              <div className="flex items-center gap-2" role="radiogroup" aria-label="Houve vale de peça?">
                <button
                  type="button"
                  role="radio"
                  aria-checked={showValeBox}
                  onClick={() => setShowValeBox(true)}
                  className="min-h-[44px] px-2 flex items-center gap-2 text-[15px] font-medium text-[#14201b] dark:text-[#e8efec]"
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      showValeBox
                        ? 'border-[#0f3b2c] dark:border-[#5bc298]'
                        : 'border-[#899791] dark:border-[#60736b]'
                    }`}
                  >
                    {showValeBox && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0f3b2c] dark:bg-[#5bc298]" />
                    )}
                  </span>
                  <span>Sim</span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={!showValeBox}
                  onClick={handleSelectValeNo}
                  className="min-h-[44px] px-2 flex items-center gap-2 text-[15px] font-medium text-[#14201b] dark:text-[#e8efec]"
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      !showValeBox
                        ? 'border-[#0f3b2c] dark:border-[#5bc298]'
                        : 'border-[#899791] dark:border-[#60736b]'
                    }`}
                  >
                    {!showValeBox && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0f3b2c] dark:bg-[#5bc298]" />
                    )}
                  </span>
                  <span>Não</span>
                </button>
              </div>
            </div>

            {/* Light orange Vale de Peça box (Screenshot 3) */}
            {showValeBox && (
              <div className="p-3.5 rounded-[12px] bg-[#fff4e6] dark:bg-[#2a2015] border border-[#f8d7ad] dark:border-[#5a4122] space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6e5c47] dark:text-[#d5b58d]">
                    Peça retirada
                  </label>
                  <input
                    type="text"
                    value={valePiece}
                    onChange={(e) => {
                      setValePiece(e.target.value);
                      if (valeError) setValeError(null);
                    }}
                    placeholder="Ex.: bomba hidráulica da tomada de força"
                    className="w-full min-h-[46px] px-3.5 rounded-[10px] bg-[#f8f6f2] dark:bg-[#1f1912] border border-[#e3d8c9] dark:border-[#4e3a20] text-[16px] text-[#14201b] dark:text-[#f3ece2] placeholder:text-[#8b857c] dark:placeholder:text-[#9c8973] focus:outline-none focus:ring-2 focus:ring-[#0f3b2c]/30 focus:border-[#0f3b2c]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6e5c47] dark:text-[#d5b58d]">
                    Para liberar o equipamento
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (valeError) setValeError(null);
                      onOpenValeTargetPicker((pickedCode) => {
                        setValeTargetCode(pickedCode);
                      });
                    }}
                    className="w-full min-h-[46px] px-3.5 rounded-[10px] bg-[#f8f6f2] dark:bg-[#1f1912] border border-[#e3d8c9] dark:border-[#4e3a20] flex items-center justify-between gap-2 text-left active:scale-[0.99] transition-transform"
                  >
                    <span
                      className={`text-[16px] tabular-nums ${
                        valeTargetCode
                          ? 'font-semibold text-[#14201b] dark:text-[#f3ece2]'
                          : 'text-[#8b857c] dark:text-[#9c8973]'
                      }`}
                    >
                      {valeTargetCode || 'Selecione o equipamento'}
                    </span>
                    <ChevronDown className="w-[18px] h-[18px] text-[#6e5c47] dark:text-[#c7ab88] shrink-0" />
                  </button>
                </div>

                {valeError && (
                  <p role="alert" className="text-[13px] font-medium text-[#b91c1c] dark:text-[#fca5a5]">
                    {valeError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleIncludeVale}
                  className="w-full min-h-[46px] rounded-[10px] bg-[#0f3b2c] hover:bg-[#144c39] text-white font-semibold text-[15px] active:scale-[0.99] transition-transform"
                >
                  Incluir vale
                </button>
              </div>
            )}
          </div>

          {/* 5. Remover equipamento (liberado) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onRequestRemoveEntry}
              className="min-h-[44px] px-1 text-[14px] font-semibold text-[#d32f2f] dark:text-[#f87171] hover:underline active:opacity-75"
            >
              Remover equipamento (liberado)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
