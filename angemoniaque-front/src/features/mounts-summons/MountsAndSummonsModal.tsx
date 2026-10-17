import React from 'react';
import { ArrowLeftRight, Sparkles } from 'lucide-react';

interface MountsAndSummonsModalProps {
  mounts: any[];
  onToggleMount: (mountId: string) => void;
  summonedMonsters: any[];
  maxSummons: number;
  controlledSummonId: string | null;
  onSwitchSummonControl: (summonId: string | null) => void;
  heroPseudo: string;
}

export const MountsAndSummonsModal: React.FC<MountsAndSummonsModalProps> = ({
  mounts,
  onToggleMount,
  summonedMonsters,
  maxSummons,
  controlledSummonId,
  onSwitchSummonControl,
  heroPseudo,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
    <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
      <h3 className="font-bold text-sm text-amber-300">Montures (Invoquée = Chevauchée d’office)</h3>
      <p className="text-slate-400">
        Lorsque votre monture est invoquée, ses déplacements consomment son énergie. Sa régénération unique restaure chaque heure sa Vie ET son Énergie.
      </p>
      {mounts.map((m) => (
        <div key={m.id} className="p-3 bg-slate-900 rounded-lg border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-amber-200">🐉 {m.name}</span>
            <span className="text-[10px] font-bold text-emerald-300">
              {m.summoned ? 'Invoquée (Sur la monture)' : 'Au repos'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-slate-300">
            <span>Vie : <b>{m.hp_current}/{m.hp_max}</b></span>
            <span>Énergie : <b>{m.energy_current}/{m.energy_max}</b></span>
            <span className="text-lime-300">Régén (Vie & Én.) : <b>+{m.recovery}/h</b></span>
            <span>Vision : <b>+{m.bonus_see} cases</b></span>
            <span>Agilité : <b>{m.agility ?? 12}</b></span>
            <span>Force : <b>{m.strength ?? 18}</b></span>
            <span>Dégâts : <b>{m.attackDamage || 0}</b></span>
            <span>Armure : <b>{m.armor}</b></span>
          </div>
          <button
            onClick={() => onToggleMount(m.id)}
            className={`w-full py-2 rounded-lg font-bold ${
              m.summoned ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'
            }`}
          >
            {m.summoned ? 'Renvoyer la monture' : 'Invoquer & Monter dessus'}
          </button>
        </div>
      ))}
    </div>

    <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-cyan-300">Invocations Contrôlables</h3>
        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-extrabold">
          Actives : {summonedMonsters.length} / {maxSummons} max
        </span>
      </div>
      <p className="text-slate-400 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          Limite de base : <b>1 invocation par joueur</b> (augmentable via objets spéciaux ou sorts). Prendre le contrôle affiche ses caractéristiques en haut de l’écran.
        </span>
      </p>

      {summonedMonsters.map((sum) => {
        const isControlled = controlledSummonId === sum.id;
        return (
          <div key={sum.id} className="p-3 bg-slate-900 rounded-lg border border-cyan-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-200">🔮 {sum.name} ({sum.x}, {sum.y})</span>
              <span className="text-[10px] text-amber-300">Maître : {sum.summonerName || heroPseudo}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-slate-300">
              <span>Vie : <b>{sum.hp_current}/{sum.hp_max}</b></span>
              <span>Énergie : <b>{sum.energy_current}/{sum.energy_max}</b></span>
              <span className="text-lime-300">Régén : <b>+{sum.recovery}/h</b></span>
              <span>Vision : <b>{sum.see}</b></span>
              <span>Agilité : <b>{sum.agility}</b></span>
              <span>Force : <b>{sum.strength}</b></span>
              <span>Dégâts : <b>{sum.damage}</b></span>
              <span>Armure : <b>{sum.armor}</b></span>
            </div>
            <button
              onClick={() => onSwitchSummonControl(isControlled ? null : sum.id)}
              className={`w-full py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${
                isControlled ? 'bg-amber-500 text-slate-950' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>{isControlled ? `Revenir sur ${heroPseudo}` : `Prendre le contrôle de ${sum.name}`}</span>
            </button>
          </div>
        );
      })}
    </div>
  </div>
);