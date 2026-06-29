import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Heart, MessageSquare, Shield, CheckCircle, XCircle, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import type { Notification } from '@/types';

const iconMap: Record<string, React.ElementType> = {
  like: Heart,
  message: MessageSquare,
  admin: Shield,
  seller_approved: CheckCircle,
  seller_rejected: XCircle,
  new_post: Package,
  system: Bell,
};

const colorMap: Record<string, string> = {
  like: '#FF3B30',
  message: '#007AFF',
  admin: '#FF9500',
  seller_approved: '#34C759',
  seller_rejected: '#FF3B30',
  new_post: '#007AFF',
  system: '#8E8E93',
};

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, setNotifications, unreadCount, setUnreadCount } = useStore();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
      const countRes = await api.getUnreadCount();
      setUnreadCount(countRes.count || 0);
    } catch { /* silent */ }
  };

  const markRead = async (notif: Notification) => {
    try {
      await api.markRead(notif.id);
      setNotifications(notifications.map((n) => n.id === notif.id ? { ...n, read: true, is_read: 1 } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.markAllRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true, is_read: 1 })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const timeAgo = (ts?: string | number) => {
    if (!ts) return '';
    const time = typeof ts === 'string' ? new Date(ts).getTime() : ts;
    const diff = Date.now() - time;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="min-h-full bg-[#F2F2F7] dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-[#1C1C1E] px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-[#007AFF]">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-[17px] font-semibold text-[#1C1C1E] dark:text-white">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-[14px] text-[#007AFF]">
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="px-4 pt-3 space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={40} className="text-[#8E8E93] mx-auto mb-3" />
            <p className="text-[16px] text-[#8E8E93]">No notifications</p>
          </div>
        ) : (
          notifications.map((notif: Notification) => {
            const Icon = iconMap[notif.type] || Bell;
            const color = colorMap[notif.type] || '#8E8E93';
            const isUnread = !notif.read && !notif.is_read;
            return (
              <button
                key={notif.id}
                onClick={() => markRead(notif)}
                className={`w-full bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex items-start gap-3 text-left active:scale-[0.99] transition-transform ${isUnread ? 'ring-1 ring-[#007AFF]/30' : ''}`}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-[15px] ${isUnread ? 'font-semibold text-[#1C1C1E] dark:text-white' : 'font-medium text-[#1C1C1E] dark:text-white'}`}>
                      {notif.title || notif.type}
                    </p>
                    <span className="text-[11px] text-[#8E8E93] shrink-0">{timeAgo(notif.created_at || notif.createdAt)}</span>
                  </div>
                  <p className="text-[13px] text-[#8E8E93] mt-0.5 line-clamp-2">{notif.message}</p>
                </div>
                {isUnread && <div className="w-2 h-2 bg-[#007AFF] rounded-full shrink-0 mt-1.5" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
