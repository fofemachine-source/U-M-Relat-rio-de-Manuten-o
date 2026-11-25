import { EquipmentEntry, EquipmentGroup } from '../types';

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `eq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Returns today's date in local timezone as YYYY-MM-DD */
export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Adds N days to an ISO YYYY-MM-DD date string safely (no timezone drift) */
export function addDaysISO(iso: string, days: number): string {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : getTodayISO();
  const [y, m, d] = base.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

/** Formats YYYY-MM-DD -> dd/mm/aaaa */
export function formatDateBR(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Formats YYYY-MM-DD -> dd/mm/aa */
export function formatShortDateBR(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y.slice(-2)}`;
}

/** Parses dd/mm/aa or dd/mm/aaaa to YYYY-MM-DD */
export function parseBRDateToISO(input: string): string | null {
  const match = input.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  let year = parseInt(match[3], 10);
  if (match[3].length === 2) {
    year = 2000 + year;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(year, month - 1, day);
  if (
    dt.getFullYear() !== year ||
    dt.getMonth() !== month - 1 ||
    dt.getDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Removes diacritics and lowercases for accent-insensitive search */
export function normalizeSearch(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Flexible equipment search: ignores spaces, hyphens, slashes, and case */
export function matchesEquipmentQuery(code: string, query: string): boolean {
  const normQuery = query.replace(/[\s/-]+/g, '').toUpperCase();
  if (!normQuery) return true;
  const normCode = code.replace(/[\s/-]+/g, '').toUpperCase();
  return normCode.includes(normQuery);
}

/** Validates if user search text can be registered as a new equipment code (e.g. CR-3200, AL/VL-2G02, RP1004) */
export function parseRegisterableCode(query: string): string | null {
  const trimmed = query.trim().toUpperCase();
  const hyphenMatch = trimmed.match(/^((?:AL\/)?[A-Z]{2,3})-([A-Z0-9]{1,6})$/);
  if (hyphenMatch && /\d/.test(hyphenMatch[2])) {
    return `${hyphenMatch[1]}-${hyphenMatch[2]}`;
  }
  const compactMatch = trimmed.match(/^([A-Z]{2,3}\d{3,5})$/);
  if (compactMatch) {
    return compactMatch[1];
  }
  return null;
}

/** Sorts equipment codes by prefix alphabetically, then numerically/naturally */
export function sortEquipmentCodes(codes: string[]): string[] {
  const unique = Array.from(new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean)));
  return unique.sort((a, b) => {
    const ma = a.match(/^((?:AL\/)?[A-Z]+)-(\d+)$/);
    const mb = b.match(/^((?:AL\/)?[A-Z]+)-(\d+)$/);
    if (ma && mb) {
      const pCmp = ma[1].localeCompare(mb[1], 'pt-BR');
      if (pCmp !== 0) return pCmp;
      return parseInt(ma[2], 10) - parseInt(mb[2], 10);
    }
    return a.localeCompare(b, 'pt-BR', { numeric: true });
  });
}

/** Groups equipment codes into Diversos, Caminhões (CR), Escavadeiras (EH), Tratores (TE), and Alugados (AL) */
export function groupEquipmentCodes(codes: string[]): EquipmentGroup[] {
  const sorted = sortEquipmentCodes(codes);
  const cr: string[] = [];
  const eh: string[] = [];
  const te: string[] = [];
  const al: string[] = [];
  const others: string[] = [];

  for (const code of sorted) {
    if (code.startsWith('CR-')) {
      cr.push(code);
    } else if (code.startsWith('EH-')) {
      eh.push(code);
    } else if (code.startsWith('TE-')) {
      te.push(code);
    } else if (code.startsWith('AL/')) {
      al.push(code);
    } else {
      others.push(code);
    }
  }

  const groups: EquipmentGroup[] = [];
  if (others.length > 0) {
    groups.push({ id: 'diversos', label: 'DIVERSOS', codes: others });
  }
  if (cr.length > 0) {
    groups.push({ id: 'cr', label: 'CAMINHÕES (CR)', codes: cr });
  }
  if (eh.length > 0) {
    groups.push({ id: 'eh', label: 'ESCAVADEIRAS (EH)', codes: eh });
  }
  if (te.length > 0) {
    groups.push({ id: 'te', label: 'TRATORES (TE)', codes: te });
  }
  if (al.length > 0) {
    groups.push({ id: 'al', label: 'ALUGADOS (AL)', codes: al });
  }
  return groups;
}

/** Checks whether a service item is a "vale de peça" */
export function isValeItem(text: string): boolean {
  return /^vale\b/i.test(text.trim());
}

/** Builds standardized vale text */
export function buildValeText(pieceRaw: string, targetCode: string): string {
  const piece = pieceRaw.trim();
  const code = targetCode.trim().toUpperCase();
  if (/^(da|do|das|dos|de)\s+/i.test(piece)) {
    return `Vale ${piece} para liberar o ${code}`;
  }
  return `Vale da ${piece} para liberar o ${code}`;
}

/** Formats a single service line according to the exact WhatsApp report specification */
export function formatServiceForReport(raw: string): string {
  // Strip any stray asterisks or leading wrench so formatting is idempotent
  let text = raw
    .replace(/\*/g, '')
    .replace(/^[🔧🛠⚙️\s]+/u, '')
    .trim();

  if (!text) return '';

  // Capitalize first character
  text = text.charAt(0).toUpperCase() + text.slice(1);

  // Add period unless it already ends with punctuation or an equipment code
  const endsWithPunctuation = /[.!?]$/.test(text);
  const endsWithEqCode = /\b(?:AL\/[A-Za-z]{2,3}-[A-Za-z0-9]{1,6}|[A-Za-z]{2,3}-\d{1,5}|RP\d{3,5})$/i.test(text);
  if (!endsWithPunctuation && !endsWithEqCode) {
    text = `${text}.`;
  }

  // Bold equipment codes (e.g., CR-3059, AL/VL-2G02, RP1004)
  text = text.replace(
    /\b(AL\/[A-Za-z]{2,3}-[A-Za-z0-9]{1,6}|[A-Za-z]{2,3}-\d{1,5}|RP\d{3,5})\b/gi,
    (_, code: string) => `*${code.toUpperCase()}*`
  );

  // Bold "CIV CIPP"
  text = text.replace(/\b(CIV\s+CIPP)\b/gi, '*CIV CIPP*');

  return text;
}

/** Generates the exact WhatsApp message text */
export function generateWhatsAppReport(dateISO: string, eqs: EquipmentEntry[]): string {
  const lines: string[] = [
    '*U&M – RELATÓRIO DE MANUTENÇÃO DOS EQUIPAMENTOS RODOVIÁRIOS.* 🚛🚚',
    `*DATA:* ${formatDateBR(dateISO) || formatDateBR(getTodayISO())}`,
  ];

  const validEqs = eqs.filter((eq) => eq.code.trim().length > 0);

  for (const eq of validEqs) {
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(`*${eq.code.trim().toUpperCase()}*`);

    for (const item of eq.items) {
      const formatted = formatServiceForReport(item);
      if (formatted) {
        lines.push(`🔧 ${formatted}`);
      }
    }

    lines.push('');
    const dueLabel = eq.due ? formatShortDateBR(eq.due) : 'a definir';
    lines.push(`*PREVISÃO DE LIBERAÇÃO:* ${dueLabel}`);
  }

  return lines.join('\n');
}

export interface ParsedReportResult {
  date: string | null;
  eqs: EquipmentEntry[];
  newCodes: string[];
  newServices: string[];
}

/** Parses a pasted WhatsApp maintenance report back into structured state */
export function parsePastedReport(
  rawText: string,
  existingCatEq: string[],
  existingCatSv: string[]
): ParsedReportResult {
  const rawLines = rawText.replace(/\r\n/g, '\n').split('\n');
  let parsedDate: string | null = null;
  const parsedEqs: EquipmentEntry[] = [];
  let currentEq: EquipmentEntry | null = null;
  let expectingDueDate = false;

  const knownEqSet = new Set(existingCatEq.map((c) => c.toUpperCase()));
  const newCodesSet = new Set<string>();

  const knownSvNorm = new Set(existingCatSv.map((s) => normalizeSearch(s)));
  const newServices: string[] = [];

  const registerCodeIfNew = (code: string) => {
    const upper = code.toUpperCase();
    if (!knownEqSet.has(upper)) {
      knownEqSet.add(upper);
      newCodesSet.add(upper);
    }
  };

  for (const rawLine of rawLines) {
    // Ignore asterisks and leading/trailing whitespace
    const clean = rawLine.replace(/\*/g, '').trim();
    if (!clean) continue;

    // Separator closes current equipment
    if (/^[-–—]{2,}$/.test(clean)) {
      currentEq = null;
      expectingDueDate = false;
      continue;
    }

    // Report date line
    if (/^DATA\s*:/i.test(clean)) {
      const iso = parseBRDateToISO(clean);
      if (iso) parsedDate = iso;
      continue;
    }

    // Ignore report title line
    if (
      (/U&M/i.test(clean) && /RELAT[ÓO]RIO/i.test(clean)) ||
      /RELAT[ÓO]RIO\s+DE\s+MANUTEN[ÇC][ÃA]O/i.test(clean)
    ) {
      continue;
    }

    // Ignore greetings
    if (/^(BOM\s+DIA|BOA\s+TARDE|BOA\s+NOITE)\b/i.test(clean)) {
      continue;
    }

    // If previous line was "PREVISÃO DE LIBERAÇÃO:" without date on same line
    if (expectingDueDate && currentEq) {
      if (/^a\s+definir\.?$/i.test(clean)) {
        currentEq.due = '';
        expectingDueDate = false;
        continue;
      }
      const iso = parseBRDateToISO(clean);
      if (iso) {
        currentEq.due = iso;
        expectingDueDate = false;
        continue;
      }
      expectingDueDate = false;
    }

    // Release forecast line
    if (/PREVIS[ÃA]O\s+DE\s+LIBERA[ÇC][ÃA]O/i.test(clean)) {
      if (currentEq) {
        const iso = parseBRDateToISO(clean);
        if (iso) {
          currentEq.due = iso;
          expectingDueDate = false;
        } else if (/a\s+definir/i.test(clean)) {
          currentEq.due = '';
          expectingDueDate = false;
        } else {
          expectingDueDate = true;
        }
      }
      continue;
    }

    // Standalone equipment code line (e.g. "CD-111:", "AL/VL-2G02", "RP1004")
    const eqCodeMatch = clean.match(
      /^(AL\/[A-Za-z]{2,3}-[A-Za-z0-9]{1,6}|[A-Za-z]{2,3}-\d{1,5}|RP\d{3,5})\s*:?$/i
    );
    const cleanNoColon = clean.replace(/:$/, '').trim().toUpperCase();
    if (eqCodeMatch || knownEqSet.has(cleanNoColon)) {
      const code = eqCodeMatch ? eqCodeMatch[1].toUpperCase() : cleanNoColon;
      registerCodeIfNew(code);
      currentEq = {
        id: generateId(),
        code,
        items: [],
        due: '',
      };
      parsedEqs.push(currentEq);
      expectingDueDate = false;
      continue;
    }

    // Service line inside an equipment block
    if (currentEq) {
      const serviceText = clean
        .replace(/^[🔧🛠⚙️•\-–\s]+/u, '')
        .replace(/\.+$/, '')
        .trim();

      if (!serviceText) continue;

      currentEq.items.push(serviceText);

      // Register any equipment codes referenced inside services/vales
      const mentionedCodes = serviceText.match(
        /\b(?:AL\/[A-Za-z]{2,3}-[A-Za-z0-9]{1,6}|[A-Za-z]{2,3}-\d{1,5}|RP\d{3,5})\b/gi
      );
      if (mentionedCodes) {
        mentionedCodes.forEach(registerCodeIfNew);
      }

      // Register new non-vale services into the saved services catalog
      if (!isValeItem(serviceText)) {
        const norm = normalizeSearch(serviceText);
        if (norm && !knownSvNorm.has(norm)) {
          knownSvNorm.add(norm);
          newServices.push(serviceText);
        }
      }
    }
  }

  return {
    date: parsedDate,
    eqs: parsedEqs,
    newCodes: Array.from(newCodesSet),
    newServices,
  };
}
