import React, { useState, useEffect, useRef } from 'react';
import { FoodPackage, OrderReservation, User } from '../types';
import { PlusCircle, Store, CheckCircle2, Check, PackageCheck, QrCode, MapPin, Trash2, Keyboard, Camera } from 'lucide-react';

interface StoreDashboardProps {
  user: User | null;
  packages: FoodPackage[];
  activeSubTab: 'publish' | 'my-publications';
  setActiveSubTab: (tab: 'publish' | 'my-publications') => void;
  onPublishSuccess: (newPkg: FoodPackage) => void;
  onDeletePackage: (pkgId: string) => void;
  reservations: OrderReservation[];
  onUpdateReservationStatus: (reservationId: string, status: OrderReservation['status']) => void;
}

const ALLERGENS = ['Gluten', 'Lácteos', 'Huevos', 'Frutos Secos', 'Maní', 'Soja'];

const SCAN_SUPPORTED = typeof window !== 'undefined' && 'BarcodeDetector' in window;

const getLatLngByCommune = (communeStr: string) => {
  const lower = communeStr.toLowerCase();
  if (lower.includes('valpara')) return { lat: -33.0380 + (Math.random() - 0.5) * 0.01, lng: -71.6285 + (Math.random() - 0.5) * 0.01 };
  if (lower.includes('concep')) return { lat: -36.8270 + (Math.random() - 0.5) * 0.01, lng: -73.0503 + (Math.random() - 0.5) * 0.01 };
  if (lower.includes('ñuñoa') || lower.includes('nunoa')) return { lat: -33.4568 + (Math.random() - 0.5) * 0.01, lng: -70.6023 + (Math.random() - 0.5) * 0.01 };
  if (lower.includes('recoleta')) return { lat: -33.4285 + (Math.random() - 0.5) * 0.01, lng: -70.6432 + (Math.random() - 0.5) * 0.01 };
  if (lower.includes('providencia')) return { lat: -33.4350 + (Math.random() - 0.5) * 0.01, lng: -70.6120 + (Math.random() - 0.5) * 0.01 };
  return { lat: -33.4442 + (Math.random() - 0.5) * 0.01, lng: -70.6548 + (Math.random() - 0.5) * 0.01 };
};

