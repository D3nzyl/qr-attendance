import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router();

interface DayRow {
  day: string;
  company: string;
  data: string;
}

// GET /api/week/:contract/:teamNo/:weekKey — full week data for one week
router.get('/week/:contract/:teamNo/:weekKey', (req: Request, res: Response) => {
  const { contract, teamNo, weekKey } = req.params;
  const rows = db.prepare(
    'SELECT day, company, data FROM days WHERE contract=? AND team_no=? AND week_key=?'
  ).all(contract, teamNo, weekKey) as DayRow[];

  const result: { company: string; days: Record<string, unknown> } = { company: '', days: {} };
  for (const row of rows) {
    if (row.company) result.company = row.company;
    try { result.days[row.day] = JSON.parse(row.data); }
    catch { result.days[row.day] = {}; }
  }
  res.json(result);
});

// GET /api/weeks/:contract/:teamNo — list all weekKeys that have data
router.get('/weeks/:contract/:teamNo', (req: Request, res: Response) => {
  const { contract, teamNo } = req.params;
  const rows = db.prepare(
    'SELECT DISTINCT week_key FROM days WHERE contract=? AND team_no=? ORDER BY week_key DESC'
  ).all(contract, teamNo) as { week_key: string }[];
  res.json(rows.map(r => r.week_key));
});

// PUT /api/day/:contract/:teamNo/:weekKey/:day — upsert a day
router.put('/day/:contract/:teamNo/:weekKey/:day', (req: Request, res: Response) => {
  const { contract, teamNo, weekKey, day } = req.params;
  const { company = '', ...dayData } = req.body;
  db.prepare(`
    INSERT INTO days (contract, team_no, week_key, day, company, data, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(contract, team_no, week_key, day)
    DO UPDATE SET company=excluded.company, data=excluded.data, updated_at=excluded.updated_at
  `).run(contract, teamNo, weekKey, day, company, JSON.stringify(dayData));
  res.json({ ok: true });
});

// DELETE /api/day/:contract/:teamNo/:weekKey/:day — clear a day
router.delete('/day/:contract/:teamNo/:weekKey/:day', (req: Request, res: Response) => {
  const { contract, teamNo, weekKey, day } = req.params;
  db.prepare('DELETE FROM days WHERE contract=? AND team_no=? AND week_key=? AND day=?')
    .run(contract, teamNo, weekKey, day);
  // also remove image records (files cleaned up separately or left for manual cleanup)
  db.prepare('DELETE FROM images WHERE contract=? AND team_no=? AND week_key=? AND day=?')
    .run(contract, teamNo, weekKey, day);
  res.json({ ok: true });
});

export default router;
