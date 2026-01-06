import { Product, User, Comment, ChatMessage, LogEntry, UserBehavior, Notification } from '../types';
import { hashPassword } from './security';

// --- SECURITY & SANITIZATION ---
const BAD_WORDS = ['хуй', 'пизда', 'ебат', 'бля', 'мудак', 'гавно', 'сука', 'дерьмо', 'чмо', 'нах'];

export const sanitizeInput = (input: string): string => {
  if (!input) return "";
  let clean = input
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") 
    .replace(/on\w+="[^"]*"/g, "") 
    .replace(/javascript:/gi, "") 
    .replace(/[<>]/g, ""); 
  return clean;
};

export const filterProfanity = (text: string): string => {
  let filtered = sanitizeInput(text);
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
};

// --- LOGGING SYSTEM ---
export const addLog = (type: LogEntry['type'], message: string, username: string = 'System', details?: string) => {
    const stored = localStorage.getItem('fazan_system_logs');
    const logs: LogEntry[] = stored ? JSON.parse(stored) : [];
    
    const newLog: LogEntry = {
        id: Date.now().toString() + Math.random().toString().slice(2,5),
        timestamp: Date.now(),
        type,
        username,
        message,
        details
    };
    
    // Keep only last 1000 logs
    const updatedLogs = [newLog, ...logs].slice(0, 1000);
    localStorage.setItem('fazan_system_logs', JSON.stringify(updatedLogs));
};

export const getLogs = (): LogEntry[] => {
    const stored = localStorage.getItem('fazan_system_logs');
    return stored ? JSON.parse(stored) : [];
};

// --- GLOBAL SITE STATE ---
export const setLockdownMode = (enabled: boolean) => {
    localStorage.setItem('fazan_lockdown', enabled ? 'true' : 'false');
    addLog('security', `LOCKDOWN MODE ${enabled ? 'ENABLED' : 'DISABLED'}`, 'Owner');
};

export const isLockdownMode = (): boolean => {
    return localStorage.getItem('fazan_lockdown') === 'true';
};

export const setGlobalAnnouncement = (text: string) => {
    if (!text) localStorage.removeItem('fazan_announcement');
    else localStorage.setItem('fazan_announcement', text);
    addLog('action', 'Обновлено глобальное объявление', 'Owner', text);
};

export const getGlobalAnnouncement = (): string | null => {
    return localStorage.getItem('fazan_announcement');
};

// --- PRODUCT DB ---
const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Husky Premium - Ice Wolf',
    description: 'Ледяной арбуз с нотками мяты. Премиальная линейка, насыщенный вкус.',
    price: 650,
    category: 'liquid',
    image: 'https://images.unsplash.com/photo-1602153508753-4ace888c10a0?q=80&w=800&auto=format&fit=crop',
    inStock: true,
    stock: 50
  },
  {
    id: '2',
    name: 'XROS 3 Mini',
    description: 'Компактная POD-система с отличной вкусопередачей и мощным аккумулятором.',
    price: 2100,
    category: 'device',
    image: 'https://images.unsplash.com/photo-1600863073099-2e707e781190?q=80&w=800&auto=format&fit=crop',
    inStock: true,
    stock: 15
  },
  {
    id: '3',
    name: 'Smoant Pasito 2',
    description: 'Легендарное устройство. Регулировка мощности, большой бак, стильный дизайн.',
    price: 2900,
    category: 'device',
    image: 'https://images.unsplash.com/photo-1574921674465-9556a3575913?q=80&w=800&auto=format&fit=crop',
    inStock: true,
    stock: 8
  },
  {
    id: '4',
    name: 'Brusko - Ягодная Хвоя',
    description: 'Необычное сочетание лесных ягод и еловых ноток.',
    price: 450,
    category: 'liquid',
    image: 'https://images.unsplash.com/photo-1558652611-e40798198f26?q=80&w=800&auto=format&fit=crop',
    inStock: true,
    stock: 100
  },
  {
    id: '5',
    name: 'Charon Baby Plus',
    description: 'Обновленная версия популярного устройства. Сменные панели и улучшенная вкусопередача.',
    price: 2500,
    category: 'device',
    image: 'https://images.unsplash.com/photo-1534125916361-b1e77f02d448?q=80&w=800&auto=format&fit=crop',
    inStock: true,
    stock: 20
  },
  {
    id: '6',
    name: 'Lost Mary 5000',
    description: 'Одноразовая ЭС с возможностью подзарядки. Вкус: Виноградный Энергетик.',
    price: 950,
    category: 'pod',
    image: 'https://images.unsplash.com/photo-1517142089942-ba376ce32a2e?q=80&w=800&auto=format&fit=crop',
    inStock: false,
    stock: 0
  },
  {
    id: '7',
    name: 'Aegis Hero 2 (H45)',
    description: 'Защита от влаги и ударов, отличный вкус, компактный размер.',
    price: 3200,
    category: 'device',
    image: 'https://images.unsplash.com/photo-1504194569462-22c8ce3f075d?q=80&w=800&auto=format&fit=crop',
    inStock: true,
    stock: 5
  },
  {
    id: '8',
    name: 'The Scandalist - Ex\'s Heart',
    description: 'Сочное сочетание киви и малины. Классика вейпинга.',
    price: 800,
    category: 'liquid',
    image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=80&w=800&auto=format&fit=crop',
    inStock: true,
    stock: 30
  }
];

