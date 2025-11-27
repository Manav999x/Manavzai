
import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { ref, get, update, set, child, remove } from 'firebase/database';
import { User } from '../types';
import Button from './Button';
import { AuthService } from '../services/authService';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'coupons' | 'config'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [creditAmount, setCreditAmount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  const [messagingUser, setMessagingUser] = useState<any | null>(null);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgCode, setMsgCode] = useState('');

  const [newCode, setNewCode] = useState('');
  const [newCodeAmount, setNewCodeAmount] = useState(100);
  const [newCodeLimit, setNewCodeLimit] = useState(1); 
  const [coupons, setCoupons] = useState<any[]>([]);

  const [price, setPrice] = useState('11.99');

  useEffect(() => {
    if (isOpen) {
        fetchAllUsers();
        fetchCoupons();
        fetchConfig();
    }
  }, [isOpen, activeTab]);

  const fetchAllUsers = async () => {
    setLoading(true);
    const snapshot = await get(ref(db, 'users'));
    if (snapshot.exists()) {
        const usersObj = snapshot.val();
        const usersList = Object.entries(usersObj).map(([uid, data]: [string, any]) => ({
            ...data,
            uid 
        }));
        setUsers(usersList);
    }
    setLoading(false);
  };

  const fetchCoupons = async () => {
    const snapshot = await get(ref(db, 'coupons'));
    if (snapshot.exists()) {
        const cObj = snapshot.val();
        setCoupons(Object.entries(cObj).map(([code, data]: [string, any]) => ({ code, ...data })));
    } else {
        setCoupons([]);
    }
  };

  const fetchConfig = async () => {
     const snapshot = await get(ref(db, 'config/pricePerCredit'));
     if (snapshot.exists()) {
         setPrice(snapshot.val());
     }
  };

  const handleSendCredits = async (targetUid: string, currentCredits: number, manavaiId: string) => {
     if (creditAmount <= 0) return;
     await update(ref(db, `users/${targetUid}`), { credits: currentCredits + creditAmount });
     await AuthService.sendSystemMessage(targetUid, {
         title: "Credits Received",
         body: `Admin has added ${creditAmount} credits to your account (ID: ${manavaiId}).`,
     });
     alert("Credits sent!");
     fetchAllUsers();
     setCreditAmount(0);
     setSelectedUser(null);
  };

  const handleSendMessage = async () => {
      if (!messagingUser || !msgSubject || !msgBody) return;
      await AuthService.sendSystemMessage(messagingUser.uid, {
          title: msgSubject,
          body: msgBody,
          code: msgCode || undefined
      });
      alert("Message Sent Successfully!");
      setMessagingUser(null);
      setMsgSubject('');
      setMsgBody('');
      setMsgCode('');
  };

  const handleCreateCoupon = async () => {
      if (!newCode) return;
      await set(ref(db, `coupons/${newCode.toUpperCase()}`), {
          amount: newCodeAmount,
          maxRedemptions: newCodeLimit,
          usedCount: 0,
          createdAt: Date.now()
      });
      setNewCode('');
      fetchCoupons();
      alert("Coupon Created");
  };

  const handleDeleteCoupon = async (code: string) => {
      if(window.confirm(`Delete coupon ${code}?`)) {
          await remove(ref(db, `coupons/${code}`));
          fetchCoupons();
      }
  }

  const handleUpdatePrice = async () => {
      await set(ref(db, 'config/pricePerCredit'), price);
      alert("Price Updated. Users will see this price in the Shop.");
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.id || '').includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 overflow-hidden flex flex-col">
       <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center shadow-md">
           <div className="flex items-center gap-3">
               <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Admin</div>
               <h2 className="text-xl font-bold text-white">Manavai Control Panel</h2>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-white">
               <i className="fa-solid fa-xmark text-2xl"></i>
           </button>
       </div>

       <div className="flex flex-1 overflow-hidden">
           <div className="w-64 bg-slate-800 border-r border-slate-700 p-4 space-y-2">
               <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 ${activeTab === 'users' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><i className="fa-solid fa-users"></i> Users</button>
               <button onClick={() => setActiveTab('coupons')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 ${activeTab === 'coupons' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><i className="fa-solid fa-ticket"></i> Coupons</button>
               <button onClick={() => setActiveTab('config')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 ${activeTab === 'config' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><i className="fa-solid fa-gear"></i> Configuration</button>
           </div>

           <div className="flex-1 bg-slate-900 p-8 overflow-y-auto relative">
               {activeTab === 'users' && (
                   <div className="space-y-6">
                       <div className="flex justify-between items-center">
                           <h3 className="text-2xl font-bold text-white">User Management</h3>
                           <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white w-64 focus:ring-2 focus:ring-amber-500 outline-none"/>
                       </div>
                       <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                           <div className="overflow-x-auto">
                               <table className="w-full text-left text-slate-300">
                                   <thead className="bg-slate-700/50 text-slate-400 text-xs uppercase"><tr><th className="p-4">User</th><th className="p-4">Credits</th><th className="p-4">Actions</th></tr></thead>
                                   <tbody className="divide-y divide-slate-700">
                                       {filteredUsers.map((u: any) => (
                                           <tr key={u.uid} className="hover:bg-slate-700/30">
                                               <td className="p-4">
                                                   <div className="font-bold text-white">{u.name}</div>
                                                   <div className="text-xs text-slate-500">{u.email} <span className="ml-2 font-mono text-amber-500">{u.id}</span></div>
                                               </td>
                                               <td className="p-4 font-bold">{u.credits}</td>
                                               <td className="p-4">
                                                   <div className="flex gap-2">
                                                       {selectedUser === u.uid ? (
                                                           <div className="flex items-center gap-2 bg-slate-900 p-1 rounded border border-slate-600">
                                                               <input type="number" className="w-16 bg-transparent text-white text-xs p-1" value={creditAmount} onChange={(e) => setCreditAmount(parseInt(e.target.value))}/>
                                                               <button onClick={() => handleSendCredits(u.uid, u.credits, u.id)} className="text-green-400 px-1"><i className="fa-solid fa-check"></i></button>
                                                               <button onClick={() => setSelectedUser(null)} className="text-red-400 px-1"><i className="fa-solid fa-xmark"></i></button>
                                                           </div>
                                                       ) : <Button size="sm" variant="secondary" onClick={() => setSelectedUser(u.uid)}><i className="fa-solid fa-coins"></i></Button>}
                                                       <Button size="sm" variant="ghost" onClick={() => setMessagingUser(u)} className="text-blue-400 hover:bg-slate-700"><i className="fa-solid fa-envelope"></i></Button>
                                                   </div>
                                               </td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           </div>
                       </div>
                   </div>
               )}

               {activeTab === 'coupons' && (
                   <div className="space-y-6">
                       <div className="bg-slate-800 p-6 rounded-xl flex gap-4 items-end border border-slate-700">
                           <div className="flex-1"><label className="text-xs text-slate-400">Code</label><input type="text" value={newCode} onChange={e => setNewCode(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white uppercase"/></div>
                           <div className="w-24"><label className="text-xs text-slate-400">Amount</label><input type="number" value={newCodeAmount} onChange={e => setNewCodeAmount(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"/></div>
                           <div className="w-24"><label className="text-xs text-slate-400">Limit</label><input type="number" value={newCodeLimit} onChange={e => setNewCodeLimit(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"/></div>
                           <Button onClick={handleCreateCoupon}>Create</Button>
                       </div>
                       <div className="grid gap-2">
                           {coupons.map((c) => (
                               <div key={c.code} className="bg-slate-800 p-4 rounded-lg flex justify-between items-center border border-slate-700">
                                   <div><span className="font-mono text-emerald-400 font-bold">{c.code}</span> <span className="text-white ml-2">{c.amount} Cr</span></div>
                                   <div className="flex items-center gap-4">
                                       <span className={`text-xs ${c.usedCount >= c.maxRedemptions ? 'text-red-400' : 'text-slate-400'}`}>{c.usedCount || 0} / {c.maxRedemptions} used</span>
                                       <button onClick={() => handleDeleteCoupon(c.code)} className="text-slate-500 hover:text-red-500"><i className="fa-solid fa-trash"></i></button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}

               {activeTab === 'config' && (
                   <div className="bg-slate-800 p-6 rounded-xl space-y-4 max-w-md border border-slate-700">
                       <label className="block text-slate-400 text-sm">Price Per Credit (₹)</label>
                       <input type="text" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"/>
                       <Button onClick={handleUpdatePrice} className="w-full">Update Price</Button>
                   </div>
               )}
           </div>

           {messagingUser && (
               <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                   <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg space-y-4 border border-slate-600">
                       <h3 className="text-xl font-bold text-white">Message {messagingUser.name}</h3>
                       <input type="text" value={msgSubject} onChange={e => setMsgSubject(e.target.value)} className="w-full bg-slate-700 rounded p-2 text-white" placeholder="Subject"/>
                       <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} className="w-full bg-slate-700 rounded p-2 text-white h-32" placeholder="Message..."/>
                       <input type="text" value={msgCode} onChange={e => setMsgCode(e.target.value)} className="w-full bg-slate-700 rounded p-2 text-white font-mono uppercase" placeholder="Promo Code (Optional)"/>
                       <div className="flex gap-2">
                           <Button variant="secondary" onClick={() => setMessagingUser(null)} className="flex-1">Cancel</Button>
                           <Button onClick={handleSendMessage} className="flex-1">Send</Button>
                       </div>
                   </div>
               </div>
           )}
       </div>
    </div>
  );
};

export default AdminPanel;
