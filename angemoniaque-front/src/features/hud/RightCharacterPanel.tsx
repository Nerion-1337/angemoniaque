import React from 'react';
import { Lock, ScrollText } from 'lucide-react';

interface RightCharacterPanelProps {
  activeChar: any;
  characters: any[];
  activeCharIndex: number;
  onSelectChar: (idx: number) => void;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  historyCount: number;
  controlledSummon: any;
}

export const RightCharacterPanel: React.FC<RightCharacterPanelProps> = ({
  activeChar,
  characters,
  activeCharIndex,
  onSelectChar,
  activeModal,
  setActiveModal,
  historyCount,
  controlledSummon,
}) => (
  <aside className="absolute top-20 right-4 z-20 flex flex-col items-center w-48">
    <div
      onClick={() => setActiveModal(activeModal === 'inventory' ? null : 'inventory')}
      className="cursor-pointer group flex flex-col items-center w-full"
      title="Cliquer sur l'image ou le pseudo pour ouvrir l'Inventaire en étoile"
    >
      <div className="relative w-24 h-24 rounded-full border-4 border-amber-500/80 shadow-2xl overflow-hidden bg-slate-800 group-hover:scale-105 transition">
        <img src={activeChar.avatar} alt={activeChar.pseudo} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-[10px] font-bold text-amber-200 text-center px-1">
          Ouvrir Inventaire
        </div>
      </div>

      <div className="mt-1.5 w-full bg-gradient-to-b from-amber-100 to-amber-200 text-slate-900 border-2 border-amber-700 rounded-lg py-1 px-3 shadow-md flex items-center justify-between">
        <span className="font-extrabold text-xs truncate">{activeChar.pseudo}</span>
        <Lock className="w-3 h-3 text-amber-900 shrink-0" title="Le pseudo ne peut pas être modifié" />
      </div>
    </div>

    {/* Icône de Parchemin sous le pseudo pour l'Historique */}
    <button
      onClick={() => setActiveModal(activeModal === 'history' ? null : 'history')}
      className={`mt-1.5 w-full py-1.5 px-3 rounded-lg border-2 shadow-md flex items-center justify-center gap-2 text-xs font-extrabold transition ${
        activeModal === 'history'
          ? 'bg-amber-500 text-slate-950 border-white'
          : 'bg-gradient-to-b from-amber-800/90 to-slate-900 text-amber-200 border-amber-500/60 hover:border-amber-300 hover:text-white'
      }`}
    >
      <ScrollText className="w-4 h-4 text-amber-300 shrink-0" />
      <span>Parchemin d’Historique</span>
      <span className="px-1.5 py-0.2 rounded-full bg-slate-950/70 text-[10px] text-amber-300">
        {historyCount}
      </span>
    </button>

    <div className="mt-1.5 w-full bg-slate-900/90 border border-amber-500/50 rounded-lg py-1.5 px-3 shadow text-center">
      <div className="text-xs font-bold text-amber-300">{activeChar.race} • {activeChar.rank}</div>
      <div className="text-[10px] text-slate-400">
        {controlledSummon ? `Contrôle : ${controlledSummon.name}` : 'Héros Principal'}
      </div>
    </div>

    <div className="mt-2 w-full bg-slate-900/85 border border-slate-700 rounded-lg p-2.5 shadow-lg text-xs">
      <div className="font-bold text-amber-400 uppercase text-[10px] mb-1.5">
        Personnages ({characters.length}/3)
      </div>
      <div className="space-y-1">
        {characters.map((ch, idx) => (
          <button
            key={ch.id}
            onClick={() => onSelectChar(idx)}
            className={`w-full text-left px-2 py-1 rounded flex items-center justify-between text-[11px] transition ${
              idx === activeCharIndex
                ? 'bg-amber-500/25 text-amber-200 font-bold border border-amber-500/50'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span className="truncate">{ch.pseudo}</span>
            <span className="text-[10px] text-slate-400">({ch.x},{ch.y})</span>
          </button>
        ))}
      </div>
    </div>
  </aside>
);