import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, PenLine, Plus, Search } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { DateField } from './DateField';
import {
  addDaysISO,
  groupEquipmentCodes,
  matchesEquipmentQuery,
  normalizeSearch,
  parseRegisterableCode,
} from '../utils/reportUtils';

interface BatchAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reportDate: string;
  catEq: string[];
  catSv: string[];
  existingCodesInReport: string[];
  onRegisterCode: (code: string) => void;
  onRegisterService: (service: string) => void;
  onConfirmAdd: (codes: string[], sharedServices: string[], sharedDue: string) => void;
}

const DUE_SHORTCUTS = [
  { label: '+1 dia', days: 1 },
  { label: '+2 dias', days: 2 },
  { label: '+3 dias', days: 3 },
  { label: '+7 dias', days: 7 },
];

export const BatchAddSheet: React.FC<BatchAddSheetProps> = ({
  isOpen,
  onClose,
  reportDate,
  catEq,
  catSv,
  existingCodesInReport,
  onRegisterCode,
  onRegisterService,
  onConfirmAdd,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [eqQuery, setEqQuery] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [svQuery, setSvQuery] = useState('');
  const [sharedServices, setSharedServices] = useState<string[]>([]);
  const [showOtherCause, setShowOtherCause] = useState(false);
  const [otherCauseDraft, setOtherCauseDraft] = useState('');
  const [sharedDue, setSharedDue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEqQuery('');
      setSelectedCodes([]);
      setSvQuery('');
      setSharedServices([]);
      setShowOtherCause(false);
      setOtherCauseDraft('');
      setSharedDue('');
    }
  }, [isOpen]);

  const existingSet = useMemo(
    () => new Set(existingCodesInReport.map((c) => c.toUpperCase())),
    [existingCodesInReport]
  );

  const selectedCodeSet = useMemo(() => new Set(selectedCodes), [selectedCodes]);

  const filteredCodes = useMemo(
    () => catEq.filter((code) => matchesEquipmentQuery(code, eqQuery)),
    [catEq, eqQuery]
  );

  const groups = useMemo(() => groupEquipmentCodes(filteredCodes), [filteredCodes]);

  const registerableCode = useMemo(() => {
    if (filteredCodes.length > 0) return null;
    const candidate = parseRegisterableCode(eqQuery);
    if (!candidate) return null;
    if (catEq.some((c) => c.toUpperCase() === candidate)) return null;
    return candidate;
  }, [filteredCodes.length, eqQuery, catEq]);

  const toggleCode = (code: string) => {
    if (existingSet.has(code)) return;
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleRegisterAndPick = () => {
    if (!registerableCode) return;
    onRegisterCode(registerableCode);
    setSelectedCodes((prev) =>
      prev.includes(registerableCode) ? prev : [...prev, registerableCode]
    );
    setEqQuery('');
  };

  // Step 2 services logic
  const normSvQuery = normalizeSearch(svQuery);
  const filteredServices = useMemo(() => {
    if (!normSvQuery) return catSv;
    return catSv.filter((s) => normalizeSearch(s).includes(normSvQuery));
  }, [catSv, normSvQuery]);

  const canAddCustomService = useMemo(() => {
    const trimmed = svQuery.trim();
    if (!trimmed) return false;
    return !catSv.some((s) => normalizeSearch(s) === normSvQuery);
  }, [svQuery, catSv, normSvQuery]);

  const sharedServiceNormSet = useMemo(
    () => new Set(sharedServices.map((s) => normalizeSearch(s))),
    [sharedServices]
  );

  const toggleSharedService = (service: string) => {
    const norm = normalizeSearch(service);
    setSharedServices((prev) =>
      prev.some((s) => normalizeSearch(s) === norm)
        ? prev.filter((s) => normalizeSearch(s) !== norm)
        : [...prev, service]
    );
  };

  const handleAddCustomService = () => {
    const trimmed = svQuery.trim().replace(/\.+$/, '').trim();
    if (!trimmed) return;
    if (!catSv.some((s) => normalizeSearch(s) === normalizeSearch(trimmed))) {
      onRegisterService(trimmed);
    }
    if (!sharedServiceNormSet.has(normalizeSearch(trimmed))) {
      setSharedServices((prev) => [...prev, trimmed]);
    }
    setSvQuery('');
  };

  const handleAddOtherCause = () => {
    const trimmed = otherCauseDraft.trim().replace(/\.+$/, '').trim();
    if (!trimmed) return;
    if (!catSv.some((s) => normalizeSearch(s) === normalizeSearch(trimmed))) {
      onRegisterService(trimmed);
    }
    if (!sharedServiceNormSet.has(normalizeSearch(trimmed))) {
      setSharedServices((prev) => [...prev, trimmed]);
    }
    setOtherCauseDraft('');
  };

  const handleConfirmBatch = () => {
    const finalServices = [...sharedServices];
    const pendingOther = otherCauseDraft.trim().replace(/\.+$/, '').trim();
    if (pendingOther) {
      const norm = normalizeSearch(pendingOther);
      if (!catSv.some((s) => normalizeSearch(s) === norm)) {
        onRegisterService(pendingOther);
      }
      if (!finalServices.some((s) => normalizeSearch(s) === norm)) {
        finalServices.push(pendingOther);
      }
    }
    onConfirmAdd(selectedCodes, finalServices, sharedDue);
    onClose();
  };

  const handleServiceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (canAddCustomService) {
        handleAddCustomService();
      } else if (filteredServices.length === 1) {
        toggleSharedService(filteredServices[0]);
        setSvQuery('');
      }
    }
  };

  const count = selectedCodes.length;
  const title =
    step === 1
      ? 'Selecione os equipamentos'
      : count === 1
        ? '1 equipamento'
        : `${count} equipamentos`;

  const footer =
    step === 1 ? (
      <button
        type="button"
        disabled={count === 0}
        onClick={() => setStep(2)}
        className="w-full min-h-[48px] rounded-[12px] bg-[#0f3b2c] hover:bg-[#144c39] disabled:bg-[#9bb0a7] dark:disabled:bg-[#2a3b34] disabled:cursor-not-allowed text-white font-semibold text-[16px] active:scale-[0.99] transition-all"
      >
        {count === 1
          ? 'Continuar (1 selecionado)'
          : `Continuar (${count} selecionados)`}
      </button>
    ) : (
      <button
        type="button"
        onClick={handleConfirmBatch}
        className="w-full min-h-[48px] rounded-[12px] bg-[#0f3b2c] hover:bg-[#144c39] text-white font-semibold text-[16px] active:scale-[0.99] transition-transform"
      >
        Adicionar {count} ao relatório
      </button>
    );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      {step === 1 ? (
        <div className="space-y-4 pb-3">
          {/* Search input */}
          <div className="relative">
            <Search
              className="w-[18px] h-[18px] text-[#7c8c85] dark:text-[#869b93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={eqQuery}
              onChange={(e) => setEqQuery(e.target.value)}
              placeholder="Buscar código (ex.: 3059, CR 3059)"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full min-h-[46px] pl-10 pr-3.5 rounded-[12px] bg-[#f4f6f5] dark:bg-[#202d28] border border-[#dfe5e2] dark:border-[#2f3f38] text-[16px] text-[#14201b] dark:text-[#eef3f1] placeholder:text-[#82918b] dark:placeholder:text-[#7c9088] focus:outline-none focus:ring-2 focus:ring-[#0f3b2c]/30 dark:focus:ring-[#4ea885]/40 focus:border-[#0f3b2c]"
            />
          </div>

          {/* Register new code if valid and not found */}
          {registerableCode && (
            <button
              type="button"
              onClick={handleRegisterAndPick}
              className="w-full min-h-[48px] px-4 rounded-[12px] border border-dashed border-[#0f3b2c] dark:border-[#4ea885] bg-[#e9f5ef] dark:bg-[#133225] text-[#0f3b2c] dark:text-[#76d8b0] font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Cadastrar {registerableCode}</span>
            </button>
          )}

          {/* 3-column grouped grid */}
          {groups.length > 0 ? (
            <div className="space-y-5">
              {groups.map((group) => (
                <div key={group.id} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#66756f] dark:text-[#92a59e]">
                      {group.label}
                    </h3>
                    <span className="text-[11px] font-medium text-[#82918b] dark:text-[#7c9088] tabular-nums">
                      {group.codes.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {group.codes.map((code) => {
                      const alreadyInReport = existingSet.has(code);
                      const isSelected = selectedCodeSet.has(code);
                      return (
                        <button
                          key={code}
                          type="button"
                          disabled={alreadyInReport}
                          onClick={() => toggleCode(code)}
                          className={`min-h-[44px] px-1.5 rounded-[10px] font-semibold tabular-nums whitespace-nowrap border transition-all flex items-center justify-center gap-1 ${
                            code.length > 8 ? 'text-[12px] tracking-tight' : 'text-[14px]'
                          } ${
                            alreadyInReport
                              ? 'bg-[#f2f4f3] dark:bg-[#1a2420] border-[#e4e9e6] dark:border-[#26342e] text-[#9aa7a2] dark:text-[#55665f] opacity-45 cursor-not-allowed'
                              : isSelected
                                ? 'bg-[#0f3b2c] border-[#0f3b2c] text-white shadow-xs active:scale-[0.97]'
                                : 'bg-white dark:bg-[#1d2924] border-[#dce3df] dark:border-[#2e3e37] text-[#1a2722] dark:text-[#e3ece8] active:scale-[0.97]'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.8]" />}
                          <span>{code}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !registerableCode && (
              <div className="py-10 text-center space-y-1.5">
                <p className="text-[15px] font-medium text-[#46564f] dark:text-[#a8b8b1]">
                  Nenhum equipamento encontrado
                </p>
                <p className="text-[13px] text-[#7b8a84] dark:text-[#7c9088]">
                  Para cadastrar um novo, digite no padrão XX-1234 (ex.: CR-3200).
                </p>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="space-y-5 pb-3">
          {/* Selected equipments summary + back button */}
          <div className="p-3.5 rounded-[12px] bg-[#f4f6f5] dark:bg-[#1d2a24] border border-[#e0e6e3] dark:border-[#2c3b34] space-y-2.5">
            <p className="text-[14px] font-semibold text-[#14201b] dark:text-[#e8efec] leading-relaxed tabular-nums">
              {selectedCodes.join(' · ')}
            </p>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="min-h-[44px] inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0f3b2c] dark:text-[#6fd1a9] active:opacity-75"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar e alterar seleção</span>
            </button>
          </div>

          {/* Shared due date (optional) */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#66756f] dark:text-[#92a59e]">
              Previsão igual para todos (opcional)
            </label>
            <DateField
              value={sharedDue}
              onChange={setSharedDue}
              placeholder="Sem previsão (a definir)"
              allowClear
              ariaLabel="Previsão igual para todos"
            />
            <div className="flex flex-wrap gap-2 pt-0.5">
              {DUE_SHORTCUTS.map((sc) => {
                const targetIso = addDaysISO(reportDate, sc.days);
                const isActive = sharedDue === targetIso;
                return (
                  <button
                    key={sc.days}
                    type="button"
                    onClick={() => setSharedDue(targetIso)}
                    className={`min-h-[44px] px-3.5 rounded-full text-[13px] font-semibold border transition-colors active:scale-95 ${
                      isActive
                        ? 'bg-[#0f3b2c] border-[#0f3b2c] text-white'
                        : 'bg-white dark:bg-[#1d2924] border-[#dce3df] dark:border-[#2e3e37] text-[#23322c] dark:text-[#d5e0db]'
                    }`}
                  >
                    {sc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shared services (optional) */}
          <div className="space-y-2.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#66756f] dark:text-[#92a59e]">
              Serviços iguais para todos (opcional)
            </label>
            <input
              type="text"
              value={svQuery}
              onChange={(e) => setSvQuery(e.target.value)}
              onKeyDown={handleServiceKeyDown}
              placeholder="Buscar ou digitar causa / serviço"
              className="w-full min-h-[46px] px-3.5 rounded-[12px] bg-[#f4f6f5] dark:bg-[#202d28] border border-[#dfe5e2] dark:border-[#2f3f38] text-[16px] text-[#14201b] dark:text-[#eef3f1] placeholder:text-[#82918b] dark:placeholder:text-[#7c9088] focus:outline-none focus:ring-2 focus:ring-[#0f3b2c]/30 dark:focus:ring-[#4ea885]/40 focus:border-[#0f3b2c]"
            />

            {canAddCustomService && (
              <button
                type="button"
                onClick={handleAddCustomService}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-[12px] border border-dashed border-[#0f3b2c] dark:border-[#4ea885] bg-[#e9f5ef] dark:bg-[#133225] text-[#0f3b2c] dark:text-[#76d8b0] font-semibold text-[15px] flex items-center gap-2 text-left active:scale-[0.99] transition-transform"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="break-words">Adicionar “{svQuery.trim()}”</span>
              </button>
            )}

            <div className="space-y-2">
              {/* "Outro" option to type custom cause */}
              <div
                className={`rounded-[12px] border transition-colors ${
                  showOtherCause
                    ? 'bg-[#e6f5ee] dark:bg-[#123326] border-[#0f3b2c]/45 dark:border-[#3c9973]'
                    : 'bg-white dark:bg-[#1b2621] border-[#e1e7e4] dark:border-[#2c3b34]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowOtherCause((prev) => !prev)}
                  className="w-full min-h-[50px] px-3.5 py-2.5 flex items-center justify-between gap-3 text-left active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <PenLine className="w-4 h-4 shrink-0 text-[#0f3b2c] dark:text-[#6fd1a9]" />
                    <div className="min-w-0">
                      <span className="block text-[14px] leading-snug font-semibold text-[#0f3b2c] dark:text-[#86e2bc]">
                        Outro (digitar causa)
                      </span>
                      <span className="block text-[12px] text-[#66756f] dark:text-[#92a59e]">
                        Escreva uma causa que não está na lista
                      </span>
                    </div>
                  </div>
                  <span
                    aria-hidden="true"
                    className={`w-[22px] h-[22px] rounded-[6px] flex items-center justify-center shrink-0 border-2 transition-colors ${
                      showOtherCause
                        ? 'bg-[#0f3b2c] border-[#0f3b2c] text-white'
                        : 'bg-white dark:bg-[#202d28] border-[#788781] dark:border-[#60736b]'
                    }`}
                  >
                    {showOtherCause && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </span>
                </button>

                {showOtherCause && (
                  <div className="px-3.5 pb-3.5 pt-1 space-y-2.5">
                    <input
                      type="text"
                      value={otherCauseDraft}
                      autoFocus
                      onChange={(e) => setOtherCauseDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOtherCause();
                        }
                      }}
                      placeholder="Digite a causa / serviço..."
                      className="w-full min-h-[44px] px-3 rounded-[10px] bg-white dark:bg-[#16201c] border border-[#0f3b2c]/45 dark:border-[#4ea885] text-[15px] text-[#14201b] dark:text-[#eef3f1] placeholder:text-[#82918b] dark:placeholder:text-[#7c9088] focus:outline-none focus:ring-2 focus:ring-[#0f3b2c]/30"
                    />
                    <button
                      type="button"
                      disabled={!otherCauseDraft.trim()}
                      onClick={handleAddOtherCause}
                      className="w-full min-h-[42px] px-3.5 rounded-[10px] bg-[#0f3b2c] hover:bg-[#144c39] disabled:bg-[#9bb0a7] dark:disabled:bg-[#2a3b34] disabled:cursor-not-allowed text-white text-[14px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all"
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      <span>Incluir causa</span>
                    </button>
                  </div>
                )}
              </div>

              {filteredServices.map((service) => {
                const checked = sharedServiceNormSet.has(normalizeSearch(service));
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => toggleSharedService(service)}
                    className={`w-full min-h-[50px] px-3.5 py-2.5 rounded-[12px] border flex items-center justify-between gap-3 text-left transition-colors active:scale-[0.99] ${
                      checked
                        ? 'bg-[#e6f5ee] dark:bg-[#123326] border-[#0f3b2c]/45 dark:border-[#3c9973] text-[#0c2d21] dark:text-[#e6f7f0]'
                        : 'bg-white dark:bg-[#1b2621] border-[#e1e7e4] dark:border-[#2c3b34] text-[#1c2823] dark:text-[#dfe9e5]'
                    }`}
                  >
                    <span className="text-[14px] leading-snug font-medium flex-1">
                      {service}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`w-[22px] h-[22px] rounded-[6px] flex items-center justify-center shrink-0 border-2 transition-colors ${
                        checked
                          ? 'bg-[#0f3b2c] border-[#0f3b2c] text-white'
                          : 'bg-white dark:bg-[#202d28] border-[#788781] dark:border-[#60736b]'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </BottomSheet>
  );
};
