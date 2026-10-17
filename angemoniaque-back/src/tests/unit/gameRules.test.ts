import { describe, it, expect } from 'vitest';
import { chebyshevDistance, computePathAndEnergy } from '../../shared/gridMath.js';
import { computeStatUpgradeXpCost, computePactStatTransfer, hasDivineOverloadRankBonus } from '../../shared/statCalculator.js';

describe('Règles Unitaires Angemoniaque', () => {
  it('calcule correctement la distance en 8 directions (diagonales incluses)', () => {
    expect(chebyshevDistance({ x: 12, y: 12 }, { x: 15, y: 15 })).toBe(3);
    const path = computePathAndEnergy('monde_des_hommes', { x: 12, y: 12 }, { x: 14, y: 14 });
    expect(path.stepsCount).toBe(2);
    expect(path.totalEnergy).toBeGreaterThan(0);
  });

  it('applique les multiplicateurs multi_1, multi_2, multi_3 de stat_cost_rules', () => {
    const strengthRule = { stat_name: 'strength', base_xp_cost: 50, numb_up: 10, multi_1: 1.0, multi_2: 2.0, multi_3: 3.0 };
    expect(computeStatUpgradeXpCost(strengthRule, 4)).toBe(50);
    expect(computeStatUpgradeXpCost(strengthRule, 12)).toBe(100);
    expect(computeStatUpgradeXpCost(strengthRule, 25)).toBe(150);
  });

  it('calcule le transfert asymétrique de pacte et la surcharge divine', () => {
    const transfer = computePactStatTransfer(24, 16);
    expect(transfer.humanStrengthBonus).toBe(12);
    expect(transfer.etherealStrengthPenalty).toBe(6);
    expect(hasDivineOverloadRankBonus(3, 2)).toBe(true);
  });
});