import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppState } from '../../types';
import type { SessionUser } from '../../services/api/authApi';
import { casesApi, type StoredCase } from '../../services/api/casesApi';
import { ApiError } from '../../services/api/httpClient';
import { onLogout } from '../auth/AuthProvider';

export type SaveStatus = 'loading' | 'saved' | 'pending' | 'saving' | 'offline' | 'error';

interface Draft {
  caseId: string | null;
  version: number | null;
  state: AppState;
  savedAt: string;
}

const LOCAL_DEBOUNCE_MS = 500;
const SERVER_DEBOUNCE_MS = 2000;
const OFFLINE_RETRY_MS = 15000;

const draftKey = (user: SessionUser) => `kitacr8d:draft:${user.sub}`;

function readDraft(user: SessionUser): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey(user));
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function writeDraft(user: SessionUser, draft: Draft) {
  try {
    localStorage.setItem(draftKey(user), JSON.stringify(draft));
  } catch {
    // Almacenamiento lleno o bloqueado: el guardado en el servidor sigue funcionando.
  }
}

function removeDraft(user: SessionUser) {
  try {
    localStorage.removeItem(draftKey(user));
  } catch {
    // Nada que limpiar.
  }
}

/**
 * Persistencia del caso:
 *  - copia local en el navegador en cada cambio (recarga de página o caída de conexión),
 *  - guardado automático en el servidor con control de versión,
 *  - carga del último caso del usuario al iniciar sesión.
 */
export function useCasePersistence(user: SessionUser, state: AppState, setState: (state: AppState) => void) {
  const [status, setStatus] = useState<SaveStatus>('loading');
  const [ready, setReady] = useState(false);

  const stateRef = useRef(state);
  const caseIdRef = useRef<string | null>(null);
  const versionRef = useRef<number | null>(null);
  const lastSyncedRef = useRef<string | null>(null);
  const savingRef = useRef<Promise<void> | null>(null);
  const serverTimer = useRef<number | undefined>(undefined);
  const localTimer = useRef<number | undefined>(undefined);

  stateRef.current = state;

  const persistDraft = useCallback(() => {
    writeDraft(user, {
      caseId: caseIdRef.current,
      version: versionRef.current,
      state: stateRef.current,
      savedAt: new Date().toISOString(),
    });
  }, [user]);

  const saveToServer = useCallback(async (): Promise<void> => {
    if (savingRef.current) {
      await savingRef.current;
    }
    const snapshot = stateRef.current;
    const json = JSON.stringify(snapshot);
    if (json === lastSyncedRef.current) {
      setStatus('saved');
      return;
    }

    const run = async () => {
      setStatus('saving');
      try {
        let stored: StoredCase;
        if (!caseIdRef.current) {
          stored = await casesApi.create(snapshot);
        } else {
          try {
            stored = await casesApi.update(caseIdRef.current, snapshot, versionRef.current ?? 1);
          } catch (error) {
            if (error instanceof ApiError && error.status === 409) {
              // Otra pestaña guardó antes: se toma su versión y se guarda lo que el usuario ve.
              const latest = await casesApi.get(caseIdRef.current);
              stored = await casesApi.update(caseIdRef.current, snapshot, latest.version);
            } else if (error instanceof ApiError && error.status === 404) {
              stored = await casesApi.create(snapshot);
            } else {
              throw error;
            }
          }
        }
        caseIdRef.current = stored.id;
        versionRef.current = stored.version;
        lastSyncedRef.current = json;
        persistDraft();
        setStatus(JSON.stringify(stateRef.current) === json ? 'saved' : 'pending');
      } catch (error) {
        const offline = error instanceof ApiError && error.status === 0;
        setStatus(offline ? 'offline' : 'error');
        window.clearTimeout(serverTimer.current);
        serverTimer.current = window.setTimeout(() => void saveToServer(), OFFLINE_RETRY_MS);
      }
    };

    savingRef.current = run().finally(() => {
      savingRef.current = null;
    });
    await savingRef.current;
  }, [persistDraft]);

  // Carga inicial: último caso del servidor o, si es más reciente, la copia local.
  useEffect(() => {
    let cancelled = false;
    const draft = readDraft(user);

    (async () => {
      try {
        const cases = await casesApi.list();
        const serverCase = cases[0] ? await casesApi.get(cases[0].id) : null;
        if (cancelled) return;

        if (serverCase) {
          caseIdRef.current = serverCase.id;
          versionRef.current = serverCase.version;
          lastSyncedRef.current = JSON.stringify(serverCase.state);
          const draftIsNewer =
            draft?.caseId === serverCase.id && new Date(draft.savedAt).getTime() > new Date(serverCase.updatedAt).getTime();
          setState(draftIsNewer ? draft.state : serverCase.state);
          setStatus(draftIsNewer ? 'pending' : 'saved');
        } else if (draft) {
          setState(draft.state);
          setStatus('pending');
        } else {
          lastSyncedRef.current = JSON.stringify(stateRef.current);
          setStatus('saved');
        }
      } catch {
        if (cancelled) return;
        if (draft) {
          caseIdRef.current = draft.caseId;
          versionRef.current = draft.version;
          setState(draft.state);
        }
        setStatus('offline');
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Solo al iniciar la sesión del usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.sub]);

  // Cada cambio: copia local inmediata y guardado diferido en el servidor.
  useEffect(() => {
    if (!ready) return;
    window.clearTimeout(localTimer.current);
    localTimer.current = window.setTimeout(persistDraft, LOCAL_DEBOUNCE_MS);

    if (JSON.stringify(state) === lastSyncedRef.current) return;
    setStatus((current) => (current === 'offline' || current === 'error' ? current : 'pending'));
    window.clearTimeout(serverTimer.current);
    serverTimer.current = window.setTimeout(() => void saveToServer(), SERVER_DEBOUNCE_MS);
  }, [state, ready, persistDraft, saveToServer]);

  // Al cerrar sesión: se guarda lo pendiente y se borra la copia local.
  useEffect(
    () =>
      onLogout(async () => {
        window.clearTimeout(serverTimer.current);
        window.clearTimeout(localTimer.current);
        await saveToServer().catch(() => undefined);
        // Si no se pudo sincronizar se conserva la copia local para no perder el trabajo.
        if (JSON.stringify(stateRef.current) === lastSyncedRef.current) removeDraft(user);
      }),
    [user, saveToServer],
  );

  useEffect(
    () => () => {
      window.clearTimeout(serverTimer.current);
      window.clearTimeout(localTimer.current);
    },
    [],
  );

  return { status, ready, saveNow: saveToServer };
}
