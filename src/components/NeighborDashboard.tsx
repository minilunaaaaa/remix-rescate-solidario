import React, { useState, useEffect } from 'react';
import { FoodPackage, OrderReservation, User, NeedDeclaration, FoodNotification } from '../types';
import { Search, Clock, MapPin, CheckCircle2, QrCode, ShoppingBag, Heart, ShieldCheck, Info, Map as MapIcon, List, FileText, AlertCircle, Bell, BellOff, XCircle, X } from 'lucide-react';
import QRCode from 'react-qr-code';
import confetti from 'canvas-confetti';
import { ChileMapView } from './ChileMapView';
import { NeedDeclarationModal } from './NeedDeclarationModal';
import { handleImageError, handleLogoError } from '../utils/imageUtils';

interface NeighborDashboardProps {
  packages: FoodPackage[];
  reservations: OrderReservation[];
  user: User | null;
  activeSubTab: 'explore' | 'my-orders';
  setActiveSubTab: (tab: 'explore' | 'my-orders') => void;
  onClaimSuccess: (reservation: OrderReservation) => void;
  onCancelReservation?: (reservationId: string, packageId: string) => void;
  onUpdateUser?: (updatedUser: User) => void;
  notificationsEnabled?: boolean;
  onToggleNotifications?: () => void;
  notifications?: FoodNotification[];
  selectedNotificationTarget?: { packageId?: string; packageTitle?: string; nonce: number } | null;
  onClearSelectedNotificationTarget?: () => void;
  locationTrackingEnabled?: boolean;
}

