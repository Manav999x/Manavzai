import React, { useState } from 'react';
import Button from './Button';
import { AuthService } from '../services/authService';
import { auth } from '../services/firebase'; // Direct import to get uid
import { User } from '../types';

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: (user: User) => void;
}

const RedeemModal: React.FC<RedeemModalProps> = ({ isOpen, onClose, onUserUpdate }) => {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRedeem = async () => {
    if (!code.trim()) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setLoading(true);
    setMsg(null);

    try {
        // Need current user credits to add to them. 
        const user = await AuthService.getCurrentUser(currentUser.uid);
        if (!user) throw new Error("User not found");

        const result = await AuthService.redeemCode(currentUser.uid, user.credits, code);
        
        if (result.success) {
            setMsg({ type: 'success', text: result.message });
            // onUserUpdate is not strictly needed due to App.tsx subscription, but kept for interface compat.
            setTimeout(() => {
                onClose();
                setCode('');
                setMsg(null);
            }, 1500);
        } else {
            setMsg({ type: 'error', text: result.message });
        }
    } catch (e: any) {
        setMsg({ type: 'error', text: e.message });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm border border-slate-700 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
        
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex items-center justify-between">
            <h3 className="text-white font-bold flex items-center gap-2">
                <i className="fa-solid fa-gift"></i> Redeem Code
            </h3>
            <button onClick={onClose} className="text-white/80 hover:text-white">
                <i className="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div className="p-6">
            <p className="text-sm text-slate-300 mb-4">
                Enter your promo code below to add credits to your Manavai account.
            </p>

            <div className="space-y-3">
                <input 
                    type="text" 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. MANAVAI50"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none font-mono uppercase tracking-wider"
                />

                {msg && (
                    <div className={`text-xs p-2 rounded ${msg.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {msg.text}
                    </div>
                )}

                <Button 
                    onClick={handleRedeem} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    isLoading={loading}
                    disabled={!code.trim()}
                >
                    Redeem Credits
                </Button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
                 <p className="text-xs text-slate-500">Need a code? Try <span className="font-mono text-emerald-400">MANAVAI50</span></p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RedeemModal;