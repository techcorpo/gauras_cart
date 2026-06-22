// PostgreSQL (Supabase) connection pool — reused across serverless invocations.
import { Pool } from 'pg';

let pool = global._pgPool;
if (!pool) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
  });
  global._pgPool = pool;
}

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
export default pool;
