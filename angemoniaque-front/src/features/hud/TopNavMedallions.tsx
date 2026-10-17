import React from 'react';
import {
  Crown, Flame, Compass, Users, Map as MapIcon,
  Heart, Zap, Sparkles, Coins, Star, Sword, Shield, Eye, MapPin, RefreshCw, Crosshair, Dices
} from 'lucide-react';

interface TopNavMedallionsProps {
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  onGoHome: () => void;
  onStepDirection: (dx: number, dy: number) => void;
  currentActor: any;
  activeChar: any;
  displayedStats: {
    hp_current: number;
    hp_max: number;
    energy_current: number;
    energy_max: number;
    divine_energy_current: number;
    divine_energy_max: number;
    recovery: number;
    see: number;
    agility: number;
    strength: number;
    reqStrength: number;
    damage: number;
    armor: number;
    hasDivineEnergy: boolean;
    actorLabel: string;
  };
  activeMount: any;
  controlledSummon: any;
  mapLabel: string;
}

export const TopNavMedallions: React.FC<TopNavMedallionsProps> = ({
  activeModal,
  setActiveModal,
  onGoHome,
  onStepDirection,
  currentActor,
  activeChar,
  displayedStats,
  activeMount,
  controlledSummon,
  mapLabel,
}) => {
  // Point 1 : Les 8 flèches utilisent exactement le même modèle d'angle (◥) orienté par rotation CSS
  const directions = [
    { dx: 0, dy: -1, label: 'Nord', pos: '-top-7 left-1/2 -translate-x-1/2', rot: '-rotate-45' },
    { dx: 1, dy: -1, label: 'Nord-Est', pos: '-top-4 -right-5', rot: 'rotate-0' },
    { dx: 1, dy: 0, label: 'Est', pos: 'top-1/2 -right-7 -translate-y-1/2', rot: 'rotate-45' },
    { dx: 1, dy: 1, label: 'Sud-Est', pos: '-bottom-4 -right-5', rot: 'rotate-90' },
    { dx: 0, dy: 1, label: 'Sud', pos: '-bottom-7 left-1/2 -translate-x-1/2', rot: 'rotate-[135deg]' },
    { dx: -1, dy: 1, label: 'Sud-Ouest', pos: '-bottom-4 -left-5', rot: 'rotate-180' },
    { dx: -1, dy: 0, label: 'Ouest', pos: 'top-1/2 -left-7 -translate-y-1/2', rot: 'rotate-[225deg]' },
    { dx: -1, dy: -1, label: 'Nord-Ouest', pos: '-top-4 -left-5', rot: '-rotate-90' },
  ];

  const mountSummoned = Boolean(activeMount && activeMount.summoned && !controlledSummon);

  return (
    <header className="relative z-20 pointer-events-none w-full pt-2 px-4 flex flex-col items-center">
      {/* Titre Angemoniaque tout à gauche */}
      <button
        onClick={onGoHome}
        className="pointer-events-auto absolute top-2 left-4 bg-gradient-to-b from-amber-100 to-amber-300 hover:from-amber-200 hover:to-amber-400 text-slate-900 border-2 border-amber-700 rounded-b-2xl rounded-tl-lg px-6 py-2.5 shadow-2xl flex flex-col items-center transition transform hover:scale-105"
        title="Retour à l'accueil d'Angemoniaque"
      >
        <span className="text-[10px] uppercase tracking-widest text-amber-900 font-bold">Royaume 3D</span>
        <span className="text-2xl font-black tracking-tight text-amber-950 font-serif">Angemoniaque</span>
      </button>

      <div className="w-full max-w-5xl flex flex-col items-center">
        {/* 5 Grands Médaillons occupant >90% de la largeur des caractéristiques, sans bordure de section */}
        <div className="pointer-events-auto w-[94%] flex items-center justify-between py-4 px-2">
          {/* 1. Pactes & Fidèles */}
          <button
            onClick={() => setActiveModal(activeModal === 'pacts' ? null : 'pacts')}
            className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center transition shadow-2xl ${
              activeModal === 'pacts'
                ? 'bg-amber-500 text-slate-950 border-white scale-110'
                : 'bg-gradient-to-b from-slate-800/95 to-slate-950/95 text-amber-300 border-amber-500/70 hover:border-amber-300 hover:scale-105'
            }`}
          >
            <Crown className="w-9 h-9" />
            <span className="text-[11px] font-extrabold uppercase mt-1 tracking-wide">Pactes</span>
          </button>

          {/* 2. Point 5 : Renommé "Entité" (gère Montures & Invocations) */}
          <button
            onClick={() => setActiveModal(activeModal === 'mounts' ? null : 'mounts')}
            className={`relative w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center transition shadow-2xl ${
              activeModal === 'mounts'
                ? 'bg-amber-500 text-slate-950 border-white scale-110'
                : controlledSummon
                ? 'bg-cyan-600 text-white border-cyan-200 animate-pulse'
                : 'bg-gradient-to-b from-slate-800/95 to-slate-950/95 text-amber-300 border-amber-500/70 hover:border-amber-300 hover:scale-105'
            }`}
          >
            <Flame className="w-9 h-9" />
            <span className="text-[11px] font-extrabold uppercase mt-1 tracking-wide">Entité</span>
            {mountSummoned && (
              <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 text-[11px] font-black flex items-center justify-center text-slate-950 shadow">
                M
              </span>
            )}
          </button>

          {/* 3. Actions + 8 flèches utilisant le même modèle ◥ tourné par rotation */}
          <div className="relative flex items-center justify-center mx-4 my-2">
            {directions.map((dir) => (
              <button
                key={dir.label}
                onClick={() => onStepDirection(dir.dx, dir.dy)}
                className={`absolute ${dir.pos} text-amber-400 hover:text-amber-200 active:scale-90 text-2xl font-black leading-none select-none transition transform hover:scale-125 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]`}
                title={`Se déplacer vers ${dir.label}`}
              >
                <span className={`inline-block transform ${dir.rot}`}>◥</span>
              </button>
            ))}

            <button
              onClick={() => setActiveModal(activeModal === 'actions' ? null : 'actions')}
              className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center transition shadow-2xl ${
                activeModal === 'actions'
                  ? 'bg-amber-500 text-slate-950 border-white scale-110'
                  : 'bg-gradient-to-b from-amber-600 to-amber-800 text-white border-amber-300 hover:brightness-110 hover:scale-105'
              }`}
            >
              <Compass className="w-9 h-9" />
              <span className="text-[11px] font-extrabold uppercase mt-1 tracking-wide">Actions</span>
            </button>
          </div>

          {/* 4. Guilde */}
          <button
            onClick={() => setActiveModal(activeModal === 'guild' ? null : 'guild')}
            className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center transition shadow-2xl ${
              activeModal === 'guild'
                ? 'bg-amber-500 text-slate-950 border-white scale-110'
                : 'bg-gradient-to-b from-slate-800/95 to-slate-950/95 text-amber-300 border-amber-500/70 hover:border-amber-300 hover:scale-105'
            }`}
          >
            <Users className="w-9 h-9" />
            <span className="text-[11px] font-extrabold uppercase mt-1 tracking-wide">Guilde</span>
          </button>

          {/* 5. Carte Globale du Monde */}
          <button
            onClick={() => setActiveModal(activeModal === 'worldmap' ? null : 'worldmap')}
            className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center transition shadow-2xl ${
              activeModal === 'worldmap'
                ? 'bg-amber-500 text-slate-950 border-white scale-110'
                : 'bg-gradient-to-b from-emerald-800/95 to-slate-950/95 text-emerald-300 border-emerald-500/70 hover:border-emerald-300 hover:scale-105'
            }`}
          >
            <MapIcon className="w-9 h-9" />
            <span className="text-[11px] font-extrabold uppercase mt-1 tracking-wide">Carte</span>
          </button>
        </div>

        {/* BARRE 1 : Caractéristiques du Joueur OU de l'Invocation contrôlée (Point 5, Point 2, Point 9) */}
        <div
          className={`pointer-events-auto w-full backdrop-blur-md border rounded-xl px-4 py-2 shadow-2xl flex flex-wrap items-center justify-between gap-2 text-xs ${
            controlledSummon
              ? 'bg-cyan-950/92 border-cyan-400/60'
              : 'bg-slate-900/92 border-amber-500/40'
          }`}
        >
          {controlledSummon && (
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-extrabold">
              🔮 {displayedStats.actorLabel}
            </span>
          )}

          {/* 1. Vie */}
          <div className="flex items-center gap-1" title="Points de Vie">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span className="text-slate-400">Vie</span>
            <span className="font-bold text-rose-300">{displayedStats.hp_current}/{displayedStats.hp_max}</span>
          </div>

          {/* 2. Énergie */}
          <div className="flex items-center gap-1" title="Énergie">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-slate-400">Énergie</span>
            <span className="font-bold text-amber-300">{displayedStats.energy_current}/{displayedStats.energy_max}</span>
          </div>

          {/* 3. Énergie Divine (si possédée) */}
          {displayedStats.hasDivineEnergy && (
            <div className="flex items-center gap-1" title="Énergie Divine">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400">Én. Divine</span>
              <span className="font-bold text-purple-300">
                {displayedStats.divine_energy_current}/{displayedStats.divine_energy_max}
              </span>
            </div>
          )}

          {/* 4. Régén (Point 9 : unique pour Vie ET Énergie) */}
          <div className="flex items-center gap-1" title="Régénération unique par heure (Vie ET Énergie)">
            <RefreshCw className="w-3.5 h-3.5 text-lime-400" />
            <span className="text-slate-400">Régén</span>
            <span className="font-bold text-lime-300">+{displayedStats.recovery}/h</span>
          </div>

          {/* 5. Vision */}
          <div className="flex items-center gap-1" title="Champ de vision en cases">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Vision</span>
            <span className="font-bold text-cyan-300">{displayedStats.see}</span>
          </div>

          {/* 6. Agilité (Point 2 : Icône de Dé + chance de toucher/esquiver) */}
          <div className="flex items-center gap-1" title="Agilité : détermine vos chances de toucher et d'esquiver">
            <Dices className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Agilité</span>
            <span className="font-bold text-emerald-300">{displayedStats.agility}</span>
          </div>

          {/* 7. Force */}
          <div className="flex items-center gap-1" title="Force">
            <Sword className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-400">Force</span>
            <span className="font-bold text-orange-300">{displayedStats.strength}</span>
          </div>

          {/* 8. Dégâts */}
          <div className="flex items-center gap-1" title="Dégâts infligés">
            <Crosshair className="w-3.5 h-3.5 text-red-400" />
            <span className="text-slate-400">Dégâts</span>
            <span className="font-bold text-red-300">{displayedStats.damage}</span>
          </div>

          {/* 9. Armure */}
          <div className="flex items-center gap-1" title="Armure">
            <Shield className="w-3.5 h-3.5 text-sky-300" />
            <span className="text-slate-400">Armure</span>
            <span className="font-bold text-sky-300">{displayedStats.armor}</span>
          </div>

          <div className="h-3 w-px bg-slate-700" />

          {/* Or, XP & Coordonnées */}
          <div className="flex items-center gap-2">
            {!controlledSummon && (
              <>
                <span className="flex items-center gap-1 text-yellow-300 font-bold">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" /> {activeChar.gold}
                </span>
                <span className="flex items-center gap-1 text-sky-300 font-bold">
                  <Star className="w-3.5 h-3.5 text-sky-400" /> {activeChar.xp} XP
                </span>
              </>
            )}
            <span className="flex items-center gap-1 text-emerald-300 font-semibold">
              <MapPin className="w-3.5 h-3.5" /> ({currentActor.x},{currentActor.y}) • {mapLabel}
            </span>
          </div>
        </div>

        {/* BARRE 2 (Point 3 & Point 9) : Caractéristiques de la MONTURE exactement au même format et alignées avec celles du joueur, avec l'icône de la monture tout à gauche */}
        {mountSummoned && (
          <div className="pointer-events-auto mt-1.5 w-full bg-slate-900/92 backdrop-blur-md border border-emerald-500/50 rounded-xl px-4 py-2 shadow-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Icône de la monture tout à gauche juste avant ses caractéristiques */}
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-extrabold"
              title={`Monture active : ${activeMount.name}`}
            >
              <span className="text-sm leading-none">🐉</span>
              <span>{activeMount.name}</span>
            </div>

            {/* 1. Vie */}
            <div className="flex items-center gap-1" title="Points de Vie de la monture">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span className="text-slate-400">Vie</span>
              <span className="font-bold text-rose-300">{activeMount.hp_current}/{activeMount.hp_max}</span>
            </div>

            {/* 2. Énergie (utilisée pour les déplacements) */}
            <div className="flex items-center gap-1" title="Énergie de la monture (utilisée pour les déplacements)">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-slate-400">Énergie</span>
              <span className="font-bold text-amber-300">{activeMount.energy_current}/{activeMount.energy_max}</span>
            </div>

            {/* 3. Régén unique (Vie ET Énergie) */}
            <div className="flex items-center gap-1" title="Régénération unique par heure de la monture (Vie ET Énergie)">
              <RefreshCw className="w-3.5 h-3.5 text-lime-400" />
              <span className="text-slate-400">Régén</span>
              <span className="font-bold text-lime-300">+{activeMount.recovery}/h</span>
            </div>

            {/* 4. Vision */}
            <div className="flex items-center gap-1" title="Bonus de Vision accordé par la monture">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Vision</span>
              <span className="font-bold text-cyan-300">+{activeMount.bonus_see}</span>
            </div>

            {/* 5. Agilité (avec icône de dé) */}
            <div className="flex items-center gap-1" title="Agilité de la monture">
              <Dices className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">Agilité</span>
              <span className="font-bold text-emerald-300">{activeMount.agility ?? 12}</span>
            </div>

            {/* 6. Force */}
            <div className="flex items-center gap-1" title="Force de la monture">
              <Sword className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-slate-400">Force</span>
              <span className="font-bold text-orange-300">{activeMount.strength ?? 18}</span>
            </div>

            {/* 7. Dégâts */}
            <div className="flex items-center gap-1" title={`Dégâts (${activeMount.attackName || 'Attaque'})`}>
              <Crosshair className="w-3.5 h-3.5 text-red-400" />
              <span className="text-slate-400">Dégâts</span>
              <span className="font-bold text-red-300">{activeMount.attackDamage || 0}</span>
            </div>

            {/* 8. Armure */}
            <div className="flex items-center gap-1" title="Armure de la monture">
              <Shield className="w-3.5 h-3.5 text-sky-300" />
              <span className="text-slate-400">Armure</span>
              <span className="font-bold text-sky-300">{activeMount.armor}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};