export interface TileCoord {
  x: number;
  y: number;
}

export interface TileInfo {
  type: string;
  biome: 'water' | 'lake' | 'road' | 'mountain' | 'forest' | 'plain' | 'hill';
  cost: number;
  resource: string | null;
  color: string;
  elevation: number;
}

export function computeChebyshevSteps(from: TileCoord, to: TileCoord): TileCoord[] {
  const path: TileCoord[] = [];
  let cx = from.x;
  let cy = from.y;
  let guard = 0;
  while ((cx !== to.x || cy !== to.y) && guard < 60) {
    guard++;
    cx += Math.sign(to.x - cx);
    cy += Math.sign(to.y - cy);
    path.push({ x: cx, y: cy });
  }
  return path;
}

export function getTileData(mapKey: string, x: number, y: number): TileInfo {
  const distFromCenter = Math.hypot(x - 12, y - 12);
  if (distFromCenter > 11.8) {
    return { type: 'Mer / Abysses', biome: 'water', cost: 6, resource: 'Perle Abyssale', color: '#1e3a8a', elevation: 0.04 };
  }
  if (Math.hypot(x - 7, y - 8) < 2.6 || (x === 8 && y >= 8 && y <= 14)) {
    return { type: 'Lac & Rivière d’Argent', biome: 'lake', cost: 3, resource: 'Eau Pure', color: '#0284c7', elevation: 0.05 };
  }
  if ((x === 12 && y >= 6 && y <= 18) || (y === 12 && x >= 6 && x <= 18)) {
    return { type: 'Route Pavée', biome: 'road', cost: 1, resource: null, color: '#9ca3af', elevation: 0.08 };
  }
  if (Math.hypot(x - 17, y - 6) < 3.4 || Math.hypot(x - 18, y - 17) < 3.2) {
    return { type: 'Massif Rocheux Escarpé', biome: 'mountain', cost: 4, resource: 'Or Pur', color: '#64748b', elevation: 0.55 };
  }
  if (Math.hypot(x - 6, y - 15) < 4.2 || Math.hypot(x - 15, y - 15) < 2.8) {
    return {
      type: 'Forêt Ancienne',
      biome: 'forest',
      cost: 2,
      resource: 'Bois Runique',
      color: mapKey === 'men' ? '#166534' : '#432854',
      elevation: 0.24,
    };
  }
  const seed = Math.abs(Math.sin(x * 12.9898 + y * 78.233 + (mapKey === 'men' ? 1 : mapKey === 'ethereal' ? 2 : 3)) * 43758.5453);
  const r = seed - Math.floor(seed);
  if (r < 0.65) {
    return {
      type: 'Plaine Verdoyante',
      biome: 'plain',
      cost: 1,
      resource: r < 0.15 ? 'Herbes Mystiques' : null,
      color: mapKey === 'men' ? '#4d7c3f' : mapKey === 'ethereal' ? '#634375' : '#3d4252',
      elevation: 0.12,
    };
  }
  if (r < 0.85) {
    return {
      type: 'Forêt Clairsemée',
      biome: 'forest',
      cost: 2,
      resource: 'Bois Runique',
      color: mapKey === 'men' ? '#2d5428' : '#4c1d95',
      elevation: 0.22,
    };
  }
  return { type: 'Colline de Cristal', biome: 'hill', cost: 3, resource: 'Minerai d’Éther', color: '#5c6bc0', elevation: 0.38 };
}

export function computePathEnergy(mapKey: string, startX: number, startY: number, targetX: number, targetY: number) {
  if (startX === targetX && startY === targetY) return { steps: 0, energy: 0, path: [] };
  let cx = startX;
  let cy = startY;
  let totalEnergy = 0;
  const path: Array<{ x: number; y: number; cost: number }> = [];
  let guard = 0;
  while ((cx !== targetX || cy !== targetY) && guard < 50) {
    guard++;
    cx += Math.sign(targetX - cx);
    cy += Math.sign(targetY - cy);
    const tile = getTileData(mapKey, cx, cy);
    totalEnergy += tile.cost;
    path.push({ x: cx, y: cy, cost: tile.cost });
  }
  return { steps: path.length, energy: totalEnergy, path };
}