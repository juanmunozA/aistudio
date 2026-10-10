import { withTransaction } from '../db/pool.js';
import type { Case, CaseHistoryEntry, CaseSummary, CreateCaseInput, UpdateCaseInput } from '../models/case.js';
import type { AuthUser } from '../models/user.js';
import { caseHistoryRepository, caseRepository } from '../repositories/caseRepository.js';
import { HttpError } from '../utils/httpError.js';
import { caseNameOf, diffSections, migrateCaseState } from './caseStateMigration.js';

export const caseService = {
  list(user: AuthUser): Promise<CaseSummary[]> {
    return caseRepository.listByOwner(user.sub);
  },

  async get(user: AuthUser, id: string): Promise<Case> {
    const found = await caseRepository.findOwned(id, user.sub);
    if (!found) throw HttpError.notFound('Caso no encontrado');
    return found;
  },

  async create(user: AuthUser, input: CreateCaseInput): Promise<Case> {
    const state = migrateCaseState(input.state);
    return withTransaction(async (db) => {
      const created = await caseRepository.insert(user.sub, caseNameOf(state), state, db);
      await caseHistoryRepository.insert(
        { caseId: created.id, version: created.version, changedBy: user.username, action: 'created', changedSections: Object.keys(state).sort() },
        db,
      );
      return created;
    });
  },

  async update(user: AuthUser, id: string, input: UpdateCaseInput): Promise<Case> {
    const state = migrateCaseState(input.state);
    return withTransaction(async (db) => {
      const current = await caseRepository.findOwnedForUpdate(id, user.sub, db);
      if (!current) throw HttpError.notFound('Caso no encontrado');
      if (current.version !== input.version) {
        throw HttpError.conflict('El caso fue modificado en otra sesión', { currentVersion: current.version });
      }

      const changedSections = diffSections(current.state, state);
      if (changedSections.length === 0) return current;

      const updated = await caseRepository.update(id, caseNameOf(state), state, current.version + 1, db);
      await caseHistoryRepository.insert(
        { caseId: id, version: updated.version, changedBy: user.username, action: 'updated', changedSections },
        db,
      );
      return updated;
    });
  },

  async remove(user: AuthUser, id: string): Promise<void> {
    const deleted = await caseRepository.deleteOwned(id, user.sub);
    if (!deleted) throw HttpError.notFound('Caso no encontrado');
  },

  async history(user: AuthUser, id: string): Promise<CaseHistoryEntry[]> {
    await this.get(user, id);
    return caseHistoryRepository.listByCase(id);
  },

  /** Valida y migra un JSON exportado sin guardarlo (usado por "Cargar JSON"). */
  normalize(input: CreateCaseInput) {
    return migrateCaseState(input.state);
  },
};
