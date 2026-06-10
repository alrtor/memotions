import { create } from 'zustand';
import { seedComments, seedPosts, seedUsers } from '../data/seed';

const KEY = 'memotions-dynamic-store-v1';

const base = {
  users: seedUsers,
  posts: seedPosts,
  comments: seedComments,
  notifications: [],
  follows: { u1: ['u2'], u2: ['u1'], u3: [] },
  sessionUserId: 'u1',
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...base, ...JSON.parse(raw) } : base;
  } catch {
    return base;
  }
}

export const useDynStore = create((set, get) => ({
  ...load(),
  persist: () => {
    const s = get();
    localStorage.setItem(KEY, JSON.stringify({
      users: s.users, posts: s.posts, comments: s.comments, notifications: s.notifications, follows: s.follows, sessionUserId: s.sessionUserId,
    }));
  },
  login: (handle) => {
    const u = get().users.find((x) => x.handle.toLowerCase() === String(handle).toLowerCase().trim());
    if (!u) return false;
    set({ sessionUserId: u.id });
    get().persist();
    return true;
  },
  signup: (name, handle) => {
    const h = String(handle || '').trim().toLowerCase();
    if (!h || get().users.some((u) => u.handle === h)) return false;
    const u = { id: 'u' + Date.now(), name: name || h, handle: h, avatar: `https://robohash.org/${h}?set=set4&size=80x80`, bio: 'New creator' };
    set((s) => ({ users: [u, ...s.users], sessionUserId: u.id, follows: { ...s.follows, [u.id]: [] } }));
    get().persist();
    return true;
  },
  createPost: (payload) => {
    const uid = get().sessionUserId;
    if (!uid) return null;
    const p = { id: 'p' + Date.now(), userId: uid, title: payload.title, caption: payload.caption, imageUrl: payload.imageUrl || 'https://i.imgflip.com/265j.jpg', likes: [], shares: 0, remixOf: payload.remixOf || null, createdAt: Date.now() };
    set((s) => ({ posts: [p, ...s.posts], notifications: [{ id: 'n' + Date.now(), text: 'Post created', read: false }, ...s.notifications] }));
    get().persist();
    return p;
  },
  toggleLike: (postId) => {
    const uid = get().sessionUserId;
    set((s) => ({ posts: s.posts.map((p) => p.id !== postId ? p : { ...p, likes: p.likes.includes(uid) ? p.likes.filter((x) => x !== uid) : [...p.likes, uid] }) }));
    get().persist();
  },
  addComment: (postId, text) => {
    if (!text.trim()) return;
    const uid = get().sessionUserId;
    const c = { id: 'c' + Date.now(), postId, userId: uid, text: text.trim(), createdAt: Date.now() };
    set((s) => ({ comments: [...s.comments, c], notifications: [{ id: 'n' + Date.now(), text: 'New comment', read: false }, ...s.notifications] }));
    get().persist();
  },
  sharePost: (postId) => {
    set((s) => ({ posts: s.posts.map((p) => p.id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p), notifications: [{ id: 'n' + Date.now(), text: 'Post shared', read: false }, ...s.notifications] }));
    get().persist();
  },
  toggleFollow: (targetId) => {
    const uid = get().sessionUserId;
    if (!uid || uid === targetId) return;
    set((s) => {
      const arr = s.follows[uid] || [];
      const next = arr.includes(targetId) ? arr.filter((x) => x !== targetId) : [...arr, targetId];
      return { follows: { ...s.follows, [uid]: next } };
    });
    get().persist();
  },
  markAllRead: () => { set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })); get().persist(); },
}));

export const useSessionUser = () => useDynStore((s) => s.users.find((u) => u.id === s.sessionUserId));
