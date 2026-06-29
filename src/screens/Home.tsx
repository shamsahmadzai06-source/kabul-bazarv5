import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { PostCard } from '@/components/PostCard';
import { AdCarousel } from '@/components/AdCarousel';
import { toast } from 'sonner';
import type { Post } from '@/types';

export default function Home() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const { posts, setPosts } = useStore();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadPosts = useCallback(async (pageNum: number, append = false) => {
    try {
      setLoading(true);
      const data = await api.getPosts({
        page: pageNum,
        limit: 20,
        ...(searchQuery ? { search: searchQuery } : {}),
      });
      const newPosts = Array.isArray(data) ? data : [];
      if (append) {
        setPosts([...posts, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      setHasMore(newPosts.length === 20);
    } catch (err) {
      toast.error('Failed to load posts');
      // Use demo data if API fails
      if (!append) {
        setPosts(getDemoPosts());
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, posts, setPosts]);

  useEffect(() => {
    setPage(1);
    loadPosts(1, false);
  }, [searchQuery]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && page < 5) {
          setPage((p) => p + 1);
          loadPosts(page + 1, true);
        }
      },
      { rootMargin: '200px' }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, loadPosts]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadPosts(1, false);
  };

  return (
    <div className="min-h-full bg-[#F2F2F7] dark:bg-black">
      <div className="px-4 pt-3 pb-2">
        {/* Ad Carousel */}
        <AdCarousel />

        {/* Search result header */}
        {searchQuery && (
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[14px] text-[#8E8E93]">
              Results for "{searchQuery}"
            </p>
            <button
              onClick={() => { window.history.pushState({}, '', '/'); handleRefresh(); }}
              className="text-[14px] text-[#007AFF]"
            >
              Clear
            </button>
          </div>
        )}

        {/* Pull to refresh indicator */}
        {refreshing && (
          <div className="flex justify-center py-3">
            <RefreshCw size={20} className="text-[#007AFF] animate-spin" />
          </div>
        )}

        {/* Post Feed */}
        <div className="space-y-0">
          {posts.length === 0 && !loading ? (
            <div className="text-center py-20">
              <p className="text-[16px] text-[#8E8E93] mb-2">No posts yet</p>
              <p className="text-[13px] text-[#8E8E93]">Be the first to create a post!</p>
            </div>
          ) : (
            posts.map((post: Post, i: number) => (
              <PostCard key={post.id} post={post} index={i} />
            ))
          )}
        </div>

        {/* Loading skeleton */}
        {loading && posts.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="aspect-[4/3] shimmer" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 shimmer rounded" />
                  <div className="h-3 w-1/2 shimmer rounded" />
                  <div className="h-10 shimmer rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more trigger */}
        <div ref={loaderRef} className="h-10 flex items-center justify-center">
          {loading && posts.length > 0 && (
            <RefreshCw size={18} className="text-[#8E8E93] animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}

// Demo data fallback
function getDemoPosts(): Post[] {
  return [
    {
      id: 'demo-1', title: 'iPhone 15 Pro Max', description: 'Brand new, 256GB, Natural Titanium.',
      priceAfn: 104400, priceAFN: 104400, priceUsd: 1200, priceUSD: 1200,
      media: [{ id: 'm1', url: '/images/post1.jpg', type: 'image' }],
      mediaUrl: '/images/post1.jpg', mediaType: 'image',
      sellerId: 'admin_001', authorId: 'admin_001', sellerName: 'Kabul Tech', authorName: 'Kabul Tech',
      authorAvatar: '/icons/logo.png', authorType: 'admin',
      likes: 24, likeCount: 24, views: 156, createdAt: Date.now() - 3600000 * 2 + '', status: 'active', isSold: 0,
    },
    {
      id: 'demo-2', title: 'Traditional Afghan Dress', description: 'Hand embroidered, perfect for weddings.',
      priceAfn: 7395, priceAFN: 7395, priceUsd: 85, priceUSD: 85,
      media: [{ id: 'm2', url: '/images/post2.jpg', type: 'image' }],
      mediaUrl: '/images/post2.jpg', mediaType: 'image',
      sellerId: 'admin_001', authorId: 'admin_001', sellerName: 'Herat Fashion', authorName: 'Herat Fashion',
      authorAvatar: '/icons/logo.png', authorType: 'seller',
      likes: 18, likeCount: 18, views: 89, createdAt: Date.now() - 3600000 * 5 + '', status: 'active', isSold: 0,
    },
    {
      id: 'demo-3', title: 'Toyota Corolla 2019', description: 'Well maintained, 80k km.',
      priceAfn: 739500, priceAFN: 739500, priceUsd: 8500, priceUSD: 8500,
      media: [{ id: 'm3', url: '/images/post3.jpg', type: 'image' }],
      mediaUrl: '/images/post3.jpg', mediaType: 'image',
      sellerId: 'admin_001', authorId: 'admin_001', sellerName: 'Kabul Motors', authorName: 'Kabul Motors',
      authorAvatar: '/icons/logo.png', authorType: 'seller',
      likes: 42, likeCount: 42, views: 312, createdAt: Date.now() - 3600000 * 12 + '', status: 'active', isSold: 0,
    },
    {
      id: 'demo-4', title: 'Fresh Organic Honey', description: 'Pure mountain honey from Nuristan, 1kg.',
      priceAfn: 1305, priceAFN: 1305, priceUsd: 15, priceUSD: 15,
      media: [{ id: 'm4', url: '/images/post4.jpg', type: 'image' }],
      mediaUrl: '/images/post4.jpg', mediaType: 'image',
      sellerId: 'admin_001', authorId: 'admin_001', sellerName: 'Nuristan Farms', authorName: 'Nuristan Farms',
      authorAvatar: '/icons/logo.png', authorType: 'seller',
      likes: 12, likeCount: 12, views: 67, createdAt: Date.now() - 3600000 * 18 + '', status: 'active', isSold: 0,
    },
    {
      id: 'demo-5', title: 'Web Development Service', description: 'Professional website and mobile app.',
      priceAfn: 26100, priceAFN: 26100, priceUsd: 300, priceUSD: 300,
      media: [{ id: 'm5', url: '/images/post5.jpg', type: 'image' }],
      mediaUrl: '/images/post5.jpg', mediaType: 'image',
      sellerId: 'admin_001', authorId: 'admin_001', sellerName: 'Tech Solutions', authorName: 'Tech Solutions',
      authorAvatar: '/icons/logo.png', authorType: 'seller',
      likes: 8, likeCount: 8, views: 45, createdAt: Date.now() - 3600000 * 24 + '', status: 'active', isSold: 0,
    },
    {
      id: 'demo-6', title: 'Samsung Galaxy S24', description: 'Latest model, 128GB, unlocked.',
      priceAfn: 82650, priceAFN: 82650, priceUsd: 950, priceUSD: 950,
      media: [{ id: 'm6', url: '/images/post6.jpg', type: 'image' }],
      mediaUrl: '/images/post6.jpg', mediaType: 'image',
      sellerId: 'admin_001', authorId: 'admin_001', sellerName: 'Kabul Mobile', authorName: 'Kabul Mobile',
      authorAvatar: '/icons/logo.png', authorType: 'seller',
      likes: 31, likeCount: 31, views: 198, createdAt: Date.now() - 3600000 * 30 + '', status: 'active', isSold: 0,
    },
  ];
}
