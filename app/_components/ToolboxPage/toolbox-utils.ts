/** A dropdown choice — `value` is stored, `label` is shown. */
export interface Option {
  value: string;
  label: string;
}

export const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
export const COMPANIES = ["GIM TIAN CIVIL ENGINEERING PTE LTD", "Other"];

export function getMondayOf(date: Date | number | string): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

export function weekKey(monday: Date): string {
  return monday.toISOString().slice(0, 10);
}

export function dayDate(monday: Date, idx: number): Date {
  const d = new Date(monday);
  d.setDate(d.getDate() + idx);
  return d;
}
