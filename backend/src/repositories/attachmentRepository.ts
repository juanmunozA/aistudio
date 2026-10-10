import { pool, type Queryable } from '../db/pool.js';

export interface Attachment {
  id: string;
  ownerSub: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageKey: string;
  createdAt: Date;
}

interface AttachmentRow {
  id: string;
  owner_sub: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  storage_key: string;
  created_at: Date;
}

const toAttachment = (row: AttachmentRow): Attachment => ({
  id: row.id,
  ownerSub: row.owner_sub,
  fileName: row.file_name,
  contentType: row.content_type,
  sizeBytes: row.size_bytes,
  storageKey: row.storage_key,
  createdAt: row.created_at,
});

export const attachmentRepository = {
  async insert(entry: Omit<Attachment, 'createdAt'>, db: Queryable = pool): Promise<Attachment> {
    const { rows } = await db.query<AttachmentRow>(
      `INSERT INTO attachments (id, owner_sub, file_name, content_type, size_bytes, storage_key)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [entry.id, entry.ownerSub, entry.fileName, entry.contentType, entry.sizeBytes, entry.storageKey],
    );
    return toAttachment(rows[0]!);
  },

  async findById(id: string, db: Queryable = pool): Promise<Attachment | null> {
    const { rows } = await db.query<AttachmentRow>('SELECT * FROM attachments WHERE id = $1', [id]);
    return rows[0] ? toAttachment(rows[0]) : null;
  },

  async findOwned(id: string, ownerSub: string, db: Queryable = pool): Promise<Attachment | null> {
    const { rows } = await db.query<AttachmentRow>('SELECT * FROM attachments WHERE id = $1 AND owner_sub = $2', [id, ownerSub]);
    return rows[0] ? toAttachment(rows[0]) : null;
  },

  async deleteOwned(id: string, ownerSub: string, db: Queryable = pool): Promise<Attachment | null> {
    const { rows } = await db.query<AttachmentRow>('DELETE FROM attachments WHERE id = $1 AND owner_sub = $2 RETURNING *', [id, ownerSub]);
    return rows[0] ? toAttachment(rows[0]) : null;
  },
};
