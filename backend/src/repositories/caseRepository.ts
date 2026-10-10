import { pool, type Queryable } from '../db/pool.js';
import type { Case, CaseHistoryEntry, CaseState, CaseSummary } from '../models/case.js';

interface CaseRow {
  id: string;
  owner_sub: string;
  name: string;
  status: string;
  state: CaseState;
  version: number;
  created_at: Date;
  updated_at: Date;
}

interface HistoryRow {
  version: number;
  changed_by: string;
  action: 'created' | 'updated';
  changed_sections: string[];
  created_at: Date;
}

const toCase = (row: CaseRow): Case => ({
  id: row.id,
  ownerSub: row.owner_sub,
  name: row.name,
  status: row.status,
  state: row.state,
  version: row.version,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const SUMMARY_COLUMNS = 'id, owner_sub, name, status, version, created_at, updated_at';

export const caseRepository = {
  async listByOwner(ownerSub: string, db: Queryable = pool): Promise<CaseSummary[]> {
    const { rows } = await db.query<Omit<CaseRow, 'state'>>(
      `SELECT ${SUMMARY_COLUMNS} FROM cases WHERE owner_sub = $1 ORDER BY updated_at DESC`,
      [ownerSub],
    );
    return rows.map((row) => {
      const { state: _state, ...summary } = toCase({ ...row, state: {} });
      return summary;
    });
  },

  /** Busca un caso solo dentro de los casos del dueño: nunca devuelve casos ajenos. */
  async findOwned(id: string, ownerSub: string, db: Queryable = pool): Promise<Case | null> {
    const { rows } = await db.query<CaseRow>('SELECT * FROM cases WHERE id = $1 AND owner_sub = $2', [id, ownerSub]);
    return rows[0] ? toCase(rows[0]) : null;
  },

  async findOwnedForUpdate(id: string, ownerSub: string, db: Queryable): Promise<Case | null> {
    const { rows } = await db.query<CaseRow>('SELECT * FROM cases WHERE id = $1 AND owner_sub = $2 FOR UPDATE', [
      id,
      ownerSub,
    ]);
    return rows[0] ? toCase(rows[0]) : null;
  },

  async insert(ownerSub: string, name: string, state: CaseState, db: Queryable = pool): Promise<Case> {
    const { rows } = await db.query<CaseRow>(
      'INSERT INTO cases (owner_sub, name, state) VALUES ($1, $2, $3) RETURNING *',
      [ownerSub, name, JSON.stringify(state)],
    );
    return toCase(rows[0]!);
  },

  async update(id: string, name: string, state: CaseState, version: number, db: Queryable): Promise<Case> {
    const { rows } = await db.query<CaseRow>(
      'UPDATE cases SET name = $2, state = $3, version = $4, updated_at = now() WHERE id = $1 RETURNING *',
      [id, name, JSON.stringify(state), version],
    );
    return toCase(rows[0]!);
  },

  async deleteOwned(id: string, ownerSub: string, db: Queryable = pool): Promise<boolean> {
    const result = await db.query('DELETE FROM cases WHERE id = $1 AND owner_sub = $2', [id, ownerSub]);
    return (result.rowCount ?? 0) > 0;
  },
};

export const caseHistoryRepository = {
  async insert(
    entry: { caseId: string; version: number; changedBy: string; action: 'created' | 'updated'; changedSections: string[] },
    db: Queryable = pool,
  ): Promise<void> {
    await db.query(
      'INSERT INTO case_history (case_id, version, changed_by, action, changed_sections) VALUES ($1, $2, $3, $4, $5)',
      [entry.caseId, entry.version, entry.changedBy, entry.action, entry.changedSections],
    );
  },

  async listByCase(caseId: string, db: Queryable = pool): Promise<CaseHistoryEntry[]> {
    const { rows } = await db.query<HistoryRow>(
      'SELECT version, changed_by, action, changed_sections, created_at FROM case_history WHERE case_id = $1 ORDER BY version DESC',
      [caseId],
    );
    return rows.map((row) => ({
      version: row.version,
      changedBy: row.changed_by,
      action: row.action,
      changedSections: row.changed_sections,
      createdAt: row.created_at,
    }));
  },
};
