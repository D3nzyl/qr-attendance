import { useState, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import QRScanner from './QRScanner.jsx';
import ImageLightbox from './ImageLightbox.jsx';
import { api } from '../lib/api.js';

async function reverseGeocode(lat, lon) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
    { headers: { 'Accept-Language': 'en' } },
  );
  const data = await res.json();
  return data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

const INTERNAL = new Set(['id', '_original', 'scannedAt', 'signature', 'temperature', 'fit']);

function getEmpCols(employees) {
  const seen = new Set();
  employees.forEach(e => Object.keys(e).forEach(k => { if (!INTERNAL.has(k)) seen.add(k); }));
  return [...seen];
}

async function compressForUpload(file) {
  return imageCompression(file, {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/jpeg',
  });
}

const SAFETY_TOPICS = [
  { id: 1,  label: 'Working at Height' },
  { id: 2,  label: 'Lifting Operation' },
  { id: 3,  label: 'Hot Work Safety' },
  { id: 4,  label: 'Traffic Control & Road Safety' },
  { id: 5,  label: 'Confined Spaces Safety' },
  { id: 6,  label: 'Tools and Equipment' },
  { id: 7,  label: 'Excavation Works' },
  { id: 8,  label: 'Fall Arrest System' },
  { id: 9,  label: 'PPE Safety' },
  { id: 10, label: 'Storage of Materials' },
  { id: 11, label: 'Material Handling' },
  { id: 12, label: 'Noise Control' },
  { id: 13, label: 'Housekeeping' },
  { id: 14, label: 'Fire Protection' },
  { id: 15, label: 'Covid 19 SMM' },
  { id: 16, label: 'Infectious Diseases' },
  { id: 17, label: 'Accident / Incident Reporting' },
  { id: 18, label: 'Ladders Safety' },
  { id: 19, label: 'Electrical Safety' },
  { id: 20, label: 'Lock-Out / Tag Out (LOTO)' },
  { id: 21, label: 'Machine Operating' },
  { id: 22, label: 'Ergonomics' },
  { id: 23, label: 'Hearing Conservation' },
  { id: 24, label: 'Fire Extinguisher' },
  { id: 25, label: 'Method Statement' },
  { id: 26, label: 'Risk Assessment' },
  { id: 27, label: 'Safe Work Procedure' },
  { id: 28, label: 'Weather Condition' },
  { id: 29, label: 'Fatigue At Work' },
  { id: 30, label: 'Falling Object' },
  { id: 31, label: 'Struck By Object' },
  { id: 32, label: 'Falling From Height' },
  { id: 33, label: 'Hazard Identification' },
  { id: 34, label: 'Slips Trips and Falls' },
  { id: 35, label: 'Driving at Work' },
  { id: 36, label: 'Occupational Health & Safety' },
  { id: 37, label: 'Behavioural Based Safety' },
  { id: 38, label: 'Environmental Health & Safety' },
  { id: 39, label: 'Others (specify in brief)' },
];

const blank = () => ({
  workStart: '',
  workEnd: '',
  locations: [],
  employees: [],
  safetyTopicIds: [],
  safetyTopicDescs: {},
  images: [],
  conductedBy: '',
  signature: '',
});

