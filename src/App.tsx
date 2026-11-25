import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Menu, Moon, Plus, Send, Sun, Wrench } from 'lucide-react';
import { INITIAL_EQUIPMENTS, INITIAL_SERVICES } from './data/initialData';
import { ConfirmModalConfig, EquipmentEntry, ReportState } from './types';
import {
  addDaysISO,
  generateId,
  generateWhatsAppReport,
  getTodayISO,
  normalizeSearch,
  parsePastedReport,
  sortEquipmentCodes,
} from './utils/reportUtils';
import { DateField } from './components/DateField';
import { EquipmentCard } from './components/EquipmentCard';
import { EquipmentSheet } from './components/EquipmentSheet';
import { ServicesSheet } from './components/ServicesSheet';
import { BatchAddSheet } from './components/BatchAddSheet';
import { PasteReportSheet } from './components/PasteReportSheet';
import { ConfirmModal } from './components/ConfirmModal';
import { SummarySection } from './components/SummarySection';

const STORAGE_KEY = 'um_relatorio_manutencao_v1';
const THEME_KEY = 'um_relatorio_theme_pref_v2';

function loadInitialState(): ReportState {
  const defaultState: ReportState = {
    date: getTodayISO(),
    eqs: [],
    catEq: sortEquipmentCodes(INITIAL_EQUIPMENTS),
    catSv: [...INITIAL_SERVICES],
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<ReportState>;
    const date =
      typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
        ? parsed.date
        : getTodayISO();

    const eqs: EquipmentEntry[] = Array.isArray(parsed.eqs)
      ? parsed.eqs.map((e) => ({
          id: typeof e?.id === 'string' && e.id ? e.id : generateId(),
          code: typeof e?.code === 'string' ? e.code.trim().toUpperCase() : '',
          items: Array.isArray(e?.items)
            ? e.items.filter((i): i is string => typeof i === 'string' && i.trim().length > 0)
            : [],
          due: typeof e?.due === 'string' ? e.due : '',
        }))
      : [];

    const mergedCatEq = sortEquipmentCodes([
      ...INITIAL_EQUIPMENTS,
      ...(Array.isArray(parsed.catEq)
        ? parsed.catEq.filter((c): c is string => typeof c === 'string')
        : []),
    ]);

    const svMap = new Set(INITIAL_SERVICES.map((s) => normalizeSearch(s)));
    const mergedCatSv = [...INITIAL_SERVICES];
    if (Array.isArray(parsed.catSv)) {
      for (const s of parsed.catSv) {
        if (typeof s === 'string' && s.trim()) {
          const norm = normalizeSearch(s);
          if (!svMap.has(norm)) {
            svMap.add(norm);
            mergedCatSv.push(s.trim());
          }
        }
      }
    }

    return {
      date,
      eqs,
      catEq: mergedCatEq,
      catSv: mergedCatSv,
    };
  } catch {
    return defaultState;
  }
}

function loadInitialDarkMode(): boolean {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
  } catch {
    // Ignore storage read errors
  }
  return false;
}

type EquipmentPickerTarget =
  | { kind: 'entry'; entryId: string; currentCode: string }
  | { kind: 'vale'; callback: (code: string) => void }
  | null;

