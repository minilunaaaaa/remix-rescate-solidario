import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { X, ArrowRight, ArrowLeft, Sparkles, ChevronRight } from 'lucide-react';
import { LegalModal } from './LegalModal';
import rescateLogo from '../assets/images/rescate_solidario_logo_1786146691474.jpg';
import { handleLogoError } from '../utils/imageUtils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  defaultRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, defaultRole = 'buyer' }) => {
  const [authStep, setAuthStep] = useState<'provider' | 'credentials' | 'profile'>('provider');
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'facebook' | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAuthStep('provider');
      setSelectedProvider(null);
      setIdentifier('');
      setPassword('');
      setDisplayName('');
      setAcceptedLegal(false);
      setLegalTab(null);
      setIsSimulating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderSelect = (provider: 'google' | 'facebook') => {
    setSelectedProvider(provider);
    setAuthStep('credentials');
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier && password) setAuthStep('profile');
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName) return;
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      const newUser: User = {
        id: `usr-${selectedProvider}-${Date.now()}`,
        name: displayName,
        email: selectedProvider === 'google' ? identifier : `${identifier}@facebook.com`,
        avatar: selectedProvider === 'google'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: selectedRole,
        provider: selectedProvider || 'google',
        rescuedItemsCount: 0,
        moneySaved: 0,
        co2SavedKg: 0,
        storeName: selectedRole === 'store' ? displayName : undefined,
      };
      onLoginSuccess(newUser);
      onClose();
    }, 1000);
  };

  const handleGuestLogin = () => {
    const newUser: User = {
      id: 'usr-guest-' + Date.now(),
      name: 'Invitado Rescate',
      email: 'invitado@rescatesolidario.org',
      role: selectedRole,
      provider: 'guest',
      rescuedItemsCount: 0,
      moneySaved: 0,
      co2SavedKg: 0,
      storeName: selectedRole === 'store' ? 'Minimarket Mi Barrio' : undefined,
    };
    onLoginSuccess(newUser);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-card dark:bg-stone-900 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header with gradient */}
        <div className="relative bg-brand-700 p-6 text-center overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
          
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10">
            <X className="w-5 h-5" />
          </button>
          {authStep !== 'provider' && (
            <button onClick={() => { if (authStep === 'profile') setAuthStep('credentials'); if (authStep === 'credentials') setAuthStep('provider'); }} className="absolute top-4 left-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-1.5 mb-4 relative z-10">
            {['provider', 'credentials', 'profile'].map((step, i) => (
              <div 
                key={step} 
                className={`h-1 rounded-full transition-all duration-500 ${
                  (step === 'provider' && authStep === 'provider') ||
                  (step === 'credentials' && (authStep === 'credentials' || authStep === 'profile')) ||
                  (step === 'profile' && authStep === 'profile')
                    ? 'w-8 bg-white' 
                    : 'w-2 bg-white/30'
                }`}
              />
            ))}
          </div>
          
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-sm p-2.5 flex items-center justify-center animate-float relative z-10">
            <img src={rescateLogo} alt="Logo" className="w-full h-full object-contain rounded-xl" referrerPolicy="no-referrer" onError={handleLogoError} />
          </div>
          <h3 className="text-lg font-black text-white relative z-10">Rescate Solidario</h3>
          <p className="text-xs text-white/80 mt-1 relative z-10">
            {authStep === 'provider' && 'Elige cómo continuar'}
            {authStep === 'credentials' && `Cuenta de ${selectedProvider === 'google' ? 'Google' : 'Facebook'}`}
            {authStep === 'profile' && 'Último paso'}
          </p>
        </div>

        <div className="p-5">
          {authStep === 'provider' && (
            <div className="space-y-3 animate-slide-up">
              <button onClick={() => handleProviderSelect('google')} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold py-3.5 px-4 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-all active:scale-[0.98] hover-lift">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" /></svg>
                <span className="text-sm">Continuar con Google</span>
                <ChevronRight className="w-4 h-4 text-stone-400 ml-auto" />
              </button>

              <button onClick={() => handleProviderSelect('facebook')} className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white font-bold py-3.5 px-4 rounded-2xl hover:bg-[#166fe5] transition-all active:scale-[0.98] hover-lift shadow-lg shadow-[#1877F2]/25">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                <span className="text-sm">Continuar con Facebook</span>
                <ChevronRight className="w-4 h-4 text-white/60 ml-auto" />
              </button>

              <div className="flex items-center gap-3 py-3">
                <div className="flex-1 border-t border-stone-200 dark:border-stone-700" />
                <span className="text-2xs text-stone-400 font-semibold uppercase tracking-wider">o</span>
                <div className="flex-1 border-t border-stone-200 dark:border-stone-700" />
              </div>

              <button onClick={handleGuestLogin} className="w-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold py-3.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 border border-stone-200 dark:border-stone-700">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Entrar como invitado
              </button>
            </div>
          )}

          {authStep === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-3 animate-slide-up">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-2">{selectedProvider === 'google' ? 'Correo electrónico' : 'Usuario'}</label>
                <input 
                  type={selectedProvider === 'google' ? 'email' : 'text'} 
                  value={identifier} 
                  onChange={(e) => setIdentifier(e.target.value)} 
                  placeholder={selectedProvider === 'google' ? 'tu@correo.com' : 'usuario'} 
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder-stone-400" 
                  required 
                  autoFocus 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-2">Contraseña</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder-stone-400" 
                  required 
                />
              </div>
              <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2">
                Siguiente <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {authStep === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4 animate-slide-up">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-2 uppercase tracking-wider">Tipo de cuenta</label>
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-stone-100 dark:bg-stone-800 rounded-2xl">
                  <button type="button" onClick={() => setSelectedRole('buyer')} className={`py-3 rounded-xl text-xs font-bold transition-all ${selectedRole === 'buyer' ? 'bg-card dark:bg-stone-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}>
                    Beneficiario
                  </button>
                  <button type="button" onClick={() => setSelectedRole('store')} className={`py-3 rounded-xl text-xs font-bold transition-all ${selectedRole === 'store' ? 'bg-card dark:bg-stone-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}>
                    Comercio
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-2">{selectedRole === 'store' ? 'Nombre del comercio' : 'Tu nombre'}</label>
                <input 
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  placeholder={selectedRole === 'store' ? 'Minimarket San Juan' : 'Juan Pérez'} 
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder-stone-400" 
                  required 
                  autoFocus 
                />
              </div>
              <label className="flex items-start gap-2.5 text-2xs text-stone-500 dark:text-stone-400">
                <input
                  type="checkbox"
                  checked={acceptedLegal}
                  onChange={(e) => setAcceptedLegal(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-brand-600"
                />
                <span>
                  Acepto los{' '}
                  <button type="button" onClick={() => setLegalTab('terms')} className="text-brand-600 dark:text-brand-400 font-semibold underline">
                    Términos y Condiciones
                  </button>{' '}
                  y la{' '}
                  <button type="button" onClick={() => setLegalTab('privacy')} className="text-brand-600 dark:text-brand-400 font-semibold underline">
                    Política de Privacidad
                  </button>
                  .
                </span>
              </label>
              <button type="submit" disabled={isSimulating || !displayName} className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-brand-500/40 text-white font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                {isSimulating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Entrar'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
      </div>
      <LegalModal isOpen={legalTab !== null} onClose={() => setLegalTab(null)} initialTab={legalTab ?? 'terms'} />
    </>
  );
};
