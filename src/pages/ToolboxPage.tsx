import { useState, useEffect, useCallback } from 'react';
import DayForm from '../components/DayForm';
import WeeklyReport from '../components/WeeklyReport';
import { api } from '../lib/api';
import type { WeekData, DayData } from '../types';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const COMPANIES = ['GIM TIAN CIVIL ENGINEERING PTE LTD', 'Other'];
const TEAMS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
const CONTRACTS = [
  'DE170', 'J102', 'J120', 'N111',
  'RM103A', 'RM103B', 'RM203', 'RM209A',
  'TR307', 'TR372', 'TR372-DRC', 'TR376',
  'Store', 'Others',
  'RM203 Workshop', 'TR372 Workshop', 'RM209 Workshop',
  'Jln Leban',
];

function getMondayOf(date: Date | number | string): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

function weekKey(monday: Date): string {
  return monday.toISOString().slice(0, 10);
}

function dayDate(monday: Date, idx: number): Date {
  const d = new Date(monday);
  d.setDate(d.getDate() + idx);
  return d;
}

export default function ToolboxPage() {
  const [monday, setMonday] = useState<Date>(() => getMondayOf(new Date()));
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [company, setCompany] = useState('GIM TIAN CIVIL ENGINEERING PTE LTD');
  const [contract, setContract] = useState('');
  const [teamNo, setTeamNo] = useState('');

  const [weekData, setWeekData] = useState<WeekData>({ days: {} });
  const [loading, setLoading] = useState(false);

  const wk = weekKey(monday);
  const canShowDays = contract !== '' && teamNo !== '';

  const fetchWeek = useCallback(async () => {
    if (!canShowDays) return;
    setLoading(true);
    try {
      const data = await api.getWeek(contract, teamNo, wk);
      setWeekData(data);
      if (data.company) setCompany(data.company);
    } catch (e) {
      console.error('Failed to load week:', e);
      setWeekData({ days: {} });
    } finally {
      setLoading(false);
    }
  }, [contract, teamNo, wk, canShowDays]);

  useEffect(() => { fetchWeek(); }, [fetchWeek]);

  const saveDay = async (day: string, dayData: DayData) => {
    await api.saveDay(contract, teamNo, wk, day, company, dayData);
    await fetchWeek();
  };

  const clearDay = async (day: string) => {
    await api.clearDay(contract, teamNo, wk, day);
    await fetchWeek();
  };

  const shiftWeek = (n: number) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + n * 7);
    setMonday(d);
    setActiveDay(null);
    setShowReport(false);
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = new Date(e.target.value);
    if (!isNaN(d.getTime())) { setMonday(getMondayOf(d)); setActiveDay(null); setShowReport(false); }
  };

  const mondayStr = monday.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: '2-digit' });
  const sunDate = dayDate(monday, 6);
  const sundayStr = sunDate.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: '2-digit' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header card ── */}
      <div className="card">
        <div className="card-body">
          <h2 className="toolbox-page-title">Daily Toolbox Meeting</h2>

          <div className="toolbox-header-fields">
            <div className="form-group toolbox-company-field">
              <label>Company</label>
              <select value={company} onChange={e => setCompany(e.target.value)}>
                {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Contract / Project</label>
              <select
                value={contract}
                onChange={e => { setContract(e.target.value); setActiveDay(null); setShowReport(false); }}
              >
                <option value="">— Select contract —</option>
                {CONTRACTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Team No.</label>
              <select
                value={teamNo}
                onChange={e => { setTeamNo(e.target.value); setActiveDay(null); setShowReport(false); }}
              >
                <option value="">— Select team —</option>
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {!canShowDays && (
        <div className="banner banner-warning">
          Select a <strong>Contract</strong> and <strong>Team</strong> above to start recording attendance.
        </div>
      )}

      {canShowDays && (
        <>
          {/* ── Week nav + Day tabs (side by side on desktop) ── */}
          <div className="toolbox-week-day-row">
            <div className="card toolbox-week-card">
              <div className="card-body" style={{ paddingBottom: 12 }}>
                <div className="form-group">
                  <label>Week</label>
                  <div className="week-nav-row">
                    <button className="week-nav-arrow" onClick={() => shiftWeek(-1)}>&#8249;</button>
                    <input
                      type="date"
                      value={monday.toISOString().slice(0, 10)}
                      onChange={handleDateInput}
                      className="week-date-input"
                      title="Pick any date — jumps to that week"
                    />
                    <button className="week-nav-arrow" onClick={() => shiftWeek(1)}>&#8250;</button>
                  </div>
                  <span className="week-range-label">{mondayStr} — {sundayStr}</span>
                </div>
                <button
                  className={`btn ${showReport ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ width: '100%', marginTop: 8, fontSize: 15 }}
                  onClick={() => { setShowReport(v => !v); setActiveDay(null); }}
                >
                  {showReport ? 'Hide Weekly Report' : 'View Weekly Report'}
                </button>
              </div>
            </div>

            {/* ── Day selector tabs ── */}
            <div className="card day-tabs-card toolbox-day-card">
              <div className="day-tabs-row">
                {DAYS.map((day, i) => {
                  const d = dayDate(monday, i);
                  const isFilled = !!weekData.days?.[day];
                  const isActive = activeDay === day;
                  const isToday = d.toDateString() === new Date().toDateString();
                  return (
                    <button
                      key={day}
                      className={`day-tab${isActive ? ' active' : ''}${isFilled ? ' filled' : ''}${isToday ? ' today' : ''}`}
                      onClick={() => {
                        setActiveDay(isActive ? null : day);
                        setShowReport(false);
                      }}
                    >
                      <span className="day-tab-label">{day}</span>
                      <span className="day-tab-num">{d.getDate()}/{d.getMonth() + 1}</span>
                      {isFilled && <span className="day-filled-dot" />}
                      {isToday && !isFilled && <span className="day-today-dot" />}
                    </button>
                  );
                })}
              </div>
              <div className="day-tabs-hint">
                {loading ? 'Loading…' : `${contract} · ${teamNo} — click a day to fill in details`}
              </div>
            </div>
          </div>

          {/* ── Day form ── */}
          {activeDay && (
            <DayForm
              key={`${contract}-${teamNo}-${wk}-${activeDay}`}
              dayKey={activeDay}
              date={dayDate(monday, DAYS.indexOf(activeDay))}
              initial={weekData.days?.[activeDay] || null}
              onSave={(data) => saveDay(activeDay, data)}
              onClear={() => clearDay(activeDay)}
              contract={contract}
              teamNo={teamNo}
              weekKey={wk}
            />
          )}

          {showReport && (
            <WeeklyReport
              weekData={weekData}
              monday={monday}
              headerData={{ company, contract, teamNo }}
            />
          )}
        </>
      )}
    </div>
  );
}
