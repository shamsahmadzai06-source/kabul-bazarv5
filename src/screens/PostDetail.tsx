import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, Eye, Share2, Phone, MoreVertical, Trash2, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { VideoPlayer } from '@/components/VideoPlayer';
import { toast } from 'sonner';
import type { Post } from '@/types';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useStore();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const data = await api.getPost(id!);
      setPost(data);
      setLiked(data.isLiked || false);
      setLikeCount(data.likeCount || data.likes || 0);
    } catch {
      const demoPosts = [
        { id: 'demo-1', title: 'iPhone 15 Pro Max', description: 'Brand new, 256GB, Natural Titanium.', priceAfn: 104400, priceAFN: 104400, priceUsd: 1200, priceUSD: 1200, media: [{ id: 'm1', url: '/images/post1.jpg', type: 'image' }], mediaUrl: '/images/post1.jpg', mediaType: 'image', sellerId: 'admin_001', authorId: 'admin_001', sellerName: 'Kabul Tech', authorName: 'Kabul Tech', authorAvatar: '/icons/logo.png', authorType: 'admin', likes: 24, likeCount: 24, views: 156, createdAt: Date.now() - 7200000 + '', status: 'active', isSold: 0, authorWhatsApp: '+93700000001' },
        { id: 'demo-2', title: 'Traditional Afghan Dress', description: 'Hand embroidered, perfect for weddings.', priceAfn: 7395, priceAFN: 7395, priceUsd: 85, priceUSD: 85, media: [{ id: 'm2', url: '/images/post2.jpg', type: 'image' }], mediaUrl: '/images/post2.jpg', mediaType: 'image', sellerId: 'admin_001', authorId: 'admin_001', sellerName: 'Herat Fashion', authorName: 'Herat Fashion', authorAvatar: '/icons/logo.png', authorType: 'seller', likes: 18, likeCount: 18, views: 89, createdAt: Date.now() - 18000000 + '', status: 'active', isSold: 0, authorWhatsApp: '+93700000002' },
        { id: 'demo-3', title: 'Toyota Corolla 2019', description: 'Well maintained, 80k km.', priceAfn: 739500, priceAFN: 739500, priceUsd: 8500, priceUSD: 8500, media: [{ id: 'm3', url: '/images/post3.jpg', type: 'image' }], mediaUrl: '/images/post3.jpg', mediaType: 'image', sellerId: 'admin_001', authorId: 'admin_001', sellerName: 'Kabul Motors', authorName: 'Kabul Motors', authorAvatar: '/icons/logo.png', authorType: 'seller', likes: 42, likeCount: 42, views: 312, createdAt: Date.now() - 43200000 + '', status: 'active', isSold: 0, authorWhatsApp: '+93700000003' },
      ];
      const found = demoPosts.find(p => p.id === id);
      if (found) {
        setPost(found as Post);
        setLikeCount(found.likeCount);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) { toast.error('Login to like'); return; }
    try {
      await api.likePost(id!);
      setLiked(!liked);
      setLikeCount(c => liked ? c - 1 : c + 1);
    } catch { toast.error('Failed'); }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: post?.title, text: `${post?.title} - ${post?.priceAFN || post?.priceAfn} AFN`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied!');
      }
    } catch { toast.error('Share failed'); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.deletePost(id!);
      toast.success('Deleted');
      navigate('/');
    } catch { toast.error('Delete failed'); }
  };

  const handleToggleSold = async () => {
    try {
      await api.toggleSold(id!);
      toast.success(post?.isSold ? 'Marked active' : 'Marked sold');
      loadPost();
    } catch { toast.error('Failed'); }
  };

  const handleWhatsApp = () => {
    const num = post?.authorWhatsApp || post?.sellerWhatsapp;
    if (num) window.open(`https://wa.me/${num.replace(/\D/g, '')}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-full bg-[#F2F2F7] dark:bg-black">
        <div className="aspect-[4/3] shimmer" />
        <div className="bg-white dark:bg-[#1C1C1E] rounded-t-[20px] -mt-6 relative p-5 space-y-3">
          <div className="h-6 w-1/3 shimmer rounded" />
          <div className="h-4 w-2/3 shimmer rounded" />
          <div className="h-20 shimmer rounded" />
          <div className="h-12 shimmer rounded-xl" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-background">
        <p className="text-[#8E8E93] text-[16px]">Post not found</p>
        <button onClick={() => navigate('/')} className="mt-4 text-[#007AFF] text-[15px]">Go Home</button>
      </div>
    );
  }

  const isOwner = user?.id === post.authorId;
  const mediaUrl = post.media?.[0]?.url || post.mediaUrl || '/images/post1.jpg';
  const prices = {
    afn: (post.priceAFN || post.priceAfn || 0).toLocaleString(),
    usd: (post.priceUSD || post.priceUsd || 0).toLocaleString(),
  };
  const sellerName = post.authorName || post.sellerName || 'Unknown';

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black w-full">
      {/* Media */}
      <div className="relative w-full bg-[#F2F2F7] dark:bg-[#2C2C2E]">
        {post.media?.[0]?.type === 'video' || post.mediaType === 'video' ? (
          <VideoPlayer
            src={mediaUrl}
            className="w-full"
          />
        ) : (
          <div className="w-full" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
            <img 
              src={mediaUrl} 
              alt={post.title} 
              className="w-full h-auto object-contain"
              style={{ maxWidth: '100%' }}
            />
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Options menu */}
        {isOwner && (
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <MoreVertical size={18} />
            </button>
            {showOptions && (
              <div className="absolute right-0 top-11 w-44 bg-white dark:bg-[#2C2C2E] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                <button onClick={handleToggleSold} className="w-full flex items-center gap-3 px-4 py-2.5 text-[15px] text-[#1C1C1E] dark:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C]">
                  <CheckCircle size={18} className="text-[#34C759]" />
                  {post.isSold ? 'Mark Active' : 'Mark Sold'}
                </button>
                <button onClick={handleDelete} className="w-full flex items-center gap-3 px-4 py-2.5 text-[15px] text-[#FF3B30] hover:bg-[#FFF5F5] dark:hover:bg-[#3A1A1A]">
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Card */}
      <div className="bg-white dark:bg-[#1C1C1E] relative px-5 pt-5 pb-8 w-full">
        {/* Price */}
        <div className="mb-3">
          <p className="text-[22px] font-bold text-[#1C1C1E] dark:text-white">
            {prices.afn} <span className="text-[16px] font-semibold">AFN</span>
          </p>
          <p className="text-[14px] text-[#8E8E93] font-medium">
            ${prices.usd} USD
          </p>
        </div>

        {/* Title */}
        <h1 className="text-[22px] font-semibold text-[#1C1C1E] dark:text-white leading-tight mb-2">
          {post.title}
        </h1>

        {/* Description */}
        {post.description && (
          <p className="text-[15px] text-[#1C1C1E] dark:text-white/80 leading-relaxed mb-4">
            {post.description}
          </p>
        )}

        {/* Seller */}
        <div className="flex items-center gap-3 py-3 border-t border-b border-gray-100 dark:border-gray-800 mb-4">
          <img
            src={post.authorAvatar || post.sellerProfilePic || '/icons/logo.png'}
            alt={sellerName}
            className="w-12 h-12 rounded-full object-cover border border-gray-200"
          />
          <div className="flex-1">
            <p className="text-[16px] font-semibold text-[#1C1C1E] dark:text-white">{sellerName}</p>
            <p className="text-[13px] text-[#8E8E93]">{post.authorType || 'Seller'}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 mb-5">
          <button onClick={handleLike} className="flex items-center gap-1.5">
            <Heart size={20} className={liked ? 'text-[#FF3B30] fill-[#FF3B30]' : 'text-[#8E8E93]'} strokeWidth={liked ? 2.5 : 1.5} />
            <span className="text-[14px] text-[#8E8E93] font-medium">{likeCount}</span>
          </button>
          <div className="flex items-center gap-1.5">
            <Eye size={20} className="text-[#8E8E93]" strokeWidth={1.5} />
            <span className="text-[14px] text-[#8E8E93] font-medium">{post.views || 0}</span>
          </div>
          <button onClick={handleShare} className="flex items-center gap-1.5 ml-auto">
            <Share2 size={20} className="text-[#007AFF]" strokeWidth={1.5} />
          </button>
        </div>

        {/* WhatsApp CTA */}
        <button
          onClick={handleWhatsApp}
          className="w-full h-12 bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold text-[16px] rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <Phone size={20} />
          Contact Seller
        </button>

        {/* Sold badge overlay */}
        {post.isSold && (
          <div className="absolute top-4 right-4 bg-[#34C759] text-white text-sm font-bold px-3 py-1.5 rounded-lg">
            SOLD
          </div>
        )}
      </div>
    </div>
  );
}