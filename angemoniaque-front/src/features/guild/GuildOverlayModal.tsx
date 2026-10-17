import React, { useState } from 'react';
import { Upload, ShieldCheck, Users, MessageSquare, Settings, Plus, Lock, Eye, UserPlus } from 'lucide-react';

interface GuildOverlayModalProps {
  guildState: any;
  setGuildState: React.Dispatch<React.SetStateAction<any>>;
  activeCharPseudo: string;
  onValidateImageSize: (file: File) => boolean;
  addLog: (type: string, source: string, target: string, text: string) => void;
}

export const GuildOverlayModal: React.FC<GuildOverlayModalProps> = ({
  guildState,
  setGuildState,
  activeCharPseudo,
  onValidateImageSize,
  addLog,
}) => {
  // 4 Onglets : 1. Présentation (par défaut), 2. Liste, 3. Forum, 4. Gestion (uniquement Chef)
  const [activeTab, setActiveTab] = useState<'presentation' | 'liste' | 'forum' | 'gestion'>('presentation');

  // Formulaires Forum & Gestion
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [newCategoryRanks, setNewCategoryRanks] = useState<string[]>(['Chef', 'Officier', 'Membre']);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(guildState.categories[0]?.id || 'cat-1');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [newTopicRanks, setNewTopicRanks] = useState<string[]>(['Chef', 'Officier', 'Membre']);

  const [newRankName, setNewRankName] = useState('');
  const [newRankPerms, setNewRankPerms] = useState({
    accept_applicants: false,
    send_invites: false,
    create_topics: true,
    assign_ranks: false,
  });
  const [invitePseudo, setInvitePseudo] = useState('');

  // Rang actuel du joueur connecté dans la guilde
  const currentMember = guildState.members.find((m: any) => m.pseudo === activeCharPseudo) || guildState.members[0];
  const currentRankObj = guildState.ranks.find((r: any) => r.name === currentMember?.rank) || guildState.ranks[0];
  const isLeader = currentRankObj?.isLeader === true;
  const perms = currentRankObj?.permissions || {};

  // Compteur de mots pour la description (max 1000 mots)
  const countWords = (text: string) =>
    text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!onValidateImageSize(file)) return;
    const reader = new FileReader();
    reader.onload = () => {
      setGuildState((prev: any) => ({ ...prev, logo: reader.result }));
      addLog('guild', activeCharPseudo, guildState.name, 'Logo de la guilde mis à jour (< 2 Mo).');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* En-tête de navigation des 4 onglets de la Guilde */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('presentation')}
            className={`px-3.5 py-2 rounded-xl font-extrabold flex items-center gap-1.5 transition ${
              activeTab === 'presentation' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> 1. Présentation
          </button>

          <button
            onClick={() => setActiveTab('liste')}
            className={`px-3.5 py-2 rounded-xl font-extrabold flex items-center gap-1.5 transition ${
              activeTab === 'liste' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" /> 2. Liste ({guildState.members.length})
          </button>

          <button
            onClick={() => setActiveTab('forum')}
            className={`px-3.5 py-2 rounded-xl font-extrabold flex items-center gap-1.5 transition ${
              activeTab === 'forum' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> 3. Forum
          </button>

          {/* Dernier onglet UNIQUEMENT visible par le Chef de la guilde */}
          {isLeader && (
            <button
              onClick={() => setActiveTab('gestion')}
              className={`px-3.5 py-2 rounded-xl font-extrabold flex items-center gap-1.5 transition ${
                activeTab === 'gestion' ? 'bg-purple-500 text-white' : 'bg-purple-950/70 text-purple-300 border border-purple-500/40'
              }`}
            >
              <Settings className="w-4 h-4" /> 4. Gestion (Chef)
            </button>
          )}
        </div>

        {/* Sélecteur rapide de test pour vérifier les droits selon le rang */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400">Votre rang actuel :</span>
          <select
            value={currentMember?.rank}
            onChange={(e) => {
              const nextR = e.target.value;
              setGuildState((prev: any) => ({
                ...prev,
                members: prev.members.map((m: any) =>
                  m.pseudo === activeCharPseudo ? { ...m, rank: nextR } : m
                ),
              }));
              if (nextR !== 'Chef' && activeTab === 'gestion') setActiveTab('presentation');
            }}
            className="bg-slate-800 text-amber-300 font-bold rounded px-2 py-0.5 text-[11px]"
          >
            {guildState.ranks.map((r: any) => (
              <option key={r.name} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ==========================================
          ONGLET 1 : PRÉSENTATION (Logo en gros, Mantra 120 car. max, Description 1000 mots max)
         ========================================== */}
      {activeTab === 'presentation' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 bg-slate-800/80 border border-amber-500/40 rounded-2xl p-5 flex flex-col items-center text-center space-y-3">
            <div className="relative w-36 h-36 rounded-2xl border-4 border-amber-500 shadow-2xl overflow-hidden bg-slate-950">
              <img src={guildState.logo} alt={guildState.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-300">{guildState.name}</h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-200">
                [{guildState.tag}]
              </span>
            </div>
            <label className="cursor-pointer px-3 py-2 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 rounded-xl border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 transition">
              <Upload className="w-3.5 h-3.5" /> Modifier le logo (Max 2 Mo)
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>

          <div className="md:col-span-8 bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
            {/* Mantra : max 120 caractères */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-amber-300 text-sm">Mantra de la Guilde (120 caractères max)</label>
                <span className="text-[10px] text-slate-400">{guildState.mantra.length} / 120 caractères</span>
              </div>
              <input
                type="text"
                maxLength={120}
                value={guildState.mantra}
                onChange={(e) =>
                  setGuildState((prev: any) => ({ ...prev, mantra: e.target.value.slice(0, 120) }))
                }
                className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3.5 py-2 text-amber-100 italic font-serif text-sm"
              />
            </div>

            {/* Description : jusqu'à 1000 mots */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-amber-300 text-sm">Histoire & Description (Jusqu’à 1000 mots)</label>
                <span className="text-[10px] text-slate-400">
                  {countWords(guildState.description)} / 1000 mots
                </span>
              </div>
              <textarea
                rows={7}
                value={guildState.description}
                onChange={(e) => {
                  const val = e.target.value;
                  if (countWords(val) <= 1000) {
                    setGuildState((prev: any) => ({ ...prev, description: val }));
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-slate-200 leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ONGLET 2 : LISTE (Membres, Attribution des rangs selon nos droits, Postulants & Invitations)
         ========================================== */}
      {activeTab === 'liste' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-amber-300">Membres de la Guilde</h3>
              <span className="text-[11px] text-slate-400">
                {perms.assign_ranks || isLeader ? 'Vous avez le droit d’attribuer des rangs' : 'Lecture seule'}
              </span>
            </div>

            <div className="space-y-2">
              {guildState.members.map((m: any) => (
                <div key={m.pseudo} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{m.pseudo}</div>
                    <div className="text-[10px] text-slate-400">{m.race}</div>
                  </div>
                  {perms.assign_ranks || isLeader ? (
                    <select
                      value={m.rank}
                      onChange={(e) => {
                        const newR = e.target.value;
                        setGuildState((prev: any) => ({
                          ...prev,
                          members: prev.members.map((mem: any) =>
                            mem.pseudo === m.pseudo ? { ...m, rank: newR } : mem
                          ),
                        }));
                        addLog('guild', activeCharPseudo, m.pseudo, `Attribution du rang [${newR}] à ${m.pseudo}.`);
                      }}
                      className="bg-slate-800 border border-amber-500/40 rounded-lg px-2.5 py-1 text-amber-300 font-bold"
                    >
                      {guildState.ranks.map((r: any) => (
                        <option key={r.name} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="px-2.5 py-1 rounded bg-slate-800 text-amber-300 font-bold">{m.rank}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-5 bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-4">
            {/* Envoyer une invitation si droit send_invites */}
            <div>
              <h3 className="font-bold text-sm text-emerald-300 mb-2 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" /> Envoyer une Invitation
              </h3>
              {perms.send_invites || isLeader ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={invitePseudo}
                    onChange={(e) => setInvitePseudo(e.target.value)}
                    placeholder="Pseudo du joueur..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                  />
                  <button
                    onClick={() => {
                      if (!invitePseudo.trim()) return;
                      addLog('guild', activeCharPseudo, invitePseudo.trim(), `Invitation de guilde envoyée à ${invitePseudo.trim()}.`);
                      setInvitePseudo('');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg"
                  >
                    Inviter
                  </button>
                </div>
              ) : (
                <div className="text-slate-500 italic">Votre rang ne permet pas d’envoyer des invitations.</div>
              )}
            </div>

            {/* Postulants à accepter si droit accept_applicants */}
            <div className="pt-3 border-t border-slate-700">
              <h3 className="font-bold text-sm text-sky-300 mb-2">Postulants en attente ({guildState.applicants.length})</h3>
              {guildState.applicants.length === 0 ? (
                <div className="text-slate-400">Aucun postulant en attente.</div>
              ) : (
                guildState.applicants.map((app: any) => (
                  <div key={app.pseudo} className="p-2.5 bg-slate-900 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{app.pseudo}</div>
                      <div className="text-[10px] text-slate-400">{app.race}</div>
                    </div>
                    {perms.accept_applicants || isLeader ? (
                      <button
                        onClick={() => {
                          setGuildState((prev: any) => ({
                            ...prev,
                            applicants: prev.applicants.filter((a: any) => a.pseudo !== app.pseudo),
                            members: [...prev.members, { pseudo: app.pseudo, race: app.race, rank: 'Membre' }],
                          }));
                        }}
                        className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded"
                      >
                        Accepter
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500">Droit requis</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ONGLET 3 : FORUM (Catégories & Sujets avec restriction de visibilité par rang)
         ========================================== */}
      {activeTab === 'forum' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Liste des catégories visibles pour le rang du joueur */}
          <div className="md:col-span-4 bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-amber-300">Catégories du Forum</h3>
            <div className="space-y-1.5">
              {guildState.categories
                .filter((cat: any) => isLeader || cat.visibleToRanks.includes(currentMember?.rank))
                .map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition ${
                      selectedCategoryId === cat.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div>{cat.title}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Eye className="w-3 h-3" /> Visible par : {cat.visibleToRanks.join(', ')}
                    </div>
                  </button>
                ))}
            </div>

            {(perms.create_topics || isLeader) && (
              <div className="pt-3 border-t border-slate-700 space-y-2">
                <div className="font-bold text-slate-300">Nouvelle Catégorie :</div>
                <input
                  type="text"
                  value={newCategoryTitle}
                  onChange={(e) => setNewCategoryTitle(e.target.value)}
                  placeholder="Titre de la catégorie..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
                <div className="text-[10px] text-slate-400">Rangs autorisés à voir cette catégorie :</div>
                <div className="flex flex-wrap gap-1.5">
                  {guildState.ranks.map((r: any) => {
                    const checked = newCategoryRanks.includes(r.name);
                    return (
                      <button
                        key={r.name}
                        type="button"
                        onClick={() =>
                          setNewCategoryRanks((prev) =>
                            checked ? prev.filter((item) => item !== r.name) : [...prev, r.name]
                          )
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          checked ? 'bg-amber-500/25 border-amber-400 text-amber-200' : 'bg-slate-900 border-slate-700 text-slate-500'
                        }`}
                      >
                        {r.name}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => {
                    if (!newCategoryTitle.trim()) return;
                    const id = `cat-${Date.now()}`;
                    setGuildState((prev: any) => ({
                      ...prev,
                      categories: [
                        ...prev.categories,
                        { id, title: newCategoryTitle.trim(), visibleToRanks: newCategoryRanks.length ? newCategoryRanks : ['Chef'], topics: [] },
                      ],
                    }));
                    setSelectedCategoryId(id);
                    setNewCategoryTitle('');
                  }}
                  className="w-full py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg"
                >
                  + Créer la Catégorie
                </button>
              </div>
            )}
          </div>

          {/* Sujets de la catégorie sélectionnée (filtrés par rang) */}
          <div className="md:col-span-8 bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-amber-300">Sujets de discussion</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(guildState.categories.find((c: any) => c.id === selectedCategoryId)?.topics || [])
                .filter((t: any) => isLeader || t.visibleToRanks.includes(currentMember?.rank))
                .map((topic: any) => (
                  <div key={topic.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">{topic.title}</span>
                      <span className="text-[10px] text-slate-400">
                        Par {topic.author} • Visible par [{topic.visibleToRanks.join(', ')}]
                      </span>
                    </div>
                    <p className="text-slate-200 mt-1">{topic.content}</p>
                  </div>
                ))}
            </div>

            {(perms.create_topics || isLeader) && (
              <div className="pt-3 border-t border-slate-700 space-y-2">
                <div className="font-bold text-emerald-300">Créer un Nouveau Sujet :</div>
                <input
                  type="text"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="Titre du sujet..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
                <textarea
                  rows={2}
                  value={newTopicContent}
                  onChange={(e) => setNewTopicContent(e.target.value)}
                  placeholder="Contenu du sujet..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Visible aux rangs :</span>
                    {guildState.ranks.map((r: any) => {
                      const checked = newTopicRanks.includes(r.name);
                      return (
                        <button
                          key={r.name}
                          type="button"
                          onClick={() =>
                            setNewTopicRanks((prev) =>
                              checked ? prev.filter((item) => item !== r.name) : [...prev, r.name]
                            )
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            checked ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200' : 'bg-slate-900 border-slate-700 text-slate-500'
                          }`}
                        >
                          {r.name}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      if (!newTopicTitle.trim() || !newTopicContent.trim()) return;
                      setGuildState((prev: any) => ({
                        ...prev,
                        categories: prev.categories.map((c: any) =>
                          c.id === selectedCategoryId
                            ? {
                                ...c,
                                topics: [
                                  ...c.topics,
                                  {
                                    id: `top-${Date.now()}`,
                                    author: activeCharPseudo,
                                    title: newTopicTitle.trim(),
                                    content: newTopicContent.trim(),
                                    visibleToRanks: newTopicRanks.length ? newTopicRanks : ['Chef'],
                                  },
                                ],
                              }
                            : c
                        ),
                      }));
                      setNewTopicTitle('');
                      setNewTopicContent('');
                    }}
                    className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg"
                  >
                    Publier le Sujet
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          ONGLET 4 : GESTION (Uniquement visible par le Chef : création de rangs et privilèges associés)
         ========================================== */}
      {activeTab === 'gestion' && isLeader && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5 bg-slate-800/80 border border-purple-500/40 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-purple-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Créer un Nouveau Rang de Guilde
            </h3>
            <input
              type="text"
              value={newRankName}
              onChange={(e) => setNewRankName(e.target.value)}
              placeholder="Nom du rang (ex: Sénéchal, Recrue...)"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
            />
            <div className="space-y-2 pt-1">
              {[
                { key: 'accept_applicants', label: 'Accepter des postulants à la guilde' },
                { key: 'send_invites', label: 'Envoyer des invitations' },
                { key: 'create_topics', label: 'Pouvoir créer des catégories et sujets' },
                { key: 'assign_ranks', label: 'Attribuer des rangs aux joueurs' },
              ].map((p) => (
                <label key={p.key} className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={(newRankPerms as any)[p.key]}
                    onChange={(e) =>
                      setNewRankPerms((prev) => ({ ...prev, [p.key]: e.target.checked }))
                    }
                    className="rounded border-slate-600"
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
            <button
              onClick={() => {
                if (!newRankName.trim()) return;
                setGuildState((prev: any) => ({
                  ...prev,
                  ranks: [
                    ...prev.ranks,
                    { name: newRankName.trim(), isLeader: false, permissions: { ...newRankPerms } },
                  ],
                }));
                setNewRankName('');
              }}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg"
            >
              Créer le Rang
            </button>
          </div>

          <div className="md:col-span-7 bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-amber-300">Rangs existants & Privilèges</h3>
            <div className="space-y-2">
              {guildState.ranks.map((r: any) => (
                <div key={r.name} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-amber-200 flex items-center justify-between">
                    <span>{r.name}</span>
                    {r.isLeader && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                        Chef (Tous les droits)
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {[
                      { key: 'accept_applicants', label: 'Accepter postulants' },
                      { key: 'send_invites', label: 'Envoyer invitations' },
                      { key: 'create_topics', label: 'Créer sujets forum' },
                      { key: 'assign_ranks', label: 'Attribuer des rangs' },
                    ].map((permItem) => (
                      <label key={permItem.key} className="flex items-center gap-1.5 text-slate-300">
                        <input
                          type="checkbox"
                          disabled={r.isLeader}
                          checked={r.isLeader || Boolean(r.permissions?.[permItem.key])}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setGuildState((prev: any) => ({
                              ...prev,
                              ranks: prev.ranks.map((rk: any) =>
                                rk.name === r.name
                                  ? { ...rk, permissions: { ...rk.permissions, [permItem.key]: val } }
                                  : rk
                              ),
                            }));
                          }}
                        />
                        <span>{permItem.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};