export type UserRole = 'buyer' | 'store' | 'volunteer' | 'admin';

export type AuthProvider = 'google' | 'facebook' | 'email' | 'guest';

export interface NeedDeclaration {
  applicantType?: 'vecino' | 'organizacion';
  organizationName?: string;
  householdMembers: string;
  vulnerabilityReason: string;
  idDocument?: string;
  commune?: string;
  swornStatementAccepted: boolean;
  declarationDate: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  provider: AuthProvider;
  rescuedItemsCount: number;
  moneySaved: number; // in USD or local currency
  co2SavedKg: number;
  storeName?: string;
  needDeclaration?: NeedDeclaration;
  isNeedVerified?: boolean;
}

export type StoreType = 'supermarket' | 'minimarket' | 'bakery' | 'greengrocer' | 'delicatessen';

export interface Store {
  id: string;
  name: string;
  type: StoreType;
  address: string;
  commune?: string;
  lat?: number;
  lng?: number;
  distanceKm: number;
  rating: number;
  logo: string;
  phone: string;
  openingHours: string;
  verified: boolean;
}

export interface FoodPackage {
  id: string;
  title: string;
  storeId: string;
  storeName: string;
  storeType: StoreType;
  storeLogo: string;
  storeAddress?: string;
  commune?: string;
  lat?: number;
  lng?: number;
  originalPrice: number;
  rescuePrice: number;
  discountPercent: number;
  itemsDescription: string[];
  category: 'Lácteos' | 'Panadería' | 'Frutas y Verduras' | 'Abarrotes' | 'Platos Preparados' | 'Mix Variado';
  availableUnits: number;
  pickupTimeStart: string;
  pickupTimeEnd: string;
  image: string;
  isDonation: boolean;
  impactKg: number;
  createdAt: string;
  expiresInMinutes: number;
  urgency?: 'green' | 'yellow' | 'red';
  isGoodCondition?: boolean;
  allergens?: string[];
  expiresAtMs?: number;
}

export interface OrderReservation {
  id: string;
  packageId: string;
  packageTitle: string;
  storeName: string;
  storeAddress: string;
  price: number;
  quantity: number;
  pickupCode: string;
  status: 'reserved' | 'collected' | 'cancelled';
  reservedAt: string;
  pickupWindow: string;
  impactKg: number;
  isDonation: boolean;
  expiresAt?: number;
  createdAtMs?: number;
  finishedAt?: number;
}

export interface FoodNotification {
  id: string;
  packageId: string;
  packageTitle: string;
  storeName: string;
  category: string;
  availableUnits: number;
  commune?: string;
  timestamp: string;
  createdAtMs?: number;
  isRead: boolean;
}

export interface ImpactStats {
  totalKgRescued: number;
  totalMealsServed: number;
  totalCo2SavedKg: number;
  activeStores: number;
  activeFamilies: number;
}
