import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { withTransaction } from '../../db/postgres.js';

export const mountsSummonsRoutes = new OpenAPIHono();

mountsSummonsRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/mount/toggle',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              characterId: z.string().uuid(),
              mountId: z.string().uuid(),
              summon: z.boolean(),
            }),
          },
        },
      },
    },
    responses: { 200: { description: 'État d’invocation de la monture mis à jour' } },
  }),
  async (c) => {
    const { characterId, mountId, summon } = c.req.valid('json');
    return withTransaction(async (client) => {
      await client.query(
        'UPDATE game_schema.character_mounts SET effect_active = false WHERE character_id = $1',
        [characterId]
      );
      if (summon) {
        await client.query(
          `UPDATE game_schema.character_mounts
           SET effect_active = true
           WHERE character_id = $1 AND mounts_id = $2`,
          [characterId, mountId]
        );
      }
      return c.json({ characterId, mountId, mountedAndSummoned: summon });
    });
  }
);