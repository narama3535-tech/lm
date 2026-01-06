import React, { useState, useEffect, useRef } from 'react';
import { WarningBanner } from './components/WarningBanner';
import { Navbar } from './components/Navbar';
import { Product, User, ViewState, Comment, ChatMessage, LogEntry } from './types';
import { getProducts, addProduct, deleteProduct, updateProduct, registerUser, loginUser, getComments, addComment, deleteComment, toggleLikeComment, getAllUsers, toggleFavorite, saveChatHistory, getChatHistory, upsertAdminUser, fetchGeoInfo, addLog, getLogs, updateUserProfile, isLockdownMode, setLockdownMode, trackUserAction, banUser, setGlobalAnnouncement, getGlobalAnnouncement, updateUserField, addUserNotification, resetUserPassword, clearUserLogs } from './services/db';
import { validateAdminPassword } from './services/security';
import { generateProductImage, searchProductByImage, fileToBase64, extractTelegramImage, getAiAdvice, generateAdminReport, analyzeUserProfile } from './services/ai';
import { Search, Lock, Plus, Trash2, MapPin, X, Loader2, Info, ShieldCheck, Camera, Edit2, Wand2, Download, Sparkles, UploadCloud, MessageCircle, Bot, Heart, Send, Snowflake, Users, Package, AlertCircle, Terminal, ArrowLeft, ShieldAlert, Command, Ban, Fingerprint, Eye, Crown, Ghost, Coins, LogOut, Key, Mail, Database, Smartphone, Activity, LayoutDashboard, Settings, Image as ImageIcon, LogIn, ExternalLink, Home, Menu } from 'lucide-react';

// --- SANTA COMPONENT ---
const SantaBackground = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="santa-wrapper absolute bottom-10 left-[-200px] opacity-40 blur-[3px] animate-santa-jump">
             <img src="https://cdn-icons-png.flaticon.com/512/3799/3799988.png" className="w-48 h-48 drop-shadow-xl" alt="Santa" />
        </div>
        <style>{`
            @keyframes santaJump {
                0% { transform: translateX(0) translateY(0); }
                25% { transform: translateX(25vw) translateY(-100px) rotate(10deg); }
                50% { transform: translateX(50vw) translateY(0) rotate(0deg); }
                75% { transform: translateX(75vw) translateY(-80px) rotate(-10deg); }
                100% { transform: translateX(120vw) translateY(0); }
            }
            .animate-santa-jump {
                animation: santaJump 15s linear infinite;
            }
        `}</style>
    </div>
);

