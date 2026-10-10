import React, { useState, useRef, useEffect } from 'react';
import { User, FoodNotification, FoodPackage } from '../types';
import { LogOut, PlusCircle, ShoppingBag, Store, Settings, User as UserIcon, Search, PackageCheck, Bell, BellOff, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import rescateLogo from '../assets/images/rescate_solidario_logo_1786146691474.jpg';
import { handleLogoError } from '../utils/imageUtils';
import { formatTimeAgo } from '../utils/timeUtils';

interface AppNavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  reservationsCount: number;
  onLogout: () => void;
  onChangeRole: () => void;
  onOpenSettings?: () => void;
  onOpenAuth?: () => void;
  notifications?: FoodNotification[];
  packages?: FoodPackage[];
  unreadNotifCount?: number;
  onMarkNotificationsRead?: () => void;
  notificationsEnabled?: boolean;
  onToggleNotifications?: () => void;
  onSelectNotificationPackage?: (packageId: string, packageTitle?: string) => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  reservationsCount,
  onLogout,
  onChangeRole,
  onOpenSettings,
  onOpenAuth,
  notifications = [],
  packages = [],
  unreadNotifCount = 0,
  onMarkNotificationsRead,
  notificationsEnabled = true,
  onToggleNotifications,
  onSelectNotificationPackage,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [, setTick] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const isStore = user?.role === 'store';

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowSettings(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-stone-200/60 dark:border-stone-800/60">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setActiveTab(isStore ? 'publish' : 'explore')}>
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shadow-md border border-stone-200/50 dark:border-stone-700/50 flex items-center justify-center transition-transform group-hover:scale-105">
            <img src={rescateLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={handleLogoError} />
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Rescate <span className="text-brand-600 dark:text-brand-400">Solidario</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <div className="flex items-center gap-1.5">
          {!isStore ? (
            <>
              <button
                onClick={() => setActiveTab('explore')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'explore'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <span className="hidden sm:inline">Explorar</span>
                <Search className="w-4 h-4 sm:hidden" />
              </button>
              <button
                onClick={() => setActiveTab('my-orders')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                  activeTab === 'my-orders'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <span className="hidden sm:inline">Mis Retiros</span>
                <ShoppingBag className="w-4 h-4 sm:hidden" />
                {reservationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-600 text-white text-2xs font-bold rounded-full flex items-center justify-center">
                    {reservationsCount}
                  </span>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('publish')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                  activeTab === 'publish'
                    ? 'bg-brand-600 text-white'
                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Publicar</span>
              </button>
              <button
                onClick={() => setActiveTab('my-publications')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                  activeTab === 'my-publications'
                    ? 'bg-brand-600 text-white'
                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mis Publicaciones</span>
              </button>
            </>
          )}

          <div className="w-px h-5 bg-stone-200 dark:bg-stone-700 mx-1" />

          {!user ? (
            <button onClick={onOpenAuth} className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-sm">
              Entrar
            </button>
          ) : (
            <>
              {!isStore && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => {
                      setShowNotifMenu(!showNotifMenu);
                      if (onMarkNotificationsRead && unreadNotifCount > 0) onMarkNotificationsRead();
                    }}
                    className={`relative p-2 rounded-xl transition-all ${
                      unreadNotifCount > 0
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 animate-pulse-glow'
                        : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    {unreadNotifCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent-600 text-white text-2xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-stone-900 shadow-sm">
                        {unreadNotifCount}
                      </span>
                    )}
                  </button>

                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 glass-strong border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                      <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100">Alertas de comida</span>
                        {onToggleNotifications && (
                          <button onClick={onToggleNotifications} className={`text-2xs font-bold px-2 py-0.5 rounded-lg transition-all ${notificationsEnabled ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800'}`}>
                            {notificationsEnabled ? 'ON' : 'OFF'}
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-stone-400">
                            <Bell className="w-6 h-6 mx-auto mb-2 opacity-40" />
                            <p className="text-xs">Sin alertas nuevas</p>
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const linkedPkg = packages.find((p) => p.id === notif.packageId);
                            const currentUnits = linkedPkg ? linkedPkg.availableUnits : notif.availableUnits;
                            const isExhausted = currentUnits <= 0;
                            return (
                              <div
                                key={notif.id}
                                onClick={() => {
                                  setShowNotifMenu(false);
                                  if (onSelectNotificationPackage) onSelectNotificationPackage(notif.packageId, notif.packageTitle);
                                }}
                                className="px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/60 cursor-pointer transition-colors border-b border-stone-50 dark:border-stone-800/40 last:border-0"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{notif.storeName}</span>
                                  <span className="text-2xs text-stone-400">{formatTimeAgo(notif.createdAtMs, notif.timestamp)}</span>
                                </div>
                                <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-0.5 truncate">{notif.packageTitle}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-2xs text-stone-500">{isExhausted ? 'Agotado' : `${currentUnits} un.`} · {notif.category}</span>
                                  {isExhausted && <span className="text-2xs font-bold text-warm-600 bg-warm-50 px-1.5 py-0.5 rounded dark:bg-warm-500/10 dark:text-warm-400">AGOTADO</span>}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setShowSettings(!showSettings)} className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all hover:rotate-90 duration-300">
                  <Settings className="w-4 h-4" />
                </button>

                {showSettings && (
                  <div className="absolute right-0 mt-2 w-56 glass-strong border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                    <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{user.name}</p>
                      <p className="text-2xs text-stone-500 truncate">{user.email}</p>
                    </div>
                    <button onClick={() => { setShowSettings(false); if (onChangeRole) onChangeRole(); }} className="w-full text-left px-4 py-2.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5 text-brand-500" />
                      Cambiar a {isStore ? 'Beneficiario' : 'Minimarket'}
                    </button>
                    <button onClick={() => { setShowSettings(false); if (onOpenSettings) onOpenSettings(); }} className="w-full text-left px-4 py-2.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 transition-colors">
                      <Settings className="w-3.5 h-3.5 text-stone-400" /> Tema
                    </button>
                    <button onClick={() => { setShowSettings(false); onLogout(); }} className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors border-t border-stone-100 dark:border-stone-800">
                      <LogOut className="w-3.5 h-3.5" /> Salir
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
