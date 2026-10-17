import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { query } from '../../db/postgres.js';

export const historyRoutes = new OpenAPIHono();

historyRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/:characterId',
    request: { params: z.object({ characterId: z.string().uuid() }) },
    responses: { 200: { description: '100 dernières entrées de HISTORY_ACTION' } },
  }),
  async (c) => {
    const { characterId } = c.req.valid('param');
    const logs = await query(
      `SELECT * FROM game_schema.history_action
       WHERE id_source = $1 OR id_cible = $1
       ORDER BY id_log DESC
       LIMIT 100`,
      [characterId]
    );
    return c.json({ logs });
  }
);