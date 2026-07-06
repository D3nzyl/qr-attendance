import { useState } from 'react';
import ImageLightbox from './ImageLightbox';
import type { WeekData, Employee, ImageRef } from '../types';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const TOPIC_LABELS = [
  'Working at Height', 'Lifting Operation', 'Hot Work Safety',
  'Traffic Control & Road Safety', 'Confined Spaces Safety', 'Tools and Equipment',
  'Excavation Works', 'Fall Arrest System', 'PPE Safety', 'Storage of Materials',
  'Material Handling', 'Noise Control', 'Housekeeping', 'Fire Protection',
  'Covid 19 SMM', 'Infectious Diseases', 'Accident / Incident Reporting',
  'Ladders Safety', 'Electrical Safety', 'Lock-Out / Tag Out (LOTO)',
  'Machine Operating', 'Ergonomics', 'Hearing Conservation', 'Fire Extinguisher',
  'Method Statement', 'Risk Assessment', 'Safe Work Procedure', 'Weather Condition',
  'Fatigue At Work', 'Falling Object', 'Struck By Object', 'Falling From Height',
  'Hazard Identification', 'Slips Trips and Falls', 'Driving at Work',
  'Occupational Health & Safety', 'Behavioural Based Safety',
  'Environmental Health & Safety', 'Others (specify in brief)',
];

// Field normalisation helpers — handles any case variation from QR or manual entry
const getNric = (emp: Employee): string => {
  const k = Object.keys(emp).find(k => /nric|wp/i.test(k));
  return k ? String(emp[k] || '') : '';
};
const getEmpId = (emp: Employee): string => {
  const k = Object.keys(emp).find(k => /^id$/i.test(k) && typeof emp[k] === 'string');
  return k ? String(emp[k] || '') : '';
};
const getName = (emp: Employee): string => {
  const k = Object.keys(emp).find(k => /name/i.test(k));
  return k ? String(emp[k] || '') : '';
};
const empKey = (emp: Employee): string => getNric(emp) || getName(emp) || emp._original || String(emp.id);

interface EmpDayEntry {
  temperature: string;
  fit?: boolean;
  signature: string | null;
}

interface AggregatedEmployee {
  nric: string;
  empId: string;
  name: string;
  days: Record<string, EmpDayEntry>;
}

interface HeaderData {
  company?: string;
  contract?: string;
  teamNo?: string;
}

interface WeeklyReportProps {
  weekData: WeekData;
  monday: Date;
  headerData: HeaderData;
}

type ReportImage = ImageRef & { day: string; date: Date };

