import { pool, type Queryable } from '../db/pool.js';
import type { User } from '../models/user.js';

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  is_active: boolean;
}

const toUser = (row: UserRow): User => ({
  id: row.id,
  username: row.username,
  passwordHash: row.password_hash,
  displayName: row.display_name,
  isActive: row.is_active,
});

export const userRepository = {
  async findByUsername(username: string, db: Queryable = pool): Promise<User | null> {
    const { rows } = await db.query<UserRow>('SELECT * FROM users WHERE lower(username) = lower($1)', [username]);
    return rows[0] ? toUser(rows[0]) : null;
  },

  async findById(id: string, db: Queryable = pool): Promise<User | null> {
    const { rows } = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ? toUser(rows[0]) : null;
  },

  async upsert(username: string, passwordHash: string, displayName: string, db: Queryable = pool): Promise<User> {
    const { rows } = await db.query<UserRow>(
      `INSERT INTO users (username, password_hash, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             display_name  = EXCLUDED.display_name,
             is_active     = TRUE,
             updated_at    = now()
       RETURNING *`,
      [username, passwordHash, displayName],
    );
    return toUser(rows[0]!);
  },
};
