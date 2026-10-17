import React, { useState } from 'react';
import { Upload, Dices, TrendingUp, Package } from 'lucide-react';

interface StarInventoryModalProps {
  activeChar: any;
  computedStats: {
    strength: number;
    reqStrength: number;
    agility: number;
    armor: number;
    damage: number;
    weaponName: string;
    see: number;
    hasDivineEnergy: boolean;
    maxSummons: number;
  };
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUnequipSlot: (slotKey: string, specialIndex?: number) => void;
  onEquipFromBag: (bagIndex: number) => void;
  onUpgradeStatProgressive: (statKey: string, baseCost: number, baseBonus: number, label: string) => void;
}

const UPGRADEABLE_STATS = [
  { key: 'hp_max', label: 'Vie Max', baseCost: 10, baseBonus: 10 },
  { key: 'energy_max', label: 'Énergie Max', baseCost: 10, baseBonus: 5 },
  { key: 'divine_energy_max', label: 'Énergie Divine Max', baseCost: 20, baseBonus: 5, requiresDivine: true },
  { key: 'recovery', label: 'Régénération Unique (Vie & Énergie /h)', baseCost: 25, baseBonus: 1 },
  { key: 'see', label: 'Vision (Cases)', baseCost: 25, baseBonus: 1 },
  { key: 'agility', label: 'Agilité (Toucher / Esquive)', baseCost: 50, baseBonus: 2 },
  { key: 'strength', label: 'Force', baseCost: 50, baseBonus: 2 },
];

