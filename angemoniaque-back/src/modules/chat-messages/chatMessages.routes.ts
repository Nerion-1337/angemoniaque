import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { pushVisionMessage, pushGuildMessage } from '../../db/redis.js';
import { query } from '../../db/postgres.js';
import { broadcastSharedMapEvent } from '../../shared/multiplayerHub.js';

export const chatMessagesRoutes = new OpenAPIHono();

chatMessagesRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/send',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              channel: z.enum(['vision', 'guild', 'mail']),
              senderId: z.string().uuid(),
              senderPseudo: z.string(),
              mapId: z.string().optional(),
              mapName: z.string().optional(),
              x: z.number().int().optional(),
              y: z.number().int().optional(),
              guildId: z.string().uuid().optional(),
              conversationId: z.string().uuid().optional(),
              content: z.string().min(1).max(1000),
            }),
          },
        },
      },
    },
    responses: { 200: { description: 'Message enregistré et diffusé en temps réel' } },
  }),
  async (c) => {
    const body = c.req.valid('json');
    if (body.channel === 'vision') {
      const msgEntry = {
        id: `${Date.now()}`,
        sender: body.senderPseudo,
        x: body.x ?? 12,
        y: body.y ?? 12,
        text: body.content,
        createdAt: Date.now(),
      };
      // 1. Persistance Redis avec TTL de 12h (43200s)
      await pushVisionMessage(body.mapName ?? 'monde_des_hommes', msgEntry);

      // 2. Diffusion WebSocket immédiate aux joueurs dont le champ de vision `see` couvre (x, y)
      await broadcastSharedMapEvent({
        type: 'VISION_CHAT',
        mapId: body.mapId ?? 'default-map-men',
        originX: msgEntry.x,
        originY: msgEntry.y,
        actorId: body.senderId,
        actorPseudo: body.senderPseudo,
        data: msgEntry,
      });
    } else if (body.channel === 'guild') {
      await pushGuildMessage(body.guildId ?? 'default-guild', {
        id: `${Date.now()}`,
        sender: body.senderPseudo,
        time: new Date().toTimeString().slice(0, 5),
        text: body.content,
      });
    } else if (body.conversationId) {
      await query(
        'INSERT INTO game_schema.messages (id_conversation, characters_id, content) VALUES ($1, $2, $3)',
        [body.conversationId, body.senderId, body.content]
      );
    }
    return c.json({ sent: true, channel: body.channel });
  }
);