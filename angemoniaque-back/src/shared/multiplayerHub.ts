import { createClient } from 'redis';
import { env } from '../config/env.js';
import { isInsideVision } from './gridMath.js';

interface ConnectedSession {
  characterId: string;
  mapId: string;
  x: number;
  y: number;
  seeRadius: number;
  send: (payload: string) => void;
}

const activeSessions = new Map<string, ConnectedSession>();
const pubClient = createClient({ url: env.REDIS_URL });
const subClient = createClient({ url: env.REDIS_URL });

export interface MapBroadcastEvent {
  type: 'PLAYER_MOVED' | 'BUILDING_PLACED' | 'COMBAT_HIT' | 'VISION_CHAT' | 'DIVINE_ITEM_LOOTED';
  mapId: string;
  originX: number;
  originY: number;
  actorId: string;
  actorPseudo: string;
  data: Record<string, unknown>;
}

export async function initMultiplayerHub() {
  if (!pubClient.isOpen) await pubClient.connect();
  if (!subClient.isOpen) await subClient.connect();

  await subClient.subscribe('angemoniaque:shared_map_events', (rawMessage) => {
    const event: MapBroadcastEvent = JSON.parse(rawMessage);

    // Notifie uniquement les joueurs présents sur la même carte et dont le champ de vision (see) couvre l'action
    for (const session of activeSessions.values()) {
      if (session.mapId !== event.mapId) continue;
      const canSeeEvent = isInsideVision(
        { x: session.x, y: session.y },
        { x: event.originX, y: event.originY },
        session.seeRadius
      );
      if (canSeeEvent) {
        session.send(JSON.stringify(event));
      }
    }
  });
}

export function registerPlayerSocket(session: ConnectedSession) {
  activeSessions.set(session.characterId, session);
}

export function updatePlayerSocketPosition(characterId: string, mapId: string, x: number, y: number, seeRadius: number) {
  const current = activeSessions.get(characterId);
  if (current) {
    current.mapId = mapId;
    current.x = x;
    current.y = y;
    current.seeRadius = seeRadius;
  }
}

export function unregisterPlayerSocket(characterId: string) {
  activeSessions.delete(characterId);
}

export async function broadcastSharedMapEvent(event: MapBroadcastEvent) {
  if (!pubClient.isOpen) await pubClient.connect();
  await pubClient.publish('angemoniaque:shared_map_events', JSON.stringify(event));
}