import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [shopName, setShopName] = useState(user?.shopName || '');
  const [shopAddress, setShopAddress] = useState(user?.shopAddress || '');
  const [binanceId, setBinanceId] = useState(user?.binanceId || '');
  const [usdtTrc20, setUsdtTrc20] = useState(user?.usdtTrc20 || '');
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || user?.profilePic || '/icons/logo.png');
  const [coverPreview, setCoverPreview] = useState(user?.coverPhoto || '');

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateProfile({
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        bio: bio.trim() || undefined,
        shopAddress: shopAddress.trim() || undefined,
        binanceId: binanceId.trim() || undefined,
        usdtTrc20: usdtTrc20.trim() || undefined,
      });

      // Update local user
      if (user) {
        const updated = { ...user, name, phone, whatsapp, bio, shopName, shopAddress, binanceId, usdtTrc20 };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }

      toast.success('Profile updated!');
      navigate('/profile');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.uploadAvatar(formData);
      if (res.avatar) {
        setAvatarPreview(res.avatar);
        if (user) {
          const updated = { ...user, avatar: res.avatar };
          setUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
        }
        toast.success('Avatar updated!');
      }
    } catch {
      toast.error('Avatar upload failed');
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append('cover', file);
      const res = await api.uploadCover(formData);
      if (res.coverPhoto) {
        setCoverPreview(res.coverPhoto);
        if (user) {
          const updated = { ...user, coverPhoto: res.coverPhoto };
          setUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
        }
        toast.success('Cover updated!');
      }
    } catch {
      toast.error('Cover upload failed');
    }
  };

  return (
    <div className="min-h-full bg-[#F2F2F7] dark:bg-black pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-[#1C1C1E] px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <button onClick={() => navigate('/profile')} className="flex items-center gap-1 text-[#007AFF]">
          <ChevronLeft size={20} />
          <span className="text-[15px]">Back</span>
        </button>
        <h1 className="text-[17px] font-semibold text-[#1C1C1E] dark:text-white">Edit Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-[#007AFF] font-semibold text-[15px] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Cover */}
      <div className="relative h-32 bg-gradient-to-br from-[#007AFF] to-[#005BB5]">
        {coverPreview && <img src={coverPreview} alt="" className="w-full h-full object-cover" />}
        <button
          onClick={() => coverInputRef.current?.click()}
          className="absolute bottom-2 right-2 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          <Camera size={14} />
        </button>
        <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
      </div>

      {/* Avatar */}
      <div className="relative -mt-10 mb-4 flex justify-center">
        <div className="relative">
          <img
            src={avatarPreview}
            alt=""
            className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-[#1C1C1E] bg-white"
          />
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-7 h-7 bg-[#007AFF] rounded-full flex items-center justify-center text-white border-2 border-white dark:border-[#1C1C1E]"
          >
            <Camera size={12} />
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>
      </div>

      {/* Form */}
      <div className="px-4 space-y-4">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-gray-200 dark:border-gray-800 space-y-3">
          <div>
            <label className="text-[11px] text-[#8E8E93] uppercase tracking-wide">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg px-3 mt-1 text-[15px] text-[#1C1C1E] dark:text-white outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#8E8E93] uppercase tracking-wide">Email (read-only)</label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              className="w-full h-11 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg px-3 mt-1 text-[15px] text-[#8E8E93] outline-none cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#8E8E93] uppercase tracking-wide">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg px-3 mt-1 text-[15px] text-[#1C1C1E] dark:text-white outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#8E8E93] uppercase tracking-wide">WhatsApp</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full h-11 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg px-3 mt-1 text-[15px] text-[#1C1C1E] dark:text-white outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#8E8E93] uppercase tracking-wide">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full h-20 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg p-3 mt-1 text-[15px] text-[#1C1C1E] dark:text-white outline-none focus:ring-2 focus:ring-[#007AFF] resize-none"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-gray-200 dark:border-gray-800 space-y-3">
          <div>
            <label className="text-[11px] text-[#8E8E93] uppercase tracking-wide">Shop Name</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full h-11 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg px-3 mt-1 text-[15px] text-[#1C1C1E] dark:text-white outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#8E8E93] uppercase tracking-wide">Shop Address</label>
            <input
              type="text"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              className="w-full h-11 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg px-3 mt-1 text-[15px] text-[#1C1C1E] dark:text-white outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-gray-200 dark:border-gray-800 space-y-3">
          <div>
            <label className="text-[11px] text-[#8E8E93] uppercase tracking-wide">Binance ID</label>
            <input
              type="text"
              value={binanceId}
              onChange={(e) => setBinanceId(e.target.value)}
              className="w-full h-11 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg px-3 mt-1 text-[15px] text-[#1C1C1E] dark:text-white outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#8E8E93] uppercase tracking-wide">USDT TRC20 Address</label>
            <input
              type="text"
              value={usdtTrc20}
              onChange={(e) => setUsdtTrc20(e.target.value)}
              className="w-full h-11 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg px-3 mt-1 text-[15px] text-[#1C1C1E] dark:text-white outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
