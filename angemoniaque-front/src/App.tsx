import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { apiClient } from './shared/api/httpClient';
import { computePathEnergy } from './shared/utils/gridMath';
import { ModalWindow } from './shared/utils/components/ModalWindow';
import { TopNavMedallions } from './features/hud/TopNavMedallions';
import { RightCharacterPanel } from './features/hud/RightCharacterPanel';
import { ThreeTacticalMap } from './features/map3d/ThreeTacticalMap';
import { TileActionPopup } from './features/map3d/TileActionPopup';
import { useSharedMultiplayerMap } from './features/map3d/useSharedMultiplayerMap';
import { PactsAndFaithModal } from './features/pacts-faith/PactsAndFaithModal';
import { MountsAndSummonsModal } from './features/mounts-summons/MountsAndSummonsModal';
import { LocalActionsModal } from './features/actions/LocalActionsModal';
import { GuildOverlayModal } from './features/guild/GuildOverlayModal';
import { WorldMapOverviewModal } from './features/worldmap/WorldMapOverviewModal';
import { StarInventoryModal } from './features/inventory/StarInventoryModal';
import { HistoryScrollModal } from './features/history/HistoryScrollModal';
import { CapitalBuildingModal } from './features/capital/CapitalBuildingModal';
import { AccountSettingsModal } from './features/account/AccountSettingsModal';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { ChatWidget } from './features/chat/ChatWidget';

const STORAGE_KEY = 'angemoniaque_persistent_state_v3';

const MAPS_CONFIG: Record<string, any> = {
  men: { id: 'map-men', sqlName: 'monde_des_hommes', name: 'Monde des Hommes (Midgard)', subtitle: 'Continent partagé en ligne', size: 25 },
  ethereal: { id: 'map-ethereal', sqlName: 'plan_ethere', name: 'Plan Éthéré (Céleste & Infernal)', subtitle: 'Archipel astral commun', size: 25 },
  limbo: { id: 'map-limbo', sqlName: 'les_limbes', name: 'Les Limbes (Royaume des Morts)', subtitle: 'Royaume commun des âmes', size: 25 },
};

const MODAL_TITLES_FR: Record<string, string> = {
  pacts: 'Gestion des Pactes & des Fidèles',
  mounts: 'Gestion des Invocations & Montures',
  actions: 'Actions Autour du Personnage & Entraînement',
  guild: 'Guilde : Membres, Dossiers & Sujets',
  worldmap: 'Carte Globale du Monde',
  inventory: 'Inventaire & Équipement en Étoile',
  history: 'Parchemin d’Historique (100 dernières actions)',
  account: 'Gestion du Compte & Paramètres',
  admin: 'Espace Administrateur du Royaume',
  building_hub: 'Capitale de Faction : Boutique, Marché & Coffre (0 Énergie)',
  entity_details: 'Informations Détaillées',
};

export function hasDivineEnergyAccess(race: string, rank: string): boolean {
  if (race === 'Nephilime') return true;
  const r = (rank || '').toLowerCase();
  return r === 'divin' || r === 'dieu' || r === 'demi-dieu' || r === 'seraphin' || r === 'séraphin' || r === 'titan';
}

export function getPlayerHealthStatus(hp: number, hpMax: number): { label: string; colorClass: string } {
  const pct = hpMax > 0 ? (hp / hpMax) * 100 : 100;
  if (pct >= 75) return { label: 'En pleine forme (75% - 100%)', colorClass: 'text-emerald-400' };
  if (pct >= 50) return { label: 'Bon état (50% - 75%)', colorClass: 'text-lime-300' };
  if (pct >= 25) return { label: 'Blessé (25% - 50%)', colorClass: 'text-amber-400' };
  return { label: 'Souffrant (< 25%)', colorClass: 'text-rose-500' };
}

const DEFAULT_BAG_ITEMS = [
  { id: 'it-epee', name: 'Épée Sanctifiée', slot: 'right_hand', weaponDamage: 3, armor: 0, reqStrength: 2, rarity: 'Épique' },
  { id: 'it-ecu', name: 'Écu de la Garde', slot: 'left_hand', armor: 6, reqStrength: 1, rarity: 'Commun' },
  { id: 'it-casque', name: 'Casque de Fer Forgé', slot: 'head', armor: 4, reqStrength: 1, rarity: 'Commun' },
  { id: 'it-plastron', name: 'Plastron du Lion', slot: 'chest', armor: 10, reqStrength: 2, rarity: 'Rare' },
  { id: 'it-bottes', name: 'Bottes de Célérité', slot: 'foot', armor: 3, reqStrength: 1, agilityBonus: 2, rarity: 'Rare' },
  { id: 'it-bague', name: 'Anneau de Rubis', slot: 'ring_right', armor: 0, reqStrength: 0, strengthBonus: 2, rarity: 'Rare' },
  { id: 'it-artefact', name: 'Artefact', slot: 'special', armor: 0, reqStrength: 0, strengthBonus: 4, isDivine: true, rarity: 'Divin' },
];

