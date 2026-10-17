import React, { useState } from 'react';
import { MessageSquare, Mail, Send } from 'lucide-react';

interface ChatWidgetProps {
  visionMessages: any[];
  guildMessages: any[];
  mailMessages: any[];
  onSendVision: (text: string) => void;
  onSendGuild: (text: string) => void;
  onSendMail: (recipient: string, subject: string, body: string) => void;
  onMarkMailRead: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  visionMessages,
  guildMessages,
  mailMessages,
  onSendVision,
  onSendGuild,
  onSendMail,
  onMarkMailRead,
}) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'vision' | 'guild' | 'mail'>('vision');
  const [chatInput, setChatInput] = useState('');
  const [unreadVision, setUnreadVision] = useState(true);
  const [unreadGuild, setUnreadGuild] = useState(true);

  const unreadMailCount = mailMessages.filter((m) => m.unread).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (activeTab === 'vision') onSendVision(chatInput.trim());
    else if (activeTab === 'guild') onSendGuild(chatInput.trim());
    else onSendMail('Elora_Mortelle', 'Message Global', chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end">
      {chatOpen && (
        <div className="mb-3 w-88 sm:w-96 bg-slate-900/95 border-2 border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden text-xs">
          <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950">
            <button
              onClick={() => { setActiveTab('vision'); setUnreadVision(false); }}
              className={`py-2.5 px-2 font-bold flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'vision' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Vision (12h)</span>
            </button>
            <button
              onClick={() => { setActiveTab('guild'); setUnreadGuild(false); }}
              className={`py-2.5 px-2 font-bold flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'guild' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-slate-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Guilde (100)</span>
            </button>
            <button
              onClick={() => { setActiveTab('mail'); onMarkMailRead(); }}
              className={`py-2.5 px-2 font-bold flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'mail' ? 'border-sky-400 text-sky-300' : 'border-transparent text-slate-400'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              <span>Messagerie</span>
            </button>
          </div>

          <div className="p-3 h-56 overflow-y-auto space-y-2">
            {activeTab === 'vision' &&
              visionMessages.map((msg) => (
                <div key={msg.id} className="p-2 bg-slate-800 rounded border-l-2 border-amber-400">
                  <b className="text-amber-300">{msg.sender}</b> : {msg.text}
                </div>
              ))}
            {activeTab === 'guild' &&
              guildMessages.map((msg) => (
                <div key={msg.id} className="p-2 bg-slate-800 rounded border-l-2 border-emerald-400">
                  <b className="text-emerald-300">{msg.sender}</b> : {msg.text}
                </div>
              ))}
            {activeTab === 'mail' &&
              mailMessages.map((m) => (
                <div key={m.id} className="p-2 bg-slate-800 rounded border border-sky-500/30">
                  <div className="font-bold text-sky-300">{m.subject}</div>
                  <div className="text-slate-200">{m.body}</div>
                </div>
              ))}
          </div>

          <form onSubmit={handleSubmit} className="p-2 bg-slate-950 flex gap-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Écrire un message..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
            />
            <button type="submit" className="px-3 py-1 bg-amber-400 text-slate-950 font-bold rounded">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="relative w-14 h-14 rounded-2xl bg-slate-900/90 border-2 border-amber-500/60 shadow-2xl flex flex-col items-center justify-center text-amber-300"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="text-[9px] font-bold uppercase mt-0.5">Chat</span>
        <div className="absolute -top-1.5 -left-1.5 flex gap-1">
          {unreadVision && <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-950" />}
          {unreadGuild && <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950" />}
        </div>
        {unreadMailCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-rose-600 border-2 border-slate-950 text-white text-[10px] font-extrabold flex items-center justify-center">
            {unreadMailCount}
          </span>
        )}
      </button>
    </div>
  );
};