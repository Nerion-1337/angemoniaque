import React, { useState } from 'react';
import { UserPlus, Clock, RotateCcw, Shield, Lock } from 'lucide-react';

interface AccountSettingsModalProps {
  characters: any[];
  activeChar: any;
  onCreateCharacter: (pseudo: string) => void;
  onSimulateHourlyTick: () => void;
  onOpenAdmin: () => void;
  onResetSave: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  characters,
  activeChar,
  onCreateCharacter,
  onSimulateHourlyTick,
  onOpenAdmin,
  onResetSave,
}) => {
  const [newPseudo, setNewPseudo] = useState('');
  const accountRace = characters[0]?.race || 'Humain';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPseudo.trim() || characters.length >= 3) return;
    onCreateCharacter(newPseudo.trim());
    setNewPseudo('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
      {/* Colonne gauche : Gestion des 3 personnages de même race */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-amber-300">Personnages du Compte ({characters.length}/3)</h3>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
            Race unique : {accountRace}
          </span>
        </div>

        <div className="p-3 bg-slate-900 rounded-lg space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Personnage actif (Pseudo non modifiable) :</span>
            <span className="font-bold text-white flex items-center gap-1">
              {activeChar.pseudo} <Lock className="w-3 h-3 text-amber-400" />
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Rang actuel :</span>
            <span className="font-bold text-amber-300">{activeChar.rank}</span>
          </div>
        </div>

        {characters.length < 3 ? (
          <form onSubmit={handleCreate} className="pt-2 border-t border-slate-700 space-y-2">
            <label className="block font-bold text-slate-300">
              Créer un nouveau personnage ({accountRace} obligatoire) :
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPseudo}
                onChange={(e) => setNewPseudo(e.target.value)}
                placeholder="Pseudo du nouveau héros..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> Créer
              </button>
            </div>
          </form>
        ) : (
          <div className="p-2.5 bg-slate-900 rounded-lg text-slate-400 text-center">
            Limite maximale de 3 personnages atteinte sur ce compte.
          </div>
        )}
      </div>

      {/* Colonne droite : Cycle horaire, Administration & Sauvegarde */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3 flex flex-col justify-between">
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-sky-300">Cycle Horaire, Sauvegarde & Administration</h3>

          <div className="p-3 bg-slate-900 rounded-lg flex items-center justify-between">
            <div>
              <div className="font-bold text-emerald-300">Simuler la mise à jour horaire (+1h)</div>
              <div className="text-[10px] text-slate-400">
                Régénère Vie & Énergie du héros et de sa monture, +XP/h et +Or/h.
              </div>
            </div>
            <button
              onClick={onSimulateHourlyTick}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5 shrink-0"
            >
              <Clock className="w-4 h-4" /> +1 Heure
            </button>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg flex items-center justify-between">
            <div>
              <div className="font-bold text-indigo-300">Espace Administrateur</div>
              <div className="text-[10px] text-slate-400">
                Gérer les joueurs, bloquer, téléporter, modifier stats et créer objets/boss.
              </div>
            </div>
            <button
              onClick={onOpenAdmin}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center gap-1.5 shrink-0"
            >
              <Shield className="w-4 h-4" /> Ouvrir Admin
            </button>
          </div>
        </div>

        <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-lg flex items-center justify-between">
          <div>
            <div className="font-bold text-rose-300">Réinitialiser la sauvegarde</div>
            <div className="text-[10px] text-slate-400">Remet la carte et les personnages à zéro.</div>
          </div>
          <button
            onClick={onResetSave}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
};