const App: React.FC = () => {
  // --- STATE ---
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLockdown, setIsLockdown] = useState(false);
  const [globalMsg, setGlobalMsg] = useState<string | null>(null);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Auth
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authInput, setAuthInput] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Admin & Owner
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditingOpen, setIsEditingOpen] = useState(false);
  const [productForm, setProductForm] = useState<Partial<Product>>({ category: 'liquid', inStock: true, stock: 0 });
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const adminFileInputRef = useRef<HTMLInputElement>(null);
  const [adminModule, setAdminModule] = useState<'dashboard' | 'products' | 'users' | 'logs' | 'admins' | 'ai_tools' | 'settings'>('dashboard');
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const [selectedAdminUser, setSelectedAdminUser] = useState<User | null>(null);
  const [isDeepTraceOpen, setIsDeepTraceOpen] = useState(false);
  const [adminAnnouncementText, setAdminAnnouncementText] = useState('');
  const [isWpMenuCollapsed, setIsWpMenuCollapsed] = useState(false);

  // Owner User Edit
  const [userEditForm, setUserEditForm] = useState<{username?: string, password?: string, role?: 'user'|'admin'|'owner'}>({});
  const [isUserEditOpen, setIsUserEditOpen] = useState(false);
  const [userAiProfile, setUserAiProfile] = useState<string | null>(null);
  const [isAnalyzingUser, setIsAnalyzingUser] = useState(false);

  // AI Admin
  const [adminAiQuery, setAdminAiQuery] = useState('');
  const [adminAiResponse, setAdminAiResponse] = useState('');
  const [isAdminAiThinking, setIsAdminAiThinking] = useState(false);

  // AI Advisor (Chat Mode)
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [advisorQuery, setAdvisorQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAdvisorThinking, setIsAdvisorThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Product Details & Comments
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  // Visual Search & UI
  const [isVisualSearching, setIsVisualSearching] = useState(false);
  const [visualSearchError, setVisualSearchError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);

  // --- INIT ---
  useEffect(() => {
    try {
        setProducts(getProducts());
        const savedUser = localStorage.getItem('fazan_user');
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }
        setIsLockdown(isLockdownMode());
        setGlobalMsg(getGlobalAnnouncement());
    } catch (e) {
        console.error("Initialization Error:", e);
    }
  }, []);

  useEffect(() => {
    if (isLockdown && currentUser?.role !== 'owner') {
        setView(ViewState.LOCKDOWN);
    } else if (view === ViewState.LOCKDOWN && (!isLockdown || currentUser?.role === 'owner')) {
        setView(ViewState.HOME);
    }
  }, [isLockdown, currentUser, view]);

  // Tracking Search
  useEffect(() => {
      if (searchTerm && currentUser) {
          const timeout = setTimeout(() => {
              trackUserAction(currentUser.username, 'search', searchTerm);
          }, 1000); // Debounce
          return () => clearTimeout(timeout);
      }
  }, [searchTerm, currentUser]);

  useEffect(() => {
    if (selectedProduct) {
      setComments(getComments(selectedProduct.id));
      if (currentUser) {
          trackUserAction(currentUser.username, 'view_product', selectedProduct.name);
      }
    }
  }, [selectedProduct, currentUser]);

  useEffect(() => {
    // Admin Data Refresh
    if (view === ViewState.ADMIN) {
        if (adminModule === 'users' || adminModule === 'admins') setAdminUsers(getAllUsers());
        if (adminModule === 'logs') setSystemLogs(getLogs());
    }
  }, [view, adminModule, selectedAdminUser]); // Refresh when user changes

  // Scroll Tracking
  useEffect(() => {
      const handleScroll = () => {
          if (parallaxRef.current) {
            const scrolled = window.scrollY;
            parallaxRef.current.style.transform = `translateY(${scrolled * 0.4}px)`;
            parallaxRef.current.style.opacity = `${Math.max(0, 1 - scrolled / 700)}`;
          }
      };
      window.addEventListener('scroll', handleScroll);
      return () => {
          window.removeEventListener('scroll', handleScroll);
      };
  }, [currentUser]);

  // Chat History Load/Save
  useEffect(() => {
    if (isAdvisorOpen && currentUser) {
        const history = getChatHistory(currentUser.username);
        setChatHistory(history);
        trackUserAction(currentUser.username, 'click', 'Open AI Advisor');
    }
  }, [isAdvisorOpen, currentUser]);

  useEffect(() => {
    if (isAdvisorOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isAdvisorOpen, isAdvisorThinking]);

  // --- HANDLERS ---

  const handleToggleLockdown = () => {
      const newState = !isLockdown;
      setIsLockdown(newState);
      setLockdownMode(newState);
  };

  const handleSetAnnouncement = () => {
      setGlobalAnnouncement(adminAnnouncementText);
      setGlobalMsg(adminAnnouncementText);
      alert("Объявление обновлено");
  };

  const handleKillSession = () => {
     if(window.confirm("Вы уверены? Это разлогинит вас.")) {
         localStorage.removeItem('fazan_user');
         window.location.reload();
     }
  };
  
  const openAdminEdit = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setProductForm({ ...product });
    } else {
      setEditingId(null);
      setProductForm({ category: 'liquid', inStock: true, stock: 0 });
    }
    setIsEditingOpen(true);
  };

  const handleUpdateUser = async () => {
      if (!selectedAdminUser) return;
      try {
          await updateUserProfile(selectedAdminUser.username, userEditForm);
          setAdminUsers(getAllUsers());
          setIsUserEditOpen(false);
          addLog('security', `Admin override performed on ${selectedAdminUser.username}`, currentUser?.username);
          alert("Данные пользователя обновлены.");
      } catch (e: any) {
          alert(e.message);
      }
  };

  const handleBanUser = () => {
      if (!selectedAdminUser) return;
      const newState = !selectedAdminUser.isBanned;
      banUser(selectedAdminUser.username, newState);
      setSelectedAdminUser({ ...selectedAdminUser, isBanned: newState });
  };

  const handleAnalyzeUser = async () => {
      if(!selectedAdminUser) return;
      setIsAnalyzingUser(true);
      setUserAiProfile(null);
      try {
          const profile = await analyzeUserProfile(selectedAdminUser);
          setUserAiProfile(profile);
      } catch {
          setUserAiProfile("Failed to generate dossier.");
      } finally {
          setIsAnalyzingUser(false);
      }
  };

  // --- 10 NEW ADMIN FUNCTIONS HANDLERS ---

  const handleMakeVip = () => {
      if(!selectedAdminUser) return;
      const newVal = !selectedAdminUser.isVip;
      updateUserField(selectedAdminUser.username, 'isVip', newVal);
      setSelectedAdminUser({...selectedAdminUser, isVip: newVal});
      alert(`User VIP status: ${newVal}`);
  };

  const handleShadowBan = () => {
      if(!selectedAdminUser) return;
      const newVal = !selectedAdminUser.isShadowBanned;
      updateUserField(selectedAdminUser.username, 'isShadowBanned', newVal);
      setSelectedAdminUser({...selectedAdminUser, isShadowBanned: newVal});
      alert(`Shadow Ban ${newVal ? 'ACTIVATED' : 'DEACTIVATED'}`);
  };

  const handleAddBalance = () => {
      if(!selectedAdminUser) return;
      const amount = prompt("Сколько начислить?");
      if(amount) {
          const newBal = (selectedAdminUser.balance || 0) + Number(amount);
          updateUserField(selectedAdminUser.username, 'balance', newBal);
          setSelectedAdminUser({...selectedAdminUser, balance: newBal});
          addLog('action', `Added ${amount} credits to ${selectedAdminUser.username}`, 'Admin');
      }
  };

  const handleForceLogout = () => {
       if(!selectedAdminUser) return;
       updateUserField(selectedAdminUser.username, 'lastLogin', 0); // Invalidating logic simulated
       alert("User session invalidated. They will be logged out on next action.");
  };

  const handleResetPass = async () => {
      if(!selectedAdminUser || !window.confirm("Сбросить пароль на '12345'?")) return;
      await resetUserPassword(selectedAdminUser.username);
      alert("Пароль сброшен на 12345");
  };

  const handleSendSystemMsg = () => {
      if(!selectedAdminUser) return;
      const msg = prompt("Текст сообщения:");
      if(msg) {
          addUserNotification(selectedAdminUser.username, msg);
          alert("Сообщение отправлено.");
      }
  };

  const handleExportData = () => {
      if(!selectedAdminUser) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedAdminUser, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${selectedAdminUser.username}_dossier.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleClearLogs = () => {
      if(!selectedAdminUser || !window.confirm("Очистить логи пользователя?")) return;
      clearUserLogs(selectedAdminUser.username);
      setSelectedAdminUser({...selectedAdminUser, behaviorLog: []});
      alert("Логи очищены.");
  };

  const handleBlockDevice = () => {
      if(!selectedAdminUser?.device) return alert("No device info");
      updateUserField(selectedAdminUser.username, 'bannedDevice', selectedAdminUser.device);
      alert(`Device ${selectedAdminUser.device} blocked.`);
  };

  const handleLiveWatch = () => {
      alert("Connecting to live session stream... (Simulated)");
      setIsDeepTraceOpen(true);
  };

  // --- END NEW HANDLERS ---

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); 
      let user: User;
      if (authMode === 'login') {
        const adminCheck = await validateAdminPassword(authInput.password);
        if (adminCheck) {
            const requiredName = adminCheck === 'owner' ? 'vladeles' : 'admin';
            if (authInput.username.toLowerCase() !== requiredName) {
                throw new Error("Неверное имя пользователя для администратора");
            }
           user = await upsertAdminUser(adminCheck);
        } else {
           user = await loginUser(authInput.username, authInput.password);
        }
      } else {
        user = await registerUser(authInput.username, authInput.password);
      }
      setCurrentUser(user);
      localStorage.setItem('fazan_user', JSON.stringify(user));
      setView(user.role === 'admin' || user.role === 'owner' ? ViewState.ADMIN : ViewState.HOME);
      setAdminModule('dashboard');
    } catch (err: any) {
      setAuthError(err.message || 'Ошибка авторизации.');
    } finally {
      setIsLoading(false);
      setAuthInput({ username: '', password: '' });
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setTimeout(async () => {
      try {
        const username = "GoogleUser_" + Math.floor(Math.random() * 1000);
        const geo = await fetchGeoInfo();
        const user: User = { 
            username: username, 
            role: 'user', 
            lastLogin: Date.now(),
            ip: geo.ip,
            location: geo.location,
            favorites: []
        };
        setCurrentUser(user);
        localStorage.setItem('fazan_user', JSON.stringify(user));
        addLog('auth', `Google Login: ${username}`, username);
        trackUserAction(username, 'login');
        setView(ViewState.HOME);
      } finally {
        setIsLoading(false);
      }
    }, 1500);
  };

  const handleToggleFavorite = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!currentUser) {
        alert("Войдите, чтобы добавлять в избранное");
        return;
    }
    const updatedUser = toggleFavorite(currentUser.username, productId);
    if (updatedUser) {
        setCurrentUser(updatedUser);
        localStorage.setItem('fazan_user', JSON.stringify(updatedUser));
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;
    const finalImage = productForm.image || `https://picsum.photos/seed/${Date.now()}/400/400`;
    const productData: Product = {
        id: editingId || Date.now().toString(),
        name: productForm.name!,
        description: productForm.description || '',
        price: Number(productForm.price),
        category: productForm.category as any || 'liquid',
        image: finalImage,
        inStock: (productForm.stock || 0) > 0,
        stock: Number(productForm.stock) || 0
    };
    if (editingId) updateProduct(productData);
    else addProduct(productData);
    setProducts(getProducts());
    setIsEditingOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар навсегда?')) {
      deleteProduct(id);
      setProducts(getProducts());
    }
  };

  const handleVisualSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsVisualSearching(true);
    setVisualSearchError(null);
    if (currentUser) trackUserAction(currentUser.username, 'search', 'Visual Search');

    let found = false;

    const timeoutId = setTimeout(() => {
        if (!found) {
            setVisualSearchError("Не удалось найти товар");
            setTimeout(() => setVisualSearchError(null), 5000); 
        }
    }, 10000);

    try {
      const fullBase64 = await fileToBase64(e.target.files[0]);
      const base64Content = fullBase64.split(',')[1];
      const id = await searchProductByImage(base64Content, products);
      
      found = true; 
      clearTimeout(timeoutId);

      if (id) {
        const productFound = products.find(p => p.id === id);
        if (productFound) {
            setSelectedProduct(productFound);
            addLog('action', `Визуальный поиск успешен`, currentUser?.username || 'Guest', `Found: ${productFound.name}`);
        } else {
             setVisualSearchError("Товар не найден в каталоге");
             setTimeout(() => setVisualSearchError(null), 5000);
        }
      } else {
        setVisualSearchError("Не удалось найти товар");
        setTimeout(() => setVisualSearchError(null), 5000);
      }
    } catch { 
        found = true;
        setVisualSearchError("Ошибка обработки фото");
        setTimeout(() => setVisualSearchError(null), 5000);
    }
    finally { 
        setIsVisualSearching(false); 
        if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const handleSendMessage = async () => {
    if (!advisorQuery.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: advisorQuery, timestamp: Date.now() };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    
    setAdvisorQuery('');
    setIsAdvisorThinking(true);

    try {
      const advice = await getAiAdvice(userMsg.text, products);
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', text: advice, timestamp: Date.now() };
      const finalHistory = [...newHistory, aiMsg];
      setChatHistory(finalHistory);
      
      if (currentUser) {
          saveChatHistory(currentUser.username, finalHistory);
          trackUserAction(currentUser.username, 'click', 'AI Advisor Message');
      }
    } catch (e) {
      setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: "Ошибка связи с сервером.", timestamp: Date.now() }]);
    } finally {
      setIsAdvisorThinking(false);
    }
  };

  const handleAdminAiAsk = async () => {
      if (!adminAiQuery.trim()) return;
      setIsAdminAiThinking(true);
      try {
          const report = await generateAdminReport(adminAiQuery, systemLogs, getAllUsers());
          setAdminAiResponse(report);
      } catch {
          setAdminAiResponse("Ошибка генерации отчета.");
      } finally {
          setIsAdminAiThinking(false);
      }
  };

  const handleAiGenerateImage = async () => {
    if (!productForm.name) return alert("Введите название");
    setIsAiGenerating(true);
    try {
      const img = await generateProductImage(productForm.name);
      if (img) setProductForm(prev => ({ ...prev, image: img }));
    } catch { alert("Ошибка AI"); }
    finally { setIsAiGenerating(false); }
  };

  const handleTelegramImport = async () => {
    if (!productForm.image?.includes('t.me/')) return alert('Нужна ссылка t.me/...');
    setIsAiGenerating(true);
    try {
        const extracted = await extractTelegramImage(productForm.image);
        if (extracted) setProductForm(prev => ({ ...prev, image: extracted }));
        else alert('Фото не найдено');
    } catch { alert('Ошибка'); } 
    finally { setIsAiGenerating(false); }
  };

  const handleAdminImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const b64 = await fileToBase64(e.target.files[0]);
      setProductForm({ ...productForm, image: b64 });
    }
  };

  const handleAddComment = () => {
    if (!selectedProduct || !currentUser || !newCommentText.trim()) return;
    addComment(selectedProduct.id, currentUser.username, newCommentText);
    setComments(getComments(selectedProduct.id));
    setNewCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('Удалить этот комментарий?')) {
        deleteComment(commentId);
        if (selectedProduct) {
            setComments(getComments(selectedProduct.id));
        }
    }
  };

  // --- RENDERERS ---

  const renderAdminModal = () => (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-lg p-6 shadow-2xl relative text-gray-900 max-h-[90vh] overflow-y-auto">
         <button onClick={() => setIsEditingOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600"><X size={18} /></button>
         <h2 className="text-2xl font-bold mb-6 text-gray-800">{editingId ? 'Редактировать товар' : 'Добавить новый товар'}</h2>
         
         <form onSubmit={handleSaveProduct} className="space-y-4">
            <div>
               <label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Название</label>
               <input 
                 className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 transition-colors"
                 value={productForm.name || ''}
                 onChange={e => setProductForm({...productForm, name: e.target.value})}
                 required
               />
            </div>
            
             <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Цена (₽)</label>
                   <input 
                     type="number"
                     className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 transition-colors"
                     value={productForm.price || ''}
                     onChange={e => setProductForm({...productForm, price: Number(e.target.value)})}
                     required
                   />
                 </div>
                 <div className="flex-1">
                    <label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Категория</label>
                    <select 
                        className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 transition-colors appearance-none"
                        value={productForm.category || 'liquid'}
                        onChange={e => setProductForm({...productForm, category: e.target.value as any})}
                    >
                        <option value="liquid">Жидкость</option>
                        <option value="device">Устройство</option>
                        <option value="pod">Картридж / Одноразка</option>
                        <option value="accessory">Аксессуары</option>
                    </select>
                 </div>
             </div>

             <div>
                <label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Описание</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                  value={productForm.description || ''}
                  onChange={e => setProductForm({...productForm, description: e.target.value})}
                />
             </div>

             <div className="flex gap-4 items-center">
                 <div className="flex-1">
                    <label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Остаток</label>
                    <input 
                         type="number"
                         className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 transition-colors"
                         value={productForm.stock || 0}
                         onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})}
                    />
                 </div>
                 <div className="flex items-center gap-2 pt-5">
                    <input 
                        type="checkbox" 
                        checked={productForm.inStock} 
                        onChange={e => setProductForm({...productForm, inStock: e.target.checked})}
                        className="w-5 h-5 accent-blue-600"
                    />
                    <span className="text-sm">В наличии</span>
                 </div>
             </div>

             {/* Image Section */}
             <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                 <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Изображение</label>
                 <div className="flex gap-2 mb-2">
                     <input 
                         className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-xs"
                         placeholder="Ссылка на фото или t.me/..."
                         value={productForm.image || ''}
                         onChange={e => setProductForm({...productForm, image: e.target.value})}
                     />
                     <button type="button" onClick={() => adminFileInputRef.current?.click()} className="p-2 bg-gray-200 rounded hover:bg-gray-300"><UploadCloud size={16} className="text-gray-600"/></button>
                     <input type="file" ref={adminFileInputRef} className="hidden" onChange={handleAdminImageUpload} />
                 </div>
                 <div className="flex gap-2">
                     <button type="button" onClick={handleAiGenerateImage} disabled={isAiGenerating} className="flex-1 py-2 bg-purple-100 text-purple-600 hover:bg-purple-200 rounded text-xs font-bold flex justify-center items-center gap-1">
                         {isAiGenerating ? <Loader2 className="animate-spin" size={12}/> : <Wand2 size={12}/>} AI Generate
                     </button>
                     <button type="button" onClick={handleTelegramImport} disabled={isAiGenerating} className="flex-1 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded text-xs font-bold flex justify-center items-center gap-1">
                         <Download size={12}/> TG Import
                     </button>
                 </div>
                 {productForm.image && (
                     <div className="mt-2 w-full h-32 rounded border border-gray-200 overflow-hidden bg-white">
                         <img src={productForm.image} className="w-full h-full object-contain" />
                     </div>
                 )}
             </div>

             <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-bold text-sm shadow-md transition-all">
                 {editingId ? 'Обновить' : 'Опубликовать'}
             </button>
         </form>
      </div>
    </div>
  );

  const renderSnow = () => (
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(20)].map((_, i) => (
             <div key={i} className="absolute animate-fall" style={{
                 left: `${Math.random() * 100}%`,
                 top: `-${Math.random() * 20}%`,
                 animationDuration: `${Math.random() * 10 + 10}s`,
                 animationDelay: `${Math.random() * 5}s`,
                 opacity: Math.random() * 0.5 + 0.1
             }}>
                 <Snowflake size={Math.random() * 20 + 10} className="text-white opacity-50" />
             </div>
        ))}
        <style>{`
            @keyframes fall {
                0% { transform: translateY(-10vh) rotate(0deg); }
                100% { transform: translateY(110vh) rotate(360deg); }
            }
            .animate-fall {
                animation-name: fall;
                animation-timing-function: linear;
                animation-iteration-count: infinite;
            }
        `}</style>
      </div>
  );

  const renderUserDetailsModal = () => {
    if (!selectedAdminUser) return null;
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="w-full max-w-2xl bg-[#121212] border border-white/10 rounded-3xl p-6 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto">
                <button onClick={() => { setSelectedAdminUser(null); setIsDeepTraceOpen(false); setIsUserEditOpen(false); setUserAiProfile(null); }} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={18} /></button>
                
                {/* Header */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-bold mb-4 relative">
                        {selectedAdminUser.username[0].toUpperCase()}
                        {selectedAdminUser.isBanned && <div className="absolute inset-0 bg-red-500/80 rounded-full flex items-center justify-center"><Ban className="text-white"/></div>}
                        {selectedAdminUser.isVip && <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1 text-black shadow-lg shadow-yellow-500/50"><Crown size={14}/></div>}
                    </div>
                    <h3 className="text-2xl font-bold flex gap-2 items-center">
                        {selectedAdminUser.username}
                        {selectedAdminUser.isShadowBanned && <Ghost size={16} className="text-gray-500"/>}
                    </h3>
                    <div className="flex gap-2 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedAdminUser.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : (selectedAdminUser.role === 'owner' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-300')}`}>
                            {selectedAdminUser.role}
                        </span>
                        {currentUser?.role === 'owner' && (
                           <>
                            <button onClick={() => setIsUserEditOpen(!isUserEditOpen)} className="p-1 rounded bg-white/10 hover:bg-white/20"><Edit2 size={12}/></button>
                            <button onClick={handleBanUser} className={`p-1 rounded hover:opacity-80 ${selectedAdminUser.isBanned ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                {selectedAdminUser.isBanned ? "UNBAN" : "BAN"}
                            </button>
                           </>
                        )}
                    </div>
                </div>

                {/* 10 ADMIN ACTIONS GRID */}
                {currentUser?.role === 'owner' && (
                    <div className="mb-6">
                        <h4 className="font-bold text-xs uppercase tracking-wider opacity-50 mb-3">Control Panel (God Mode)</h4>
                        <div className="grid grid-cols-5 gap-2">
                             <button onClick={handleMakeVip} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 transition-colors" title="Make VIP">
                                <Crown size={18}/> <span className="text-[9px] font-bold">VIP</span>
                             </button>
                             <button onClick={handleShadowBan} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 transition-colors" title="Shadow Ban">
                                <Ghost size={18}/> <span className="text-[9px] font-bold">SHADOW</span>
                             </button>
                             <button onClick={handleAddBalance} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-500 transition-colors" title="Add Balance">
                                <Coins size={18}/> <span className="text-[9px] font-bold">CREDIT</span>
                             </button>
                             <button onClick={handleForceLogout} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors" title="Force Logout">
                                <LogOut size={18}/> <span className="text-[9px] font-bold">KICK</span>
                             </button>
                             <button onClick={handleResetPass} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 transition-colors" title="Reset Pass">
                                <Key size={18}/> <span className="text-[9px] font-bold">RESET</span>
                             </button>
                             <button onClick={handleSendSystemMsg} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 transition-colors" title="System DM">
                                <Mail size={18}/> <span className="text-[9px] font-bold">MSG</span>
                             </button>
                             <button onClick={handleExportData} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 transition-colors" title="Export JSON">
                                <Database size={18}/> <span className="text-[9px] font-bold">DATA</span>
                             </button>
                             <button onClick={handleClearLogs} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 transition-colors" title="Clear Logs">
                                <Trash2 size={18}/> <span className="text-[9px] font-bold">LOGS</span>
                             </button>
                             <button onClick={handleBlockDevice} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-red-900/10 hover:bg-red-900/20 text-red-700 transition-colors" title="Block Device">
                                <Smartphone size={18}/> <span className="text-[9px] font-bold">DEVICE</span>
                             </button>
                             <button onClick={handleLiveWatch} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 transition-colors" title="Live Watch">
                                <Activity size={18}/> <span className="text-[9px] font-bold">LIVE</span>
                             </button>
                        </div>
                    </div>
                )}
                
                {/* AI Profiling Section */}
                <div className="bg-white/5 p-4 rounded-xl">
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                        <Bot size={16} className="text-blue-400"/> AI Dossier
                    </h4>
                    {userAiProfile ? (
                        <div className="text-xs font-mono whitespace-pre-wrap text-gray-300 bg-black/50 p-3 rounded border border-white/5">
                            {userAiProfile}
                        </div>
                    ) : (
                        <button 
                            onClick={handleAnalyzeUser} 
                            disabled={isAnalyzingUser}
                            className="w-full py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded text-xs font-bold flex items-center justify-center gap-2"
                        >
                            {isAnalyzingUser ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>}
                            Generate Profile
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-[#111] text-white font-sans selection:bg-blue-500/30">
      <SantaBackground />
      {renderSnow()}
      
      <WarningBanner />
      <Navbar 
        currentUser={currentUser}
        onOpenAuth={() => { setView(ViewState.LOGIN); setAuthMode('login'); }}
        onLogout={handleKillSession}
        onOpenAdmin={() => setView(ViewState.ADMIN)}
        onGoHome={() => setView(ViewState.HOME)}
        onOpenFavorites={() => setView(ViewState.FAVORITES)}
        onOpenAbout={() => setView(ViewState.ABOUT)}
      />

      {/* Global Announcement */}
      {globalMsg && (
          <div className="bg-blue-600 text-white text-center py-2 px-4 text-sm font-bold shadow-lg relative z-40 mt-[70px]">
              📢 {globalMsg}
          </div>
      )}

      {/* Modals */}
      {isEditingOpen && renderAdminModal()}
      {selectedAdminUser && renderUserDetailsModal()}

      {/* Main Content */}
      <div className={`relative z-10 pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto transition-all duration-500 ${view !== ViewState.HOME ? 'opacity-100' : ''}`}>
        
        {view === ViewState.HOME && (
            <div className="animate-fade-in">
                {/* Hero / Search Section */}
                <div className="flex flex-col items-center mb-12 relative" ref={parallaxRef}>
                    <h1 className="text-4xl md:text-6xl font-black text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 drop-shadow-2xl">
                        FAZAN.CLOUD
                    </h1>
                    
                    <div className="w-full max-w-2xl relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                        <input 
                            type="text" 
                            placeholder="Найти вкус..." 
                            className="w-full bg-black/50 backdrop-blur-xl border border-white/10 rounded-full py-4 pl-12 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all shadow-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-gray-300"
                            title="Поиск по фото"
                        >
                            <Camera size={18} />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleVisualSearch} />
                    </div>

                    {isVisualSearching && (
                        <div className="mt-4 flex items-center gap-2 text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full">
                            <Loader2 className="animate-spin" size={16}/>
                            <span className="text-sm font-bold">Анализируем фото...</span>
                        </div>
                    )}
                    {visualSearchError && (
                        <div className="mt-4 text-red-400 bg-red-500/10 px-4 py-2 rounded-full text-sm font-bold">
                            {visualSearchError}
                        </div>
                    )}

                    {/* Categories */}
                    <div className="flex gap-2 mt-8 overflow-x-auto w-full justify-center pb-2">
                        {['all', 'liquid', 'device', 'pod', 'accessory'].map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${categoryFilter === cat ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                {cat === 'all' ? 'Все' : cat === 'liquid' ? 'Жидкости' : cat === 'device' ? 'Devices' : cat === 'pod' ? 'Pod/Cartridge' : 'Accessory'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products
                        .filter(p => {
                            const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
                            const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
                            return matchSearch && matchCat;
                        })
                        .map(product => (
                        <div key={product.id} onClick={() => setSelectedProduct(product)} className="group bg-white/5 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all cursor-pointer hover:-translate-y-1 relative">
                            <div className="aspect-square bg-black/50 relative overflow-hidden">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                {!product.inStock && (
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                        <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold rounded">SOLD OUT</span>
                                    </div>
                                )}
                                <button 
                                    onClick={(e) => handleToggleFavorite(e, product.id)}
                                    className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur rounded-full hover:bg-red-500/20 transition-colors"
                                >
                                    <Heart 
                                        size={18} 
                                        className={currentUser?.favorites?.includes(product.id) ? "fill-red-500 text-red-500" : "text-white"} 
                                    />
                                </button>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-white mb-1 truncate">{product.name}</h3>
                                <p className="text-gray-400 text-xs line-clamp-2 h-8 mb-3">{product.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-blue-400">{product.price} ₽</span>
                                    <button className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors">
                                        <ArrowLeft size={16} className="rotate-180" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {view === ViewState.ADMIN && currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner') && (
             <div className="animate-fade-in pb-20">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Admin Sidebar */}
                    <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
                        <div className="p-4 bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl border border-white/10 mb-4">
                            <h2 className="font-black text-xl tracking-tighter">ADMIN OS</h2>
                            <p className="text-xs text-gray-400">v3.0.1 • {currentUser.role.toUpperCase()}</p>
                        </div>
                        {[
                            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                            { id: 'products', icon: Package, label: 'Products' },
                            { id: 'users', icon: Users, label: 'Users' },
                            { id: 'logs', icon: Activity, label: 'System Logs' },
                            { id: 'ai_tools', icon: Bot, label: 'AI Intelligence' },
                            { id: 'settings', icon: Settings, label: 'System Config' },
                        ].map(item => (
                            <button 
                                key={item.id}
                                onClick={() => setAdminModule(item.id as any)}
                                className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-all ${adminModule === item.id ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Admin Content */}
                    <div className="flex-1 bg-white/5 rounded-3xl border border-white/5 p-6 min-h-[500px]">
                        {adminModule === 'dashboard' && (
                             <div className="space-y-6">
                                 <h3 className="text-2xl font-bold">Overview</h3>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                     <div className="bg-blue-600/20 p-4 rounded-xl border border-blue-600/30">
                                         <div className="text-blue-400 text-sm font-bold uppercase mb-1">Users</div>
                                         <div className="text-3xl font-black">{adminUsers.length}</div>
                                     </div>
                                     <div className="bg-purple-600/20 p-4 rounded-xl border border-purple-600/30">
                                         <div className="text-purple-400 text-sm font-bold uppercase mb-1">Products</div>
                                         <div className="text-3xl font-black">{products.length}</div>
                                     </div>
                                     <div className="bg-green-600/20 p-4 rounded-xl border border-green-600/30">
                                         <div className="text-green-400 text-sm font-bold uppercase mb-1">Stock Value</div>
                                         <div className="text-3xl font-black">{products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()} ₽</div>
                                     </div>
                                     <div className="bg-red-600/20 p-4 rounded-xl border border-red-600/30">
                                         <div className="text-red-400 text-sm font-bold uppercase mb-1">Logs (24h)</div>
                                         <div className="text-3xl font-black">{systemLogs.length}</div>
                                     </div>
                                 </div>
                                 
                                 <div className="mt-8">
                                     <h4 className="font-bold mb-4">Quick Actions</h4>
                                     <div className="flex gap-4">
                                         <button onClick={() => openAdminEdit()} className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 flex items-center gap-2">
                                             <Plus size={18} /> Add Product
                                         </button>
                                         <button onClick={handleToggleLockdown} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${isLockdown ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}`}>
                                             <Lock size={18} /> {isLockdown ? 'Disable Lockdown' : 'Enable Lockdown'}
                                         </button>
                                     </div>
                                 </div>
                             </div>
                        )}

                        {adminModule === 'products' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold">Inventory</h3>
                                    <button onClick={() => openAdminEdit()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm">+ Add</button>
                                </div>
                                <div className="space-y-2">
                                    {products.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl hover:bg-black/30 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <img src={p.image} className="w-10 h-10 rounded-lg object-cover bg-white/10"/>
                                                <div>
                                                    <div className="font-bold text-sm">{p.name}</div>
                                                    <div className="text-xs text-gray-500">{p.category} • Stock: {p.stock}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openAdminEdit(p)} className="p-2 hover:text-blue-400"><Edit2 size={16}/></button>
                                                <button onClick={() => handleDeleteProduct(p.id)} className="p-2 hover:text-red-400"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {adminModule === 'users' && (
                            <div>
                                <h3 className="text-2xl font-bold mb-6">User Database</h3>
                                <div className="space-y-2">
                                    {adminUsers.map(u => (
                                        <div key={u.username} onClick={() => setSelectedAdminUser(u)} className="cursor-pointer flex items-center justify-between p-3 bg-black/20 rounded-xl hover:bg-black/30 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${u.role === 'admin' ? 'bg-purple-600' : 'bg-gray-700'}`}>
                                                    {u.username[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm flex items-center gap-2">
                                                        {u.username}
                                                        {u.isBanned && <span className="text-[10px] bg-red-500 px-1 rounded">BANNED</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{u.role} • {u.ip}</div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(u.lastLogin).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {adminModule === 'ai_tools' && (
                            <div className="h-full flex flex-col">
                                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><Bot/> AI Intelligence</h3>
                                <div className="flex-1 bg-black/30 rounded-xl p-4 mb-4 overflow-y-auto font-mono text-sm whitespace-pre-wrap text-green-400">
                                    {adminAiResponse || "// AI System Ready. Waiting for query..."}
                                    {isAdminAiThinking && "\n// Processing..."}
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white"
                                        placeholder="Ask about logs, security, or sales..."
                                        value={adminAiQuery}
                                        onChange={e => setAdminAiQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAdminAiAsk()}
                                    />
                                    <button onClick={handleAdminAiAsk} className="px-4 py-2 bg-blue-600 rounded-lg font-bold"><Send size={18}/></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
             </div>
        )}

        {/* Other Views (Login, About, Favorites) simplified for reconstruction */}
        {view === ViewState.LOGIN && (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
                    <h2 className="text-2xl font-bold mb-6 text-center">{authMode === 'login' ? 'Вход' : 'Регистрация'}</h2>
                    {authError && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-sm text-center">{authError}</div>}
                    <form onSubmit={handleAuth} className="space-y-4">
                        <input 
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 outline-none"
                            placeholder="Логин"
                            value={authInput.username}
                            onChange={e => setAuthInput({...authInput, username: e.target.value})}
                        />
                        <input 
                            type="password"
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 outline-none"
                            placeholder="Пароль"
                            value={authInput.password}
                            onChange={e => setAuthInput({...authInput, password: e.target.value})}
                        />
                        <button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold transition-all flex justify-center">
                            {isLoading ? <Loader2 className="animate-spin"/> : (authMode === 'login' ? 'Войти' : 'Создать аккаунт')}
                        </button>
                    </form>
                    <div className="mt-6 text-center text-sm text-gray-400">
                         {authMode === 'login' ? 'Нет аккаунта? ' : 'Есть аккаунт? '}
                         <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-blue-400 font-bold hover:underline">
                             {authMode === 'login' ? 'Регистрация' : 'Войти'}
                         </button>
                    </div>
                    <div className="mt-4 border-t border-white/10 pt-4">
                        <button onClick={handleGoogleLogin} className="w-full bg-white text-black py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-200">
                             <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G"/> Google
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {view === ViewState.FAVORITES && (
            <div>
                <h2 className="text-3xl font-bold mb-6">Избранное</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.filter(p => currentUser?.favorites?.includes(p.id)).map(p => (
                        <div key={p.id} onClick={() => setSelectedProduct(p)} className="bg-white/5 rounded-xl overflow-hidden cursor-pointer">
                            <img src={p.image} className="w-full aspect-square object-cover"/>
                            <div className="p-4">
                                <h4 className="font-bold">{p.name}</h4>
                                <p className="text-blue-400 font-mono">{p.price} ₽</p>
                            </div>
                        </div>
                    ))}
                    {(!currentUser?.favorites || currentUser.favorites.length === 0) && (
                        <div className="col-span-4 text-center py-20 text-gray-500">
                            В избранном пока пусто.
                        </div>
                    )}
                </div>
            </div>
        )}
        
        {view === ViewState.ABOUT && (
            <div className="max-w-2xl mx-auto text-center py-10">
                <h2 className="text-4xl font-bold mb-6">О Нас</h2>
                <p className="text-gray-300 leading-relaxed mb-8">
                    FAZAN.CLOUD — это не просто магазин, это экосистема для любителей пара. 
                    Мы объединяем лучшие девайсы, уникальные жидкости и передовые технологии.
                    Наша цель — предоставить качественный сервис и создать сообщество.
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-white/5 rounded-xl"><h3 className="font-bold text-2xl text-blue-500">5+</h3><span className="text-xs uppercase text-gray-500">Лет на рынке</span></div>
                    <div className="p-4 bg-white/5 rounded-xl"><h3 className="font-bold text-2xl text-purple-500">10k+</h3><span className="text-xs uppercase text-gray-500">Клиентов</span></div>
                    <div className="p-4 bg-white/5 rounded-xl"><h3 className="font-bold text-2xl text-pink-500">100%</h3><span className="text-xs uppercase text-gray-500">Оригинал</span></div>
                </div>
            </div>
        )}
        
        {view === ViewState.LOCKDOWN && (
            <div className="fixed inset-0 z-50 bg-red-950 flex flex-col items-center justify-center p-8 text-center animate-pulse">
                <ShieldAlert size={64} className="text-red-500 mb-6" />
                <h1 className="text-5xl font-black text-red-500 mb-4">LOCKDOWN MODE</h1>
                <p className="text-red-200 text-xl max-w-lg">
                    Магазин временно закрыт администратором по соображениям безопасности или техническим причинам.
                </p>
            </div>
        )}

      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl animate-fade-in">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"><X size={24}/></button>
            <div className="w-full max-w-4xl bg-[#1a1a1a] rounded-3xl overflow-hidden border border-white/10 flex flex-col md:flex-row max-h-[90vh]">
                <div className="w-full md:w-1/2 bg-black/50 relative">
                     <img src={selectedProduct.image} className="w-full h-full object-cover" />
                </div>
                <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">{selectedProduct.category}</span>
                            <h2 className="text-3xl font-black mt-1">{selectedProduct.name}</h2>
                        </div>
                        <div className="text-2xl font-bold">{selectedProduct.price} ₽</div>
                    </div>
                    
                    <p className="text-gray-400 leading-relaxed mb-6 border-b border-white/10 pb-6">
                        {selectedProduct.description}
                    </p>
                    
                    <div className="mb-8">
                         <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${selectedProduct.inStock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm font-medium">{selectedProduct.inStock ? `В наличии: ${selectedProduct.stock} шт.` : 'Нет в наличии'}</span>
                         </div>
                         <button className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                             В Корзину (Demo)
                         </button>
                    </div>
                    
                    {/* Comments Section */}
                    <div className="mt-auto">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><MessageCircle size={18}/> Отзывы</h3>
                        <div className="space-y-4 max-h-[200px] overflow-y-auto mb-4 pr-2 custom-scrollbar">
                            {comments.length === 0 && <p className="text-gray-600 text-sm">Нет отзывов.</p>}
                            {comments.map(c => (
                                <div key={c.id} className="bg-white/5 p-3 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-sm text-blue-300">{c.username}</span>
                                        <span className="text-[10px] text-gray-500">{new Date(c.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-300 mt-1">{c.text}</p>
                                    {(currentUser?.role === 'admin' || currentUser?.role === 'owner') && (
                                        <button onClick={() => handleDeleteComment(c.id)} className="text-[10px] text-red-500 mt-2 hover:underline">Удалить</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {currentUser ? (
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white"
                                    placeholder="Написать отзыв..."
                                    value={newCommentText}
                                    onChange={e => setNewCommentText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                />
                                <button onClick={handleAddComment} className="p-2 bg-blue-600 rounded text-white"><Send size={16}/></button>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 text-center">Войдите, чтобы оставить отзыв.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
      
      {/* AI Advisor Chat Button */}
      <button 
        onClick={() => setIsAdvisorOpen(!isAdvisorOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-40 group"
      >
        <Bot size={28} className="text-white group-hover:rotate-12 transition-transform"/>
      </button>

      {/* AI Advisor Chat Window */}
      {isAdvisorOpen && (
          <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col z-40 h-[500px] animate-fade-in-up">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                      <Bot className="text-blue-400"/>
                      <div>
                          <div className="font-bold text-sm">Fazan AI</div>
                          <div className="text-[10px] text-green-400 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div> Online</div>
                      </div>
                  </div>
                  <button onClick={() => setIsAdvisorOpen(false)}><X size={18} className="text-gray-400 hover:text-white"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {chatHistory.length === 0 && (
                      <div className="text-center text-gray-500 text-sm mt-10">
                          <p>Привет! Я ИИ-консультант.</p>
                          <p className="text-xs mt-2">Спроси меня про вкусы, девайсы или просто поговори о вейпинге.</p>
                      </div>
                  )}
                  {chatHistory.map(msg => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>
                              {msg.text}
                          </div>
                      </div>
                  ))}
                  {isAdvisorThinking && (
                      <div className="flex justify-start">
                          <div className="bg-white/10 p-3 rounded-2xl rounded-bl-none flex gap-1">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                          </div>
                      </div>
                  )}
                  <div ref={chatEndRef}></div>
              </div>
              <div className="p-3 border-t border-white/10 flex gap-2">
                  <input 
                      className="flex-1 bg-black/30 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                      placeholder="Спроси Fazan AI..."
                      value={advisorQuery}
                      onChange={e => setAdvisorQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button onClick={handleSendMessage} disabled={!advisorQuery.trim() || isAdvisorThinking} className="p-2 bg-blue-600 rounded-full text-white disabled:opacity-50 hover:bg-blue-500">
                      <Send size={18} className={advisorQuery.trim() ? "translate-x-0.5" : ""}/>
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};

export default App;