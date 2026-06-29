import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      setLoading(true);
      const res = await api.login({ email: email.trim(), password });
      if (res.token && res.user) {
        login(res.token, res.user);
        toast.success('Welcome back!');
        navigate('/');
      } else {
        toast.error('Invalid response');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-[#007AFF] to-[#005BB5] flex flex-col">
      {/* Logo area */}
      <div className="flex-1 flex flex-col items-center justify-center pt-12">
        <img src="/icons/logo.png" alt="Kabul Bazar" className="w-24 h-24 rounded-full shadow-lg mb-4" />
        <h1 className="text-white text-2xl font-bold">Kabul Bazar</h1>
        <p className="text-white/70 text-sm mt-1">Afghanistan's Marketplace</p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-t-[20px] px-6 pt-8 pb-10">
        <h2 className="text-[22px] font-semibold text-[#1C1C1E] dark:text-white mb-6">Welcome Back</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 pl-10 pr-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF]"
              required
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 pl-10 pr-12 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93]"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#007AFF] text-white font-semibold rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Log In'}
          </button>
        </form>

        <button
          onClick={() => navigate('/signup')}
          className="w-full h-12 mt-3 border-2 border-[#007AFF] text-[#007AFF] font-semibold rounded-xl active:scale-[0.98] transition-transform"
        >
          Create Account
        </button>

        <p className="text-center text-[13px] text-[#8E8E93] mt-6">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
