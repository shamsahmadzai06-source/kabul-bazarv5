import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import type { Message } from '@/types';

export default function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { otherUserName, otherUserId } = location.state || {};
  const { user, currentMessages, setCurrentMessages, addMessage } = useStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const loadMessages = async () => {
    try {
      const data = await api.getMessages(conversationId!);
      setCurrentMessages(Array.isArray(data) ? data : []);
    } catch {
      // Silent fail for polling
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    try {
      setSending(true);
      const msg = await api.sendMessage({
        conversationId: conversationId!,
        content: input.trim(),
        recipientId: otherUserId,
      });
      addMessage(msg);
      setInput('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-[#F2F2F7] dark:bg-black">
      {/* Header */}
      <div className="shrink-0 bg-white dark:bg-[#1C1C1E] px-4 py-3 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800">
        <button onClick={() => navigate('/messages')} className="text-[#007AFF]">
          <ChevronLeft size={24} />
        </button>
        <img src="/icons/logo.png" alt="" className="w-9 h-9 rounded-full object-cover" />
        <div className="flex-1">
          <p className="text-[16px] font-semibold text-[#1C1C1E] dark:text-white">{otherUserName || 'Chat'}</p>
          <p className="text-[11px] text-[#34C759]">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-2">
        {currentMessages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[14px] text-[#8E8E93]">No messages yet</p>
            <p className="text-[13px] text-[#8E8E93] mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          currentMessages.map((msg: Message) => {
            const isSent = msg.sender_id === user?.id || msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 ${isSent ? 'msg-sent' : 'msg-received'}`}>
                  <p className="text-[15px] leading-relaxed">{msg.content || msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isSent ? 'text-white/60' : 'text-[#8E8E93]'}`}>
                    {formatTime(msg.created_at || (msg.createdAt ? new Date(msg.createdAt).getTime() : undefined))}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 bg-white dark:bg-[#1C1C1E] border-t border-gray-200 dark:border-gray-800 px-4 py-2 pb-safe">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 h-10 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-full px-4 text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-[#007AFF] rounded-full flex items-center justify-center text-white active:scale-90 transition-transform disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
