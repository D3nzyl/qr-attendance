// Shared domain types for the QR attendance app.

/**
 * An employee/attendance record. The dynamic string-keyed fields come from the
 * scanned QR JSON (e.g. "Name", "NRIC", "ID") or manual entry, so an index
 * signature is used alongside the well-known internal fields.
 */
export interface Employee {
  id: number;
  scannedAt: string;
  _original: string;
  temperature?: string;
  fit?: boolean;
  signature?: string | null;
  [key: string]: string | number | boolean | null | undefined;
}

/** A scanned attendance row on the Scan page. */
export interface AttendanceRecord {
  id: number;
  scannedAt: string;
  _original: string;
  [key: string]: string | number | boolean | null | undefined;
}

/** An uploaded image reference returned by the upload API. */
export interface ImageRef {
  id: string;
  name: string;
  url: string;
}

/** The persisted data for a single toolbox-meeting day. */
export interface DayData {
  workStart: string;
  workEnd: string;
  locations: string[];
  employees: Employee[];
  safetyTopicIds: number[];
  safetyTopicDescs: Record<number, string>;
  images: ImageRef[];
  conductedBy: string;
  signature: string;
  savedAt?: string;
  company?: string;
}

/** Full week payload returned by GET /api/week. */
export interface WeekData {
  company?: string;
  days: Record<string, Partial<DayData>>;
}

/** A single field row in the QR generator. */
export interface QRField {
  id: number;
  label: string;
  value: string;
}

export type ToastType = 'success' | 'error' | 'warning';

export interface Toast {
  message: string;
  type: ToastType;
  key: number;
}
