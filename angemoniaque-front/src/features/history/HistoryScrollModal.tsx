import React, { useState } from 'react';
import { ScrollText, ShieldAlert, Footprints, Sparkles } from 'lucide-react';

interface HistoryScrollModalProps {
  historyLogs: any[];
}

export const HistoryScrollModal: React.FC<HistoryScrollModalProps> = ({ historyLogs }) => {
  const [filter, setFilter] = useState<'all' | 'combat' | 'move' | 'other'>('all');

  const filteredLogs = historyLogs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'combat') return log.type === 'combat' || log.type === 'loot';
    if (filter === 'move') return log.type === 'move' || log.type === 'collision' || log.type === 'portal';
    return log.type !== 'combat' && log.type !== 'move';
  });

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="text-slate-300 flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-amber-400" />
          <span>Journal des <b>{historyLogs.length} / 100</b> dernières actions réalisées ou attaques subies</span>
        </div>
        <div className="flex gap-1.5">
          {[
            { id: 'all', label: 'Tout' },
            { id: 'combat', label: 'Combats & Attaques' },
            { id: 'move', label: 'Déplacements' },
            { id: 'other', label: 'Pactes, Sorts & Bâtiments' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-2.5 py-1 rounded-lg font-bold ${
                filter === tab.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className={`p-2.5 rounded-lg border flex items-center justify-between ${
              log.type === 'combat'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                : log.type === 'collision' || log.type === 'error'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                : 'bg-slate-800/80 border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {log.type === 'combat' ? (
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              ) : log.type === 'move' ? (
                <Footprints className="w-4 h-4 text-sky-400 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div>
                <span className="font-mono text-[10px] text-slate-400 mr-2">[{log.time}]</span>
                <b className="text-amber-300">{log.source}</b>
                <span className="text-slate-400 mx-1">➔</span>
                <b className="text-sky-300">{log.target}</b> : <span>{log.text}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};