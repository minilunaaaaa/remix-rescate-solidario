import React, { useState, useEffect } from 'react';
import { X, ScrollText, ShieldCheck } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
}

interface LegalSection {
  h: string;
  p: string;
}

const TERMS: LegalSection[] = [
  {
    h: '1. Qué es Rescate Solidario',
    p: 'Rescate Solidario es una plataforma que conecta comercios con excedentes de comida con vecinos de su comunidad. Actuamos como intermediario: no vendemos, manipulamos ni transportamos los alimentos publicados.',
  },
  {
    h: '2. Uso de la plataforma',
    p: 'Debes entregar información veraz y mantener la confidencialidad de tu cuenta. El uso indebido o fraudulento puede significar la suspensión del acceso.',
  },
  {
    h: '3. Publicaciones de comercios',
    p: 'El comercio declara que los productos publicados son aptos para el consumo y que la información del anuncio (estado, categoría, retiro) es correcta. Es responsable de indicar alérgenos y condiciones de conservación.',
  },
  {
    h: '4. Retiros y acreditación',
    p: 'El código de retiro es personal, intransferible y de un solo uso. La acreditación de necesidad se entrega en confianza y no habilita la reventa ni el lucro con los alimentos rescatados.',
  },
  {
    h: '5. Responsabilidad',
    p: 'La plataforma no responde por el estado de los alimentos ni por su consumo. Cada persona retira y consume bajo su propio criterio; ante cualquier duda, verifica el producto con el comercio.',
  },
  {
    h: '6. Edad mínima y uso justo',
    p: 'El uso está pensado para personas mayores de 18 años. Procuramos un sistema justo: evita el acaparamiento y respeita los cupos por persona.',
  },
  {
    h: '7. Modificaciones',
    p: 'Podemos actualizar estos términos para mejorar el servicio. Las versiones nuevas se informarán dentro de la aplicación.',
  },
];

const PRIVACY: LegalSection[] = [
  {
    h: '1. Responsable del tratamiento',
    p: 'Rescate Solidario es responsable de los datos personales que tratamos a través de la plataforma, conforme a la legislación chilena de protección de datos.',
  },
  {
    h: '2. Datos que recopilamos',
    p: 'Nombre, correo electrónico, rol (beneficiario o comercio), declaración de necesidad y, cuando corresponda, datos de ubicación aproximada para mostrar comercios cercanos.',
  },
  {
    h: '3. Para qué los usamos',
    p: 'Para crear y gestionar tu cuenta, conectar retiros entre comercios y vecinos, mostrar el impacto de tus rescates y mejorar la experiencia de uso.',
  },
  {
    h: '4. Con quién se comparten',
    p: 'El comercio ve lo mínimo necesario para coordinar tu retiro. No vendemos tus datos a terceros ni los usamos para publicidad externa.',
  },
  {
    h: '5. Cuánto tiempo los guardamos',
    p: 'Conservamos los datos mientras tu cuenta esté activa. Puedes solicitar su eliminación en cualquier momento desde Configuración.',
  },
  {
    h: '6. Tus derechos',
    p: 'Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos (derechos ARCO), y solicitar la eliminación de tu cuenta y sus datos asociados.',
  },
  {
    h: '7. Contacto',
    p: 'Para ejercer tus derechos o resolver dudas sobre privacidad, escríbenos a privacidad@rescatesolidario.org.',
  },
];

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, initialTab = 'terms' }) => {
  const [tab, setTab] = useState<'terms' | 'privacy'>(initialTab);

  useEffect(() => {
    if (isOpen) setTab(initialTab);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const sections = tab === 'terms' ? TERMS : PRIVACY;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg bg-card dark:bg-stone-900 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-brand-700 p-5 text-white shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              {tab === 'terms' ? <ScrollText className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-display text-lg font-black leading-tight">Legal</h3>
              <p className="text-2xs text-white/75">Rescate Solidario · Chile</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-1.5 p-1 bg-white/15 rounded-2xl">
            <button
              onClick={() => setTab('terms')}
              className={`py-2 rounded-xl text-2xs font-bold transition-all ${tab === 'terms' ? 'bg-card text-brand-700 dark:bg-stone-800 dark:text-brand-300 shadow-sm' : 'text-white/80 hover:text-white'}`}
            >
              Términos y Condiciones
            </button>
            <button
              onClick={() => setTab('privacy')}
              className={`py-2 rounded-xl text-2xs font-bold transition-all ${tab === 'privacy' ? 'bg-card text-brand-700 dark:bg-stone-800 dark:text-brand-300 shadow-sm' : 'text-white/80 hover:text-white'}`}
            >
              Privacidad
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto">
          <div className="space-y-4">
            {sections.map((s) => (
              <section key={s.h}>
                <h4 className="font-display text-sm font-bold text-stone-900 dark:text-white mb-1">{s.h}</h4>
                <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">{s.p}</p>
              </section>
            ))}
          </div>
          <p className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 text-2xs text-stone-400">
            Versión preliminar (borrador) · Última actualización: {new Date().toLocaleDateString('es-CL')}
          </p>
        </div>
      </div>
    </div>
  );
};
