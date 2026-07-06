"use client";

import { useState } from 'react';
import GeneratePage from '../src/pages/GeneratePage';
import ToolboxPage from '../src/pages/ToolboxPage';

const TABS = [
  { id: 'toolbox', label: 'Toolbox Meeting' },
  { id: 'generate', label: 'Generate QR' },
];

export default function HomePage() {
  const [tab, setTab] = useState('toolbox');

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <span className="app-logo">■ QR Attendance</span>
          <nav className="tab-nav">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab-btn${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="app-main">
        {tab === 'toolbox' && <ToolboxPage />}
        {tab === 'generate' && <GeneratePage />}
      </main>
    </div>
  );
}
