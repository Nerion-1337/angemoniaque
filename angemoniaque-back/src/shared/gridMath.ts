export interface Coord {
  x: number;
  y: number;
}

export function chebyshevDistance(a: Coord, b: Coord): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function isInsideVision(center: Coord, target: Coord, seeRadius: number): boolean {
  return chebyshevDistance(center, target) <= seeRadius;
}

export function getTileTerrainCost(mapName: string, x: number, y: number): {
  type: string;
  biome: 'water' | 'lake' | 'road' | 'mountain' | 'forest' | 'plain' | 'hill';
  cost: number;
  resource: string | null;
} {
  const distFromCenter = Math.hypot(x - 12, y - 12);
  if (distFromCenter > 11.8) {
    return { type: 'Mer / Abysses', biome: 'water', cost: 6, resource: 'Perle Abyssale' };
  }
  if (Math.hypot(x - 7, y - 8) < 2.6 || (x === 8 && y >= 8 && y <= 14)) {
    return { type: 'Lac & Rivière d’Argent', biome: 'lake', cost: 3, resource: 'Eau Pure' };
  }
  if ((x === 12 && y >= 6 && y <= 18) || (y === 12 && x >= 6 && x <= 18)) {
    return { type: 'Route Pavée', biome: 'road', cost: 1, resource: null };
  }
  if (Math.hypot(x - 17, y - 6) < 3.4 || Math.hypot(x - 18, y - 17) < 3.2) {
    return { type: 'Massif Rocheux Escarpé', biome: 'mountain', cost: 4, resource: 'Or Pur' };
  }
  if (Math.hypot(x - 6, y - 15) < 4.2 || Math.hypot(x - 15, y - 15) < 2.8) {
    return { type: 'Forêt Ancienne', biome: 'forest', cost: 2, resource: 'Bois Runique' };
  }
  const seed = Math.abs(Math.sin(x * 12.9898 + y * 78.233 + (mapName === 'monde_des_hommes' ? 1 : 2)) * 43758.5453);
  const r = seed - Math.floor(seed);
  if (r < 0.65) {
    return { type: 'Plaine Verdoyante', biome: 'plain', cost: 1, resource: r < 0.15 ? 'Herbes Mystiques' : null };
  }
  if (r < 0.85) {
    return { type: 'Forêt Clairsemée', biome: 'forest', cost: 2, resource: 'Bois Runique' };
  }
  return { type: 'Colline de Cristal', biome: 'hill', cost: 3, resource: 'Minerai d’Éther' };
}

export function computePathAndEnergy(mapName: string, start: Coord, target: Coord) {
  let cx = start.x;
  let cy = start.y;
  let totalEnergy = 0;
  const steps: Array<{ x: number; y: number; cost: number }> = [];
  let guard = 0;

  while ((cx !== target.x || cy !== target.y) && guard < 60) {
    guard++;
    cx += Math.sign(target.x - cx);
    cy += Math.sign(target.y - cy);
    const tile = getTileTerrainCost(mapName, cx, cy);
    totalEnergy += tile.cost;
    steps.push({ x: cx, y: cy, cost: tile.cost });
  }
  return { stepsCount: steps.length, totalEnergy, steps };
}