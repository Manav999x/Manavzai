import React, { useState } from 'react';
import { AuthView, User } from '../types';
import { AuthService } from '../services/authService';
import Logo from './Logo';
import Button from './Button';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>(AuthView.SignIn);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await AuthService.signIn(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Direct signup without OTP
      const user = await AuthService.signUp(name, email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md overflow-hidden relative">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-tr-full pointer-events-none"></div>

        <div className="p-8 relative z-10">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mb-4 border border-slate-600 shadow-lg">
              <Logo className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to Manavai</h1>
            <p className="text-slate-400 text-sm mt-1">Your Premium AI Assistant</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          {/* SIGN IN VIEW */}
          {view === AuthView.SignIn && (
            <form onSubmit={handleSignIn} className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full mt-2" isLoading={loading}>
                Sign In
              </Button>

              <div className="text-center mt-6">
                <p className="text-slate-400 text-sm">
                  Don't have an account?{' '}
                  <button 
                    type="button"
                    onClick={() => { setError(''); setView(AuthView.SignUp); }}
                    className="text-amber-500 hover:text-amber-400 font-medium hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* SIGN UP VIEW */}
          {view === AuthView.SignUp && (
            <form onSubmit={handleSignUp} className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
               <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full mt-2" isLoading={loading}>
                Create Account & Get 50 Credits
              </Button>

              <div className="text-center mt-6">
                <p className="text-slate-400 text-sm">
                  Already have an account?{' '}
                  <button 
                    type="button"
                    onClick={() => { setError(''); setView(AuthView.SignIn); }}
                    className="text-amber-500 hover:text-amber-400 font-medium hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthScreen;