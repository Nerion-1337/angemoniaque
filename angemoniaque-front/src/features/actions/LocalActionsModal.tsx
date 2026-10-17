import React, { useState } from 'react';
import { Castle, Sword, Sparkles, Hammer, Pickaxe, Compass, Dices } from 'lucide-react';

interface LocalActionsModalProps {
  currentActor: any;
  entities: any[];
  summonedMonsters: any[];
  activeMount: any;
  maxSummons: number;
  isTileBlocked: (mapKey: string, x: number, y: number) => any;
  computeHitChance: (attackerAgi: number, defenderAgi: number) => number;
  attackerAgility: number;
  onInteractBuilding: (buildingEntity: any) => void;
  onAttackEntity: (targetEntity: any, useMountBreath: boolean) => void;
  onCastSpellOnTile: (
    spell: { id: string; name: string; type: 'summon' | 'buff' | 'attack' | 'summon_cap'; cost: number; desc: string },
    targetCoord: { x: number; y: number }
  ) => void;
  onHarvestLocal: () => void;
  onPlaceBuildingOnTile: (buildingName: string, targetCoord: { x: number; y: number }) => void;
}

const AVAILABLE_SPELLS = [
  { id: 'sp-golem', name: 'Invocation : Golem d’Éther', type: 'summon' as const, cost: 15, desc: 'Invoque un Golem contrôlable sur la case adjacente libre sélectionnée.' },
  { id: 'sp-cap', name: 'Sort : Lien d’Invocateur (+1 Invoc. Max)', type: 'summon_cap' as const, cost: 20, desc: 'Augmente de +1 votre limite maximale d’invocations simultanées.' },
  { id: 'sp-fureur', name: 'Sort : Fureur Céleste', type: 'buff' as const, cost: 10, desc: 'Augmente temporairement la Force (+4) et l’Agilité (+4).' },
  { id: 'sp-trait', name: 'Sort : Trait de Lumière / Soufre', type: 'attack' as const, cost: 12, desc: 'Inflige 45 dégâts magiques sur la case ciblée.' },
];