export default function WeeklyReport({ weekData, monday, headerData }: WeeklyReportProps) {
  const [lightboxImg, setLightboxImg] = useState<ReportImage | null>(null);

  const getDayDate = (i: number): Date => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  };

  // ── Aggregate employees across all 7 days ──────────────────────
  const empMap: Record<string, AggregatedEmployee> = {};
  DAYS.forEach(day => {
    (weekData.days?.[day]?.employees || []).forEach(emp => {
      const key = empKey(emp);
      if (!empMap[key]) {
        empMap[key] = { nric: getNric(emp), empId: getEmpId(emp), name: getName(emp), days: {} };
      }
      empMap[key].days[day] = {
        temperature: emp.temperature || '',
        fit: emp.fit,
        signature: emp.signature || null,
      };
    });
  });
  const employees = Object.values(empMap);

  const fmtDate = (d: Date): string => d.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: '2-digit' });
  const weekStr = fmtDate(monday);

  return (
    <div className="card report-card">
      <div className="table-header" style={{ justifyContent: 'space-between' }}>
        <span className="section-title">Weekly Report</span>
        <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => window.print()}>
          Print / Export
        </button>
      </div>

      <div className="report-body">

        {/* ── Report meta ── */}
        <div className="report-meta">
          <div><strong>Company:</strong> {headerData.company || '—'}</div>
          <div><strong>Contract / Project:</strong> {headerData.contract || '—'}</div>
          <div><strong>Team No.:</strong> {headerData.teamNo || '—'}</div>
          <div><strong>Week of:</strong> {weekStr}</div>
        </div>

        {/* ── Merged: Locations + Safety & Health Declaration (single scrollable table) ── */}
        {(() => {
          const getLocs = (day: string): string[] => {
            const l = weekData.days?.[day]?.locations;
            if (!l) return [];
            if (Array.isArray(l)) return l.filter(x => x?.trim());
            return (l as string).trim() ? [l as string] : [];
          };
          const maxLocRows = Math.max(...DAYS.map(d => getLocs(d).length), 0);
          return (
            <div>
              <strong style={{ fontSize: 13 }}>Safety &amp; Health Declaration — Weekly Attendance</strong>
              <div className="report-weekly-wrap">
                <table className="report-weekly-table">
                  <colgroup>
                    <col style={{ width: 28 }} />
                    <col style={{ width: 90 }} />
                    <col style={{ width: 40 }} />
                    <col style={{ width: 110 }} />
                    {DAYS.flatMap(day => [
                      <col key={`${day}-c`} className="rwt-col-temp" style={{ width: 48 }} />,
                      <col key={`${day}-f`} style={{ width: 26 }} />,
                      <col key={`${day}-s`} className="rwt-col-sig" style={{ width: 90 }} />,
                    ])}
                  </colgroup>
                  <tbody>
                    {/* ── Day/date header + location rows (always rendered so days are visible) ── */}
                    <tr>
                      <td rowSpan={maxLocRows + 1} colSpan={3} className="rwt-th rlt-label">
                        <strong>Locations</strong>
                        <div style={{ fontWeight: 400, fontSize: 10, marginTop: 2 }}>*Task covers multiple locations</div>
                      </td>
                      <td className="rwt-th rlt-row-label">Day</td>
                      {DAYS.map((day, i) => (
                        <td key={day} colSpan={3} className="rwt-th rwt-day-head">
                          {day}
                          <div style={{ fontWeight: 400, fontSize: 10 }}>{fmtDate(getDayDate(i))}</div>
                        </td>
                      ))}
                    </tr>
                    {Array.from({ length: maxLocRows }, (_, ri) => (
                      <tr key={ri}>
                        <td className="rwt-th rlt-row-label">Location {ri + 1}</td>
                        {DAYS.map(day => (
                          <td key={day} colSpan={3} className="rlt-cell">{getLocs(day)[ri] || ''}</td>
                        ))}
                      </tr>
                    ))}

                    {/* ── Attendance header row 1: left cols span 2 rows, right spans Safety & Health label ── */}
                    <tr>
                      <td rowSpan={2} className="rwt-th rwt-sn">S/<br />N</td>
                      <td rowSpan={2} className="rwt-th rwt-nric">NRIC /<br />WP No.</td>
                      <td rowSpan={2} className="rwt-th rwt-id">ID</td>
                      <td rowSpan={2} className="rwt-th rwt-name">Name of<br />Employee</td>
                      <td colSpan={21} className="rwt-section-divider">
                        <strong>Safety &amp; Health Declaration</strong>
                        <div style={{ fontWeight: 400, fontSize: '0.9em', marginTop: 1 }}>
                          Temperature Checks (⁰C) &amp; Fit For Work (Fit — ✔ or ✗)
                        </div>
                      </td>
                    </tr>

                    {/* ── Attendance header row 2: °C Fit Sign sub-cols ── */}
                    <tr>
                      {DAYS.flatMap(day => [
                        <td key={`${day}-c`} className="rwt-th rwt-sub">°C</td>,
                        <td key={`${day}-f`} className="rwt-th rwt-sub">Fit</td>,
                        <td key={`${day}-s`} className="rwt-th rwt-sub">Sign</td>,
                      ])}
                    </tr>

                    {/* ── Employee rows ── */}
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={25} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 16 }}>
                          No employees recorded this week
                        </td>
                      </tr>
                    ) : employees.map((emp, i) => (
                      <tr key={i}>
                        <td className="rwt-sn">{i + 1}</td>
                        <td className="rwt-nric">{emp.nric || '—'}</td>
                        <td className="rwt-id">{emp.empId || '—'}</td>
                        <td className="rwt-name">{emp.name || '—'}</td>
                        {DAYS.flatMap(day => {
                          const d = emp.days[day];
                          const tooHot = d && !isNaN(parseFloat(d.temperature)) && parseFloat(d.temperature) > 37.6;
                          return [
                            <td key={`${day}-c`} className="rwt-cell" style={{ color: tooHot ? 'var(--danger)' : 'inherit' }}>
                              {d?.temperature || ''}
                            </td>,
                            <td key={`${day}-f`} className="rwt-cell">
                              {d ? (d.fit ? '✓' : '✗') : ''}
                            </td>,
                            <td key={`${day}-s`} className="rwt-sig">
                              {d?.signature ? <img src={d.signature} className="rwt-sig-img" alt="sig" /> : ''}
                            </td>,
                          ];
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* ── Topics briefed table (per day) ── */}
        <div>
          <strong style={{ fontSize: 13 }}>
            Safety Subjects &amp; Topics Briefed
            <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
              * Min. 2 topics to be discussed (approx. 10–15 min)
            </span>
          </strong>
          <div className="report-weekly-wrap" style={{ marginTop: 8 }}>
            <table className="report-topics-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>Day</th>
                  <th style={{ width: 80 }}>Topics</th>
                  <th>Topics Briefed</th>
                  <th style={{ width: 160 }}>Conducted By</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, i) => {
                  const record = weekData.days?.[day];
                  const ids = record?.safetyTopicIds || [];
                  const descs = record?.safetyTopicDescs || {};
                  const d = getDayDate(i);
                  return (
                    <tr key={day}>
                      <td style={{ fontWeight: 700, textAlign: 'center' }}>
                        {day}
                        <div style={{ fontWeight: 400, fontSize: 10, color: 'var(--text-muted)' }}>
                          {fmtDate(d)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: 13 }}>
                        {[...ids].sort((a, b) => a - b).join(', ')}
                      </td>
                      <td>
                        {[...ids].sort((a, b) => a - b).map(id => (
                          <div key={id} style={{ fontSize: 13, marginBottom: 4 }}>
                            <strong>{id}. {TOPIC_LABELS[id - 1]}</strong>
                            {descs[id] && <span style={{ color: 'var(--text-muted)' }}> — {descs[id]}</span>}
                          </div>
                        ))}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {record?.conductedBy || ''}
                        {record?.signature && (
                          <img src={record.signature} alt="sig" style={{ display: 'block', marginTop: 4, maxHeight: 40, maxWidth: 120 }} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Relevant Images (all week, page-break, 2×3 per page) ── */}
        {(() => {
          const allImages: ReportImage[] = DAYS.flatMap((day, i) =>
            (weekData.days?.[day]?.images || []).map(img => ({ ...img, day, date: getDayDate(i) }))
          );
          if (allImages.length === 0) return null;
          const pages: ReportImage[][] = [];
          for (let i = 0; i < allImages.length; i += 6) pages.push(allImages.slice(i, i + 6));
          return (
            <div className="report-images-section">
              <strong style={{ fontSize: 13 }}>Relevant Images</strong>
              {pages.map((pageImgs, pi) => (
                <div key={pi} className="report-image-page">
                  {pageImgs.map(img => (
                    <div key={img.id} className="report-image-cell" onClick={() => setLightboxImg(img)} style={{ cursor: 'pointer' }}>
                      <img src={img.url} alt={img.name} className="report-image-full" />
                      <div className="report-image-label">{img.day} — {fmtDate(img.date)}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })()}

      </div>

      {lightboxImg && (
        <ImageLightbox
          src={lightboxImg.url}
          name={lightboxImg.name}
          label={`${lightboxImg.day} — ${fmtDate(lightboxImg.date)}`}
          onClose={() => setLightboxImg(null)}
        />
      )}
    </div>
  );
}
