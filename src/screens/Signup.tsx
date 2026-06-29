import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Eye, EyeOff, Store } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSellerRequest, setIsSellerRequest] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessDesc, setBusinessDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Please fill required fields');
      return;
    }
    try {
      setLoading(true);
      const res = await api.signup({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        isSellerRequest,
        businessName: isSellerRequest ? businessName : undefined,
        description: isSellerRequest ? businessDesc : undefined,
      });
      if (res.token && res.user) {
        login(res.token, res.user);
        toast.success('Account created!');
        navigate('/');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-[#007AFF] to-[#005BB5] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center pt-8">
        <img src="/icons/logo.png" alt="Kabul Bazar" className="w-20 h-20 rounded-full shadow-lg mb-3" />
        <h1 className="text-white text-xl font-bold">Create Account</h1>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] rounded-t-[20px] px-6 pt-6 pb-8 max-h-[75vh] overflow-y-auto no-scrollbar">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="Full name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 pl-10 pr-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF]"
              required
            />
          </div>

          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
            <input
              type="email"
              placeholder="Email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 pl-10 pr-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF]"
              required
            />
          </div>

          <div className="relative">
            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-12 pl-10 pr-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password *"
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

          {/* Seller request toggle */}
          <label className="flex items-center gap-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSellerRequest}
              onChange={(e) => setIsSellerRequest(e.target.checked)}
              className="w-5 h-5 rounded accent-[#007AFF]"
            />
            <span className="text-[15px] text-[#1C1C1E] dark:text-white">Apply to become a seller</span>
          </label>

          {isSellerRequest && (
            <div className="space-y-3 pl-2 border-l-2 border-[#007AFF]">
              <div className="relative">
                <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                <input
                  type="text"
                  placeholder="Business name *"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  required={isSellerRequest}
                />
              </div>
              <textarea
                placeholder="Business description *"
                value={businessDesc}
                onChange={(e) => setBusinessDesc(e.target.value)}
                className="w-full h-24 p-3 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF] resize-none"
                required={isSellerRequest}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#007AFF] text-white font-semibold rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <button
          onClick={() => navigate('/login')}
          className="w-full text-center text-[15px] text-[#007AFF] mt-4 py-2"
        >
          Already have an account? Log In
        </button>
      </div>
    </div>
  );
}
