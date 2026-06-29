import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Globe, MoreVertical, Bell, Shield, LogOut, Settings, User, HelpCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function TopMenu() {
  const navigate = useNavigate();
  const { theme, toggleTheme, user, logout, unreadCount } = useStore();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowLang(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSearch && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showSearch]);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowMenu(false);
  };

  return (
    <header className="shrink-0 h-14 glass-header z-40 flex items-center px-4 gap-3">
      {/* Search Bar */}
      <div className="flex-1 relative">
        <div
          className={`flex items-center bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl h-10 px-3 transition-all ${showSearch ? 'ring-2 ring-[#007AFF]' : ''}`}
          onClick={() => setShowSearch(true)}
        >
          <Search size={18} className="text-[#8E8E93] shrink-0" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            onBlur={() => { if (!searchQuery) setShowSearch(false); }}
            className="bg-transparent border-none outline-none text-[15px] ml-2 w-full placeholder:text-[#8E8E93] text-[#1C1C1E] dark:text-white"
          />
        </div>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-colors active:scale-95"
      >
        {theme === 'dark' ? <Sun size={20} className="text-[#8E8E93]" /> : <Moon size={20} className="text-[#8E8E93]" />}
      </button>

      {/* Notifications */}
      <button
        onClick={() => navigate('/notifications')}
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-colors active:scale-95 relative"
      >
        <Bell size={20} className="text-[#8E8E93]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF3B30] rounded-full" />
        )}
      </button>

      {/* Overflow Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-colors active:scale-95"
        >
          <MoreVertical size={20} className="text-[#8E8E93]" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-12 w-52 bg-white dark:bg-[#2C2C2E] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 fade-in">
            <button
              onClick={() => { navigate('/profile'); setShowMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[15px] text-[#1C1C1E] dark:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] transition-colors"
            >
              <User size={18} className="text-[#8E8E93]" />
              Profile
            </button>
            <button
              onClick={() => { navigate('/profile/edit'); setShowMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[15px] text-[#1C1C1E] dark:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] transition-colors"
            >
              <Settings size={18} className="text-[#8E8E93]" />
              Settings
            </button>
            <div className="relative">
              <button
                onClick={() => setShowLang(!showLang)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[15px] text-[#1C1C1E] dark:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] transition-colors"
              >
                <Globe size={18} className="text-[#8E8E93]" />
                Language
              </button>
              {showLang && (
                <div className="absolute right-full top-0 mr-1 w-28 bg-white dark:bg-[#2C2C2E] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                  {(['en', 'ps', 'fa'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => { useStore.getState().setLanguage(lang); setShowLang(false); setShowMenu(false); }}
                      className="w-full px-4 py-2 text-[14px] text-left text-[#1C1C1E] dark:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] uppercase"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => { setShowMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[15px] text-[#1C1C1E] dark:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] transition-colors"
            >
              <HelpCircle size={18} className="text-[#8E8E93]" />
              Support
            </button>
            {user?.isAdmin ? (
              <button
                onClick={() => { navigate('/admin'); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[15px] text-[#007AFF] hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] transition-colors"
              >
                <Shield size={18} className="text-[#007AFF]" />
                Admin Panel
              </button>
            ) : null}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[15px] text-[#FF3B30] hover:bg-[#FFF5F5] dark:hover:bg-[#3A1A1A] transition-colors"
              >
                <LogOut size={18} className="text-[#FF3B30]" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
