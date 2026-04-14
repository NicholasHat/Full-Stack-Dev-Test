import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('drafts.db');

export type StoredEstimateDraftRow = {
  id: string;
  job_id: string | null;
  customer_id: string | null;
  payload_json: string;
  updated_at: string;
};

export function initDraftsDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS estimate_drafts (
      id TEXT PRIMARY KEY NOT NULL,
      job_id TEXT,
      customer_id TEXT,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export function saveDraft(id: string, payloadJson: string, jobId?: string, customerId?: string) {
  initDraftsDb();
  db.runSync(
    `
      INSERT OR REPLACE INTO estimate_drafts (id, job_id, customer_id, payload_json, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    [id, jobId ?? null, customerId ?? null, payloadJson, new Date().toISOString()]
  );
}

export function searchDrafts(query: string) {
  initDraftsDb();
  const like = `%${query}%`;
  return db.getAllSync<StoredEstimateDraftRow>(
    `
      SELECT *
      FROM estimate_drafts
      WHERE id LIKE ? OR job_id LIKE ? OR customer_id LIKE ?
      ORDER BY updated_at DESC
    `,
    [like, like, like]
  );
}

export function getDraftById(id: string) {
  initDraftsDb();
  return db.getFirstSync<StoredEstimateDraftRow>(
    `
      SELECT *
      FROM estimate_drafts
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );
}
