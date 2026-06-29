import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { SplashScreen } from '@/components/SplashScreen';
import { Layout } from '@/components/Layout';
import { Toaster } from '@/components/ui/sonner';

const Home = lazy(() => import('@/screens/Home'));
const PostDetail = lazy(() => import('@/screens/PostDetail'));
const CreatePost = lazy(() => import('@/screens/CreatePost'));
const Profile = lazy(() => import('@/screens/Profile'));
const ProfileEdit = lazy(() => import('@/screens/ProfileEdit'));
const Messages = lazy(() => import('@/screens/Messages'));
const Chat = lazy(() => import('@/screens/Chat'));
const Notifications = lazy(() => import('@/screens/Notifications'));
const Admin = lazy(() => import('@/screens/Admin'));
const Login = lazy(() => import('@/screens/Login'));
const Signup = lazy(() => import('@/screens/Signup'));

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { login, logout, theme, setTheme } = useStore();

  useEffect(() => {
    // Check for stored auth
    const token = localStorage.getItem('token');
    if (token) {
      api.me()
        .then((user: unknown) => {
          login(token, user as Parameters<typeof login>[1]);
        })
        .catch(() => {
          logout();
        });
    }

    // Theme init
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    // Send heartbeat
    const heartbeat = setInterval(() => {
      api.heartbeat().catch(() => {});
    }, 30000);

    return () => clearInterval(heartbeat);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useStore();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/create-post" element={
          isAuthenticated ? <CreatePost /> : <Navigate to="/login" />
        } />
        <Route path="/profile" element={
          isAuthenticated ? <Profile /> : <Navigate to="/login" />
        } />
        <Route path="/profile/edit" element={
          isAuthenticated ? <ProfileEdit /> : <Navigate to="/login" />
        } />
        <Route path="/messages" element={
          isAuthenticated ? <Messages /> : <Navigate to="/login" />
        } />
        <Route path="/chat/:conversationId" element={
          isAuthenticated ? <Chat /> : <Navigate to="/login" />
        } />
        <Route path="/notifications" element={
          isAuthenticated ? <Notifications /> : <Navigate to="/login" />
        } />
        <Route path="/admin" element={
          isAuthenticated && user?.isAdmin ? <Admin /> : <Navigate to="/" />
        } />
      </Route>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" /> : <Login />
      } />
      <Route path="/signup" element={
        isAuthenticated ? <Navigate to="/" /> : <Signup />
      } />
    </Routes>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <BrowserRouter>
      <AppInitializer>
        {showSplash ? (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        ) : (
          <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="animate-pulse text-brand-blue text-lg font-semibold">Kabul Bazar</div>
            </div>
          }>
            <AppRoutes />
          </Suspense>
        )}
        <Toaster position="top-center" />
      </AppInitializer>
    </BrowserRouter>
  );
}