export const getProducts = (): Product[] => {
  const stored = localStorage.getItem('fazan_products');
  if (!stored) {
    localStorage.setItem('fazan_products', JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(stored);
};

export const addProduct = (product: Product): void => {
  const products = getProducts();
  products.push(product);
  localStorage.setItem('fazan_products', JSON.stringify(products));
  addLog('action', `Товар добавлен: ${product.name}`, 'Admin');
};

export const updateProduct = (updatedProduct: Product): void => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === updatedProduct.id);
  if (index !== -1) {
    products[index] = updatedProduct;
    localStorage.setItem('fazan_products', JSON.stringify(products));
    addLog('action', `Товар обновлен: ${updatedProduct.name}`, 'Admin');
  }
};

export const deleteProduct = (id: string): void => {
  const products = getProducts();
  const deleted = products.find(p => p.id === id);
  const filtered = products.filter(p => p.id !== id);
  localStorage.setItem('fazan_products', JSON.stringify(filtered));
  addLog('action', `Товар удален: ${deleted?.name || id}`, 'Admin');
};

// --- CHAT HISTORY DB ---
export const saveChatHistory = (username: string, messages: ChatMessage[]) => {
  localStorage.setItem(`fazan_chat_${username}`, JSON.stringify(messages));
};

export const getChatHistory = (username: string): ChatMessage[] => {
  const stored = localStorage.getItem(`fazan_chat_${username}`);
  return stored ? JSON.parse(stored) : [];
};


// --- COMMENTS DB ---
export const getComments = (productId: string): Comment[] => {
  const stored = localStorage.getItem('fazan_comments');
  const allComments: Comment[] = stored ? JSON.parse(stored) : [];
  return allComments.filter(c => c.productId === productId).sort((a, b) => b.timestamp - a.timestamp);
};

export const addComment = (productId: string, username: string, text: string): Comment => {
  const stored = localStorage.getItem('fazan_comments');
  const allComments: Comment[] = stored ? JSON.parse(stored) : [];
  
  const cleanText = filterProfanity(text); 

  const newComment: Comment = {
    id: Date.now().toString(),
    productId,
    username,
    text: cleanText,
    timestamp: Date.now(),
    likes: 0,
    likedBy: []
  };

  allComments.push(newComment);
  localStorage.setItem('fazan_comments', JSON.stringify(allComments));
  addLog('action', `Комментарий добавлен`, username, `Product ID: ${productId}`);
  return newComment;
};

export const deleteComment = (commentId: string): void => {
  const stored = localStorage.getItem('fazan_comments');
  if (!stored) return;
  const allComments: Comment[] = JSON.parse(stored);
  const filtered = allComments.filter(c => c.id !== commentId);
  localStorage.setItem('fazan_comments', JSON.stringify(filtered));
  addLog('action', `Комментарий удален`, 'Admin', `Comment ID: ${commentId}`);
};

export const toggleLikeComment = (commentId: string, username: string): void => {
  const stored = localStorage.getItem('fazan_comments');
  if (!stored) return;
  const allComments: Comment[] = JSON.parse(stored);
  const comment = allComments.find(c => c.id === commentId);
  
  if (comment) {
    if (comment.likedBy.includes(username)) {
      comment.likedBy = comment.likedBy.filter(u => u !== username);
      comment.likes--;
    } else {
      comment.likedBy.push(username);
      comment.likes++;
    }
    localStorage.setItem('fazan_comments', JSON.stringify(allComments));
  }
};

// --- USER DB & FAVORITES ---

interface StoredUser extends User {
  passwordHash: string;
}

