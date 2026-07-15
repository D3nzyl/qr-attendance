import { dayDate } from "./toolbox-utils";

interface WeekNavProps {
  monday: Date;
  showReport: boolean;
  onShiftWeek: (n: number) => void;
  onDateInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleReport: () => void;
}

const rangeFmt: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "2-digit",
};

/** Week navigation card: arrows, date picker, range label and report toggle. */
export default function WeekNav({
  monday,
  showReport,
  onShiftWeek,
  onDateInput,
  onToggleReport,
}: WeekNavProps) {
  const mondayStr = monday.toLocaleDateString("en-SG", rangeFmt);
  const sundayStr = dayDate(monday, 6).toLocaleDateString("en-SG", rangeFmt);

  return (
    <div className="card toolbox-week-card">
      <div className="card-body" style={{ paddingBottom: 12 }}>
        <div className="form-group">
          <label>Week</label>
          <div className="week-nav-row">
            <button className="week-nav-arrow" onClick={() => onShiftWeek(-1)}>
              &#8249;
            </button>
            <input
              type="date"
              value={monday.toISOString().slice(0, 10)}
              onChange={onDateInput}
              className="week-date-input"
              title="Pick any date — jumps to that week"
            />
            <button className="week-nav-arrow" onClick={() => onShiftWeek(1)}>
              &#8250;
            </button>
          </div>
          <span className="week-range-label">
            {mondayStr} — {sundayStr}
          </span>
        </div>
        <button
          className={`btn ${showReport ? "btn-primary" : "btn-ghost"}`}
          style={{ width: "100%", marginTop: 8, fontSize: 15 }}
          onClick={onToggleReport}
        >
          {showReport ? "Hide Weekly Report" : "View Weekly Report"}
        </button>
      </div>
    </div>
  );
}
