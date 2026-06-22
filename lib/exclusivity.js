// Society-exclusivity rules.
//
// A distributor stores the society it belongs to in organizations.society_code.
// A manufacturer stores its own society_code + is_exclusive.
//
// If a distributor's society has ANY exclusive manufacturer (is_exclusive=true),
// the distributor is "locked" to that society: it may only partner with /
// sell products from manufacturers in that same society.
import { query } from './db';

// Returns { exclusive: boolean, society_code: string|null } for a distributor org.
export async function distributorScope(distributorOrgId) {
  const d = await query('SELECT society_code FROM organizations WHERE id=$1', [distributorOrgId]);
  const society = (d.rows[0] && d.rows[0].society_code) || null;
  if (!society) return { exclusive: false, society_code: null };
  const ex = await query(
    `SELECT 1 FROM organizations
      WHERE type='manufacturer' AND society_code=$1 AND is_exclusive=true LIMIT 1`,
    [society]);
  return { exclusive: ex.rowCount > 0, society_code: society };
}

// SQL fragment usable inside a product/distributor query that joins a distributor
// org (alias `distAlias`) and a manufacturer org (alias `mfrAlias`).
// Keeps rows only when exclusivity allows it. No bound params needed.
export function exclusivityWhereSQL(distAlias, mfrAlias) {
  return `(
    ${distAlias}.society_code IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM organizations xm
       WHERE xm.type='manufacturer'
         AND xm.society_code = ${distAlias}.society_code
         AND xm.is_exclusive = true
    )
    OR ${mfrAlias}.society_code = ${distAlias}.society_code
  )`;
}
