import React from 'react';
import { User, ImpactStats } from '../types';
import { ShoppingBag, Leaf, Users, HeartHandshake, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import heroBanner from '../assets/images/rescate_hero_banner_1785165587420.jpg';
import rescateLogo from '../assets/images/rescate_solidario_logo_1786146691474.jpg';
import { handleImageError } from '../utils/imageUtils';

interface HeroProps {
  user: User | null;
  onOpenAuth: () => void;
  impactStats: ImpactStats;
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ user, onOpenAuth, impactStats, onExploreClick }) => {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Card */}
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 relative">
        <div className="bg-card dark:bg-stone-900 rounded-3xl overflow-hidden shadow-lg shadow-stone-200/50 dark:shadow-none border border-stone-200/50 dark:border-stone-800/50 animate-slide-up">
          {/* Image */}
          <div className="relative h-48 sm:h-56 overflow-hidden group">
            <img
              src={heroBanner}
              alt="Rescate Solidario"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Floating badge */}
            <div className="absolute top-4 left-4 animate-float">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/35 border border-white/25">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-2xs font-bold text-white">100% Gratis</span>
              </div>
            </div>
            
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-black/35 flex items-center justify-center border border-white/25">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-2xs font-bold text-white/90">Alimentos gratuitos</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                Rescata comida,<br />
                <span className="text-accent-300">ayuda a tu barrio</span>
              </h1>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5">
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Minimarkets publican alimentos frescos que sobran al final del día. Todo <strong className="text-brand-600 dark:text-brand-400 font-bold">100% gratuito</strong> para quien lo necesite.
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: HeartHandshake, label: 'Sin costo', color: 'bg-brand-600', bg: 'bg-brand-50 dark:bg-brand-500/10' },
                { icon: Leaf, label: 'Cero basura', color: 'bg-success-600', bg: 'bg-success-50 dark:bg-success-500/10' },
                { icon: Users, label: 'Comunidad', color: 'bg-accent-600', bg: 'bg-accent-50 dark:bg-accent-500/10' },
              ].map((item, index) => (
                <div 
                  key={item.label} 
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl ${item.bg} border border-stone-100 dark:border-stone-800 hover-lift animate-slide-up stagger-${index + 1}`}
                >
                  <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center shadow-sm`}>
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-2xs font-bold text-stone-600 dark:text-stone-400">{item.label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            {!user ? (
              <div className="space-y-3">
                <button
                  onClick={onOpenAuth}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-2xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Comenzar ahora
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
                  Registro rápido y seguro
                </div>
              </div>
            ) : (
              <button
                onClick={onExploreClick}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-2xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Ver ofertas de hoy
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { value: impactStats.totalKgRescued >= 1000 ? `${(impactStats.totalKgRescued / 1000).toFixed(1)}k` : impactStats.totalKgRescued.toLocaleString(), label: 'kg rescatados', textColor: 'text-brand-600 dark:text-brand-400' },
            { value: impactStats.totalMealsServed.toLocaleString(), label: 'porciones', textColor: 'text-accent-600 dark:text-accent-400' },
            { value: impactStats.totalCo2SavedKg >= 1000 ? `${(impactStats.totalCo2SavedKg / 1000).toFixed(1)}t` : `${impactStats.totalCo2SavedKg.toFixed(0)}kg`, label: 'CO₂ evitado', textColor: 'text-brand-700 dark:text-brand-300' },
            { value: `${impactStats.activeStores}+`, label: 'comercios', textColor: 'text-stone-700 dark:text-stone-300' },
          ].map((stat, index) => (
            <div 
              key={stat.label} 
              className={`bg-card dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/50 dark:border-stone-800/50 text-center shadow-sm hover-lift animate-slide-up stagger-${index + 1}`}
            >
              <div className={`text-xl font-black nums font-display ${stat.textColor}`}>{stat.value}</div>
              <div className="text-2xs font-medium text-stone-400 dark:text-stone-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
