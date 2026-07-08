"use client";

import { useEffect, useState } from "react";
import GeneratePage from "./_components/GeneratePage";
import ToolboxPage from "./_components/ToolboxPage";
import { as2Client } from "./_lib/as2-client";

const TABS = [
  { id: "toolbox", label: "Toolbox Meeting" },
  { id: "generate", label: "Generate QR" },
];

export default function HomePage() {
  const [tab, setTab] = useState("toolbox");

  useEffect(() => {
    // Initialize the AS2 development user session
    as2Client.initDevSession();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <span className="app-logo">■ QR Attendance</span>
          <nav className="tab-nav">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab-btn${tab === t.id ? " active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="app-main">
        {tab === "toolbox" && <ToolboxPage />}
        {tab === "generate" && <GeneratePage />}
      </main>
    </div>
  );
}
