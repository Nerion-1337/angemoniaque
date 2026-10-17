import React, { useState } from 'react';

interface PactsAndFaithModalProps {
  activeChar: any;
  humanPact: any;
  setHumanPact: (val: any) => void;
  etherealPacts: any[];
  setEtherealPacts: React.Dispatch<React.SetStateAction<any[]>>;
  faithState: any;
  setFaithState: React.Dispatch<React.SetStateAction<any>>;
  onSwitchDemoRaceRank: (race: string, rank?: string) => void;
  onSpendDivineEnergy: (amount: number) => void;
  addLog: (type: string, source: string, target: string, text: string) => void;
}

export const PactsAndFaithModal: React.FC<PactsAndFaithModalProps> = ({
  activeChar,
  humanPact,
  setHumanPact,
  etherealPacts,
  setEtherealPacts,
  faithState,
  setFaithState,
  onSwitchDemoRaceRank,
  onSpendDivineEnergy,
  addLog,
}) => {
  const [pactSearchInput, setPactSearchInput] = useState('');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
      <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-amber-300">Pactes de Sang (Humain ↔ Ange/Démon)</h3>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
            {activeChar.race === 'Humain' ? 'Max : 1 Pacte' : 'Max : 3 Pactes (base rang)'}
          </span>
        </div>

        <div className="flex gap-1.5 bg-slate-900 p-1.5 rounded-lg">
          {['Humain', 'Ange', 'Demon'].map((r) => (
            <button
              key={r}
              onClick={() => onSwitchDemoRaceRank(r)}
              className={`flex-1 py-1 rounded font-bold ${
                activeChar.race === r ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Vue {r}
            </button>
          ))}
          <button
            onClick={() => onSwitchDemoRaceRank(activeChar.race, activeChar.rank === 'Divin' ? 'Mortel' : 'Divin')}
            className={`px-2.5 py-1 rounded font-bold ${
              activeChar.rank === 'Divin' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-purple-300'
            }`}
          >
            Dieu : {activeChar.rank === 'Divin' ? 'OUI' : 'NON'}
          </button>
        </div>

        {activeChar.race === 'Humain' ? (
          humanPact ? (
            <div className="p-3 bg-slate-900 rounded-lg border border-amber-500/30 space-y-2">
              <div className="font-bold text-amber-200">
                Lié à : {humanPact.partnerName} ({humanPact.partnerRace} • {humanPact.partnerRank})
              </div>
              <p className="text-slate-400">
                Activer votre pacte augmente temporairement votre Force (+{Math.floor(humanPact.partnerStrength * 0.5)}) et Agilité (+{Math.floor(humanPact.partnerAgility * 0.5)}), et réduit de moitié moins celles de l’être éthéré.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setHumanPact({ ...humanPact, bonusActive: !humanPact.bonusActive });
                    addLog('pact', activeChar.pseudo, humanPact.partnerName, 'Activation du bonus temporaire de Pacte Humain.');
                  }}
                  className={`flex-1 py-2 rounded-lg font-bold ${
                    humanPact.bonusActive ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {humanPact.bonusActive ? 'Bonus Actif (Désactiver)' : 'Faire valoir le bonus du Pacte'}
                </button>
                <button
                  onClick={() => setHumanPact(null)}
                  className="px-3 py-2 bg-rose-600/80 text-white rounded-lg font-bold"
                >
                  Résilier
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() =>
                setHumanPact({
                  partnerName: 'Azazel_Duc',
                  partnerRace: 'Demon',
                  partnerRank: 'Duc',
                  partnerStrength: 24,
                  partnerAgility: 18,
                  bonusActive: false,
                })
              }
              className="w-full py-2 bg-amber-500 text-slate-950 font-bold rounded-lg"
            >
              Signer un Pacte avec Azazel_Duc
            </button>
          )
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={pactSearchInput}
                onChange={(e) => setPactSearchInput(e.target.value)}
                placeholder="Rechercher le nom d'un Humain..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              />
              <button
                onClick={() => {
                  if (!pactSearchInput.trim() || etherealPacts.length >= 3) return;
                  setEtherealPacts((prev) => [
                    ...prev,
                    { id: `p-${Date.now()}`, humanName: pactSearchInput.trim(), activeBoost: false, since: 'Aujourd’hui' },
                  ]);
                  setPactSearchInput('');
                }}
                className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg"
              >
                Signer ({etherealPacts.length}/3)
              </button>
            </div>
            {etherealPacts.map((p) => (
              <div key={p.id} className="p-2 bg-slate-900 rounded-lg flex items-center justify-between">
                <span className="font-bold text-amber-200">{p.humanName}</span>
                <button
                  onClick={() => setEtherealPacts((prev) => prev.filter((item) => item.id !== p.id))}
                  className="px-2 py-1 bg-rose-600/80 text-white rounded text-[10px] font-bold"
                >
                  Résilier
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-sm text-purple-300">Foi, Prières de Bénédiction (72h) & Pouvoir Divin</h3>
        <div className="p-3 bg-slate-900 rounded-lg space-y-2">
          <div className="flex gap-2">
            <select
              value={faithState.selectedBlessingType}
              onChange={(e) => setFaithState((prev: any) => ({ ...prev, selectedBlessingType: e.target.value }))}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
            >
              <option value="strength">Augmentation : Force (+5)</option>
              <option value="agility">Augmentation : Agilité (+5)</option>
              <option value="hp_max">Augmentation : PV Max (+50)</option>
              <option value="heal">Soin Divin Immédiat (+150 PV)</option>
            </select>
            <button
              onClick={() => {
                setFaithState((prev: any) => ({ ...prev, lastBlessingRequest: 'Envoyée (Recharge 72h)' }));
                addLog('faith', activeChar.pseudo, faithState.godName || 'Dieu', 'Requête de bénédiction (72h) envoyée.');
              }}
              className="px-3 py-1.5 bg-purple-600 text-white font-bold rounded-lg"
            >
              Prier (72h)
            </button>
          </div>
        </div>

        {activeChar.rank === 'Divin' && (
          <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded-lg space-y-2">
            <div className="font-bold text-purple-200 flex items-center justify-between">
              <span>Autel du Dieu (Liste des Fidèles & Requêtes)</span>
              <span>ÉD : {activeChar.divine_energy_current}/{activeChar.divine_energy_max}</span>
            </div>
            {faithState.pendingGodRequests.map((req: any) => (
              <div key={req.id} className="p-2 bg-slate-900/90 rounded flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{req.believerName}</div>
                  <div className="text-[10px] text-purple-300">{req.requestType}</div>
                </div>
                <button
                  onClick={() => {
                    onSpendDivineEnergy(req.costDivine);
                    setFaithState((prev: any) => ({
                      ...prev,
                      pendingGodRequests: prev.pendingGodRequests.filter((r: any) => r.id !== req.id),
                    }));
                  }}
                  className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold text-[10px]"
                >
                  Exaucer (-{req.costDivine} ÉD)
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};