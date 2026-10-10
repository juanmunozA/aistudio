-- Usuarios con usuario y contraseña (AUTH_MODE=local).
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Casos de análisis 8D. owner_sub es el identificador del usuario en el token
-- (id local o "sub" del proveedor SSO), así el modelo sirve para ambos modos.
CREATE TABLE IF NOT EXISTS cases (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_sub  TEXT NOT NULL,
  name       TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'in_progress',
  state      JSONB NOT NULL,
  version    INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cases_owner_updated ON cases (owner_sub, updated_at DESC);

-- Trazabilidad: qué disciplinas cambiaron, quién y cuándo, en cada guardado.
CREATE TABLE IF NOT EXISTS case_history (
  id               BIGSERIAL PRIMARY KEY,
  case_id          UUID NOT NULL REFERENCES cases (id) ON DELETE CASCADE,
  version          INTEGER NOT NULL,
  changed_by       TEXT NOT NULL,
  action           TEXT NOT NULL,
  changed_sections TEXT[] NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_case_history_case ON case_history (case_id, version DESC);
