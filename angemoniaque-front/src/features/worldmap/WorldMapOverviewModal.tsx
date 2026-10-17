import React from 'react';
import { Trees, Mountain, Waves } from 'lucide-react';
import { getTileData } from '../../shared/utils/gridMath';

interface WorldMapOverviewModalProps {
  currentActor: any;
  entities: any[];
  mapsConfig: Record<string, any>;
  onSwitchMap: (mapKey: string) => void;
}

export const WorldMapOverviewModal: React.FC<WorldMapOverviewModalProps> = ({
  currentActor,
  entities,
  mapsConfig,
  onSwitchMap,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
    <div className="lg:col-span-8 bg-amber-950/30 border-2 border-amber-600/50 rounded-2xl p-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-amber-300">{mapsConfig[currentActor.map].name}</div>
          <div className="text-[11px] text-slate-400">{mapsConfig[currentActor.map].subtitle}</div>
        </div>
        <div className="flex gap-1.5">
          {Object.entries(mapsConfig).map(([mKey, mCfg]: [string, any]) => (
            <button
              key={mKey}
              onClick={() => onSwitchMap(mKey)}
              className={`px-2.5 py-1 rounded font-bold text-[10px] ${
                currentActor.map === mKey ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {mCfg.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative p-3 rounded-2xl bg-slate-950 border border-amber-500/30 shadow-inner">
        <div
          className="grid gap-[1px] bg-slate-900/60"
          style={{ gridTemplateColumns: 'repeat(25, minmax(0, 1fr))', width: '350px', height: '350px' }}
        >
          {Array.from({ length: 25 }).map((_, y) =>
            Array.from({ length: 25 }).map((__, x) => {
              const t = getTileData(currentActor.map, x, y);
              const isPlayerHere = currentActor.x === x && currentActor.y === y;
              const inVision =
                Math.abs(x - currentActor.x) <= currentActor.see &&
                Math.abs(y - currentActor.y) <= currentActor.see;
              const landmark = entities.find(
                (e) => e.map === currentActor.map && e.x === x && e.y === y && e.kind === 'building'
              );

              let cellBg = '#3f6212';
              if (t.biome === 'water') cellBg = '#172554';
              else if (t.biome === 'lake') cellBg = '#0284c7';
              else if (t.biome === 'forest') cellBg = '#14532d';
              else if (t.biome === 'mountain') cellBg = '#64748b';
              else if (t.biome === 'hill') cellBg = '#4338ca';
              else if (t.biome === 'road') cellBg = '#a8a29e';

              return (
                <div
                  key={`${x}-${y}`}
                  className="relative flex items-center justify-center"
                  style={{
                    backgroundColor: cellBg,
                    outline: inVision ? '1px solid rgba(56, 189, 248, 0.28)' : 'none',
                  }}
                >
                  {isPlayerHere && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white animate-ping" />
                  )}
                  {!isPlayerHere && landmark && (
                    <span
                      className={`w-2 h-2 rounded-sm ${
                        landmark.subType === 'portal' ? 'bg-purple-400' : 'bg-yellow-300'
                      }`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>

    <div className="lg:col-span-4 bg-slate-800/70 border border-slate-700 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
      <div className="space-y-2.5">
        <h3 className="font-bold text-sm text-amber-300">Légende Topographique du Monde</h3>
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2.5">
            <span className="w-4 h-4 rounded bg-[#14532d] flex items-center justify-center">
              <Trees className="w-3 h-3 text-emerald-300" />
            </span>
            <span><b>Forêts Anciennes</b></span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-4 h-4 rounded bg-[#64748b] flex items-center justify-center">
              <Mountain className="w-3 h-3 text-slate-100" />
            </span>
            <span><b>Massifs Montagneux</b></span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-4 h-4 rounded bg-[#0284c7] flex items-center justify-center">
              <Waves className="w-3 h-3 text-sky-100" />
            </span>
            <span><b>Lac d’Argent & Rivière</b></span>
          </div>
        </div>
      </div>
      <div className="p-2.5 bg-slate-900 rounded-xl border border-cyan-500/30 text-[11px] text-cyan-200">
        Rayon de vision actuel : <b>{currentActor.see} cases</b> autour de ({currentActor.x}, {currentActor.y}).
      </div>
    </div>
  </div>
);