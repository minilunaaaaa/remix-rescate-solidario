import React from 'react';

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  Lácteos: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  Panadería: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
  'Frutas y Verduras': 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=600&auto=format&fit=crop&q=80',
  Abarrotes: 'https://images.unsplash.com/photo-1584473457406-6df3a6372104?w=600&auto=format&fit=crop&q=80',
  'Platos Preparados': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
};

export const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
export const DEFAULT_STORE_LOGO = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150&auto=format&fit=crop&q=80';

export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  category?: string
) {
  const target = e.currentTarget;
  const fallback = (category && CATEGORY_FALLBACK_IMAGES[category]) || DEFAULT_FOOD_IMAGE;
  if (target.src !== fallback) {
    target.src = fallback;
  }
}

export function handleLogoError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target.src !== DEFAULT_STORE_LOGO) {
    target.src = DEFAULT_STORE_LOGO;
  }
}
