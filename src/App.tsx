import React, { useState, useEffect, useRef } from 'react';
import { User, FoodPackage, OrderReservation, UserRole, FoodNotification, ImpactStats } from './types';
import { mockPackages, initialImpactStats } from './data/mockData';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { Hero } from './components/Hero';
import { AppNavbar } from './components/AppNavbar';
import { NeighborDashboard } from './components/NeighborDashboard';
import { StoreDashboard } from './components/StoreDashboard';
import { Bell, X } from 'lucide-react';

const loadReservations = (): OrderReservation[] => {
  try {
    const saved = localStorage.getItem('rescate_reservations');
    return saved ? (JSON.parse(saved) as OrderReservation[]) : [];
  } catch {
    return [];
  }
};

const seedPackageExpiry = (pkg: FoodPackage): FoodPackage => {
  const now = Date.now();
  return { ...pkg, expiresAtMs: pkg.expiresAtMs ?? now + (pkg.expiresInMinutes || 120) * 60000 };
};

const CLEANUP_MS = 60 * 60 * 1000;

const defaultNotifications = (): FoodNotification[] => {
  const now = Date.now();
  return [
    {
      id: 'notif-1',
      packageId: 'pkg-1',
      packageTitle: 'Pack Lácteos & Yogures Frescos',
      storeName: 'Minimarket Don Pedro',
      category: 'Lácteos',
      availableUnits: 4,
      commune: 'Providencia, Santiago',
      timestamp: 'Hace 25 min',
      createdAtMs: now - 25 * 60 * 1000,
      isRead: false,
    },
    {
      id: 'notif-2',
      packageId: 'pkg-2',
      packageTitle: 'Bolsa Panadería & Repostería del Día',
      storeName: 'Panadería y Minimarket Central',
      category: 'Panadería',
      availableUnits: 6,
      commune: 'Ñuñoa, Santiago',
      timestamp: 'Hace 10 min',
      createdAtMs: now - 10 * 60 * 1000,
      isRead: false,
    },
    {
      id: 'notif-3',
      packageId: 'pkg-3',
      packageTitle: 'Cajón Frutas & Verduras de Temporada',
      storeName: 'EcoMercado San José',
      category: 'Frutas y Verduras',
      availableUnits: 3,
      commune: 'Recoleta, Santiago',
      timestamp: 'Hace 15 min',
      createdAtMs: now - 15 * 60 * 1000,
      isRead: false,
    },
  ];
};

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('rescate_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rescate_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [guestMode, setGuestMode] = useState<boolean>(false);
  const [guestRole, setGuestRole] = useState<UserRole>('buyer');

  const [packages, setPackages] = useState<FoodPackage[]>(() => {
    try {
      const saved = localStorage.getItem('rescate_packages');
      const base: FoodPackage[] = saved ? JSON.parse(saved) : mockPackages;
      return base.map(seedPackageExpiry);
    } catch {
      return mockPackages.map(seedPackageExpiry);
    }
  });

  const [reservations, setReservations] = useState<OrderReservation[]>(loadReservations);

  const reservationsRef = useRef<OrderReservation[]>(loadReservations());

  const [notifications, setNotifications] = useState<FoodNotification[]>(() => {
    try {
      const saved = localStorage.getItem('rescate_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 10);
      }
    } catch {}
    return defaultNotifications();
  });

  const [impactStats, setImpactStats] = useState<ImpactStats>(() => {
    try {
      const saved = localStorage.getItem('rescate_impact_stats');
      return saved ? { ...initialImpactStats, ...JSON.parse(saved) } : initialImpactStats;
    } catch {
      return initialImpactStats;
    }
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('rescate_notif_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [deviceNotifEnabled, setDeviceNotifEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('rescate_device_notif');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [locationTrackEnabled, setLocationTrackEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('rescate_location_tracking');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const deviceNotifRef = useRef(deviceNotifEnabled);
  const notifEnabledRef = useRef(notificationsEnabled);
  const cleanedExpiredRef = useRef<Set<string>>(new Set());
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    deviceNotifRef.current = deviceNotifEnabled;
  }, [deviceNotifEnabled]);

  useEffect(() => {
    notifEnabledRef.current = notificationsEnabled;
  }, [notificationsEnabled]);

  const [liveToast, setLiveToast] = useState<{ id?: string; title: string; store: string; units: number } | null>(null);
  const [selectedNotificationTarget, setSelectedNotificationTarget] = useState<{
    packageId?: string;
    packageTitle?: string;
    nonce: number;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<string>('explore');
  const [neighborSubTab, setNeighborSubTab] = useState<'explore' | 'my-orders'>('explore');
  const [storeSubTab, setStoreSubTab] = useState<'publish' | 'my-publications'>('publish');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('rescate_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('rescate_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('rescate_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('rescate_packages', JSON.stringify(packages));
  }, [packages]);

  useEffect(() => {
    localStorage.setItem('rescate_reservations', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem('rescate_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('rescate_notif_enabled', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('rescate_device_notif', JSON.stringify(deviceNotifEnabled));
  }, [deviceNotifEnabled]);

  useEffect(() => {
    localStorage.setItem('rescate_location_tracking', JSON.stringify(locationTrackEnabled));
  }, [locationTrackEnabled]);

  useEffect(() => {
    localStorage.setItem('rescate_impact_stats', JSON.stringify(impactStats));
  }, [impactStats]);

  useEffect(() => {
    reservationsRef.current = reservations;
  }, [reservations]);

  useEffect(() => {
    const runCleanup = () => {
      const now = Date.now();

      const expiredReserved = reservationsRef.current.filter(
        (r) =>
          r.status === 'reserved' &&
          r.expiresAt &&
          r.expiresAt <= now &&
          !cleanedExpiredRef.current.has(r.id)
      );
      if (expiredReserved.length > 0) {
        expiredReserved.forEach((r) => cleanedExpiredRef.current.add(r.id));
        const expiredIds = new Set(expiredReserved.map((r) => r.id));
        setReservations((prev) =>
          prev.map((r) => (expiredIds.has(r.id) ? { ...r, status: 'cancelled', finishedAt: now } : r))
        );
        setPackages((prev) =>
          prev.map((pkg) => {
            const qty = expiredReserved
              .filter((r) => r.packageId === pkg.id)
              .reduce((sum, r) => sum + (r.quantity || 1), 0);
            return qty > 0 ? { ...pkg, availableUnits: pkg.availableUnits + qty } : pkg;
          })
        );
      }

      setReservations((prev) =>
        prev.filter((r) => {
          if (r.status === 'reserved') return true;
          const finishedAt = r.finishedAt ?? r.createdAtMs;
          if (finishedAt === undefined) return false;
          return now - finishedAt < CLEANUP_MS;
        })
      );

      setPackages((prev) => prev.filter((p) => !p.expiresAtMs || p.expiresAtMs > now));

      setNotifications((prev) => prev.slice(0, 10));
    };

    runCleanup();
    const interval = setInterval(runCleanup, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleNotifications = () => {
    setNotificationsEnabled((prev) => !prev);
  };

  const handleToggleDeviceNotif = () => {
    const next = !deviceNotifEnabled;
    if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    setDeviceNotifEnabled(next);
  };

  const handleToggleLocationTracking = () => {
    setLocationTrackEnabled((prev) => !prev);
  };

  const handleMarkNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setGuestMode(false);
    if (loggedInUser.role === 'store') {
      setActiveTab('publish');
      setStoreSubTab('publish');
    } else {
      setActiveTab('explore');
      setNeighborSubTab('explore');
    }
  };

  const handleExploreAsGuest = (role: UserRole) => {
    setGuestRole(role);
    setGuestMode(true);
    const guestUser: User = {
      id: 'guest-' + Date.now(),
      name: role === 'store' ? 'Minimarket Don Pedro' : 'Beneficiario Invitado',
      email: 'invitado@rescate.cl',
      role: role,
      provider: 'google',
      rescuedItemsCount: 1,
      moneySaved: 0,
      co2SavedKg: 2.5,
      storeName: role === 'store' ? 'Minimarket Don Pedro' : undefined,
    };
    setUser(guestUser);
  };

  const handleLogout = () => {
    setUser(null);
    setGuestMode(false);
  };

  const handleChangeRole = () => {
    if (!user) return;
    const nextRole: UserRole = user.role === 'buyer' ? 'store' : 'buyer';
    const updatedUser: User = {
      ...user,
      role: nextRole,
      storeName: nextRole === 'store' ? (user.storeName || 'Minimarket Don Pedro') : undefined,
    };
    setUser(updatedUser);
    if (nextRole === 'store') {
      setActiveTab('publish');
      setStoreSubTab('publish');
    } else {
      setActiveTab('explore');
      setNeighborSubTab('explore');
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleClaimSuccess = (newReservation: OrderReservation) => {
    setReservations((prev) => [newReservation, ...prev]);
    const reservedQty = newReservation.quantity || 1;
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id === newReservation.packageId) {
          return {
            ...pkg,
            availableUnits: Math.max(0, pkg.availableUnits - reservedQty),
          };
        }
        return pkg;
      })
    );
    setNeighborSubTab('my-orders');
  };

  const handleCancelReservation = (reservationId: string, packageId: string) => {
    const resToCancel = reservations.find((r) => r.id === reservationId);
    const qtyToRestore = resToCancel?.quantity || 1;
    setReservations((prev) => prev.filter((r) => r.id !== reservationId));
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id === packageId) {
          return {
            ...pkg,
            availableUnits: pkg.availableUnits + qtyToRestore,
          };
        }
        return pkg;
      })
    );
  };

  const handleUpdateReservationStatus = (reservationId: string, status: OrderReservation['status']) => {
    const res = reservations.find((r) => r.id === reservationId);
    if (!res || res.status === status) return;
    if (status === 'collected' && res.status === 'reserved' && res.impactKg) {
      setImpactStats((prev) => ({
        ...prev,
        totalKgRescued: prev.totalKgRescued + res.impactKg,
        totalMealsServed: prev.totalMealsServed + Math.round(res.impactKg * 2),
        totalCo2SavedKg: prev.totalCo2SavedKg + Math.round(res.impactKg * 2.5),
      }));
    }
    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? {
              ...r,
              status,
              finishedAt:
                status === 'collected' || status === 'cancelled' ? r.finishedAt ?? Date.now() : r.finishedAt,
            }
          : r
      )
    );
  };

  const handlePublishSuccess = (newPkg: FoodPackage) => {
    const withExpiry: FoodPackage = {
      ...newPkg,
      expiresAtMs: newPkg.expiresAtMs ?? Date.now() + (newPkg.expiresInMinutes || 120) * 60000,
    };
    setPackages((prev) => [withExpiry, ...prev]);
    const now = Date.now();
    const newNotif: FoodNotification = {
      id: 'notif-' + now,
      packageId: withExpiry.id,
      packageTitle: withExpiry.title,
      storeName: withExpiry.storeName,
      category: withExpiry.category,
      availableUnits: withExpiry.availableUnits,
      commune: withExpiry.commune,
      timestamp: 'Hace un momento',
      createdAtMs: now,
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 10));
    if (notifEnabledRef.current) {
      setLiveToast({
        id: withExpiry.id,
        title: withExpiry.title,
        store: withExpiry.storeName,
        units: withExpiry.availableUnits,
      });
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setLiveToast(null);
        toastTimerRef.current = null;
      }, 7000);
    }
    if (
      deviceNotifRef.current &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification('Rescate Solidario', {
          body: `${withExpiry.storeName}: ${withExpiry.title}`,
          tag: withExpiry.id,
        });
      } catch {}
    }
  };

  const handleDeletePackage = (pkgId: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== pkgId));
  };

  const SIMULATED_PUBLICATIONS: Omit<FoodPackage, 'id' | 'createdAt'>[] = [
    {
      title: 'Caja de Yogures & Postres Artesanales',
      storeId: 'store-sim-1',
      storeName: 'Supermercado La Vega',
      storeType: 'supermarket',
      storeLogo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=80',
      storeAddress: 'Av. La Paz #120',
      commune: 'Recoleta, Santiago',
      lat: -33.4325,
      lng: -70.6515,
      originalPrice: 11000,
      rescuePrice: 0,
      discountPercent: 100,
      itemsDescription: ['6 Yogures de Vainilla y Frutilla', '2 Flan de Manjar', '2 Postres de Choclo'],
      category: 'Lácteos',
      availableUnits: 5,
      pickupTimeStart: '18:00',
      pickupTimeEnd: '20:30',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
      isDonation: true,
      impactKg: 3.0,
      expiresInMinutes: 110,
      urgency: 'yellow',
      isGoodCondition: true,
      allergens: ['Lácteos'],
    },
    {
      title: 'Bolsa Empanadas y Sopaipillas del Día',
      storeId: 'store-sim-2',
      storeName: 'Amasandería Don Julio',
      storeType: 'bakery',
      storeLogo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=80',
      storeAddress: 'Av. Manuel Matta #890',
      commune: 'Santiago Centro',
      lat: -33.4580,
      lng: -70.6420,
      originalPrice: 8500,
      rescuePrice: 0,
      discountPercent: 100,
      itemsDescription: ['4 Empanadas de Pino Horno', '6 Sopaipillas Pasadas', '2 Dobladitas'],
      category: 'Panadería',
      availableUnits: 4,
      pickupTimeStart: '19:15',
      pickupTimeEnd: '21:00',
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
      isDonation: true,
      impactKg: 2.5,
      expiresInMinutes: 80,
      urgency: 'red',
      isGoodCondition: true,
      allergens: ['Gluten'],
    },
    {
      title: 'Pack Ensaladas y Verduras Listas',
      storeId: 'store-sim-3',
      storeName: 'Verdulería BioFrut Tobalaba',
      storeType: 'greengrocer',
      storeLogo: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=150&auto=format&fit=crop&q=80',
      storeAddress: 'Av. Tobalaba #1420',
      commune: 'Providencia, Santiago',
      lat: -33.4280,
      lng: -70.5980,
      originalPrice: 12000,
      rescuePrice: 0,
      discountPercent: 100,
      itemsDescription: ['2 Ensaladas Mixtas Preparadas', '1kg Espinacas', '500g Zanahoria Rallada', '1 Mix Verde'],
      category: 'Frutas y Verduras',
      availableUnits: 3,
      pickupTimeStart: '18:45',
      pickupTimeEnd: '20:45',
      image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=600&auto=format&fit=crop&q=80',
      isDonation: true,
      impactKg: 3.8,
      expiresInMinutes: 130,
      urgency: 'green',
      isGoodCondition: true,
    },
  ];

  useEffect(() => {
    let simIndex = 0;
    const publishOne = () => {
      const template = SIMULATED_PUBLICATIONS[simIndex % SIMULATED_PUBLICATIONS.length];
      simIndex++;
      const simulatedPkg: FoodPackage = {
        ...template,
        id: `pkg-auto-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: 'Justo ahora',
      };
      handlePublishSuccess(simulatedPkg);
    };
    const timers: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];
    const SLOTS_MINUTES = [7, 38];
    SLOTS_MINUTES.forEach((slotMinute) => {
      const jitterMin = Math.random() * 4 - 2;
      const now = new Date();
      const target = new Date(now);
      target.setSeconds(0, 0);
      target.setMinutes(Math.floor(slotMinute + jitterMin));
      if (target.getTime() <= now.getTime()) {
        target.setTime(target.getTime() + 3600000);
      }
      timers.push(
        setTimeout(() => {
          publishOne();
          intervals.push(setInterval(publishOne, 3600000));
        }, target.getTime() - now.getTime())
      );
    });
    return () => {
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectNotificationPackage = (packageId: string, packageTitle?: string) => {
    if (!user) {
      handleExploreAsGuest('buyer');
    } else if (user.role === 'store') {
      setUser({ ...user, role: 'buyer' });
    }
    setNotifications((prev) =>
      prev.map((n) =>
        n.packageId === packageId || (packageTitle && n.packageTitle === packageTitle)
          ? { ...n, isRead: true }
          : n
      )
    );
    setActiveTab('explore');
    setNeighborSubTab('explore');
    setSelectedNotificationTarget({ packageId, packageTitle, nonce: Date.now() });
  };

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-paper dark:bg-ink font-sans text-stone-900 dark:text-stone-100">
        <AppNavbar
          user={null}
          activeTab="explore"
          setActiveTab={() => {}}
          reservationsCount={0}
          onLogout={() => {}}
          onChangeRole={() => {}}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          notifications={notifications}
          unreadNotifCount={unreadNotifCount}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={handleToggleNotifications}
          onSelectNotificationPackage={handleSelectNotificationPackage}
        />
        <Hero
          user={null}
          onOpenAuth={() => setIsAuthOpen(true)}
          impactStats={impactStats}
          onExploreClick={() => handleExploreAsGuest('buyer')}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          theme={theme}
          setTheme={setTheme}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={handleToggleNotifications}
          deviceNotifEnabled={deviceNotifEnabled}
          onToggleDeviceNotif={handleToggleDeviceNotif}
          locationTrackingEnabled={locationTrackEnabled}
          onToggleLocationTracking={handleToggleLocationTracking}
        />
      </div>
    );
  }

  const isStore = user.role === 'store';

  return (
    <div className="min-h-screen bg-paper dark:bg-ink text-stone-900 dark:text-stone-100 font-sans">
      {/* Toast */}
      {!isStore && liveToast && (
        <div
          onClick={() => {
            if (liveToast) {
              handleSelectNotificationPackage(liveToast.id || '', liveToast.title);
              setLiveToast(null);
            }
          }}
          className="fixed top-4 right-4 left-4 sm:left-auto sm:w-80 z-50 bg-card dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-lg animate-slide-up cursor-pointer hover-lift"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xs font-bold text-brand-600 dark:text-brand-400">Nuevo alimento</p>
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate mt-0.5">{liveToast.store}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{liveToast.title}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setLiveToast(null); }} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <AppNavbar
        user={user}
        activeTab={isStore ? storeSubTab : neighborSubTab}
        setActiveTab={(tab) => {
          if (isStore) {
            setStoreSubTab(tab as any);
          } else {
            setNeighborSubTab(tab as any);
          }
        }}
        reservationsCount={reservations.length}
        onLogout={handleLogout}
        onChangeRole={handleChangeRole}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        notifications={notifications}
        packages={packages}
        unreadNotifCount={unreadNotifCount}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={handleToggleNotifications}
        onSelectNotificationPackage={handleSelectNotificationPackage}
      />

      <main className="pb-20">
        {!isStore ? (
          <NeighborDashboard
            packages={packages}
            reservations={reservations}
            user={user}
            activeSubTab={neighborSubTab}
            setActiveSubTab={setNeighborSubTab}
            onClaimSuccess={handleClaimSuccess}
            onCancelReservation={handleCancelReservation}
            onUpdateUser={handleUpdateUser}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={handleToggleNotifications}
            notifications={notifications}
            selectedNotificationTarget={selectedNotificationTarget}
            onClearSelectedNotificationTarget={() => setSelectedNotificationTarget(null)}
            locationTrackingEnabled={locationTrackEnabled}
          />
        ) : (
          <StoreDashboard
            user={user}
            packages={packages}
            activeSubTab={storeSubTab}
            setActiveSubTab={setStoreSubTab}
            onPublishSuccess={handlePublishSuccess}
            onDeletePackage={handleDeletePackage}
            reservations={reservations}
            onUpdateReservationStatus={handleUpdateReservationStatus}
          />
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={handleToggleNotifications}
        deviceNotifEnabled={deviceNotifEnabled}
        onToggleDeviceNotif={handleToggleDeviceNotif}
        locationTrackingEnabled={locationTrackEnabled}
        onToggleLocationTracking={handleToggleLocationTracking}
      />
    </div>
  );
}
