import pg, { PoolClient, QueryResultRow } from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

export const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function query<T extends QueryResultRow = any>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await pgPool.query<T>(sql, params);
  return result.rows;
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET search_path TO game_schema, public');
    const data = await callback(client);
    await client.query('COMMIT');
    return data;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function logHistoryAction(
  client: PoolClient | typeof pgPool,
  sourceId: string | null,
  targetId: string | null,
  sourceName: string,
  targetName: string,
  actionText: string,
  objectId: string | null = null
) {
  await client.query(
    `INSERT INTO game_schema.history_action (id_source, id_cible, id_object, source, cible, action, effect_active)
     VALUES ($1, $2, $3, $4, $5, $6, true)`,
    [sourceId, targetId, objectId, sourceName, targetName, actionText]
  );
}