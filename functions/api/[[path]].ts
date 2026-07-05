// ==========================================
// KABUL BAZAR - CLOUDFLARE PAGES FUNCTIONS
// API Backend for Pages with D1 Database
// Version: 19.0.0
// ==========================================

interface Env {
  gkdatabase: D1Database;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Guest-Id, Range, Cache-Control, X-Requested-With',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

function hashPassword(pw: string): string {
  let hash = 0;
  for (let i = 0; i < pw.length; i++) {
    hash = ((hash << 5) - hash) + pw.charCodeAt(i);
    hash = hash & hash;
  }
  return 'hash_' + Math.abs(hash);
}

function jsonResponse(data: unknown, status = 200, cacheSeconds = 0) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...corsHeaders };
  if (cacheSeconds > 0) {
    headers['Cache-Control'] = `public, max-age=${cacheSeconds}`;
  } else {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function ensureTablesExist(db: D1Database) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT, password TEXT NOT NULL, authToken TEXT, isAdmin INTEGER DEFAULT 0, isSeller INTEGER DEFAULT 0, isApproved INTEGER DEFAULT 0, avatar TEXT, coverPhoto TEXT, bio TEXT, shopAddress TEXT, binanceId TEXT, usdtTrc20 TEXT, createdAt INTEGER, lastSeen INTEGER)`,
    `CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, priceUSD REAL, priceAFN REAL, discountPrice REAL, discountPercent REAL, category TEXT DEFAULT 'other', mediaUrl TEXT, authorId TEXT, isSold INTEGER DEFAULT 0, createdAt INTEGER)`,
    `CREATE TABLE IF NOT EXISTS likes (id TEXT PRIMARY KEY, postId TEXT, userId TEXT, createdAt INTEGER)`,
    `CREATE TABLE IF NOT EXISTS views (id TEXT PRIMARY KEY, postId TEXT, userId TEXT, createdAt INTEGER)`,
    `CREATE TABLE IF NOT EXISTS visits (id TEXT PRIMARY KEY, userId TEXT, guestId TEXT, sessionId TEXT, createdAt INTEGER, userAgent TEXT, deviceType TEXT, browser TEXT, platform TEXT, country TEXT, referer TEXT, ipAddress TEXT, pageUrl TEXT)`,
    `CREATE TABLE IF NOT EXISTS daily_visits (id TEXT PRIMARY KEY, date TEXT NOT NULL UNIQUE, visitCount INTEGER DEFAULT 0, updatedAt INTEGER)`,
    `CREATE TABLE IF NOT EXISTS installs (id TEXT PRIMARY KEY, userId TEXT, guestId TEXT, platform TEXT, userAgent TEXT, country TEXT, deviceType TEXT, createdAt INTEGER)`,
    `CREATE TABLE IF NOT EXISTS seller_requests (id TEXT PRIMARY KEY, userId TEXT, userName TEXT, userEmail TEXT, phone TEXT, businessName TEXT, description TEXT, status TEXT DEFAULT 'pending', createdAt INTEGER)`,
    `CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT, title TEXT, message TEXT, type TEXT, is_read INTEGER DEFAULT 0, created_at INTEGER, related_id TEXT)`,
    `CREATE TABLE IF NOT EXISTS push_subscriptions (id TEXT PRIMARY KEY, userId TEXT, endpoint TEXT, p256dh TEXT, auth TEXT, createdAt INTEGER)`,
    `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`,
    `CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, user1_id TEXT, user2_id TEXT, created_at INTEGER, updated_at INTEGER, last_message TEXT)`,
    `CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, conversation_id TEXT, sender_id TEXT, sender_name TEXT, content TEXT, is_read INTEGER DEFAULT 0, created_at INTEGER)`,
    `CREATE TABLE IF NOT EXISTS online_sessions (id TEXT PRIMARY KEY, userId TEXT, guestId TEXT, sessionId TEXT, lastPing INTEGER)`,
    `CREATE TABLE IF NOT EXISTS ads (id TEXT PRIMARY KEY, title TEXT, imageUrl TEXT, linkUrl TEXT, position TEXT DEFAULT 'home', isActive INTEGER DEFAULT 1, priority INTEGER DEFAULT 0, clickCount INTEGER DEFAULT 0, createdAt INTEGER)`,
    `CREATE TABLE IF NOT EXISTS ad_clicks (id TEXT PRIMARY KEY, adId TEXT, userId TEXT, guestId TEXT, createdAt INTEGER)`
  ];
  for (const sql of tables) {
    try { await db.prepare(sql).run(); } catch (e) { console.error('Table creation error:', e); }
  }

  const alters = [
    `ALTER TABLE users ADD COLUMN coverPhoto TEXT`,
    `ALTER TABLE users ADD COLUMN bio TEXT`,
    `ALTER TABLE users ADD COLUMN shopAddress TEXT`,
    `ALTER TABLE users ADD COLUMN binanceId TEXT`,
    `ALTER TABLE users ADD COLUMN usdtTrc20 TEXT`,
    `ALTER TABLE posts ADD COLUMN category TEXT DEFAULT 'other'`,
    `ALTER TABLE posts ADD COLUMN priceAFN REAL`,
    `ALTER TABLE posts ADD COLUMN discountPrice REAL`,
    `ALTER TABLE posts ADD COLUMN discountPercent REAL`,
    `ALTER TABLE posts ADD COLUMN isSold INTEGER DEFAULT 0`,
    `ALTER TABLE posts ADD COLUMN mediaUrl TEXT`,
    `ALTER TABLE posts ADD COLUMN authorId TEXT`,
    `ALTER TABLE posts ADD COLUMN createdAt INTEGER`,
  ];
  for (const sql of alters) {
    try { await db.prepare(sql).run(); } catch (e: any) { 
      if (!e.message.includes('duplicate') && !e.message.includes('already exists')) console.error('ALTER error:', e.message);
    }
  }

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_posts_authorId ON posts(authorId)',
    'CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts(createdAt)',
    'CREATE INDEX IF NOT EXISTS idx_posts_isSold ON posts(isSold)',
    'CREATE INDEX IF NOT EXISTS idx_likes_postId ON likes(postId)',
    'CREATE INDEX IF NOT EXISTS idx_views_postId ON views(postId)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_seller_requests_status ON seller_requests(status)',
    'CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)',
    'CREATE INDEX IF NOT EXISTS idx_users_authToken ON users(authToken)',
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_online_sessions_lastPing ON online_sessions(lastPing)',
    'CREATE INDEX IF NOT EXISTS idx_daily_visits_date ON daily_visits(date)',
    'CREATE INDEX IF NOT EXISTS idx_ads_position ON ads(position)',
    'CREATE INDEX IF NOT EXISTS idx_ads_isActive ON ads(isActive)',
  ];
  for (const sql of indexes) {
    try { await db.prepare(sql).run(); } catch (e) {}
  }
}

async function ensureAdminAndDemoData(db: D1Database) {
  try {
    const admin = await db.prepare('SELECT id FROM users WHERE email = ?').bind('admin@localmarket.af').first();
    if (!admin) {
      const token = crypto.randomUUID();
      await db.prepare('INSERT INTO users (id, name, email, phone, password, authToken, isAdmin, isSeller, isApproved, createdAt, lastSeen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind('admin_001', 'Administrator', 'admin@localmarket.af', '+93 700000001', hashPassword('admin123'), token, 1, 1, 1, Date.now(), Date.now()).run();
    }
    const postCount = await db.prepare('SELECT COUNT(*) as count FROM posts').first() as any;
    if (postCount.count === 0) {
      const demos = [
        { t: 'iPhone 15 Pro Max', d: 'Brand new, 256GB', usd: 1200, afn: 104400, img: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=400' },
        { t: 'Traditional Afghan Dress', d: 'Hand embroidered', usd: 85, afn: 7395, img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400' },
        { t: 'Toyota Corolla 2019', d: 'Well maintained, 80k km', usd: 8500, afn: 739500, img: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400' },
        { t: 'Fresh Organic Honey', d: 'Pure mountain honey 1kg', usd: 15, afn: 1305, img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400' },
        { t: 'Web Development Service', d: 'Professional website', usd: 300, afn: 26100, img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400' },
        { t: 'Samsung Galaxy S24', d: 'Latest model, 128GB', usd: 950, afn: 82650, img: 'https://images.unsplash.com/photo-1610945265078-3858a0b5d8f4?w=400' },
      ];
      for (const p of demos) {
        await db.prepare('INSERT INTO posts (id, title, description, priceUSD, priceAFN, category, mediaUrl, authorId, isSold, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(), p.t, p.d, p.usd, p.afn, 'other', p.img, 'admin_001', 0, Date.now() - Math.floor(Math.random() * 86400000)).run();
      }
    }
  } catch (e) { console.error('Admin/Demo setup error:', e); }
}

async function getUserFromToken(db: D1Database, token: string | undefined) {
  if (!token) return null;
  try {
    const user = await db.prepare('SELECT id, name, email, phone, isAdmin, isSeller, isApproved, avatar, coverPhoto, bio, shopAddress, binanceId, usdtTrc20, createdAt, lastSeen FROM users WHERE authToken = ?').bind(token).first() as any;
    if (user) await db.prepare('UPDATE users SET lastSeen = ? WHERE id = ?').bind(Date.now(), user.id).run();
    return user;
  } catch { return null; }
}

async function createNotification(db: D1Database, userId: string, title: string, message: string, type: string, relatedId?: string) {
  try {
    await db.prepare('INSERT INTO notifications (id, user_id, title, message, type, related_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), userId, title, message, type, relatedId || null, Date.now()).run();
  } catch (e) { console.error('Notification error:', e); }
}

// ==========================================
// MAIN REQUEST HANDLER
// ==========================================

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const db = env.gkdatabase;

  await ensureTablesExist(db);
  await ensureAdminAndDemoData(db);

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // ---- AUTH ----
  if (path === '/api/auth/signup' && method === 'POST') {
    try {
      const { name, email, phone, password, isSellerRequest, businessName, description } = await request.json() as any;
      if (!name || !email || !password) return errorResponse('Name, email and password required', 400);
      const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
      if (existing) return errorResponse('Email already registered', 409);
      const id = crypto.randomUUID();
      const token = crypto.randomUUID();
      await db.prepare('INSERT INTO users (id, name, email, phone, password, authToken, isAdmin, isSeller, isApproved, createdAt, lastSeen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, name, email, phone || '', hashPassword(password), token, 0, 0, 0, Date.now(), Date.now()).run();
      if (isSellerRequest && businessName) {
        await db.prepare('INSERT INTO seller_requests (id, userId, userName, userEmail, phone, businessName, description, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(), id, name, email, phone || '', businessName, description || '', 'pending', Date.now()).run();
      }
      return jsonResponse({ id, name, email, token, isAdmin: false, isSeller: false, isApproved: false }, 201);
    } catch (err: any) { return errorResponse('Signup failed: ' + err.message); }
  }

  if (path === '/api/auth/login' && method === 'POST') {
    try {
      const { email, password } = await request.json() as any;
      const user = await db.prepare('SELECT id, name, email, phone, isAdmin, isSeller, isApproved, avatar, coverPhoto, bio, shopAddress, binanceId, usdtTrc20, createdAt, lastSeen FROM users WHERE email = ? AND password = ?')
        .bind(email, hashPassword(password)).first() as any;
      if (!user) return errorResponse('Invalid credentials', 401);
      const token = crypto.randomUUID();
      await db.prepare('UPDATE users SET authToken = ?, lastSeen = ? WHERE id = ?').bind(token, Date.now(), user.id).run();
      return jsonResponse({ ...user, token });
    } catch (err: any) { return errorResponse('Login failed: ' + err.message); }
  }

  if (path === '/api/auth/me' && method === 'GET') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return errorResponse('Unauthorized', 401);
      return jsonResponse(user);
    } catch (err: any) { return errorResponse('Failed: ' + err.message); }
  }

  if (path === '/api/auth/avatar' && method === 'POST') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return errorResponse('Unauthorized', 401);
      const formData = await request.formData();
      const file = formData.get('avatar') as File;
      if (!file) return errorResponse('No file uploaded', 400);
      const bytes = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
      const dataUrl = `data:${file.type};base64,${base64}`;
      await db.prepare('UPDATE users SET avatar = ? WHERE id = ?').bind(dataUrl, user.id).run();
      return jsonResponse({ avatar: dataUrl });
    } catch (err: any) { return errorResponse('Upload failed: ' + err.message); }
  }

  // ---- USER ----
  if (path === '/api/users/profile' && method === 'PATCH') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return errorResponse('Unauthorized', 401);
      const data = await request.json() as any;
      const fields: string[] = [];
      const values: any[] = [];
      if (data.name) { fields.push('name = ?'); values.push(data.name); }
      if (data.lastName) { fields.push('lastName = ?'); values.push(data.lastName); }
      if (data.phone) { fields.push('phone = ?'); values.push(data.phone); }
      if (data.whatsapp) { fields.push('whatsapp = ?'); values.push(data.whatsapp); }
      if (data.bio) { fields.push('bio = ?'); values.push(data.bio); }
      if (data.shopAddress) { fields.push('shopAddress = ?'); values.push(data.shopAddress); }
      if (data.binanceId) { fields.push('binanceId = ?'); values.push(data.binanceId); }
      if (data.usdtTrc20) { fields.push('usdtTrc20 = ?'); values.push(data.usdtTrc20); }
      if (fields.length === 0) return errorResponse('No fields to update', 400);
      values.push(user.id);
      await db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
      return jsonResponse({ success: true });
    } catch (err: any) { return errorResponse('Update failed: ' + err.message); }
  }

  if (path === '/api/users/cover' && method === 'POST') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return errorResponse('Unauthorized', 401);
      const formData = await request.formData();
      const file = formData.get('cover') as File;
      if (!file) return errorResponse('No file uploaded', 400);
      const bytes = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
      const dataUrl = `data:${file.type};base64,${base64}`;
      await db.prepare('UPDATE users SET coverPhoto = ? WHERE id = ?').bind(dataUrl, user.id).run();
      return jsonResponse({ coverPhoto: dataUrl });
    } catch (err: any) { return errorResponse('Upload failed: ' + err.message); }
  }

  // ---- POSTS ----
  if (path === '/api/posts' && method === 'GET') {
    try {
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const search = url.searchParams.get('search') || '';
      const authorId = url.searchParams.get('authorId') || '';
      const offset = (page - 1) * limit;
      let query = 'SELECT p.*, u.name as authorName, u.avatar as authorAvatar FROM posts p LEFT JOIN users u ON p.authorId = u.id WHERE 1=1';
      const params: any[] = [];
      if (search) { query += ' AND (p.title LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
      if (authorId) { query += ' AND p.authorId = ?'; params.push(authorId); }
      query += ' ORDER BY p.createdAt DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      const { results } = await db.prepare(query).bind(...params).all() as any;
      return jsonResponse(results || [], 200, 60);
    } catch (err: any) { return jsonResponse([]); }
  }

  if (path === '/api/posts' && method === 'POST') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return errorResponse('Unauthorized', 401);
      if (!user.isSeller && !user.isAdmin) return errorResponse('Only sellers can create posts', 403);
      const formData = await request.formData();
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const priceUSD = parseFloat(formData.get('priceUSD') as string) || 0;
      const priceAFN = parseFloat(formData.get('priceAFN') as string) || 0;
      const discountPrice = parseFloat(formData.get('discountPrice') as string) || null;
      const discountPercent = parseFloat(formData.get('discountPercent') as string) || null;
      const category = formData.get('category') as string || 'other';
      const file = formData.get('media') as File;
      if (!title) return errorResponse('Title is required', 400);
      let mediaUrl = '';
      if (file) {
        const bytes = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
        mediaUrl = `data:${file.type};base64,${base64}`;
      }
      const id = crypto.randomUUID();
      await db.prepare('INSERT INTO posts (id, title, description, priceUSD, priceAFN, discountPrice, discountPercent, category, mediaUrl, authorId, isSold, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, title, description || '', priceUSD, priceAFN, discountPrice, discountPercent, category, mediaUrl, user.id, 0, Date.now()).run();
      return jsonResponse({ id, success: true }, 201);
    } catch (err: any) { return errorResponse('Create failed: ' + err.message); }
  }

  if (path.startsWith('/api/posts/') && path.endsWith('/sold') && method === 'PATCH') {
    try {
      const postId = path.split('/')[3];
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return errorResponse('Unauthorized', 401);
      const post = await db.prepare('SELECT authorId, isSold FROM posts WHERE id = ?').bind(postId).first() as any;
      if (!post || (post.authorId !== user.id && !user.isAdmin)) return errorResponse('Forbidden', 403);
      const newSold = post.isSold === 1 ? 0 : 1;
      await db.prepare('UPDATE posts SET isSold = ? WHERE id = ?').bind(newSold, postId).run();
      return jsonResponse({ success: true, isSold: newSold });
    } catch (err: any) { return errorResponse('Toggle failed: ' + err.message); }
  }

  if (path.startsWith('/api/posts/') && path.endsWith('/discount') && method === 'PATCH') {
    try {
      const postId = path.split('/')[3];
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return errorResponse('Unauthorized', 401);
      const post = await db.prepare('SELECT authorId FROM posts WHERE id = ?').bind(postId).first() as any;
      if (!post || (post.authorId !== user.id && !user.isAdmin)) return errorResponse('Forbidden', 403);
      const { discountPrice, discountPercent } = await request.json() as any;
      await db.prepare('UPDATE posts SET discountPrice = ?, discountPercent = ? WHERE id = ?').bind(discountPrice || null, discountPercent || null, postId).run();
      return jsonResponse({ success: true });
    } catch (err: any) { return errorResponse('Update failed: ' + err.message); }
  }

  if (path.startsWith('/api/posts/') && path.endsWith('/like') && method === 'POST') {
    try {
      const postId = path.split('/')[3];
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return errorResponse('Unauthorized', 401);
      const existing = await db.prepare('SELECT id FROM likes WHERE postId = ? AND userId = ?').bind(postId, user.id).first();
      if (existing) {
        await db.prepare('DELETE FROM likes WHERE postId = ? AND userId = ?').bind(postId, user.id).run();
        return jsonResponse({ liked: false });
      } else {
        await db.prepare('INSERT INTO likes (id, postId, userId, createdAt) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), postId, user.id, Date.now()).run();
        return jsonResponse({ liked: true });
      }
    } catch (err: any) { return errorResponse('Like failed: ' + err.message); }
  }

  if (path.startsWith('/api/posts/') && !path.includes('/sold') && !path.includes('/discount') && !path.includes('/like') && method === 'GET') {
    try {
      const postId = path.split('/')[3];
      const post = await db.prepare('SELECT p.*, u.name as authorName, u.avatar as authorAvatar, u.phone as authorPhone, u.whatsapp as authorWhatsapp FROM posts p LEFT JOIN users u ON p.authorId = u.id WHERE p.id = ?').bind(postId).first() as any;
      if (!post) return errorResponse('Post not found', 404);
      const likeCount = await db.prepare('SELECT COUNT(*) as count FROM likes WHERE postId = ?').bind(postId).first() as any;
      const viewCount = await db.prepare('SELECT COUNT(*) as count FROM views WHERE postId = ?').bind(postId).first() as any;
      return jsonResponse({ ...post, likeCount: likeCount.count, viewCount: viewCount.count });
    } catch (err: any) { return errorResponse('Failed: ' + err.message); }
  }

  if (path.startsWith('/api/posts/') && method === 'DELETE') {
    try {
      const postId = path.split('/')[3];
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return errorResponse('Unauthorized', 401);
      const post = await db.prepare('SELECT authorId FROM posts WHERE id = ?').bind(postId).first() as any;
      if (!post || (post.authorId !== user.id && !user.isAdmin)) return errorResponse('Forbidden', 403);
      await db.prepare('DELETE FROM posts WHERE id = ?').bind(postId).run();
      await db.prepare('DELETE FROM likes WHERE postId = ?').bind(postId).run();
      await db.prepare('DELETE FROM views WHERE postId = ?').bind(postId).run();
      return jsonResponse({ success: true });
    } catch (err: any) { return errorResponse('Delete failed: ' + err.message); }
  }

  if (path.startsWith('/api/posts/user/') && method === 'GET') {
    try {
      const userId = path.split('/')[4];
      const { results } = await db.prepare('SELECT p.*, u.name as authorName, u.avatar as authorAvatar FROM posts p LEFT JOIN users u ON p.authorId = u.id WHERE p.authorId = ? ORDER BY p.createdAt DESC').bind(userId).all() as any;
      return jsonResponse(results || []);
    } catch (err: any) { return jsonResponse([]); }
  }

  if (path === '/api/posts/views/batch' && method === 'POST') {
    try {
      const { postIds } = await request.json() as any;
      if (!Array.isArray(postIds)) return jsonResponse({});
      const counts: Record<string, number> = {};
      for (const pid of postIds) {
        const res = await db.prepare('SELECT COUNT(*) as count FROM views WHERE postId = ?').bind(pid).first() as any;
        counts[pid] = res?.count || 0;
      }
      return jsonResponse(counts);
    } catch { return jsonResponse({}); }
  }

  // ---- ADS ----
  if (path === '/api/ads' && method === 'GET') {
    try {
      const position = url.searchParams.get('position') || 'home';
      const { results } = await db.prepare('SELECT * FROM ads WHERE position = ? AND isActive = 1 ORDER BY priority DESC, createdAt DESC LIMIT 10').bind(position).all() as any;
      return jsonResponse(results || [], 200, 60);
    } catch (err: any) { return jsonResponse([]); }
  }

  if (path === '/api/ads/click' && method === 'POST') {
    try {
      const { adId } = await request.json() as any;
      const guestId = request.headers.get('X-Guest-Id') || 'unknown';
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      await db.prepare('UPDATE ads SET clickCount = clickCount + 1 WHERE id = ?').bind(adId).run();
      await db.prepare('INSERT INTO ad_clicks (id, adId, userId, guestId, createdAt) VALUES (?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), adId, user?.id || null, guestId, Date.now()).run();
      return jsonResponse({ success: true });
    } catch (err: any) { return jsonResponse({ success: false }); }
  }

  // ---- MESSAGES ----
  if (path === '/api/messages/conversations' && method === 'GET') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return errorResponse('Unauthorized', 401);
      const { results } = await db.prepare(
        `SELECT c.*, u1.name as user1_name, u2.name as user2_name FROM conversations c 
         LEFT JOIN users u1 ON c.user1_id = u1.id LEFT JOIN users u2 ON c.user2_id = u2.id 
         WHERE c.user1_id = ? OR c.user2_id = ? ORDER BY c.updated_at DESC`
      ).bind(user.id, user.id).all() as any;
      return jsonResponse(results || []);
    } catch (err: any) { return jsonResponse([]); }
  }

  if (path === '/api/messages/admin-conversation' && method === 'POST') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return errorResponse('Unauthorized', 401);
      const admin = await db.prepare('SELECT id FROM users WHERE isAdmin = 1 LIMIT 1').first() as any;
      if (!admin) return errorResponse('Admin not found', 404);
      let conv = await db.prepare('SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)')
        .bind(user.id, admin.id, admin.id, user.id).first() as any;
      if (!conv) {
        const id = crypto.randomUUID();
        await db.prepare('INSERT INTO conversations (id, user1_id, user2_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
          .bind(id, user.id, admin.id, Date.now(), Date.now()).run();
        conv = { id };
      }
      return jsonResponse(conv);
    } catch (err: any) { return errorResponse('Failed: ' + err.message); }
  }

  if (path === '/api/messages' && method === 'GET') {
    try {
      const conversationId = url.searchParams.get('conversationId');
      if (!conversationId) return jsonResponse([]);
      const { results } = await db.prepare(
        'SELECT m.*, u.name as sender_name FROM messages m LEFT JOIN users u ON m.sender_id = u.id WHERE m.conversation_id = ? ORDER BY m.created_at ASC'
      ).bind(conversationId).all() as any;
      return jsonResponse(results || []);
    } catch (err: any) { return jsonResponse([]); }
  }

  if (path === '/api/messages' && method === 'POST') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return errorResponse('Unauthorized', 401);
      const { conversationId, content, recipientId } = await request.json() as any;
      if (!content) return errorResponse('Content required', 400);
      let convId = conversationId;
      if (!convId && recipientId) {
        let conv = await db.prepare('SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)')
          .bind(user.id, recipientId, recipientId, user.id).first() as any;
        if (!conv) {
          convId = crypto.randomUUID();
          await db.prepare('INSERT INTO conversations (id, user1_id, user2_id, created_at, updated_at, last_message) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(convId, user.id, recipientId, Date.now(), Date.now(), content).run();
        } else {
          convId = conv.id;
        }
      }
      const id = crypto.randomUUID();
      await db.prepare('INSERT INTO messages (id, conversation_id, sender_id, sender_name, content, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, convId, user.id, user.name, content, Date.now()).run();
      await db.prepare('UPDATE conversations SET last_message = ?, updated_at = ? WHERE id = ?').bind(content, Date.now(), convId).run();
      return jsonResponse({ id, success: true }, 201);
    } catch (err: any) { return errorResponse('Send failed: ' + err.message); }
  }

  // ---- NOTIFICATIONS ----
  if (path === '/api/notifications' && method === 'GET') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return errorResponse('Unauthorized', 401);
      const { results } = await db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').bind(user.id).all() as any;
      return jsonResponse(results || []);
    } catch (err: any) { return jsonResponse([]); }
  }

  if (path === '/api/notifications/unread' && method === 'GET') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return jsonResponse({ count: 0 });
      const res = await db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').bind(user.id).first() as any;
      return jsonResponse({ count: res?.count || 0 });
    } catch { return jsonResponse({ count: 0 }); }
  }

  if (path.match(/^\/api\/notifications\/(.+)\/read$/) && method === 'PATCH') {
    try {
      const id = path.match(/^\/api\/notifications\/(.+)\/read$/)?.[1];
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return errorResponse('Unauthorized', 401);
      await db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').bind(id, user.id).run();
      return jsonResponse({ success: true });
    } catch (err: any) { return errorResponse('Failed: ' + err.message); }
  }

  if (path === '/api/notifications/read-all' && method === 'POST') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return errorResponse('Unauthorized', 401);
      await db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').bind(user.id).run();
      return jsonResponse({ success: true });
    } catch (err: any) { return errorResponse('Failed: ' + err.message); }
  }

  // ---- SELLER REQUESTS ----
  if (path === '/api/seller-requests' && method === 'POST') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user) return errorResponse('Unauthorized', 401);
      const { businessName, description, phone } = await request.json() as any;
      await db.prepare('INSERT INTO seller_requests (id, userId, userName, userEmail, phone, businessName, description, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), user.id, user.name, user.email, phone || user.phone, businessName, description || '', 'pending', Date.now()).run();
      return jsonResponse({ success: true }, 201);
    } catch (err: any) { return errorResponse('Failed: ' + err.message); }
  }

  // ---- ADMIN ----
  if (path === '/api/admin/stats' && method === 'GET') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user?.isAdmin) return errorResponse('Forbidden', 403);
      const fiveMinAgo = Date.now() - 300000;
      const today = new Date().toISOString().split('T')[0];
      const [users, totalPosts, sellers, pending, totalVisits, totalInstalls, onlineNow, todayVisits] = await Promise.all([
        db.prepare('SELECT COUNT(*) as count FROM users').first(),
        db.prepare('SELECT COUNT(*) as count FROM posts').first(),
        db.prepare('SELECT COUNT(*) as count FROM users WHERE isSeller = 1').first(),
        db.prepare('SELECT COUNT(*) as count FROM seller_requests WHERE status = ?').bind('pending').first(),
        db.prepare('SELECT COUNT(*) as count FROM visits').first(),
        db.prepare('SELECT COUNT(DISTINCT guestId) as count FROM installs').first(),
        db.prepare('SELECT COUNT(DISTINCT COALESCE(userId, guestId)) as count FROM online_sessions WHERE lastPing >= ?').bind(fiveMinAgo).first(),
        db.prepare('SELECT visitCount as count FROM daily_visits WHERE date = ?').bind(today).first(),
      ]);
      return jsonResponse({
        users: (users as any)?.count || 0,
        totalPosts: (totalPosts as any)?.count || 0,
        sellers: (sellers as any)?.count || 0,
        pendingRequests: (pending as any)?.count || 0,
        totalVisits: (totalVisits as any)?.count || 0,
        totalInstalls: (totalInstalls as any)?.count || 0,
        onlineNow: (onlineNow as any)?.count || 0,
        todayVisits: (todayVisits as any)?.count || 0,
      });
    } catch (err: any) { return errorResponse('Failed: ' + err.message); }
  }

  if (path === '/api/admin/seller-requests' && method === 'GET') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user?.isAdmin) return errorResponse('Forbidden', 403);
      const { results } = await db.prepare('SELECT * FROM seller_requests WHERE status = ? ORDER BY createdAt DESC').bind('pending').all() as any;
      return jsonResponse(results || []);
    } catch (err: any) { return jsonResponse([]); }
  }

  if (path.match(/^\/api\/admin\/seller-requests\/(.+)\/approve$/) && method === 'POST') {
    try {
      const id = path.match(/^\/api\/admin\/seller-requests\/(.+)\/approve$/)?.[1];
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user?.isAdmin) return errorResponse('Forbidden', 403);
      const req = await db.prepare('SELECT userId FROM seller_requests WHERE id = ?').bind(id).first() as any;
      if (!req) return errorResponse('Request not found', 404);
      await db.prepare('UPDATE seller_requests SET status = ? WHERE id = ?').bind('approved', id).run();
      await db.prepare('UPDATE users SET isSeller = 1, isApproved = 1 WHERE id = ?').bind(req.userId).run();
      await createNotification(db, req.userId, 'Seller Approved', 'Your seller request has been approved!', 'seller_approved', id);
      return jsonResponse({ success: true });
    } catch (err: any) { return errorResponse('Failed: ' + err.message); }
  }

  if (path.match(/^\/api\/admin\/seller-requests\/(.+)\/reject$/) && method === 'POST') {
    try {
      const id = path.match(/^\/api\/admin\/seller-requests\/(.+)\/reject$/)?.[1];
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user?.isAdmin) return errorResponse('Forbidden', 403);
      const req = await db.prepare('SELECT userId FROM seller_requests WHERE id = ?').bind(id).first() as any;
      if (!req) return errorResponse('Request not found', 404);
      await db.prepare('UPDATE seller_requests SET status = ? WHERE id = ?').bind('rejected', id).run();
      await createNotification(db, req.userId, 'Seller Rejected', 'Your seller request has been rejected.', 'seller_rejected', id);
      return jsonResponse({ success: true });
    } catch (err: any) { return errorResponse('Failed: ' + err.message); }
  }

  if (path === '/api/admin/sellers' && method === 'GET') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user?.isAdmin) return errorResponse('Forbidden', 403);
      const { results } = await db.prepare('SELECT id, name, email, phone, isSeller, isApproved, avatar, createdAt FROM users WHERE isSeller = 1 ORDER BY createdAt DESC').all() as any;
      return jsonResponse(results || []);
    } catch (err: any) { return jsonResponse([]); }
  }

  if (path.match(/^\/api\/admin\/sellers\/(.+)\/revoke$/) && method === 'PATCH') {
    try {
      const id = path.match(/^\/api\/admin\/sellers\/(.+)\/revoke$/)?.[1];
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user?.isAdmin) return errorResponse('Forbidden', 403);
      await db.prepare('UPDATE users SET isSeller = 0, isApproved = 0 WHERE id = ?').bind(id).run();
      return jsonResponse({ success: true });
    } catch (err: any) { return errorResponse('Failed: ' + err.message); }
  }

  if (path === '/api/admin/users' && method === 'GET') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user?.isAdmin) return errorResponse('Forbidden', 403);
      const { results } = await db.prepare('SELECT id, name, email, phone, isAdmin, isSeller, isApproved, avatar, createdAt FROM users ORDER BY createdAt DESC').all() as any;
      return jsonResponse(results || []);
    } catch (err: any) { return jsonResponse([]); }
  }

  if (path.match(/^\/api\/admin\/users\/(.+)$/) && method === 'DELETE') {
    try {
      const id = path.match(/^\/api\/admin\/users\/(.+)$/)?.[1];
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user?.isAdmin) return errorResponse('Forbidden', 403);
      await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
      await db.prepare('DELETE FROM posts WHERE authorId = ?').bind(id).run();
      await db.prepare('DELETE FROM likes WHERE userId = ?').bind(id).run();
      await db.prepare('DELETE FROM notifications WHERE user_id = ?').bind(id).run();
      return jsonResponse({ success: true });
    } catch (err: any) { return errorResponse('Failed: ' + err.message); }
  }

  if (path === '/api/admin/posts' && method === 'GET') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user?.isAdmin) return errorResponse('Forbidden', 403);
      const { results } = await db.prepare('SELECT p.*, u.name as authorName FROM posts p LEFT JOIN users u ON p.authorId = u.id ORDER BY p.createdAt DESC LIMIT 100').all() as any;
      return jsonResponse(results || []);
    } catch (err: any) { return jsonResponse([]); }
  }

  if (path === '/api/admin/settings' && method === 'POST') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user?.isAdmin) return errorResponse('Forbidden', 403);
      const { binanceId, usdtAddress } = await request.json() as any;
      await db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind('binanceId', binanceId || '').run();
      await db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind('usdtAddress', usdtAddress || '').run();
      return jsonResponse({ success: true });
    } catch (err: any) { return errorResponse('Failed: ' + err.message); }
  }

  // ---- ADMIN ADS ----
  if (path === '/api/admin/ads' && method === 'GET') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user?.isAdmin) return errorResponse('Forbidden', 403);
      const { results } = await db.prepare('SELECT * FROM ads ORDER BY createdAt DESC').all() as any;
      return jsonResponse(results || []);
    } catch (err: any) { return jsonResponse([]); }
  }

  if (path === '/api/admin/ads' && method === 'POST') {
    try {
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user?.isAdmin) return errorResponse('Forbidden', 403);
      const { title, imageUrl, linkUrl, position, priority } = await request.json() as any;
      const adId = crypto.randomUUID();
      await db.prepare('INSERT INTO ads (id, title, imageUrl, linkUrl, position, priority, isActive, clickCount, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(adId, title, imageUrl, linkUrl, position || 'home', priority || 0, 1, 0, Date.now()).run();
      return jsonResponse({ id: adId, success: true });
    } catch (err: any) { return errorResponse('Failed to create ad: ' + err.message); }
  }

  if (path.match(/^\/api\/admin\/ads\/(.+)$/) && method === 'PATCH') {
    try {
      const adId = path.match(/^\/api\/admin\/ads\/(.+)$/)?.[1];
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user?.isAdmin) return errorResponse('Forbidden', 403);
      const { title, imageUrl, linkUrl, position, priority, isActive } = await request.json() as any;
      await db.prepare(`UPDATE ads SET title = COALESCE(?, title), imageUrl = COALESCE(?, imageUrl), linkUrl = COALESCE(?, linkUrl), position = COALESCE(?, position), priority = COALESCE(?, priority), isActive = COALESCE(?, isActive) WHERE id = ?`)
        .bind(title, imageUrl, linkUrl, position, priority, isActive, adId).run();
      return jsonResponse({ success: true });
    } catch (err: any) { return errorResponse('Failed to update ad: ' + err.message); }
  }

  if (path.match(/^\/api\/admin\/ads\/(.+)$/) && method === 'DELETE') {
    try {
      const adId = path.match(/^\/api\/admin\/ads\/(.+)$/)?.[1];
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      if (!user?.isAdmin) return errorResponse('Forbidden', 403);
      await db.prepare('DELETE FROM ads WHERE id = ?').bind(adId).run();
      await db.prepare('DELETE FROM ad_clicks WHERE adId = ?').bind(adId).run();
      return jsonResponse({ success: true });
    } catch (err: any) { return errorResponse('Failed to delete ad'); }
  }

  // ---- TRACKING ----
  if (path === '/api/track' && method === 'POST') {
    try {
      const data = await request.json() as any;
      const guestId = request.headers.get('X-Guest-Id') || crypto.randomUUID();
      const sessionId = data.sessionId || crypto.randomUUID();
      const userAgent = request.headers.get('User-Agent') || '';
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const country = request.headers.get('CF-IPCountry') || 'unknown';
      await db.prepare('INSERT INTO visits (id, userId, guestId, sessionId, createdAt, userAgent, deviceType, browser, platform, country, ipAddress, pageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), data.userId || null, guestId, sessionId, Date.now(), userAgent, data.deviceType || 'unknown', data.browser || 'unknown', data.platform || 'unknown', country, ip, data.pageUrl || '/').run();
      const today = new Date().toISOString().split('T')[0];
      const existing = await db.prepare('SELECT id FROM daily_visits WHERE date = ?').bind(today).first();
      if (existing) {
        await db.prepare('UPDATE daily_visits SET visitCount = visitCount + 1, updatedAt = ? WHERE date = ?').bind(Date.now(), today).run();
      } else {
        await db.prepare('INSERT INTO daily_visits (id, date, visitCount, updatedAt) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), today, 1, Date.now()).run();
      }
      return jsonResponse({ success: true });
    } catch (err: any) { return jsonResponse({ success: true }); }
  }

  if (path === '/api/track/install' && method === 'POST') {
    try {
      const data = await request.json() as any;
      const guestId = data.guestId || crypto.randomUUID();
      const userAgent = request.headers.get('User-Agent') || '';
      const country = request.headers.get('CF-IPCountry') || 'unknown';
      await db.prepare('INSERT INTO installs (id, userId, guestId, platform, userAgent, country, deviceType, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), data.userId || null, guestId, data.platform || 'unknown', userAgent, country, data.deviceType || 'unknown', Date.now()).run();
      return jsonResponse({ success: true });
    } catch (err: any) { return jsonResponse({ success: true }); }
  }

  if (path === '/api/online' && method === 'POST') {
    try {
      const data = await request.json() as any;
      const guestId = request.headers.get('X-Guest-Id') || crypto.randomUUID();
      const sessionId = data.sessionId || crypto.randomUUID();
      const auth = request.headers.get('Authorization');
      const token = auth?.split(' ')[1];
      const user = await getUserFromToken(db, token);
      const existing = await db.prepare('SELECT id FROM online_sessions WHERE sessionId = ?').bind(sessionId).first();
      if (existing) {
        await db.prepare('UPDATE online_sessions SET lastPing = ?, userId = ? WHERE sessionId = ?').bind(Date.now(), user?.id || null, sessionId).run();
      } else {
        await db.prepare('INSERT INTO online_sessions (id, userId, guestId, sessionId, lastPing) VALUES (?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(), user?.id || null, guestId, sessionId, Date.now()).run();
      }
      const tenMinAgo = Date.now() - 600000;
      await db.prepare('DELETE FROM online_sessions WHERE lastPing < ?').bind(tenMinAgo).run();
      return jsonResponse({ success: true });
    } catch (err: any) { return jsonResponse({ success: true }); }
  }

  // ---- SETTINGS & VERSION ----
  if (path === '/api/settings' && method === 'GET') {
    try {
      const { results } = await db.prepare('SELECT key, value FROM settings').all() as any;
      const settings: Record<string, string> = {};
      for (const row of (results || [])) { settings[row.key] = row.value; }
      return jsonResponse(settings);
    } catch (err: any) { return jsonResponse({}); }
  }

  if (path === '/api/version' && method === 'GET') {
    return jsonResponse({ version: '19.0.0', timestamp: Date.now() }, 200, 60);
  }

  // Fallback - return 404 for unmatched API routes
  return errorResponse('Not found', 404);
}