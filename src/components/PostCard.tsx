import { useState, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, Share2, Phone } from 'lucide-react';
import type { Post } from '@/types';
import { api } from '@/lib/api';
import { LazyImage } from './LazyImage';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

interface PostCardProps {
  post: Post;
  index: number;
}

function formatPrice(afn: number, usd: number) {
  return {
    afn: afn?.toLocaleString() || '0',
    usd: usd?.toLocaleString() || '0',
  };
}

function timeAgo(date: string | number) {
  const now = Date.now();
  const then = typeof date === 'string' ? new Date(date).getTime() : date;
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export const PostCard = memo(function PostCard({ post, index }: PostCardProps) {
  const navigate = useNavigate();
  const { user } = useStore();
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || post.likes || 0);
  const [heartAnim, setHeartAnim] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoInView, setVideoInView] = useState(false);

  const prices = formatPrice(post.priceAFN || post.priceAfn || 0, post.priceUSD || post.priceUsd || 0);
  const mediaUrl = post.media?.[0]?.url || post.mediaUrl || '/images/post1.jpg';
  const isVideo = post.media?.[0]?.type === 'video' || post.mediaType === 'video' || mediaUrl?.match(/\.(mp4|mov|webm)$/i);
  const sellerName = post.authorName || post.sellerName || 'Unknown';
  const avatarUrl = post.authorAvatar || post.sellerProfilePic || '/icons/logo.png';
  const whatsappNum = post.authorWhatsApp || post.sellerWhatsapp || '';

  // IntersectionObserver for video autoplay
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVideoInView(entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [isVideo]);

  useEffect(() => {
    if (videoRef.current) {
      if (videoInView) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [videoInView]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Login to like posts');
      return;
    }
    try {
      await api.likePost(post.id);
      setLiked(!liked);
      setLikeCount((c) => (liked ? c - 1 : c + 1));
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 300);
    } catch {
      toast.error('Failed to like');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: post.title,
      text: `${post.title} - ${prices.afn} AFN`,
      url: `${window.location.origin}/post/${post.id}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied!');
      }
    } catch {
      toast.error('Share failed');
    }
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (whatsappNum) {
      window.open(`https://wa.me/${whatsappNum.replace(/\D/g, '')}`, '_blank');
    } else {
      toast.error('No WhatsApp number');
    }
  };

  return (
    <article
      className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-3 active:scale-[0.99] transition-transform"
      onClick={() => navigate(`/post/${post.id}`)}
    >
      {/* Media */}
      <div className="relative aspect-[4/3] bg-[#F2F2F7] dark:bg-[#2C2C2E]">
        {isVideo ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            muted
            loop
            playsInline
            preload="metadata"
            poster={mediaUrl.replace(/\.[^.]+$/, '.jpg')}
            className="w-full h-full object-cover"
          />
        ) : (
          <LazyImage
            src={mediaUrl}
            alt={post.title}
            className="w-full h-full"
            priority={index < 2}
          />
        )}

        {/* Price Badge - AFN PRIMARY, large bold first; USD secondary smaller gray */}
        <div className="absolute bottom-3 left-3 price-badge">
          <p className="text-[20px] font-bold text-[#1C1C1E] leading-tight">
            {prices.afn} <span className="text-[13px] font-medium">AFN</span>
          </p>
          <p className="text-[13px] font-medium text-[#8E8E93]">
            ${prices.usd} USD
          </p>
        </div>

        {/* Sold badge */}
        {post.isSold ? (
          <div className="absolute top-3 right-3 bg-[#34C759] text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            SOLD
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Seller info */}
        <div className="flex items-center gap-2 mb-2">
          <img
            src={avatarUrl}
            alt={sellerName}
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-[#1C1C1E] dark:text-white truncate">
              {sellerName}
            </p>
          </div>
          <span className="text-[11px] text-[#8E8E93] shrink-0">
            {timeAgo(post.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[16px] font-semibold text-[#1C1C1E] dark:text-white mb-1 leading-snug">
          {post.title}
        </h3>

        {/* Description */}
        {post.description || post.info ? (
          <p className="text-[14px] text-[#8E8E93] line-clamp-2 mb-3 leading-relaxed">
            {post.description || post.info}
          </p>
        ) : null}

        {/* Stats row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 ${heartAnim ? 'heart-bounce' : ''}`}
            >
              <Heart
                size={18}
                className={liked ? 'text-[#FF3B30] fill-[#FF3B30]' : 'text-[#8E8E93]'}
                strokeWidth={liked ? 2.5 : 1.5}
              />
              <span className="text-[13px] font-medium text-[#8E8E93]">{likeCount}</span>
            </button>
            <div className="flex items-center gap-1.5">
              <Eye size={18} className="text-[#8E8E93]" strokeWidth={1.5} />
              <span className="text-[13px] font-medium text-[#8E8E93]">{post.views || 0}</span>
            </div>
          </div>
          <button onClick={handleShare} className="active:scale-90 transition-transform">
            <Share2 size={18} className="text-[#8E8E93]" strokeWidth={1.5} />
          </button>
        </div>

        {/* WhatsApp CTA */}
        <button
          onClick={handleWhatsApp}
          className="w-full h-11 bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold text-[15px] rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <Phone size={18} />
          Contact Seller
        </button>
      </div>
    </article>
  );
});
