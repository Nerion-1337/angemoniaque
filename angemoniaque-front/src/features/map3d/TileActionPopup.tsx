import React from 'react';
import { Info, Ban, Dices } from 'lucide-react';

interface TileActionPopupProps {
  activeTileCard: any;
  selectedTile: any;
  activeTilePath: { steps: number; energy: number } | null;
  currentActor: any;
  activeMount: any;
  controlledSummon: any;
  hitChancePreview: number | null;
  onCloseSelected: () => void;
  onMoveTo: (x: number, y: number) => void;
  onAttackTile: (tile: any, useMountBreath: boolean) => void;
  onInteractBuilding: (tile: any) => void;
  onHarvestTile: (tile: any) => void;
  onPlaceStructure: (tile: any, name: string) => void;
  onInspectDetails: (tile: any) => void;
}

export const TileActionPopup: React.FC<TileActionPopupProps> = ({
  activeTileCard,
  selectedTile,
  activeTilePath,
  currentActor,
  activeMount,
  controlledSummon,
  hitChancePreview,
  onCloseSelected,
  onMoveTo,
  onAttackTile,
  onInteractBuilding,
  onHarvestTile,
  onPlaceStructure,
  onInspectDetails,
}) => {
  if (!activeTileCard) return null;

  const entity = activeTileCard.entity;
  const isTileOccupied = Boolean(entity);
  const distChebyshev = Math.max(
    Math.abs(activeTileCard.x - currentActor.x),
    Math.abs(activeTileCard.y - currentActor.y)
  );

  // Point 7 : Calcul de la position à côté de l'élément pointé ou sélectionné (avec maintien dans les limites de l'écran)
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const rawX = (activeTileCard.screenX ?? 200) + 26;
  const rawY = (activeTileCard.screenY ?? 220) - 40;
  const leftPos = Math.min(Math.max(16, rawX), winW - 340);
  const topPos = Math.min(Math.max(110, rawY), winH - 360);

  return (
    <div
      style={{ left: `${leftPos}px`, top: `${topPos}px` }}
      className={`fixed z-20 w-80 bg-slate-900/95 backdrop-blur-md border-2 border-amber-500/70 rounded-2xl p-4 shadow-2xl transition-all duration-75 ${
        selectedTile ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            {selectedTile ? 'Case Sélectionnée (Actions)' : 'Aperçu au Survol'}
          </span>
          <h3 className="text-sm font-bold text-white mt-1">
            {activeTileCard.tileInfo.type} ({activeTileCard.x}, {activeTileCard.y})
          </h3>
        </div>
        {selectedTile && (
          <button
            onClick={onCloseSelected}
            className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded bg-slate-800"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-slate-300">
        <div className="flex justify-between">
          <span className="text-slate-400">Coût Énergie de la case :</span>
          <span className="font-bold text-amber-300">{activeTileCard.tileInfo.cost} Énergie</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Ressource présente :</span>
          <span className="font-semibold text-emerald-300">{activeTileCard.tileInfo.resource || 'Aucune'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Distance :</span>
          <span className="font-bold text-sky-300">
            {activeTilePath?.steps || 0} case(s) • {activeTilePath?.energy || 0} Énergie
          </span>
        </div>

        {/* Joueur : Pseudo, Race, Guilde (ni vie, ni armure) */}
        {entity && entity.kind === 'player' && (
          <div className="mt-2 p-2.5 rounded-lg bg-slate-800/95 border border-amber-500/40 space-y-1">
            <div className="font-bold text-amber-300 flex items-center justify-between">
              <span>Joueur : {entity.name}</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-700 text-amber-200">
                {entity.race}
              </span>
            </div>
            <div className="text-[11px] text-slate-300">
              Guilde : <b className="text-emerald-300">{entity.guild || 'Aucune guilde'}</b>
            </div>
          </div>
        )}

        {/* Point 10 : Invocation : indique que c'est une invocation, son nom et le nom du joueur qui l'a invoquée */}
        {entity && entity.kind === 'summon' && (
          <div className="mt-2 p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-400/50 space-y-1">
            <div className="font-bold text-cyan-300 flex items-center justify-between">
              <span>🔮 {entity.name}</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-400/40">
                Invocation
              </span>
            </div>
            <div className="text-[11px] text-slate-200">
              Invoquée par : <b className="text-amber-300">{entity.summonerName || 'Karthagor'}</b>
            </div>
          </div>
        )}

        {/* Monstre ou Bâtiment */}
        {entity && entity.kind !== 'player' && entity.kind !== 'summon' && (
          <div className="mt-2 p-2.5 rounded-lg bg-slate-800/95 border border-amber-500/30">
            <div className="font-bold text-amber-300 flex items-center justify-between">
              <span>{entity.name}</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-700 text-slate-200">
                {entity.kind === 'monster' ? 'Monstre' : 'Structure'}
              </span>
            </div>
            {entity.kind === 'monster' && (
              <div className="text-[11px] text-slate-300 mt-1">
                PV : {entity.hp}/{entity.hpMax} • Armure : {entity.armor}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedTile && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
          <div className="text-[11px] font-bold uppercase text-amber-400">Actions possibles :</div>

          {!isTileOccupied && activeTilePath && activeTilePath.steps > 0 && (
            <button
              onClick={() => onMoveTo(selectedTile.x, selectedTile.y)}
              className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center justify-between"
            >
              <span>S’y rendre ({activeTilePath.steps} cases)</span>
              <span className="px-1.5 py-0.5 bg-slate-950/40 rounded">{activeTilePath.energy} Énergie</span>
            </button>
          )}

          {isTileOccupied && distChebyshev > 1 && (
            <button
              onClick={() => onMoveTo(selectedTile.x, selectedTile.y)}
              className="w-full py-2 px-3 bg-sky-700 hover:bg-sky-600 text-white rounded-lg text-xs font-bold flex items-center justify-between"
            >
              <span>S’approcher à côté de {entity.name}</span>
              <span className="px-1.5 py-0.5 bg-slate-950/40 rounded">Case adjacente</span>
            </button>
          )}

          {isTileOccupied && distChebyshev === 1 && (
            <div className="px-2.5 py-1.5 rounded bg-slate-800/90 text-slate-300 text-[11px] flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Case occupée (vous êtes juste à côté).</span>
            </div>
          )}

          {entity && (entity.kind === 'monster' || entity.kind === 'player' || entity.kind === 'summon') && (
            <>
              {hitChancePreview !== null && (
                <div className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-200 flex items-center justify-between">
                  <span className="flex items-center gap-1"><Dices className="w-3.5 h-3.5" /> Chance de Toucher (Agilité) :</span>
                  <b>{hitChancePreview}% (Esquive : {100 - hitChancePreview}%)</b>
                </div>
              )}
              <button
                onClick={() => onAttackTile(selectedTile, false)}
                className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center justify-between"
              >
                <span>Attaquer {entity.name}</span>
                <span className="px-1.5 py-0.5 bg-slate-950/40 rounded">5 Énergie</span>
              </button>

              {!controlledSummon && activeMount?.summoned && activeMount.attackName && (
                <button
                  onClick={() => onAttackTile(selectedTile, true)}
                  className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center justify-between"
                >
                  <span>🐉 {activeMount.attackName} ({activeMount.attackDamage} dég.)</span>
                  <span className="px-1.5 py-0.5 bg-slate-950/40 rounded">{activeMount.attackEnergyCost} Én.</span>
                </button>
              )}
            </>
          )}

          {entity && entity.kind === 'building' && (
            <button
              onClick={() => onInteractBuilding(selectedTile)}
              className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-between"
            >
              <span>
                {entity.subType === 'portal' ? `Franchir ${entity.name}` : `Interagir avec ${entity.name}`}
              </span>
              <span className="px-1.5 py-0.5 bg-slate-950/20 rounded">0 Énergie</span>
            </button>
          )}

          {!isTileOccupied && selectedTile.tileInfo.resource && (
            <button
              onClick={() => onHarvestTile(selectedTile)}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-between"
            >
              <span>Récolter {selectedTile.tileInfo.resource}</span>
              <span className="px-1.5 py-0.5 bg-slate-950/40 rounded">{(activeTilePath?.energy || 0) + 4} Énergie</span>
            </button>
          )}

          {!isTileOccupied && (
            <button
              onClick={() => onPlaceStructure(selectedTile, 'Tour de Garde Runique')}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-between"
            >
              <span>Poser un bâtiment (Tour de Garde)</span>
              <span className="px-1.5 py-0.5 bg-slate-950/40 rounded">{(activeTilePath?.energy || 0) + 10} Énergie</span>
            </button>
          )}

          <button
            onClick={() => onInspectDetails(selectedTile)}
            className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>Plus d’informations (État de forme & Équipement)</span>
          </button>
        </div>
      )}
    </div>
  );
};