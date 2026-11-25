import React, { useEffect, useMemo, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { isValeItem, normalizeSearch } from '../utils/reportUtils';

interface ServicesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentCode: string;
  catSv: string[];
  currentItems: string[];
  onChangeItems: (nextItems: string[]) => void;
  onRegisterService: (service: string) => void;
}

export const ServicesSheet: React.FC<ServicesSheetProps> = ({
  isOpen,
  onClose,
  equipmentCode,
  catSv,
  currentItems,
  onChangeItems,
  onRegisterService,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  // Build combined list of catalog services + any custom non-vale services already on this equipment
  const allDisplayServices = useMemo(() => {
    const seen = new Set(catSv.map((s) => normalizeSearch(s)));
    const extras: string[] = [];
    for (const item of currentItems) {
      if (isValeItem(item)) continue;
      const norm = normalizeSearch(item);
      if (norm && !seen.has(norm)) {
        seen.add(norm);
        extras.push(item);
      }
    }
    return [...catSv, ...extras];
  }, [catSv, currentItems]);

  const normQuery = normalizeSearch(query);

  const filteredServices = useMemo(() => {
    if (!normQuery) return allDisplayServices;
    return allDisplayServices.filter((s) => normalizeSearch(s).includes(normQuery));
  }, [allDisplayServices, normQuery]);

  const canAddCustom = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return false;
    return !allDisplayServices.some((s) => normalizeSearch(s) === normQuery);
  }, [query, allDisplayServices, normQuery]);

  const selectedNormSet = useMemo(
    () => new Set(currentItems.map((item) => normalizeSearch(item))),
    [currentItems]
  );

  const toggleService = (service: string) => {
    const targetNorm = normalizeSearch(service);
    if (selectedNormSet.has(targetNorm)) {
      onChangeItems(currentItems.filter((item) => normalizeSearch(item) !== targetNorm));
    } else {
      onChangeItems([...currentItems, service]);
    }
  };

  const handleAddCustom = () => {
    const trimmed = query.trim().replace(/\.+$/, '').trim();
    if (!trimmed) return;
    if (!catSv.some((s) => normalizeSearch(s) === normalizeSearch(trimmed))) {
      onRegisterService(trimmed);
    }
    if (!selectedNormSet.has(normalizeSearch(trimmed))) {
      onChangeItems([...currentItems, trimmed]);
    }
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (canAddCustom) {
        handleAddCustom();
      } else if (filteredServices.length === 1) {
        toggleService(filteredServices[0]);
        setQuery('');
      }
    }
  };

  const title = equipmentCode ? `Serviços – ${equipmentCode}` : 'Escolher serviços';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[48px] rounded-[12px] bg-[#0f3b2c] hover:bg-[#144c39] text-white font-semibold text-[16px] active:scale-[0.99] transition-transform"
        >
          Concluir
        </button>
      }
    >
      <div className="space-y-3 pb-2">
        {/* Search / quick-add input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar ou digitar um serviço"
          className="w-full min-h-[46px] px-3.5 rounded-[12px] bg-[#f4f6f5] dark:bg-[#202d28] border border-[#dfe5e2] dark:border-[#2f3f38] text-[16px] text-[#14201b] dark:text-[#eef3f1] placeholder:text-[#82918b] dark:placeholder:text-[#7c9088] focus:outline-none focus:ring-2 focus:ring-[#0f3b2c]/30 dark:focus:ring-[#4ea885]/40 focus:border-[#0f3b2c]"
        />

        {/* Add new service button */}
        {canAddCustom && (
          <button
            type="button"
            onClick={handleAddCustom}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-[12px] border border-dashed border-[#0f3b2c] dark:border-[#4ea885] bg-[#e9f5ef] dark:bg-[#133225] text-[#0f3b2c] dark:text-[#76d8b0] font-semibold text-[15px] flex items-center gap-2 text-left active:scale-[0.99] transition-transform"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="break-words">Adicionar “{query.trim()}”</span>
          </button>
        )}

        {/* Services checkbox list matching Screenshot 4 */}
        <div className="space-y-2">
          {filteredServices.map((service) => {
            const checked = selectedNormSet.has(normalizeSearch(service));
            return (
              <button
                key={service}
                type="button"
                onClick={() => toggleService(service)}
                className={`w-full min-h-[52px] px-4 py-3 rounded-[12px] border flex items-center justify-between gap-3 text-left transition-colors active:scale-[0.99] ${
                  checked
                    ? 'bg-[#e6f5ee] dark:bg-[#123326] border-[#0f3b2c]/45 dark:border-[#3c9973] text-[#0c2d21] dark:text-[#e6f7f0]'
                    : 'bg-white dark:bg-[#1b2621] border-[#e1e7e4] dark:border-[#2c3b34] text-[#1c2823] dark:text-[#dfe9e5]'
                }`}
              >
                <span className="text-[15px] leading-snug font-medium flex-1">
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
    </BottomSheet>
  );
};
