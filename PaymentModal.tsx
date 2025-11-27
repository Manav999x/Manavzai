import React, { useState } from 'react';
import { PAYMENT_CONFIG } from '../constants';
import Button from './Button';
import { User } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<1 | 2>(1);

  const handleSendEmail = () => {
    const subject = encodeURIComponent("Manavai Subscription — Payment Confirmation");
    const body = encodeURIComponent(`
Full name: ${user?.name || ''}
Manavai User ID: ${user?.id || 'N/A'}
Manavai account email: ${user?.email || ''}
Chosen plan: Premium (${PAYMENT_CONFIG.premiumCost})
Payment date (DD-MM-YYYY): ${new Date().toLocaleDateString()}
UTR / Reference number: 
    
[PLEASE ATTACH SCREENSHOT OF PAYMENT BEFORE SENDING]
    `);
    
    window.location.href = `mailto:${PAYMENT_CONFIG.supportEmail}?subject=${subject}&body=${body}`;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-amber-600 p-6 text-white relative">
            <h2 className="text-2xl font-bold">Upgrade to Premium</h2>
            <p className="text-amber-100 mt-1">Unlock the full power of Manavai</p>
            <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-amber-200">
                <i className="fa-solid fa-xmark text-xl"></i>
            </button>
        </div>

        <div className="p-6 overflow-y-auto">
            {step === 1 ? (
                <div className="space-y-6">
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                        <h3 className="font-semibold text-amber-900 mb-2">Premium Benefits</h3>
                        <ul className="space-y-2 text-sm text-amber-800">
                            <li><i className="fa-solid fa-check mr-2"></i>Unlimited Image Generation</li>
                            <li><i className="fa-solid fa-check mr-2"></i>Advanced Code Analysis</li>
                            <li><i className="fa-solid fa-check mr-2"></i>Priority Support</li>
                            <li><i className="fa-solid fa-check mr-2"></i>Large File Uploads</li>
                        </ul>
                    </div>

                    <div className="text-center">
                        <p className="text-gray-500 text-sm mb-1">Plan Cost</p>
                        <p className="text-3xl font-bold text-gray-900">{PAYMENT_CONFIG.premiumCost}</p>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Pay via UPI:</p>
                        <div className="flex items-center justify-between bg-gray-100 p-3 rounded text-sm font-mono text-gray-800 select-all">
                            {PAYMENT_CONFIG.upiId}
                            <button 
                                onClick={() => navigator.clipboard.writeText(PAYMENT_CONFIG.upiId)}
                                className="text-amber-600 hover:text-amber-700 ml-2"
                            >
                                <i className="fa-regular fa-copy"></i>
                            </button>
                        </div>
                    </div>

                    <Button onClick={() => setStep(2)} className="w-full">
                        I have made the payment
                    </Button>
                </div>
            ) : (
                <div className="space-y-6 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                        <i className="fa-solid fa-check"></i>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Payment Confirmation</h3>
                        <p className="text-gray-600 mt-2 text-sm">
                            Please send us the payment screenshot and UTR number to activate your account.
                        </p>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg text-left text-sm text-blue-800">
                        <strong>Next Steps:</strong>
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                            <li>Click the button below to open your email client.</li>
                            <li>Attach the payment screenshot.</li>
                            <li>Fill in the UTR/Reference number.</li>
                            <li>Send the email.</li>
                        </ol>
                        <p className="mt-2 text-xs">We typically verify within 24 hours.</p>
                    </div>

                    <Button onClick={handleSendEmail} className="w-full">
                        Open Email to Verify
                    </Button>
                    <button onClick={() => setStep(1)} className="text-gray-500 text-sm hover:underline">
                        Go Back
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;