export const LocalActionsModal: React.FC<LocalActionsModalProps> = ({
  currentActor,
  entities,
  summonedMonsters,
  activeMount,
  maxSummons,
  isTileBlocked,
  computeHitChance,
  attackerAgility,
  onInteractBuilding,
  onAttackEntity,
  onCastSpellOnTile,
  onHarvestLocal,
  onPlaceBuildingOnTile,
}) => {
  // Grille 3x3 des cases qui entourent le personnage (Point 6)
  const surroundingOffsets = [
    { dx: -1, dy: -1, label: 'NO' },
    { dx: 0, dy: -1, label: 'N' },
    { dx: 1, dy: -1, label: 'NE' },
    { dx: -1, dy: 0, label: 'O' },
    { dx: 0, dy: 0, label: 'Centre' },
    { dx: 1, dy: 0, label: 'E' },
    { dx: -1, dy: 1, label: 'SO' },
    { dx: 0, dy: 1, label: 'S' },
    { dx: 1, dy: 1, label: 'SE' },
  ];

  // Sélection par défaut de la première case adjacente libre
  const firstFree = surroundingOffsets
    .filter((o) => !(o.dx === 0 && o.dy === 0))
    .map((o) => ({ x: currentActor.x + o.dx, y: currentActor.y + o.dy }))
    .find((coord) => !isTileBlocked(currentActor.map, coord.x, coord.y)) || {
    x: currentActor.x + 1,
    y: currentActor.y,
  };

  const [selectedTargetCoord, setSelectedTargetCoord] = useState<{ x: number; y: number }>(firstFree);
  const selectedBlocker = isTileBlocked(currentActor.map, selectedTargetCoord.x, selectedTargetCoord.y);

  const nearbyBuildings = entities.filter(
    (e) =>
      e.map === currentActor.map &&
      e.kind === 'building' &&
      Math.max(Math.abs(e.x - currentActor.x), Math.abs(e.y - currentActor.y)) <= 1
  );

  const attackRange = 1 + (activeMount?.summoned ? activeMount.bonus_range : 0);
  const nearbyTargets = entities.filter(
    (e) =>
      e.map === currentActor.map &&
      (e.kind === 'player' || e.kind === 'monster') &&
      Math.max(Math.abs(e.x - currentActor.x), Math.abs(e.y - currentActor.y)) <= Math.max(2, attackRange)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
      {/* Point 6 : Sélecteur visuel 3x3 de la case adjacente sur laquelle agir */}
      <div className="md:col-span-5 bg-slate-800/80 border border-amber-500/50 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-sm text-amber-300 flex items-center gap-2">
          <Compass className="w-4 h-4" /> 1. Choisir la Case Adjacente Cible
        </h3>
        <p className="text-[11px] text-slate-300">
          Sélectionnez la case autour de vous sur laquelle poser une structure ou invoquer une entité (les cases occupées sont interdites pour bâtir ou invoquer).
        </p>

        <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto pt-1">
          {surroundingOffsets.map((off) => {
            const tx = currentActor.x + off.dx;
            const ty = currentActor.y + off.dy;
            const isCenter = off.dx === 0 && off.dy === 0;
            const blocker = isCenter ? currentActor : isTileBlocked(currentActor.map, tx, ty);
            const isChosen = selectedTargetCoord.x === tx && selectedTargetCoord.y === ty;

            if (isCenter) {
              return (
                <div
                  key="center"
                  className="h-16 rounded-xl bg-sky-900/50 border-2 border-sky-400 flex flex-col items-center justify-center text-center p-1"
                >
                  <span className="text-[9px] font-bold text-sky-300">VOUS</span>
                  <span className="text-[10px] font-extrabold text-white">({tx},{ty})</span>
                </div>
              );
            }

            return (
              <button
                key={`${tx}-${ty}`}
                onClick={() => setSelectedTargetCoord({ x: tx, y: ty })}
                className={`h-16 rounded-xl border-2 p-1 flex flex-col items-center justify-center transition ${
                  isChosen
                    ? 'bg-amber-500 text-slate-950 border-white scale-105 shadow-lg font-extrabold'
                    : blocker
                    ? 'bg-rose-950/60 border-rose-500/50 text-rose-200 hover:border-rose-400'
                    : 'bg-slate-900 border-emerald-500/40 text-emerald-200 hover:border-emerald-300'
                }`}
              >
                <span className="text-[10px] font-bold">
                  {off.label} ({tx},{ty})
                </span>
                <span className="text-[9px] truncate w-full text-center">
                  {blocker ? `Occupée (${blocker.name})` : 'Libre ✓'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-center">
          Case ciblée : <b className="text-amber-300">({selectedTargetCoord.x}, {selectedTargetCoord.y})</b> —{' '}
          {selectedBlocker ? (
            <span className="text-rose-400 font-bold">Occupée par {selectedBlocker.name} (Construction/Invocation bloquée)</span>
          ) : (
            <span className="text-emerald-400 font-bold">Case Libre (Construction & Invocation autorisées)</span>
          )}
        </div>

        {/* Construction sur la case adjacente sélectionnée */}
        <div className="pt-2 border-t border-slate-700 space-y-2">
          <div className="font-bold text-emerald-300 flex items-center gap-1.5">
            <Hammer className="w-4 h-4" /> Poser une Structure en ({selectedTargetCoord.x}, {selectedTargetCoord.y})
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['Muraille de Pierre', 'Tour de Garde', 'Usine de Production', 'Totem de Zone'].map((bName) => (
              <button
                key={bName}
                disabled={Boolean(selectedBlocker)}
                onClick={() => onPlaceBuildingOnTile(bName, selectedTargetCoord)}
                className={`py-2 px-2 rounded-lg font-bold text-[11px] transition ${
                  selectedBlocker
                    ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                }`}
              >
                {bName} (10 Én.)
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Colonne droite : Sorts/Invocations sur la case choisie, Bâtiments adjacents & Combat */}
      <div className="md:col-span-7 space-y-4">
        {/* Sorts & Invocations sur la case choisie */}
        <div className="bg-slate-800/80 border border-purple-500/40 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 2. Sorts & Invocations vers ({selectedTargetCoord.x}, {selectedTargetCoord.y})
            </h3>
            <span className="text-[11px] text-cyan-300 font-bold">
              Invocations : {summonedMonsters.length}/{maxSummons} max
            </span>
          </div>
          {AVAILABLE_SPELLS.map((sp) => {
            const isSummonSpell = sp.type === 'summon';
            const summonBlocked = isSummonSpell && (Boolean(selectedBlocker) || summonedMonsters.length >= maxSummons);

            return (
              <div key={sp.id} className="p-2.5 bg-slate-900 rounded-lg flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-purple-200">{sp.name}</div>
                  <div className="text-[10px] text-slate-400">{sp.desc}</div>
                  {isSummonSpell && summonedMonsters.length >= maxSummons && (
                    <div className="text-[10px] text-rose-400 font-bold">
                      Limite d’invocation atteinte ({maxSummons} max). Équipez un objet ou lancez Lien d’Invocateur.
                    </div>
                  )}
                </div>
                <button
                  disabled={summonBlocked}
                  onClick={() => onCastSpellOnTile(sp, selectedTargetCoord)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg font-bold ${
                    summonBlocked
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  Lancer ({sp.cost} Én.)
                </button>
              </div>
            );
          })}
        </div>

        {/* Bâtiments adjacents (Hôtel de ville / Portails) */}
        <div className="bg-slate-800/80 border border-amber-500/40 rounded-xl p-4 space-y-2">
          <h3 className="font-bold text-sm text-amber-300 flex items-center gap-2">
            <Castle className="w-4 h-4" /> 3. Bâtiments adjacents & Récolte
          </h3>
          {nearbyBuildings.map((b) => (
            <div key={b.id} className="p-2.5 bg-slate-900 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-white">{b.name}</div>
                <div className="text-[10px] text-slate-400">Case ({b.x}, {b.y})</div>
              </div>
              <button
                onClick={() => onInteractBuilding(b)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg"
              >
                Interagir (0 Énergie)
              </button>
            </div>
          ))}
          <button
            onClick={onHarvestLocal}
            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5"><Pickaxe className="w-4 h-4" /> Récolter la ressource sous vos pieds</span>
            <span>4 Énergie</span>
          </button>
        </div>

        {/* Cibles à portée avec aperçu de la chance de toucher (Agilité) */}
        <div className="bg-slate-800/80 border border-rose-500/40 rounded-xl p-4 space-y-2">
          <h3 className="font-bold text-sm text-rose-300 flex items-center gap-2">
            <Sword className="w-4 h-4" /> 4. Cibles à portée d’attaque ({nearbyTargets.length})
          </h3>
          {nearbyTargets.length > 0 ? (
            nearbyTargets.map((t) => {
              const hitPct = computeHitChance(attackerAgility, t.agility || 10);
              return (
                <div key={t.id} className="p-2.5 bg-slate-900 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{t.name}</span>
                      <span className="ml-2 text-[10px] text-emerald-300 inline-flex items-center gap-1">
                        <Dices className="w-3 h-3" /> Toucher : {hitPct}%
                      </span>
                    </div>
                    <button
                      onClick={() => onAttackEntity(t, false)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg"
                    >
                      Attaquer (5 Én.)
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-slate-400 italic">Aucun adversaire à portée immédiate.</div>
          )}
        </div>
      </div>
    </div>
  );
};