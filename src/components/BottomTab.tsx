import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Plus, MessageCircle, User } from 'lucide-react';
import { useStore } from '@/store/useStore';

const tabs = [
  { path: '/', label: 'Home', Icon: Home },
  { path: '/create-post', label: 'Create', Icon: Plus, isCenter: true },
  { path: '/messages', label: 'Messages', Icon: MessageCircle },
  { path: '/profile', label: 'Profile', Icon: User },
];

export function BottomTab() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useStore();
  const currentPath = location.pathname;

  const handleClick = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="shrink-0 h-[72px] bg-white dark:bg-[#1C1C1E] border-t border-gray-200 dark:border-gray-800 z-50 flex items-center justify-around px-4 pb-safe relative">
      {tabs.map((tab) => {
        const isActive = currentPath === tab.path || (tab.path !== '/' && currentPath.startsWith(tab.path));

        if (tab.isCenter) {
          return (
            <button
              key={tab.path}
              onClick={() => handleClick(tab.path)}
              className="relative -mt-6 flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#007AFF] shadow-[0_4px_12px_rgba(0,122,255,0.4)] flex items-center justify-center active:scale-95 transition-transform">
                <tab.Icon size={28} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-medium text-[#8E8E93] mt-0.5">{tab.label}</span>
            </button>
          );
        }

        return (
          <button
            key={tab.path}
            onClick={() => handleClick(tab.path)}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] active:opacity-70 transition-opacity relative"
          >
            <div className="relative">
              <tab.Icon
                size={24}
                className={isActive ? 'text-[#007AFF]' : 'text-[#8E8E93]'}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              {tab.path === '/messages' && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] bg-[#FF3B30] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-medium ${isActive ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
