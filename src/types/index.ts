export interface User {
  id: string;
  name: string;
  lastName?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  role: 'user' | 'seller' | 'admin';
  profilePic?: string;
  avatar?: string;
  shopName?: string;
  shopAddress?: string;
  binanceId?: string;
  usdtTrc20?: string;
  bio?: string;
  coverPhoto?: string;
  isApprovedSeller: boolean;
  isAdmin?: number;
  isSeller?: number;
  isApproved?: number;
  createdAt?: string;
}

export interface Post {
  id: string;
  title: string;
  info?: string;
  description?: string;
  priceAfn: number;
  priceAFN?: number;
  priceUsd: number;
  priceUSD?: number;
  media: PostMedia[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  sellerId: string;
  authorId?: string;
  sellerName: string;
  authorName?: string;
  sellerWhatsapp?: string;
  authorWhatsApp?: string;
  sellerProfilePic?: string;
  authorAvatar?: string;
  authorType?: 'admin' | 'seller' | 'user';
  likes: number;
  likeCount?: number;
  likedBy?: string[];
  isLiked?: boolean;
  views: number;
  createdAt: string;
  status?: 'active' | 'flagged' | 'removed';
  isSold?: number;
}

export interface PostMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
}

export interface Ad {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  link?: string;
  active: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  user_id?: string;
  title?: string;
  type: 'like' | 'comment' | 'admin' | 'seller_approved' | 'seller_rejected' | 'system' | 'new_post' | 'message';
  message: string;
  read: boolean;
  is_read?: number;
  relatedPostId?: string;
  related_id?: string;
  createdAt: string;
  created_at?: number;
}

export interface Message {
  id: string;
  senderId: string;
  sender_id?: string;
  senderName: string;
  sender_name?: string;
  receiverId: string;
  text: string;
  content?: string;
  createdAt: string;
  created_at?: number;
  read: boolean;
  is_read?: number;
  conversation_id?: string;
}

export interface Conversation {
  id: string;
  user1_id?: string;
  user2_id?: string;
  otherUserId?: string;
  otherUserName?: string;
  otherUserAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount?: number;
  updated_at?: number;
}

export interface AdminStats {
  totalPosts: number;
  pendingRequests: number;
  sellers: number;
  users: number;
  todayVisits: number;
  onlineNow: number;
  totalVisits: number;
  totalInstalls: number;
}

export interface SellerRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  phone?: string;
  businessName: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export type Language = 'en' | 'fa' | 'ps';
export type Theme = 'light' | 'dark';

export interface AppSettings {
  binanceId: string;
  usdtAddress: string;
}
