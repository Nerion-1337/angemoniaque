import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { withTransaction } from '../../db/postgres.js';

export const inventoryCapitalRoutes = new OpenAPIHono();

// Achat d'un espace supplémentaire dans le coffre personnel (coût progressif, 0 énergie)
inventoryCapitalRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/capital/expand-chest',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              characterId: z.string().uuid(),
            }),
          },
        },
      },
    },
    responses: { 200: { description: 'Coffre agrandi (0 énergie)' }, 400: { description: 'Or insuffisant' } },
  }),
  async (c) => {
    const { characterId } = c.req.valid('json');
    return withTransaction(async (client) => {
      const charRes = await client.query('SELECT * FROM game_schema.characters WHERE id = $1 FOR UPDATE', [characterId]);
      const char = charRes.rows[0];
      const progressiveGoldCost = (char.chest_capacity ?? 10) * 25;

      if (char.gold < progressiveGoldCost) {
        return c.json({ error: `Or insuffisant (${progressiveGoldCost} Or requis).` }, 400);
      }

      const updated = await client.query(
        `UPDATE game_schema.characters
         SET gold = gold - $1, chest_capacity = chest_capacity + 5
         WHERE id = $2 RETURNING chest_capacity, gold`,
        [progressiveGoldCost, characterId]
      );

      return c.json({
        newChestCapacity: updated.rows[0].chest_capacity,
        remainingGold: updated.rows[0].gold,
        energyCost: 0,
      }, 200);
    });
  }
);