const DEFAULT_ENTITIES = [
  { id: 'b-hdv', map: 'men', x: 12, y: 12, kind: 'building', name: 'Hôtel de ville', subType: 'capital', faction: 'Humain', blocks: true, hp: 9999, hpMax: 9999, armor: 100 },
  { id: 'b-seuil', map: 'men', x: 15, y: 10, kind: 'building', name: 'Le Seuil des Deux Voiles', subType: 'portal', targetMap: 'ethereal', blocks: true, hp: 9999, hpMax: 9999, armor: 100 },
  { id: 'm-minotaure', map: 'men', x: 14, y: 14, kind: 'monster', name: 'Minotaure', blocks: true, hp: 1500, hpMax: 1500, armor: 25, drop: 'Artefact' },
  {
    id: 'p-azazel',
    map: 'men',
    x: 11,
    y: 13,
    kind: 'player',
    name: 'Azazel_Duc',
    race: 'Demon',
    rank: 'Duc',
    guild: 'Légion de Soufre',
    blocks: true,
    hp: 280,
    hpMax: 350,
    armor: 16,
    visibleGear: ['Casque Cornu', 'Armure d’Obsidienne', 'Bracelet de Flamme', 'Bague de Sang', 'Épée Runique', 'Bouclier Sombre'],
  },
  {
    id: 'p-elora',
    map: 'men',
    x: 13,
    y: 14,
    kind: 'player',
    name: 'Elora_Mortelle',
    race: 'Humain',
    rank: 'Mortel',
    guild: 'L’Ordre de l’Aube Éternelle',
    blocks: true,
    hp: 40,
    hpMax: 100,
    armor: 5,
    visibleGear: ['Casque Léger', 'Arc Long', 'Bracelet de Cuir', 'Bague d’Argent'],
  },
];

const DEFAULT_GUILD = {
  name: 'L’Ordre de l’Aube Éternelle',
  tag: 'AUBE',
  treasuryGold: 12400,
  members: [
    { name: 'Karthagor', rank: 'Maître Forgeron', online: true },
    { name: 'Elora_Mortelle', rank: 'Éclaireuse', online: true },
    { name: 'Galahad_Heros', rank: 'Commandant', online: false },
  ],
  folders: [
    {
      id: 'fld-1',
      title: 'Expéditions Boss & Objets Divins',
      topics: [
        { id: 't-1', author: 'Karthagor', title: 'Chasse au Minotaure', content: 'Rendez-vous en (14, 14) pour récupérer l’Artefact.', date: '21:00' },
      ],
    },
  ],
};

const DEFAULT_SHOP_ITEMS = [
  { id: 'sh-pioche', name: 'Pioche de Récolte', slot: 'right_hand', weaponDamage: 2, armor: 0, reqStrength: 1, price: 80, reserve: 12, rarity: 'Commun' },
  { id: 'sh-lance', name: 'Lance de la Milice', slot: 'right_hand', weaponDamage: 3, armor: 0, reqStrength: 2, price: 160, reserve: 8, rarity: 'Commun' },
  { id: 'sh-tunique', name: 'Tunique Matelassée', slot: 'chest', weaponDamage: 0, armor: 5, reqStrength: 1, price: 120, reserve: 10, rarity: 'Commun' },
];

const DEFAULT_MARKET_LISTINGS = [
  {
    id: 'mk-1',
    seller: 'Galahad_Heros',
    race: 'Humain',
    price: 350,
    item: { id: 'it-hache', name: 'Hache des Anciens', slot: 'right_hand', weaponDamage: 4, armor: 0, reqStrength: 3, rarity: 'Rare' },
  },
];

