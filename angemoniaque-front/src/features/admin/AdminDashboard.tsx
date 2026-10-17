import React, { useState } from 'react';
import { Shield, MapPin, Ban, PlusCircle, Sparkles } from 'lucide-react';

interface AdminDashboardProps {
  characters: any[];
  setCharacters: React.Dispatch<React.SetStateAction<any[]>>;
  entities: any[];
  setEntities: React.Dispatch<React.SetStateAction<any[]>>;
  mounts: any[];
  setMounts: React.Dispatch<React.SetStateAction<any[]>>;
  addLog: (type: string, source: string, target: string, text: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  characters,
  setCharacters,
  entities,
  setEntities,
  mounts,
  setMounts,
  addLog,
}) => {
  const [tpX, setTpX] = useState(12);
  const [tpY, setTpY] = useState(13);
  const [createType, setCreateType] = useState<'item' | 'monster' | 'mount' | 'spell'>('item');
  const [createName, setCreateName] = useState('');
  const [createPower, setCreatePower] = useState(10);

  const handleCreateEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    if (createType === 'item') {
      setCharacters((prev) =>
        prev.map((c, idx) =>
          idx === 0
            ? {
                ...c,
                bag: [
                  ...c.bag,
                  {
                    id: `adm-it-${Date.now()}`,
                    name: createName.trim(),
                    slot: 'right_hand',
                    weaponDamage: createPower,
                    armor: 0,
                    reqStrength: 1,
                    rarity: 'Divin',
                  },
                ].slice(0, 20),
              }
            : c
        )
      );
    } else if (createType === 'monster') {
      setEntities((prev) => [
        ...prev,
        {
          id: `adm-m-${Date.now()}`,
          map: characters[0]?.map || 'men',
          x: characters[0]?.x + 1 || 14,
          y: characters[0]?.y || 13,
          kind: 'monster',
          name: createName.trim(),
          blocks: true,
          hp: createPower * 100,
          hpMax: createPower * 100,
          armor: createPower * 2,
        },
      ]);
    } else if (createType === 'mount') {
      setMounts((prev) => [
        ...prev,
        {
          id: `adm-mnt-${Date.now()}`,
          name: createName.trim(),
          summoned: false,
          hp_current: createPower * 30,
          hp_max: createPower * 30,
          energy_current: 100,
          energy_max: 100,
          recovery_hp: 12,
          recovery_energy: 18,
          armor: createPower,
          bonus_range: 1,
          bonus_see: 2,
          attackName: 'Assaut Mystique',
          attackDamage: createPower * 5,
          attackEnergyCost: 12,
        },
      ]);
    }

    addLog('admin', 'Admin', createName.trim(), `Création administrateur (${createType}) : ${createName.trim()}.`);
    setCreateName('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
      {/* Gestion des joueurs : Bloquer, Téléporter, Ajouter/Enlever des caractéristiques */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
          <Shield className="w-4 h-4" /> Gestion des Joueurs (Blocage, Téléportation, Stats)
        </h3>

        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg">
          <span className="text-slate-400">Coordonnées Téléportation :</span>
          <input
            type="number"
            min={0}
            max={24}
            value={tpX}
            onChange={(e) => setTpX(Number(e.target.value))}
            className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-center text-white"
          />
          <input
            type="number"
            min={0}
            max={24}
            value={tpY}
            onChange={(e) => setTpY(Number(e.target.value))}
            className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-center text-white"
          />
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {characters.map((ch, idx) => (
            <div key={ch.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">{ch.pseudo}</span>
                  <span className="ml-2 text-[10px] text-amber-300">
                    ({ch.race} • {ch.rank}) — Pos ({ch.x},{ch.y})
                  </span>
                </div>
                <button
                  onClick={() =>
                    setCharacters((prev) =>
                      prev.map((c, i) => (i === idx ? { ...c, isBlocked: !c.isBlocked } : c))
                    )
                  }
                  className={`px-2 py-1 rounded font-bold text-[10px] flex items-center gap-1 ${
                    ch.isBlocked ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <Ban className="w-3 h-3" /> {ch.isBlocked ? 'Débloquer' : 'Bloquer'}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    setCharacters((prev) =>
                      prev.map((c, i) => (i === idx ? { ...c, x: tpX, y: tpY } : c))
                    );
                    addLog('admin', 'Admin', ch.pseudo, `Téléportation vers (${tpX}, ${tpY}).`);
                  }}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" /> Téléporter ({tpX},{tpY})
                </button>
                <button
                  onClick={() =>
                    setCharacters((prev) =>
                      prev.map((c, i) =>
                        i === idx ? { ...c, strength: c.strength + 5, agility: c.agility + 5, gold: c.gold + 500 } : c
                      )
                    )
                  }
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold"
                >
                  +5 FOR/AGI & +500 Or
                </button>
                <button
                  onClick={() =>
                    setCharacters((prev) =>
                      prev.map((c, i) =>
                        i === idx
                          ? { ...c, strength: Math.max(1, c.strength - 2), agility: Math.max(1, c.agility - 2) }
                          : c
                      )
                    )
                  }
                  className="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded font-bold"
                >
                  -2 FOR/AGI
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Créateur d'Objets, Monstres, Montures et Sorts */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-sm text-purple-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> Créer un Objet, Monstre, Monture ou Sort
        </h3>

        <form onSubmit={handleCreateEntity} className="space-y-3 bg-slate-900 p-3 rounded-xl">
          <div>
            <label className="block text-slate-400 mb-1">Catégorie à créer :</label>
            <select
              value={createType}
              onChange={(e) => setCreateType(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
            >
              <option value="item">Objet / Arme Équipable</option>
              <option value="monster">Monstre / Boss sur la Carte</option>
              <option value="mount">Monture Invocable</option>
              <option value="spell">Sort Magique</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Nom de la création :</label>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Ex: Lame de l’Archange, Hydre des Abysses..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Indice de Puissance / Multiplicateur :</label>
            <input
              type="number"
              min={1}
              max={100}
              value={createPower}
              onChange={(e) => setCreatePower(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-lg flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Générer dans le Monde
          </button>
        </form>

        <div className="p-3 bg-slate-900 rounded-xl text-[11px] text-slate-400">
          Statistiques globales : <b>{entities.length}</b> entités actives sur la carte commune • <b>{mounts.length}</b> monture(s) enregistrée(s).
        </div>
      </div>
    </div>
  );
};