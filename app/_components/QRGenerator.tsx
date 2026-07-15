import { useState } from 'react';
import QRCode from 'qrcode';
import type { QRField } from '../types';

const PRESETS = ['Company', 'Department', 'Phone', 'WP No'];

let idCounter = 0;
const uid = () => ++idCounter;

const defaultFields = (): QRField[] => [
  { id: uid(), label: 'Name', value: '' },
  { id: uid(), label: 'NRIC', value: '' },
  { id: uid(), label: 'ID', value: '' },
];

export default function QRGenerator() {
  const [fields, setFields] = useState<QRField[]>(defaultFields);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrData, setQrData] = useState<Record<string, string> | null>(null);

  const usedLabels = new Set(fields.map(f => f.label.trim()));

  const addField = (label = '') => {
    setFields(prev => [...prev, { id: uid(), label, value: '' }]);
    setQrDataUrl('');
  };

  const removeField = (id: number) => {
    setFields(prev => prev.filter(f => f.id !== id));
    setQrDataUrl('');
  };

  const updateField = (id: number, key: 'label' | 'value', val: string) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f));
    setQrDataUrl('');
  };

  const generate = async () => {
    const data: Record<string, string> = {};
    fields.forEach(({ label, value }) => {
      if (label.trim()) data[label.trim()] = value.trim();
    });
    if (Object.keys(data).length === 0) return;

    const url = await QRCode.toDataURL(JSON.stringify(data), {
      width: 320,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    });
    setQrDataUrl(url);
    setQrData(data);
  };

  const download = () => {
    const name = fields.find(f => f.label.toLowerCase() === 'name')?.value || 'qrcode';
    const link = document.createElement('a');
    link.download = `${name.replace(/\s+/g, '_')}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const reset = () => {
    setFields(defaultFields());
    setQrDataUrl('');
    setQrData(null);
  };

  const hasData = fields.some(f => f.label.trim());

  return (
    <div className="generator-wrap">
      <div className="card generator-card">
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="section-title">QR Code Fields</span>
            <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: '13px' }} onClick={reset}>
              Reset
            </button>
          </div>

          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Quick add:</p>
            <div className="presets-row">
              {PRESETS.map(preset => (
                <button
                  key={preset}
                  className={`preset-chip${usedLabels.has(preset) ? ' used' : ''}`}
                  onClick={() => !usedLabels.has(preset) && addField(preset)}
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', paddingBottom: '4px' }}>
            <span style={{ flex: '0.9', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', paddingLeft: '4px' }}>
              Field Name
            </span>
            <span style={{ flex: '1.1', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', paddingLeft: '4px' }}>
              Value
            </span>
            <span style={{ width: '32px' }} />
          </div>

          <div className="fields-list">
            {fields.map(field => (
              <div key={field.id} className="field-row">
                <input
                  className="field-label-input"
                  placeholder="e.g. Name"
                  value={field.label}
                  onChange={e => updateField(field.id, 'label', e.target.value)}
                />
                <input
                  className="field-value-input"
                  placeholder="Value"
                  value={field.value}
                  onChange={e => updateField(field.id, 'value', e.target.value)}
                />
                <button className="btn-icon" onClick={() => removeField(field.id)} title="Remove field">
                  &#10005;
                </button>
              </div>
            ))}
          </div>

          <button className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: '13px' }} onClick={() => addField()}>
            + Add field
          </button>

          <div className="generator-actions">
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={generate}
              disabled={!hasData}
            >
              Generate QR Code
            </button>
          </div>
        </div>
      </div>

      {qrDataUrl && qrData && (
        <div className="card qr-preview-card">
          <div className="card-body">
            <div className="qr-image-wrap">
              <img src={qrDataUrl} alt="Generated QR Code" />
            </div>

            <div className="qr-data-summary">
              {Object.entries(qrData).map(([label, value]) => (
                <div key={label} className="qr-data-row">
                  <span className="qr-data-label">{label}</span>
                  <span className="qr-data-value">{value || <em style={{ color: '#94a3b8' }}>(empty)</em>}</span>
                </div>
              ))}
            </div>

            <div className="preview-actions">
              <button className="btn btn-success" onClick={download}>
                Download PNG
              </button>
              <button className="btn btn-ghost" onClick={() => window.print()}>
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