export const StarInventoryModal: React.FC<StarInventoryModalProps> = ({
  activeChar,
  computedStats,
  onAvatarUpload,
  onUnequipSlot,
  onEquipFromBag,
  onUpgradeStatProgressive,
}) => {
  // Point 4 : Deux onglets dans l'Inventaire : 'equipement' puis 'amelioration'
  const [activeTab, setActiveTab] = useState<'equipement' | 'amelioration'>('equipement');
  const maxSpecialSlots = activeChar.race === 'Humain' ? 5 : 4;
  const upgradesMap = activeChar.statUpgrades || {};

  return (
    <div className="space-y-4 text-xs">
      {/* Barre d'onglets : 1. Équipement | 2. Amélioration */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('equipement')}
          className={`px-4 py-2 rounded-xl font-extrabold flex items-center gap-2 transition ${
            activeTab === 'equipement'
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Package className="w-4 h-4" /> 1. Équipement & Sac
        </button>
        <button
          onClick={() => setActiveTab('amelioration')}
          className={`px-4 py-2 rounded-xl font-extrabold flex items-center gap-2 transition ${
            activeTab === 'amelioration'
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> 2. Amélioration des Caractéristiques ({activeChar.xp} XP)
        </button>
      </div>

      {/* Récapitulatif des caractéristiques dans l'ordre exact :
          Vie - Énergie - Énergie Divine (si possédée) - Régén - Vision - Agilité - Force - Dégâts - Armure */}
      <div className="bg-slate-800/90 border border-amber-500/40 rounded-xl p-3 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 text-center">
        <div className="bg-slate-900 p-2 rounded-lg">
          <div className="text-[10px] text-slate-400">Vie</div>
          <div className="font-bold text-rose-400">{activeChar.hp_current}/{activeChar.hp_max}</div>
        </div>
        <div className="bg-slate-900 p-2 rounded-lg">
          <div className="text-[10px] text-slate-400">Énergie</div>
          <div className="font-bold text-amber-400">{activeChar.energy_current}/{activeChar.energy_max}</div>
        </div>
        {computedStats.hasDivineEnergy && (
          <div className="bg-slate-900 p-2 rounded-lg">
            <div className="text-[10px] text-slate-400">Énergie Divine</div>
            <div className="font-bold text-purple-400">
              {activeChar.divine_energy_current}/{activeChar.divine_energy_max}
            </div>
          </div>
        )}
        <div className="bg-slate-900 p-2 rounded-lg">
          <div className="text-[10px] text-slate-400">Régén (Vie/Én)</div>
          <div className="font-bold text-lime-400">+{activeChar.recovery}/h</div>
        </div>
        <div className="bg-slate-900 p-2 rounded-lg">
          <div className="text-[10px] text-slate-400">Vision</div>
          <div className="font-bold text-cyan-300">{computedStats.see} cases</div>
        </div>
        <div className="bg-slate-900 p-2 rounded-lg">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Dices className="w-3 h-3 text-emerald-400" /> Agilité
          </div>
          <div className="font-bold text-emerald-400">{computedStats.agility}</div>
        </div>
        <div className="bg-slate-900 p-2 rounded-lg">
          <div className="text-[10px] text-slate-400">Force (Req:{computedStats.reqStrength})</div>
          <div className="font-bold text-orange-400">{computedStats.strength}</div>
        </div>
        <div className="bg-slate-900 p-2 rounded-lg border border-red-500/40">
          <div className="text-[10px] text-red-300">Dégâts</div>
          <div className="font-extrabold text-red-400">{computedStats.damage}</div>
        </div>
        <div className="bg-slate-900 p-2 rounded-lg">
          <div className="text-[10px] text-slate-400">Armure</div>
          <div className="font-bold text-sky-400">{computedStats.armor}</div>
        </div>
      </div>

      {/* ONGLET 1 : ÉQUIPEMENT EN ÉTOILE & SAC */}
      {activeTab === 'equipement' && (
        <>
          <div className="px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <span>
              Dégâts : <b>Arme ({computedStats.weaponName}) × (Force {computedStats.strength} - Force req. {computedStats.reqStrength}) = {computedStats.damage}</b>
            </span>
            <span className="text-cyan-300">
              Limite d’invocations : <b>{computedStats.maxSummons} max</b>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-slate-800/70 border border-slate-700 rounded-xl p-4 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3">
                <span className="font-bold text-amber-300">Équipement en Étoile (Cliquer pour déséquiper)</span>
                <label className="cursor-pointer px-2.5 py-1 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 rounded border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                  <Upload className="w-3 h-3" /> Image perso (Max 2 Mo)
                  <input type="file" accept="image/*" onChange={onAvatarUpload} className="hidden" />
                </label>
              </div>

              <div className="w-full max-w-md flex flex-col items-center gap-3 py-2">
                <div className="flex items-center gap-4">
                  {(['head', 'amulet'] as const).map((key) => {
                    const item = activeChar.equipped[key];
                    return (
                      <button
                        key={key}
                        onClick={() => onUnequipSlot(key)}
                        className={`w-24 h-16 rounded-lg border-2 p-1 flex flex-col items-center justify-center ${
                          item ? 'bg-amber-500/20 border-amber-400' : 'bg-slate-900 border-slate-700'
                        }`}
                      >
                        <span className="text-[9px] uppercase text-slate-400">{key === 'head' ? 'Casque' : 'Collier'}</span>
                        <span className="text-[10px] font-bold truncate w-full">{item?.name || 'Vide'}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="w-full flex items-center justify-between gap-2">
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => onUnequipSlot('bracelet_left')} className="w-24 h-14 rounded-lg border border-slate-700 bg-slate-900 p-1">
                      <div className="text-[9px] text-slate-400">Bracelet G.</div>
                      <div className="text-[10px] font-bold truncate">{activeChar.equipped.bracelet_left?.name || 'Vide'}</div>
                    </button>
                    <div className="p-1.5 rounded-xl bg-slate-950 border border-amber-500/40 flex gap-1.5">
                      <button onClick={() => onUnequipSlot('left_hand')} className="w-18 h-16 rounded bg-slate-900 p-1">
                        <div className="text-[8px] text-slate-400">Main G.</div>
                        <div className="text-[9px] font-bold truncate">{activeChar.equipped.left_hand?.name || 'Vide'}</div>
                      </button>
                      <button onClick={() => onUnequipSlot('ring_left')} className="w-18 h-16 rounded bg-slate-900 p-1">
                        <div className="text-[8px] text-slate-400">Bague G.</div>
                        <div className="text-[9px] font-bold truncate">{activeChar.equipped.ring_left?.name || 'Vide'}</div>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <img src={activeChar.avatar} alt={activeChar.pseudo} className="w-20 h-20 rounded-full border-2 border-amber-400 object-cover" />
                    <button onClick={() => onUnequipSlot('chest')} className="w-28 h-16 rounded-lg border-2 border-amber-400 bg-slate-900 p-1">
                      <div className="text-[9px] text-slate-400">Plastron</div>
                      <div className="text-[10px] font-bold truncate">{activeChar.equipped.chest?.name || 'Vide'}</div>
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => onUnequipSlot('bracelet_right')} className="w-24 h-14 rounded-lg border border-slate-700 bg-slate-900 p-1">
                      <div className="text-[9px] text-slate-400">Bracelet D.</div>
                      <div className="text-[10px] font-bold truncate">{activeChar.equipped.bracelet_right?.name || 'Vide'}</div>
                    </button>
                    <div className="p-1.5 rounded-xl bg-slate-950 border border-amber-500/40 flex gap-1.5">
                      <button onClick={() => onUnequipSlot('right_hand')} className="w-18 h-16 rounded bg-slate-900 p-1">
                        <div className="text-[8px] text-slate-400">Main D. (Arme)</div>
                        <div className="text-[9px] font-bold truncate">{activeChar.equipped.right_hand?.name || 'Mains nues (1)'}</div>
                      </button>
                      <button onClick={() => onUnequipSlot('ring_right')} className="w-18 h-16 rounded bg-slate-900 p-1">
                        <div className="text-[8px] text-slate-400">Bague D.</div>
                        <div className="text-[9px] font-bold truncate">{activeChar.equipped.ring_right?.name || 'Vide'}</div>
                      </button>
                    </div>
                  </div>
                </div>

                <button onClick={() => onUnequipSlot('foot')} className="w-28 h-14 rounded-lg border border-slate-700 bg-slate-900 p-1">
                  <div className="text-[9px] text-slate-400">Chaussures</div>
                  <div className="text-[10px] font-bold truncate">{activeChar.equipped.foot?.name || 'Vide'}</div>
                </button>

                <div className="w-full pt-3 border-t border-slate-700">
                  <div className="text-[10px] font-bold uppercase text-purple-300 text-center mb-2">
                    Objets Spéciaux ({maxSpecialSlots} emplacements pour {activeChar.race})
                  </div>
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: maxSpecialSlots }).map((_, spIdx) => (
                      <button
                        key={spIdx}
                        onClick={() => onUnequipSlot('specials', spIdx)}
                        className="w-16 h-16 rounded-lg border border-purple-400/60 bg-slate-900 p-1"
                      >
                        <div className="text-[8px] text-purple-300">Spécial {spIdx + 1}</div>
                        <div className="text-[9px] font-bold truncate">{activeChar.equipped.specials[spIdx]?.name || 'Vide'}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-800/70 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-amber-300">Sac à Dos (20 Emplacements)</span>
                <span className="text-slate-400">{activeChar.bag.length}/20 occupés</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 20 }).map((_, idx) => {
                  const bagItem = activeChar.bag[idx];
                  return (
                    <button
                      key={idx}
                      onClick={() => bagItem && onEquipFromBag(idx)}
                      className={`h-16 rounded-lg border p-1.5 flex flex-col items-center justify-center text-center ${
                        bagItem ? 'border-amber-500/60 bg-slate-900 hover:border-amber-300' : 'border-slate-800 bg-slate-950/50 text-slate-600'
                      }`}
                    >
                      {bagItem ? (
                        <>
                          <span className="text-[9px] font-bold text-amber-200 line-clamp-2">{bagItem.name}</span>
                          <span className="text-[8px] text-slate-400">
                            {bagItem.weaponDamage
                              ? `Arme ×${bagItem.weaponDamage}`
                              : bagItem.bonusSummons
                              ? `+${bagItem.bonusSummons} Invoc.`
                              : `Armure +${bagItem.armor || 0}`}
                          </span>
                        </>
                      ) : (
                        <span className="text-[9px]">{idx + 1}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ONGLET 2 (Point 4) : AMÉLIORATION DES CARACTÉRISTIQUES
          Le coût en XP augmente de sa base (10, 20, 30...) et à partir de 10 améliorations on double l'augmentation de base (+20 PV au lieu de +10 PV) */}
      {activeTab === 'amelioration' && (
        <div className="bg-slate-800/80 border border-sky-500/40 rounded-xl p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-3">
            <div>
              <h3 className="font-bold text-sm text-sky-300">Entraînement & Progression par Paliers</h3>
              <p className="text-[11px] text-slate-400">
                Le coût en XP augmente de sa valeur de base à chaque achat (1×, 2×, 3×...). À partir de 10 améliorations sur une statistique, son gain de base est doublé !
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-400/50 font-extrabold text-sky-300 text-sm">
              {activeChar.xp} XP disponible
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {UPGRADEABLE_STATS.filter((st) => !st.requiresDivine || computedStats.hasDivineEnergy).map((st) => {
              const count = upgradesMap[st.key] || 0;
              const nextCost = st.baseCost * (count + 1);
              const nextBonus = count >= 10 ? st.baseBonus * 2 : st.baseBonus;

              return (
                <div
                  key={st.key}
                  className="p-3 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{st.label}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px]">
                        Palier {count}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Prochain gain :{' '}
                      <b className={count >= 10 ? 'text-emerald-300' : 'text-sky-300'}>
                        +{nextBonus} {count >= 10 ? '(Gain doublé ≥ 10 !)' : `(Double à 10 : +${st.baseBonus * 2})`}
                      </b>
                    </div>
                  </div>

                  <button
                    onClick={() => onUpgradeStatProgressive(st.key, st.baseCost, st.baseBonus, st.label)}
                    disabled={activeChar.xp < nextCost}
                    className={`px-3.5 py-2 rounded-lg font-extrabold shrink-0 transition ${
                      activeChar.xp >= nextCost
                        ? 'bg-sky-600 hover:bg-sky-500 text-white shadow'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    +{nextBonus} ({nextCost} XP)
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};