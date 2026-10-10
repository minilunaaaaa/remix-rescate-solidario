import React, { useEffect, useRef, useState } from 'react';
import { FoodPackage } from '../types';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Clock, Store, Footprints, Navigation, RefreshCw, ShieldAlert } from 'lucide-react';
import { useGeolocation, LocationStatus } from '../hooks/useGeolocation';

const createCustomIcon = (urgency?: 'green' | 'yellow' | 'red') => {
  const color = urgency === 'red' ? '#d63427' : urgency === 'yellow' ? '#c4860f' : '#3a8730';
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="40"><path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="#fff"/></svg>`;
  return L.divIcon({ className: '', html: svgString, iconSize: [28, 40], iconAnchor: [14, 40], popupAnchor: [0, -36] });
};

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatWalk = (km: number) => {
  const cuadras = Math.max(1, Math.round(km / 0.12));
  const min = Math.max(1, Math.round(km * 12.5));
  return { cuadras, min };
};

const decodePolyline = (t: string): [number, number][] => {
  const pts: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < t.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    pts.push([lat / 1e5, lng / 1e5]);
  }
  return pts;
};

const getUrgencyBadge = (urgency?: string) => {
  if (urgency === 'red') return <span className="text-2xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200">Rojo</span>;
  if (urgency === 'yellow') return <span className="text-2xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">Amarillo</span>;
  return <span className="text-2xs font-bold text-success-600 bg-success-50 px-1.5 py-0.5 rounded-full border border-success-200">Verde</span>;
};

interface ChileMapViewProps {
  packages: FoodPackage[];
  onSelectPackage?: (pkg: FoodPackage) => void;
  locationTrackingEnabled?: boolean;
}

function ViewController({ center, home, target }: { center: [number, number]; home: [number, number]; target: [number, number] | null }) {
  const map = useMap();
  const lastFitKey = useRef<string>('');
  useEffect(() => {
    if (target) {
      const key = `${home.map((v) => v.toFixed(3)).join(',')}|${target.map((v) => v.toFixed(3)).join(',')}`;
      if (key !== lastFitKey.current) {
        lastFitKey.current = key;
        map.fitBounds([home, target], { padding: [56, 56], maxZoom: 15 });
      }
    } else {
      map.setView(home, 13);
    }
  }, [center, home, target, map]);
  return null;
}

interface RouteInfo {
  points: [number, number][];
  distanceKm: number;
  durationMin: number;
}

export const ChileMapView: React.FC<ChileMapViewProps> = ({ packages, onSelectPackage, locationTrackingEnabled = true }) => {
  const defaultCenter: [number, number] = [-33.4489, -70.6693];
  const [selectedCity, setSelectedCity] = useState<'Santiago' | 'Valparaíso' | 'Concepción'>('Santiago');
  const [activePackage, setActivePackage] = useState<FoodPackage | null>(packages[0] || null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const { coords: geoCoords, status: geoStatus, refresh } = useGeolocation({ enabled: locationTrackingEnabled });

  const cityCenters: Record<string, [number, number]> = {
    Santiago: [-33.4489, -70.6693],
    'Valparaíso': [-33.0472, -71.6127],
    Concepción: [-36.827, -73.0503],
  };

  const homePoints: Record<string, [number, number]> = {
    Santiago: [-33.4435, -70.6465],
    'Valparaíso': [-33.0410, -71.6200],
    Concepción: [-36.8200, -73.0330],
  };

  const homePoint = homePoints[selectedCity];
  const locationReady = locationTrackingEnabled && geoStatus === 'granted' && geoCoords !== null;
  const userLatLng: [number, number] = locationReady && geoCoords ? [geoCoords.lat, geoCoords.lng] : homePoint;

  const locationUi: 'ready' | 'loading' | 'denied' | 'off' =
    locationReady
      ? 'ready'
      : !locationTrackingEnabled
        ? 'off'
        : geoStatus === 'loading' || geoStatus === 'idle'
          ? 'loading'
          : geoStatus === 'unsupported' || geoStatus === 'denied' || geoStatus === 'error'
            ? 'denied'
            : 'loading';

  const routeGeoKey = geoCoords ? `${geoCoords.lat.toFixed(4)},${geoCoords.lng.toFixed(4)}` : null;

  const handleSelectCity = (city: 'Santiago' | 'Valparaíso' | 'Concepción') => {
    setSelectedCity(city);
    const cityPkg = packages.find((p) => p.commune?.toLowerCase().includes(city.toLowerCase()));
    setActivePackage(cityPkg || null);
  };

  const currentCenter = activePackage?.lat && activePackage?.lng
    ? [activePackage.lat, activePackage.lng] as [number, number]
    : cityCenters[selectedCity];

  const activeTarget: [number, number] | null =
    activePackage?.lat && activePackage?.lng ? [activePackage.lat, activePackage.lng] : null;

  const sorted =
    locationReady && locationTrackingEnabled
      ? packages
          .filter((p) => p.lat && p.lng)
          .map((p) => ({ pkg: p, km: haversineKm(userLatLng[0], userLatLng[1], p.lat!, p.lng!) }))
          .sort((a, b) => a.km - b.km)
      : [];

  const activeWalk = activeTarget && locationUi === 'ready'
    ? formatWalk(haversineKm(userLatLng[0], userLatLng[1], activeTarget[0], activeTarget[1]))
    : null;

  useEffect(() => {
    let cancelled = false;
    const loadRoute = async () => {
      if (!locationReady || !activeTarget || !geoCoords) {
        setRoute(null);
        setRouteLoading(false);
        return;
      }
      setRoute(null);
      setRouteLoading(true);
      try {
        const url =
          `https://router.project-osrm.org/route/v1/foot/${geoCoords.lng},${geoCoords.lat};` +
          `${activeTarget[1]},${activeTarget[0]}?overview=full&geometries=polyline`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('osrm');
        const data = await res.json();
        if (cancelled) return;
        if (!data.routes || data.routes.length === 0) throw new Error('no-route');
        const r = data.routes[0];
        if (!r.geometry) throw new Error('no-geometry');
        const pts = decodePolyline(r.geometry);
        setRoute({ points: pts, distanceKm: r.distance / 1000, durationMin: r.duration / 60 });
      } catch {
        if (!cancelled) setRoute(null);
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    };
    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [locationReady, activeTarget, routeGeoKey, locationTrackingEnabled]);

  const polylinePoints: [number, number][] =
    locationUi === 'ready'
      ? route && route.points.length > 1
        ? route.points
        : activeTarget
          ? [userLatLng, activeTarget]
          : []
      : [];

  const showDirectFallback = locationUi === 'ready' && !!activeTarget && !route && !routeLoading;

  const renderLocationChip = () => {
    if (locationUi === 'ready') {
      return (
        <p className="flex items-center gap-1.5 text-2xs text-stone-500">
          <span className="inline-block w-2 h-2 rounded-full border-2 border-white dark:border-stone-900 bg-brand-600 shadow-sm animate-pulse-dot" />
          Ubicación real activada <Navigation className="w-3 h-3 text-brand-500" />
        </p>
      );
    }
    if (locationUi === 'off') {
      return (
        <p className="flex items-center gap-1.5 text-2xs text-amber-600 dark:text-amber-400">
          <ShieldAlert className="w-3 h-3" /> Seguimiento de ubicación apagado · actívalo en Configuración
        </p>
      );
    }
    if (locationUi === 'loading') {
      return (
        <p className="flex items-center gap-1.5 text-2xs text-stone-500">
          <RefreshCw className="w-3 h-3 animate-spin" /> Buscando tu ubicación…
        </p>
      );
    }
    return (
      <p className="flex items-center gap-1.5 text-2xs text-amber-600 dark:text-amber-400">
        <ShieldAlert className="w-3 h-3" /> Ubicación no disponible
        <button onClick={refresh} className="ml-1 text-2xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-lg border border-brand-200 dark:border-brand-500/20 active:scale-95 transition-all">
          Actualizar
        </button>
      </p>
    );
  };

  const renderBlockedCard = () => {
    if (locationUi === 'off') {
      return (
        <p className="text-xs text-stone-400 flex items-center gap-1.5 py-2">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> Activa el seguimiento en Configuración para ver distancias reales y la ruta.
        </p>
      );
    }
    if (locationUi === 'loading') {
      return (
        <p className="text-xs text-stone-400 flex items-center gap-1.5 py-2">
          <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" /> Obteniendo tu ubicación…
        </p>
      );
    }
    return (
      <div className="py-2">
        <p className="text-xs text-stone-400 flex items-center gap-1.5 mb-2">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> Para ver distancias y la ruta, permite la ubicación en tu navegador o app.
        </p>
        <button onClick={refresh} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-[0.98]">
          Volver a pedir permiso
        </button>
      </div>
    );
  };

  return (
    <div className="bg-card dark:bg-stone-900 rounded-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm overflow-hidden animate-slide-up">
      <div className="p-3 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-500" />
            <span className="text-xs font-bold text-stone-900 dark:text-stone-100">Mapa</span>
          </div>
          <div className="flex gap-1.5">
            {(['Santiago', 'Valparaíso', 'Concepción'] as const).map((city) => (
              <button key={city} onClick={() => handleSelectCity(city)} className={`px-3 py-1.5 rounded-lg text-2xs font-bold transition-all ${selectedCity === city ? 'bg-brand-600 text-white shadow-sm' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700'}`}>
                {city}
              </button>
            ))}
          </div>
        </div>
        {renderLocationChip()}
      </div>

      <div className="h-[230px] sm:h-[280px]">
        <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom={false} className="w-full h-full">
          <ViewController center={currentCenter} home={userLatLng} target={activeTarget} />
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {polylinePoints.length > 0 && (
            <Polyline
              positions={polylinePoints}
              pathOptions={route ? { color: '#2563eb', weight: 4, opacity: 0.75 } : { color: '#2c6b25', weight: 4, opacity: 0.65, dashArray: '6 8' }}
            />
          )}
          <CircleMarker center={userLatLng} radius={9} pathOptions={{ color: '#ffffff', weight: 2.5, fillColor: '#141914', fillOpacity: 1 }}>
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-stone-900">Tú estás aquí</p>
                <p className="text-2xs text-stone-500">{locationUi === 'ready' ? 'Ubicación en tiempo real' : 'Ubicación estimada para la zona'}</p>
              </div>
            </Popup>
          </CircleMarker>
          {packages.map((pkg) => {
            if (!pkg.lat || !pkg.lng) return null;
            return (
              <Marker key={pkg.id} position={[pkg.lat, pkg.lng]} icon={createCustomIcon(pkg.urgency)} eventHandlers={{ click: () => setActivePackage(pkg) }}>
                <Popup>
                  <div className="p-1 space-y-1.5 text-xs max-w-[200px]">
                    <div className="flex items-center gap-1 font-bold text-brand-600"><Store className="w-3 h-3" /> <span className="truncate">{pkg.storeName}</span></div>
                    <p className="font-bold text-stone-900 text-xs">{pkg.title}</p>
                    <p className="text-2xs text-stone-500">{pkg.commune}</p>
                    <div className="flex items-center gap-1 text-2xs"><Clock className="w-3 h-3 text-brand-500" /> {pkg.pickupTimeStart}-{pkg.pickupTimeEnd}</div>
                    {locationUi === 'ready' && (
                      <p className="flex items-center gap-1 text-2xs text-brand-600 font-bold">
                        <Footprints className="w-3 h-3" /> a {formatWalk(haversineKm(userLatLng[0], userLatLng[1], pkg.lat, pkg.lng)).cuadras} cuadras · {formatWalk(haversineKm(userLatLng[0], userLatLng[1], pkg.lat, pkg.lng)).min} min
                      </p>
                    )}
                    {onSelectPackage && (
                      <button onClick={() => onSelectPackage(pkg)} disabled={pkg.availableUnits <= 0} className={`w-full mt-1 font-bold py-2 rounded-xl text-xs transition-all ${pkg.availableUnits <= 0 ? 'bg-stone-200 text-stone-400' : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98]'}`}>
                        {pkg.availableUnits <= 0 ? 'Agotado' : 'Solicitar $0'}
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="p-3 border-t border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-1.5 mb-2">
          <Footprints className="w-3.5 h-3.5 text-brand-500" />
          <span className="text-xs font-bold text-stone-900 dark:text-stone-100">Cerca de ti</span>
          <span className="ml-auto text-2xs text-stone-400">de más cerca a más lejos</span>
        </div>
        {locationUi !== 'ready' ? (
          renderBlockedCard()
        ) : sorted.length === 0 ? (
          <p className="text-xs text-stone-400 flex items-center gap-1.5 py-2"><MapPin className="w-3.5 h-3.5" /> Aún no hay alimentos con ubicación en esta zona.</p>
        ) : (
          sorted.map(({ pkg, km }, index) => {
            const w = formatWalk(km);
            const isActive = activePackage?.id === pkg.id;
            return (
              <button key={pkg.id} onClick={() => setActivePackage(pkg)} className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all mb-1.5 ${isActive ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-500/20' : 'border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 hover:border-stone-200 dark:hover:border-stone-700'}`}>
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-black text-white ${index === 0 ? 'bg-brand-600' : 'bg-stone-400 dark:bg-stone-600'}`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{pkg.title}</p>
                  <p className="text-2xs text-stone-500 truncate">{pkg.storeName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xs font-black text-brand-700 dark:text-brand-300">{w.cuadras} cuadras</p>
                  <p className="text-2xs text-stone-400 flex items-center justify-end gap-0.5"><Clock className="w-3 h-3" /> {w.min} min</p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {activePackage && (
        <div className="p-3 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{activePackage.storeName}</span>
            </div>
            {getUrgencyBadge(activePackage.urgency)}
          </div>
          {activeWalk && (
            <div className="mb-2 space-y-1">
              {route ? (
                <p className="flex items-center gap-1 text-2xs text-blue-600 dark:text-blue-400 font-bold">
                  <Navigation className="w-3 h-3" /> Ruta por calles · {route.distanceKm.toFixed(1)} km · {Math.max(1, Math.round(route.durationMin))} min caminando
                </p>
              ) : routeLoading ? (
                <p className="flex items-center gap-1 text-2xs text-brand-600 dark:text-brand-400 font-bold">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Calculando la mejor ruta…
                </p>
              ) : (
                <p className="flex items-center gap-1 text-2xs text-brand-600 dark:text-brand-400 font-bold">
                  <Footprints className="w-3 h-3" /> {showDirectFallback ? 'Ruta directa (línea recta) · ' : ''}Tú ➜ tienda · {activeWalk.cuadras} cuadras · {activeWalk.min} min caminando
                </p>
              )}
            </div>
          )}
          {locationUi === 'ready' && !route && !routeLoading && (
            <p className="text-2xs text-stone-400 mb-2">{showDirectFallback ? 'Sin servicio de mapas en línea: distancia calculada en línea recta.' : ''}</p>
          )}
          <div className="flex items-center gap-3 text-2xs text-stone-500 mb-2">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {activePackage.commune}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {activePackage.pickupTimeStart}-{activePackage.pickupTimeEnd}</span>
          </div>
          {onSelectPackage && (
            <button onClick={() => onSelectPackage(activePackage)} disabled={activePackage.availableUnits <= 0} className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${activePackage.availableUnits <= 0 ? 'bg-stone-200 dark:bg-stone-700 text-stone-400' : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'}`}>
              {activePackage.availableUnits <= 0 ? 'Agotado' : 'Reservar gratis'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};