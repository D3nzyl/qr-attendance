import { useState, useCallback, useRef, useEffect } from 'react';
import QRScanner from '../components/QRScanner.jsx';
import AttendanceTable from '../components/AttendanceTable.jsx';

const LOCATIONS = [
  'DE170', 'J102', 'J120', 'N111',
  'RM103A', 'RM103B', 'RM203', 'RM209A',
  'TR307', 'TR372', 'TR372-DRC', 'TR376',
  'Store', 'Others',
  'RM203 Workshop', 'TR372 Workshop', 'RM209 Workshop',
  'Jln Leban',
];

export default function ScanPage() {
  const [records, setRecords] = useState([]);
  const [signatures, setSignatures] = useState({});
  const [location, setLocation] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const handlerRef = useRef(null);

  const showToast = (message, type) => {
    clearTimeout(toastTimerRef.current);
    setToast({ message, type, key: Date.now() });
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  };

  handlerRef.current = (text) => {
    try {
      const data = JSON.parse(text);
      if (typeof data !== 'object' || Array.isArray(data) || data === null) {
        showToast('QR code data format not supported', 'error');
        return;
      }

      const isDuplicate = records.some(r => r._original === text);
      if (isDuplicate) {
        showToast('Already in attendance list', 'warning');
        return;
      }

      setRecords(prev => [
        ...prev,
        {
          id: Date.now(),
          scannedAt: new Date().toLocaleTimeString('en-SG', { hour12: false }),
          _original: text,
          ...data,
        },
      ]);
      showToast('Added to attendance', 'success');
    } catch {
      showToast('Invalid QR code — expected JSON', 'error');
    }
  };

  const onScan = useCallback((text) => handlerRef.current(text), []);

  const deleteRecord = (id) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    setSignatures(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const clearAll = () => {
    if (records.length === 0) return;
    if (window.confirm(`Remove all ${records.length} record(s)?`)) {
      setRecords([]);
      setSignatures({});
    }
  };

  const handleSign = (id, dataUrl) => {
    setSignatures(prev => ({ ...prev, [id]: dataUrl }));
  };

  const handleSubmit = () => {
    const params = new URLSearchParams(window.location.search);
    const callbackUrl = params.get('callbackUrl') || params.get('callback');

    if (!callbackUrl) {
      window.alert(
        'No callback URL found.\n\nAdd ?callbackUrl=YOUR_APP_URL to the address bar to enable submit.',
      );
      return;
    }

    const cleanRecords = records.map(({ id, _original, ...rest }) => ({
      ...rest,
      signature: signatures[id] || null,
    }));
    const payload = btoa(
      JSON.stringify({ location, records: cleanRecords, count: cleanRecords.length, submittedAt: new Date().toISOString() }),
    );

    const returnUrl = new URL(callbackUrl);
    returnUrl.searchParams.set('attendance', payload);
    window.location.href = returnUrl.toString();
  };

  const params = new URLSearchParams(window.location.search);
  const callbackUrl = params.get('callbackUrl') || params.get('callback');

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {!callbackUrl && (
        <div className="banner banner-warning">
          No callback URL detected. Add <code>?callbackUrl=YOUR_URL</code> to the address bar before submitting.
        </div>
      )}

      {toast && (
        <div className="toast-container" key={toast.key}>
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}

      <div className="card" style={{ padding: '14px 16px' }}>
        <div className="form-group">
          <label htmlFor="location-select">Location</label>
          <select
            id="location-select"
            value={location}
            onChange={e => setLocation(e.target.value)}
          >
            <option value="">— Select location —</option>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="card scanner-card">
        <div className="table-header">
          <span className="section-title">Scan QR Code</span>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <QRScanner onScan={onScan} readerId="qr-reader-main" />
        </div>
      </div>

      <div className="card">
        <div className="table-header">
          <span className="section-title">
            Attendance
            {records.length > 0 && <span className="badge">{records.length}</span>}
          </span>
          {records.length > 0 && (
            <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: '13px' }} onClick={clearAll}>
              Clear All
            </button>
          )}
        </div>
        <AttendanceTable records={records} signatures={signatures} onSign={handleSign} onDelete={deleteRecord} />
      </div>

      <div className="submit-area">
        <button
          className="btn btn-primary btn-submit"
          onClick={handleSubmit}
          disabled={records.length === 0}
        >
          Submit Attendance ({records.length})
        </button>
      </div>
    </div>
  );
}
