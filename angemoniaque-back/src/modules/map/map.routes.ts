import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { withTransaction, logHistoryAction } from '../../db/postgres.js';
import { computePathAndEnergy } from '../../shared/gridMath.js';
import { getSharedMapViewport, movePlayerOnSharedMap } from './sharedMap.service.js';
import { broadcastSharedMapEvent } from '../../shared/multiplayerHub.js';

export const mapRoutes = new OpenAPIHono();

// 1. Lecture du champ de vision `see` sur la carte commune multijoueur
mapRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/vision/:characterId',
    request: { params: z.object({ characterId: z.string().uuid() }) },
    responses: { 200: { description: 'Portion de la carte commune visible par le personnage' } },
  }),
  async (c) => {
    const { characterId } = c.req.valid('param');
    const viewport = await getSharedMapViewport(characterId);
    return c.json(viewport, 200);
  }
);

// 2. Déplacement en 8 directions sur la carte commune + diffusion WebSocket aux joueurs voisins
mapRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/move',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              characterId: z.string().uuid(),
              mapName: z.string().default('monde_des_hommes'),
              startX: z.number().int().min(0).max(24),
              startY: z.number().int().min(0).max(24),
              targetX: z.number().int().min(0).max(24),
              targetY: z.number().int().min(0).max(24),
            }),
          },
        },
      },
    },
    responses: { 200: { description: 'Déplacement validé et diffusé aux joueurs voisins' }, 400: { description: 'Collision ou énergie insuffisante' } },
  }),
  async (c) => {
    const { characterId, mapName, startX, startY, targetX, targetY } = c.req.valid('json');
    const pathCalc = computePathAndEnergy(mapName, { x: startX, y: startY }, { x: targetX, y: targetY });

    try {
      const moveResult = await withTransaction(async (client) => {
        // Décrémente l'énergie de la monture si invoquée, sinon celle du personnage
        const activeMountRes = await client.query(
          `SELECT * FROM game_schema.character_mounts WHERE character_id = $1 AND effect_active = true FOR UPDATE`,
          [characterId]
        );

        if (activeMountRes.rows.length > 0) {
          const mount = activeMountRes.rows[0];
          if (mount.energy_current < pathCalc.totalEnergy) {
            throw new Error('Énergie de la monture insuffisante.');
          }
          await client.query(
            `UPDATE game_schema.character_mounts SET energy_current = energy_current - $1 WHERE character_id = $2 AND mounts_id = $3`,
            [pathCalc.totalEnergy, characterId, mount.mounts_id]
          );
        } else {
          const charRes = await client.query('SELECT * FROM game_schema.characters WHERE id = $1 FOR UPDATE', [characterId]);
          if (!charRes.rows[0] || charRes.rows[0].energy_current < pathCalc.totalEnergy) {
            throw new Error('Énergie du personnage insuffisante.');
          }
          await client.query(
            'UPDATE game_schema.characters SET energy_current = energy_current - $1 WHERE id = $2',
            [pathCalc.totalEnergy, characterId]
          );
        }

        return { usedMountEnergy: activeMountRes.rows.length > 0 };
      });

      // Applique le déplacement sur POSITIONS avec vérification de collision multijoueur + broadcast Redis/WS
      const sharedPos = await movePlayerOnSharedMap(characterId, targetX, targetY, pathCalc.totalEnergy);

      return c.json({
        movedTo: { x: sharedPos.x, y: sharedPos.y },
        mapId: sharedPos.mapId,
        energyCost: pathCalc.totalEnergy,
        usedMountEnergy: moveResult.usedMountEnergy,
      }, 200);
    } catch (err: any) {
      return c.json({ error: err.message || 'Déplacement impossible' }, 400);
    }
  }
);

// 3. Pose d'une structure sur la carte commune (Trajet + Pose) + notification temps réel aux autres joueurs
mapRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/place-building',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              characterId: z.string().uuid(),
              buildingName: z.string(),
              targetX: z.number().int().min(0).max(24),
              targetY: z.number().int().min(0).max(24),
              totalEnergyCost: z.number().int().min(1),
            }),
          },
        },
      },
    },
    responses: { 201: { description: 'Structure posée sur la carte commune et visible par tous les joueurs' } },
  }),
  async (c) => {
    const { characterId, buildingName, targetX, targetY, totalEnergyCost } = c.req.valid('json');

    return withTransaction(async (client) => {
      const charPosRes = await client.query(
        `SELECT p.map_id, c.pseudo FROM game_schema.positions p
         JOIN game_schema.characters c ON c.id = p.character_id
         WHERE p.character_id = $1 FOR UPDATE`,
        [characterId]
      );
      const { map_id, pseudo } = charPosRes.rows[0];

      await client.query(
        'UPDATE game_schema.characters SET energy_current = GREATEST(0, energy_current - $1) WHERE id = $2',
        [totalEnergyCost, characterId]
      );

      const bldRes = await client.query(
        `INSERT INTO game_schema.buildings (name, type, hp_max, armor, blocks_cell, is_invulnerable)
         VALUES ($1, 'PlayerStructure', 400, 20, false, false)
         ON CONFLICT (name) DO UPDATE SET hp_max = EXCLUDED.hp_max
         RETURNING id`,
        [`${buildingName}_${targetX}_${targetY}`]
      );

      await client.query(
        `INSERT INTO game_schema.positions (map_id, coord_x, coord_y, building_id, effect_active)
         VALUES ($1, $2, $3, $4, true)`,
        [map_id, targetX, targetY, bldRes.rows[0].id]
      );

      await logHistoryAction(client, characterId, null, pseudo, buildingName, `Pose de ${buildingName} en (${targetX},${targetY})`);

      // Diffuse en direct l'apparition du bâtiment sur la carte commune aux joueurs à portée de vue
      await broadcastSharedMapEvent({
        type: 'BUILDING_PLACED',
        mapId: map_id,
        originX: targetX,
        originY: targetY,
        actorId: characterId,
        actorPseudo: pseudo,
        data: { buildingId: bldRes.rows[0].id, name: buildingName, x: targetX, y: targetY },
      });

      return c.json({ placed: true, x: targetX, y: targetY }, 201);
    });
  }
);