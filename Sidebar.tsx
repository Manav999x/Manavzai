
import React from 'react';
import { AppMode, User, ChatSession } from '../types';
import Logo from './Logo';

interface SidebarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  onClear: () => void;
  onPayment: () => void;
  onRedeem: () => void;
  onShop: () => void;
  onInbox: () => void;
  onSignOut: () => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  user: User | null;
  
  // Chat History Props
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (e: React.MouseEvent, sessionId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentMode, setMode, onClear, onPayment, onRedeem, onShop, onInbox, onSignOut, isOpen, toggleSidebar, user,
  sessions, currentSessionId, onSelectSession, onDeleteSession
}) => {
  const modes = [
    { id: AppMode.Assistant, icon: 'fa-message', label: 'Assistant' },
    { id: AppMode.Code, icon: 'fa-code', label: 'Code Expert' },
    { id: AppMode.ImageGen, icon: 'fa-image', label: 'Image Gen' },
    { id: AppMode.ImageEdit, icon: 'fa-wand-magic-sparkles', label: 'Image Edit' },
    { id: AppMode.FileAnalyzer, icon: 'fa-file-magnifying-glass', label: 'Analysis' },
    { id: AppMode.Voice, icon: 'fa-microphone-lines', label: 'Voice Mode' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-72 bg-slate-900 border-r border-slate-800
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shadow-inner border border-slate-700">
               <Logo className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              Manavai
            </h1>
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-slate-400">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* New Chat Action */}
        <div className="px-4 mb-4">
          <button 
            onClick={() => { onClear(); if(window.innerWidth < 768) toggleSidebar(); }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700 hover:border-slate-600 group"
          >
            <i className="fa-solid fa-plus text-amber-500 group-hover:scale-110 transition-transform"></i>
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-2 space-y-6">
          
          {/* Modes Section */}
          <div>
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Modes</p>
            <div className="space-y-1">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMode(m.id); if(window.innerWidth < 768) toggleSidebar(); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentMode === m.id 
                      ? 'bg-amber-600/10 text-amber-500 border border-amber-600/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <i className={`fa-solid ${m.icon} w-5 text-center`}></i>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* History Section */}
          <div>
             <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Chats</p>
             <div className="space-y-1">
               {sessions.length === 0 ? (
                 <p className="px-4 text-xs text-slate-600 italic">No history yet</p>
               ) : (
                 sessions.map(session => (
                    <div 
                      key={session.id}
                      className={`group flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                        currentSessionId === session.id 
                        ? 'bg-slate-800 text-slate-200' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                      }`}
                      onClick={() => { onSelectSession(session); if(window.innerWidth < 768) toggleSidebar(); }}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <i className="fa-regular fa-message text-xs"></i>
                        <span className="truncate">{session.title}</span>
                      </div>
                      <button 
                        onClick={(e) => onDeleteSession(e, session.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1"
                      >
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                 ))
               )}
             </div>
          </div>

          <div className="border-t border-slate-800/50 mx-2"></div>
          
          <div className="space-y-1">
             <button onClick={onShop} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 rounded-lg text-sm font-medium transition-all">
               <i className="fa-solid fa-cart-shopping w-5 text-center"></i>
               Buy Credits
             </button>
             <button onClick={onInbox} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-blue-400 rounded-lg text-sm font-medium transition-all">
               <i className="fa-solid fa-inbox w-5 text-center"></i>
               Inbox
             </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          
          {/* Credit Display */}
          <div className="bg-slate-800 rounded-lg p-3 mb-3 border border-slate-700">
            <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-400 font-medium">Available Credits</span>
                <button onClick={onRedeem} className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline">Redeem</button>
            </div>
            <div className="flex items-center gap-2">
                <i className="fa-solid fa-coins text-amber-500"></i>
                <span className="text-lg font-bold text-white">
                    {user?.plan === 'Premium' ? '∞' : user?.credits}
                </span>
                {user?.plan === 'Premium' && <span className="text-xs bg-amber-600 px-1.5 rounded text-white ml-auto">PRO</span>}
            </div>
          </div>

          <button 
            onClick={onPayment}
            className="w-full mb-3 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl shadow-lg shadow-orange-900/20 hover:shadow-orange-900/40 transition-all group"
          >
            <span className="font-bold text-sm">Upgrade Plan</span>
            <i className="fa-solid fa-crown text-amber-200 group-hover:rotate-12 transition-transform"></i>
          </button>
          
          {/* User Info & Unique ID */}
          <div className="bg-slate-800/50 rounded-lg p-2 mb-2 border border-slate-700/50">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold border border-slate-600 uppercase">
                  {user?.name.charAt(0) || 'U'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-slate-200 truncate">{user?.name || 'Guest'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || 'No Email'}</p>
                </div>
             </div>
             {/* ID Display */}
             <div className="flex items-center justify-between bg-slate-900 rounded px-2 py-1.5 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 truncate w-32 tracking-wider">{user?.id}</span>
                <button 
                    onClick={() => navigator.clipboard.writeText(user?.id || '')}
                    className="text-slate-500 hover:text-amber-500"
                    title="Copy Unique ID"
                >
                    <i className="fa-regular fa-copy text-xs"></i>
                </button>
             </div>
          </div>
          
          <button 
             onClick={onSignOut}
             className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
          >
             <i className="fa-solid fa-right-from-bracket"></i>
             Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
