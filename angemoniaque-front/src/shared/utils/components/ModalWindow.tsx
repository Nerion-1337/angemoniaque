import React from 'react';

interface ModalWindowProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const ModalWindow: React.FC<ModalWindowProps> = ({ title, onClose, children }) => (
  <div
    onClick={onClose}
    className="absolute inset-0 z-30 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl text-slate-100"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <h2 className="text-lg font-extrabold text-amber-400">{title}</h2>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-slate-800 hover:bg-rose-600 rounded-lg text-xs font-bold transition"
        >
          Fermer ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);