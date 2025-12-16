import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

const AdminLogin = ({ isOpen, onClose, onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === '1234') {
        onLogin();
        setPin('');
        setError(false);
    } else {
        setError(true);
        setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="bg-construction-gray-800 p-8 rounded-xl border border-gray-700 w-full max-w-sm relative">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
            <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Lock className="text-safety-orange" />
            Admin Access
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <input 
                    type="password" 
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter PIN"
                    className="w-full bg-construction-gray-900 border border-gray-700 rounded-lg p-3 text-white text-center text-2xl tracking-widest focus:border-safety-orange focus:outline-none"
                    autoFocus
                />
                {error && <p className="text-red-500 text-sm mt-2 text-center">Incorrect PIN</p>}
            </div>
            
            <button 
                type="submit"
                className="w-full bg-safety-orange hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors"
            >
                Unlock
            </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
