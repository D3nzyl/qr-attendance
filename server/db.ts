import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, 'attendance.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract TEXT NOT NULL,
    team_no TEXT NOT NULL,
    week_key TEXT NOT NULL,
    day TEXT NOT NULL,
    company TEXT DEFAULT '',
    data TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(contract, team_no, week_key, day)
  );

  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract TEXT NOT NULL,
    team_no TEXT NOT NULL,
    week_key TEXT NOT NULL,
    day TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

export default db;
