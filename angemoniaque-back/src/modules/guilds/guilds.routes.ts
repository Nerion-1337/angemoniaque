import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { query } from '../../db/postgres.js';

export const guildsRoutes = new OpenAPIHono();

guildsRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/folders',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              guildId: z.string().uuid(),
              title: z.string().min(2).max(120),
            }),
          },
        },
      },
    },
    responses: { 201: { description: 'Dossier de guilde créé' } },
  }),
  async (c) => {
    const { guildId, title } = c.req.valid('json');
    const rows = await query(
      'INSERT INTO game_schema.guild_folders (guild_id, title) VALUES ($1, $2) RETURNING *',
      [guildId, title]
    );
    return c.json({ folder: rows[0] }, 201);
  }
);