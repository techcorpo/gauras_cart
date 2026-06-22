// Shared helper: get the org_id for a user id.
import { query } from './db';
export async function getOrgId(userId) {
  const r = await query('SELECT org_id FROM users WHERE id = $1', [userId]);
  return r.rows[0] && r.rows[0].org_id;
}
