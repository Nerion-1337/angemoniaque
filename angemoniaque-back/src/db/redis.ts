import { createClient } from 'redis';
import { env } from '../config/env.js';

export const redisClient = createClient({ url: env.REDIS_URL });

export async function ensureRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

export interface VisionChatEntry {
  id: string;
  sender: string;
  x: number;
  y: number;
  text: string;
  createdAt: number;
}

// Durée de vie de 12h (43200 secondes) pour les messages du champ de vision
export async function pushVisionMessage(mapName: string, entry: VisionChatEntry) {
  await ensureRedis();
  const key = `vision:${mapName}:${entry.id}`;
  await redisClient.set(key, JSON.stringify(entry), { EX: 43200 });
}

export async function getVisionMessagesInRadius(
  mapName: string,
  centerX: number,
  centerY: number,
  seeRadius: number
): Promise<VisionChatEntry[]> {
  await ensureRedis();
  const keys = await redisClient.keys(`vision:${mapName}:*`);
  const results: VisionChatEntry[] = [];
  for (const key of keys) {
    const raw = await redisClient.get(key);
    if (!raw) continue;
    const parsed: VisionChatEntry = JSON.parse(raw);
    const dist = Math.max(Math.abs(parsed.x - centerX), Math.abs(parsed.y - centerY));
    if (dist <= seeRadius) {
      results.push(parsed);
    }
  }
  return results.sort((a, b) => a.createdAt - b.createdAt);
}

// Limité aux 100 derniers messages pour la guilde (les nouveaux effacent les anciens)
export async function pushGuildMessage(guildId: string, entry: { id: string; sender: string; time: string; text: string }) {
  await ensureRedis();
  const key = `guild:chat:${guildId}`;
  await redisClient.lPush(key, JSON.stringify(entry));
  await redisClient.lTrim(key, 0, 99);
}

export async function getGuildMessages(guildId: string) {
  await ensureRedis();
  const rawList = await redisClient.lRange(`guild:chat:${guildId}`, 0, 99);
  return rawList.map((item) => JSON.parse(item)).reverse();
}