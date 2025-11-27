import React, { useEffect, useState } from 'react';
import { InboxMessage } from '../types';
import { AuthService } from '../services/authService';
import { auth } from '../services/firebase';

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InboxModal: React.FC<InboxModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<InboxMessage | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (isOpen && currentUser) {
        // Subscribe to real-time inbox
        const unsubscribe = AuthService.subscribeToInbox(currentUser.uid, (msgs) => {
            setMessages(msgs);
        });
        return () => unsubscribe();
    }
  }, [isOpen]);

  const handleSelect = async (msg: InboxMessage) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (!msg.read) {
        // Optimistic update
        setMessages(prev => prev.map(m => m.id === msg.id ? {...m, read: true} : m));
        await AuthService.markMessageRead(currentUser.uid, msg.id);
    }
    setSelectedMsg(msg);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl h-[600px] border border-slate-700 overflow-hidden flex flex-col md:flex-row animate-[fadeIn_0.2s_ease-out]">
        
        {/* Sidebar List */}
        <div className="w-full md:w-1/3 border-r border-slate-700 flex flex-col bg-slate-850">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
                <h3 className="font-bold text-white"><i className="fa-solid fa-inbox mr-2"></i>Inbox</h3>
                <button onClick={onClose} className="md:hidden text-slate-400"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No messages yet.</div>
                ) : (
                    messages.map(msg => (
                        <button
                            key={msg.id}
                            onClick={() => handleSelect(msg)}
                            className={`w-full text-left p-4 border-b border-slate-800 hover:bg-slate-800 transition-colors ${selectedMsg?.id === msg.id ? 'bg-slate-800 border-l-4 border-amber-500' : ''}`}
                        >
                            <div className="flex justify-between mb-1">
                                <span className={`text-sm font-medium ${msg.read ? 'text-slate-300' : 'text-white'}`}>{msg.title}</span>
                                {!msg.read && <span className="w-2 h-2 bg-amber-500 rounded-full"></span>}
                            </div>
                            <div className="text-xs text-slate-500 truncate">{msg.body}</div>
                        </button>
                    ))
                )}
            </div>
        </div>

        {/* Message Detail */}
        <div className="flex-1 bg-slate-900 flex flex-col relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white hidden md:block">
                <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            
            {selectedMsg ? (
                <div className="p-6 md:p-8 overflow-y-auto">
                    <h2 className="text-2xl font-bold text-white mb-2">{selectedMsg.title}</h2>
                    <p className="text-sm text-slate-500 mb-6">{new Date(selectedMsg.date).toLocaleString()}</p>
                    
                    <div className="text-slate-300 leading-relaxed whitespace-pre-line mb-8">
                        {selectedMsg.body}
                    </div>

                    {selectedMsg.code && (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center max-w-sm mx-auto">
                            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Promo Code</p>
                            <div className="text-2xl font-mono font-bold text-amber-500 mb-4 select-all">
                                {selectedMsg.code}
                            </div>
                            <button 
                                onClick={() => navigator.clipboard.writeText(selectedMsg.code || '')}
                                className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <i className="fa-regular fa-copy mr-2"></i>Copy Code
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                    <i className="fa-regular fa-envelope text-4xl mb-3"></i>
                    <p>Select a message to read</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default InboxModal;