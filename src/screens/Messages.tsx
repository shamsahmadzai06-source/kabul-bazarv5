import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Headphones } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import type { Conversation } from '@/types';

export default function Messages() {
  const navigate = useNavigate();
  const { conversations, setConversations } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const startAdminChat = async () => {
    try {
      const conv = await api.getAdminConversation();
      navigate(`/chat/${conv.id}`, { state: { otherUserName: 'Admin Support', otherUserId: conv.otherUserId } });
    } catch {
      toast.error('Failed to start chat');
    }
  };

  const timeAgo = (ts?: number) => {
    if (!ts) return '';
    const diff = Date.now() - ts;
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
      <div className="bg-white dark:bg-[#1C1C1E] px-4 py-3 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800">
        <button onClick={() => navigate('/')} className="text-[#007AFF]">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[17px] font-semibold text-[#1C1C1E] dark:text-white flex-1">Messages</h1>
      </div>

      {/* Admin Support */}
      <div className="px-4 pt-3">
        <button
          onClick={startAdminChat}
          className="w-full bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex items-center gap-3 active:scale-[0.99] transition-transform mb-3"
        >
          <div className="w-12 h-12 bg-[#007AFF]/10 rounded-full flex items-center justify-center">
            <Headphones size={22} className="text-[#007AFF]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[16px] font-semibold text-[#1C1C1E] dark:text-white">Admin Support</p>
            <p className="text-[13px] text-[#8E8E93]">Always available for help</p>
          </div>
        </button>
      </div>

      {/* Conversation List */}
      <div className="px-4 space-y-2">
        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 shimmer rounded" />
                  <div className="h-3 w-2/3 shimmer rounded" />
                </div>
              </div>
            </div>
          ))
        ) : conversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare size={40} className="text-[#8E8E93] mx-auto mb-3" />
            <p className="text-[16px] text-[#8E8E93]">No messages yet</p>
            <p className="text-[13px] text-[#8E8E93] mt-1">Start a conversation with Admin Support</p>
          </div>
        ) : (
          conversations.map((conv: Conversation) => (
            <button
              key={conv.id}
              onClick={() => navigate(`/chat/${conv.id}`, { state: { otherUserName: conv.otherUserName, otherUserId: conv.otherUserId } })}
              className="w-full bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
            >
              <img
                src={conv.otherUserAvatar || '/icons/logo.png'}
                alt=""
                className="w-12 h-12 rounded-full object-cover bg-[#F2F2F7]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-[15px] truncate ${conv.unreadCount ? 'font-bold text-[#1C1C1E] dark:text-white' : 'font-medium text-[#1C1C1E] dark:text-white'}`}>
                    {conv.otherUserName || 'Unknown'}
                  </p>
                  <span className="text-[11px] text-[#8E8E93] shrink-0 ml-2">{timeAgo(conv.lastMessageTime)}</span>
                </div>
                <p className="text-[13px] text-[#8E8E93] truncate mt-0.5">{conv.lastMessage || 'No messages yet'}</p>
              </div>
              {conv.unreadCount ? (
                <span className="w-5 h-5 bg-[#FF3B30] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                  {conv.unreadCount}
                </span>
              ) : null}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