export default function App() {
  const savedState = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeCharIndex, setActiveCharIndex] = useState<number>(savedState?.activeCharIndex ?? 0);

  const [characters, setCharacters] = useState<any[]>(
    savedState?.characters ?? [
      {
        id: '00000000-0000-0000-0000-000000000001',
        pseudo: 'Karthagor',
        race: 'Humain',
        rank: 'Mortel',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        map: 'men',
        x: 12,
        y: 13,
        hp_current: 100,
        hp_max: 100,
        energy_current: 50,
        energy_max: 50,
        divine_energy_current: 0,
        divine_energy_max: 0,
        strength: 8,
        agility: 7,
        recovery: 5,
        see: 5,
        gold: 1450,
        xp: 320,
        chest_capacity: 5,
        chest: [],
        equipped: {
          head: null, amulet: null, chest: null, bracelet_left: null, bracelet_right: null,
          left_hand: null, right_hand: null, ring_left: null, ring_right: null, foot: null,
          specials: [null, null, null, null, null],
        },
        bag: DEFAULT_BAG_ITEMS,
      },
    ]
  );

  const activeChar = characters[activeCharIndex] || characters[0];

  const [entities, setEntities] = useState<any[]>(savedState?.entities ?? DEFAULT_ENTITIES);
  const [guildData, setGuildData] = useState<any>(savedState?.guildData ?? DEFAULT_GUILD);
  const [factionShopItems, setFactionShopItems] = useState<any[]>(savedState?.factionShopItems ?? DEFAULT_SHOP_ITEMS);
  const [marketListings, setMarketListings] = useState<any[]>(savedState?.marketListings ?? DEFAULT_MARKET_LISTINGS);

  const [mounts, setMounts] = useState<any[]>(
    savedState?.mounts ?? [
      {
        id: 'mnt-dragon',
        name: 'Dragon de Rubis Ancien',
        summoned: false,
        hp_current: 450,
        hp_max: 450,
        energy_current: 120,
        energy_max: 120,
        recovery_hp: 15,
        recovery_energy: 20,
        armor: 20,
        bonus_range: 2,
        bonus_see: 2,
        attackName: 'Cracher du feu',
        attackDamage: 65,
        attackEnergyCost: 15,
      },
    ]
  );
  const activeMount = mounts[0];

  const [summonedMonsters, setSummonedMonsters] = useState<any[]>(
    savedState?.summonedMonsters ?? [
      { id: 'sum-golem', name: 'Golem d’Éther Invoqué', map: 'men', x: 10, y: 12, hp_current: 280, hp_max: 280, energy_current: 75, energy_max: 75, see: 4 },
    ]
  );
  const [controlledSummonId, setControlledSummonId] = useState<string | null>(null);
  const controlledSummon = summonedMonsters.find((s) => s.id === controlledSummonId) || null;

  const [humanPact, setHumanPact] = useState<any>(
    savedState?.humanPact ?? {
      partnerName: 'Azazel_Duc', partnerRace: 'Demon', partnerRank: 'Duc', partnerStrength: 24, partnerAgility: 18, bonusActive: false,
    }
  );
  const [etherealPacts, setEtherealPacts] = useState<any[]>(savedState?.etherealPacts ?? []);
  const [faithState, setFaithState] = useState<any>(
    savedState?.faithState ?? {
      godName: 'Uriel_Divin',
      selectedBlessingType: 'strength',
      pendingGodRequests: [
        { id: 'req-1', believerName: 'Elora_Mortelle', requestType: 'Soin Complet (+150 PV)', costDivine: 10 },
      ],
    }
  );

  const [hoveredTile, setHoveredTile] = useState<any>(null);
  const [selectedTile, setSelectedTile] = useState<any>(null);
  const [inspectedTile, setInspectedTile] = useState<any>(null);

  const [historyLogs, setHistoryLogs] = useState<any[]>(
    savedState?.historyLogs ?? [
      { id: 1, time: '12:00:00', type: 'info', source: 'Système', target: 'Karthagor', text: 'Bienvenue dans Angemoniaque. Votre progression est sauvegardée automatiquement.' },
    ]
  );
  const [visionMessages, setVisionMessages] = useState<any[]>(savedState?.visionMessages ?? []);
  const [guildMessages, setGuildMessages] = useState<any[]>(savedState?.guildMessages ?? []);
  const [mailMessages, setMailMessages] = useState<any[]>(savedState?.mailMessages ?? []);

  // Persistance automatique dans localStorage à chaque action (Point 6)
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          activeCharIndex,
          characters,
          entities,
          guildData,
          factionShopItems,
          marketListings,
          mounts,
          summonedMonsters,
          humanPact,
          etherealPacts,
          faithState,
          historyLogs,
          visionMessages,
          guildMessages,
          mailMessages,
        })
      );
    } catch (e) {
      console.error('Erreur sauvegarde localStorage:', e);
    }
  }, [
    activeCharIndex,
    characters,
    entities,
    guildData,
    factionShopItems,
    marketListings,
    mounts,
    summonedMonsters,
    humanPact,
    etherealPacts,
    faithState,
    historyLogs,
    visionMessages,
    guildMessages,
    mailMessages,
  ]);

  const addLog = useCallback((type: string, source: string, target: string, text: string) => {
    const time = new Date().toTimeString().split(' ')[0];
    setHistoryLogs((prev) => [{ id: Date.now() + Math.random(), time, type, source, target, text }, ...prev].slice(0, 100));
  }, []);

  // Calcul des caractéristiques : Armure = 0 à nu, Dégâts = Arme * (Force - Force requise équipements) ou 1 à mains nues
  const computedStats = useMemo(() => {
    const eq = activeChar.equipped || {};
    let equippedArmor = 0;
    let reqStrengthTotal = 0;
    let bonusStr = 0;
    let bonusAgi = 0;

    Object.entries(eq).forEach(([key, val]: [string, any]) => {
      if (key === 'specials' && Array.isArray(val)) {
        val.forEach((sp) => {
          if (sp) {
            equippedArmor += sp.armor || 0;
            reqStrengthTotal += sp.reqStrength || 0;
            bonusStr += sp.strengthBonus || 0;
            bonusAgi += sp.agilityBonus || 0;
          }
        });
      } else if (val && typeof val === 'object') {
        equippedArmor += val.armor || 0;
        reqStrengthTotal += val.reqStrength || 0;
        bonusStr += val.strengthBonus || 0;
        bonusAgi += val.agilityBonus || 0;
      }
    });

    const pactStr = activeChar.race === 'Humain' && humanPact?.bonusActive ? Math.floor(humanPact.partnerStrength * 0.5) : 0;
    const pactAgi = activeChar.race === 'Humain' && humanPact?.bonusActive ? Math.floor(humanPact.partnerAgility * 0.5) : 0;

    const totalStrength = activeChar.strength + bonusStr + pactStr;
    const totalAgility = activeChar.agility + bonusAgi + pactAgi;

    const weapon = eq.right_hand?.weaponDamage ? eq.right_hand : eq.left_hand?.weaponDamage ? eq.left_hand : null;
    const effectiveStrength = Math.max(0, totalStrength - reqStrengthTotal);
    const damage = weapon ? Math.max(1, weapon.weaponDamage * effectiveStrength) : 1;

    const mountSee = activeMount?.summoned && !controlledSummon ? activeMount.bonus_see : 0;
    const hasDivine = hasDivineEnergyAccess(activeChar.race, activeChar.rank);

    return {
      armor: equippedArmor,
      strength: totalStrength,
      reqStrength: reqStrengthTotal,
      agility: totalAgility,
      damage,
      weaponName: weapon ? `${weapon.name} (×${weapon.weaponDamage})` : 'Mains nues (1 dégât de base)',
      see: controlledSummon ? controlledSummon.see : activeChar.see + mountSee,
      hasDivineEnergy: hasDivine,
    };
  }, [activeChar, humanPact, activeMount, controlledSummon]);

  const currentActor = useMemo(() => {
    if (controlledSummon) {
      return { ...controlledSummon, isSummon: true };
    }
    const mounted = Boolean(activeMount?.summoned);
    return {
      isSummon: false,
      name: activeChar.pseudo,
      map: activeChar.map,
      x: activeChar.x,
      y: activeChar.y,
      hp_current: activeChar.hp_current,
      hp_max: activeChar.hp_max,
      energy_current: mounted ? activeMount.energy_current : activeChar.energy_current,
      energy_max: mounted ? activeMount.energy_max : activeChar.energy_max,
      usingMountEnergy: mounted,
      see: computedStats.see,
    };
  }, [controlledSummon, activeChar, activeMount, computedStats.see]);

  // Collisions strictes : empêche deux joueurs ou un joueur et un bâtiment/monstre d'occuper la même case
  const isTileBlocked = useCallback(
    (mapKey: string, tx: number, ty: number) => {
      const entityOnTile = entities.find((e) => e.map === mapKey && e.x === tx && e.y === ty);
      if (entityOnTile) return entityOnTile;
      const summonOnTile = summonedMonsters.find((s) => s.map === mapKey && s.x === tx && s.y === ty);
      if (summonOnTile) return summonOnTile;
      if (controlledSummon && activeChar.map === mapKey && activeChar.x === tx && activeChar.y === ty) {
        return activeChar;
      }
      return null;
    },
    [entities, summonedMonsters, controlledSummon, activeChar]
  );

  // Débite l'énergie de la monture si active, sinon celle du joueur ou de l'invocation
  const deductEnergy = useCallback(
    (cost: number) => {
      if (controlledSummon) {
        setSummonedMonsters((prev) =>
          prev.map((s) => (s.id === controlledSummon.id ? { ...s, energy_current: Math.max(0, s.energy_current - cost) } : s))
        );
      } else if (activeMount?.summoned) {
        setMounts((prev) =>
          prev.map((m, i) => (i === 0 ? { ...m, energy_current: Math.max(0, m.energy_current - cost) } : m))
        );
      } else {
        setCharacters((prev) =>
          prev.map((c, i) => (i === activeCharIndex ? { ...c, energy_current: Math.max(0, c.energy_current - cost) } : c))
        );
      }
    },
    [controlledSummon, activeMount, activeCharIndex]
  );

  const handleMoveTo = async (targetX: number, targetY: number) => {
    if (targetX < 0 || targetY < 0 || targetX >= 25 || targetY >= 25) return;
    if (activeChar.isBlocked) {
      addLog('error', 'Système', activeChar.pseudo, 'Ce personnage est actuellement bloqué par un administrateur.');
      return;
    }

    const fullPath = computePathEnergy(currentActor.map, currentActor.x, currentActor.y, targetX, targetY);
    if (fullPath.steps === 0) return;

    const blockerOnTarget = isTileBlocked(currentActor.map, targetX, targetY);
    let finalX = targetX;
    let finalY = targetY;

    if (blockerOnTarget) {
      if (fullPath.steps === 1) {
        addLog('collision', currentActor.name, blockerOnTarget.name || `(${targetX},${targetY})`, `Case (${targetX}, ${targetY}) occupée par ${blockerOnTarget.name}.`);
        return;
      }
      const prevStep = fullPath.path[fullPath.path.length - 2];
      if (!prevStep || isTileBlocked(currentActor.map, prevStep.x, prevStep.y)) {
        addLog('collision', currentActor.name, blockerOnTarget.name, 'Aucune case adjacente libre sur ce trajet.');
        return;
      }
      finalX = prevStep.x;
      finalY = prevStep.y;
    }

    const effectivePath = computePathEnergy(currentActor.map, currentActor.x, currentActor.y, finalX, finalY);
    if (effectivePath.steps === 0) return;

    if (currentActor.energy_current < effectivePath.energy) {
      addLog('error', currentActor.name, `(${finalX},${finalY})`, `Énergie insuffisante (${effectivePath.energy} requise, ${currentActor.energy_current} disponible).`);
      return;
    }

    deductEnergy(effectivePath.energy);

    if (controlledSummon) {
      setSummonedMonsters((prev) =>
        prev.map((s) => (s.id === controlledSummon.id ? { ...s, x: finalX, y: finalY } : s))
      );
    } else {
      setCharacters((prev) =>
        prev.map((c, i) => (i === activeCharIndex ? { ...c, x: finalX, y: finalY } : c))
      );
    }

    apiClient('/map/move', {
      method: 'POST',
      body: JSON.stringify({
        characterId: activeChar.id,
        mapName: MAPS_CONFIG[currentActor.map].sqlName,
        startX: currentActor.x,
        startY: currentActor.y,
        targetX: finalX,
        targetY: finalY,
      }),
    }).catch(() => {});

    const sourceEnergyText = currentActor.usingMountEnergy ? `Énergie Monture (${activeMount.name})` : 'Énergie Personnage';
    addLog('move', currentActor.name, `(${finalX},${finalY})`, `Déplacement en (${finalX}, ${finalY}) (-${effectivePath.energy} ${sourceEnergyText}).`);
    setSelectedTile(null);
  };

  const handleSimulateHourlyTick = () => {
    setCharacters((prev) =>
      prev.map((c) => ({
        ...c,
        hp_current: Math.min(c.hp_max, c.hp_current + c.recovery),
        energy_current: Math.min(c.energy_max, c.energy_current + c.recovery),
        xp: c.xp + 2,
        gold: c.gold + 25,
      }))
    );
    setMounts((prev) =>
      prev.map((m) => ({
        ...m,
        hp_current: Math.min(m.hp_max, m.hp_current + (m.recovery_hp || 10)),
        energy_current: Math.min(m.energy_max, m.energy_current + (m.recovery_energy || 15)),
      }))
    );
    addLog('hourly', 'Cycle Horaire', activeChar.pseudo, `Régénération horaire appliquée au héros (+${activeChar.recovery}) et à la monture (+${activeMount.recovery_hp} Vie, +${activeMount.recovery_energy} Énergie).`);
  };

  const handleAttackEntity = (target: any, useMountBreath: boolean) => {
    const cost = useMountBreath ? activeMount.attackEnergyCost : 5;
    if (currentActor.energy_current < cost) {
      addLog('error', currentActor.name, target.name, `Énergie insuffisante pour attaquer (${cost} requise).`);
      return;
    }
    deductEnergy(cost);

    const rawDamage = useMountBreath ? activeMount.attackDamage : computedStats.damage;
    const inflicted = Math.max(1, rawDamage - Math.floor((target.armor || 0) * 0.25));
    const nextHp = Math.max(0, target.hp - inflicted);

    setEntities((prev) =>
      prev.map((e) => (e.id === target.id ? { ...e, hp: nextHp } : e)).filter((e) => e.hp > 0)
    );

    addLog(
      'combat',
      currentActor.name,
      target.name,
      `${useMountBreath ? activeMount.attackName : 'Attaque'} sur ${target.name} : -${inflicted} PV (${cost} Énergie).`
    );
    setSelectedTile(null);
  };

  const handleUnequipSlot = (slotKey: string, specialIndex?: number) => {
    setCharacters((prev) =>
      prev.map((c, idx) => {
        if (idx !== activeCharIndex || c.bag.length >= 20) return c;
        if (slotKey === 'specials' && typeof specialIndex === 'number') {
          const item = c.equipped.specials[specialIndex];
          if (!item) return c;
          const nextSpecials = [...c.equipped.specials];
          nextSpecials[specialIndex] = null;
          return { ...c, equipped: { ...c.equipped, specials: nextSpecials }, bag: [...c.bag, item] };
        }
        const item = c.equipped[slotKey];
        if (!item) return c;
        return { ...c, equipped: { ...c.equipped, [slotKey]: null }, bag: [...c.bag, item] };
      })
    );
  };

  const handleEquipFromBag = (bagIndex: number) => {
    setCharacters((prev) =>
      prev.map((c, idx) => {
        if (idx !== activeCharIndex) return c;
        const item = c.bag[bagIndex];
        if (!item) return c;
        const maxSpecials = c.race === 'Humain' ? 5 : 4;
        if (item.slot === 'special') {
          const freeIdx = c.equipped.specials.slice(0, maxSpecials).findIndex((s: any) => s === null);
          if (freeIdx === -1) return c;
          const nextSpecials = [...c.equipped.specials];
          nextSpecials[freeIdx] = item;
          return { ...c, equipped: { ...c.equipped, specials: nextSpecials }, bag: c.bag.filter((_: any, i: number) => i !== bagIndex) };
        }
        const prevItem = c.equipped[item.slot];
        const nextBag = c.bag.filter((_: any, i: number) => i !== bagIndex);
        if (prevItem) nextBag.push(prevItem);
        return { ...c, equipped: { ...c.equipped, [item.slot]: item }, bag: nextBag };
      })
    );
  };

  useSharedMultiplayerMap({
    characterId: activeChar.id,
    onViewportLoaded: () => {},
    onRemoteEntityUpdated: () => {},
  });

  const activeTileCard = selectedTile || hoveredTile;
  const activeTilePath = useMemo(() => {
    if (!activeTileCard) return null;
    return computePathEnergy(currentActor.map, currentActor.x, currentActor.y, activeTileCard.x, activeTileCard.y);
  }, [activeTileCard, currentActor.map, currentActor.x, currentActor.y]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-slate-100 select-none font-sans">
      <ThreeTacticalMap
        currentActor={currentActor}
        activeChar={activeChar}
        entities={entities}
        summonedMonsters={summonedMonsters}
        selectedTile={selectedTile}
        activeMount={activeMount}
        controlledSummon={controlledSummon}
        onHoverTile={setHoveredTile}
        onSelectTile={setSelectedTile}
      />

      <TopNavMedallions
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        onGoHome={() => setActiveModal('account')}
        onStepDirection={(dx, dy) => handleMoveTo(currentActor.x + dx, currentActor.y + dy)}
        currentActor={currentActor}
        activeChar={activeChar}
        computedStats={computedStats}
        activeMount={activeMount}
        controlledSummon={controlledSummon}
        mapLabel={MAPS_CONFIG[currentActor.map].name.split(' ')[0]}
      />

      <RightCharacterPanel
        activeChar={activeChar}
        characters={characters}
        activeCharIndex={activeCharIndex}
        onSelectChar={(idx) => { setActiveCharIndex(idx); setControlledSummonId(null); }}
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        historyCount={historyLogs.length}
        controlledSummon={controlledSummon}
      />

      <TileActionPopup
        activeTileCard={activeTileCard}
        selectedTile={selectedTile}
        activeTilePath={activeTilePath}
        currentActor={currentActor}
        activeMount={activeMount}
        controlledSummon={controlledSummon}
        onCloseSelected={() => setSelectedTile(null)}
        onMoveTo={handleMoveTo}
        onAttackTile={(tile, breath) => tile.entity && handleAttackEntity(tile.entity, breath)}
        onInteractBuilding={(tile) => {
          if (tile.entity?.subType === 'portal') {
            const nextMap = tile.entity.targetMap || 'ethereal';
            setCharacters((prev) => prev.map((c, i) => (i === activeCharIndex ? { ...c, map: nextMap, x: 12, y: 13 } : c)));
            addLog('portal', activeChar.pseudo, tile.entity.name, `Traversée du portail vers ${MAPS_CONFIG[nextMap].name}.`);
            setSelectedTile(null);
          } else {
            setActiveModal('building_hub');
          }
        }}
        onHarvestTile={(tile) => {
          deductEnergy(4);
          setCharacters((prev) => prev.map((c, i) => (i === activeCharIndex ? { ...c, gold: c.gold + 35 } : c)));
          addLog('harvest', currentActor.name, tile.tileInfo.resource, `Récolte de ${tile.tileInfo.resource} (-4 Énergie, +35 Or).`);
          setSelectedTile(null);
        }}
        onPlaceStructure={(tile, name) => {
          if (isTileBlocked(currentActor.map, tile.x, tile.y)) return;
          const moveCost = activeTilePath?.energy || 0;
          if (currentActor.energy_current < moveCost + 10) return;
          deductEnergy(moveCost + 10);
          setEntities((prev) => [
            ...prev,
            { id: `b-${Date.now()}`, map: currentActor.map, x: tile.x, y: tile.y, kind: 'building', name, blocks: true, hp: 400, hpMax: 400, armor: 20 },
          ]);
          addLog('build', currentActor.name, name, `Construction de ${name} en (${tile.x}, ${tile.y}) (-${moveCost + 10} Énergie).`);
          setSelectedTile(null);
        }}
        onInspectDetails={(tile) => {
          setInspectedTile(tile);
          setActiveModal('entity_details');
        }}
      />

      {activeModal && (
        <ModalWindow
          title={MODAL_TITLES_FR[activeModal] || 'Section'}
          onClose={() => setActiveModal(null)}
        >
          {/* 1. PACTES & FIDÈLES */}
          {activeModal === 'pacts' && (
            <PactsAndFaithModal
              activeChar={activeChar}
              humanPact={humanPact}
              setHumanPact={setHumanPact}
              etherealPacts={etherealPacts}
              setEtherealPacts={setEtherealPacts}
              faithState={faithState}
              setFaithState={setFaithState}
              onSwitchDemoRaceRank={(race, rank) =>
                setCharacters((prev) =>
                  prev.map((c, i) => {
                    if (i !== activeCharIndex) return c;
                    const nextRank = rank || c.rank;
                    const getsDivine = hasDivineEnergyAccess(race, nextRank);
                    return {
                      ...c,
                      race,
                      rank: nextRank,
                      divine_energy_max: getsDivine ? 50 : 0,
                      divine_energy_current: getsDivine ? 25 : 0,
                    };
                  })
                )
              }
              onSpendDivineEnergy={(amount) =>
                setCharacters((prev) =>
                  prev.map((c, i) =>
                    i === activeCharIndex ? { ...c, divine_energy_current: Math.max(0, c.divine_energy_current - amount) } : c
                  )
                )
              }
              addLog={addLog}
            />
          )}

          {/* 2. INVOCATIONS & MONTURES */}
          {activeModal === 'mounts' && (
            <MountsAndSummonsModal
              mounts={mounts}
              onToggleMount={(mId) =>
                setMounts((prev) => prev.map((m) => (m.id === mId ? { ...m, summoned: !m.summoned } : m)))
              }
              summonedMonsters={summonedMonsters}
              controlledSummonId={controlledSummonId}
              onSwitchSummonControl={(sId) => { setControlledSummonId(sId); setActiveModal(null); }}
              heroPseudo={activeChar.pseudo}
            />
          )}

          {/* 3. ACTIONS AUTOUR DU PERSONNAGE */}
          {activeModal === 'actions' && (
            <LocalActionsModal
              currentActor={currentActor}
              activeChar={activeChar}
              entities={entities}
              activeMount={activeMount}
              hasDivineEnergy={computedStats.hasDivineEnergy}
              onInteractBuilding={(b) => {
                if (b.subType === 'portal') {
                  const nextMap = b.targetMap || 'ethereal';
                  setCharacters((prev) => prev.map((c, i) => (i === activeCharIndex ? { ...c, map: nextMap, x: 12, y: 13 } : c)));
                  setActiveModal(null);
                } else {
                  setActiveModal('building_hub');
                }
              }}
              onAttackEntity={(target, breath) => {
                handleAttackEntity(target, breath);
                setActiveModal(null);
              }}
              onCastSpell={(spell) => {
                if (currentActor.energy_current < spell.cost) return;
                deductEnergy(spell.cost);
                if (spell.type === 'summon') {
                  const freeSpot = [
                    { x: currentActor.x + 1, y: currentActor.y },
                    { x: currentActor.x - 1, y: currentActor.y },
                    { x: currentActor.x, y: currentActor.y + 1 },
                  ].find((p) => !isTileBlocked(currentActor.map, p.x, p.y));
                  if (freeSpot) {
                    setSummonedMonsters((prev) => [
                      ...prev,
                      { id: `sum-${Date.now()}`, name: 'Golem Invoqué', map: currentActor.map, x: freeSpot.x, y: freeSpot.y, hp_current: 250, hp_max: 250, energy_current: 60, energy_max: 60, see: 4 },
                    ]);
                  }
                } else if (spell.type === 'buff') {
                  setCharacters((prev) =>
                    prev.map((c, i) => (i === activeCharIndex ? { ...c, strength: c.strength + 4, agility: c.agility + 4 } : c))
                  );
                }
                addLog('spell', activeChar.pseudo, spell.name, `Sort lancé : ${spell.name} (-${spell.cost} Énergie).`);
                setActiveModal(null);
              }}
              onHarvestLocal={() => {
                deductEnergy(4);
                setCharacters((prev) => prev.map((c, i) => (i === activeCharIndex ? { ...c, gold: c.gold + 30 } : c)));
                addLog('harvest', activeChar.pseudo, `(${currentActor.x},${currentActor.y})`, 'Récolte locale effectuée (+30 Or).');
                setActiveModal(null);
              }}
              onPlaceLocalBuilding={(bName) => {
                const adjSpot = [
                  { x: currentActor.x + 1, y: currentActor.y },
                  { x: currentActor.x - 1, y: currentActor.y },
                  { x: currentActor.x, y: currentActor.y + 1 },
                  { x: currentActor.x, y: currentActor.y - 1 },
                ].find((p) => !isTileBlocked(currentActor.map, p.x, p.y));
                if (!adjSpot) return;
                deductEnergy(10);
                setEntities((prev) => [
                  ...prev,
                  { id: `b-${Date.now()}`, map: currentActor.map, x: adjSpot.x, y: adjSpot.y, kind: 'building', name: bName, blocks: true, hp: 500, hpMax: 500, armor: 25 },
                ]);
                addLog('build', activeChar.pseudo, bName, `${bName} posé sur la case adjacente (${adjSpot.x}, ${adjSpot.y}).`);
                setActiveModal(null);
              }}
              onUpgradeStat={(statKey, cost, bonus, label) => {
                if (activeChar.xp < cost) return;
                setCharacters((prev) =>
                  prev.map((c, i) => (i === activeCharIndex ? { ...c, xp: c.xp - cost, [statKey]: c[statKey] + bonus } : c))
                );
                addLog('upgrade', activeChar.pseudo, label, `Amélioration : ${label} +${bonus} (-${cost} XP).`);
              }}
            />
          )}

          {/* 4. GUILDE COMPLÈTE */}
          {activeModal === 'guild' && (
            <GuildOverlayModal
              guildData={guildData}
              setGuildData={setGuildData}
              activeCharPseudo={activeChar.pseudo}
              addLog={addLog}
            />
          )}

          {/* 5. CARTE GLOBALE DU MONDE */}
          {activeModal === 'worldmap' && (
            <WorldMapOverviewModal
              currentActor={currentActor}
              entities={entities}
              mapsConfig={MAPS_CONFIG}
              onSwitchMap={(mKey) =>
                setCharacters((prev) => prev.map((c, i) => (i === activeCharIndex ? { ...c, map: mKey } : c)))
              }
            />
          )}

          {/* INVENTAIRE EN ÉTOILE */}
          {activeModal === 'inventory' && (
            <StarInventoryModal
              activeChar={activeChar}
              computedStats={computedStats}
              onAvatarUpload={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () =>
                  setCharacters((prev) => prev.map((c, i) => (i === activeCharIndex ? { ...c, avatar: reader.result } : c)));
                reader.readAsDataURL(file);
              }}
              onUnequipSlot={handleUnequipSlot}
              onEquipFromBag={handleEquipFromBag}
            />
          )}

          {/* PARCHEMIN D'HISTORIQUE */}
          {activeModal === 'history' && (
            <HistoryScrollModal historyLogs={historyLogs} />
          )}

          {/* CAPITALE DE FACTION : BOUTIQUE, MARCHÉ & COFFRE ÉVOLUTIF (0 ÉNERGIE) */}
          {activeModal === 'building_hub' && (
            <CapitalBuildingModal
              activeChar={activeChar}
              factionShopItems={factionShopItems}
              setFactionShopItems={setFactionShopItems}
              marketListings={marketListings}
              setMarketListings={setMarketListings}
              onBuyShopItem={(item) => {
                if (activeChar.gold < item.price || item.reserve <= 0 || activeChar.bag.length >= 20) return;
                setFactionShopItems((prev) =>
                  prev.map((s) => (s.id === item.id ? { ...s, reserve: s.reserve - 1 } : s))
                );
                setCharacters((prev) =>
                  prev.map((c, i) =>
                    i === activeCharIndex
                      ? { ...c, gold: c.gold - item.price, bag: [...c.bag, { ...item, id: `bought-${Date.now()}` }] }
                      : c
                  )
                );
                addLog('shop', activeChar.pseudo, item.name, `Achat en boutique de faction : ${item.name} (-${item.price} Or, 0 Énergie).`);
              }}
              onBuyMarketListing={(listing) => {
                if (activeChar.gold < listing.price || activeChar.bag.length >= 20) return;
                setMarketListings((prev) => prev.filter((l) => l.id !== listing.id));
                setCharacters((prev) =>
                  prev.map((c, i) =>
                    i === activeCharIndex
                      ? { ...c, gold: c.gold - listing.price, bag: [...c.bag, listing.item] }
                      : c
                  )
                );
                addLog('market', activeChar.pseudo, listing.item.name, `Achat au marché auprès de ${listing.seller} (-${listing.price} Or).`);
              }}
              onListBagItemOnMarket={(bagIdx, price) => {
                const itemToSell = activeChar.bag[bagIdx];
                if (!itemToSell) return;
                setMarketListings((prev) => [
                  ...prev,
                  { id: `mk-${Date.now()}`, seller: activeChar.pseudo, race: activeChar.race, price, item: itemToSell },
                ]);
                setCharacters((prev) =>
                  prev.map((c, i) =>
                    i === activeCharIndex ? { ...c, bag: c.bag.filter((_: any, idx: number) => idx !== bagIdx) } : c
                  )
                );
                addLog('market', activeChar.pseudo, itemToSell.name, `Mise en vente sur le marché pour ${price} Or.`);
              }}
              onExpandChest={(cost) => {
                if (activeChar.gold < cost) return;
                setCharacters((prev) =>
                  prev.map((c, i) =>
                    i === activeCharIndex
                      ? { ...c, gold: c.gold - cost, chest_capacity: (c.chest_capacity || 5) + 1 }
                      : c
                  )
                );
                addLog('vault', activeChar.pseudo, 'Coffre Personnel', `Extension du coffre (+1 espace) pour ${cost} Or.`);
              }}
              onDepositToChest={(bagIdx) => {
                const item = activeChar.bag[bagIdx];
                if (!item || (activeChar.chest?.length || 0) >= (activeChar.chest_capacity || 5)) return;
                setCharacters((prev) =>
                  prev.map((c, i) =>
                    i === activeCharIndex
                      ? {
                          ...c,
                          bag: c.bag.filter((_: any, idx: number) => idx !== bagIdx),
                          chest: [...(c.chest || []), item],
                        }
                      : c
                  )
                );
              }}
              onWithdrawFromChest={(chestIdx) => {
                const item = activeChar.chest?.[chestIdx];
                if (!item || activeChar.bag.length >= 20) return;
                setCharacters((prev) =>
                  prev.map((c, i) =>
                    i === activeCharIndex
                      ? {
                          ...c,
                          chest: c.chest.filter((_: any, idx: number) => idx !== chestIdx),
                          bag: [...c.bag, item],
                        }
                      : c
                  )
                );
              }}
            />
          )}

          {/* DÉTAILS D'UN AUTRE JOUEUR (CONFIDENTIALITÉ & ÉTAT DE FORME) */}
          {activeModal === 'entity_details' && inspectedTile && (
            <div className="p-4 bg-slate-800 rounded-xl border border-amber-500/40 text-xs space-y-3">
              <div className="text-sm font-bold text-amber-300">
                Case ({inspectedTile.x}, {inspectedTile.y}) — {inspectedTile.tileInfo.type}
              </div>

              {inspectedTile.entity?.kind === 'player' ? (
                <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/30 space-y-2">
                  <div className="text-sm font-extrabold text-white">
                    Joueur : {inspectedTile.entity.name}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Race : <b className="text-amber-300">{inspectedTile.entity.race}</b></div>
                    <div>Guilde : <b className="text-emerald-300">{inspectedTile.entity.guild || 'Aucune guilde'}</b></div>
                  </div>
                  <div>
                    État de forme :{' '}
                    <b className={getPlayerHealthStatus(inspectedTile.entity.hp, inspectedTile.entity.hpMax).colorClass}>
                      {getPlayerHealthStatus(inspectedTile.entity.hp, inspectedTile.entity.hpMax).label}
                    </b>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-slate-400 mb-1">Équipements visibles portés :</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(inspectedTile.entity.visibleGear || ['Aucun équipement visible']).map((gear: string) => (
                        <span key={gear} className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-amber-200 font-semibold">
                          {gear}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : inspectedTile.entity ? (
                <div className="p-3 bg-slate-900 rounded-xl space-y-1">
                  <div className="font-bold text-white">{inspectedTile.entity.name}</div>
                  <div>Points de Vie : {inspectedTile.entity.hp}/{inspectedTile.entity.hpMax}</div>
                </div>
              ) : (
                <div className="text-slate-400">Case libre.</div>
              )}
            </div>
          )}

          {/* PARAMÈTRES DU COMPTE */}
          {activeModal === 'account' && (
            <AccountSettingsModal
              characters={characters}
              activeChar={activeChar}
              onCreateCharacter={(pseudo) => {
                if (characters.length >= 3) return;
                const baseRace = characters[0].race;
                const newChar = {
                  ...characters[0],
                  id: `char-${Date.now()}`,
                  pseudo,
                  race: baseRace,
                  rank: baseRace === 'Humain' ? 'Mortel' : 'Soldat',
                  x: 11 + characters.length,
                  y: 13,
                  bag: [],
                  chest: [],
                };
                setCharacters((prev) => [...prev, newChar]);
                addLog('account', 'Compte', pseudo, `Création du personnage ${pseudo} (${baseRace}).`);
              }}
              onSimulateHourlyTick={handleSimulateHourlyTick}
              onOpenAdmin={() => setActiveModal('admin')}
              onResetSave={() => {
                localStorage.removeItem(STORAGE_KEY);
                window.location.reload();
              }}
            />
          )}

          {/* ESPACE ADMINISTRATEUR */}
          {activeModal === 'admin' && (
            <AdminDashboard
              characters={characters}
              setCharacters={setCharacters}
              entities={entities}
              setEntities={setEntities}
              mounts={mounts}
              setMounts={setMounts}
              addLog={addLog}
            />
          )}
        </ModalWindow>
      )}

      <div className="absolute bottom-4 left-4 z-20">
        <button
          onClick={() => setActiveModal(activeModal === 'account' ? null : 'account')}
          className="w-14 h-14 rounded-2xl bg-slate-900/90 border-2 border-amber-500/60 shadow-2xl flex flex-col items-center justify-center text-amber-300 hover:scale-105 transition"
        >
          <Settings className="w-6 h-6" />
          <span className="text-[9px] font-bold uppercase mt-0.5">Compte</span>
        </button>
      </div>

      <ChatWidget
        visionMessages={visionMessages}
        guildMessages={guildMessages}
        mailMessages={mailMessages}
        onSendVision={(text) => setVisionMessages((prev) => [...prev, { id: `${Date.now()}`, sender: activeChar.pseudo, text }])}
        onSendGuild={(text) => setGuildMessages((prev) => [...prev, { id: `${Date.now()}`, sender: activeChar.pseudo, text }].slice(-100))}
        onSendMail={(_recipient, subject, body) =>
          setMailMessages((prev) => [{ id: `${Date.now()}`, sender: activeChar.pseudo, subject, body, unread: false }, ...prev])
        }
        onMarkMailRead={() => setMailMessages((prev) => prev.map((m) => ({ ...m, unread: false })))}
      />
    </div>
  );
}