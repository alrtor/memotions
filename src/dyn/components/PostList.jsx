import { Link } from 'react-router-dom';
import { useDynStore } from '../store/useDynStore';

export function PostList({ posts }) {
  const users = useDynStore((s) => s.users);
  const comments = useDynStore((s) => s.comments);
  const me = useDynStore((s) => s.sessionUserId);
  const like = useDynStore((s) => s.toggleLike);
  const share = useDynStore((s) => s.sharePost);

  return <div className="dyn-list">{posts.map((p) => {
    const u = users.find((x) => x.id===p.userId);
    const c = comments.filter((x)=>x.postId===p.id).length;
    return <article className="dyn-card" key={p.id}>
      <div className="dyn-user"><img src={u?.avatar} alt={u?.name} /><div><b>{u?.name}</b><p>@{u?.handle}</p></div><span className="verified-dot">●</span></div>
      <h3>{p.title}</h3><p className="dyn-caption">{p.caption}</p>
      <img className="dyn-img" src={p.imageUrl} alt={p.title} />
      <div className="dyn-actions">
        <button onClick={() => like(p.id)}><i className="fas fa-heart" /> {p.likes.includes(me)?'Unlike':'Like'} {p.likes.length}</button>
        <Link to={`/comments?postId=${p.id}`}><i className="fas fa-comment" /> Comments {c}</Link>
        <Link to={`/remix?postId=${p.id}`}><i className="fas fa-code-branch" /> Remix</Link>
        <button onClick={() => share(p.id)}><i className="fas fa-share" /> Share {p.shares||0}</button>
      </div>
    </article>;
  })}</div>;
}