function SafetyTopicPicker({ selected, onToggle }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = SAFETY_TOPICS.filter(t =>
    t.label.toLowerCase().includes(search.toLowerCase()) ||
    String(t.id).startsWith(search)
  );

  return (
    <div className="safety-combo-wrap" ref={wrapRef}>
      <div className="safety-combo-box" onClick={() => setOpen(true)}>
        {[...selected].sort((a, b) => a - b).map(id => {
          const t = SAFETY_TOPICS.find(x => x.id === id);
          return (
            <span key={id} className="safety-chip">
              <span>{t.id}. {t.label}</span>
              <button
                type="button"
                onMouseDown={e => { e.stopPropagation(); onToggle(id, false); }}
                aria-label="Remove"
              >&#10005;</button>
            </span>
          );
        })}
        <input
          className="safety-combo-input"
          placeholder={selected.length === 0 ? 'Search topics to add (min. 2)…' : 'Add more…'}
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && (
        <div className="safety-combo-dropdown">
          {filtered.length === 0
            ? <div className="safety-combo-empty">No topics found</div>
            : filtered.map(t => {
                const isSel = selected.includes(t.id);
                return (
                  <div
                    key={t.id}
                    className={`safety-combo-option${isSel ? ' selected' : ''}`}
                    onMouseDown={e => {
                      e.preventDefault();
                      onToggle(t.id, !isSel);
                      setSearch('');
                    }}
                  >
                    <span className="safety-topic-num">{t.id}</span>
                    <span style={{ flex: 1 }}>{t.label}</span>
                    {isSel && <span className="safety-combo-check">&#10003;</span>}
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}

function EmpSignatureCell({ emp, onChange, invalid }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const restored = useRef(false);

  useEffect(() => {
    if (!emp.signature || restored.current) return;
    restored.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = emp.signature;
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current;
    const { x, y } = getPos(e, canvas);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    onChange(canvas.toDataURL());
  };

  const end = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return (
    <div className={`emp-sig-wrap${invalid ? ' emp-sig-invalid' : ''}`}>
      <canvas
        ref={canvasRef}
        className="emp-sig-canvas"
        width={800}
        height={160}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="emp-sig-footer">
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sign above</span>
        <button
          className="btn btn-ghost"
          style={{ fontSize: 11, padding: '2px 8px' }}
          onClick={clear}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default function DayForm({ dayKey, date, initial, onSave, onClear, contract, teamNo, weekKey }) {
  const [form, setForm] = useState(() => {
    const base = initial ? { ...blank(), ...initial } : blank();
    if (typeof base.locations === 'string') {
      base.locations = base.locations ? [base.locations] : [];
    }
    return base;
  });
  const [scanning, setScanning] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualEmp, setManualEmp] = useState({ nric: '', id: '', name: '' });
  const [dirty, setDirty] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [invalidFields, setInvalidFields] = useState(new Set());
  const [viewImage, setViewImage] = useState(null);
  const formRef = useRef(null);

  const getGpsLocation = (targetIdx) => {
    if (!navigator.geolocation) { alert('Geolocation not supported by this browser.'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const addr = await reverseGeocode(latitude, longitude);
          setForm(prev => {
            const locs = prev.locations.length > 0 ? [...prev.locations] : [''];
            locs[targetIdx] = addr;
            return { ...prev, locations: locs };
          });
          setDirty(true);
        } catch {
          setForm(prev => {
            const locs = prev.locations.length > 0 ? [...prev.locations] : [''];
            locs[targetIdx] = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            return { ...prev, locations: locs };
          });
          setDirty(true);
        }
        setLocLoading(false);
      },
      (err) => { setLocLoading(false); alert('Could not get location: ' + err.message); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  const lastScanRef = useRef({ text: '', time: 0 });
  const handlerRef = useRef(null);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  handlerRef.current = (text) => {
    const now = Date.now();
    if (text === lastScanRef.current.text && now - lastScanRef.current.time < 2000) return;
    lastScanRef.current = { text, time: now };
    try {
      const data = JSON.parse(text);
      if (typeof data !== 'object' || Array.isArray(data) || !data) return;
      if (form.employees.some(e => e._original === text)) return;
      setForm(prev => ({
        ...prev,
        employees: [...prev.employees, {
          id: Date.now(),
          scannedAt: new Date().toLocaleTimeString('en-SG', { hour12: false }),
          _original: text,
          ...data,
        }],
      }));
      setDirty(true);
    } catch { /* non-JSON QR ignored */ }
  };

  const onScan = (text) => handlerRef.current(text);

  const removeEmployee = (id) => set('employees', form.employees.filter(e => e.id !== id));

  const submitManual = () => {
    if (!manualEmp.name && !manualEmp.nric) return;
    const key = manualEmp.nric || `manual-${manualEmp.name}`;
    if (form.employees.some(e => e._original === key)) return;
    setForm(prev => ({
      ...prev,
      employees: [...prev.employees, {
        id: Date.now(),
        scannedAt: new Date().toLocaleTimeString('en-SG', { hour12: false }),
        _original: key,
        Name: manualEmp.name,
        NRIC: manualEmp.nric,
        ID: manualEmp.id,
      }],
    }));
    setManualEmp({ nric: '', id: '', name: '' });
    setShowManual(false);
    setDirty(true);
  };

  const updateEmpField = (id, field, value) => {
    setForm(prev => ({
      ...prev,
      employees: prev.employees.map(e => e.id === id ? { ...e, [field]: value } : e),
    }));
    setDirty(true);
  };

  const updateEmpTemp = (id, tempStr) => {
    const temp = parseFloat(tempStr);
    const tooHot = !isNaN(temp) && temp > 37.6;
    setForm(prev => ({
      ...prev,
      employees: prev.employees.map(e => e.id === id
        ? { ...e, temperature: tempStr, fit: tooHot ? false : e.fit }
        : e),
    }));
    setDirty(true);
  };

  const setEmpSignature = (id, dataUrl) => {
    setForm(prev => ({
      ...prev,
      employees: prev.employees.map(e => e.id === id ? { ...e, signature: dataUrl } : e),
    }));
    setDirty(true);
  };

  const toggleSafetyTopic = (id, checked) => {
    setForm(prev => {
      const ids = checked
        ? [...prev.safetyTopicIds, id]
        : prev.safetyTopicIds.filter(x => x !== id);
      const descs = { ...prev.safetyTopicDescs };
      if (!checked) delete descs[id];
      return { ...prev, safetyTopicIds: ids, safetyTopicDescs: descs };
    });
    setDirty(true);
  };

  const setSafetyDesc = (id, text) => {
    setForm(prev => ({
      ...prev,
      safetyTopicDescs: { ...prev.safetyTopicDescs, [id]: text },
    }));
    setDirty(true);
  };

  const [imgUploading, setImgUploading] = useState(false);

  const handleImages = async (e) => {
    if (form.images.length >= 5) return;
    const files = [...e.target.files].slice(0, 5 - form.images.length);
    e.target.value = '';
    setImgUploading(true);
    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const compressed = await compressForUpload(file);
          return api.uploadImage(contract, teamNo, weekKey, dayKey, compressed);
        })
      );
      setForm(prev => ({ ...prev, images: [...prev.images, ...results] }));
      setDirty(true);
    } catch (err) {
      alert('Image upload failed: ' + err.message);
    } finally {
      setImgUploading(false);
    }
  };

  const removeImage = async (id) => {
    try { await api.deleteImage(id); } catch { /* ignore if already gone */ }
    set('images', form.images.filter(i => i.id !== id));
  };

  const getEmpLabel = (emp) => {
    const nameKey = Object.keys(emp).find(k => /name/i.test(k) && !INTERNAL.has(k));
    return (nameKey && emp[nameKey]) || Object.entries(emp).find(([k]) => /nric|wp/i.test(k))?.[1] || 'Employee';
  };

  const validate = () => {
    const errors = [];
    const fields = new Set();

    if (form.safetyTopicIds.length < 2) {
      errors.push('Select at least 2 safety subjects.');
      fields.add('topics');
    } else {
      const noDesc = form.safetyTopicIds.filter(id => !form.safetyTopicDescs[id]?.trim());
      if (noDesc.length > 0) {
        errors.push(`Write a brief for topic(s): ${noDesc.join(', ')}.`);
        noDesc.forEach(id => fields.add(`topic-desc-${id}`));
      }
    }

    if (form.employees.length === 0) {
      errors.push('No employees recorded — add at least one.');
      fields.add('employees');
    } else {
      form.employees.forEach(emp => {
        const label = getEmpLabel(emp);
        const temp = parseFloat(emp.temperature);
        const hastemp = emp.temperature !== undefined && emp.temperature !== '';
        const tooHot = hastemp && !isNaN(temp) && temp > 37.6;
        if (!hastemp) { errors.push(`${label}: temperature not entered.`); fields.add(`emp-temp-${emp.id}`); }
        if (hastemp && !tooHot && !emp.fit) { errors.push(`${label}: not marked Fit for Work.`); fields.add(`emp-fit-${emp.id}`); }
        if (!emp.signature) { errors.push(`${label}: signature missing.`); fields.add(`emp-sig-${emp.id}`); }
      });
    }

    if (!form.conductedBy?.trim()) { errors.push('Conducted By is required.'); fields.add('conductedBy'); }
    if (!form.signature) { errors.push('Supervisor signature is required.'); fields.add('supervisorSig'); }

    return { errors, fields };
  };

  const save = () => {
    const { errors, fields } = validate();
    if (errors.length > 0) {
      setInvalidFields(fields);
      // Scroll to first invalid field
      setTimeout(() => {
        const el = formRef.current?.querySelector('[data-invalid="true"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    setInvalidFields(new Set());
    onSave({ ...form, savedAt: new Date().toISOString() });
    setDirty(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const dateStr = date.toLocaleDateString('en-SG', {
    weekday: 'long', day: '2-digit', month: 'short', year: '2-digit',
  });

  const empCols = getEmpCols(form.employees);

  return (
    <div className="card day-form-card">
      <div className="day-form-header">
        <div>
          <span className="day-form-day-label">{dayKey}</span>
          <span className="day-form-date">{dateStr}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => {
            if (window.confirm('Clear all data for this day?')) {
              setForm(blank());
              setDirty(false);
              onClear();
            }
          }}>
            Clear
          </button>
          <button
            className={`btn ${savedFlash ? 'btn-success' : dirty ? 'btn-primary' : 'btn-ghost'}`}
            onClick={save}
          >
            {savedFlash ? 'Saved ✓' : 'Save Day'}
          </button>
        </div>
      </div>

      <div className="day-form-body" ref={formRef}>

        {/* Work Start / End — always side by side */}
        <div className="form-row-2">
          <div className="form-group">
            <label>Work Start</label>
            <input type="time" value={form.workStart} onChange={e => set('workStart', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Work End</label>
            <input type="time" value={form.workEnd} onChange={e => set('workEnd', e.target.value)} />
          </div>
        </div>

        {/* Locations */}
        <div className="form-group">
          <label>Location(s)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(form.locations.length > 0 ? form.locations : ['']).map((loc, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    placeholder={`Location ${idx + 1}...`}
                    value={loc}
                    onChange={e => {
                      const locs = form.locations.length > 0 ? [...form.locations] : [''];
                      locs[idx] = e.target.value;
                      set('locations', locs);
                    }}
                    style={{ flex: 1, paddingRight: 72, width: '100%' }}
                  />
                  <button
                    className="btn btn-ghost"
                    style={{ position: 'absolute', right: 4, fontSize: 12, padding: '2px 8px', height: 28, flexShrink: 0 }}
                    onClick={() => getGpsLocation(idx)}
                    disabled={locLoading}
                  >
                    {locLoading ? '…' : 'GPS'}
                  </button>
                </div>
                {(form.locations.length > 1) && (
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 13, flexShrink: 0, padding: '0 10px' }}
                    onClick={() => set('locations', form.locations.filter((_, i) => i !== idx))}
                  >✕</button>
                )}
              </div>
            ))}
            <button
              className="btn btn-ghost"
              style={{ fontSize: 13, alignSelf: 'flex-start' }}
              onClick={() => set('locations', [...(form.locations.length ? form.locations : ['']), ''])}
            >
              + Add Location
            </button>
          </div>
        </div>

        {/* Employees */}
        <div
          className="form-group"
          data-field="employees"
          data-invalid={invalidFields.has('employees') ? 'true' : undefined}
        >
          <label style={{ color: invalidFields.has('employees') ? 'var(--danger)' : undefined }}>
            Employee — Safety &amp; Health Declaration
            {invalidFields.has('employees') && <span style={{ fontSize: 12, marginLeft: 6 }}>⚠ Required</span>}
          </label>
          <div className="employee-section">
            <div className="employee-actions-row">
              {!scanning && (
                <button
                  className="btn btn-primary"
                  style={{ fontSize: 13 }}
                  onClick={() => { setScanning(true); setShowManual(false); }}
                >
                  + Scan QR
                </button>
              )}
              <button
                className="btn btn-ghost"
                style={{ fontSize: 13 }}
                onClick={() => { setShowManual(v => !v); setScanning(false); }}
              >
                {showManual ? '✕ Cancel' : '+ Add Manually'}
              </button>
              {form.employees.length > 0 && (
                <span className="badge">{form.employees.length}</span>
              )}
            </div>

            {scanning && (
              <div className="employee-scanner">
                <QRScanner
                  onScan={onScan}
                  readerId={`qr-reader-day-${dayKey}`}
                  autoStart
                  onClose={() => setScanning(false)}
                />
              </div>
            )}

            {showManual && (
              <div className="manual-add-form">
                <div className="form-group">
                  <label>NRIC / WP No.</label>
                  <input
                    placeholder="S1234567A"
                    value={manualEmp.nric}
                    onChange={e => setManualEmp(p => ({ ...p, nric: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>ID</label>
                  <input
                    placeholder="EMP001"
                    value={manualEmp.id}
                    onChange={e => setManualEmp(p => ({ ...p, id: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    placeholder="Full name"
                    value={manualEmp.name}
                    onChange={e => setManualEmp(p => ({ ...p, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && submitManual()}
                  />
                </div>
                <button
                  className="btn btn-primary manual-add-btn"
                  style={{ fontSize: 13 }}
                  onClick={submitManual}
                  disabled={!manualEmp.name && !manualEmp.nric}
                >
                  Add Employee
                </button>
              </div>
            )}

            {form.employees.length > 0 && (
              <div className="emp-cards">
                {form.employees.map((emp, i) => {
                  const tempVal = parseFloat(emp.temperature);
                  const tooHot = !isNaN(tempVal) && tempVal > 37.6;
                  return (
                    <div
                      key={emp.id}
                      className={`emp-card${(invalidFields.has(`emp-temp-${emp.id}`) || invalidFields.has(`emp-fit-${emp.id}`) || invalidFields.has(`emp-sig-${emp.id}`)) ? ' emp-card-invalid' : ''}`}
                      data-invalid={(invalidFields.has(`emp-temp-${emp.id}`) || invalidFields.has(`emp-fit-${emp.id}`) || invalidFields.has(`emp-sig-${emp.id}`)) ? 'true' : undefined}
                    >
                      <div className="emp-card-header">
                        <span className="emp-card-num">#{i + 1}</span>
                        <div className="emp-card-info">
                          {/* Fixed display order: NRIC → ID → Name → other cols */}
                          {['nric', 'NRIC/WP No.', 'ID', 'name', 'Name'].filter(c => emp[c] != null).map(c => (
                            <span key={c} className="emp-card-chip">
                              <span className="emp-chip-label">{c}:</span> {emp[c] ?? '—'}
                            </span>
                          ))}
                          {empCols.filter(c => !['nric','NRIC/WP No.','ID','name','Name'].includes(c)).map(c => (
                            <span key={c} className="emp-card-chip">
                              <span className="emp-chip-label">{c}:</span> {emp[c] ?? '—'}
                            </span>
                          ))}
                        </div>
                        <span className="emp-card-time">{emp.scannedAt}</span>
                        <button className="btn-icon" onClick={() => removeEmployee(emp.id)}>&#10005;</button>
                      </div>

                      <div className="emp-card-body">
                        <div className="emp-health-row">
                          <div
                            className="form-group"
                            style={{ flex: '0 0 auto' }}
                            data-invalid={invalidFields.has(`emp-temp-${emp.id}`) ? 'true' : undefined}
                          >
                            <label style={{ color: invalidFields.has(`emp-temp-${emp.id}`) ? 'var(--danger)' : undefined }}>
                              Temp (°C){invalidFields.has(`emp-temp-${emp.id}`) && ' ⚠'}
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="35"
                              max="42"
                              className={`emp-temp-input${invalidFields.has(`emp-temp-${emp.id}`) ? ' input-invalid' : ''}`}
                              placeholder=""
                              value={emp.temperature ?? ''}
                              onChange={e => updateEmpTemp(emp.id, e.target.value)}
                            />
                          </div>
                          <div
                            className={`fit-check-wrap${invalidFields.has(`emp-fit-${emp.id}`) ? ' fit-invalid' : ''}`}
                            data-invalid={invalidFields.has(`emp-fit-${emp.id}`) ? 'true' : undefined}
                          >
                            {tooHot
                              ? <>
                                  <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 18, lineHeight: 1 }}>✗</span>
                                  <span style={{ color: 'var(--danger)', fontWeight: 500, marginLeft: 6 }}>Fit for Work</span>
                                </>
                              : <>
                                  <input
                                    type="checkbox"
                                    id={`fit-${emp.id}`}
                                    checked={!!emp.fit}
                                    onChange={e => updateEmpField(emp.id, 'fit', e.target.checked)}
                                  />
                                  <label
                                    htmlFor={`fit-${emp.id}`}
                                    style={{ color: invalidFields.has(`emp-fit-${emp.id}`) ? 'var(--danger)' : 'inherit', fontWeight: 500 }}
                                  >
                                    Fit for Work
                                  </label>
                                </>
                            }
                          </div>
                        </div>

                        <div
                          className="form-group"
                          data-invalid={invalidFields.has(`emp-sig-${emp.id}`) ? 'true' : undefined}
                        >
                          <label style={{ color: invalidFields.has(`emp-sig-${emp.id}`) ? 'var(--danger)' : undefined }}>
                            Signature{invalidFields.has(`emp-sig-${emp.id}`) && ' ⚠'}
                          </label>
                          <EmpSignatureCell
                            emp={emp}
                            onChange={val => setEmpSignature(emp.id, val)}
                            invalid={invalidFields.has(`emp-sig-${emp.id}`)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Desktop table view */}
            {form.employees.length > 0 && (
              <div className="emp-desktop-table-wrap">
                <table className="emp-desktop-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>NRIC / WP No.</th>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Temp (°C)</th>
                      <th>Fit for Work</th>
                      <th>Signature</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.employees.map((emp, i) => {
                      const tempVal = parseFloat(emp.temperature);
                      const tooHot = !isNaN(tempVal) && tempVal > 37.6;
                      const rowInvalid = invalidFields.has(`emp-temp-${emp.id}`) || invalidFields.has(`emp-fit-${emp.id}`) || invalidFields.has(`emp-sig-${emp.id}`);
                      const name = emp.name || emp.Name || '—';
                      const nric = emp.nric || emp['NRIC/WP No.'] || emp.NRIC || '—';
                      const empId = emp.empId || emp.ID || emp.id || '—';
                      return (
                        <tr key={emp.id} className={rowInvalid ? 'emp-row-invalid' : ''} data-invalid={rowInvalid ? 'true' : undefined}>
                          <td style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{i + 1}</td>
                          <td style={{ fontSize: 13 }}>{nric}</td>
                          <td style={{ fontSize: 13 }}>{empId}</td>
                          <td style={{ fontWeight: 500 }}>{name}</td>
                          <td className="emp-temp-cell">
                            <input
                              type="number" step="0.1" min="35" max="42"
                              className={invalidFields.has(`emp-temp-${emp.id}`) ? 'input-invalid' : ''}
                              value={emp.temperature ?? ''}
                              onChange={e => updateEmpTemp(emp.id, e.target.value)}
                            />
                          </td>
                          <td className="emp-fit-cell">
                            {tooHot
                              ? <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 18 }}>✗</span>
                              : <input
                                  type="checkbox"
                                  checked={!!emp.fit}
                                  onChange={e => updateEmpField(emp.id, 'fit', e.target.checked)}
                                />
                            }
                          </td>
                          <td>
                            <EmpSignatureCell
                              emp={emp}
                              onChange={val => setEmpSignature(emp.id, val)}
                              invalid={invalidFields.has(`emp-sig-${emp.id}`)}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn-icon" onClick={() => removeEmployee(emp.id)}>&#10005;</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {form.employees.length === 0 && !scanning && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>
                No employees recorded. Tap "+ Scan Employee QR" to add.
              </p>
            )}
          </div>
        </div>

        {/* Safety Subjects */}
        <div
          className="form-group"
          data-field="topics"
          data-invalid={invalidFields.has('topics') ? 'true' : undefined}
        >
          <label style={{ color: invalidFields.has('topics') ? 'var(--danger)' : undefined }}>
            Safety Subjects Discussed
            {form.safetyTopicIds.length > 0 ? (
              <span style={{
                marginLeft: 8, fontSize: 12, fontWeight: 400,
                color: form.safetyTopicIds.length >= 2 ? 'var(--success)' : 'var(--danger)',
              }}>
                {form.safetyTopicIds.length} selected
                {form.safetyTopicIds.length < 2 ? ' (min. 2 required)' : ' ✓'}
              </span>
            ) : invalidFields.has('topics') ? (
              <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: 'var(--danger)' }}>
                ⚠ min. 2 required
              </span>
            ) : null}
          </label>
          <SafetyTopicPicker
            selected={form.safetyTopicIds}
            onToggle={(id, checked) => toggleSafetyTopic(id, checked)}
            invalid={invalidFields.has('topics')}
          />

          {form.safetyTopicIds.length > 0 && (
            <div className="safety-descs">
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Write a brief for each selected topic (min. 2 topics, approx. 10–15 min discussion):
              </p>
              {[...form.safetyTopicIds].sort((a, b) => a - b).map(id => {
                const topic = SAFETY_TOPICS.find(t => t.id === id);
                const descInvalid = invalidFields.has(`topic-desc-${id}`);
                return (
                  <div
                    key={id}
                    className="form-group"
                    data-invalid={descInvalid ? 'true' : undefined}
                  >
                    <label style={{ color: descInvalid ? 'var(--danger)' : undefined }}>
                      {topic.id}. {topic.label}{descInvalid && ' ⚠'}
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describe what was discussed..."
                      className={descInvalid ? 'input-invalid' : ''}
                      value={form.safetyTopicDescs[id] || ''}
                      onChange={e => setSafetyDesc(id, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Images */}
        <div className="form-group">
          <label>Relevant Images {form.images.length > 0 && `(${form.images.length}/5)`}</label>
          {form.images.length < 5 && (
            <label className="image-upload-btn" style={{ opacity: imgUploading ? 0.6 : 1, pointerEvents: imgUploading ? 'none' : undefined }}>
              {imgUploading ? 'Uploading…' : '+ Upload Images'}
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImages} disabled={imgUploading} />
            </label>
          )}
          {form.images.length > 0 && (
            <div className="image-grid">
              {form.images.map(img => (
                <div key={img.id} className="image-thumb" onClick={() => setViewImage(img)}>
                  <img src={img.url} alt={img.name} />
                  <button className="image-remove" onClick={e => { e.stopPropagation(); removeImage(img.id); }}>&#10005;</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conducted By */}
        <div
          className="form-group"
          data-invalid={invalidFields.has('conductedBy') ? 'true' : undefined}
        >
          <label style={{ color: invalidFields.has('conductedBy') ? 'var(--danger)' : undefined }}>
            Conducted By{invalidFields.has('conductedBy') && ' ⚠'}
          </label>
          <input
            placeholder="Supervisor / toolbox leader name..."
            className={invalidFields.has('conductedBy') ? 'input-invalid' : ''}
            value={form.conductedBy}
            onChange={e => set('conductedBy', e.target.value)}
          />
        </div>

        {/* Supervisor Signature */}
        <div
          className="form-group"
          data-invalid={invalidFields.has('supervisorSig') ? 'true' : undefined}
        >
          <label style={{ color: invalidFields.has('supervisorSig') ? 'var(--danger)' : undefined }}>
            Supervisor Signature{invalidFields.has('supervisorSig') && ' ⚠'}
          </label>
          <SignaturePad
            value={form.signature}
            onChange={val => set('signature', val)}
            invalid={invalidFields.has('supervisorSig')}
          />
        </div>

        {/* Bottom save */}
        <button
          className={`btn ${savedFlash ? 'btn-success' : 'btn-primary'} btn-submit`}
          onClick={save}
        >
          {savedFlash ? 'Saved ✓' : `Save ${dayKey} Record`}
        </button>
      </div>

      {/* Image lightbox */}
      {viewImage && (
        <ImageLightbox
          src={viewImage.url}
          name={viewImage.name}
          label={viewImage.name || 'Image'}
          onClose={() => setViewImage(null)}
        />
      )}
    </div>
  );
}

function SignaturePad({ value, onChange, invalid }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const restored = useRef(false);

  useEffect(() => {
    if (!value || restored.current) return;
    restored.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => {
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = value;
  }, []);

  const getPos = (canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches?.[0] ?? e;
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    const { x, y } = getPos(canvasRef.current, e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b';
    const { x, y } = getPos(canvas, e);
    ctx.lineTo(x, y);
    ctx.stroke();
    onChange(canvas.toDataURL());
  };

  const endDraw = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className={`signature-pad-wrap${invalid ? ' sig-pad-invalid' : ''}`}>
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="signature-canvas"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className="signature-pad-footer">
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sign above</span>
        <button className="btn btn-ghost" style={{ fontSize: 12, padding: '3px 10px' }} onClick={clear}>
          Clear
        </button>
      </div>
    </div>
  );
}
