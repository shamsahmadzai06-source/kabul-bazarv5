import { useNavigate } from 'react-router-dom';
import { Settings, ChevronRight, Package, MessageCircle, Shield, HelpCircle, LogOut } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useStore();

  if (!user) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-background">
        <p className="text-[#8E8E93] mb-4">Please log in to view your profile</p>
        <button onClick={() => navigate('/login')} className="text-[#007AFF] font-semibold">Log In</button>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: Settings, label: 'Edit Profile', action: () => navigate('/profile/edit'), color: '#007AFF' },
    { icon: Package, label: 'My Posts', action: () => navigate(`/?authorId=${user.id}`), color: '#007AFF' },
    { icon: MessageCircle, label: 'Messages', action: () => navigate('/messages'), color: '#34C759' },
    ...(user.isAdmin ? [{ icon: Shield, label: 'Admin Panel', action: () => navigate('/admin'), color: '#FF9500' }] : []),
    { icon: HelpCircle, label: 'Support', action: () => {}, color: '#8E8E93' },
  ];

  return (
    <div className="min-h-full bg-[#F2F2F7] dark:bg-black">
      {/* Cover Photo */}
      <div className="relative h-40 bg-gradient-to-br from-[#007AFF] to-[#005BB5]">
        {user.coverPhoto && (
          <img src={user.coverPhoto} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Info */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-t-[20px] -mt-6 relative px-5 pt-0 pb-6">
        {/* Avatar */}
        <div className="relative -mt-12 mb-4 flex justify-center">
          <div className="relative">
            <img
              src={user.avatar || user.profilePic || '/icons/logo.png'}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-[#1C1C1E] bg-white"
            />
          </div>
        </div>

        {/* Name & Info */}
        <div className="text-center mb-6">
          <h1 className="text-[22px] font-bold text-[#1C1C1E] dark:text-white">
            {user.name} {user.lastName}
          </h1>
          <p className="text-[14px] text-[#8E8E93] mt-0.5">{user.email}</p>
          {user.bio && <p className="text-[14px] text-[#1C1C1E] dark:text-white/70 mt-2">{user.bio}</p>}
          {user.isSeller || user.isApproved ? (
            <span className="inline-block mt-2 bg-[#007AFF]/10 text-[#007AFF] text-[12px] font-semibold px-3 py-1 rounded-full">
              Verified Seller
            </span>
          ) : null}
        </div>

        {/* Details */}
        <div className="space-y-3 mb-6">
          {user.phone && (
            <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl p-3">
              <p className="text-[11px] text-[#8E8E93] uppercase tracking-wide">Phone</p>
              <p className="text-[15px] text-[#1C1C1E] dark:text-white mt-0.5">{user.phone}</p>
            </div>
          )}
          {user.shopName && (
            <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl p-3">
              <p className="text-[11px] text-[#8E8E93] uppercase tracking-wide">Shop Name</p>
              <p className="text-[15px] text-[#1C1C1E] dark:text-white mt-0.5">{user.shopName}</p>
            </div>
          )}
          {user.shopAddress && (
            <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl p-3">
              <p className="text-[11px] text-[#8E8E93] uppercase tracking-wide">Shop Address</p>
              <p className="text-[15px] text-[#1C1C1E] dark:text-white mt-0.5">{user.shopAddress}</p>
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <item.icon size={20} style={{ color: item.color }} />
              <span className="flex-1 text-[15px] text-[#1C1C1E] dark:text-white">{item.label}</span>
              <ChevronRight size={18} className="text-[#8E8E93]" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 text-[#FF3B30] font-medium active:opacity-70 transition-opacity"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  );
}