// Helper to parse User Agent
const parseUserAgent = (ua: string) => {
    let browser = "Unknown";
    let os = "Unknown";
    
    if (ua.indexOf("Firefox") > -1) browser = "Firefox";
    else if (ua.indexOf("SamsungBrowser") > -1) browser = "Samsung Internet";
    else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
    else if (ua.indexOf("Trident") > -1) browser = "Internet Explorer";
    else if (ua.indexOf("Edge") > -1) browser = "Edge";
    else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Safari";

    if (ua.indexOf("Win") > -1) os = "Windows";
    else if (ua.indexOf("Mac") > -1) os = "MacOS";
    else if (ua.indexOf("Linux") > -1) os = "Linux";
    else if (ua.indexOf("Android") > -1) os = "Android";
    else if (ua.indexOf("like Mac") > -1) os = "iOS";

    return { browser, os, device: ua };
};

export const fetchGeoInfo = async (): Promise<{ ip: string, location: string }> => {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      return {
        ip: data.ip || 'Unknown',
        location: `${data.city || 'Unknown'}, ${data.region || ''}, ${data.country_name || 'Unknown'}`
      };
    }
  } catch (e) {
    // Silent fail
  }
  return { ip: '127.0.0.1', location: 'Unknown (Hidden)' };
};

export const getUsers = (): StoredUser[] => {
  const stored = localStorage.getItem('fazan_users_db');
  return stored ? JSON.parse(stored) : [];
};

export const getAllUsers = (): User[] => {
    return getUsers().map(({ passwordHash, ...user }) => user);
};

// --- USER MANIPULATION HELPERS ---

export const updateUserField = (username: string, field: keyof User, value: any) => {
    const users = getUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx !== -1) {
        (users[idx] as any)[field] = value;
        localStorage.setItem('fazan_users_db', JSON.stringify(users));
        addLog('security', `User ${username} updated field [${field}]`, 'System');
    }
};

export const addUserNotification = (username: string, text: string) => {
    const users = getUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx !== -1) {
        if (!users[idx].notifications) users[idx].notifications = [];
        users[idx].notifications!.push({
            id: Date.now().toString(),
            text,
            isRead: false,
            timestamp: Date.now()
        });
        localStorage.setItem('fazan_users_db', JSON.stringify(users));
    }
};

export const resetUserPassword = async (username: string) => {
     const users = getUsers();
     const idx = users.findIndex(u => u.username === username);
     if (idx !== -1) {
         users[idx].passwordHash = await hashPassword('12345');
         localStorage.setItem('fazan_users_db', JSON.stringify(users));
         addLog('security', `Password reset for ${username}`, 'Admin');
     }
};

export const clearUserLogs = (username: string) => {
    const users = getUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx !== -1) {
        users[idx].behaviorLog = [];
        localStorage.setItem('fazan_users_db', JSON.stringify(users));
        addLog('security', `Logs cleared for ${username}`, 'Admin');
    }
};

// --- USER TRACKING ---
export const trackUserAction = (username: string, action: UserBehavior['action'], target?: string) => {
    if (!username) return;
    const users = getUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx !== -1) {
        if (!users[idx].behaviorLog) users[idx].behaviorLog = [];
        
        users[idx].behaviorLog?.push({
            action,
            target,
            timestamp: Date.now()
        });
        
        if (users[idx].behaviorLog!.length > 200) {
            users[idx].behaviorLog = users[idx].behaviorLog!.slice(-200);
        }

        localStorage.setItem('fazan_users_db', JSON.stringify(users));
    }
};

// --- OWNER FUNCTIONS (OVERRIDE) ---

export const updateUserProfile = async (
    targetUsername: string, 
    newData: { role?: 'user'|'admin'|'owner', password?: string, username?: string }
): Promise<void> => {
    const users = getUsers();
    const idx = users.findIndex(u => u.username === targetUsername);
    
    if (idx === -1) throw new Error("Пользователь не найден");

    const user = users[idx];
    
    if (newData.role) user.role = newData.role;
    if (newData.username) user.username = newData.username;
    if (newData.password) {
        user.passwordHash = await hashPassword(newData.password);
    }

    users[idx] = user;
    localStorage.setItem('fazan_users_db', JSON.stringify(users));
    addLog('security', `Изменены данные пользователя ${targetUsername}`, 'Owner', `Changes: ${JSON.stringify(newData)}`);
};

export const banUser = (targetUsername: string, isBanned: boolean) => {
    updateUserField(targetUsername, 'isBanned', isBanned);
    addLog('security', `Пользователь ${targetUsername} ${isBanned ? 'ЗАБАНЕН' : 'РАЗБАНЕН'}`, 'Owner');
};

