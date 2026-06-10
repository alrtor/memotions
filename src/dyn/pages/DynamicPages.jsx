import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PostList } from '../components/PostList';
import { useDynStore, useSessionUser } from '../store/useDynStore';

const usePosts = () => useDynStore((s) => s.posts);

export function FeedPage() {
  return <Layout title="Feed"><PostList posts={usePosts()} /></Layout>;
}

export function OtherFeedPage() {
  const posts = usePosts().filter((p) => p.remixOf);
  return <Layout title="Other Feed"><PostList posts={posts} /></Layout>;
}

export function TrendingPage() {
  const posts = [...usePosts()].sort((a, b) => (b.likes.length + b.shares) - (a.likes.length + a.shares));
  return <Layout title="Trending"><PostList posts={posts} /></Layout>;
}

export function HofPage() {
  const posts = [...usePosts()].sort((a, b) => b.likes.length - a.likes.length).slice(0, 10);
  return <Layout title="Hall of Fame"><PostList posts={posts} /></Layout>;
}

export function LeaderboardPage() {
  const users = useDynStore((s) => s.users);
  const posts = usePosts();
  const score = users
    .map((u) => ({ u, pts: posts.filter((p) => p.userId === u.id).reduce((a, p) => a + p.likes.length + p.shares, 0) }))
    .sort((a, b) => b.pts - a.pts);
  return <Layout title="Leaderboard"><div className="dyn-card">{score.map((s, i) => <p key={s.u.id}>{i + 1}. @{s.u.handle} - {s.pts}</p>)}</div></Layout>;
}

export function SearchPage() {
  const [q, setQ] = useState('');
  const posts = usePosts();
  const filtered = useMemo(
    () => posts.filter((p) => `${p.title} ${p.caption}`.toLowerCase().includes(q.toLowerCase())),
    [posts, q],
  );
  return <Layout title="Search"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search posts" /><PostList posts={filtered} /></Layout>;
}

