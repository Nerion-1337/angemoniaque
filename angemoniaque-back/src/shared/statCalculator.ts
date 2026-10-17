export interface StatCostRuleRow {
  stat_name: string;
  base_xp_cost: number;
  numb_up: number;
  multi_1: number;
  multi_2: number;
  multi_3: number;
}

export function computeStatUpgradeXpCost(rule: StatCostRuleRow, upgradesDone: number): number {
  const tier = Math.floor(upgradesDone / rule.numb_up);
  const mult = tier === 0 ? rule.multi_1 : tier === 1 ? rule.multi_2 : rule.multi_3;
  return Math.ceil(rule.base_xp_cost * mult);
}

// Point 8 : Vérifie si le personnage a droit à l'Énergie Divine selon sa race et son rang
export function canUseDivineEnergy(race: string, rank: string): boolean {
  if (race === 'Nephilime') return true;
  const normalized = (rank || '').toLowerCase();
  return (
    normalized === 'divin' ||
    normalized === 'dieu' ||
    normalized === 'demi-dieu' ||
    normalized === 'seraphin' ||
    normalized === 'séraphin' ||
    normalized === 'titan'
  );
}

// Point 9 : Calcul des dégâts = Arme * (Force - Force nécessaire aux équipements), ou 1 à mains nues
export function computeCharacterDamage(
  characterStrength: number,
  totalRequiredStrengthForGear: number,
  weaponMultiplier: number | null
): number {
  if (!weaponMultiplier || weaponMultiplier <= 0) {
    return 1; // Mains nues : 1 dégât de base
  }
  const effectiveStrength = Math.max(0, characterStrength - totalRequiredStrengthForGear);
  return Math.max(1, weaponMultiplier * effectiveStrength);
}

// Point 11 : Convertit les PV d'un autre joueur en état de forme sans jamais exposer ses PV exacts
export function getPublicHealthState(hpCurrent: number, hpMax: number): string {
  const ratio = hpMax > 0 ? (hpCurrent / hpMax) * 100 : 100;
  if (ratio >= 75) return 'En pleine forme';
  if (ratio >= 50) return 'Bon état';
  if (ratio >= 25) return 'Blessé';
  return 'Souffrant';
}

export function computePactStatTransfer(etherealStrength: number, etherealAgility: number) {
  const humanStrengthBonus = Math.floor(etherealStrength * 0.5);
  const humanAgilityBonus = Math.floor(etherealAgility * 0.5);
  return {
    humanStrengthBonus,
    humanAgilityBonus,
    etherealStrengthPenalty: Math.floor(humanStrengthBonus * 0.5),
    etherealAgilityPenalty: Math.floor(humanAgilityBonus * 0.5),
  };
}

export function hasDivineOverloadRankBonus(ownedDivineItemsCount: number, requiredForNextRank: number): boolean {
  return ownedDivineItemsCount > requiredForNextRank;
}