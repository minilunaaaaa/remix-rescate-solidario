import React, { useState, useEffect } from 'react';
import { NeedDeclaration } from '../types';
import { ShieldCheck, X, FileText, Users, AlertCircle, Check, Building2, User as UserIcon, FastForward } from 'lucide-react';

interface NeedDeclarationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (declaration: NeedDeclaration) => void;
  initialData?: NeedDeclaration;
}

export const NeedDeclarationModal: React.FC<NeedDeclarationModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [applicantType, setApplicantType] = useState<'vecino' | 'organizacion'>(initialData?.applicantType || 'vecino');
  const [organizationName, setOrganizationName] = useState(initialData?.organizationName || '');
  const [householdMembers, setHouseholdMembers] = useState(initialData?.householdMembers || '2-3 personas');
  const [vulnerabilityReason, setVulnerabilityReason] = useState(initialData?.vulnerabilityReason || 'Ingresos familiares insuficientes / Desempleo');
  const [idDocument, setIdDocument] = useState(initialData?.idDocument || '');
  const [commune, setCommune] = useState(initialData?.commune || '');
  const [swornStatementAccepted, setSwornStatementAccepted] = useState(initialData?.swornStatementAccepted ?? true);

  useEffect(() => {
    if (isOpen) {
      setApplicantType(initialData?.applicantType || 'vecino');
      setOrganizationName(initialData?.organizationName || '');
      setHouseholdMembers(initialData?.householdMembers || '2-3 personas');
      setVulnerabilityReason(initialData?.vulnerabilityReason || 'Ingresos familiares insuficientes / Desempleo');
      setIdDocument(initialData?.idDocument || '');
      setCommune(initialData?.commune || '');
      setSwornStatementAccepted(initialData?.swornStatementAccepted ?? true);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSkip = () => {
    onSubmit({
      applicantType: applicantType || 'vecino',
      organizationName: applicantType === 'organizacion' ? (organizationName || 'Organización Social') : undefined,
      householdMembers: householdMembers || '2-3 personas',
      vulnerabilityReason: vulnerabilityReason || 'Ingresos familiares insuficientes / Desempleo',
      idDocument: idDocument || 'Acreditado directo',
      commune: commune || 'Chile',
      swornStatementAccepted: true,
      declarationDate: new Date().toLocaleDateString('es-CL'),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swornStatementAccepted) return;
    onSubmit({
      applicantType, organizationName: applicantType === 'organizacion' ? organizationName : undefined,
      householdMembers, vulnerabilityReason, idDocument, commune, swornStatementAccepted,
      declarationDate: new Date().toLocaleDateString('es-CL'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="w-full sm:max-w-lg bg-card dark:bg-stone-900 sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-brand-700 p-5 text-center relative shrink-0 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
          
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10"><X className="w-5 h-5" /></button>
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center relative z-10"><ShieldCheck className="w-6 h-6 text-white" /></div>
          <h3 className="text-base font-black text-white relative z-10">Acreditación de Necesidad</h3>
          <p className="text-xs text-white/80 mt-1 relative z-10">Para asegurar entregas justas</p>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-brand-700 dark:text-brand-300">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">Las donaciones son <strong>100% gratuitas</strong>. Completa esta breve declaración para acceder.</p>
          </div>

          <form id="need-declaration-form" onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1.5 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-brand-500" /> ¿Solicitas como?</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setApplicantType('vecino'); if (householdMembers.includes('beneficiarios')) setHouseholdMembers('2-3 personas'); }} className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${applicantType === 'vecino' ? 'bg-brand-50 dark:bg-brand-500/10 border-brand-500 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30' : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'}`}>
                  <UserIcon className="w-3.5 h-3.5" /> Beneficiario
                </button>
                <button type="button" onClick={() => { setApplicantType('organizacion'); setHouseholdMembers('10-30 beneficiarios'); }} className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${applicantType === 'organizacion' ? 'bg-accent-50 dark:bg-accent-500/10 border-accent-500 text-accent-700 dark:text-accent-300 ring-1 ring-accent-500/30' : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'}`}>
                  <Building2 className="w-3.5 h-3.5" /> Organización
                </button>
              </div>
            </div>

            {applicantType === 'organizacion' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">Nombre de la organización</label>
                <input type="text" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Comedor Solidario San José" className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-stone-400" required={applicantType === 'organizacion'} />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1.5 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-brand-500" /> {applicantType === 'organizacion' ? 'Beneficiarios' : 'Integrantes del hogar'}</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(applicantType === 'organizacion' ? ['1-10 personas', '10-30 beneficiarios', '30-100 beneficiarios', '+100 beneficiarios'] : ['1 persona', '2-3 personas', '4-5 personas', 'Más de 5']).map((option) => (
                  <button key={option} type="button" onClick={() => setHouseholdMembers(option)} className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center ${householdMembers === option ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-500 ring-1 ring-brand-500/30' : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'}`}>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1.5 flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-brand-500" /> Situación de necesidad</label>
              <select value={vulnerabilityReason} onChange={(e) => setVulnerabilityReason(e.target.value)} className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option>Ingresos familiares insuficientes / Desempleo</option>
                <option>Adulto Mayor o Pensionado con ingresos reducidos</option>
                <option>Madre o Padre soltero(a) - Jefe/a de hogar</option>
                <option>Persona con discapacidad o cuidador/a</option>
                <option>Estudiante con escasos recursos</option>
                <option>Apoyo a comedor comunitario u organización social</option>
                <option>Otra situación de vulnerabilidad social</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">Comuna</label>
                <input type="text" value={commune} onChange={(e) => setCommune(e.target.value)} placeholder="Santiago" className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-stone-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">RUT <span className="text-stone-400 font-normal">(opc.)</span></label>
                <input type="text" value={idDocument} onChange={(e) => setIdDocument(e.target.value)} placeholder="12.345.678-9" className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-stone-400" />
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer group">
              <input type="checkbox" checked={swornStatementAccepted} onChange={(e) => setSwornStatementAccepted(e.target.checked)} className="mt-0.5 rounded border-stone-300 text-brand-500 focus:ring-brand-500 w-4 h-4" required />
              <span className="text-xs text-stone-600 dark:text-stone-300 leading-snug">Declaro responsablemente que requiero este apoyo y me comprometo a <strong>no revender</strong> los productos.</span>
            </label>

            {!swornStatementAccepted && <p className="text-xs text-red-500 flex items-center gap-1 font-semibold"><AlertCircle className="w-3.5 h-3.5" /> Debes aceptar la declaración</p>}

            <div className="space-y-2 pt-1">
              <button type="submit" disabled={!swornStatementAccepted} className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-stone-400 text-white font-bold py-3.5 rounded-xl text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Acreditar
              </button>
              <button type="button" onClick={handleSkip} className="w-full bg-stone-100 dark:bg-stone-800 text-brand-600 dark:text-brand-400 font-bold py-3 rounded-xl text-xs border border-brand-200 dark:border-brand-500/20 transition-all hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center gap-2">
                <FastForward className="w-4 h-4" /> Saltar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
