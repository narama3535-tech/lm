import React from 'react';
import { User, LogIn, ShieldCheck, Menu, X, Heart, Info } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  currentUser: UserType | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onGoHome: () => void;
  onOpenFavorites: () => void;
  onOpenAbout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentUser, 
  onOpenAuth, 
  onLogout, 
  onOpenAdmin,
  onGoHome,
  onOpenFavorites,
  onOpenAbout
}) => {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Always Dark Theme Logic
  const navBgClass = isScrolled 
    ? 'bg-black/80 border-white/10' 
    : 'bg-transparent border-transparent';

  const textColorClass = 'text-white'; 

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 border-b backdrop-blur-xl ${navBgClass} py-4`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
        
        {/* Logo */}
        <div 
          onClick={onGoHome}
          className="cursor-pointer flex items-center gap-2 group"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
            F
          </div>
          <span className={`font-bold text-xl tracking-tight transition-colors ${textColorClass}`}>
            FAZAN<span className="opacity-50 font-light">.CLOUD</span>
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <button onClick={onGoHome} className={`text-sm font-medium hover:opacity-70 transition-opacity ${textColorClass}`}>Главная</button>
          <button onClick={onOpenAbout} className={`text-sm font-medium hover:opacity-70 transition-opacity ${textColorClass}`}>О нас</button>
          <a href="https://t.me/fazancloud" target="_blank" rel="noreferrer" className={`text-sm font-medium hover:text-[#229ED9] transition-colors ${textColorClass}`}>Telegram</a>
          
          <div className="h-4 w-px mx-2 bg-white/20"></div>

          {currentUser ? (
            <div className="flex items-center gap-4">
               {/* Favorites Button */}
               <button 
                onClick={onOpenFavorites}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors group"
                title="Избранное"
              >
                <Heart size={20} className="text-white group-hover:text-red-500 transition-colors" />
                {currentUser.favorites?.length > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-black"></span>
                )}
              </button>

              <div className="flex items-center gap-2 text-green-500 text-xs uppercase tracking-wider font-bold bg-green-500/10 px-2 py-1 rounded-lg">
                <ShieldCheck size={14} />
                <span>{currentUser.role === 'owner' ? 'Владелец' : 'Защищено'}</span>
              </div>
              <span className={`text-sm font-medium ${textColorClass}`}>
                {currentUser.username}
              </span>
              {(currentUser.role === 'admin' || currentUser.role === 'owner') && (
                <button 
                  onClick={onOpenAdmin}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all bg-white/10 hover:bg-white/20 text-white"
                >
                  Панель
                </button>
              )}
              <button 
                onClick={onLogout}
                className={`text-sm opacity-60 hover:opacity-100 transition-opacity ${textColorClass}`}
              >
                Выйти
              </button>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5"
            >
              <LogIn size={16} />
              <span>Войти</span>
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className={`md:hidden ${textColorClass}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 border-b p-4 animate-fade-in shadow-2xl bg-black/95 border-white/10 text-white backdrop-blur-xl">
          <div className="flex flex-col space-y-4">
            <button onClick={() => { onGoHome(); setMobileMenuOpen(false); }} className="text-left font-medium p-2 hover:bg-gray-500/10 rounded-lg">Главная</button>
            <button onClick={() => { onOpenAbout(); setMobileMenuOpen(false); }} className="text-left font-medium p-2 hover:bg-gray-500/10 rounded-lg">О нас</button>
            <a href="https://t.me/fazancloud" target="_blank" className="text-left font-medium p-2 hover:bg-gray-500/10 rounded-lg text-blue-500">Telegram Канал</a>
            {currentUser ? (
              <>
                 <button onClick={() => { onOpenFavorites(); setMobileMenuOpen(false); }} className="text-left font-medium p-2 hover:bg-gray-500/10 rounded-lg flex gap-2 items-center"><Heart size={16}/> Избранное ({currentUser.favorites?.length || 0})</button>
                 <div className="p-2 text-green-500 text-sm flex gap-2 items-center font-bold">
                    <ShieldCheck size={16} /> Вход защищен
                 </div>
                 {(currentUser.role === 'admin' || currentUser.role === 'owner') && (
                   <button onClick={() => { onOpenAdmin(); setMobileMenuOpen(false); }} className="text-left p-2 rounded-lg bg-purple-500/10 text-purple-500 font-bold">Админ Панель</button>
                 )}
                 <button onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="text-left text-red-500 p-2 font-medium">Выйти</button>
              </>
            ) : (
              <button onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }} className="text-left text-white bg-blue-600 p-3 rounded-xl font-bold flex justify-center shadow-lg">Войти / Регистрация</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};