export default function App() {
  const [state, setState] = useState<ReportState>(loadInitialState);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(loadInitialDarkMode);

  // Sheets & modals
  const [batchSheetOpen, setBatchSheetOpen] = useState(false);
  const [pasteSheetOpen, setPasteSheetOpen] = useState(false);
  const [eqPickerTarget, setEqPickerTarget] = useState<EquipmentPickerTarget>(null);
  const [servicesPickerEntryId, setServicesPickerEntryId] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmModalConfig | null>(null);

  // Feedback
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  }, []);

  // Persist report state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const handleToggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const reportText = useMemo(
    () => generateWhatsAppReport(state.date, state.eqs),
    [state.date, state.eqs]
  );

  const whatsappUrl = useMemo(
    () => `https://wa.me/?text=${encodeURIComponent(reportText)}`,
    [reportText]
  );

  const existingCodesInReport = useMemo(
    () => state.eqs.map((e) => e.code).filter(Boolean),
    [state.eqs]
  );

  const handleRegisterCode = useCallback(
    (code: string) => {
      const upper = code.trim().toUpperCase();
      if (!upper) return;
      setState((prev) => ({
        ...prev,
        catEq: sortEquipmentCodes([...prev.catEq, upper]),
      }));
      showToast(`Equipamento ${upper} cadastrado`);
    },
    [showToast]
  );

  const handleRegisterService = useCallback(
    (service: string) => {
      const trimmed = service.trim();
      if (!trimmed) return;
      setState((prev) => {
        if (prev.catSv.some((s) => normalizeSearch(s) === normalizeSearch(trimmed))) {
          return prev;
        }
        return {
          ...prev,
          catSv: [...prev.catSv, trimmed],
        };
      });
    },
    []
  );

  const handleNextDay = () => {
    setState((prev) => ({
      ...prev,
      date: addDaysISO(prev.date, 1),
    }));
    showToast('Data avançada em 1 dia');
  };

  const handleClearReport = () => {
    if (state.eqs.length === 0) {
      showToast('A lista já está vazia');
      return;
    }
    setConfirmConfig({
      title: 'Limpar relatório?',
      message: `Todos os ${state.eqs.length} equipamentos serão removidos do relatório atual. A lista salva de códigos e serviços será mantida.`,
      confirmLabel: 'Limpar tudo',
      destructive: true,
      onConfirm: () => {
        setState((prev) => ({ ...prev, eqs: [] }));
        setOpenCardId(null);
        showToast('Relatório limpo');
      },
    });
  };

  const handleBatchConfirmAdd = (
    codes: string[],
    sharedServices: string[],
    sharedDue: string
  ) => {
    if (codes.length === 0) return;
    const newEntries: EquipmentEntry[] = codes.map((code) => ({
      id: generateId(),
      code: code.toUpperCase(),
      items: [...sharedServices],
      due: sharedDue,
    }));

    setState((prev) => ({
      ...prev,
      eqs: [...prev.eqs, ...newEntries],
    }));

    const firstNew = newEntries[0];
    setOpenCardId(firstNew.id);

    window.setTimeout(() => {
      const el = document.getElementById(`equipment-card-${firstNew.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);

    showToast(
      newEntries.length === 1
        ? `${firstNew.code} adicionado ao relatório`
        : `${newEntries.length} equipamentos adicionados`
    );
  };

  const handleParsePastedReport = (rawText: string) => {
    const parsed = parsePastedReport(rawText, state.catEq, state.catSv);
    if (parsed.eqs.length === 0) {
      return {
        ok: false,
        error:
          'Nenhum equipamento foi encontrado. Verifique se o texto contém códigos como CD-111 ou CR-3059.',
      };
    }

    setState((prev) => ({
      date: parsed.date || prev.date,
      eqs: parsed.eqs,
      catEq: sortEquipmentCodes([...prev.catEq, ...parsed.newCodes]),
      catSv: [...prev.catSv, ...parsed.newServices],
    }));
    setOpenCardId(null);
    showToast(`${parsed.eqs.length} equipamentos carregados`);
    return { ok: true };
  };

  const handleSortByDue = () => {
    setState((prev) => {
      const sorted = [...prev.eqs].sort((a, b) => {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return a.due.localeCompare(b.due);
      });
      return { ...prev, eqs: sorted };
    });
    showToast('Ordenado por previsão de liberação');
  };

  const handleCopyReport = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(reportText);
      } else {
        const ta = document.createElement('textarea');
        ta.value = reportText;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      showToast('Texto copiado para a área de transferência');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Não foi possível copiar automaticamente');
    }
  };

  const handleScrollToSummary = () => {
    const el = document.getElementById('resumo-section');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleJumpToEquipment = (id: string) => {
    setOpenCardId(id);
    window.setTimeout(() => {
      const el = document.getElementById(`equipment-card-${id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const activeServicesEntry = useMemo(
    () => state.eqs.find((e) => e.id === servicesPickerEntryId) || null,
    [state.eqs, servicesPickerEntryId]
  );

  // Codes disabled when editing an existing card's equipment (other cards' codes)
  const disabledCodesForSinglePicker = useMemo(() => {
    if (!eqPickerTarget || eqPickerTarget.kind !== 'entry') return [];
    return state.eqs
      .filter((e) => e.id !== eqPickerTarget.entryId && e.code)
      .map((e) => e.code);
  }, [eqPickerTarget, state.eqs]);

  return (
    <div className="min-h-dvh bg-[#eef1ef] dark:bg-[#080d0b] flex justify-center">
      {/* Mobile-exclusive single-page frame (360px - 430px) */}
      <div className="w-full max-w-[430px] min-h-dvh bg-[#eef1ef] dark:bg-[#0f1714] flex flex-col relative">
        {/* Top Header */}
        <header className="bg-[#0f3b2c] text-white rounded-b-[20px] px-4 pt-4 pb-5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-[12px] bg-white/12 flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <Wrench className="w-5 h-5 text-[#88d4c0]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[17px] font-bold leading-tight tracking-tight text-white truncate">
                  U&amp;M – Relatório de manutenção
                </h1>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#a7c7bc] mt-0.5 truncate">
                  Equipamentos rodoviários
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-[12px] bg-white/10 hover:bg-white/15 flex items-center justify-center text-[#d8ede6] active:scale-95 transition-all shrink-0"
            >
              {isDark ? <Sun className="w-[19px] h-[19px]" /> : <Moon className="w-[19px] h-[19px]" />}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 pt-5 pb-28 space-y-6">
          {/* Section 1 – Identificação do relatório */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-[26px] h-[26px] rounded-[7px] bg-[#0f3b2c] text-white text-[13px] font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#182620] dark:text-[#e6efeb]">
                Identificação do relatório
              </h2>
            </div>

            <div className="bg-white dark:bg-[#18221e] border border-[#dfe5e2] dark:border-[#2a3832] rounded-[12px] p-4 space-y-3.5">
              <div className="space-y-1.5">
                <label
                  htmlFor="report-date"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#66756f] dark:text-[#92a59e]"
                >
                  Data <span className="text-[#d32f2f]">*</span>
                </label>
                <DateField
                  id="report-date"
                  value={state.date}
                  onChange={(iso) => {
                    if (iso) setState((prev) => ({ ...prev, date: iso }));
                  }}
                  ariaLabel="Data do relatório"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleNextDay}
                  className="min-h-[44px] px-3.5 rounded-[10px] border border-[#d9e1dd] dark:border-[#2f3f38] bg-white dark:bg-[#202d28] text-[#1c2823] dark:text-[#e2ece8] text-[14px] font-medium active:scale-[0.98] transition-transform"
                >
                  Próximo dia
                </button>
                <button
                  type="button"
                  onClick={() => setPasteSheetOpen(true)}
                  className="min-h-[44px] px-3.5 rounded-[10px] border border-[#d9e1dd] dark:border-[#2f3f38] bg-white dark:bg-[#202d28] text-[#1c2823] dark:text-[#e2ece8] text-[14px] font-medium active:scale-[0.98] transition-transform"
                >
                  Colar relatório anterior
                </button>
                <button
                  type="button"
                  onClick={handleClearReport}
                  className="min-h-[44px] px-3.5 rounded-[10px] border border-[#d9e1dd] dark:border-[#2f3f38] bg-white dark:bg-[#202d28] text-[#1c2823] dark:text-[#e2ece8] text-[14px] font-medium active:scale-[0.98] transition-transform"
                >
                  Limpar
                </button>
              </div>
            </div>
          </section>

          {/* Section 2 – Equipamentos em manutenção */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-[26px] h-[26px] rounded-[7px] bg-[#0f3b2c] text-white text-[13px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#182620] dark:text-[#e6efeb] truncate">
                  Equipamentos em manutenção
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setBatchSheetOpen(true)}
                className="min-h-[44px] px-3.5 rounded-[10px] bg-[#0f3b2c] hover:bg-[#144c39] text-white text-[12px] font-bold uppercase tracking-wider inline-flex items-center gap-1 shrink-0 active:scale-95 transition-transform"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
                <span>Novo</span>
              </button>
            </div>

            {state.eqs.length === 0 ? (
              <div className="bg-white dark:bg-[#18221e] border border-[#dfe5e2] dark:border-[#2a3832] rounded-[12px] p-5 text-center space-y-2.5">
                <p className="text-[15px] font-semibold text-[#1b2923] dark:text-[#e4ede9]">
                  Nenhum equipamento no relatório
                </p>
                <p className="text-[13px] text-[#66756f] dark:text-[#92a59e] leading-relaxed">
                  Toque em <strong>+ Novo</strong> para selecionar os equipamentos na lista ou
                  use <strong>Colar relatório anterior</strong> para aproveitar o de ontem.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {state.eqs.map((entry, idx) => (
                  <EquipmentCard
                    key={entry.id}
                    index={idx}
                    entry={entry}
                    reportDate={state.date}
                    isOpen={openCardId === entry.id}
                    onToggleOpen={() =>
                      setOpenCardId((prev) => (prev === entry.id ? null : entry.id))
                    }
                    onOpenEquipmentPicker={() =>
                      setEqPickerTarget({
                        kind: 'entry',
                        entryId: entry.id,
                        currentCode: entry.code,
                      })
                    }
                    onOpenServicesPicker={() => setServicesPickerEntryId(entry.id)}
                    onOpenValeTargetPicker={(cb) =>
                      setEqPickerTarget({ kind: 'vale', callback: cb })
                    }
                    onUpdateEntry={(updater) =>
                      setState((prev) => ({
                        ...prev,
                        eqs: prev.eqs.map((e) => (e.id === entry.id ? updater(e) : e)),
                      }))
                    }
                    onRequestRemoveEntry={() =>
                      setConfirmConfig({
                        title: `Remover ${entry.code || `Equipamento ${idx + 1}`}?`,
                        message:
                          'Este equipamento será marcado como liberado e removido do relatório de hoje.',
                        confirmLabel: 'Remover',
                        destructive: true,
                        onConfirm: () => {
                          setState((prev) => ({
                            ...prev,
                            eqs: prev.eqs.filter((e) => e.id !== entry.id),
                          }));
                          if (openCardId === entry.id) setOpenCardId(null);
                          showToast(`${entry.code || 'Equipamento'} removido`);
                        },
                      })
                    }
                    onRequestRemoveVales={(onConfirm) =>
                      setConfirmConfig({
                        title: 'Remover vales de peça?',
                        message:
                          'Ao marcar Não, os vales de peça já incluídos neste equipamento serão removidos da lista de serviços.',
                        confirmLabel: 'Remover vales',
                        destructive: true,
                        onConfirm,
                      })
                    }
                  />
                ))}
              </div>
            )}

            {/* Dashed add another equipment button */}
            <button
              type="button"
              onClick={() => setBatchSheetOpen(true)}
              className="w-full min-h-[48px] px-4 rounded-[12px] border border-dashed border-[#0f3b2c]/45 dark:border-[#4ea885]/50 bg-white/75 dark:bg-[#18221e]/80 text-[#0f3b2c] dark:text-[#6fd1a9] font-semibold text-[15px] flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Adicionar outro equipamento ao relatório</span>
            </button>
          </section>

          {/* Section 3 – Resumo do relatório */}
          <SummarySection
            reportDate={state.date}
            eqs={state.eqs}
            reportText={reportText}
            whatsappUrl={whatsappUrl}
            copied={copied}
            onSortByDue={handleSortByDue}
            onCopy={handleCopyReport}
            onSelectEquipment={handleJumpToEquipment}
          />
        </main>

        {/* Floating Pill Navigation Bar (Screenshots 1, 2, 3) */}
        <nav
          aria-label="Navegação principal"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-48px)] max-w-[332px] bg-white/95 dark:bg-[#1a2621]/95 backdrop-blur-md border border-[#dbe3df] dark:border-[#2c3d36] rounded-full shadow-[0_8px_28px_rgba(15,59,44,0.16)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.5)] p-1.5 grid grid-cols-3 items-center gap-1"
        >
          <button
            type="button"
            onClick={handleScrollToSummary}
            className="min-h-[48px] rounded-full flex flex-col items-center justify-center gap-0.5 text-[#1a2822] dark:text-[#e2ece8] active:bg-[#eef3f0] dark:active:bg-[#24342d] transition-colors"
          >
            <Menu className="w-[18px] h-[18px]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Resumo</span>
          </button>

          <button
            type="button"
            onClick={() => setBatchSheetOpen(true)}
            className="min-h-[48px] rounded-full bg-[#0f3b2c] hover:bg-[#144d39] text-white flex flex-col items-center justify-center gap-0.5 shadow-xs active:scale-[0.97] transition-transform"
          >
            <Plus className="w-[19px] h-[19px] stroke-[2.6]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Adicionar</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[48px] rounded-full flex flex-col items-center justify-center gap-0.5 text-[#1a2822] dark:text-[#e2ece8] active:bg-[#eef3f0] dark:active:bg-[#24342d] transition-colors"
          >
            <Send className="w-[17px] h-[17px]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Enviar</span>
          </a>
        </nav>

        {/* Subtle toast feedback */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 max-w-[360px] px-4 py-2.5 rounded-full bg-[#14231d] dark:bg-[#e8efec] text-white dark:text-[#0f1714] text-[13px] font-medium shadow-lg whitespace-nowrap animate-fade-in"
          >
            {toastMessage}
          </div>
        )}

        {/* Bottom Sheet: Batch Add Multiple Equipments (Steps 1 & 2) */}
        <BatchAddSheet
          isOpen={batchSheetOpen}
          onClose={() => setBatchSheetOpen(false)}
          reportDate={state.date}
          catEq={state.catEq}
          catSv={state.catSv}
          existingCodesInReport={existingCodesInReport}
          onRegisterCode={handleRegisterCode}
          onRegisterService={handleRegisterService}
          onConfirmAdd={handleBatchConfirmAdd}
        />

        {/* Bottom Sheet: Single Equipment Picker (card code or vale target) */}
        <EquipmentSheet
          isOpen={eqPickerTarget !== null}
          onClose={() => setEqPickerTarget(null)}
          title={
            eqPickerTarget?.kind === 'vale'
              ? 'Para liberar o equipamento'
              : 'Selecionar equipamento'
          }
          catEq={state.catEq}
          selectedCode={
            eqPickerTarget?.kind === 'entry' ? eqPickerTarget.currentCode : undefined
          }
          disabledCodes={disabledCodesForSinglePicker}
          onRegisterCode={handleRegisterCode}
          onSelect={(code) => {
            if (!eqPickerTarget) return;
            if (eqPickerTarget.kind === 'entry') {
              const targetId = eqPickerTarget.entryId;
              setState((prev) => ({
                ...prev,
                eqs: prev.eqs.map((e) => (e.id === targetId ? { ...e, code } : e)),
              }));
            } else {
              eqPickerTarget.callback(code);
            }
          }}
        />

        {/* Bottom Sheet: Services Picker for an equipment */}
        <ServicesSheet
          isOpen={activeServicesEntry !== null}
          onClose={() => setServicesPickerEntryId(null)}
          equipmentCode={activeServicesEntry?.code || ''}
          catSv={state.catSv}
          currentItems={activeServicesEntry?.items || []}
          onRegisterService={handleRegisterService}
          onChangeItems={(nextItems) => {
            if (!activeServicesEntry) return;
            const targetId = activeServicesEntry.id;
            setState((prev) => ({
              ...prev,
              eqs: prev.eqs.map((e) => (e.id === targetId ? { ...e, items: nextItems } : e)),
            }));
          }}
        />

        {/* Bottom Sheet: Paste previous report */}
        <PasteReportSheet
          isOpen={pasteSheetOpen}
          onClose={() => setPasteSheetOpen(false)}
          onParseReport={handleParsePastedReport}
        />

        {/* In-App Confirmation Modal */}
        <ConfirmModal config={confirmConfig} onClose={() => setConfirmConfig(null)} />
      </div>
    </div>
  );
}