export function CategoriesPage() {
  const posts = usePosts();
  const categories = posts.reduce((acc, p) => {
    const key = p.remixOf ? 'Remix' : 'Original';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return <Layout title="Categories"><div className="dyn-card">{Object.entries(categories).map(([k, v]) => <p key={k}>{k}: {v}</p>)}</div></Layout>;
}

export function MoodPage() {
  const posts = usePosts();
  const moods = ['Savage', 'Wholesome', 'Dark', 'Classic'];
  const [mood, setMood] = useState(moods[0]);
  const filtered = posts.filter((p, i) => moods[i % moods.length] === mood);
  return <Layout title="Mood"><select value={mood} onChange={(e) => setMood(e.target.value)}>{moods.map((m) => <option key={m}>{m}</option>)}</select><PostList posts={filtered} /></Layout>;
}

export function CreatePage({ title = 'Create' }) {
  const create = useDynStore((s) => s.createPost);
  const nav = useNavigate();
  const [f, setF] = useState({ title: '', caption: '', imageUrl: '' });
  return <Layout title={title}><form className="dyn-card" onSubmit={(e) => { e.preventDefault(); const p = create(f); if (p) nav(`/share?postId=${p.id}`); }}><input required placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /><textarea required placeholder="Caption" value={f.caption} onChange={(e) => setF({ ...f, caption: e.target.value })} /><input placeholder="Image URL" value={f.imageUrl} onChange={(e) => setF({ ...f, imageUrl: e.target.value })} /><button type="submit">Post</button></form></Layout>;
}

export function CommentsPage() {
  const [sp] = useSearchParams();
  const id = sp.get('postId');
  const posts = usePosts();
  const post = posts.find((p) => p.id === id) || posts[0];
  const comments = useDynStore((s) => s.comments.filter((c) => c.postId === post?.id));
  const users = useDynStore((s) => s.users);
  const add = useDynStore((s) => s.addComment);
  const [t, setT] = useState('');
  return <Layout title="Comments">{post && <PostList posts={[post]} />}<form className="dyn-card" onSubmit={(e) => { e.preventDefault(); add(post.id, t); setT(''); }}><input value={t} onChange={(e) => setT(e.target.value)} placeholder="Write comment" /><button>Post</button></form><div className="dyn-card">{comments.map((c) => { const u = users.find((x) => x.id === c.userId); return <p key={c.id}><b>@{u?.handle}</b> {c.text}</p>; })}</div></Layout>;
}

export function RemixPage() {
  const [sp] = useSearchParams();
  const id = sp.get('postId');
  const posts = usePosts();
  const src = posts.find((p) => p.id === id) || posts[0];
  const create = useDynStore((s) => s.createPost);
  const nav = useNavigate();
  const [caption, setCaption] = useState('');
  return <Layout title="Remix">{src && <PostList posts={[src]} />}<form className="dyn-card" onSubmit={(e) => { e.preventDefault(); const p = create({ title: `Remix: ${src.title}`, caption, imageUrl: src.imageUrl, remixOf: src.id }); if (p) nav('/lineage'); }}><textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Your remix text" required /><button>Publish Remix</button></form></Layout>;
}

export function SharePage() {
  const [sp] = useSearchParams();
  const id = sp.get('postId');
  const posts = usePosts();
  const p = posts.find((x) => x.id === id) || posts[0];
  return <Layout title="Share">{p && <div className="dyn-card"><p>Share URL</p><code>{window.location.origin}/comments?postId={p.id}</code><PostList posts={[p]} /></div>}</Layout>;
}

export function NotificationsPage() {
  const n = useDynStore((s) => s.notifications);
  const mark = useDynStore((s) => s.markAllRead);
  return <Layout title="Notifications"><button onClick={mark}>Mark all read</button><div className="dyn-card">{n.map((x) => <p key={x.id} className={x.read ? '' : 'dyn-unread'}>{x.text}</p>)}</div></Layout>;
}

export function ProfilePage() {
  const me = useSessionUser();
  const posts = usePosts().filter((p) => p.userId === me?.id);
  return <Layout title="Profile">{me && <div className="dyn-card"><img src={me.avatar} width="64" height="64" /><h3>{me.name}</h3><p>@{me.handle}</p><p>{me.bio}</p></div>}<PostList posts={posts} /></Layout>;
}

export function OthersProfilePage() {
  const users = useDynStore((s) => s.users);
  const follow = useDynStore((s) => s.toggleFollow);
  const me = useSessionUser();
  const target = users.find((u) => u.id !== me?.id);
  const posts = usePosts().filter((p) => p.userId === target?.id);
  const follows = useDynStore((s) => s.follows[me?.id] || []);
  return <Layout title="Creator Profile">{target && <div className="dyn-card"><img src={target.avatar} width="64" height="64" /><h3>{target.name}</h3><p>@{target.handle}</p><button onClick={() => follow(target.id)}>{follows.includes(target.id) ? 'Unfollow' : 'Follow'}</button></div>}<PostList posts={posts} /></Layout>;
}

export function LineagePage() {
  const posts = usePosts();
  const lines = posts.filter((p) => p.remixOf).map((p) => ({ p, base: posts.find((x) => x.id === p.remixOf) }));
  return <Layout title="Lineage"><div className="dyn-card">{lines.map((x) => <p key={x.p.id}>{x.base?.title} {'->'} {x.p.title}</p>)}</div></Layout>;
}

export function AuthPage() {
  const login = useDynStore((s) => s.login);
  const signup = useDynStore((s) => s.signup);
  const nav = useNavigate();
  const [isSignup, setSignup] = useState(false);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [err, setErr] = useState('');
  return <Layout title="Auth"><div className="dyn-actions"><button onClick={() => setSignup(false)}>Login</button><button onClick={() => setSignup(true)}>Signup</button></div><form className="dyn-card" onSubmit={(e) => { e.preventDefault(); const ok = isSignup ? signup(name, handle) : login(handle); if (ok) nav('/memotions'); else setErr('Invalid/duplicate handle'); }}>{isSignup && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />}<input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="Handle" required /><button>{isSignup ? 'Create account' : 'Login'}</button>{err && <p className="dyn-unread">{err}</p>}</form></Layout>;
}

export function SettingsPage() {
  return <Layout title="Settings"><div className="dyn-card"><p>Account and app settings are active in this React build.</p><p>Use backup controls in the settings panel.</p><Link to="/about">Help</Link><br /><Link to="/tos">Terms of Service</Link></div></Layout>;
}

export function AboutPage() {
  return <Layout title="Help Center"><div className="dyn-card"><p>Memotions Help</p><p>Use Create to post memes, Comments to discuss, Remix to fork content, and Hall of Fame to discover top creators.</p><p>For policy details see <Link to="/privacy">Privacy</Link> and <Link to="/tos">TOS</Link>.</p></div></Layout>;
}

export function PrivacyPage() {
  return <Layout title="Privacy Policy"><div className="dyn-card"><p>This app stores product data in browser local storage for demo/testing mode.</p></div></Layout>;
}

export function TosPage() {
  return <Layout title="Terms of Service"><div className="dyn-card"><p>No abuse, illegal content, or impersonation. Respect creator ownership and community guidelines.</p></div></Layout>;
}

export function LogoPage() {
  return <Layout title="Logo"><div className="dyn-card"><h2>Memotions</h2><p>Brand playground page.</p></div></Layout>;
}
