import React, { useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import { formatDateBR } from '../utils/reportUtils';

interface DateFieldProps {
  id?: string;
  value: string; // YYYY-MM-DD or ''
  onChange: (iso: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  ariaLabel?: string;
}

export const DateField: React.FC<DateFieldProps> = ({
  id,
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  allowClear = false,
  ariaLabel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const formatted = formatDateBR(value);

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
      } catch {
        // Fallback to native input click/focus
      }
    }
  };

  return (
    <div className="relative flex items-center">
      <div
        onClick={openPicker}
        className="relative flex-1 min-h-[46px] flex items-center justify-between px-3.5 rounded-[10px] bg-[#f4f6f5] dark:bg-[#202d28] border border-[#dfe5e2] dark:border-[#2f3f38] focus-within:ring-2 focus-within:ring-[#0f3b2c]/30 dark:focus-within:ring-[#4ea885]/40 focus-within:border-[#0f3b2c] dark:focus-within:border-[#4ea885] transition-colors cursor-pointer"
      >
        <span
          className={`text-[16px] tabular-nums select-none ${
            formatted
              ? 'text-[#14201b] dark:text-[#e8efec] font-medium'
              : 'text-[#87948e] dark:text-[#7c9088]'
          }`}
        >
          {formatted || placeholder}
        </span>

        <Calendar
          className="w-[18px] h-[18px] text-[#3a4a43] dark:text-[#a2b5ad] shrink-0 pointer-events-none"
          aria-hidden="true"
        />

        <input
          ref={inputRef}
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel || placeholder}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[16px]"
        />
      </div>

      {allowClear && value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpar data"
          className="ml-2 min-w-[44px] min-h-[46px] flex items-center justify-center rounded-[10px] bg-[#f4f6f5] dark:bg-[#202d28] border border-[#dfe5e2] dark:border-[#2f3f38] text-[#5e6e67] dark:text-[#98aaa3] active:scale-95 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
