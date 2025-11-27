
import React, { useState, useEffect } from 'react';
import { PAYMENT_CONFIG } from '../constants';
import Button from './Button';
import { User } from '../types';
import { db } from '../services/firebase';
import { ref, get } from 'firebase/database';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose, user }) => {
  const [credits, setCredits] = useState<number>(100);
  const [step, setStep] = useState<1 | 2>(1);
  const [pricePerCredit, setPricePerCredit] = useState<number>(11.99);

  useEffect(() => {
    if (isOpen) {
        setStep(1);
        setCredits(100);
        get(ref(db, 'config/pricePerCredit')).then((snapshot) => {
            if (snapshot.exists()) {
                const val = parseFloat(snapshot.val());
                if (!isNaN(val)) setPricePerCredit(val);
            }
        });
    }
  }, [isOpen]);

  const totalCost = (credits * pricePerCredit).toFixed(2);

  if (!isOpen) return null;

  const handleSendEmail = () => {
    const subject = encodeURIComponent("Manavai Credits Purchase");
    const body = encodeURIComponent(`
Manavai User ID: ${user?.id || 'N/A'}
Manavai Account: ${user?.email || ''}
Credits: ${credits}
Total: ₹${totalCost}
Date: ${new Date().toLocaleDateString()}
UTR: 
    
[PLEASE ATTACH PAYMENT SCREENSHOT]
    `);
    window.location.href = `mailto:${PAYMENT_CONFIG.supportEmail}?subject=${subject}&body=${body}`;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-emerald-600 p-6 text-white relative">
            <h2 className="text-2xl font-bold flex items-center gap-2"><i className="fa-solid fa-cart-shopping"></i> Credit Shop</h2>
            <p className="text-emerald-100 mt-1">Rate: ₹{pricePerCredit}/credit</p>
            <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-emerald-200"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>
        <div className="p-6 overflow-y-auto">
            {step === 1 ? (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                        <div className="flex items-center gap-3">
                            <input type="number" min="10" value={credits} onChange={(e) => setCredits(Math.max(0, parseInt(e.target.value) || 0))} className="flex-1 border border-gray-300 rounded-lg p-3 text-lg font-mono focus:ring-2 focus:ring-emerald-500 outline-none"/>
                            <span className="text-gray-500 font-medium">credits</span>
                        </div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
                        <span className="text-emerald-900 font-medium">Total</span>
                        <span className="text-2xl font-bold text-emerald-700">₹{totalCost}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Pay via UPI:</p>
                        <div className="flex items-center justify-between bg-gray-100 p-3 rounded text-sm font-mono text-gray-800 select-all border border-gray-200">
                            {PAYMENT_CONFIG.upiId}
                            <button onClick={() => navigator.clipboard.writeText(PAYMENT_CONFIG.upiId)} className="text-emerald-600 hover:text-emerald-700 ml-2"><i className="fa-regular fa-copy"></i></button>
                        </div>
                    </div>
                    <Button onClick={() => setStep(2)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Proceed</Button>
                </div>
            ) : (
                <div className="space-y-6 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl animate-bounce"><i className="fa-solid fa-check"></i></div>
                    <h3 className="text-xl font-bold text-gray-900">Next Step</h3>
                    <p className="text-gray-600 mt-2 text-sm">Send us the payment proof to receive your code.</p>
                    <div className="bg-blue-50 p-4 rounded-lg text-left text-sm text-blue-800 border border-blue-100">
                        <strong>Instructions:</strong>
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                            <li>Click button below.</li>
                            <li>Attach screenshot & Send.</li>
                            <li>Code delivered to <strong>Inbox</strong> within 72h.</li>
                        </ol>
                    </div>
                    <Button onClick={handleSendEmail} className="w-full">Open Email</Button>
                    <button onClick={() => setStep(1)} className="text-gray-500 text-sm hover:underline">Back</button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ShopModal;
