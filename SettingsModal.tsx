import React, { useState } from 'react';
import { X, Moon, Sun, ScrollText, ShieldCheck, Bell, BellOff, Smartphone, MapPin } from 'lucide-react';
import { LegalModal } from './LegalModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  notificationsEnabled?: boolean;
  onToggleNotifications?: () => void;
  deviceNotifEnabled?: boolean;
  onToggleDeviceNotif?: () => void;
  locationTrackingEnabled?: boolean;
  onToggleLocationTracking?: () => void;
}

interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  active: boolean;
  onToggle?: () => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ icon, title, subtitle, active, onToggle }) => (
  <div className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-brand-50 dark:bg-brand-500/10' : 'bg-stone-100 dark:bg-stone-800'}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-stone-800 dark:text-stone-200">{title}</p>
      <p className="text-2xs text-stone-400 truncate">{subtitle}</p>
    </div>
    {onToggle && (
      <button onClick={onToggle} className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${active ? 'bg-brand-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${active ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    )}
  </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, theme, setTheme,
  notificationsEnabled = true, onToggleNotifications,
  deviceNotifEnabled = false, onToggleDeviceNotif,
  locationTrackingEnabled = true, onToggleLocationTracking,
}) => {
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy' | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="w-full sm:max-w-sm glass-strong sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative p-4 border-b border-stone-100 dark:border-stone-800 overflow-hidden">
          <div className="absolute inset-0 bg-brand-500/5" />
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">Configuración</h3>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>
        
        <div className="p-4">
          <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 mb-3 uppercase tracking-wider">Apariencia</p>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setTheme('light')} 
              className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all hover-lift ${theme === 'light' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 shadow-sm' : 'border-stone-200 dark:border-stone-700 text-stone-500 hover:border-brand-300 dark:hover:border-brand-500/50'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${theme === 'light' ? 'bg-brand-500 text-white' : 'bg-stone-100 dark:bg-stone-800'}`}>
                <Sun className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">Claro</span>
            </button>
            <button 
              onClick={() => setTheme('dark')} 
              className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all hover-lift ${theme === 'dark' ? 'border-brand-500 bg-brand-500/10 text-brand-400 shadow-sm' : 'border-stone-200 dark:border-stone-700 text-stone-500 hover:border-brand-300 dark:hover:border-brand-500/50'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${theme === 'dark' ? 'bg-brand-500 text-white' : 'bg-stone-100 dark:bg-stone-800'}`}>
                <Moon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">Oscuro</span>
            </button>
          </div>
        </div>

        <div className="p-4 pt-0">
          <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 mb-3 uppercase tracking-wider">Notificaciones</p>
          <div className="space-y-2">
            <ToggleRow
              icon={notificationsEnabled ? <Bell className="w-4 h-4 text-brand-500" /> : <BellOff className="w-4 h-4 text-stone-400" />}
              title="Avisos en la app"
              subtitle={notificationsEnabled ? 'Activados' : 'Desactivados'}
              active={notificationsEnabled}
              onToggle={onToggleNotifications}
            />
            <ToggleRow
              icon={deviceNotifEnabled ? <Smartphone className="w-4 h-4 text-brand-500" /> : <Smartphone className="w-4 h-4 text-stone-400" />}
              title="Avisos en el celular"
              subtitle={deviceNotifEnabled ? 'Notificaciones del teléfono' : 'Solo dentro de la app'}
              active={deviceNotifEnabled}
              onToggle={onToggleDeviceNotif}
            />
          </div>
        </div>

        <div className="p-4 pt-0">
          <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 mb-3 uppercase tracking-wider">Ubicación</p>
          <div className="space-y-2">
            <ToggleRow
              icon={<MapPin className={`w-4 h-4 ${locationTrackingEnabled ? 'text-brand-500' : 'text-stone-400'}`} />}
              title="Seguimiento de ubicación"
              subtitle={locationTrackingEnabled ? 'Distancias y ruta reales' : 'Apagado'}
              active={locationTrackingEnabled}
              onToggle={onToggleLocationTracking}
            />
          </div>
        </div>

        <div className="p-4 pt-0">
          <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 mb-3 uppercase tracking-wider">Legal</p>
          <div className="space-y-2">
            <button onClick={() => setLegalTab('terms')} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all text-left">
              <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center shrink-0"><ScrollText className="w-4 h-4 text-brand-600 dark:text-brand-400" /></div>
              <div className="flex-1">
                <p className="text-xs font-bold text-stone-800 dark:text-stone-200">Términos y Condiciones</p>
                <p className="text-2xs text-stone-400">Versión preliminar</p>
              </div>
            </button>
            <button onClick={() => setLegalTab('privacy')} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all text-left">
              <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-500/10 flex items-center justify-center shrink-0"><ShieldCheck className="w-4 h-4 text-accent-600 dark:text-accent-300" /></div>
              <div className="flex-1">
                <p className="text-xs font-bold text-stone-800 dark:text-stone-200">Política de Privacidad</p>
                <p className="text-2xs text-stone-400">Protección de datos</p>
              </div>
            </button>
          </div>
        </div>
      </div>
      <LegalModal isOpen={legalTab !== null} onClose={() => setLegalTab(null)} initialTab={legalTab ?? 'terms'} />
    </div>
  );
};
