"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../_lib/api";
import { as2Client } from "../../_lib/as2-client";
import type { DayData, WeekData } from "../../types";
import DayForm from "./DayForm";
import DayTabs from "./DayTabs";
import ToolboxHeader from "./ToolboxHeader";
import WeekNav from "./WeekNav";
import WeeklyReport from "./WeeklyReport";
import {
  DAYS,
  dayDate,
  getMondayOf,
  weekKey,
  type Option,
} from "./toolbox-utils";

interface ToolboxOptions {
  teams: Option[];
  contracts: Option[];
}

/** Load the toolbox dropdowns (contracts + user's teams) for a solution. */
async function fetchToolboxOptions(): Promise<ToolboxOptions> {
  // Fetch independently so one failing list doesn't hide the other.
  const contracts = await as2Client.trpc.checks.folders.getUserFolders
    .query({
      page: 1,
      pageSize: 100,
      isInfinite: false,
    })
    .catch((e) => {
      console.error("Failed to load contracts:", e);
      return { items: [] };
    });

  const teams = await as2Client.trpc.base.v2.solutionTeams.listEndUserTeams
    .query({
      page: 1,
      pageSize: 100,
      isInfinite: false,
    })
    .catch((e) => {
      console.error("Failed to load teams:", e);
      return { items: [] };
    });

  return {
    teams: teams.items.map((team) => ({
      value: team.id,
      label: team.teamName,
    })),
    contracts: contracts.items.map((contract) => ({
      value: contract.id,
      label: contract.name,
    })),
  };
}

export default function ToolboxPage() {
  const [monday, setMonday] = useState<Date>(() => getMondayOf(new Date()));
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [company, setCompany] = useState("GIM TIAN CIVIL ENGINEERING PTE LTD");
  const [contract, setContract] = useState("");
  const [teamNo, setTeamNo] = useState("");

  const [weekData, setWeekData] = useState<WeekData>({ days: {} });
  const [loading, setLoading] = useState(false);

  const [teams, setTeams] = useState<Option[]>([]);
  const [contracts, setContracts] = useState<Option[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Load contract/team options for the linked solution.
  useEffect(() => {
    let cancelled = false;
    // setOptionsLoading(true);
    fetchToolboxOptions()
      .then((opts) => {
        if (cancelled) return;
        setContracts(opts.contracts);
        setTeams(opts.teams);
      })
      .catch((e) => console.error("Failed to load toolbox options:", e))
      .finally(() => {
        setOptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const wk = weekKey(monday);
  const canShowDays = contract !== "" && teamNo !== "";

  const fetchWeek = useCallback(async () => {
    if (!canShowDays) return;
    setLoading(true);
    try {
      const data = await api.getWeek(contract, teamNo, wk);
      setWeekData(data);
      if (data.company) setCompany(data.company);
    } catch (e) {
      console.error("Failed to load week:", e);
      setWeekData({ days: {} });
    } finally {
      setLoading(false);
    }
  }, [contract, teamNo, wk, canShowDays]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

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
    if (!isNaN(d.getTime())) {
      setMonday(getMondayOf(d));
      setActiveDay(null);
      setShowReport(false);
    }
  };

  // Changing contract/team resets the day/report view.
  const selectContract = (value: string) => {
    setContract(value);
    setActiveDay(null);
    setShowReport(false);
  };

  const selectTeam = (value: string) => {
    setTeamNo(value);
    setActiveDay(null);
    setShowReport(false);
  };

  const selectDay = (day: string) => {
    setActiveDay((prev) => (prev === day ? null : day));
    setShowReport(false);
  };

  const toggleReport = () => {
    setShowReport((v) => !v);
    setActiveDay(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ToolboxHeader
        company={company}
        onCompanyChange={setCompany}
        contract={contract}
        onContractChange={selectContract}
        teamNo={teamNo}
        onTeamNoChange={selectTeam}
        contracts={contracts}
        teams={teams}
        optionsLoading={optionsLoading}
      />

      {!canShowDays && (
        <div className="banner banner-warning">
          Select a <strong>Contract</strong> and <strong>Team</strong> above to
          start recording attendance.
        </div>
      )}

      {canShowDays && (
        <>
          <div className="toolbox-week-day-row">
            <WeekNav
              monday={monday}
              showReport={showReport}
              onShiftWeek={shiftWeek}
              onDateInput={handleDateInput}
              onToggleReport={toggleReport}
            />
            <DayTabs
              monday={monday}
              activeDay={activeDay}
              weekData={weekData}
              loading={loading}
              contract={contract}
              teamNo={teamNo}
              onSelectDay={selectDay}
            />
          </div>

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
