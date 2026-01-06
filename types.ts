export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'liquid' | 'device' | 'pod' | 'accessory';
  inStock: boolean;
  stock: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface UserBehavior {
  action: 'view_product' | 'search' | 'filter' | 'add_cart' | 'login' | 'click';
  target?: string;
  timestamp: number;
}

export interface Notification {
  id: string;
  text: string;
  isRead: boolean;
  timestamp: number;
}

export interface User {
  username: string;
  role: 'admin' | 'user' | 'owner';
  lastLogin: number;
  avatar?: string;
  ip?: string;
  location?: string;
  device?: string;      // User Agent / Device Name
  os?: string;          // Operating System
  browser?: string;     // Browser Name
  favorites: string[]; 
  isBanned?: boolean;
  
  // New Admin Features
  isVip?: boolean;           // VIP Status
  isShadowBanned?: boolean;  // User thinks they are active, but ignored
  balance?: number;          // Store credit / Loyalty points
  notifications?: Notification[]; // System messages
  bannedDevice?: string;     // Ban by device fingerprint
  behaviorLog?: UserBehavior[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'auth' | 'action' | 'error' | 'system' | 'scroll' | 'security';
  username: string;
  message: string;
  details?: string;
}

export interface Comment {
  id: string;
  productId: string;
  username: string;
  text: string;
  timestamp: number;
  likes: number;
  likedBy: string[]; 
}

export enum ViewState {
  HOME = 'HOME',
  ADMIN = 'ADMIN',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  FAVORITES = 'FAVORITES',
  ABOUT = 'ABOUT',
  LOCKDOWN = 'LOCKDOWN',
  BANNED = 'BANNED' 
}

export const ADMIN_HASH = "8a5ed89c56f6c04f4340776c1285038c3327660634629633276606385ed89c"; 
export const OWNER_HASH = "59e0a02802061955214041151608622175210963286377708575038676226662";