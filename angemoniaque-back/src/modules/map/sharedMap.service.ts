import { withTransaction } from '../../db/postgres.js';
import { broadcastSharedMapEvent, updatePlayerSocketPosition } from '../../shared/multiplayerHub.js';

// Récupère toutes les cases et toutes les entités (autres joueurs, monstres, bâtiments, objets)
// présentes sur la carte commune dans le rayon de vision `see` du joueur
export async function getSharedMapViewport(characterId: string) {
  return withTransaction(async (client) => {
    const actorPosRes = await client.query(
      `SELECT p.map_id, p.coord_x, p.coord_y, c.see, c.pseudo, m.name_file, m.width, m.height
       FROM game_schema.positions p
       JOIN game_schema.characters c ON c.id = p.character_id
       JOIN game_schema.maps m ON m.id = p.map_id
       WHERE p.character_id = $1`,
      [characterId]
    );

    if (!actorPosRes.rows[0]) {
      throw new Error('Position du personnage introuvable sur la carte commune');
    }

    const { map_id, coord_x, coord_y, see, name_file, width, height } = actorPosRes.rows[0];

    // 1. Topographie commune (forêts, montagnes, lacs, ressources) dans le champ de vision
    const tilesRes = await client.query(
      `SELECT coord_x, coord_y, terrain_type, move_cost, resource_type
       FROM game_schema.map_tiles
       WHERE map_id = $1
         AND ABS(coord_x - $2) <= $4
         AND ABS(coord_y - $3) <= $4`,
      [map_id, coord_x, coord_y, see]
    );

    // 2. Toutes les entités partagées (autres joueurs, boss, structures construites, objets) dans le champ de vision
    const sharedEntitiesRes = await client.query(
      `SELECT
         p.id AS position_id,
         p.coord_x,
         p.coord_y,
         p.character_id,
         c.pseudo AS character_pseudo,
         c.race AS character_race,
         c.rank AS character_rank,
         c.hp_current AS character_hp,
         c.hp_max AS character_hp_max,
         p.monsters_id,
         mo.name AS monster_name,
         mo.hp_current AS monster_hp,
         mo.hp_max AS monster_hp_max,
         p.building_id,
         b.name AS building_name,
         b.type AS building_type,
         b.blocks_cell,
         b.is_invulnerable
       FROM game_schema.positions p
       LEFT JOIN game_schema.characters c ON c.id = p.character_id
       LEFT JOIN game_schema.monsters mo ON mo.id = p.monsters_id
       LEFT JOIN game_schema.buildings b ON b.id = p.building_id
       WHERE p.map_id = $1
         AND p.effect_active = true
         AND ABS(p.coord_x - $2) <= $4
         AND ABS(p.coord_y - $3) <= $4`,
      [map_id, coord_x, coord_y, see]
    );

    return {
      mapId: map_id,
      mapName: name_file,
      dimensions: { width, height },
      center: { x: coord_x, y: coord_y },
      seeRadius: see,
      tiles: tilesRes.rows,
      sharedEntities: sharedEntitiesRes.rows,
    };
  });
}

// Déplace un joueur sur la carte commune en vérifiant qu'aucun autre joueur ou bâtiment bloquant n'occupe la case cible
export async function movePlayerOnSharedMap(
  characterId: string,
  targetX: number,
  targetY: number,
  energyCost: number
) {
  return withTransaction(async (client) => {
    const posRes = await client.query(
      `SELECT p.map_id, c.pseudo, c.see
       FROM game_schema.positions p
       JOIN game_schema.characters c ON c.id = p.character_id
       WHERE p.character_id = $1 FOR UPDATE`,
      [characterId]
    );
    const { map_id, pseudo, see } = posRes.rows[0];

    // Vérification de collision sur la carte commune (autre joueur, monstre ou bâtiment avec blocks_cell = true)
    const collisionRes = await client.query(
      `SELECT p.id, b.blocks_cell, b.is_invulnerable
       FROM game_schema.positions p
       LEFT JOIN game_schema.buildings b ON b.id = p.building_id
       WHERE p.map_id = $1 AND p.coord_x = $2 AND p.coord_y = $3 AND p.effect_active = true
       FOR UPDATE`,
      [map_id, targetX, targetY]
    );

    const blockingEntity = collisionRes.rows.find(
      (row) => row.blocks_cell !== true ? false : !row.is_invulnerable
    );
    if (blockingEntity) {
      throw new Error('Cette case est déjà occupée sur la carte commune.');
    }

    await client.query(
      `UPDATE game_schema.positions
       SET coord_x = $1, coord_y = $2
       WHERE character_id = $3`,
      [targetX, targetY, characterId]
    );

    updatePlayerSocketPosition(characterId, map_id, targetX, targetY, see);

    // Diffuse le déplacement en temps réel à tous les joueurs voisins sur la carte commune
    await broadcastSharedMapEvent({
      type: 'PLAYER_MOVED',
      mapId: map_id,
      originX: targetX,
      originY: targetY,
      actorId: characterId,
      actorPseudo: pseudo,
      data: { x: targetX, y: targetY, energyCost },
    });

    return { mapId: map_id, x: targetX, y: targetY };
  });
}