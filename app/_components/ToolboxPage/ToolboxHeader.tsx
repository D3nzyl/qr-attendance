import { COMPANIES, type Option } from "./toolbox-utils";

interface ToolboxHeaderProps {
  company: string;
  onCompanyChange: (value: string) => void;
  contract: string;
  onContractChange: (value: string) => void;
  teamNo: string;
  onTeamNoChange: (value: string) => void;
  contracts: Option[];
  teams: Option[];
  optionsLoading: boolean;
}

/** Header card with the Company / Contract / Team selectors. */
export default function ToolboxHeader({
  company,
  onCompanyChange,
  contract,
  onContractChange,
  teamNo,
  onTeamNoChange,
  contracts,
  teams,
  optionsLoading,
}: ToolboxHeaderProps) {
  return (
    <div className="card">
      <div className="card-body">
        <h2 className="toolbox-page-title">Daily Toolbox Meeting</h2>

        <div className="toolbox-header-fields">
          <div className="form-group toolbox-company-field">
            <label>Company</label>
            <select
              value={company}
              onChange={(e) => onCompanyChange(e.target.value)}
            >
              {COMPANIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Contract / Project</label>
            <select
              value={contract}
              onChange={(e) => onContractChange(e.target.value)}
            >
              <option value="">
                {optionsLoading ? "Loading…" : "— Select contract —"}
              </option>
              {contracts.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Team No.</label>
            <select
              value={teamNo}
              onChange={(e) => onTeamNoChange(e.target.value)}
            >
              <option value="">
                {optionsLoading ? "Loading…" : "— Select team —"}
              </option>
              {teams.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
