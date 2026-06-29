import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, ShoppingBag, UserCheck, AlertCircle, TrendingUp, Settings, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import type { SellerRequest, Post, User } from '@/types';

type AdminTab = 'overview' | 'requests' | 'posts' | 'sellers' | 'users' | 'settings';

export default function Admin() {
  const navigate = useNavigate();
  const { adminStats, setAdminStats, user } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allSellers, setAllSellers] = useState<User[]>([]);
  const [binanceId, setBinanceId] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');


  useEffect(() => {
    if (!user?.isAdmin) return;
    loadStats();
    loadRequests();
    loadPosts();
    loadUsers();
    loadSellers();
  }, [user]);

  const loadStats = async () => {
    try {
      const stats = await api.getAdminStats();
      setAdminStats(stats);
    } catch { /* silent */ }
  };

  const loadRequests = async () => {
    try {
      const data = await api.getPendingRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  const loadPosts = async () => {
    try {
      const data = await api.getAllPosts();
      setAllPosts(Array.isArray(data) ? data.slice(0, 50) : []);
    } catch { /* silent */ }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getAllUsers();
      setAllUsers(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  const loadSellers = async () => {
    try {
      const data = await api.getSellers();
      setAllSellers(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.approveRequest(id);
      toast.success('Seller approved!');
      loadRequests();
      loadStats();
      loadSellers();
    } catch { toast.error('Failed'); }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectRequest(id);
      toast.success('Request rejected');
      loadRequests();
    } catch { toast.error('Failed'); }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke seller status?')) return;
    try {
      await api.revokeSeller(id);
      toast.success('Seller revoked');
      loadSellers();
      loadStats();
    } catch { toast.error('Failed'); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.deleteUser(id);
      toast.success('User deleted');
      loadUsers();
      loadStats();
    } catch { toast.error('Failed'); }
  };

  const handleSaveSettings = async () => {
    try {
      await api.saveSettings({ binanceId, usdtAddress });
      toast.success('Settings saved!');
    } catch { toast.error('Failed'); }
  };

  const tabs: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'requests', label: 'Requests', icon: AlertCircle },
    { key: 'posts', label: 'Posts', icon: ShoppingBag },
    { key: 'sellers', label: 'Sellers', icon: UserCheck },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-full bg-[#F2F2F7] dark:bg-black pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-[#1C1C1E] px-4 py-3 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800">
        <button onClick={() => navigate('/')} className="text-[#007AFF]">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[17px] font-semibold text-[#1C1C1E] dark:text-white">Admin Panel</h1>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-[#1C1C1E] px-4 py-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#007AFF] text-white'
                  : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93]'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.key === 'requests' && requests.length > 0 && (
                <span className="bg-[#FF3B30] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{requests.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Online Now', value: adminStats?.onlineNow || 0, icon: TrendingUp, color: '#34C759' },
              { label: 'Today Visits', value: adminStats?.todayVisits || 0, icon: TrendingUp, color: '#007AFF' },
              { label: 'Total Users', value: adminStats?.users || 0, icon: Users, color: '#FF9500' },
              { label: 'Total Posts', value: adminStats?.totalPosts || 0, icon: ShoppingBag, color: '#5856D6' },
              { label: 'Sellers', value: adminStats?.sellers || 0, icon: UserCheck, color: '#AF52DE' },
              { label: 'Pending', value: adminStats?.pendingRequests || 0, icon: AlertCircle, color: '#FF3B30' },
              { label: 'Total Visits', value: adminStats?.totalVisits || 0, icon: TrendingUp, color: '#5AC8FA' },
              { label: 'Installs', value: adminStats?.totalInstalls || 0, icon: TrendingUp, color: '#34C759' },
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                    <stat.icon size={16} style={{ color: stat.color }} />
                  </div>
                </div>
                <p className="text-[22px] font-bold text-[#1C1C1E] dark:text-white">{stat.value.toLocaleString()}</p>
                <p className="text-[12px] text-[#8E8E93]">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={40} className="text-[#34C759] mx-auto mb-3" />
                <p className="text-[16px] text-[#8E8E93]">No pending requests</p>
              </div>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[16px] font-semibold text-[#1C1C1E] dark:text-white">{req.businessName}</p>
                      <p className="text-[13px] text-[#8E8E93]">{req.userName || 'Unknown'} - {req.phone || 'No phone'}</p>
                    </div>
                    <span className="text-[11px] bg-[#FF9500]/10 text-[#FF9500] px-2 py-0.5 rounded-full font-medium">Pending</span>
                  </div>
                  <p className="text-[14px] text-[#1C1C1E] dark:text-white/80 mb-3">{req.description}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="flex-1 h-9 bg-[#34C759] text-white font-medium rounded-lg flex items-center justify-center gap-1.5 text-[14px]"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="flex-1 h-9 bg-[#FF3B30]/10 text-[#FF3B30] font-medium rounded-lg flex items-center justify-center gap-1.5 text-[14px]"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Posts */}
        {activeTab === 'posts' && (
          <div className="space-y-2">
            {allPosts.map((post) => (
              <div key={post.id} className="bg-white dark:bg-[#1C1C1E] rounded-xl p-3 border border-gray-200 dark:border-gray-800 flex items-center gap-3">
                <img src={post.mediaUrl || '/images/post1.jpg'} alt="" className="w-12 h-12 rounded-lg object-cover bg-[#F2F2F7] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#1C1C1E] dark:text-white truncate">{post.title}</p>
                  <p className="text-[12px] text-[#8E8E93]">{post.authorName || 'Unknown'}</p>
                </div>
                <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white shrink-0">
                  {(post.priceAFN || post.priceAfn || 0).toLocaleString()} AFN
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Sellers */}
        {activeTab === 'sellers' && (
          <div className="space-y-2">
            {allSellers.map((seller) => (
              <div key={seller.id} className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={seller.avatar || '/icons/logo.png'} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-[15px] font-medium text-[#1C1C1E] dark:text-white">{seller.name}</p>
                    <p className="text-[12px] text-[#8E8E93]">{seller.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(seller.id)}
                  className="text-[12px] text-[#FF3B30] font-medium px-3 py-1.5 bg-[#FF3B30]/10 rounded-lg"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="space-y-2">
            {allUsers.map((u) => (
              <div key={u.id} className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={u.avatar || '/icons/logo.png'} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-[15px] font-medium text-[#1C1C1E] dark:text-white">{u.name}</p>
                    <p className="text-[12px] text-[#8E8E93]">{u.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="text-[12px] text-[#FF3B30] font-medium px-3 py-1.5 bg-[#FF3B30]/10 rounded-lg"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-gray-200 dark:border-gray-800 space-y-4">
            <div>
              <label className="text-[11px] text-[#8E8E93] uppercase tracking-wide">Binance ID</label>
              <input
                type="text"
                value={binanceId}
                onChange={(e) => setBinanceId(e.target.value)}
                placeholder="Enter Binance ID"
                className="w-full h-11 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg px-3 mt-1 text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF]"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#8E8E93] uppercase tracking-wide">USDT TRC20 Address</label>
              <input
                type="text"
                value={usdtAddress}
                onChange={(e) => setUsdtAddress(e.target.value)}
                placeholder="Enter USDT TRC20 Address"
                className="w-full h-11 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg px-3 mt-1 text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF]"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              className="w-full h-11 bg-[#007AFF] text-white font-semibold rounded-xl active:scale-[0.98] transition-transform"
            >
              Save Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
