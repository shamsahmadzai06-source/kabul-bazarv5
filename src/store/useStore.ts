import { create } from 'zustand';
import type { User, Post, Conversation, Notification, Message, Language, Theme, AdminStats } from '@/types';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;

  // Posts
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  updatePost: (post: Post) => void;
  removePost: (id: string) => void;

  // Conversations
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  updateConversation: (conv: Conversation) => void;

  // Notifications
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;

  // Messages (current chat)
  currentMessages: Message[];
  setCurrentMessages: (messages: Message[]) => void;
  addMessage: (msg: Message) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // Loading
  loading: boolean;
  setLoading: (loading: boolean) => void;

  // Admin
  adminStats: AdminStats | null;
  setAdminStats: (stats: AdminStats | null) => void;

  // Navigation
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
  previousScreen: string | null;
  setPreviousScreen: (screen: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  // Auth
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token, isAuthenticated: !!token }),
  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false, posts: [], conversations: [], notifications: [] });
  },

  // Posts
  posts: [],
  setPosts: (posts) => set({ posts }),
  updatePost: (post) => set((state) => ({
    posts: state.posts.map((p) => p.id === post.id ? post : p),
  })),
  removePost: (id) => set((state) => ({
    posts: state.posts.filter((p) => p.id !== id),
  })),

  // Conversations
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  updateConversation: (conv) => set((state) => ({
    conversations: state.conversations.map((c) => c.id === conv.id ? conv : c),
  })),

  // Notifications
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),

  // Messages
  currentMessages: [],
  setCurrentMessages: (messages) => set({ currentMessages: messages }),
  addMessage: (msg) => set((state) => ({
    currentMessages: [...state.currentMessages, msg],
  })),

  // Theme
  theme: (localStorage.getItem('theme') as Theme) || 'light',
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  toggleTheme: () => set((state) => {
    const theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    return { theme };
  }),

  // Language
  language: (localStorage.getItem('language') as Language) || 'en',
  setLanguage: (language) => {
    localStorage.setItem('language', language);
    set({ language });
  },

  // Loading
  loading: false,
  setLoading: (loading) => set({ loading }),

  // Admin
  adminStats: null,
  setAdminStats: (stats) => set({ adminStats: stats }),

  // Navigation
  currentScreen: 'home',
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  previousScreen: null,
  setPreviousScreen: (screen) => set({ previousScreen: screen }),
}));
