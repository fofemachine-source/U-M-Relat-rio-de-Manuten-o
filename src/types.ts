export interface EquipmentEntry {
  id: string;
  code: string;
  items: string[];
  due: string; // YYYY-MM-DD or ''
}

export interface ReportState {
  date: string; // YYYY-MM-DD
  eqs: EquipmentEntry[];
  catEq: string[];
  catSv: string[];
}

export interface EquipmentGroup {
  id: string;
  label: string;
  codes: string[];
}

export interface ConfirmModalConfig {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}
