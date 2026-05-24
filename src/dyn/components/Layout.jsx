import { Link, useLocation } from 'react-router-dom';
import { useSessionUser } from '../store/useDynStore';
import { useDynStore } from '../store/useDynStore';

const nav = [
  ['/memotions', 'Feed', 'fa-compass'],
  ['/other', 'GIF Feed', 'fa-gift'],
  ['/trending', 'Trending', 'fa-chart-line'],
  ['/HallofFame', 'Hall of Fame', 'fa-crown'],
  ['/leaderboard', 'Leaderboard', 'fa-trophy'],
  ['/search', 'Search', 'fa-magnifying-glass'],
  ['/notifications', 'Notifications', 'fa-bell'],
  ['/profile', 'Profile', 'fa-user'],
  ['/create', 'Create', 'fa-plus-circle'],
  ['/settings', 'Settings', 'fa-gear'],
  ['/tos', 'TOS', 'fa-file-contract'],
  ['/about', 'Help', 'fa-circle-question'],
];

export function Layout({ title, children }) {
  const user = useSessionUser();
  const loc = useLocation();
  const users = useDynStore((s) => s.users.slice(0, 3));

  return (
    <div className="app-shell">
      <aside className="left-rail">
        <div className="brand-panel">
          <div className="logo-pill">M</div>
          <div>
            <p className="brand-title">Memotions</p>
            <p className="brand-sub">@{user?.handle || 'guest'}</p>
          </div>
        </div>
        <nav className="side-nav">
          {nav.map(([to, label, icon]) => (
            <Link key={to} to={to} className={`side-link ${loc.pathname === to ? 'active' : ''}`}>
              <i className={`fas ${icon}`} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <section className="center-stage">
        <header className="top-strip">
          <h1>{title}</h1>
          <div className="top-actions">
            <Link to="/create" className="action-chip">Create</Link>
            <Link to="/notifications" className="action-chip">Alerts</Link>
            <Link to="/profile" className="action-chip">Profile</Link>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </section>

      <aside className="right-rail">
        <div className="rail-card">
          <h3>Suggested Creators</h3>
          {users.map((u) => (
            <div key={u.id} className="creator-row">
              <img src={u.avatar} alt={u.name} />
              <div>
                <p>{u.name}</p>
                <span>@{u.handle}</span>
              </div>
              <Link to="/others_profile" className="follow-mini">View</Link>
            </div>
          ))}
        </div>
        <div className="rail-card">
          <h3>Quick Links</h3>
          <Link to="/trending">Top Trends</Link>
          <Link to="/HallofFame">Legend Board</Link>
          <Link to="/lineage">Remix Lineage</Link>
        </div>
      </aside>
    </div>
  );
}
