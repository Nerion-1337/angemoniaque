import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { withTransaction } from '../../db/postgres.js';

export const adminRoutes = new OpenAPIHono();

adminRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/player-action',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              characterId: z.string().uuid(),
              isBlocked: z.boolean().optional(),
              teleportTo: z.object({ x: z.number().int(), y: z.number().int() }).optional(),
              addStrength: z.number().int().optional(),
              addGold: z.number().optional(),
            }),
          },
        },
      },
    },
    responses: { 200: { description: 'Modification administrateur appliquée' } },
  }),
  async (c) => {
    const { characterId, isBlocked, teleportTo, addStrength, addGold } = c.req.valid('json');
    return withTransaction(async (client) => {
      if (typeof isBlocked === 'boolean') {
        await client.query('UPDATE game_schema.characters SET is_blocked = $1 WHERE id = $2', [isBlocked, characterId]);
      }
      if (teleportTo) {
        await client.query(
          'UPDATE game_schema.positions SET coord_x = $1, coord_y = $2 WHERE character_id = $3',
          [teleportTo.x, teleportTo.y, characterId]
        );
      }
      if (addStrength || addGold) {
        await client.query(
          'UPDATE game_schema.characters SET strength = strength + $1, gold = gold + $2 WHERE id = $3',
          [addStrength ?? 0, addGold ?? 0, characterId]
        );
      }
      return c.json({ updated: true });
    });
  }
);

adminRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/create-entity',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              entityType: z.enum(['item', 'monster', 'mount', 'spell']),
              name: z.string().min(2),
              powerValue: z.number().int().default(10),
            }),
          },
        },
      },
    },
    responses: { 201: { description: 'Entité créée dans le catalogue SQL' } },
  }),
  async (c) => {
    const { entityType, name, powerValue } = c.req.valid('json');
    return withTransaction(async (client) => {
      if (entityType === 'item') {
        await client.query('INSERT INTO game_schema.items (name, type, armor) VALUES ($1, $2, $3)', [name, 'Équipement', powerValue]);
      } else if (entityType === 'monster') {
        await client.query(
          `INSERT INTO game_schema.monsters (name, hp_max, hp_current, recovery, see, strength, agility, energy_max, energy_current)
           VALUES ($1, $2, $2, 10, 8, $3, $3, 100, 100)`,
          [name, powerValue * 20, powerValue]
        );
      } else if (entityType === 'mount') {
        await client.query('INSERT INTO game_schema.mounts (name, hp_max, armor, bonus_see) VALUES ($1, $2, $3, 1)', [name, powerValue * 10, powerValue]);
      } else {
        await client.query('INSERT INTO game_schema.spells (name, damage) VALUES ($1, $2)', [name, powerValue]);
      }
      return c.json({ created: entityType, name }, 201);
    });
  }
);