import { serve } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { WebSocketServer } from 'ws';
import { env } from './config/env.js';
import { query } from './db/postgres.js';
import {
  initMultiplayerHub,
  registerPlayerSocket,
  unregisterPlayerSocket,
} from './shared/multiplayerHub.js';
import { charactersRoutes } from './modules/characters/characters.routes.js';
import { mapRoutes } from './modules/map/map.routes.js';
import { pactsFaithRoutes } from './modules/pacts-faith/pactsFaith.routes.js';
import { mountsSummonsRoutes } from './modules/mounts-summons/mountsSummons.routes.js';
import { inventoryCapitalRoutes } from './modules/inventory-capital/inventoryCapital.routes.js';
import { guildsRoutes } from './modules/guilds/guilds.routes.js';
import { chatMessagesRoutes } from './modules/chat-messages/chatMessages.routes.js';
import { historyRoutes } from './modules/history/history.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';

export const app = new OpenAPIHono();

app.use('/*', cors());

app.route('/api/v1/characters', charactersRoutes);
app.route('/api/v1/map', mapRoutes);
app.route('/api/v1/pacts-faith', pactsFaithRoutes);
app.route('/api/v1/mounts-summons', mountsSummonsRoutes);
app.route('/api/v1/inventory-capital', inventoryCapitalRoutes);
app.route('/api/v1/guilds', guildsRoutes);
app.route('/api/v1/chat', chatMessagesRoutes);
app.route('/api/v1/history', historyRoutes);
app.route('/api/v1/admin', adminRoutes);

app.doc('/api/v1/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Angemoniaque Official Multiplayer API',
    version: '1.0.0',
  },
});

if (process.env.NODE_ENV !== 'test') {
  initMultiplayerHub().catch((err) => console.error('Erreur init Redis Multiplayer Hub:', err));

  const server = serve({ fetch: app.fetch, port: env.PORT });
  const wss = new WebSocketServer({ server: server as any, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const characterId = url.searchParams.get('characterId');
    if (!characterId) {
      ws.close();
      return;
    }

    // Récupère la position actuelle et le rayon de vision `see` du personnage sur la carte commune
    const rows = await query<{ map_id: string; coord_x: number; coord_y: number; see: number }>(
      `SELECT p.map_id, p.coord_x, p.coord_y, c.see
       FROM game_schema.positions p
       JOIN game_schema.characters c ON c.id = p.character_id
       WHERE p.character_id = $1`,
      [characterId]
    ).catch(() => []);

    const sessionInfo = rows[0] || {
      map_id: 'default-map-men',
      coord_x: 12,
      coord_y: 12,
      see: 5,
    };

    registerPlayerSocket({
      characterId,
      mapId: sessionInfo.map_id,
      x: sessionInfo.coord_x,
      y: sessionInfo.coord_y,
      seeRadius: sessionInfo.see,
      send: (payload: string) => {
        if (ws.readyState === ws.OPEN) ws.send(payload);
      },
    });

    ws.on('close', () => {
      unregisterPlayerSocket(characterId);
    });
  });
}