export const StoreDashboard: React.FC<StoreDashboardProps> = ({ user, packages, activeSubTab, setActiveSubTab, onPublishSuccess, onDeletePackage, reservations, onUpdateReservationStatus }) => {
  const [storeName, setStoreName] = useState(user?.storeName || 'Minimarket Don Pedro');
  const [storeAddress, setStoreAddress] = useState('Av. Italia #450, Barrio Italia');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Lácteos' | 'Panadería' | 'Frutas y Verduras' | 'Abarrotes' | 'Platos Preparados' | 'Mix Variado'>('Lácteos');
  const [items, setItems] = useState('2 Leches Enteras, 4 Yogures, 1 Queso Crema');
  const [pickupStart, setPickupStart] = useState('18:30');
  const [pickupEnd, setPickupEnd] = useState('20:30');
  const [availableUnits, setAvailableUnits] = useState(4);
  const [impactKg, setImpactKg] = useState(3.0);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ status: 'success' | 'error' | null; message: string }>({ status: null, message: '' });
  const [commune, setCommune] = useState('Providencia, Santiago');
  const [urgency, setUrgency] = useState<'green' | 'yellow' | 'red'>('yellow');
  const [isGoodCondition, setIsGoodCondition] = useState(true);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [scanMode, setScanMode] = useState<'type' | 'scan'>('type');
  const [formError, setFormError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const myPackages = packages.filter((p) => p.storeId === user?.id || p.storeId.includes('user'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) { setFormError('Escribe un título para el paquete.'); return; }
    if (!isGoodCondition) { setFormError('Marca que la comida está en buen estado para publicar.'); return; }
    setFormError(null);
    const coords = getLatLngByCommune(commune);
    const newPackage: FoodPackage = {
      id: 'pkg-user-' + Date.now(), title, storeId: user?.id || 'store-user-' + Date.now(), storeName, storeType: 'minimarket',
      storeLogo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150&auto=format&fit=crop&q=80',
      storeAddress, commune, lat: coords.lat, lng: coords.lng, originalPrice: 12000, rescuePrice: 0, discountPercent: 100,
      itemsDescription: items.split(',').map((i) => i.trim()).filter(Boolean), category, availableUnits: Number(availableUnits) || 1,
      pickupTimeStart: pickupStart, pickupTimeEnd: pickupEnd, image: getImageByCategory(category), isDonation: true,
      impactKg: Number(impactKg), createdAt: 'Hace unos segundos', expiresInMinutes: urgency === 'red' ? 90 : urgency === 'yellow' ? 360 : 1440,
      urgency, isGoodCondition: true, allergens,
    };
    onPublishSuccess(newPackage);
    setPublishedSuccess(true);
  };

  const getImageByCategory = (cat: string) => {
    switch (cat) {
      case 'Panadería': return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80';
      case 'Frutas y Verduras': return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop&q=80';
      case 'Abarrotes': return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';
      case 'Platos Preparados': return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
      default: return 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80';
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const verifyCode = (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    const match = reservations.find((r) => r.pickupCode.toUpperCase() === normalized);
    if (!match) {
      setVerifyResult({ status: 'error', message: 'Código no encontrado.' });
      return;
    }
    if (match.status === 'collected') {
      setVerifyResult({ status: 'error', message: `Este retiro ya fue entregado (${match.packageTitle}).` });
      return;
    }
    if (match.status === 'cancelled') {
      setVerifyResult({ status: 'error', message: `Esta reserva fue cancelada (${match.packageTitle}).` });
      return;
    }
    onUpdateReservationStatus(match.id, 'collected');
    setVerifyResult({ status: 'success', message: `${normalized} válido. Entrega: ${match.packageTitle}` });
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCode(verifyCodeInput);
  };

  useEffect(() => {
    if (scanMode !== 'scan' || !SCAN_SUPPORTED) return;
    let stopped = false;
    let raf = 0;
    const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });

    const tick = async () => {
      if (stopped) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        try {
          const codes = await detector.detect(video);
          if (codes.length > 0 && codes[0].rawValue) {
            const value = String(codes[0].rawValue);
            setVerifyCodeInput(value);
            stopCamera();
            setScanMode('type');
            verifyCode(value);
            return;
          }
        } catch (e) {}
      }
      raf = requestAnimationFrame(tick);
    };

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        await videoRef.current?.play();
      } catch (e) {
        setVerifyResult({ status: 'error', message: 'No se pudo abrir la cámara. Permítela o escribe el código.' });
        setScanMode('type');
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    start();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanMode, reservations]);

  const getUrgencyColor = (u: string) => {
    if (u === 'red') return 'bg-red-500';
    if (u === 'yellow') return 'bg-amber-400';
    return 'bg-success-500';
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="bg-stone-900 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden animate-slide-up">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <span className="text-2xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-1"><Store className="w-3 h-3" /> Panel tienda</span>
            <h1 className="text-lg font-black mt-1">{storeName}</h1>
            <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {storeAddress}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-3 text-center backdrop-blur-sm border border-white/10">
            <span className="text-xl font-black">{myPackages.length}</span>
            <span className="text-2xs text-white/50 block uppercase tracking-wider">publicaciones</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-card dark:bg-stone-900 rounded-2xl p-1 border border-stone-200/50 dark:border-stone-800/50 shadow-sm animate-slide-up stagger-2">
        <button onClick={() => setActiveSubTab('publish')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeSubTab === 'publish' ? 'bg-brand-600 text-white shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
          <PlusCircle className="w-3.5 h-3.5" /> Publicar
        </button>
        <button onClick={() => setActiveSubTab('my-publications')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeSubTab === 'my-publications' ? 'bg-brand-600 text-white shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
          <PackageCheck className="w-3.5 h-3.5" /> Mis publicaciones
        </button>
      </div>

      {/* Publish Tab */}
      {activeSubTab === 'publish' && (
        <div className="space-y-4">
          {publishedSuccess ? (
            <div className="bg-card dark:bg-stone-900 rounded-2xl p-6 text-center border border-stone-200/50 dark:border-stone-800/50 shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-brand-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">¡Publicado!</h3>
              <p className="text-xs text-stone-500 mt-1">Tu oferta está visible para los beneficiarios</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setPublishedSuccess(false); setTitle(''); setAllergens([]); }} className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm">Otro</button>
                <button onClick={() => setActiveSubTab('my-publications')} className="flex-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold py-2.5 rounded-xl text-xs border border-stone-200 dark:border-stone-700">Ver</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-card dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/50 dark:border-stone-800/50 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Publicar sobrante</h3>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">Nombre del local</label>
                  <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">Dirección</label>
                  <input type="text" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} required className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">Comuna</label>
                  <input type="text" value={commune} onChange={(e) => setCommune(e.target.value)} required className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">Título del paquete</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Bolsa Lácteos del día" required className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-stone-400" />
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1.5">Vencimiento</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['green', 'yellow', 'red'] as const).map((u) => (
                      <button key={u} type="button" onClick={() => setUrgency(u)} className={`p-2 rounded-xl border text-center transition-all ${urgency === u ? 'border-brand-500 ring-1 ring-brand-500/30' : 'border-stone-200 dark:border-stone-700'}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${getUrgencyColor(u)} inline-block mb-1`} />
                        <span className="text-2xs font-bold block text-stone-700 dark:text-stone-300">{u === 'green' ? 'Verde' : u === 'yellow' ? 'Amarillo' : 'Rojo'}</span>
                        <span className="text-2xs text-stone-400 block">{u === 'green' ? 'Días' : u === 'yellow' ? 'Hoy' : 'Horas'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Condition */}
                <button type="button" onClick={() => setIsGoodCondition(!isGoodCondition)} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left text-xs font-semibold ${isGoodCondition ? 'bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/20 text-success-700 dark:text-success-300' : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500'}`}>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${isGoodCondition ? 'bg-success-500 border-success-500 text-white' : 'bg-card dark:bg-stone-900 border-stone-300 dark:border-stone-600'}`}>
                    {isGoodCondition && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  Comida en buen estado
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">Categoría</label>
                    <select value={category} onChange={(e: any) => setCategory(e.target.value)} className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option>Lácteos</option><option>Panadería</option><option>Frutas y Verduras</option><option>Abarrotes</option><option>Platos Preparados</option><option>Mix Variado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">Raciones</label>
                    <input type="number" min="1" max="50" value={availableUnits} onChange={(e) => setAvailableUnits(parseInt(e.target.value) || 1)} required className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">Detalle (separar con coma)</label>
                  <input type="text" value={items} onChange={(e) => setItems(e.target.value)} required className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1.5">Alérgenos (opcional)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALLERGENS.map((a) => {
                      const active = allergens.includes(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setAllergens((prev) => (active ? prev.filter((x) => x !== a) : [...prev, a]))}
                          className={`px-2.5 py-1.5 rounded-lg text-2xs font-bold border transition-all ${active ? 'bg-warm-500/15 border-warm-500/40 text-warm-700 dark:text-warm-300' : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-warm-400/60'}`}
                        >
                          {a}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">Desde</label>
                    <input type="text" value={pickupStart} onChange={(e) => setPickupStart(e.target.value)} required className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">Hasta</label>
                    <input type="text" value={pickupEnd} onChange={(e) => setPickupEnd(e.target.value)} required className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                </div>

                <div className="bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-xl p-2.5 text-center text-xs font-semibold text-brand-700 dark:text-brand-300">
                  Se publica a $0 (Gratuito)
                </div>

                {formError && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs font-semibold text-red-700 dark:text-red-300">
                    {formError}
                  </div>
                )}

                <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl text-xs transition-all active:scale-[0.98]">
                  Publicar oferta
                </button>
              </div>
            </form>
          )}

          {/* QR Validator */}
          <div className="bg-card dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/50 dark:border-stone-800/50 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <QrCode className="w-4 h-4 text-brand-500" />
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">Validar código QR</h4>
            </div>

            <div className="flex gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl mb-3">
              <button onClick={() => setScanMode('type')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${scanMode === 'type' ? 'bg-card dark:bg-stone-900 text-brand-600 dark:text-brand-300 shadow-sm' : 'text-stone-500 dark:text-stone-400'}`}>
                <Keyboard className="w-3.5 h-3.5" /> Escribir
              </button>
              <button onClick={() => { setScanMode('scan'); setVerifyCodeInput(''); setVerifyResult({ status: null, message: '' }); }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${scanMode === 'scan' ? 'bg-card dark:bg-stone-900 text-brand-600 dark:text-brand-300 shadow-sm' : 'text-stone-500 dark:text-stone-400'}`}>
                <Camera className="w-3.5 h-3.5" /> Escanear
              </button>
            </div>

            {scanMode === 'type' ? (
              <form onSubmit={handleVerifyCode} className="flex gap-2">
                <input type="text" placeholder="RS-123456" value={verifyCodeInput} onChange={(e) => setVerifyCodeInput(e.target.value)} className="flex-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono uppercase text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <button type="submit" className="bg-brand-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm">Verificar</button>
              </form>
            ) : SCAN_SUPPORTED ? (
              <div className="relative rounded-xl overflow-hidden bg-stone-900">
                <video ref={videoRef} className="w-full aspect-square object-cover" muted playsInline />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-3/5 aspect-square border-[3px] border-white/80 rounded-2xl" />
                </div>
                <p className="absolute bottom-0 left-0 right-0 text-center text-2xs text-white/90 bg-black/50 py-2 font-semibold">Apunta el QR del beneficiario</p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs font-semibold text-amber-700 dark:text-amber-300">
                Tu navegador no permite escanear desde cámara. Usa Chrome en el celular o escribe el código manualmente.
              </div>
            )}

            {verifyResult.status && (
              <div className={`mt-2 p-2.5 rounded-xl text-xs font-semibold ${verifyResult.status === 'success' ? 'bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-300 border border-success-200 dark:border-success-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20'}`}>
                {verifyResult.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Publications Tab */}
      {activeSubTab === 'my-publications' && (
        <div className="space-y-3">
          {myPackages.length === 0 ? (
            <div className="bg-card dark:bg-stone-900 rounded-2xl p-6 text-center border border-stone-200/50 dark:border-stone-800/50">
              <Store className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Sin publicaciones</p>
              <button onClick={() => setActiveSubTab('publish')} className="mt-3 bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm">Publicar ahora</button>
            </div>
          ) : (
            myPackages.map((pkg, index) => (
              <div key={pkg.id} className={`bg-card dark:bg-stone-900 rounded-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm overflow-hidden hover-lift animate-slide-up stagger-${Math.min(index + 1, 6)}`}>
                <div className="flex">
                  <div className="relative w-20 h-20 shrink-0 overflow-hidden">
                    <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                  </div>
                  <div className="flex-1 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-2xs font-bold bg-brand-600 text-white px-2 py-0.5 rounded-md">{pkg.category}</span>
                        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-1">{pkg.title}</h4>
                        <p className="text-2xs text-stone-400 mt-0.5">{pkg.pickupTimeStart} - {pkg.pickupTimeEnd}</p>
                      </div>
                      <button onClick={() => onDeletePackage(pkg.id)} className="text-stone-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-2.5 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-2xs text-stone-500">Raciones: <strong className={pkg.availableUnits <= 0 ? 'text-red-500' : pkg.availableUnits <= 2 ? 'text-warm-600 dark:text-warm-400' : 'text-brand-600 dark:text-brand-400'}>{pkg.availableUnits}</strong></span>
                  <span className="text-2xs font-bold text-success-600 dark:text-success-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse-dot" /> Publicado</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