export const NeighborDashboard: React.FC<NeighborDashboardProps> = ({
  packages, reservations, user, activeSubTab, setActiveSubTab, onClaimSuccess, onCancelReservation, onUpdateUser,
  notificationsEnabled = true, onToggleNotifications, notifications = [], selectedNotificationTarget, onClearSelectedNotificationTarget,
  locationTrackingEnabled = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [claimingPackage, setClaimingPackage] = useState<FoodPackage | null>(null);
  const [cancelingReservation, setCancelingReservation] = useState<OrderReservation | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [highlightedPackageId, setHighlightedPackageId] = useState<string | null>(null);
  const [notFoundAlert, setNotFoundAlert] = useState<string | null>(null);
  const [isNeedModalOpen, setIsNeedModalOpen] = useState(false);
  const [pendingClaimPackage, setPendingClaimPackage] = useState<FoodPackage | null>(null);
  const [showingCode, setShowingCode] = useState<OrderReservation | null>(null);

  const categories = ['Todos', 'Lácteos', 'Panadería', 'Frutas y Verduras', 'Abarrotes', 'Platos Preparados', 'Mix Variado'];

  const filtered = packages.filter((pkg) => {
    if (selectedCategory !== 'Todos' && pkg.category !== selectedCategory) return false;
    if (searchQuery && !pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) && !pkg.storeName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const visiblePackages = filtered.slice(0, 15);
  const hiddenPackagesCount = filtered.length - visiblePackages.length;

  const handleInitiateClaim = (pkg: FoodPackage) => {
    const alreadyReserved = reservations.some((r) => r.packageId === pkg.id && r.status === 'reserved');
    if (alreadyReserved) {
      setNotFoundAlert(`Ya tienes una reserva de "${pkg.title}". Revisa Mis Retiros.`);
      return;
    }
    if (!user?.needDeclaration || !user.needDeclaration.swornStatementAccepted) {
      setPendingClaimPackage(pkg);
      setIsNeedModalOpen(true);
    } else {
      setClaimingPackage(pkg);
    }
  };

  useEffect(() => {
    if (!highlightedPackageId) return;
    const timer = setTimeout(() => setHighlightedPackageId(null), 3000);
    return () => clearTimeout(timer);
  }, [highlightedPackageId]);

  useEffect(() => {
    if (!notFoundAlert) return;
    const timer = setTimeout(() => setNotFoundAlert(null), 4000);
    return () => clearTimeout(timer);
  }, [notFoundAlert]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setClaimingPackage(null); };
    if (claimingPackage) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [claimingPackage]);

  useEffect(() => {
    if (selectedNotificationTarget) {
      const { packageId, packageTitle } = selectedNotificationTarget;
      const idKey = packageId ? packageId.toLowerCase().trim() : '';
      const titleKey = packageTitle ? packageTitle.toLowerCase().trim() : '';
      const targetPkg = packages.find((p) => {
        if (idKey && p.id.toLowerCase().trim() === idKey) return true;
        if (titleKey && p.title.toLowerCase().trim() === titleKey) return true;
        return false;
      });
      setSelectedCategory('Todos');
      setSearchQuery('');
      setActiveSubTab('explore');
      if (targetPkg) {
        setViewMode('list');
        setHighlightedPackageId(targetPkg.id);
        handleInitiateClaim(targetPkg);
        setTimeout(() => { const el = document.getElementById(`package-card-${targetPkg.id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 120);
      } else {
        setNotFoundAlert(`"${packageTitle || packageId}" ya no está disponible.`);
      }
      if (onClearSelectedNotificationTarget) onClearSelectedNotificationTarget();
    }
  }, [selectedNotificationTarget, packages]);

  const handleNeedSubmit = (declaration: NeedDeclaration) => {
    if (user && onUpdateUser) {
      onUpdateUser({ ...user, needDeclaration: declaration, isNeedVerified: true });
    }
    setIsNeedModalOpen(false);
    if (pendingClaimPackage) { setClaimingPackage(pendingClaimPackage); setPendingClaimPackage(null); }
  };

  const handleConfirmClaim = () => {
    if (!claimingPackage) return;
    if (claimingPackage.availableUnits <= 0) {
      setNotFoundAlert('Este paquete se agotó mientras lo veías.');
      setClaimingPackage(null);
      return;
    }
    if (reservations.some((r) => r.packageId === claimingPackage.id && r.status === 'reserved')) {
      setNotFoundAlert('Ya tienes una reserva de este paquete.');
      setClaimingPackage(null);
      return;
    }
    setIsConfirming(true);
    setTimeout(() => {
      const PICKUP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const pickupCode = 'RS-' + Array.from({ length: 10 }, () => PICKUP_CHARS[Math.floor(Math.random() * PICKUP_CHARS.length)]).join('');
      const newReservation: OrderReservation = {
        id: 'res-' + Date.now(), packageId: claimingPackage.id, packageTitle: claimingPackage.title, storeName: claimingPackage.storeName,
        storeAddress: claimingPackage.storeAddress, price: 0, quantity: 1,
        pickupCode, status: 'reserved',
        createdAtMs: Date.now(),
        reservedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pickupWindow: `${claimingPackage.pickupTimeStart} - ${claimingPackage.pickupTimeEnd} hrs`, impactKg: claimingPackage.impactKg, isDonation: true,
        expiresAt: Date.now() + (claimingPackage.expiresInMinutes || 120) * 60 * 1000,
      };
      try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } }); } catch (e) {}
      onClaimSuccess(newReservation);
      setIsConfirming(false);
      setClaimingPackage(null);
    }, 400);
  };

  const getUrgencyColor = (urgency?: string) => {
    if (urgency === 'red') return 'bg-red-500';
    if (urgency === 'yellow') return 'bg-amber-400';
    return 'bg-success-500';
  };

  const getUrgencyText = (urgency?: string) => {
    if (urgency === 'red') return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
    if (urgency === 'yellow') return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
    return 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/20';
  };

  const getUnitsChip = (units: number) => {
    if (units <= 0) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
    if (units <= 2) return 'text-warm-600 dark:text-warm-400 bg-warm-50 dark:bg-warm-500/10 border-warm-200 dark:border-warm-500/20';
    return 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/20';
  };

  const getUnitsLabel = (units: number) => {
    if (units <= 0) return 'Agotado';
    if (units === 1) return 'Última ración';
    return `${units} disponibles`;
  };

  const getOrderStatusBadge = (status: OrderReservation['status']) => {
    if (status === 'collected') return 'text-success-700 dark:text-success-300 bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/20';
    if (status === 'cancelled') return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
    return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
  };

  const getOrderStatusLabel = (status: OrderReservation['status']) => {
    if (status === 'collected') return 'Retirado ✓';
    if (status === 'cancelled') return 'Cancelado';
    return 'Pendiente';
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Greeting */}
      <div className="bg-card dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/50 dark:border-stone-800/50 shadow-sm animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 font-medium">Bienvenido</p>
            <h1 className="text-lg font-black text-stone-900 dark:text-stone-100 mt-0.5">Hola, {user?.name || 'Beneficiario'}</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Alimentos gratuitos cerca de ti</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-sm">
            <span className="text-xl font-black text-white">$0</span>
          </div>
        </div>
      </div>

      {/* Declaration Status */}
      {user?.needDeclaration ? (
        <div className="bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/20 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-success-100 dark:bg-success-500/20 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-success-600 dark:text-success-400" /></div>
            <div>
              <span className="text-xs font-bold text-success-700 dark:text-success-300">Acreditado</span>
              <p className="text-2xs text-success-600/70 dark:text-success-400/70">{user.needDeclaration.vulnerabilityReason}</p>
            </div>
          </div>
          <button onClick={() => setIsNeedModalOpen(true)} className="text-2xs font-bold text-success-700 dark:text-success-300 bg-white dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-success-200 dark:border-success-500/20">Ver</button>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center"><FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" /></div>
            <div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Declaración pendiente</span>
              <p className="text-2xs text-amber-600/70 dark:text-amber-400/70">Completa antes de solicitar</p>
            </div>
          </div>
          <button onClick={() => setIsNeedModalOpen(true)} className="text-2xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-500/20">Acreditar</button>
        </div>
      )}

      {/* Notifications Toggle */}
      <div className="bg-card dark:bg-stone-900 rounded-2xl p-3 border border-stone-200/50 dark:border-stone-800/50 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${notificationsEnabled ? 'bg-brand-50 dark:bg-brand-500/10' : 'bg-stone-100 dark:bg-stone-800'}`}>
            {notificationsEnabled ? <Bell className="w-4 h-4 text-brand-500" /> : <BellOff className="w-4 h-4 text-stone-400" />}
          </div>
          <div>
            <span className="text-xs font-bold text-stone-900 dark:text-stone-100">Alertas</span>
            <p className="text-2xs text-stone-400">{notificationsEnabled ? 'Activadas' : 'Desactivadas'}</p>
          </div>
        </div>
        {onToggleNotifications && (
          <button onClick={onToggleNotifications} className={`w-12 h-6 rounded-full transition-all relative ${notificationsEnabled ? 'bg-brand-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${notificationsEnabled ? 'left-[26px]' : 'left-0.5'}`} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-card dark:bg-stone-900 rounded-2xl p-1 border border-stone-200/50 dark:border-stone-800/50 shadow-sm animate-slide-up stagger-2">
        <button onClick={() => setActiveSubTab('explore')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'explore' ? 'bg-brand-600 text-white shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
          Disponibles
        </button>
        <button onClick={() => setActiveSubTab('my-orders')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all relative ${activeSubTab === 'my-orders' ? 'bg-brand-600 text-white shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
          Mis Retiros {reservations.length > 0 && <span className="ml-1 w-5 h-5 bg-accent-600 text-white text-2xs rounded-full inline-flex items-center justify-center shadow-sm">{reservations.length}</span>}
        </button>
      </div>

      {/* Alert */}
      {notFoundAlert && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-3 flex items-center gap-2 animate-slide-up">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex-1">{notFoundAlert}</span>
          <button onClick={() => setNotFoundAlert(null)}><XCircle className="w-4 h-4 text-amber-400" /></button>
        </div>
      )}

      {/* Explore Tab */}
      {activeSubTab === 'explore' && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative animate-slide-up stagger-3">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input type="text" placeholder="Buscar alimento o tienda..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-card dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800/50 rounded-2xl pl-10 pr-4 py-3 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm transition-all" />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none animate-slide-up stagger-4">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-brand-600 text-white shadow-sm' : 'bg-card dark:bg-stone-900 text-stone-500 dark:text-stone-400 border border-stone-200/50 dark:border-stone-800/50 hover:border-brand-300 dark:hover:border-brand-500/50'}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 p-1 bg-card dark:bg-stone-900 rounded-xl border border-stone-200/50 dark:border-stone-800/50">
            <button onClick={() => setViewMode('list')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100' : 'text-stone-400'}`}>
              <List className="w-3.5 h-3.5" /> Lista
            </button>
            <button onClick={() => setViewMode('map')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100' : 'text-stone-400'}`}>
              <MapIcon className="w-3.5 h-3.5" /> Mapa
            </button>
          </div>

          {/* Map or List */}
          {viewMode === 'map' ? (
            <ChileMapView packages={visiblePackages} onSelectPackage={(pkg) => handleInitiateClaim(pkg)} locationTrackingEnabled={locationTrackingEnabled} />
          ) : (
            <>
              {visiblePackages.length === 0 ? (
                <div className="bg-card dark:bg-stone-900 rounded-2xl p-8 text-center border border-stone-200/50 dark:border-stone-800/50">
                  <ShoppingBag className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Sin resultados</p>
                  <p className="text-xs text-stone-400 mt-1">Los minimarkets publican nuevos sobrantes durante el día</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hiddenPackagesCount > 0 && (
                    <p className="text-2xs text-stone-400 text-center">
                      Mostrando {visiblePackages.length} de {filtered.length} opciones. ¡Más pronto!
                    </p>
                  )}
                  {visiblePackages.map((pkg, index) => (
                    <div 
                      key={pkg.id} 
                      id={`package-card-${pkg.id}`} 
                      className={`bg-card dark:bg-stone-900 rounded-2xl border overflow-hidden transition-all hover-lift animate-slide-up stagger-${Math.min(index + 1, 6)} ${highlightedPackageId === pkg.id ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-xl animate-pulse-glow' : 'border-stone-200/50 dark:border-stone-800/50 shadow-sm'}`}
                    >
                      <div className="flex">
                        <div className="relative w-24 h-24 shrink-0 overflow-hidden">
                          <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" referrerPolicy="no-referrer" onError={(e) => handleImageError(e, pkg.category)} />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
                        </div>
                        <div className="flex-1 p-3 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="tag">GRATIS</span>
                            <div className={`flex items-center gap-1 text-2xs font-bold px-1.5 py-0.5 rounded-full border ${getUrgencyText(pkg.urgency)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getUrgencyColor(pkg.urgency)} ${pkg.urgency === 'red' ? 'animate-pulse-dot' : ''}`} />
                              {Math.floor(pkg.expiresInMinutes / 60)}h {pkg.expiresInMinutes % 60}m
                            </div>
                          </div>
                          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-1 truncate">{pkg.title}</h3>
                          <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" /> {pkg.storeName}
                          </p>
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-400" />
                              <span className="text-2xs text-stone-400 font-medium">{pkg.pickupTimeStart} - {pkg.pickupTimeEnd}</span>
                            </div>
                            <span className={`text-2xs font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${getUnitsChip(pkg.availableUnits)}`}>
                              {pkg.availableUnits > 0 && <span className={`w-1.5 h-1.5 rounded-full ${pkg.availableUnits <= 2 ? 'bg-warm-500 animate-pulse-dot' : 'bg-success-500 animate-pulse-dot'}`} />}
                              {getUnitsLabel(pkg.availableUnits)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-2.5 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-100 dark:border-stone-800">
                        <div className="text-2xs text-stone-500 dark:text-stone-400 truncate mb-2.5">
                          <span className="font-semibold text-stone-700 dark:text-stone-300">Contenido: </span>{pkg.itemsDescription.join(', ')}
                        </div>
                        {pkg.allergens && pkg.allergens.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mb-2.5">
                            <span className="text-2xs text-stone-400 font-semibold">Contiene:</span>
                            {pkg.allergens.map((a) => (
                              <span key={a} className="text-2xs font-bold text-warm-700 dark:text-warm-300 bg-warm-50 dark:bg-warm-500/10 border border-warm-200 dark:border-warm-500/20 px-1.5 py-0.5 rounded-lg">
                                ⚠ {a}
                              </span>
                            ))}
                          </div>
                        )}
                        <button onClick={() => handleInitiateClaim(pkg)} disabled={pkg.availableUnits <= 0} className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${pkg.availableUnits <= 0 ? 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 text-white active:scale-[0.98]'}`}>
                          {pkg.availableUnits <= 0 ? 'Agotado' : 'Solicitar gratis'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* My Orders Tab */}
      {activeSubTab === 'my-orders' && (
        <div className="space-y-3">
          {reservations.length === 0 ? (
            <div className="bg-card dark:bg-stone-900 rounded-2xl p-8 text-center border border-stone-200/50 dark:border-stone-800/50">
              <QrCode className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Sin reservas aún</p>
              <p className="text-xs text-stone-400 mt-1">Explora los alimentos disponibles</p>
              <button onClick={() => setActiveSubTab('explore')} className="mt-3 bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm">Ver disponibles</button>
            </div>
          ) : (
            reservations.map((res) => (
              <div key={res.id} className="bg-card dark:bg-stone-900 rounded-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-2xs font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-500/20 uppercase">Retiro gratis</span>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-1.5">{res.packageTitle}</h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{res.storeName}</p>
                    </div>
                    <span className={`text-2xs font-bold px-2 py-1 rounded-lg border ${getOrderStatusBadge(res.status)}`}>{getOrderStatusLabel(res.status)}</span>
                  </div>

<div className="mt-3 flex items-center gap-3 text-xs text-stone-500">
  <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-brand-500" /> {res.pickupWindow}</div>
  <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-brand-500" /> {res.storeAddress}</div>
</div>
{res.status === 'reserved' && res.expiresAt && (
  <div className="mt-1.5 flex items-center gap-1 text-2xs text-warm-600 dark:text-warm-400">
    <Clock className="w-3 h-3" /> Se libera a las {new Date(res.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hrs si no la retiras
  </div>
)}
                </div>

                {/* QR Code */}
                {res.status === 'collected' ? (
                  <div className="mx-4 mb-4 p-4 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-success-100 dark:bg-success-500/20 rounded-lg flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-success-600 dark:text-success-400" /></div>
                      <div>
                        <span className="text-2xs text-success-600/70 dark:text-success-400/70 font-bold block uppercase tracking-wider">Retiro completado</span>
                        <p className="text-xs font-bold text-success-700 dark:text-success-300">Gracias por rescatar esta comida</p>
                      </div>
                    </div>
                  </div>
                ) : res.status === 'cancelled' ? (
                  <div className="mx-4 mb-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 flex items-center justify-between opacity-70">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-lg flex items-center justify-center"><XCircle className="w-8 h-8 text-stone-400" /></div>
                      <div>
                        <span className="text-2xs text-stone-400 font-bold block uppercase tracking-wider">Reserva cancelada</span>
                        <p className="text-xs font-bold text-stone-500 line-through">{res.pickupCode}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-4">
                    <button onClick={() => setShowingCode(res)} className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-bold py-3 rounded-xl text-xs transition-all shadow-sm">
                      <QrCode className="w-4 h-4" /> Mostrar código QR
                    </button>
                    <p className="text-center text-2xs text-stone-400 mt-2 mb-1">El minimarket lo escanea al llegar</p>
                  </div>
                )}

                <div className="px-4 pb-4 flex items-center justify-between">
                  {res.status === 'reserved' ? (
                    <>
                      <p className="text-2xs text-stone-400">Cancela si no puedes ir</p>
                      <button onClick={() => setCancelingReservation(res)} className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all">
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <p className="text-2xs text-stone-400">{res.status === 'collected' ? 'Comparte esta entrega con tu comunidad' : 'Este retiro ya no está disponible'}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Claim Modal */}
      {claimingPackage && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setClaimingPackage(null)}>
          <div className="w-full sm:max-w-sm bg-card dark:bg-stone-900 sm:rounded-3xl rounded-t-3xl p-5 shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <span className="text-2xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-full">Confirmar solicitud</span>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-2">{claimingPackage.title}</h3>
              <p className="text-xs text-stone-500 mt-0.5">{claimingPackage.storeName}</p>
            </div>
            <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-3 mb-4 space-y-1.5">
              <div className="flex justify-between text-xs"><span className="text-stone-500">Precio</span><span className="font-bold text-brand-600 dark:text-brand-400">$0</span></div>
              <div className="flex justify-between text-xs"><span className="text-stone-500">Horario</span><span className="font-bold text-stone-900 dark:text-stone-100">{claimingPackage.pickupTimeStart} - {claimingPackage.pickupTimeEnd}</span></div>
            </div>
            <button onClick={handleConfirmClaim} disabled={isConfirming} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              {isConfirming ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Obtener código QR</>}
            </button>
            <button onClick={() => setClaimingPackage(null)} className="w-full mt-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-semibold py-2.5 rounded-xl text-xs transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelingReservation && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setCancelingReservation(null)}>
          <div className="w-full sm:max-w-sm bg-card dark:bg-stone-900 sm:rounded-3xl rounded-t-3xl p-5 shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-3"><AlertCircle className="w-6 h-6 text-red-500" /></div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">¿Cancelar reserva?</h3>
              <p className="text-xs text-stone-500 mt-1">{cancelingReservation.packageTitle} volverá a estar disponible.</p>
            </div>
            <button onClick={() => { if (onCancelReservation) onCancelReservation(cancelingReservation.id, cancelingReservation.packageId); setCancelingReservation(null); }} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-red-500/25 active:scale-[0.98] flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4" /> Cancelar reserva
            </button>
            <button onClick={() => setCancelingReservation(null)} className="w-full mt-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-semibold py-2.5 rounded-xl text-xs transition-colors">Mantener</button>
          </div>
        </div>
      )}

      <NeedDeclarationModal isOpen={isNeedModalOpen} onClose={() => { setIsNeedModalOpen(false); setPendingClaimPackage(null); }} onSubmit={handleNeedSubmit} initialData={user?.needDeclaration} />

      {/* Show Code Modal */}
      {showingCode && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setShowingCode(null)}>
          <div className="w-full sm:max-w-sm bg-card dark:bg-stone-900 sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-stone-100">Tu código de retiro</h3>
                <p className="text-xs text-stone-500 mt-0.5">Muéstralo al minimarket cuando llegues</p>
              </div>
              <button onClick={() => setShowingCode(null)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="ticket mt-4 p-6 rounded-2xl flex flex-col items-center justify-center">
              <div className="bg-white p-2.5 rounded-2xl shadow-sm">
                <QRCode value={showingCode.pickupCode} size={180} style={{ width: '100%', height: 'auto' }} />
              </div>
              <p className="mt-4 text-lg font-black text-brand-700 dark:text-brand-300 tracking-widest font-mono nums">{showingCode.pickupCode}</p>
              <p className="text-2xs text-stone-400 mt-1 text-center">{showingCode.storeName} · {showingCode.pickupWindow}</p>
            </div>
            <button onClick={() => setShowingCode(null)} className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98]">
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
