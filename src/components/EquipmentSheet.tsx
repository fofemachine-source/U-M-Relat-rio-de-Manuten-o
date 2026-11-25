import React, { useMemo, useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import {
  groupEquipmentCodes,
  matchesEquipmentQuery,
  parseRegisterableCode,
} from '../utils/reportUtils';

interface EquipmentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  catEq: string[];
  selectedCode?: string;
  disabledCodes?: string[];
  onSelect: (code: string) => void;
  onRegisterCode: (code: string) => void;
}

export const EquipmentSheet: React.FC<EquipmentSheetProps> = ({
  isOpen,
  onClose,
  title,
  catEq,
  selectedCode,
  disabledCodes = [],
  onSelect,
  onRegisterCode,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const disabledSet = useMemo(
    () => new Set(disabledCodes.map((c) => c.toUpperCase())),
    [disabledCodes]
  );

  const filteredCodes = useMemo(() => {
    return catEq.filter((code) => matchesEquipmentQuery(code, query));
  }, [catEq, query]);

  const groups = useMemo(() => groupEquipmentCodes(filteredCodes), [filteredCodes]);

  const registerableCode = useMemo(() => {
    if (filteredCodes.length > 0) return null;
    const candidate = parseRegisterableCode(query);
    if (!candidate) return null;
    if (catEq.some((c) => c.toUpperCase() === candidate)) return null;
    return candidate;
  }, [filteredCodes.length, query, catEq]);

  const handleRegisterAndSelect = () => {
    if (!registerableCode) return;
    onRegisterCode(registerableCode);
    onSelect(registerableCode);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {/* Sticky search bar */}
        <div className="relative">
          <Search
            className="w-[18px] h-[18px] text-[#7c8c85] dark:text-[#869b93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar código (ex.: 3059, CR 3059)"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full min-h-[46px] pl-10 pr-3.5 rounded-[12px] bg-[#f4f6f5] dark:bg-[#202d28] border border-[#dfe5e2] dark:border-[#2f3f38] text-[16px] text-[#14201b] dark:text-[#eef3f1] placeholder:text-[#82918b] dark:placeholder:text-[#7c9088] focus:outline-none focus:ring-2 focus:ring-[#0f3b2c]/30 dark:focus:ring-[#4ea885]/40 focus:border-[#0f3b2c]"
          />
        </div>

        {/* Register new code button when no matches & valid format */}
        {registerableCode && (
          <button
            type="button"
            onClick={handleRegisterAndSelect}
            className="w-full min-h-[48px] px-4 rounded-[12px] border border-dashed border-[#0f3b2c] dark:border-[#4ea885] bg-[#e9f5ef] dark:bg-[#133225] text-[#0f3b2c] dark:text-[#76d8b0] font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Cadastrar {registerableCode}</span>
          </button>
        )}

        {/* Grouped 3-column grid */}
        {groups.length > 0 ? (
          <div className="space-y-5 pb-4">
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
                    const isSelected = selectedCode?.toUpperCase() === code;
                    const isDisabled = !isSelected && disabledSet.has(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          onSelect(code);
                          onClose();
                        }}
                        className={`min-h-[44px] px-1.5 rounded-[10px] font-semibold tabular-nums whitespace-nowrap border transition-all active:scale-[0.97] ${
                          code.length > 8 ? 'text-[12px] tracking-tight' : 'text-[14px]'
                        } ${
                          isSelected
                            ? 'bg-[#0f3b2c] border-[#0f3b2c] text-white shadow-xs'
                            : isDisabled
                              ? 'bg-[#f3f5f4] dark:bg-[#1b2521] border-[#e4e9e6] dark:border-[#26342e] text-[#9aa7a2] dark:text-[#576962] opacity-50 cursor-not-allowed'
                              : 'bg-white dark:bg-[#1d2924] border-[#dce3df] dark:border-[#2e3e37] text-[#1a2722] dark:text-[#e3ece8] hover:border-[#0f3b2c]/50'
                        }`}
                      >
                        {code}
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
    </BottomSheet>
  );
};