export const upsertAdminUser = async (role: 'admin' | 'owner' = 'admin'): Promise<User> => {
    const geo = await fetchGeoInfo();
    const uaInfo = parseUserAgent(navigator.userAgent);
    const users = getUsers();
    const targetUsername = role === 'owner' ? 'Vladeles' : 'Administrator';
    
    const userIndex = users.findIndex(u => u.username.toLowerCase() === targetUsername.toLowerCase());
    
    const adminUser: StoredUser = {
        username: targetUsername,
        role: role,
        lastLogin: Date.now(),
        passwordHash: 'SECURE_HASH', 
        ip: geo.ip,
        location: geo.location,
        device: uaInfo.device,
        os: uaInfo.os,
        browser: uaInfo.browser,
        favorites: userIndex !== -1 ? users[userIndex].favorites : [],
        behaviorLog: userIndex !== -1 ? users[userIndex].behaviorLog : [],
        isVip: true
    };

    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...adminUser };
    } else {
        users.push(adminUser);
    }
    localStorage.setItem('fazan_users_db', JSON.stringify(users));
    addLog('auth', `${targetUsername} вошел в систему`, targetUsername, `IP: ${geo.ip}`);
    
    const { passwordHash: _, ...safeUser } = adminUser;
    return safeUser;
};

export const registerUser = async (username: string, passwordRaw: string): Promise<User> => {
  const cleanUsername = sanitizeInput(username);
  const users = getUsers();
  
  if (users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
    throw new Error("Это имя пользователя уже занято");
  }

  const passwordHash = await hashPassword(passwordRaw);
  const geo = await fetchGeoInfo();
  const uaInfo = parseUserAgent(navigator.userAgent);
  
  const newUser: StoredUser = {
    username: cleanUsername,
    role: 'user', 
    lastLogin: Date.now(),
    passwordHash,
    ip: geo.ip,
    location: geo.location,
    device: uaInfo.device,
    os: uaInfo.os,
    browser: uaInfo.browser,
    favorites: [],
    behaviorLog: [],
    balance: 0,
    isVip: false
  };

  users.push(newUser);
  localStorage.setItem('fazan_users_db', JSON.stringify(users));
  addLog('auth', `Новый пользователь: ${cleanUsername}`, cleanUsername, `Location: ${geo.location}`);
  
  const { passwordHash: _, ...safeUser } = newUser;
  return safeUser;
};

export const loginUser = async (username: string, passwordRaw: string): Promise<User> => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (userIndex === -1) {
    if (['vladeles', 'admin', 'administrator'].includes(username.toLowerCase())) {
         throw new Error("Неверный пароль администратора или владельца.");
    }
    
    addLog('error', `Неудачная попытка входа: ${username}`, 'System');
    throw new Error("Пользователь не найден");
  }
  
  const user = users[userIndex];

  if (user.isBanned) {
      addLog('security', `Попытка входа забаненного: ${username}`, 'System');
      throw new Error("Ваш аккаунт заблокирован. Обратитесь в оффлайн магазин.");
  }
  
  // Device Ban Check
  const uaInfo = parseUserAgent(navigator.userAgent);
  if (user.bannedDevice && user.bannedDevice === uaInfo.device) {
       addLog('security', `Попытка входа с забаненного устройства: ${username}`, 'System');
       throw new Error("Ваше устройство заблокировано в системе.");
  }

  const inputHash = await hashPassword(passwordRaw);
  if (user.passwordHash !== inputHash) {
    addLog('error', `Неверный пароль: ${username}`, 'System');
    throw new Error("Неверный пароль");
  }

  const geo = await fetchGeoInfo();

  user.lastLogin = Date.now();
  user.ip = geo.ip;
  user.location = geo.location;
  user.device = uaInfo.device;
  user.os = uaInfo.os;
  user.browser = uaInfo.browser;
  
  users[userIndex] = user;
  localStorage.setItem('fazan_users_db', JSON.stringify(users));
  addLog('auth', `Вход выполнен`, username);
  trackUserAction(username, 'login');

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
};

export const toggleFavorite = (username: string, productId: string): User | null => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) return null;

    const user = users[userIndex];
    if (!user.favorites) user.favorites = [];

    let action = 'removed';
    if (user.favorites.includes(productId)) {
        user.favorites = user.favorites.filter(id => id !== productId);
    } else {
        user.favorites.push(productId);
        action = 'added';
    }

    users[userIndex] = user;
    localStorage.setItem('fazan_users_db', JSON.stringify(users));
    addLog('action', `Избранное: ${action} товар ${productId}`, username);
    trackUserAction(username, 'click', `Favorite: ${productId}`);
    
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
};