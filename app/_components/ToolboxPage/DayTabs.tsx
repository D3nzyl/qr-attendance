import type { WeekData } from "../../types";
import { DAYS, dayDate } from "./toolbox-utils";

interface DayTabsProps {
  monday: Date;
  activeDay: string | null;
  weekData: WeekData;
  loading: boolean;
  contract: string;
  teamNo: string;
  onSelectDay: (day: string) => void;
}

/** Day selector tabs (Mon–Sun) with filled/active/today markers. */
export default function DayTabs({
  monday,
  activeDay,
  weekData,
  loading,
  contract,
  teamNo,
  onSelectDay,
}: DayTabsProps) {
  return (
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
              className={`day-tab${isActive ? " active" : ""}${isFilled ? " filled" : ""}${isToday ? " today" : ""}`}
              onClick={() => onSelectDay(day)}
            >
              <span className="day-tab-label">{day}</span>
              <span className="day-tab-num">
                {d.getDate()}/{d.getMonth() + 1}
              </span>
              {isFilled && <span className="day-filled-dot" />}
              {isToday && !isFilled && <span className="day-today-dot" />}
            </button>
          );
        })}
      </div>
      <div className="day-tabs-hint">
        {loading
          ? "Loading…"
          : `${contract} · ${teamNo} — click a day to fill in details`}
      </div>
    </div>
  );
}
