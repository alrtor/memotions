import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const HTML_ROUTE_MAP = {
  '/about.html': '/about',
  '/auth.html': '/auth',
  '/categories.html': '/categories',
  '/comments.html': '/comments',
  '/create_backup.html': '/create_backup',
  '/create.html': '/create',
  '/HallofFame.html': '/HallofFame',
  '/leaderboard.html': '/leaderboard',
  '/lineage.html': '/lineage',
  '/logo.html': '/logo',
  '/memotions.html': '/memotions',
  '/mood.html': '/mood',
  '/notifications.html': '/notifications',
  '/other.html': '/other',
  '/others_profile.html': '/others_profile',
  '/own_profile.html': '/own_profile',
  '/privacy.html': '/privacy',
  '/profile.html': '/profile',
  '/profile_backup.html': '/profile_backup',
  '/remix.html': '/remix',
  '/search.html': '/search',
  '/settings.html': '/settings',
  '/share.html': '/share',
  '/tos.html': '/tos',
  '/trending.html': '/trending',
  'about.html': '/about',
  'auth.html': '/auth',
  'categories.html': '/categories',
  'comments.html': '/comments',
  'create_backup.html': '/create_backup',
  'create.html': '/create',
  'HallofFame.html': '/HallofFame',
  'leaderboard.html': '/leaderboard',
  'lineage.html': '/lineage',
  'logo.html': '/logo',
  'memotions.html': '/memotions',
  'mood.html': '/mood',
  'notifications.html': '/notifications',
  'other.html': '/other',
  'others_profile.html': '/others_profile',
  'own_profile.html': '/own_profile',
  'privacy.html': '/privacy',
  'profile.html': '/profile',
  'profile_backup.html': '/profile_backup',
  'remix.html': '/remix',
  'search.html': '/search',
  'settings.html': '/settings',
  'share.html': '/share',
  'tos.html': '/tos',
  'trending.html': '/trending',
};

function rewriteHtmlLinks(input) {
  let out = input;
  for (const [from, to] of Object.entries(HTML_ROUTE_MAP)) {
    out = out.replaceAll(`"${from}"`, `"${to}"`);
    out = out.replaceAll(`'${from}'`, `'${to}'`);
    out = out.replaceAll(`=${from}`, `=${to}`);
    out = out.replaceAll(`"./${from}"`, `"${to}"`);
    out = out.replaceAll(`'./${from}'`, `'${to}'`);
    out = out.replaceAll(`"../${from}"`, `"${to}"`);
    out = out.replaceAll(`'../${from}'`, `'${to}'`);
  }
  return out;
}

function parseJsonArray(raw, fallback = []) {
  try {
    const value = JSON.parse(raw ?? '[]');
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function executeScripts(container) {
  const scripts = Array.from(container.querySelectorAll('script'));
  for (const oldScript of scripts) {
    const src = oldScript.getAttribute('src') || '';
    if (src.includes('/bridge.js') || src.endsWith('bridge.js')) {
      oldScript.remove();
      continue;
    }
    const newScript = document.createElement('script');
    for (const attr of oldScript.attributes) {
      newScript.setAttribute(attr.name, attr.value);
    }
    if (oldScript.textContent) {
      // Run inline page scripts in an isolated function scope so route-to-route
      // swaps (e.g. others_profile <-> own_profile) don't crash on redeclared
      // top-level const/let variables from previous pages.
      newScript.textContent = `(function(){\n${oldScript.textContent}\n})();`;
    }
    oldScript.replaceWith(newScript);
  }
}

function bindSpaNavigation(container, navigate) {
  if (!container || container.dataset.memotionsSpaNavBound === '1') return;
  container.dataset.memotionsSpaNavBound = '1';
  container.addEventListener('click', (event) => {
    if (event.defaultPrevented) return;
    const anchor = event.target.closest('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (anchor.hasAttribute('download') || anchor.target === '_blank') return;
    if (href.startsWith('http://') || href.startsWith('https://')) {
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      navigate(`${url.pathname}${url.search}${url.hash}`);
      return;
    }
    if (!href.startsWith('/')) return;
    event.preventDefault();
    if (href === window.location.pathname) {
      window.location.assign(href);
      return;
    }
    navigate(href);
  });
}

function injectSidebarAndPolicyLinks(container) {
  if (!container) return;

  const app =
    container.querySelector('.app') ||
    container;
  let leftSidebar = container.querySelector('.left-sidebar');
  if (!leftSidebar) {
    leftSidebar = document.createElement('aside');
    leftSidebar.className = 'left-sidebar';
    app.prepend(leftSidebar);
  }

  leftSidebar.innerHTML = `
    <div class="logo-area">
      <div class="logo"><i class="fas fa-face-smile"></i> <span>Memotions</span></div>
    </div>
    <div class="nav-menu">
      <a class="nav-item" href="/memotions"><i class="fas fa-compass"></i><span>For You</span></a>
      <a class="nav-item" href="/trending"><i class="fas fa-chart-line"></i><span>Trending</span></a>
      <a class="nav-item" href="/others_profile"><i class="fas fa-user-group"></i><span>Other Profile</span></a>
      <a class="nav-item" href="/create"><i class="fas fa-plus-circle"></i><span>Create</span></a>
      <a class="nav-item" href="#" id="sidebarUploadMemeBtn"><i class="fas fa-upload"></i><span>Upload Meme</span></a>
      <a class="nav-item" href="/HallofFame"><i class="fas fa-crown"></i><span>Hall of Fame</span></a>
      <a class="nav-item" href="/settings"><i class="fas fa-gear"></i><span>Settings</span></a>
    </div>
    <a class="sidebar-profile" href="/own_profile">
      <img class="sidebar-profile-avatar" src="https://robohash.org/memotionsprofile?set=set4&size=80x80" alt="Your profile" />
      <div class="sidebar-profile-meta">
        <div class="sidebar-profile-name">Your Profile</div>
        <div class="sidebar-profile-handle">@memotions_user</div>
      </div>
      <i class="fas fa-chevron-right"></i>
    </a>
    <button id="sidebarLogoutBtn" type="button" style="margin-top:.55rem;background:#3b0d16;border:1px solid #7f1d1d;color:#fecaca;border-radius:.75rem;padding:.55rem .75rem;font-size:.82rem;cursor:pointer;text-align:left;display:flex;align-items:center;gap:.45rem;">
      <i class="fas fa-right-from-bracket"></i><span>Logout</span>
    </button>
    <div class="bottom-links">About · Help · Terms<br>Privacy · Cookies<br>© 2026 Memotions</div>
  `;

  // Canonical memotions.html sidebar style
  leftSidebar.style.cssText =
    'position:fixed;left:0;top:0;bottom:0;width:280px;background:#0c0c14;border-right:1px solid #1a1a28;display:flex;flex-direction:column;padding:2rem 1.25rem;overflow:auto;z-index:9998;';

  const logoEl = leftSidebar.querySelector('.logo');
  if (logoEl) {
    // Match tos.html logo treatment
    logoEl.style.cssText = "display:flex;justify-content:flex-start;align-items:center;gap:.5rem;font-family:'Irish Grover',cursive;font-size:1.5rem;margin-bottom:1.15rem;";
  }
  const logoIcon = leftSidebar.querySelector('.logo i');
  if (logoIcon) {
    logoIcon.style.cssText = 'background:linear-gradient(135deg,#8b5cf6,#ec4899);padding:.5rem;border-radius:1rem;font-size:1.2rem;color:#fff;line-height:1;';
  }
  const logoText = leftSidebar.querySelector('.logo span');
  if (logoText) {
    logoText.style.cssText = 'background:linear-gradient(135deg,#fff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;color:transparent;display:inline-block;';
  }

  const navMenu = leftSidebar.querySelector('.nav-menu');
  if (navMenu) navMenu.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:.25rem;margin-top:1.25rem;';
  leftSidebar.querySelectorAll('.nav-item').forEach((row) => {
    row.style.cssText = 'display:flex;align-items:center;gap:.875rem;padding:.875rem 1.125rem;border-radius:.875rem;font-weight:500;font-size:1rem;color:#9ca3af;text-decoration:none;transition:all .2s ease;cursor:pointer;';
    const icon = row.querySelector('i');
    if (icon) icon.style.cssText = 'width:1.5rem;font-size:1.375rem;color:#6b7280;';
  });

  const currentPath = window.location.pathname === '/' ? '/memotions' : window.location.pathname;
  leftSidebar.querySelectorAll('.nav-item').forEach((node) => {
    node.classList.remove('active');
    node.style.background = 'transparent';
    node.style.color = '#9ca3af';
    const icon = node.querySelector('i');
    if (icon) icon.style.color = '#6b7280';
  });
  const active = Array.from(leftSidebar.querySelectorAll('.nav-item')).find((node) => node.getAttribute('href') === currentPath) || leftSidebar.querySelector('.nav-item[href="/memotions"]');
  if (active) {
    active.classList.add('active');
    active.style.background = '#1a1a2a';
    active.style.color = '#fff';
    const icon = active.querySelector('i');
    if (icon) icon.style.color = '#a78bfa';
  }

  // Sidebar links should always load target pages reliably.
  // Use hard navigation to avoid stale in-page script state blocking SPA transitions.
  leftSidebar.querySelectorAll('.nav-item[href^="/"]').forEach((node) => {
    if (node.dataset.forceNavBound === '1') return;
    node.dataset.forceNavBound = '1';
    node.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const href = node.getAttribute('href');
      if (!href) return;
      window.location.assign(href);
    }, true);
  });

  const sidebarProfile = leftSidebar.querySelector('.sidebar-profile');
  if (sidebarProfile) {
    let currentUser = null;
    try {
      currentUser = JSON.parse(localStorage.getItem('memotions_demo_user') || 'null');
    } catch {
      currentUser = null;
    }
    const storedAvatar = localStorage.getItem('memotions_profile_avatar') || '';
    const profileName =
      (currentUser?.name && String(currentUser.name).trim()) ||
      'Your Profile';
    const profileHandle =
      (currentUser?.email ? `@${String(currentUser.email).split('@')[0]}` : '@memotions_user');
    const profileAvatar =
      storedAvatar ||
      'https://robohash.org/memotionsprofile?set=set4&size=80x80';
    const sidebarName = sidebarProfile.querySelector('.sidebar-profile-name');
    const sidebarHandle = sidebarProfile.querySelector('.sidebar-profile-handle');
    const sidebarAvatar = sidebarProfile.querySelector('.sidebar-profile-avatar');
    if (sidebarName) sidebarName.textContent = profileName;
    if (sidebarHandle) sidebarHandle.textContent = profileHandle.startsWith('@') ? profileHandle : `@${profileHandle.replace(/^@+/, '')}`;
    if (sidebarAvatar) sidebarAvatar.setAttribute('src', profileAvatar);

    sidebarProfile.style.cssText = 'display:flex;align-items:center;gap:.7rem;padding:.75rem .85rem;margin-top:.5rem;border-radius:.85rem;background:#14162a;border:1px solid #23263f;text-decoration:none;color:#e5e7eb;';
    const chev = sidebarProfile.querySelector('i');
    if (chev) chev.style.cssText = 'margin-left:auto;color:#6b7280;font-size:.75rem;';
    if (sidebarAvatar) sidebarAvatar.style.cssText = 'width:34px;height:34px;border-radius:999px;object-fit:cover;flex-shrink:0;border:1px solid #2f3354;';
    const meta = sidebarProfile.querySelector('.sidebar-profile-meta');
    if (meta) meta.style.cssText = 'display:flex;flex-direction:column;gap:1px;min-width:0;';
    if (sidebarName) sidebarName.style.cssText = 'font-size:.86rem;font-weight:600;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;';
    if (sidebarHandle) sidebarHandle.style.cssText = 'font-size:.74rem;color:#94a3b8;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;';
  }

  // lock same placement relationship everywhere
  const path = window.location.pathname;
  const isFeedLayout = path === '/memotions' || path === '/other';
  const preserveOriginalWidthRoutes = new Set([
    '/own_profile',
    '/trending',
    '/others_profile',
    '/notifications',
    '/create',
  ]);
  const contentRoots = container.querySelectorAll(
    '.main-feed, .app > :not(.left-sidebar), body > :not(.left-sidebar), main, .content, .meme-studio, .comments-container, .share-layout'
  );
  contentRoots.forEach((el) => {
    if (!el || el === leftSidebar) return;
    if (!el.style) return;
    if (isFeedLayout || preserveOriginalWidthRoutes.has(path)) {
      el.style.marginLeft = '0';
    } else {
      el.style.marginLeft = '306px';
    }
  });
  if (app?.style) {
    if (isFeedLayout) {
      app.style.paddingLeft = '280px';
    }
    if (path === '/settings') {
      app.style.maxWidth = 'none';
      app.style.width = '100%';
      app.style.margin = '0';
      app.style.paddingLeft = '280px';
    }
    if (preserveOriginalWidthRoutes.has(path)) {
      app.style.maxWidth = 'none';
      app.style.width = '100%';
      app.style.margin = '0';
      app.style.paddingLeft = '280px';
      app.style.paddingRight = '0';
    }
  }

  const bottomLinks = leftSidebar.querySelector('.bottom-links');
  if (bottomLinks) {
    bottomLinks.style.cssText = 'margin-top:.8rem;font-size:.8125rem;color:#4b5563;padding:1.25rem .75rem;font-weight:400;line-height:1.6;border-top:1px solid rgba(139,92,246,.26);';
    bottomLinks.innerHTML =
      `<a href="/about" style="color:inherit;text-decoration:none;">About</a>` +
      ` <span style="opacity:.8;">·</span> ` +
      `<a href="/about" style="color:inherit;text-decoration:none;">Help</a>` +
      ` <span style="opacity:.8;">·</span> ` +
      `<a href="/tos" style="color:inherit;text-decoration:none;">Terms</a><br>` +
      `<a href="/privacy" style="color:inherit;text-decoration:none;">Privacy</a>` +
      ` <span style="opacity:.8;">·</span> ` +
      `<a href="/privacy?section=cookies" style="color:inherit;text-decoration:none;">Cookies</a>`;
  }

  const logoutBtn = leftSidebar.querySelector('#sidebarLogoutBtn');
  if (logoutBtn && logoutBtn.dataset.hoverBound !== '1') {
    logoutBtn.dataset.hoverBound = '1';
    logoutBtn.addEventListener('mouseenter', () => {
      logoutBtn.style.background = '#7f1d1d';
      logoutBtn.style.borderColor = '#991b1b';
      logoutBtn.style.color = '#fff';
    });
    logoutBtn.addEventListener('mouseleave', () => {
      logoutBtn.style.background = '#3b0d16';
      logoutBtn.style.borderColor = '#7f1d1d';
      logoutBtn.style.color = '#fecaca';
    });
  }
}

function applyMemotionsRightSidebarForSelectedRoutes(container) {
  if (!container) return;
  const path = window.location.pathname;
  const targetRoutes = new Set([
    '/own_profile',
    '/trending',
    '/others_profile',
    '/notifications',
    '/create',
  ]);
  if (!targetRoutes.has(path)) return;
  const isProfileRoute = path === '/own_profile' || path === '/others_profile';
  const alignWithTopBarRoutes = new Set(['/own_profile', '/others_profile', '/trending']);

  const app = container.querySelector('.app') || container;
  const rightSidebar =
    container.querySelector('.right-sidebar') ||
    container.querySelector('.sidebar-right') ||
    container.querySelector('aside.right-sidebar');
  if (!rightSidebar) return;

  rightSidebar.style.cssText =
    'position:fixed;right:0;top:0;bottom:0;width:320px;background:#0c0c14;border-left:1px solid #1a1a28;padding:2rem 1.5rem;overflow-y:auto;z-index:9997;';
  rightSidebar.setAttribute('data-memotions-right-fixed', '1');
  rightSidebar.classList.add('memotions-right-like');
  if (alignWithTopBarRoutes.has(path)) {
    const topNav = container.querySelector('.top-nav, .top-bar');
    const topOffset = Math.max(0, Math.round(topNav?.getBoundingClientRect?.().height || 64));
    rightSidebar.style.top = `${topOffset}px`;
    rightSidebar.style.height = `calc(100vh - ${topOffset}px)`;
  } else {
    rightSidebar.style.top = '0';
    rightSidebar.style.height = '100vh';
  }

  if (app?.style) {
    app.style.maxWidth = 'none';
    app.style.width = '100%';
    app.style.margin = '0';
    app.style.paddingRight = isProfileRoute ? '320px' : '320px';
  }

  const mainAreas = container.querySelectorAll(
    '.main-feed, .main-layout, .trending-layout, .profile-content, .notifications-container, .meme-studio, .content, main'
  );
  mainAreas.forEach((node) => {
    if (!node || node === rightSidebar || !node.style) return;
    node.style.maxWidth = 'none';
    // App-level paddingRight already reserves sidebar width.
    // Extra per-layout marginRight creates the blank middle column.
    node.style.marginRight = '0';
  });

  if (path === '/own_profile' || path === '/others_profile') {
    const profileMain = container.querySelector('.profile-content');
    if (profileMain?.style) {
      profileMain.style.paddingLeft = '18px';
      profileMain.style.paddingRight = '18px';
      profileMain.style.maxWidth = '100%';
      profileMain.style.marginLeft = '0';
    }
    const mainLayout = container.querySelector('.main-layout');
    if (mainLayout?.style) {
      mainLayout.style.gap = '1rem';
      mainLayout.style.marginRight = '0';
    }
  }

  let style = document.getElementById('memotions-fixed-right-sidebar-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'memotions-fixed-right-sidebar-style';
    style.textContent = `
      @media (max-width: 1024px) {
        [data-memotions-right-fixed="1"] { display: none !important; }
        .app { padding-right: 0 !important; }
        .main-feed, .main-layout, .trending-layout, .profile-content, .notifications-container, .meme-studio, .content, main {
          margin-right: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  let layoutStyle = document.getElementById('memotions-right-like-layout-style');
  if (!layoutStyle) {
    layoutStyle = document.createElement('style');
    layoutStyle.id = 'memotions-right-like-layout-style';
    layoutStyle.textContent = `
      [data-memotions-right-fixed="1"].memotions-right-like .sidebar-card,
      [data-memotions-right-fixed="1"].memotions-right-like .trending-card,
      [data-memotions-right-fixed="1"].memotions-right-like .widget,
      [data-memotions-right-fixed="1"].memotions-right-like .panel,
      [data-memotions-right-fixed="1"].memotions-right-like .card {
        background: transparent !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 0 1.25rem 0 !important;
      }
      [data-memotions-right-fixed="1"].memotions-right-like .sidebar-title {
        display: flex !important;
        align-items: center !important;
        gap: .5rem !important;
        margin: 0 0 .9rem 0 !important;
        padding: 0 !important;
        font-size: .875rem !important;
        font-weight: 600 !important;
        color: #9ca3af !important;
      }
      [data-memotions-right-fixed="1"].memotions-right-like .sidebar-title i {
        color: #8b5cf6 !important;
      }
      [data-memotions-right-fixed="1"].memotions-right-like .suggestion-item,
      [data-memotions-right-fixed="1"].memotions-right-like .creator-item,
      [data-memotions-right-fixed="1"].memotions-right-like .trending-item {
        margin: 0 0 1rem 0 !important;
        padding: .2rem 0 !important;
      }
      [data-memotions-right-fixed="1"].memotions-right-like .follow-btn-sm,
      [data-memotions-right-fixed="1"].memotions-right-like .follow-btn {
        background: #8b5cf6 !important;
        border: 1px solid #8b5cf6 !important;
        border-radius: 2rem !important;
        color: #fff !important;
      }
      [data-memotions-right-fixed="1"].memotions-right-like .follow-btn-sm[data-on="1"],
      [data-memotions-right-fixed="1"].memotions-right-like .follow-btn[data-on="1"] {
        background: transparent !important;
        border-color: #374151 !important;
        color: #d1d5db !important;
      }
      [data-memotions-right-fixed="1"].memotions-right-like .sidebar-card {
        border-bottom: 1px solid rgba(139, 92, 246, .3) !important;
        padding-bottom: .9rem !important;
        margin-bottom: .95rem !important;
      }
      [data-memotions-right-fixed="1"].memotions-right-like .sidebar-card:last-child {
        border-bottom: 0 !important;
        margin-bottom: 0 !important;
      }
      [data-memotions-right-fixed="1"].memotions-right-like .suggestion-item,
      [data-memotions-right-fixed="1"].memotions-right-like .creator-item,
      [data-memotions-right-fixed="1"].memotions-right-like .trending-item {
        border-bottom: 1px solid rgba(139, 92, 246, .22) !important;
        padding-bottom: .78rem !important;
        margin-bottom: .78rem !important;
      }
      [data-memotions-right-fixed="1"].memotions-right-like .suggestion-item:last-child,
      [data-memotions-right-fixed="1"].memotions-right-like .creator-item:last-child,
      [data-memotions-right-fixed="1"].memotions-right-like .trending-item:last-child {
        border-bottom: 0 !important;
      }
      [data-memotions-right-fixed="1"].memotions-right-like .trending-tag,
      [data-memotions-right-fixed="1"].memotions-right-like .tag {
        border-bottom: 1px solid rgba(139, 92, 246, .22) !important;
        padding-bottom: .45rem !important;
        margin-bottom: .5rem !important;
      }
      [data-memotions-right-fixed="1"].memotions-right-like .trending-tag:last-child,
      [data-memotions-right-fixed="1"].memotions-right-like .tag:last-child {
        border-bottom: 0 !important;
      }
    `;
    document.head.appendChild(layoutStyle);
  }

  // Make right-sidebar trending items open post modal on any click area (no old toast behavior).
  rightSidebar.querySelectorAll('.trending-item').forEach((item) => {
    if (item.dataset.rsModalBound === '1') return;
    item.dataset.rsModalBound = '1';
    item.style.cursor = 'pointer';
    item.addEventListener('click', (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      evt.stopImmediatePropagation?.();
      const img = item.querySelector('img')?.getAttribute('src') || '';
      const caption =
        item.querySelector('.meme-title, .title, .trending-title, h4, h5, span')?.textContent?.trim() ||
        'Trending meme';
      const statLine = (item.textContent || '').replace(/\s+/g, ' ').trim();
      const tokens = statLine.match(/\d+(?:\.\d+)?\s*[KkMm]?/g) || [];
      const likes =
        item.querySelector('.likes')?.textContent?.trim() ||
        item.querySelector('.stat')?.textContent?.trim() ||
        tokens[0] ||
        '0';
      const comments =
        item.querySelector('.comments')?.textContent?.trim() ||
        tokens[1] ||
        '0';
      window.__openUnifiedPostModal?.({
        id: item.getAttribute('data-id') || item.getAttribute('data-post-id') || `rs_${Date.now()}`,
        image: img,
        caption,
        creator: 'gif_goddess',
        likes,
        comments,
      });
    }, true);
  });

}

function cleanupProfileQuickFilters(container) {
  if (!container) return;
  const path = window.location.pathname;
  if (path !== '/own_profile' && path !== '/others_profile') return;
  const root = container.querySelector('.profile-content') || container.querySelector('.main-content') || container;
  const chips = Array.from(root.querySelectorAll('.quick-chip, .stat-chip, .chip, .trending-chip, button, span'));
  const removeTextsOwn = new Set(['Top Memes', 'Best GIFs', 'Trending']);
  const removeTextsOthers = new Set(['Top GIFs', 'Premium', 'Trending', 'Viral']);
  chips.forEach((el) => {
    if (el.closest('.left-sidebar, .right-sidebar, .profile-tabs')) return;
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    const shouldRemove = path === '/own_profile' ? removeTextsOwn.has(text) : removeTextsOthers.has(text);
    if (shouldRemove) el.remove();
  });

  // Remove empty quick-filter wrappers and duplicate horizontal separators left behind.
  root.querySelectorAll('section, div').forEach((node) => {
    if (node.closest('.left-sidebar, .right-sidebar, .profile-tabs')) return;
    const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
    const hasMedia = node.querySelector('img,button,input,textarea,select,a');
    if (!text && !hasMedia && node.children.length <= 1) {
      const st = window.getComputedStyle(node);
      const hasRule = parseFloat(st.borderTopWidth || '0') > 0 || parseFloat(st.borderBottomWidth || '0') > 0;
      if (hasRule || st.minHeight === '1px' || st.height === '1px') node.remove();
    }
  });
  const hrs = Array.from(root.querySelectorAll('hr, .separator, .divider'));
  hrs.forEach((hr, idx) => {
    const prev = hrs[idx - 1];
    if (!prev) return;
    const gap = Math.abs(hr.getBoundingClientRect().top - prev.getBoundingClientRect().top);
    if (gap < 6) hr.remove();
  });
}

function injectGlobalShareCtas(container) {
  if (!container) return;
  const path = window.location.pathname;
  const isAllowedSurface =
    path === '/memotions' ||
    path === '/other' ||
    path === '/profile' ||
    path === '/others_profile' ||
    path === '/own_profile';
  if (!isAllowedSurface) return;
  const persistSharePayload = (payload) => {
    try {
      localStorage.setItem('memotions_share_meme', JSON.stringify(payload));
    } catch {
      // ignore storage failures and still navigate
    }
  };
  const openShareDialog = (payload) => {
    window.__memotionsOpenShareDialog?.(payload);
  };

  const shareTargets = container.querySelectorAll('.share-btn, [data-action="share"], #shareBtn, .post-action#shareBtn');
  shareTargets.forEach((el) => {
    if (el.dataset.reactShareBound === '1') return;
    el.dataset.reactShareBound = '1';
    el.addEventListener(
      'click',
      (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        evt.stopImmediatePropagation?.();

        const card = el.closest('.meme-card, .post-card, .grid-item, .post-side') || container;
        const image = card.querySelector('img')?.src || '';
        const caption =
          card.querySelector('.meme-caption')?.textContent?.trim() ||
          card.querySelector('.post-caption')?.textContent?.trim() ||
          card.querySelector('.caption')?.textContent?.trim() ||
          'Shared from Memotions';
        const creator =
          card.querySelector('.creator-name')?.textContent?.trim() ||
          card.querySelector('.post-author-name')?.textContent?.trim() ||
          card.querySelector('.username')?.textContent?.trim() ||
          'memotions_user';

        const postId =
          card.getAttribute('data-id') ||
          card.getAttribute('data-post-id') ||
          el.getAttribute('data-id') ||
          `post-${Date.now()}`;
        const payload = {
          id: postId,
          creator,
          caption,
          image,
          likes:
            card.querySelector('.like-count')?.textContent?.trim() ||
            card.querySelector('.action-btn.like-btn span')?.textContent?.trim() ||
            card.querySelector('.card-stats span:nth-child(1)')?.textContent?.trim() ||
            card.querySelector('.likes')?.textContent?.trim() ||
            '0',
          comments:
            card.querySelector('.action-btn.comment-btn span')?.textContent?.trim() ||
            card.querySelector('.card-stats span:nth-child(2)')?.textContent?.trim() ||
            card.querySelector('.comments')?.textContent?.trim() ||
            '0',
          shares:
            card.querySelector('.action-btn.share-btn span')?.textContent?.trim() ||
            card.querySelector('.card-stats span:nth-child(3)')?.textContent?.trim() ||
            '0',
        };
        persistSharePayload(payload);
        openShareDialog(payload);
      },
      true
    );
  });
}

function injectShareDialog(container) {
  if (!container || window.__memotionsShareDialogReady) return;
  let dlg = document.getElementById('memotions-share-dialog');
  if (!dlg) {
    dlg = document.createElement('div');
    dlg.id = 'memotions-share-dialog';
    dlg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;z-index:10030;padding:16px;';
    dlg.innerHTML = `
      <div style="width:min(1120px,96vw);height:min(86vh,820px);background:#0a0a10;border:1px solid #1f2338;border-radius:16px;overflow:hidden;color:#fff;box-shadow:0 22px 60px rgba(0,0,0,.6);display:flex;flex-direction:column;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid #1a1a28;background:#0c0c14;">
          <strong style="font-size:.95rem;color:#e5e7eb;">Share</strong>
          <button id="memotions-share-close" type="button" style="border:0;background:transparent;color:#9ca3af;font-size:1.35rem;cursor:pointer;">×</button>
        </div>
        <div id="mem-share-layout" style="display:flex;min-height:0;flex:1;">
          <div style="flex:1;background:#0a0a12;display:flex;align-items:stretch;justify-content:stretch;padding:0;border-right:1px solid #1a1a28;min-height:0;">
            <div style="width:100%;height:100%;margin:0;">
              <div style="background:#12121c;border:0;border-radius:0;overflow:hidden;width:100%;height:100%;display:flex;flex-direction:column;">
                <div style="display:flex;align-items:center;gap:.8rem;padding:.8rem 1rem;flex-shrink:0;border-bottom:1px solid #1f1f2e;">
                  <img id="memotions-share-avatar" src="https://robohash.org/memecreator?set=set4&size=50x50" alt="avatar" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />
                  <div style="flex:1;">
                    <div id="memotions-share-creator" style="font-weight:700;font-size:.85rem;"></div>
                    <div style="font-size:.6rem;color:#6b7280;">Just now</div>
                  </div>
                </div>
                <div style="flex:1;min-height:0;background:#000;display:flex;align-items:center;justify-content:center;">
                  <img id="memotions-share-thumb" alt="post" style="width:100%;height:100%;object-fit:contain;background:#000;display:block;" />
                </div>
                <div id="memotions-share-caption" style="padding:.8rem 1rem;font-size:.8rem;color:#d1d5db;border-top:1px solid #1f1f2e;flex-shrink:0;"></div>
              </div>
            </div>
          </div>
          <div style="width:380px;max-width:100%;background:#0c0c14;border-left:1px solid #1a1a28;padding:1rem;display:flex;flex-direction:column;">
            <div style="margin-bottom:1rem;">
              <h2 style="font-size:1.1rem;font-weight:600;display:flex;align-items:center;gap:.5rem;"><i class="fas fa-share-alt"></i> Share this meme</h2>
              <p style="font-size:.75rem;color:#9ca3af;margin-top:.25rem;">Share with friends and across platforms</p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.65rem;margin-bottom:1rem;">
              <button class="ms-share-opt" data-platform="whatsapp" type="button"><i class="fab fa-whatsapp"></i> WhatsApp</button>
              <button class="ms-share-opt" data-platform="instagram" type="button"><i class="fab fa-instagram"></i> Instagram</button>
              <button class="ms-share-opt" data-platform="twitter" type="button"><i class="fab fa-twitter"></i> Twitter</button>
              <button class="ms-share-opt" data-platform="facebook" type="button"><i class="fab fa-facebook"></i> Facebook</button>
              <button class="ms-share-opt" data-platform="reddit" type="button"><i class="fab fa-reddit-alien"></i> Reddit</button>
              <button class="ms-share-opt" data-platform="telegram" type="button"><i class="fab fa-telegram"></i> Telegram</button>
              <button class="ms-share-opt" data-platform="discord" type="button"><i class="fab fa-discord"></i> Discord</button>
              <button class="ms-share-opt" data-platform="copy" type="button"><i class="fas fa-link"></i> Copy Link</button>
            </div>
            <div style="background:#12121c;border:1px solid #2d2d40;border-radius:.8rem;padding:.7rem .85rem;margin-bottom:.7rem;display:flex;align-items:center;gap:.5rem;">
              <i class="fas fa-link" style="color:#6b7280;"></i>
              <input id="memotions-share-link" type="text" readonly style="flex:1;background:transparent;border:0;outline:0;color:#fff;font-size:.72rem;" />
              <button id="memotions-share-copy-btn" type="button" style="background:#1a1a28;border:1px solid #374151;padding:.3rem .7rem;border-radius:.5rem;font-size:.65rem;cursor:pointer;color:#e5e7eb;">Copy</button>
            </div>
            <div style="display:flex;justify-content:space-around;padding:.8rem 0;border-top:1px solid #1f1f2e;border-bottom:1px solid #1f1f2e;margin-bottom:.7rem;">
              <div style="text-align:center;"><div id="memotions-like-count" style="font-weight:700;font-size:.9rem;color:#a78bfa;">0</div><div style="font-size:.55rem;color:#6b7280;">Likes</div></div>
              <div style="text-align:center;"><div id="memotions-comment-count" style="font-weight:700;font-size:.9rem;color:#a78bfa;">0</div><div style="font-size:.55rem;color:#6b7280;">Comments</div></div>
              <div style="text-align:center;"><div id="memotions-share-count" style="font-weight:700;font-size:.9rem;color:#a78bfa;">0</div><div style="font-size:.55rem;color:#6b7280;">Shares</div></div>
            </div>
            <div style="display:flex;gap:.7rem;margin-top:auto;">
              <button id="memotions-share-cancel" type="button" style="flex:1;background:#1a1a28;border:1px solid #374151;padding:.65rem;border-radius:.8rem;font-weight:600;font-size:.83rem;cursor:pointer;color:#e5e7eb;">Cancel</button>
              <button id="memotions-share-done" type="button" style="flex:1;background:linear-gradient(135deg,#8b5cf6,#7c3aed);border:0;padding:.65rem;border-radius:.8rem;font-weight:600;font-size:.83rem;color:#fff;cursor:pointer;">Done</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(dlg);
  }

  dlg.querySelectorAll('.ms-share-opt').forEach((b) => {
    b.style.cssText = 'border:1px solid #2d2d40;background:#12121c;color:#e5e7eb;border-radius:.8rem;padding:.65rem .4rem;cursor:pointer;font-size:.68rem;display:flex;align-items:center;justify-content:center;gap:.4rem;';
  });

  const close = () => {
    dlg.style.display = 'none';
    document.body.style.overflow = '';
  };
  dlg.querySelector('#memotions-share-close')?.addEventListener('click', close);
  dlg.querySelector('#memotions-share-cancel')?.addEventListener('click', close);
  dlg.querySelector('#memotions-share-done')?.addEventListener('click', close);
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) close();
  });

  window.__memotionsOpenShareDialog = (payload = {}) => {
    const postId = payload.id || `p-${Date.now()}`;
    const shareUrl = `${window.location.origin}/share?postId=${encodeURIComponent(postId)}`;
    const caption = payload.caption || 'Shared from Memotions';
    const creator = payload.creator || 'memotions_user';
    const text = `${caption}\n\nby @${creator}`;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(shareUrl);

    const thumb = dlg.querySelector('#memotions-share-thumb');
    const cap = dlg.querySelector('#memotions-share-caption');
    const cre = dlg.querySelector('#memotions-share-creator');
    const avatar = dlg.querySelector('#memotions-share-avatar');
    const shareLinkInput = dlg.querySelector('#memotions-share-link');
    const shareCount = dlg.querySelector('#memotions-share-count');
    const likeCount = dlg.querySelector('#memotions-like-count');
    const commentCount = dlg.querySelector('#memotions-comment-count');
    if (thumb) thumb.src = payload.image || 'https://i.imgflip.com/265j.jpg';
    if (cap) cap.textContent = caption;
    if (cre) cre.textContent = creator;
    if (avatar) avatar.src = payload.creatorAvatar || 'https://robohash.org/memecreator?set=set4&size=50x50';
    if (shareLinkInput) shareLinkInput.value = shareUrl;
    if (shareCount) shareCount.textContent = payload.shares || '1.2K';
    if (likeCount) likeCount.textContent = payload.likes || '0';
    if (commentCount) commentCount.textContent = payload.comments || '0';

    dlg.querySelectorAll('.ms-share-opt').forEach((btn) => {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        const p = btn.getAttribute('data-platform');
        if (p === 'copy') {
          try {
            await navigator.clipboard.writeText(shareUrl);
          } catch {
            const ta = document.createElement('textarea');
            ta.value = shareUrl;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
          close();
          return;
        }
        const links = {
          whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
          instagram: '',
          twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
          reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(caption)}`,
          telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
          discord: '',
        };
        if (p === 'instagram' || p === 'discord') {
          try { await navigator.clipboard.writeText(shareUrl); } catch { /* noop */ }
          return;
        }
        if (links[p]) window.open(links[p], '_blank', 'width=620,height=520');
      });
    });

    const copyBtn = dlg.querySelector('#memotions-share-copy-btn');
    if (copyBtn && copyBtn.dataset.bound !== '1') {
      copyBtn.dataset.bound = '1';
      copyBtn.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(shareUrl); } catch { /* noop */ }
      });
    }

    dlg.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  window.__memotionsShareDialogReady = true;

  if (!window.__memotionsEscCloseBound) {
    window.__memotionsEscCloseBound = true;
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const share = document.getElementById('memotions-share-dialog');
      const upload = document.getElementById('memotions-upload-modal');
      const post = document.getElementById('react-profile-post-modal');
      const notif = document.getElementById('memotions-notif-panel');
      const notifBackdrop = document.getElementById('memotions-notif-backdrop');
      if (share && share.style.display === 'flex') share.style.display = 'none';
      if (upload && upload.style.display === 'flex') upload.style.display = 'none';
      if (post && post.style.display === 'flex') post.style.display = 'none';
      if (notif && notif.style.right === '0px') notif.style.right = '-420px';
      if (notifBackdrop && notifBackdrop.style.display !== 'none') notifBackdrop.style.display = 'none';
      document.body.style.overflow = '';
    });
  }
}

function injectOwnProfileAvatarUpload(container) {
  if (!container) return;
  if (window.location.pathname !== '/own_profile') return;

  const avatarTargets = Array.from(
    container.querySelectorAll(
      '#avatarBtn, #profileAvatar, .avatar img, .profile-header img, .profile-pic, .profile-top img'
    )
  );
  if (!avatarTargets.length) return;

  let uploader = container.querySelector('#react-avatar-upload-input');
  if (!uploader) {
    uploader = document.createElement('input');
    uploader.type = 'file';
    uploader.id = 'react-avatar-upload-input';
    uploader.accept = 'image/*';
    uploader.style.display = 'none';
    container.appendChild(uploader);
  }

  const applyAvatar = (src) => {
    if (!src) return;
    avatarTargets.forEach((el) => {
      if (el.tagName.toLowerCase() === 'img') {
        el.setAttribute('src', src);
      } else if (el.style) {
        el.style.backgroundImage = `url("${src}")`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
      }
    });

    const sidebarAvatar = document.querySelector('.left-sidebar .sidebar-profile-avatar');
    if (sidebarAvatar) sidebarAvatar.setAttribute('src', src);
  };

  try {
    const saved = localStorage.getItem('memotions_profile_avatar');
    if (saved) applyAvatar(saved);
  } catch {
    // ignore storage failures
  }

  if (!uploader.dataset.bound) {
    uploader.dataset.bound = '1';
    uploader.addEventListener('change', () => {
      const file = uploader.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        if (!dataUrl) return;
        applyAvatar(dataUrl);
        try {
          localStorage.setItem('memotions_profile_avatar', dataUrl);
        } catch {
          // ignore storage failures
        }
      };
      reader.readAsDataURL(file);
    });
  }

  avatarTargets.forEach((el) => {
    const clickable = el.tagName.toLowerCase() === 'img' ? el : el.closest('button') || el;
    if (!clickable || clickable.dataset.avatarUploadBound === '1') return;
    clickable.dataset.avatarUploadBound = '1';
    clickable.style.cursor = 'pointer';
    clickable.setAttribute('title', 'Change profile picture');
    clickable.addEventListener(
      'click',
      (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        evt.stopImmediatePropagation?.();
        uploader.click();
      },
      true
    );
  });
}

function removeDuplicatePageLogo(container) {
  if (!container) return;
  const path = window.location.pathname;
  if (path === '/memotions' || path === '/') return;

  container
    .querySelectorAll(
      '.top-nav .logo, .header .logo, .main-header .logo, .navbar .logo, .brand, .logo-area-main'
    )
    .forEach((el) => {
      el.remove();
    });
}

function injectUploadedMemesIntoProfiles(container) {
  if (!container) return;
  const path = window.location.pathname;
  const isProfileSurface = path === '/profile' || path === '/own_profile';
  if (!isProfileSurface) return;

  const uploads = parseJsonArray(localStorage.getItem('memotions_uploaded_memes'));
  const created = parseJsonArray(localStorage.getItem('memotions_posts'));
  const merged = [...uploads, ...created]
    .map((m) => {
      const tsFromTimestamp = m?.timestamp ? new Date(m.timestamp).getTime() : NaN;
      const tsFromId = parseInt(String(m?.id ?? '').replace(/\D/g, ''), 10);
      const ts = Number.isFinite(tsFromTimestamp)
        ? tsFromTimestamp
        : (Number.isFinite(tsFromId) ? tsFromId : 0);
      return { ...m, __ts: ts };
    })
    .sort((a, b) => b.__ts - a.__ts);

  const seen = new Set();
  const uniqueMerged = merged.filter((m) => {
    const key = String(m?.id ?? '');
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (!uniqueMerged.length) return;

  const activePostsTab = container.querySelector('.tab.active[data-tab="posts"]');
  if (!activePostsTab) return;

  const grid =
    container.querySelector('#contentArea .content-grid') ||
    container.querySelector('.posts-grid') ||
    container.querySelector('.profile-content .grid-container');
  if (!grid) return;

  const injected = [];
  uniqueMerged.forEach((m) => {
    const postId = String(m?.id ?? `p-${Date.now()}-${Math.random()}`);
    if (grid.querySelector(`.grid-item[data-id="${postId}"]`)) return;
    const item = document.createElement('div');
    item.className = 'grid-item';
    item.setAttribute('data-id', postId);
    const imgSrc = m.image || m.imageUrl || 'https://i.imgflip.com/265j.jpg';
    const comments = m.comments || '0';
    const likes = m.likes || '0';
    const title = (m.title || m.caption || 'Uploaded meme').replace(/"/g, '&quot;');
    item.innerHTML = `
      <img src="${imgSrc}" alt="${title}">
      <div class="grid-overlay">
        <div class="likes">${likes}</div>
        <div class="comments">${comments}</div>
      </div>
    `;
    injected.push(item);
  });
  injected.reverse().forEach((item) => grid.prepend(item));

  // Re-apply when profile tabs re-render contentArea.
  container.querySelectorAll('.tab[data-tab="posts"], .tab[data-tab="saved"]').forEach((tab) => {
    if (tab.dataset.uploadMergeBound === '1') return;
    tab.dataset.uploadMergeBound = '1';
    tab.addEventListener('click', () => {
      if (tab.getAttribute('data-tab') === 'posts') {
        setTimeout(() => injectUploadedMemesIntoProfiles(container), 120);
      }
      setTimeout(() => injectSavedPostsIntoProfileSavedTab(container), 160);
      setTimeout(() => injectProfilePostModal(container), 200);
    });
  });

  const contentArea = container.querySelector('#contentArea');
  if (contentArea && contentArea.dataset.uploadObserverBound !== '1') {
    contentArea.dataset.uploadObserverBound = '1';
    const observer = new MutationObserver(() => {
      const postsTab = container.querySelector('.tab.active[data-tab="posts"]');
      if (!postsTab) return;
      setTimeout(() => injectUploadedMemesIntoProfiles(container), 30);
    });
    observer.observe(contentArea, { childList: true, subtree: true });
  }
}

function injectSavedPostsIntoProfileSavedTab(container) {
  if (!container) return;
  const path = window.location.pathname;
  if (path !== '/profile' && path !== '/own_profile') return;

  const saved = parseJsonArray(localStorage.getItem('memotions_saved_posts'));

  const activeSaved = container.querySelector('.tab.active[data-tab="saved"]');
  if (!activeSaved) return;

  const grid = container.querySelector('#contentArea .content-grid');
  if (!grid) return;
  // Replace grid content entirely so static page-level saved seed order
  // cannot override the real save-order from localStorage.
  grid.innerHTML = '';
  if (!saved.length) return;
  const ordered = [...saved]
    .map((m, i) => ({ ...m, __idx: i }))
    .sort((a, b) => {
      const ta = Number(a.savedAt || 0);
      const tb = Number(b.savedAt || 0);
      if (tb !== ta) return tb - ta;
      return a.__idx - b.__idx;
    });
  ordered.forEach((m) => {
    const id = String(m.id || `s-${Date.now()}`);
    const el = document.createElement('div');
    el.className = 'grid-item';
    el.setAttribute('data-id', id);
    el.innerHTML = `
      <img src="${m.image || m.imageUrl || 'https://i.imgflip.com/265j.jpg'}" alt="${(m.caption || 'Saved meme').replace(/"/g, '&quot;')}">
      <div class="grid-overlay">
        <div class="overlay-stat"><i class="fas fa-heart"></i> ${m.likes || '0'}</div>
      </div>
    `;
    grid.appendChild(el);
  });
}

function injectMemotionsFeedScrollFix(container) {
  if (!container || window.location.pathname !== '/memotions') return;
  const feed = container.querySelector('.feed-container');
  if (!feed || feed.dataset.wheelFixed === '1') return;
  feed.dataset.wheelFixed = '1';
  let lastWheelTs = 0;

  // Keep custom wheel handling but make it smoother and less jumpy.
  const onWheel = (e) => {
    const modalOpen = document.getElementById('react-profile-post-modal')?.style.display === 'flex';
    if (modalOpen) return;
    const now = Date.now();
    if (now - lastWheelTs < 70) return;
    lastWheelTs = now;
    e.preventDefault();
    const step = Math.max(110, Math.min(360, Math.abs(e.deltaY) * 1.25));
    feed.scrollBy({ top: e.deltaY > 0 ? step : -step, behavior: 'smooth' });
  };
  window.addEventListener('wheel', onWheel, { passive: false });
}

function injectTopActionPanels(container) {
  if (!container) return;
  if (!window.__memotionsTopPanelsReady) {
    const host = document.createElement('div');
    host.id = 'memotions-top-panels';
    host.innerHTML = `
      <div id="memotions-upload-modal" style="position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;align-items:flex-start;justify-content:center;z-index:10042;padding:12px;overflow-y:auto;">
        <div class="create-container" style="position:relative;width:min(680px,96vw);overflow:hidden;">
          <button id="memotions-upload-close" type="button" style="position:absolute;right:14px;top:12px;border:0;background:transparent;color:#9ca3af;font-size:1.35rem;cursor:pointer;z-index:2;">×</button>
          <div class="create-header">
            <h1><i class="fas fa-plus-circle"></i> Create Post</h1>
            <p>Upload meme to your profile</p>
          </div>
          <div class="upload-area" id="uploadArea">
            <div class="upload-icon">
              <i class="fas fa-cloud-upload-alt"></i>
            </div>
            <h3>Drag &amp; drop your file here</h3>
            <p>or click to browse</p>
            <button class="upload-btn" id="browseBtn" type="button">Choose File</button>
            <input type="file" id="fileInput" accept="image/*,image/gif" style="display:none;">
          </div>
          <div class="preview-area" id="previewArea" style="display:none;">
            <div class="preview-header">
              <span><i class="fas fa-image"></i> Preview</span>
              <button class="remove-preview" id="removePreviewBtn" type="button"><i class="fas fa-times"></i></button>
            </div>
            <img id="previewImage" class="preview-image" alt="Preview">
            <div class="file-info" id="fileInfo"></div>
            <div id="uploadConfirmMsg" style="display:none;margin-top:.5rem;text-align:center;font-size:.78rem;color:#86efac;">✅ Image uploaded successfully</div>
          </div>
          <div class="form-group">
            <div class="form-label"><i class="fas fa-tag"></i> Post Type</div>
            <div class="type-toggle" id="typeToggle">
              <div class="type-option active" data-type="meme">📸 Meme</div>
              <div class="type-option" data-type="gif">🎬 GIF</div>
            </div>
          </div>
          <div class="form-group">
            <div class="form-label"><i class="fas fa-comment"></i> Caption</div>
            <textarea class="form-textarea" id="captionInput" placeholder="Write a caption for your post..."></textarea>
          </div>
          <div class="form-group">
            <div class="form-label"><i class="fas fa-hashtag"></i> Tags</div>
            <div class="tag-input-wrapper">
              <input type="text" class="tag-input" id="tagInput" placeholder="Add a tag (e.g., funny, relatable)">
              <button class="add-tag-btn" id="addTagBtn" type="button"><i class="fas fa-plus"></i> Add</button>
            </div>
            <div class="tags-container" id="tagsContainer"></div>
            <div style="margin-top:.5rem;display:flex;flex-wrap:wrap;gap:.4rem;">
              <span style="font-size:.65rem;color:#6b7280;">Suggested:</span>
              <span style="background:#1a1a28;padding:.2rem .6rem;border-radius:1rem;font-size:.6rem;cursor:pointer;" class="suggest-tag">#funny</span>
              <span style="background:#1a1a28;padding:.2rem .6rem;border-radius:1rem;font-size:.6rem;cursor:pointer;" class="suggest-tag">#relatable</span>
              <span style="background:#1a1a28;padding:.2rem .6rem;border-radius:1rem;font-size:.6rem;cursor:pointer;" class="suggest-tag">#dank</span>
              <span style="background:#1a1a28;padding:.2rem .6rem;border-radius:1rem;font-size:.6rem;cursor:pointer;" class="suggest-tag">#cat</span>
              <span style="background:#1a1a28;padding:.2rem .6rem;border-radius:1rem;font-size:.6rem;cursor:pointer;" class="suggest-tag">#dog</span>
              <span style="background:#1a1a28;padding:.2rem .6rem;border-radius:1rem;font-size:.6rem;cursor:pointer;" class="suggest-tag">#memes</span>
              <span style="background:#1a1a28;padding:.2rem .6rem;border-radius:1rem;font-size:.6rem;cursor:pointer;" class="suggest-tag">#viral</span>
              <span style="background:#1a1a28;padding:.2rem .6rem;border-radius:1rem;font-size:.6rem;cursor:pointer;" class="suggest-tag">#trending</span>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:8px;padding:0 1rem .75rem;">
            <button id="memotions-upload-cancel" type="button" class="upload-btn" style="background:#1a1a28;border-color:#374151;">Cancel</button>
          </div>
          <button class="submit-btn" id="submitBtn">🚀 Post to Memotions</button>
          <div style="height:1rem;"></div>
        </div>
      </div>

      <div id="memotions-notif-panel" style="position:fixed;top:0;right:-420px;height:100vh;width:min(400px,96vw);background:#0c0c14;border-left:1px solid #202338;z-index:10041;transition:right .24s ease;box-shadow:-12px 0 40px rgba(0,0,0,.45);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #24263a;">
          <strong>Notifications</strong>
          <button id="memotions-notif-close" type="button" style="border:0;background:transparent;color:#9ca3af;font-size:1.2rem;cursor:pointer;">×</button>
        </div>
        <div id="memotions-notif-tabs" style="display:flex;gap:8px;padding:10px 12px;border-bottom:1px solid #1b1f33;">
          <button data-tab="all" class="mn-tab">All</button>
          <button data-tab="likes" class="mn-tab">Likes</button>
          <button data-tab="comments" class="mn-tab">Comments</button>
          <button data-tab="follows" class="mn-tab">Follows</button>
        </div>
        <div id="memotions-notif-list" style="padding:8px 0;overflow:auto;height:calc(100vh - 58px);"></div>
      </div>
      <div id="memotions-notif-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:10040;display:none;"></div>
    `;
    document.body.appendChild(host);
    if (!document.getElementById('memotions-upload-create-style')) {
      const style = document.createElement('style');
      style.id = 'memotions-upload-create-style';
      style.textContent = `
        #memotions-upload-modal .create-container{width:min(800px,96vw);max-width:800px;max-height:calc(100vh - 24px);margin:.25rem auto 1rem;padding:0 1rem;background:#08080c;border:1px solid #1a1a28;border-radius:1.25rem;box-shadow:0 20px 60px rgba(0,0,0,.55);overflow:auto}
        #memotions-upload-modal .create-header{margin-bottom:2rem}
        #memotions-upload-modal .create-header h1{font-size:1.8rem;font-weight:700;background:linear-gradient(135deg,#fff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.5rem}
        #memotions-upload-modal .create-header p{color:#9ca3af;font-size:.85rem}
        #memotions-upload-modal .upload-area{background:#12121c;border:2px dashed #2d2d40;border-radius:1.5rem;padding:clamp(1rem,4vw,3rem) clamp(.75rem,3vw,2rem);text-align:center;cursor:pointer;transition:all .2s;margin-bottom:1rem}
        #memotions-upload-modal .upload-area:hover{border-color:#8b5cf6;background:#161622}
        #memotions-upload-modal .upload-area.drag-over{border-color:#8b5cf6;background:#1a1a2a;transform:scale(.99)}
        #memotions-upload-modal .upload-icon{font-size:3.5rem;color:#a78bfa;margin-bottom:1rem}
        #memotions-upload-modal .upload-area h3{font-size:1.1rem;margin-bottom:.5rem}
        #memotions-upload-modal .upload-area p{color:#6b7280;font-size:.8rem;margin-bottom:1rem}
        #memotions-upload-modal .upload-btn{background:linear-gradient(135deg,#8b5cf6,#7c3aed);border:none;padding:.6rem 1.5rem;border-radius:2rem;font-weight:600;font-size:.8rem;color:#fff;cursor:pointer;transition:all .2s}
        #memotions-upload-modal .upload-btn:hover{transform:translateY(-2px);box-shadow:0 5px 15px rgba(139,92,246,.3)}
        #memotions-upload-modal .preview-area{background:#12121c;border-radius:1.5rem;border:1px solid #2d2d40;padding:1rem;margin-bottom:1.5rem;display:none}
        #memotions-upload-modal .preview-area.active{display:block}
        #memotions-upload-modal .preview-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;padding-bottom:.5rem;border-bottom:1px solid #2d2d40}
        #memotions-upload-modal .preview-header span{font-size:.8rem;font-weight:600;color:#a78bfa}
        #memotions-upload-modal .remove-preview{background:none;border:none;color:#f43f5e;cursor:pointer;font-size:1rem}
        #memotions-upload-modal .preview-image{width:100%;max-height:min(34vh,300px);object-fit:contain;border-radius:1rem}
        #memotions-upload-modal .file-info{margin-top:.5rem;font-size:.7rem;color:#6b7280;text-align:center}
        #memotions-upload-modal .form-group{margin-bottom:1.2rem}
        #memotions-upload-modal .form-label{display:block;font-size:.8rem;font-weight:600;margin-bottom:.5rem;color:#e5e7eb}
        #memotions-upload-modal .form-label i{color:#a78bfa;margin-right:.3rem}
        #memotions-upload-modal .form-input,#memotions-upload-modal .form-textarea{width:100%;background:#0a0a12;border:1px solid #2d2d40;border-radius:1rem;padding:.8rem 1rem;color:#fff;font-family:'Inter',sans-serif;font-size:.85rem;transition:all .2s}
        #memotions-upload-modal .form-input:focus,#memotions-upload-modal .form-textarea:focus{outline:none;border-color:#8b5cf6;background:#12121c}
        #memotions-upload-modal .form-textarea{resize:vertical;min-height:80px}
        #memotions-upload-modal .type-toggle{display:flex;gap:.5rem;background:#0a0a12;border:1px solid #2d2d40;border-radius:2rem;padding:.25rem;width:fit-content}
        #memotions-upload-modal .type-option{padding:.5rem 1.2rem;border-radius:2rem;font-size:.8rem;font-weight:600;cursor:pointer;transition:all .2s;color:#9ca3af}
        #memotions-upload-modal .type-option.active{background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff}
        #memotions-upload-modal .tags-container{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.5rem}
        #memotions-upload-modal .tag-item{background:#1a1a28;border:1px solid #2d2d40;border-radius:2rem;padding:.3rem .8rem;font-size:.7rem;display:inline-flex;align-items:center;gap:.4rem}
        #memotions-upload-modal .tag-item i{cursor:pointer;font-size:.6rem;color:#f43f5e}
        #memotions-upload-modal .tag-input-wrapper{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
        #memotions-upload-modal .tag-input{flex:1;background:#0a0a12;border:1px solid #2d2d40;border-radius:2rem;padding:.5rem 1rem;color:#fff;font-size:.8rem}
        #memotions-upload-modal .tag-input:focus{outline:none;border-color:#8b5cf6}
        #memotions-upload-modal .add-tag-btn{background:#1a1a28;border:1px solid #2d2d40;padding:.5rem 1rem;border-radius:2rem;font-size:.7rem;cursor:pointer;transition:all .2s;color:#e5e7eb}
        #memotions-upload-modal .add-tag-btn:hover{background:#8b5cf6;border-color:#8b5cf6;color:#fff}
        #memotions-upload-modal .submit-btn{width:100%;background:linear-gradient(135deg,#8b5cf6,#7c3aed);border:none;padding:.9rem;border-radius:1rem;font-weight:700;font-size:1rem;color:#fff;cursor:pointer;transition:all .2s;margin-top:.75rem;position:sticky;bottom:0}
        #memotions-upload-modal .submit-btn:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(139,92,246,.3)}
        #memotions-upload-modal .submit-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
      `;
      document.head.appendChild(style);
    }

    const notifPanel = document.getElementById('memotions-notif-panel');
    const notifBackdrop = document.getElementById('memotions-notif-backdrop');
    const notifList = document.getElementById('memotions-notif-list');
    const notifTabs = document.getElementById('memotions-notif-tabs');
    const uploadModal = document.getElementById('memotions-upload-modal');
    const uploadFile = uploadModal?.querySelector('#fileInput');
    const uploadArea = uploadModal?.querySelector('#uploadArea');
    const uploadBrowse = uploadModal?.querySelector('#browseBtn');
    const uploadPreviewWrap = uploadModal?.querySelector('#previewArea');
    const uploadPreview = uploadModal?.querySelector('#previewImage');
    const uploadFileInfo = uploadModal?.querySelector('#fileInfo');
    const uploadConfirmMsg = uploadModal?.querySelector('#uploadConfirmMsg');
    const removePreviewBtn = uploadModal?.querySelector('#removePreviewBtn');
    const captionInput = uploadModal?.querySelector('#captionInput');
    const tagInput = uploadModal?.querySelector('#tagInput');
    const addTagBtn = uploadModal?.querySelector('#addTagBtn');
    const tagsContainer = uploadModal?.querySelector('#tagsContainer');
    const typeToggle = uploadModal?.querySelector('#typeToggle');
    let activeNotifTab = 'all';

    const closeNotif = () => {
      if (notifPanel) notifPanel.style.right = '-420px';
      if (notifBackdrop) notifBackdrop.style.display = 'none';
      document.body.style.overflow = '';
    };
    const notificationSeed = () => [
      { id: 1, type: 'likes', t: 'gif_goddess liked your meme', m: '2m ago' },
      { id: 2, type: 'comments', t: 'reactionking commented: "LOL accurate 😂"', m: '11m ago' },
      { id: 3, type: 'follows', t: 'danklabs started following you', m: '1h ago' },
      { id: 4, type: 'likes', t: 'memelord42 liked your GIF', m: '3h ago' },
    ];
    const readNotifications = () => {
      const saved = JSON.parse(localStorage.getItem('memotions_notifications') || '[]');
      return saved.length ? saved : notificationSeed();
    };
    const renderNotifications = () => {
      const all = readNotifications();
      const filtered = activeNotifTab === 'all' ? all : all.filter((n) => n.type === activeNotifTab);
      if (!filtered.length) {
        notifList.innerHTML = '<div style="padding:28px 16px;color:#94a3b8;text-align:center;">No notifications in this tab.</div>';
        return;
      }
      notifList.innerHTML = filtered
        .map(
          (n) =>
            `<div style="padding:12px 16px;border-bottom:1px solid #1a1d30;"><div style="font-size:.9rem;color:#e5e7eb;">${n.t}</div><div style="font-size:.72rem;color:#94a3b8;margin-top:2px;">${n.m}</div></div>`
        )
        .join('');
      notifTabs?.querySelectorAll('.mn-tab').forEach((b) => {
        const active = b.getAttribute('data-tab') === activeNotifTab;
        b.style.cssText = `border:1px solid ${active ? '#4c1d95' : '#334155'};background:${active ? '#1a1a2f' : '#0f1326'};color:${active ? '#e9d5ff' : '#cbd5e1'};border-radius:999px;padding:6px 10px;font-size:.72rem;cursor:pointer;`;
      });
    };
    const openNotif = () => {
      renderNotifications();
      if (notifPanel) notifPanel.style.right = '0';
      if (notifBackdrop) notifBackdrop.style.display = 'block';
      document.body.style.overflow = 'hidden';
    };
    const closeUpload = () => {
      if (uploadModal) uploadModal.style.display = 'none';
      document.body.style.overflow = '';
    };
    const openUpload = () => {
      if (uploadModal) uploadModal.style.display = 'flex';
      uploadPreviewWrap?.classList.remove('active');
      if (uploadPreview) uploadPreview.setAttribute('src', '');
      if (uploadFileInfo) uploadFileInfo.textContent = '';
      if (uploadConfirmMsg) uploadConfirmMsg.style.display = 'none';
      if (uploadFile) uploadFile.value = '';
      if (uploadArea) uploadArea.style.display = 'block';
      document.body.style.overflow = 'hidden';
    };
    let postType = 'meme';
    let tags = [];
    const renderTags = () => {
      if (!tagsContainer) return;
      tagsContainer.innerHTML = tags.map((t, i) => `<div class="tag-item">#${t} <i data-i="${i}" class="fas fa-times"></i></div>`).join('');
      tagsContainer.querySelectorAll('i[data-i]').forEach((x) => {
        x.addEventListener('click', () => {
          const idx = Number(x.getAttribute('data-i'));
          tags.splice(idx, 1);
          renderTags();
        });
      });
    };

    document.getElementById('memotions-notif-close')?.addEventListener('click', closeNotif);
    notifBackdrop?.addEventListener('click', closeNotif);
    document.getElementById('memotions-upload-close')?.addEventListener('click', closeUpload);
    document.getElementById('memotions-upload-cancel')?.addEventListener('click', closeUpload);
    uploadModal?.addEventListener('click', (e) => {
      if (e.target === uploadModal) closeUpload();
    });
    notifTabs?.querySelectorAll('.mn-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeNotifTab = btn.getAttribute('data-tab') || 'all';
        renderNotifications();
      });
    });
    uploadFile?.addEventListener('change', () => {
      const file = uploadFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result || '');
        if (!src) return;
        uploadPreview?.setAttribute('src', src);
        if (uploadFileInfo) uploadFileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        if (uploadConfirmMsg) uploadConfirmMsg.style.display = 'block';
        uploadPreviewWrap?.classList.add('active');
        if (uploadPreviewWrap) uploadPreviewWrap.style.display = 'block';
        if (uploadArea) uploadArea.style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
    removePreviewBtn?.addEventListener('click', () => {
      uploadPreviewWrap?.classList.remove('active');
      if (uploadPreview) uploadPreview.setAttribute('src', '');
      if (uploadFileInfo) uploadFileInfo.textContent = '';
      if (uploadConfirmMsg) uploadConfirmMsg.style.display = 'none';
      if (uploadFile) uploadFile.value = '';
      if (uploadArea) uploadArea.style.display = 'block';
    });
    uploadBrowse?.addEventListener('click', (e) => {
      e.stopPropagation();
      uploadFile?.click();
    });
    uploadArea?.addEventListener('click', () => uploadFile?.click());
    uploadArea?.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });
    uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea?.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const file = e.dataTransfer?.files?.[0];
      if (!file || !file.type.startsWith('image/')) return;
      const dt = new DataTransfer();
      dt.items.add(file);
      if (uploadFile) uploadFile.files = dt.files;
      uploadFile?.dispatchEvent(new Event('change'));
    });
    typeToggle?.querySelectorAll('.type-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        typeToggle.querySelectorAll('.type-option').forEach((o) => o.classList.remove('active'));
        opt.classList.add('active');
        postType = opt.getAttribute('data-type') || 'meme';
      });
    });
    addTagBtn?.addEventListener('click', () => {
      const raw = (tagInput?.value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!raw || tags.includes(raw) || tags.length >= 8) return;
      tags.push(raw);
      if (tagInput) tagInput.value = '';
      renderTags();
    });
    tagInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTagBtn?.click();
      }
    });
    uploadModal?.querySelectorAll('.suggest-tag').forEach((chip) => {
      chip.addEventListener('click', () => {
        const raw = (chip.textContent || '').replace('#', '').trim().toLowerCase();
        if (!raw || tags.includes(raw) || tags.length >= 8) return;
        tags.push(raw);
        renderTags();
      });
    });
    uploadModal?.querySelector('#submitBtn')?.addEventListener('click', () => {
      const title = `Uploaded ${postType === 'gif' ? 'GIF' : 'Meme'}`;
      const caption = captionInput?.value?.trim() || 'Premade meme upload';
      const img = uploadPreview?.getAttribute('src');
      if (!img) {
        if (uploadConfirmMsg) {
          uploadConfirmMsg.style.display = 'block';
          uploadConfirmMsg.style.color = '#fca5a5';
          uploadConfirmMsg.textContent = '⚠️ Please choose an image first';
        }
        return;
      }
      const payload = { id: `upload-${Date.now()}`, title, creator: 'you', caption: `${title} — ${caption}${tags.length ? ` #${tags.join(' #')}` : ''}`, image: img, likes: '0', comments: '0', shares: '0' };
      localStorage.setItem('memotions_share_meme', JSON.stringify(payload));
      const currentUploads = JSON.parse(localStorage.getItem('memotions_uploaded_memes') || '[]');
      currentUploads.unshift(payload);
      localStorage.setItem('memotions_uploaded_memes', JSON.stringify(currentUploads.slice(0, 100)));
      const existing = JSON.parse(localStorage.getItem('memotions_notifications') || '[]');
      existing.unshift({ id: Date.now(), type: 'comments', t: `You uploaded "${title}"`, m: 'now' });
      localStorage.setItem('memotions_notifications', JSON.stringify(existing.slice(0, 30)));
      closeUpload();
      window.location.href = '/profile';
    });

    window.__memotionsOpenCreatorPage = () => {
      window.location.href = '/create';
    };
    window.__memotionsOpenNotificationPanel = openNotif;
    window.__memotionsOpenUploadMemeModal = openUpload;
    window.__memotionsTopPanelsReady = true;
  }

  const bindClick = (el, handler) => {
    if (!el || el.dataset.memotionsPanelBound === '1') return;
    el.dataset.memotionsPanelBound = '1';
    el.style.cursor = 'pointer';
    el.addEventListener('click', (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      evt.stopImmediatePropagation?.();
      handler();
    }, true);
  };

  container.querySelectorAll('#createBtn').forEach((el) => bindClick(el, () => window.__memotionsOpenCreatorPage?.()));
  container.querySelectorAll('#notificationBtn').forEach((el) => bindClick(el, () => window.__memotionsOpenNotificationPanel?.()));
  container.querySelectorAll('.top-actions .fa-bell').forEach((el) => bindClick(el, () => window.__memotionsOpenNotificationPanel?.()));
  container.querySelectorAll('#sidebarUploadMemeBtn').forEach((el) => bindClick(el, () => window.__memotionsOpenUploadMemeModal?.()));
}

function injectProfilePostModal(container) {
  if (!container) return;
  const path = window.location.pathname;
  const isModalSurface =
    path === '/profile' ||
    path === '/others_profile' ||
    path === '/own_profile' ||
    path === '/trending' ||
    path === '/memotions' ||
    path === '/other' ||
    path === '/HallofFame';
  if (!isModalSurface) return;

  let modal = container.querySelector('#react-profile-post-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'react-profile-post-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.78);display:none;align-items:center;justify-content:center;z-index:10020;padding:18px;';
    modal.innerHTML = `
      <div style="position:relative;width:min(1220px,98vw);height:min(88vh,860px);max-height:calc(100vh - 24px);background:#0a0a10;border:1px solid #1a1a28;border-radius:16px;overflow:hidden;color:#fff;">
        <button id="react-post-modal-close" type="button" style="position:absolute;top:10px;right:12px;border:0;background:transparent;color:#9ca3af;font-size:1.4rem;cursor:pointer;z-index:2;">×</button>
        <div style="display:flex;height:100%;">
          <div style="flex:1.2;display:flex;align-items:stretch;justify-content:stretch;background:#0a0a12;border-right:1px solid #1a1a28;min-height:100%;padding:0;">
            <div style="width:100%;background:#12121c;overflow:hidden;display:flex;flex-direction:column;min-height:0;">
              <div style="display:flex;align-items:center;gap:.8rem;padding:1rem;">
                <div style="width:42px;height:42px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#8b5cf6,#ec4899);">
                  <img id="react-post-avatar" alt="avatar" src="https://robohash.org/memecreator?set=set4&size=50x50" style="width:100%;height:100%;object-fit:cover;" />
                </div>
                <div style="flex:1;">
                  <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;">
                    <span id="react-post-author-1" style="font-weight:700;font-size:.9rem;">meme_curator</span>
                    <i class="fas fa-check-circle" style="color:#8b5cf6;font-size:.7rem;"></i>
                  </div>
                  <div style="font-size:.65rem;color:#6b7280;margin-top:.1rem;" id="react-post-time">Memotions • 2h ago</div>
                </div>
              </div>
              <div style="width:100%;background:#000;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;">
                <img id="react-post-modal-image" alt="post" style="width:100%;height:100%;object-fit:contain;max-height:none;" />
              </div>
              <div style="display:flex;gap:.6rem;padding:.8rem 1rem;align-items:center;flex-wrap:wrap;">
                <button id="react-post-like" class="post-action" type="button" style="background:none;border:none;color:#e5e7eb;font-size:1.35rem;cursor:pointer;"><i class="far fa-heart"></i></button>
                <button id="react-post-share" class="post-action" type="button" style="background:none;border:none;color:#e5e7eb;font-size:1.35rem;cursor:pointer;"><i class="far fa-paper-plane"></i></button>
                <div id="react-post-reactions" style="display:flex;gap:.35rem;overflow-x:auto;max-width:62%;padding:.15rem .35rem;background:#101122;border:1px solid #262a4a;border-radius:999px;">
                  <button class="rp-reaction" data-emoji="😂" style="display:inline-flex;align-items:center;justify-content:center;gap:.24rem;background:transparent;border:1px solid transparent;color:#e5e7eb;padding:.32rem .42rem;border-radius:999px;cursor:pointer;font-size:.92rem;line-height:1;"><span>😂</span><span class="rp-reaction-count" style="font-size:.7rem;">2.1K</span></button>
                  <button class="rp-reaction" data-emoji="💀" style="display:inline-flex;align-items:center;justify-content:center;gap:.24rem;background:transparent;border:1px solid transparent;color:#e5e7eb;padding:.32rem .42rem;border-radius:999px;cursor:pointer;font-size:.92rem;line-height:1;"><span>💀</span><span class="rp-reaction-count" style="font-size:.7rem;">1.8K</span></button>
                  <button class="rp-reaction" data-emoji="🔥" style="display:inline-flex;align-items:center;justify-content:center;gap:.24rem;background:transparent;border:1px solid transparent;color:#e5e7eb;padding:.32rem .42rem;border-radius:999px;cursor:pointer;font-size:.92rem;line-height:1;"><span>🔥</span><span class="rp-reaction-count" style="font-size:.7rem;">1.5K</span></button>
                  <button class="rp-reaction" data-emoji="❤️" style="display:inline-flex;align-items:center;justify-content:center;gap:.24rem;background:transparent;border:1px solid transparent;color:#e5e7eb;padding:.32rem .42rem;border-radius:999px;cursor:pointer;font-size:.92rem;line-height:1;"><span>❤️</span><span class="rp-reaction-count" style="font-size:.7rem;">1.2K</span></button>
                  <button class="rp-reaction" data-emoji="😭" style="display:inline-flex;align-items:center;justify-content:center;gap:.24rem;background:transparent;border:1px solid transparent;color:#e5e7eb;padding:.32rem .42rem;border-radius:999px;cursor:pointer;font-size:.92rem;line-height:1;"><span>😭</span><span class="rp-reaction-count" style="font-size:.7rem;">956</span></button>
                  <button class="rp-reaction" data-emoji="👏" style="display:inline-flex;align-items:center;justify-content:center;gap:.24rem;background:transparent;border:1px solid transparent;color:#e5e7eb;padding:.32rem .42rem;border-radius:999px;cursor:pointer;font-size:.92rem;line-height:1;"><span>👏</span><span class="rp-reaction-count" style="font-size:.7rem;">743</span></button>
                </div>
                <button id="react-post-save" class="post-action" type="button" style="margin-left:auto;background:none;border:none;color:#e5e7eb;font-size:1.35rem;cursor:pointer;"><i class="far fa-bookmark"></i></button>
              </div>
              <div style="padding:0 1rem .5rem 1rem;font-size:.85rem;font-weight:600;"><span id="react-post-like-count">0</span> likes</div>
              <div style="padding:0 1rem .5rem 1rem;font-size:.85rem;line-height:1.4;"><span id="react-post-author-2" style="font-weight:700;margin-right:.5rem;">meme_curator</span><span id="react-post-caption">Meme post</span></div>
              <div style="padding:0 1rem 1rem 1rem;font-size:.65rem;color:#6b7280;" id="react-post-time-bottom">2 HOURS AGO</div>
            </div>
          </div>
          <div style="width:430px;display:flex;flex-direction:column;background:#0c0c14;">
            <div style="display:flex;align-items:center;gap:.6rem;flex-wrap:wrap;padding:1rem 1.2rem;border-bottom:1px solid #1a1a28;">
              <h3 style="font-size:1rem;font-weight:600;margin:0;">Comments</h3>
            </div>
            <div id="react-post-comments-list" style="flex:1;overflow-y:auto;padding:.5rem 0;">
              <div style="display:flex;gap:1rem;padding:1rem 1.2rem;">
                <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;flex-shrink:0;"><img src="https://robohash.org/gifqueen?set=set2&size=40x40" alt="avatar" style="width:100%;height:100%;object-fit:cover;" /></div>
                <div style="flex:1;">
                  <div style="display:flex;align-items:baseline;gap:.6rem;flex-wrap:wrap;margin-bottom:.3rem;"><span style="font-weight:700;font-size:.85rem;">gif_goddess</span><span style="font-size:.7rem;color:#6b7280;">@gif_goddess</span><span style="font-size:.65rem;color:#6b7280;">2h</span></div>
                  <div style="font-size:.85rem;color:#e5e7eb;line-height:1.4;">This is so relatable! 😂</div>
                </div>
              </div>
              <div style="display:flex;gap:1rem;padding:1rem 1.2rem;">
                <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;flex-shrink:0;"><img src="https://robohash.org/reactiongod?set=set1&size=40x40" alt="avatar" style="width:100%;height:100%;object-fit:cover;" /></div>
                <div style="flex:1;">
                  <div style="display:flex;align-items:baseline;gap:.6rem;flex-wrap:wrap;margin-bottom:.3rem;"><span style="font-weight:700;font-size:.85rem;">reactionking</span><span style="font-size:.7rem;color:#6b7280;">@reactionking</span><span style="font-size:.65rem;color:#6b7280;">1h</span></div>
                  <div style="font-size:.85rem;color:#e5e7eb;line-height:1.4;">Me every Monday morning 😅</div>
                </div>
              </div>
            </div>
            <div style="padding:1rem 1.2rem;border-top:1px solid #1a1a28;display:flex;gap:1rem;align-items:flex-start;">
              <div style="width:36px;height:36px;border-radius:50%;overflow:hidden;flex-shrink:0;"><img src="https://robohash.org/currentuser?set=set4&size=40x40" alt="avatar" style="width:100%;height:100%;object-fit:cover;" /></div>
              <div style="flex:1;display:flex;align-items:center;gap:.75rem;">
                <textarea id="react-post-comment-input" placeholder="Add a comment..." rows="1" style="flex:1;background:transparent;border:none;padding:.45rem 0;color:#fff;font-size:.85rem;resize:none;font-family:Inter,sans-serif;line-height:1.35;max-height:72px;"></textarea>
                <button id="react-post-comment-submit" type="button" style="background:none;border:none;color:#8b5cf6;font-weight:600;font-size:.98rem;cursor:pointer;white-space:nowrap;">Post</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(modal);
  }

  const toggleMobileChromeForModal = (isOpen) => {
    const nav = document.getElementById('memotions-mobile-nav');
    const brand = document.getElementById('memotions-mobile-brand');
    if (window.innerWidth > 768) return;
    document.body.classList.toggle('memotions-modal-open', !!isOpen);
    if (nav) nav.style.display = isOpen ? 'none' : '';
    if (brand) brand.style.display = isOpen ? 'none' : '';
  };

  const closeModal = () => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    toggleMobileChromeForModal(false);
  };

  modal.querySelector('#react-post-modal-close')?.addEventListener('click', closeModal);
  const HIDDEN_POSTS_KEY = 'memotions_hidden_posts_v1';
  const getHiddenPosts = () => {
    try { return JSON.parse(localStorage.getItem(HIDDEN_POSTS_KEY) || '[]'); } catch { return []; }
  };
  const setHiddenPosts = (arr) => {
    localStorage.setItem(HIDDEN_POSTS_KEY, JSON.stringify((arr || []).slice(0, 500)));
  };
  const hideCurrentModalPostEverywhere = () => {
    const id = modal.getAttribute('data-current-post-id') || '';
    const image = modal.querySelector('#react-post-modal-image')?.getAttribute('src') || '';
    const list = getHiddenPosts();
    const key = `${id}|${image}`;
    if (!list.includes(key)) list.unshift(key);
    setHiddenPosts(list);
    container.querySelectorAll('.meme-card,.post-card,.trending-card,.trending-item,.grid-item').forEach((card) => {
      const cid = card.getAttribute('data-id') || card.getAttribute('data-post-id') || card.dataset.reactPostId || '';
      const cimg = card.querySelector('img')?.getAttribute('src') || '';
      if ((id && cid && String(cid) === String(id)) || (image && cimg && cimg === image)) {
        card.style.display = 'none';
      }
    });
  };

  const openModalReportDialog = (onSubmit) => {
    let dlg = document.getElementById('mem-modal-report-dialog');
    if (!dlg) {
      dlg = document.createElement('div');
      dlg.id = 'mem-modal-report-dialog';
      dlg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.62);display:none;align-items:center;justify-content:center;z-index:12090;padding:16px;';
      dlg.innerHTML = `
        <div style="width:min(460px,95vw);background:linear-gradient(180deg,#101326 0%,#0b0f1d 100%);border:1px solid #2a3150;border-radius:16px;box-shadow:0 28px 64px rgba(0,0,0,.56);overflow:hidden;">
          <div style="padding:.9rem 1rem;border-bottom:1px solid #222844;display:flex;align-items:center;gap:.55rem;color:#eef2ff;font-weight:700;">
            <span style="width:28px;height:28px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:#2b1a4a;border:1px solid #52307c;color:#c4b5fd;">⚑</span>
            <span>Report Post</span>
          </div>
          <div style="padding:.9rem 1rem .75rem 1rem;color:#a8b3d7;font-size:.82rem;">Choose a category that best describes this content.</div>
          <div style="padding:0 1rem 1rem 1rem;display:grid;gap:.45rem;">
            ${['Spam', 'Harassment', 'Hate speech', 'Violence', 'Sexual content', 'Misinformation'].map((c) => `<button type="button" data-r="${c}" style="text-align:left;border:1px solid #2b3357;background:#141b33;color:#e2e8f0;border-radius:12px;padding:.58rem .72rem;cursor:pointer;font-weight:600;transition:all .15s ease;">${c}</button>`).join('')}
          </div>
          <div style="padding:.8rem 1rem;border-top:1px solid #222844;display:flex;justify-content:flex-end;">
            <button type="button" id="mem-modal-report-cancel" style="border:1px solid #394269;background:#141a30;color:#d1d5db;border-radius:11px;padding:.45rem .85rem;cursor:pointer;font-weight:600;">Cancel</button>
          </div>
        </div>`;
      document.body.appendChild(dlg);
      dlg.addEventListener('click', (e) => {
        if (e.target === dlg || e.target.id === 'mem-modal-report-cancel') {
          dlg.style.display = 'none';
          return;
        }
        const btn = e.target.closest('button[data-r]');
        if (!btn) return;
        dlg.style.display = 'none';
        onSubmit?.(btn.getAttribute('data-r') || 'Other');
      });
      dlg.addEventListener('mouseover', (e) => {
        const btn = e.target.closest('button[data-r]');
        if (!btn) return;
        btn.style.borderColor = '#8b5cf6';
        btn.style.background = '#1b2342';
      });
      dlg.addEventListener('mouseout', (e) => {
        const btn = e.target.closest('button[data-r]');
        if (!btn) return;
        btn.style.borderColor = '#2b3357';
        btn.style.background = '#141b33';
      });
    }
    dlg.style.display = 'flex';
  };
  if (modal.dataset.escBound !== '1') {
    modal.dataset.escBound = '1';
    document.addEventListener('keydown', (evt) => {
      if (evt.key === 'Escape' && modal.style.display === 'flex') closeModal();
    });
  }
  modal.addEventListener('click', (evt) => {
    if (evt.target === modal) closeModal();
  });

  const imageEl = modal.querySelector('#react-post-modal-image');
  const likeCountEl = modal.querySelector('#react-post-like-count');
  const captionEl = modal.querySelector('#react-post-caption');
  const author1 = modal.querySelector('#react-post-author-1');
  const author2 = modal.querySelector('#react-post-author-2');
  const timeTop = modal.querySelector('#react-post-time');
  const timeBottom = modal.querySelector('#react-post-time-bottom');
  const commentsList = modal.querySelector('#react-post-comments-list');
  const commentInput = modal.querySelector('#react-post-comment-input');
  const commentSubmit = modal.querySelector('#react-post-comment-submit');
  const likeBtn = modal.querySelector('#react-post-like');
  const commentBtn = modal.querySelector('#react-post-comment');
  const shareBtn = modal.querySelector('#react-post-share');
  const reactionsWrap = modal.querySelector('#react-post-reactions');
  const INTERACTIONS_KEY = 'memotions_post_interactions';
  const INTERACTIONS_MIGRATION_KEY = 'memotions_post_interactions_migrated_v2';
  const INTERACTIONS_MIGRATION_KEY_V3 = 'memotions_post_interactions_migrated_v3';
  const isEphemeralId = (id) => {
    const s = String(id || '');
    return !s || /^modal-\d+/.test(s) || /^grid-\d+/.test(s) || /^card-\d+/.test(s) || /^saved-\d+/.test(s);
  };
  const simpleHash = (txt) => {
    let h = 0;
    const str = String(txt || '');
    for (let i = 0; i < str.length; i += 1) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h).toString(36);
  };
  const getStablePostId = (payload = {}) => {
    // Never trust raw payload.id alone because many pages reuse simple ids
    // (e.g. 1,2,3) across different posts/routes which causes state collisions.
    const core = [
      window.location.pathname || '/',
      String(payload.id || ''),
      payload.image || '',
      payload.caption || '',
      payload.creator || '',
    ].join('|');
    return `post_${simpleHash(core)}`;
  };
  const deriveDomPostId = (el, kind) => {
    if (!el) return `post_${Date.now()}`;
    if (el.dataset.reactPostId) return el.dataset.reactPostId;
    const parent = el.parentElement;
    const siblings = parent ? Array.from(parent.children).filter((n) => n.matches?.('.grid-item, .meme-card, .post-card, .trending-card, .trending-item, .immortal-card, .rising-card')) : [];
    const index = Math.max(0, siblings.indexOf(el));
    const img = el.querySelector('img')?.getAttribute('src') || '';
    const title =
      el.querySelector('.post-title, .meme-caption, .caption, .card-title, .trending-title')?.textContent?.trim() ||
      '';
    const path = window.location.pathname || '/';
    el.dataset.reactPostId = `dom_${simpleHash([path, kind, index, img, title].join('|'))}`;
    return el.dataset.reactPostId;
  };
  const makeToast = (html, duration = 2200) => {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:11000;background:#13162a;border:1px solid #313a5f;color:#e5e7eb;padding:.55rem .8rem;border-radius:.8rem;font-size:.8rem;box-shadow:0 10px 26px rgba(0,0,0,.35);';
    t.innerHTML = html;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), duration);
    return t;
  };

  const getInteractions = () => {
    try {
      return JSON.parse(localStorage.getItem(INTERACTIONS_KEY) || '{}');
    } catch {
      return {};
    }
  };
  const migrateLegacyInteractionKeys = () => {
    try {
      if (localStorage.getItem(INTERACTIONS_MIGRATION_KEY) === '1') return;
      const raw = JSON.parse(localStorage.getItem(INTERACTIONS_KEY) || '{}');
      const cleaned = {};
      Object.entries(raw || {}).forEach(([k, v]) => {
        const key = String(k || '');
        // Keep only current stable format keys; drop known-collision legacy keys.
        if (!key.startsWith('post_')) return;
        cleaned[key] = v;
      });
      localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(cleaned));
      localStorage.setItem(INTERACTIONS_MIGRATION_KEY, '1');
    } catch {
      // ignore migration failures
    }
  };
  migrateLegacyInteractionKeys();
  const dedupeLegacyComments = (nodes = []) => {
    const legacySeedKeys = new Set([
      'gif_goddess|This is so relatable! 😂',
      'reactionking|Me every Monday morning 😅',
    ]);
    const seenIds = new Set();
    const walk = (arr = []) =>
      (arr || []).reduce((acc, node) => {
        if (!node || typeof node !== 'object') return acc;
        const id = String(node.id || '');
        if (id && seenIds.has(id)) return acc;
        if (id) seenIds.add(id);
        const by = String(node.by || '').trim();
        const text = String(node.text || '').trim();
        const legacyKey = `${by}|${text}`;
        if (legacySeedKeys.has(legacyKey)) {
          // Remove legacy built-in seed comments entirely.
          return acc;
        }
        const cleaned = { ...node, replies: walk(node.replies || []) };
        acc.push(cleaned);
        return acc;
      }, []);
    return walk(nodes);
  };
  const purgeLegacySeedCommentsOnce = () => {
    try {
      if (localStorage.getItem(INTERACTIONS_MIGRATION_KEY_V3) === '1') return;
      const raw = JSON.parse(localStorage.getItem(INTERACTIONS_KEY) || '{}');
      const cleaned = {};
      Object.entries(raw || {}).forEach(([k, v]) => {
        const key = String(k || '');
        if (!key.startsWith('post_')) return;
        const state = v && typeof v === 'object' ? v : {};
        cleaned[key] = {
          ...state,
          comments: dedupeLegacyComments(Array.isArray(state.comments) ? state.comments : []),
        };
      });
      localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(cleaned));
      localStorage.setItem(INTERACTIONS_MIGRATION_KEY_V3, '1');
    } catch {
      // ignore migration failures
    }
  };
  purgeLegacySeedCommentsOnce();
  const setInteractions = (data) => {
    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(data));
  };
  const getPostState = (postId, defaults = {}) => {
    const all = getInteractions();
    const base = all[postId] || {
      liked: false,
      saved: false,
      likeCount: defaults.likeCount || '0',
      commentCount: defaults.commentCount || '0',
      reactions: defaults.reactions || {},
      comments: defaults.comments || [],
    };
    const normalized = {
      ...base,
      comments: dedupeLegacyComments(Array.isArray(base.comments) ? base.comments : []),
    };
    if (all[postId]) {
      all[postId] = normalized;
      setInteractions(all);
    }
    return normalized;
  };
  const setPostState = (postId, next) => {
    const all = getInteractions();
    all[postId] = next;
    setInteractions(all);
  };
  const parseCount = (v) => {
    const s = String(v || '0').trim();
    if (s.endsWith('K')) return Math.round((parseFloat(s) || 0) * 1000);
    if (s.endsWith('M')) return Math.round((parseFloat(s) || 0) * 1000000);
    return parseInt(s.replace(/\D/g, ''), 10) || 0;
  };
  const extractCountToken = (raw) => {
    const m = String(raw || '').match(/(\d+(?:\.\d+)?\s*[KkMm]?)/);
    return m ? m[1].replace(/\s+/g, '') : '0';
  };
  const formatCount = (n) => {
    if (n < 10000) return Number(n || 0).toLocaleString('en-US');
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(Math.max(0, n));
  };
  const formatRelativeTime = (epochMs) => {
    const diff = Math.max(0, Date.now() - (Number(epochMs) || Date.now()));
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'now';
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d`;
    const week = Math.floor(day / 7);
    return `${week}w`;
  };
  const upsertSeedComments = (state) => {
    if (Array.isArray(state.comments) && state.comments.length) return;
    if (!commentsList) {
      state.comments = [];
      return;
    }
    const seededRows = commentsList.querySelectorAll('.rp-comment-row');
    state.comments = Array.from(seededRows).map((row, idx) => ({
      id: row.dataset.commentId || `seeded_${idx}`,
      by: row.querySelector('span')?.textContent?.trim() || 'user',
      text: row.querySelector('.rp-comment-text')?.textContent?.trim() || '',
      at: Date.now() - (idx + 1) * 3600000,
      liked: row.querySelector('.rp-like-btn')?.dataset.on === '1',
      replies: [],
    }));
  };

  const patchThread = (nodes = [], targetId, updater) =>
    (nodes || []).map((node) => {
      if (String(node.id) === String(targetId)) return updater(node);
      const nextReplies = patchThread(node.replies || [], targetId, updater);
      if (nextReplies === (node.replies || [])) return node;
      return { ...node, replies: nextReplies };
    });

  const createThreadRow = (entry = {}, depth = 0, parentBy = '') => {
    const normalizedBy = (entry.by || '').trim().toLowerCase();
    const normalizedParent = (parentBy || '').trim().toLowerCase();
    const effectiveDepth = normalizedBy && normalizedParent && normalizedBy === normalizedParent
      ? depth
      : depth;
    const row = document.createElement('div');
    row.className = effectiveDepth === 0 ? 'rp-comment-row' : 'rp-reply-row';
    row.dataset.commentId = entry.id || `c_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    row.dataset.depth = String(effectiveDepth);
    row.style.cssText = `display:flex;gap:.85rem;padding:${effectiveDepth === 0 ? '1rem 1.2rem' : '.65rem 0 .2rem 0'};${effectiveDepth === 0 ? 'border-bottom:1px solid #171a2a;' : ''}margin-left:${effectiveDepth * 18}px;`;
    row.innerHTML =
      `<div style="width:${effectiveDepth === 0 ? '38' : '26'}px;height:${effectiveDepth === 0 ? '38' : '26'}px;border-radius:50%;overflow:hidden;flex-shrink:0;opacity:${effectiveDepth === 0 ? '1' : '.95'};"><img src="https://robohash.org/currentuser?set=set4&size=40x40" alt="avatar" style="width:100%;height:100%;object-fit:cover;" /></div>` +
      '<div style="flex:1;">' +
      `<div style="display:flex;align-items:baseline;gap:.6rem;flex-wrap:wrap;margin-bottom:.3rem;"><span style="font-weight:${effectiveDepth === 0 ? '700' : '650'};font-size:${effectiveDepth === 0 ? '.85rem' : '.75rem'};">${entry.by || 'You'}</span><span style="font-size:.7rem;color:#6b7280;">@current_user</span><span style="font-size:.65rem;color:#6b7280;">${formatRelativeTime(entry.at)}</span></div>` +
      `<div class="rp-comment-text" style="font-size:${effectiveDepth === 0 ? '.85rem' : '.78rem'};color:#e5e7eb;line-height:1.4;"></div>` +
      '<div class="rp-comment-actions" style="display:flex;gap:.95rem;margin-top:.35rem;font-size:.72rem;color:#8b92ad;">' +
      '<button class="rp-like-btn" type="button" style="border:0;background:transparent;color:inherit;cursor:pointer;padding:0;display:inline-flex;align-items:center;gap:.3rem;"></button>' +
      '<button class="rp-reply-btn" type="button" style="border:0;background:transparent;color:inherit;cursor:pointer;padding:0;display:inline-flex;align-items:center;gap:.3rem;"><i class="fas fa-reply"></i><span>Reply</span></button>' +
      '</div>' +
      '<div class="rp-replies" style="margin-top:.3rem;"></div>' +
      '</div>';
    const txt = row.querySelector('.rp-comment-text');
    if (txt) txt.textContent = entry.text || '';
    const likeBtnEl = row.querySelector('.rp-like-btn');
    const isLiked = !!entry.liked;
    if (likeBtnEl) {
      likeBtnEl.dataset.on = isLiked ? '1' : '0';
      likeBtnEl.innerHTML = isLiked
        ? '<i class="fas fa-heart" style="color:#f43f5e;"></i><span>Liked</span>'
        : '<i class="far fa-heart"></i><span>Like</span>';
    }
    const repliesWrap = row.querySelector('.rp-replies');
    (entry.replies || []).forEach((reply) => {
      const childBy = (reply?.by || '').trim().toLowerCase();
      const parentSameUser = childBy && childBy === normalizedBy;
      const childDepth = parentSameUser ? effectiveDepth : effectiveDepth + 1;
      repliesWrap?.appendChild(createThreadRow(reply, childDepth, entry.by || ''));
    });
    return row;
  };

  const renderPersistedComments = (postId, defaults = {}) => {
    if (!commentsList) return;
    const state = getPostState(postId, defaults);
    // Fully reset the list so static template comments never duplicate with
    // persisted/dynamic comments across different posts.
    commentsList.innerHTML = '';

    const thread = Array.isArray(state.comments) ? state.comments : [];
    if (!thread.length) return;

    const sort = modal.dataset.commentSort === 'top' ? 'top' : 'newest';
    const sorted = thread
      .slice()
      .sort((a, b) => {
        if (sort === 'top') {
          const as = Number(!!a.liked) + (a.replies?.length || 0);
          const bs = Number(!!b.liked) + (b.replies?.length || 0);
          if (bs !== as) return bs - as;
        }
        return (b.at || 0) - (a.at || 0);
      });
    sorted.forEach((comment) => commentsList.appendChild(createThreadRow(comment, 0)));
  };

  const openUnifiedModal = (payload = {}) => {
    const likesText = String(payload.likes ?? '0');
    if (imageEl) {
      imageEl.src = payload.image || '';
      imageEl.style.maxHeight = '72vh';
      imageEl.style.objectFit = 'contain';
      imageEl.style.background = '#000';
    }
    if (captionEl) captionEl.textContent = payload.caption || 'Meme Post';
    if (author1) author1.textContent = payload.creator || 'memotions_user';
    if (author2) author2.textContent = payload.creator || 'memotions_user';
    const strongClose = modal.querySelector('#react-post-modal-close');
    if (strongClose) {
      strongClose.style.cssText = 'position:absolute;top:10px;right:12px;z-index:5;border:1px solid #374151;background:#121425;color:#e5e7eb;border-radius:10px;padding:.25rem .5rem;cursor:pointer;';
    }
    if (commentSubmit) commentSubmit.style.cssText = 'background:linear-gradient(135deg,#8b5cf6,#7c3aed);border:0;color:#fff;border-radius:999px;padding:.35rem .85rem;font-weight:700;font-size:.82rem;cursor:pointer;';

    let sortWrap = modal.querySelector('.rp-sort-wrap');
    if (!sortWrap) {
      sortWrap = document.createElement('div');
      sortWrap.className = 'rp-sort-wrap';
      sortWrap.innerHTML = `<button type="button" class="rp-sort-btn active" data-sort="newest">Newest</button><button type="button" class="rp-sort-btn" data-sort="top">Top</button>`;
      commentsList?.parentElement?.insertBefore(sortWrap, commentsList);
      sortWrap.addEventListener('click', (e) => {
        const b = e.target.closest('.rp-sort-btn');
        if (!b) return;
        modal.dataset.commentSort = b.dataset.sort || 'newest';
        sortWrap.querySelectorAll('.rp-sort-btn').forEach((x) => x.classList.toggle('active', x === b));
        renderPersistedComments(modal.getAttribute('data-current-post-id') || '');
      });
    }

    let replyChip = modal.querySelector('.rp-replying-chip');
    if (!replyChip) {
      replyChip = document.createElement('div');
      replyChip.className = 'rp-replying-chip';
      replyChip.innerHTML = `<span class="rp-replying-text"></span><button type="button" aria-label="Cancel reply">✕</button>`;
      commentInput?.parentElement?.insertBefore(replyChip, commentInput);
      replyChip.querySelector('button')?.addEventListener('click', () => {
        if (commentInput) {
          delete commentInput.dataset.replyTo;
          commentInput.value = '';
        }
        replyChip.style.display = 'none';
      });
    }

    modal.querySelector('#rp-comment-context-chip')?.remove();
    if (likeCountEl) likeCountEl.textContent = extractCountToken(likesText || '0');
    if (reactionsWrap && Array.isArray(payload.reactions) && payload.reactions.length) {
      const nodes = reactionsWrap.querySelectorAll('.rp-reaction');
      payload.reactions.slice(0, nodes.length).forEach((r, i) => {
        const node = nodes[i];
        if (!node) return;
        const spans = node.querySelectorAll('span');
        if (spans[0]) spans[0].textContent = r.emoji || spans[0].textContent;
        if (spans[1]) spans[1].textContent = r.count || spans[1].textContent;
      });
    }
    modal.setAttribute('data-current-post-id', getStablePostId(payload));
    const postId = modal.getAttribute('data-current-post-id');
    const state = getPostState(postId, {
      likeCount: extractCountToken(likesText),
      commentCount: extractCountToken(payload.comments ?? '0'),
      reactions: {
        '😂': { count: 2100, active: false },
        '💀': { count: 1800, active: false },
        '🔥': { count: 1500, active: false },
        '❤️': { count: 1200, active: false },
        '😭': { count: 956, active: false },
        '👏': { count: 743, active: false },
      },
    });
    if (!getInteractions()[postId]) {
      setPostState(postId, state);
    }
    if (likeCountEl) likeCountEl.textContent = extractCountToken(state.likeCount || likesText || '0');
    if (likeBtn) {
      likeBtn.innerHTML = state.liked
        ? '<i class="fas fa-heart" style="color:#f43f5e;"></i>'
        : '<i class="far fa-heart"></i>';
    }
    if (saveBtn) {
      const savedList = parseJsonArray(localStorage.getItem('memotions_saved_posts'));
      const isInSavedList = savedList.some((x) => String(x.id) === String(postId));
      state.saved = state.saved || isInSavedList;
      setPostState(postId, state);
      saveBtn.dataset.saved = state.saved ? '1' : '0';
      saveBtn.innerHTML = state.saved ? '<i class="fas fa-bookmark" style="color:#fbbf24;"></i>' : '<i class="far fa-bookmark"></i>';
    }
    if (reactionsWrap) {
      const reactionBtns = reactionsWrap.querySelectorAll('.rp-reaction');
      reactionBtns.forEach((btn) => {
        const emoji = btn.getAttribute('data-emoji') || '';
        const saved = state.reactions?.[emoji];
        const countEl = btn.querySelector('.rp-reaction-count');
        if (countEl && saved && Number.isFinite(Number(saved.count))) countEl.textContent = formatCount(Number(saved.count));
        btn.style.borderColor = saved?.active ? '#8b5cf6' : 'transparent';
        btn.style.background = saved?.active ? 'rgba(139,92,246,.2)' : 'transparent';
      });
    }
    renderPersistedComments(postId);

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    toggleMobileChromeForModal(true);
  };
  window.__openUnifiedPostModal = openUnifiedModal;
  const saveBtn = modal.querySelector('#react-post-save');
  const headerRow =
    modal.querySelector('#react-post-author-1')?.closest('div')?.parentElement?.parentElement ||
    modal.querySelector('#react-post-avatar')?.closest('div')?.parentElement ||
    modal.querySelector('#react-post-modal-close')?.parentElement;
  if (headerRow && !modal.querySelector('#react-post-kebab')) {
    headerRow.style.position = 'relative';
    const kb = document.createElement('button');
    kb.id = 'react-post-kebab';
    kb.className = 'post-action';
    kb.type = 'button';
    kb.style.cssText = 'position:absolute;right:.85rem;top:.85rem;background:none;border:none;color:#cbd5e1;font-size:1.2rem;cursor:pointer;z-index:4;';
    kb.textContent = '⋯';
    const menu = document.createElement('div');
    menu.id = 'react-post-kebab-menu';
    menu.style.cssText = 'position:absolute;right:.85rem;top:2.7rem;min-width:190px;background:#141a2f;border:1px solid #2d3a62;border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,.4);padding:.3rem;display:none;z-index:30;';
    menu.innerHTML = `
      <button class="mem-menu-item" data-a="hide"><i class="fas fa-eye-slash"></i><span>Hide post</span></button>
      <button class="mem-menu-item" data-a="not"><i class="fas fa-ban"></i><span>Not interested</span></button>
      <button class="mem-menu-item" data-a="report"><i class="fas fa-flag"></i><span>Report</span></button>
    `;
    headerRow.appendChild(kb);
    headerRow.appendChild(menu);
    const modalToast = (msg, ok = true) => {
      const t = document.createElement('div');
      t.style.cssText = `position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:12040;background:${ok ? 'linear-gradient(135deg,#0f2a1f,#103022)' : 'linear-gradient(135deg,#2a1d10,#33210f)'};border:1px solid ${ok ? '#1f7a46' : '#9a6a1f'};color:#e2e8f0;padding:.58rem .85rem;border-radius:.75rem;font-size:.79rem;display:flex;align-items:center;gap:.5rem;box-shadow:0 16px 34px rgba(0,0,0,.4);`;
      t.innerHTML = `<span>${ok ? '✅' : '⚠️'}</span><span>${msg}</span>`;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 1800);
    };
    kb.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });
    menu.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      menu.style.display = 'none';
      if (b.dataset.a === 'hide') {
        hideCurrentModalPostEverywhere();
        closeModal();
        modalToast('Post hidden from your feed');
        return;
      }
      if (b.dataset.a === 'not') {
        closeModal();
        modalToast('We will show fewer posts like this');
        return;
      }
      if (b.dataset.a === 'report') {
        openModalReportDialog((category) => modalToast(`Report submitted: ${category}`));
      }
    });
    modal.addEventListener('click', (e) => {
      if (e.target === kb || kb.contains(e.target) || menu.contains(e.target)) return;
      menu.style.display = 'none';
    });
  }

  const persistSharePayload = (payload) => {
    try {
      localStorage.setItem('memotions_share_meme', JSON.stringify(payload));
    } catch {
      // ignore storage failures and still navigate
    }
  };
  const openShareDialog = (payload) => {
    window.__memotionsOpenShareDialog?.(payload);
  };

  container.querySelectorAll('.grid-item').forEach((item) => {
    if (item.dataset.reactModalBound === '1') return;
    item.dataset.reactModalBound = '1';
    item.addEventListener(
      'click',
      (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        evt.stopImmediatePropagation?.();

        const img = item.querySelector('img');
        const likesText =
          item.querySelector('.likes')?.textContent?.trim() ||
          item.querySelector('.overlay-stat')?.textContent?.trim() ||
          '0';
        const commentsText =
          item.querySelector('.comments')?.textContent?.trim() ||
          item.querySelectorAll('.overlay-stat')?.[1]?.textContent?.trim() ||
          '0';
        const title =
          item.querySelector('.post-title')?.textContent?.trim() ||
          item.querySelector('.meme-caption')?.textContent?.trim() ||
          'Meme Post';
        const userName =
          item.querySelector('.username')?.textContent?.replace('@', '').trim() ||
          container.querySelector('.profile-info h2')?.textContent?.trim() ||
          document.querySelector('.username')?.textContent?.trim() ||
          'meme_user';
        const postId =
          item.getAttribute('data-id') ||
          item.getAttribute('data-post-id') ||
          deriveDomPostId(item, 'grid');

        openUnifiedModal({
          id: postId,
          image: img?.src || '',
          caption: title,
          creator: userName,
          likes: likesText || '0',
          comments: commentsText || '0',
        });
        persistSharePayload({
          id: postId,
          creator: userName,
          caption: title,
          image: img?.src || '',
          likes: likesText,
          comments: commentsText,
          shares: '1.2K',
        });

      },
      true
    );
  });

  if (likeBtn && !likeBtn.dataset.bound) {
    likeBtn.dataset.bound = '1';
    likeBtn.addEventListener('click', () => {
      const postId = modal.getAttribute('data-current-post-id') || `modal-${Date.now()}`;
      const state = getPostState(postId, {
        likeCount: likeCountEl?.textContent || '0',
      });
      state.liked = !state.liked;
      const base = parseCount(state.likeCount || likeCountEl?.textContent || '0');
      const next = Math.max(0, base + (state.liked ? 1 : -1));
      state.likeCount = formatCount(next);
      setPostState(postId, state);
      if (likeCountEl) likeCountEl.textContent = state.likeCount;
      likeBtn.innerHTML = state.liked
        ? '<i class="fas fa-heart" style="color:#f43f5e;"></i>'
        : '<i class="far fa-heart"></i>';
    });
  }
  if (reactionsWrap && reactionsWrap.dataset.bound !== '1') {
    reactionsWrap.dataset.bound = '1';
    reactionsWrap.querySelectorAll('.rp-reaction').forEach((btn) => {
      btn.addEventListener('click', () => {
        const postId = modal.getAttribute('data-current-post-id') || `modal-${Date.now()}`;
        const emoji = btn.getAttribute('data-emoji') || '';
        const state = getPostState(postId, {});
        state.reactions = state.reactions || {};
        if (!state.reactions[emoji]) state.reactions[emoji] = { count: parseCount(btn.querySelector('.rp-reaction-count')?.textContent || '0'), active: false };
        const r = state.reactions[emoji];
        r.active = !r.active;
        r.count = Math.max(0, (parseInt(r.count, 10) || 0) + (r.active ? 1 : -1));
        state.reactions[emoji] = r;
        setPostState(postId, state);
        const countEl = btn.querySelector('.rp-reaction-count');
        if (countEl) countEl.textContent = formatCount(r.count);
        btn.style.borderColor = r.active ? '#8b5cf6' : 'transparent';
        btn.style.background = r.active ? 'rgba(139,92,246,.2)' : 'transparent';
      });
    });
  }
  if (commentBtn && !commentBtn.dataset.bound) {
    commentBtn.dataset.bound = '1';
    commentBtn.style.display = 'none';
  }
  if (shareBtn && !shareBtn.dataset.bound) {
    shareBtn.dataset.bound = '1';
    shareBtn.style.color = '#a78bfa';
    shareBtn.addEventListener('click', () => {
      const currentPostId = modal.getAttribute('data-current-post-id') || `modal-${Date.now()}`;
      const payload = {
        id: currentPostId,
        creator: author1?.textContent?.trim() || 'memotions_user',
        caption: captionEl?.textContent?.trim() || 'Shared from Memotions',
        image: imageEl?.src || '',
        likes: likeCountEl?.textContent?.trim() || '0',
        comments: '0',
        shares: '1.2K',
      };
      persistSharePayload(payload);
      openShareDialog(payload);
    });
  }
  if (saveBtn && !saveBtn.dataset.bound) {
    saveBtn.dataset.bound = '1';
    saveBtn.addEventListener('click', () => {
      const isSaved = saveBtn.dataset.saved === '1';
      saveBtn.dataset.saved = isSaved ? '0' : '1';
      saveBtn.innerHTML = isSaved ? '<i class="far fa-bookmark"></i>' : '<i class="fas fa-bookmark" style="color:#fbbf24;"></i>';
      const payload = {
        id: modal.getAttribute('data-current-post-id') || getStablePostId({
          image: imageEl?.src || '',
          caption: captionEl?.textContent?.trim() || 'Saved meme',
          creator: author1?.textContent?.trim() || 'memotions_user',
        }),
        image: imageEl?.src || '',
        caption: captionEl?.textContent?.trim() || 'Saved meme',
        likes: likeCountEl?.textContent?.trim() || '0',
        savedAt: Date.now(),
      };
      let saved = parseJsonArray(localStorage.getItem('memotions_saved_posts'));
      if (!isSaved) {
        const existingIndex = saved.findIndex((x) => String(x.id) === String(payload.id));
        if (existingIndex >= 0) saved.splice(existingIndex, 1);
        saved.unshift(payload);
        const toast = makeToast(`Saved to collection <button type="button" style="margin-left:.5rem;background:#1f2742;border:1px solid #3b4a78;color:#c7d2fe;border-radius:999px;padding:.15rem .55rem;cursor:pointer;">Undo</button>`, 3200);
        toast.querySelector('button')?.addEventListener('click', () => {
          const next = parseJsonArray(localStorage.getItem('memotions_saved_posts')).filter((x) => String(x.id) !== String(payload.id));
          localStorage.setItem('memotions_saved_posts', JSON.stringify(next.slice(0, 200)));
          saveBtn.dataset.saved = '0';
          saveBtn.innerHTML = '<i class="far fa-bookmark"></i>';
          toast.remove();
        });
      } else {
        saved = saved.filter((x) => String(x.id) !== String(payload.id));
      }
      localStorage.setItem('memotions_saved_posts', JSON.stringify(saved.slice(0, 200)));
    });
  }
  if (commentSubmit && !commentSubmit.dataset.bound) {
    commentSubmit.dataset.bound = '1';
    const submitComment = () => {
      const text = commentInput?.value?.trim();
      if (!text || !commentsList) return;
      const postId = modal.getAttribute('data-current-post-id') || `modal-${Date.now()}`;
      const state = getPostState(postId, {});
      state.comments = Array.isArray(state.comments) ? state.comments : [];

      const replyTo = commentInput?.dataset.replyTo;
      if (replyTo) {
        const reply = { id: `r_${Date.now()}`, by: 'You', text, at: Date.now() };
        if (!Array.isArray(state.comments) || !state.comments.length) {
          const seededRows = commentsList.querySelectorAll('.rp-comment-row');
          state.comments = Array.from(seededRows).map((row, idx) => ({
            id: row.dataset.commentId || `seeded_${idx}`,
            by: row.querySelector('span')?.textContent?.trim() || 'user',
            text: row.querySelector('.rp-comment-text')?.textContent?.trim() || '',
            at: Date.now() - (idx + 1) * 3600000,
            liked: row.querySelector('.rp-like-btn')?.dataset.on === '1',
            replies: [],
          }));
        }
        state.comments = patchThread(state.comments, replyTo, (node) => ({
          ...node,
          replies: [...(node.replies || []), reply],
        }));
        setPostState(postId, state);
        const targetRow = commentsList.querySelector(`[data-comment-id="${replyTo}"]`);
        const targetWrap = targetRow?.querySelector('.rp-replies');
        targetWrap?.appendChild(createThreadRow(reply, Number(targetRow?.dataset.depth || 0) + 1));
        commentInput.value = '';
        delete commentInput.dataset.replyTo;
        return;
      }

      const commentObj = { id: `c_${Date.now()}_${Math.floor(Math.random() * 10000)}`, by: 'You', text, at: Date.now(), liked: false, replies: [] };
      state.comments.unshift(commentObj);
      setPostState(postId, state);
      commentsList.prepend(createThreadRow(commentObj, 0));
      commentInput.value = '';
    };
    commentSubmit.addEventListener('click', submitComment);
    commentInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitComment();
      }
    });
  }

  if (commentsList && commentsList.dataset.actionsBound !== '1') {
    commentsList.dataset.actionsBound = '1';
    commentsList.addEventListener('click', (e) => {
      const likeRowBtn = e.target.closest('.rp-like-btn');
      if (likeRowBtn) {
        const row = likeRowBtn.closest('[data-comment-id]');
        const commentId = row?.dataset.commentId;
        const on = likeRowBtn.dataset.on === '1';
        likeRowBtn.dataset.on = on ? '0' : '1';
        likeRowBtn.innerHTML = on
          ? '<i class="far fa-heart"></i><span>Like</span>'
          : '<i class="fas fa-heart" style="color:#f43f5e;"></i><span>Liked</span>';
        const postId = modal.getAttribute('data-current-post-id') || `modal-${Date.now()}`;
        const state = getPostState(postId, {});
        upsertSeedComments(state);
        state.comments = patchThread(state.comments || [], commentId, (node) => ({ ...node, liked: !on }));
        setPostState(postId, state);
        return;
      }
      const replyBtn = e.target.closest('.rp-reply-btn');
      if (replyBtn) {
        const row = replyBtn.closest('[data-comment-id]');
        const user = row?.querySelector('span')?.textContent?.trim() || 'user';
        const commentId = row?.dataset.commentId;
        if (commentInput) commentInput.value = `@${user} `;
        if (commentInput) commentInput.dataset.replyTo = commentId || '';
        const chip = modal.querySelector('.rp-replying-chip');
        const chipText = chip?.querySelector('.rp-replying-text');
        if (chip && chipText) {
          chipText.textContent = `Replying to @${user}`;
          chip.style.display = 'inline-flex';
        }
        commentInput?.focus();
      }
    });
  }
}

function injectFeedAndHofModalOpen(container) {
  if (!container) return;
  const simpleHash = (txt) => {
    let h = 0;
    const str = String(txt || '');
    for (let i = 0; i < str.length; i += 1) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h).toString(36);
  };
  const deriveCardPostId = (card) => {
    if (!card) return `post_${Date.now()}`;
    if (card.dataset.reactPostId) return card.dataset.reactPostId;
    const parent = card.parentElement;
    const siblings = parent ? Array.from(parent.children).filter((n) => n.matches?.('.meme-card, .post-card, .trending-card, .trending-item, .immortal-card, .rising-card, .grid-item')) : [];
    const index = Math.max(0, siblings.indexOf(card));
    const img = card.querySelector('img')?.getAttribute('src') || '';
    const title =
      card.querySelector('.card-title, .meme-caption, .caption, .trending-title')?.textContent?.trim() ||
      '';
    const creator =
      card.querySelector('.username, .creator-name, .card-creator span')?.textContent?.trim() ||
      '';
    const path = window.location.pathname || '/';
    card.dataset.reactPostId = `dom_${simpleHash([path, index, img, title, creator].join('|'))}`;
    return card.dataset.reactPostId;
  };
  const openFromCard = (card) => {
    const img = card.querySelector('img');
    if (!img) return;
    const title =
      card.querySelector('.card-title')?.textContent?.trim() ||
      card.querySelector('.meme-caption')?.textContent?.trim() ||
      card.querySelector('.caption')?.textContent?.trim() ||
      card.querySelector('.trending-title')?.textContent?.trim() ||
      'Meme Post';
    const likes =
      card.querySelector('.action-btn.like-btn span')?.textContent?.trim() ||
      card.querySelector('.card-stats span:nth-child(1)')?.textContent?.trim() ||
      card.querySelector('.card-metrics span:nth-child(1)')?.textContent?.trim() ||
      card.querySelector('.overlay-stat')?.textContent?.trim() ||
      '0';
    const comments =
      card.querySelector('.action-btn.comment-btn span')?.textContent?.trim() ||
      card.querySelector('.card-stats span:nth-child(2)')?.textContent?.trim() ||
      card.querySelector('.card-metrics span:nth-child(2)')?.textContent?.trim() ||
      card.querySelectorAll('.overlay-stat')?.[1]?.textContent?.trim() ||
      '0';
    const creator =
      card.querySelector('.username')?.textContent?.replace('@', '').trim() ||
      card.querySelector('.creator-name')?.textContent?.trim() ||
      card.querySelector('.card-creator span')?.textContent?.replace(/\s+/g, ' ').trim() ||
      container.querySelector('.profile-info h2')?.textContent?.trim() ||
      'memotions_user';
    const payload = {
      id: card.getAttribute('data-id') || card.getAttribute('data-post-id') || deriveCardPostId(card),
      image: img.src,
      caption: title,
      creator,
      likes,
      comments,
      reactions: Array.from(card.querySelectorAll('.reaction-item')).slice(0, 3).map((r) => ({
        emoji: r.querySelector('.reaction-emoji')?.textContent?.trim() || '',
        count: r.querySelector('.reaction-count')?.textContent?.trim() || '0',
      })),
    };
    window.__openUnifiedPostModal?.(payload);
  };

  container.querySelectorAll('.meme-card, .immortal-card, .rising-card, .trending-item, .trending-card').forEach((card) => {
    if (card.dataset.modalBound === '1') return;
    card.dataset.modalBound = '1';
    card.addEventListener('click', (e) => {
      if (e.target.closest('.action-btn, .add-reaction-btn, .reaction-item, button, a')) return;
      if (!e.target.closest('img, .meme-caption, .caption, .card-title, .post-title, .username, .creator-name, .trending-title')) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      openFromCard(card);
    }, true);
  });

  // Rebind after dynamic tab renders (Trending/Hall of Fame pages).
  container.querySelectorAll('.category-tab, .tab').forEach((tab) => {
    if (tab.dataset.modalRebindBound === '1') return;
    tab.dataset.modalRebindBound = '1';
    tab.addEventListener('click', () => {
      setTimeout(() => injectFeedAndHofModalOpen(container), 80);
    });
  });
}

function injectFollowButtons(container) {
  if (!container) return;
  container.querySelectorAll('.follow-btn, .follow-btn-sm, button').forEach((btn) => {
    const txt = btn.textContent?.trim().toLowerCase();
    if (!txt || (!txt.includes('follow') && !txt.includes('following'))) return;
    if (btn.dataset.followBound === '1') return;
    btn.dataset.followBound = '1';
    btn.dataset.followBaseBg = btn.style.background || '';
    btn.dataset.followBaseColor = btn.style.color || '';
    btn.dataset.followBaseBorder = btn.style.borderColor || '';
    const isFollowing = txt.includes('following');
    btn.dataset.on = isFollowing ? '1' : '0';
    if (isFollowing) {
      btn.style.background = 'transparent';
      btn.style.color = '#d1d5db';
      btn.style.borderColor = '#374151';
    } else {
      btn.style.background = '#8b5cf6';
      btn.style.color = '#fff';
      btn.style.borderColor = '#8b5cf6';
    }
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      const on = btn.dataset.on === '1';
      btn.dataset.on = on ? '0' : '1';
      btn.textContent = on ? 'Follow' : 'Following';
      if (on) {
        // Back to "Follow" state: keep it purple/primary (not black fallback).
        btn.style.background = '#8b5cf6';
        btn.style.color = '#fff';
        btn.style.borderColor = '#8b5cf6';
      } else {
        // "Following" state: subtle outlined treatment.
        btn.style.background = 'transparent';
        btn.style.color = '#d1d5db';
        btn.style.borderColor = '#374151';
      }
    }, true);
  });
}

function removeTopNavOnPolicyPages(container) {
  if (!container) return;
  const p = window.location.pathname;
  if (!['/settings', '/about', '/tos', '/privacy'].includes(p)) return;
  container.querySelectorAll('.top-nav').forEach((n) => n.remove());
}

function fixMemotionsLayoutGap(container) {
  if (!container || window.location.pathname !== '/memotions') return;
  const root = document.getElementById('parity-page-root');
  if (root) {
    root.style.margin = '0';
    root.style.padding = '0';
    root.style.width = '100%';
    root.style.background = '#090913';
  }
  document.documentElement.style.background = '#090913';
  document.documentElement.style.margin = '0';
  document.documentElement.style.padding = '0';
  const main = container.querySelector('.main-feed');
  if (main) {
    main.style.maxWidth = 'none';
    main.style.width = '100%';
    main.style.minWidth = '0';
    main.style.margin = '0';
    main.style.paddingLeft = '0';
    main.style.paddingRight = '0';
    main.style.background = '#090913';
  }
  const feed = container.querySelector('.feed-container');
  if (feed) {
    feed.style.background = '#090913';
    feed.style.padding = '0';
    feed.style.margin = '0';
    feed.style.width = '100%';
    feed.style.maxWidth = '100%';
  }
  const topBar = container.querySelector('.top-bar');
  if (topBar) topBar.style.background = '#090913';
  const app = container.querySelector('.app');
  if (app) {
    app.style.background = '#090913';
    app.style.width = '100%';
    app.style.maxWidth = 'none';
    app.style.margin = '0';
    app.style.paddingLeft = '280px';
  }
  const body = container.querySelector('body') || document.body;
  if (body) {
    body.style.background = '#090913';
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.display = 'block';
    body.style.justifyContent = 'initial';
    body.style.alignItems = 'initial';
  }
  const cards = container.querySelectorAll('.meme-card');
  cards.forEach((c) => {
    c.style.marginLeft = 'auto';
    c.style.marginRight = 'auto';
  });
}

function applyGlobalThemeFromSettings(container) {
  if (!container) return;
  const savedTheme = localStorage.getItem('memotions_theme') || 'dark';
  document.documentElement.setAttribute('data-memotions-theme', savedTheme);
  let style = document.getElementById('memotions-global-theme-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'memotions-global-theme-style';
    style.textContent = `
      html[data-memotions-theme="light"] body{background:#f6f8fc !important;color:#111827 !important}
      html[data-memotions-theme="light"] .app, html[data-memotions-theme="light"] .main-feed, html[data-memotions-theme="light"] .right-sidebar, html[data-memotions-theme="light"] .settings-content, html[data-memotions-theme="light"] .section, html[data-memotions-theme="light"] .card-wrapper{background:#ffffff !important;color:#111827 !important}
      html[data-memotions-theme="light"] .left-sidebar{background:#ffffff !important;border-right:1px solid #e5e7eb !important}
      html[data-memotions-theme="light"] .nav-item{color:#374151 !important}
      html[data-memotions-theme="light"] .nav-item.active{background:#eef2ff !important;color:#111827 !important}
    `;
    document.head.appendChild(style);
  }
  const radios = container.querySelectorAll('input[name="theme"]');
  radios.forEach((r) => {
    if (r.dataset.globalThemeBound === '1') return;
    r.dataset.globalThemeBound = '1';
    r.addEventListener('change', () => {
      const t = r.value || 'dark';
      localStorage.setItem('memotions_theme', t);
      document.documentElement.setAttribute('data-memotions-theme', t);
    });
  });
}

function injectGlobalResponsiveConsistencyStyles() {
  let style = document.getElementById('memotions-global-responsive-style');
  if (style) return;
  style = document.createElement('style');
  style.id = 'memotions-global-responsive-style';
  style.textContent = `
    * { box-sizing: border-box; }
    img, video { max-width: 100%; height: auto; }
    .app { width: 100%; max-width: 100%; }
    body { overflow-x: hidden; }
    body[data-route="create"] .meme-studio {
      border: 1px solid rgba(96, 105, 155, .28) !important;
      border-radius: 20px !important;
      background: linear-gradient(180deg, rgba(14,16,30,.92), rgba(10,12,24,.92)) !important;
      box-shadow: 0 18px 42px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.03) !important;
      overflow: hidden !important;
    }
    body[data-route="create"] .canvas-area,
    body[data-route="create"] .tools-panel,
    body[data-route="create"] .templates-section {
      border: 1px solid rgba(76, 85, 132, .32) !important;
      border-radius: 16px !important;
      background: linear-gradient(180deg, rgba(13,16,30,.88), rgba(10,12,24,.88)) !important;
      box-shadow: 0 10px 28px rgba(0,0,0,.32) !important;
    }
    body[data-route="create"] .creator-grid {
      display: grid !important;
      grid-template-columns: minmax(0, 1.2fr) minmax(340px, .8fr) !important;
      gap: 1rem !important;
      align-items: stretch !important;
    }
    body[data-route="create"] .canvas-area,
    body[data-route="create"] .tools-panel {
      min-width: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    /* Remove duplicate in-editor brand mark, keep global left sidebar brand only */
    body[data-route="create"] .studio-header .logo,
    body[data-route="create"] .studio-header .logo-area,
    body[data-route="create"] .studio-header .logo-wrap,
    body[data-route="create"] .studio-header .logo-icon,
    body[data-route="create"] .studio-header .logo-text {
      display: none !important;
      visibility: hidden !important;
      width: 0 !important;
      height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    body[data-route="create"] .studio-header {
      justify-content: flex-end !important;
      gap: .55rem !important;
      min-height: 58px !important;
      border-bottom: 1px solid rgba(79, 89, 140, .3) !important;
    }
    #react-profile-post-modal {
      overflow: auto !important;
      align-items: flex-start !important;
      justify-content: center !important;
      padding: 12px !important;
    }
    #react-profile-post-modal > div {
      margin: 10px auto !important;
      height: min(88dvh, 860px) !important;
      max-height: 88dvh !important;
    }
    @media (max-width: 1400px) {
      #react-profile-post-modal > div {
        width: 98vw !important;
        height: min(90vh, 860px) !important;
        max-height: calc(100vh - 20px) !important;
      }
      #react-profile-post-modal > div > div > div:last-child {
        width: min(34vw, 420px) !important;
      }
    }
    @media (max-width: 1200px) {
      #react-profile-post-modal {
        padding: 8px !important;
      }
      #react-profile-post-modal > div {
        width: 99vw !important;
        height: calc(100vh - 16px) !important;
        max-height: calc(100vh - 16px) !important;
      }
      #react-profile-post-modal > div > div {
        flex-direction: column !important;
      }
      #react-profile-post-modal > div > div > div:last-child {
        width: 100% !important;
        height: 42vh !important;
        max-height: 42vh !important;
      }
    }

    @media (max-width: 1280px) {
      .left-sidebar { width: 248px !important; padding: 1.25rem 1rem !important; }
      .app { padding-left: 248px !important; }
      .right-sidebar { max-width: 280px !important; }
      .main-layout, .trending-layout { gap: 1.25rem !important; padding: 0 1rem 1.25rem 1rem !important; }
    }

    @media (max-width: 1024px) {
      html, body { overflow-x: hidden !important; overflow-y: auto !important; height: auto !important; }
      .left-sidebar { display: none !important; visibility: hidden !important; pointer-events: none !important; }
      .right-sidebar { display: none !important; visibility: hidden !important; pointer-events: none !important; }
      .app { display: block !important; padding-left: 0 !important; margin-left: 0 !important; min-height: 100vh !important; }
      .main-feed, .main-content, .profile-content, .feed-container, .trending-layout, .main-layout, .content-grid, #contentArea, .meme-studio, .creator-grid, .canvas-area, .tools-panel {
        margin-left: 0 !important;
        padding-left: .8rem !important;
        padding-right: .8rem !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      body[data-route="create"] { padding: .65rem !important; }
      body[data-route="create"] .meme-studio {
        border-radius: 1.1rem !important;
        overflow: visible !important;
      }
      body[data-route="create"] .studio-header {
        padding: .85rem 1rem !important;
        gap: .6rem !important;
      }
      body[data-route="create"] .creator-grid {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: .95rem !important;
        padding: .95rem !important;
      }
      body[data-route="create"] .canvas-area,
      body[data-route="create"] .tools-panel {
        min-width: 0 !important;
        width: 100% !important;
      }
      body[data-route="create"] .meme-frame {
        min-width: 0 !important;
        min-height: 260px !important;
        width: 100% !important;
      }
      body[data-route="create"] #baseImage { max-height: 52vh !important; }
      body[data-route="create"] .templates-section {
        margin: 0 .95rem .95rem .95rem !important;
      }
      .main-layout, .trending-layout { display: block !important; }
      .profile-content, .main-content, .main-feed { width: 100% !important; max-width: 100% !important; }
      .top-nav, .top-bar { padding: .85rem 1rem !important; position: sticky !important; top: 48px !important; z-index: 10020 !important; }
      .search-container, .search-bar { width: 100% !important; max-width: 100% !important; }
      .trending-grid, .content-grid, .posts-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: .9rem !important; }
      .profile-top, .username-row, .stats-row { flex-wrap: wrap !important; }
      .profile-top { gap: 1rem !important; }
      #react-profile-post-modal > div {
        width: 96vw !important;
        height: 92vh !important;
      }
      #react-profile-post-modal > div > div > div:first-child {
        flex: 1.05 !important;
      }
      #react-profile-post-modal > div > div > div:last-child {
        width: min(38vw, 400px) !important;
      }
      #memotions-share-dialog > div {
        width: min(640px, 96vw) !important;
      }
      #memotions-mobile-brand { display: flex !important; }
      #memotions-mobile-nav { display: grid !important; }
    }

    @media (max-width: 768px) {
      html, body { overflow-x: hidden !important; }
      .app { padding-left: 0 !important; padding-top: 48px !important; padding-bottom: 74px !important; }
      .main-layout, .trending-layout, .feed-container, .main-feed {
        margin-left: 0 !important;
        padding-left: .6rem !important;
        padding-right: .6rem !important;
      }
      .card-container {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: .55rem !important;
        max-width: 100% !important;
        padding: 0 .25rem !important;
      }
      .reactions-panel {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        border-radius: 1rem !important;
        padding: .5rem .45rem !important;
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        justify-content: flex-start !important;
        align-items: center !important;
        gap: .3rem !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
      }
      .reactions-panel::-webkit-scrollbar { height: 0 !important; width: 0 !important; }
      .reaction-item {
        flex: 0 0 auto !important;
        min-width: 3rem !important;
        padding: .35rem .28rem !important;
        border-radius: .75rem !important;
        display: inline-flex !important;
        flex-direction: column !important;
        gap: .15rem !important;
      }
      .reaction-emoji { font-size: 1.45rem !important; }
      .reaction-count { font-size: .7rem !important; }
      .add-reaction-btn {
        flex: 0 0 auto !important;
        margin: 0 0 0 .25rem !important;
        width: 2rem !important;
        height: 2rem !important;
        min-width: 2rem !important;
      }
      body[data-route="create"] { padding: .45rem !important; }
      body[data-route="create"] .meme-studio {
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
      }
      body[data-route="create"] .studio-header {
        position: static !important;
        width: 100% !important;
      }
      body[data-route="create"] .creator-grid {
        display: grid !important;
        grid-template-columns: 1fr !important;
        grid-auto-rows: auto !important;
        gap: .75rem !important;
        padding: .65rem !important;
      }
      body[data-route="create"] .logo-text { font-size: 1.2rem !important; }
      body[data-route="create"] .logo-icon { width: 34px !important; height: 34px !important; font-size: 1.15rem !important; }
      body[data-route="create"] .badge { font-size: .62rem !important; padding: .2rem .55rem !important; }
      body[data-route="create"] .canvas-area { padding: .55rem !important; border-radius: 1rem !important; min-width: 0 !important; }
      body[data-route="create"] .tools-panel {
        position: static !important;
        right: auto !important;
        left: auto !important;
        top: auto !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        padding: .75rem !important;
        border-radius: 1rem !important;
        overflow: hidden !important;
      }
      body[data-route="create"] .canvas-area,
      body[data-route="create"] .tools-panel {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
      }
      body[data-route="create"] .meme-frame,
      body[data-route="create"] .canvas-shell,
      body[data-route="create"] .canvas-wrap {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
      }
      body[data-route="create"] .upload-btn,
      body[data-route="create"] .upload-image-btn {
        max-width: calc(100vw - 3rem) !important;
        width: auto !important;
        white-space: nowrap !important;
      }
      body[data-route="create"] .preset-colors,
      body[data-route="create"] .color-grid {
        display: grid !important;
        grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
        gap: .45rem !important;
      }
      body[data-route="create"] .action-buttons,
      body[data-route="create"] .quick-positions {
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: auto !important;
      }
      body[data-route="create"] .text-field-group { flex-wrap: wrap !important; }
      body[data-route="create"] .text-field-group input { min-width: 100% !important; }
      body[data-route="create"] .emoji-picker-btn,
      body[data-route="create"] .add-layer-btn { width: 44px !important; height: 40px !important; }
      body[data-route="create"] .emoji-popup {
        width: min(92vw, 320px) !important;
        left: 0 !important;
        right: auto !important;
      }
      body[data-route="create"] .quick-positions { gap: .4rem !important; }
      body[data-route="create"] .pos-btn { font-size: .66rem !important; }
      body[data-route="create"] .action-buttons {
        position: sticky !important;
        bottom: 0 !important;
        background: #0f0f18 !important;
        padding-top: .45rem !important;
        z-index: 8 !important;
      }
      body[data-route="create"] .templates-section { margin: 0 .55rem .55rem .55rem !important; }
      .main-layout, .trending-layout { padding-bottom: 1rem !important; }
      .top-nav, .top-bar { padding: .7rem .65rem !important; }
      .nav-hint { display: none !important; }
      .trending-grid, .content-grid, .posts-grid { grid-template-columns: 1fr !important; }
      body[data-route="trending"] .trending-grid,
      body[data-route="own_profile"] .content-grid,
      body[data-route="others_profile"] .content-grid,
      body[data-route="profile"] .content-grid,
      body[data-route="own_profile"] .posts-grid,
      body[data-route="others_profile"] .posts-grid,
      body[data-route="profile"] .posts-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: .6rem !important;
      }
      .meme-card, .post-card, .trending-card, .immortal-card, .rising-card { width: 100% !important; margin-left: auto !important; margin-right: auto !important; }
      .profile-header, .quick-stats, .profile-tabs { padding-left: .1rem !important; padding-right: .1rem !important; }
      .stats-row { gap: 1rem !important; }
      .avatar { width: 92px !important; height: 92px !important; }

      #react-profile-post-modal > div {
        width: 98vw !important;
        height: calc(95vh - 64px) !important;
        margin-bottom: 64px !important;
      }
      #react-profile-post-modal > div > div {
        flex-direction: column !important;
      }
      #react-profile-post-modal > div > div > div:first-child {
        min-height: 50vh !important;
      }
      #react-profile-post-modal > div > div > div:last-child {
        width: 100% !important;
        height: 43vh !important;
        max-height: 43vh !important;
        min-height: 43vh !important;
      }
      #react-profile-post-modal #react-post-comments-list {
        flex: 1 1 auto !important;
        min-height: 0 !important;
        overflow-y: auto !important;
      }
      #react-profile-post-modal #react-post-comments-list + div {
        position: sticky !important;
        bottom: 0 !important;
        background: #0c0c14 !important;
        z-index: 5 !important;
      }
      #react-profile-post-modal #react-post-comment-input {
        min-height: 36px !important;
        max-height: 92px !important;
      }
      #react-profile-post-modal #react-post-comment-submit {
        align-self: center !important;
      }
      #react-profile-post-modal textarea,
      #react-profile-post-modal button {
        pointer-events: auto !important;
      }
      #memotions-upload-modal .create-container {
        width: 96vw !important;
        max-height: calc(100vh - 16px) !important;
        margin: .25rem auto .5rem !important;
        padding: 0 .75rem !important;
      }
      #memotions-share-dialog > div {
        width: 96vw !important;
      }
      body[data-route="memotions"] .feed-container {
        height: calc(100vh - 48px - 64px) !important;
        overflow-y: auto !important;
        scroll-snap-type: y mandatory !important;
        scroll-behavior: smooth !important;
        -webkit-overflow-scrolling: touch !important;
        touch-action: pan-y !important;
      }
      body[data-route="memotions"] .main-feed {
        height: calc(100vh - 48px - 64px) !important;
        overflow: hidden !important;
      }
      body[data-route="memotions"] .meme-card {
        height: calc(100vh - 48px - 64px) !important;
        min-height: calc(100vh - 48px - 64px) !important;
        max-height: calc(100vh - 48px - 64px) !important;
        scroll-snap-align: start !important;
        scroll-snap-stop: always !important;
        margin-bottom: 0 !important;
      }
      body[data-route="memotions"] .meme-card img,
      body[data-route="memotions"] .meme-image img {
        max-height: 56vh !important;
        object-fit: cover !important;
      }
      body[data-route="memotions"] .top-bar {
        top: 0 !important;
        margin-top: 0 !important;
      }
      #memotions-mobile-brand { display: flex !important; }
      #memotions-mobile-nav { display: grid !important; }
    }

    #memotions-mobile-brand {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 48px;
      z-index: 10060;
      display: none;
      align-items: center;
      padding: 0 .9rem;
      background: rgba(10, 10, 18, 0.98);
      border-bottom: 1px solid #25263b;
      backdrop-filter: blur(12px);
    }
    #memotions-mobile-brand a { text-decoration: none; }
    #memotions-mobile-brand span {
      font-family: 'Irish Grover', cursive;
      font-size: 1.4rem;
      background: linear-gradient(135deg,#fff,#a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
    }

    #parity-page-root, #parity-page-root * { pointer-events: auto; }
    #memotions-mobile-nav {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10050;
      height: 64px;
      display: none;
      grid-template-columns: repeat(5, 1fr);
      background: rgba(10, 10, 18, 0.98);
      border-top: 1px solid #25263b;
      backdrop-filter: blur(12px);
    }
    #memotions-mobile-nav a, #memotions-mobile-nav button {
      border: 0;
      background: transparent;
      color: #9ca3af;
      font-size: .72rem;
      font-weight: 600;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: .22rem;
      text-decoration: none;
      cursor: pointer;
    }
    #memotions-mobile-nav i {
      font-size: 1.1rem;
      line-height: 1;
    }
    #memotions-mobile-nav .active {
      color: #a78bfa !important;
    }
  `;
  document.head.appendChild(style);
}

function injectMobileBottomNav() {
  let nav = document.getElementById('memotions-mobile-nav');
  if (!nav) {
    nav = document.createElement('nav');
    nav.id = 'memotions-mobile-nav';
    nav.innerHTML = `
      <a href="/memotions" data-path="/memotions"><i class="fas fa-compass"></i><span>For You</span></a>
      <a href="/trending" data-path="/trending"><i class="fas fa-chart-line"></i><span>Trending</span></a>
      <a href="/create" data-path="/create"><i class="fas fa-plus-circle"></i><span>Create</span></a>
      <a href="/notifications" data-path="/notifications"><i class="fas fa-bell"></i><span>Alerts</span></a>
      <a href="/own_profile" data-path="/own_profile"><i class="fas fa-user"></i><span>Profile</span></a>
    `;
    document.body.appendChild(nav);
  }
  const p = window.location.pathname === '/' ? '/memotions' : window.location.pathname;
  nav.querySelectorAll('a').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('data-path') === p);
  });
}

function injectMobileBrandBar() {
  let bar = document.getElementById('memotions-mobile-brand');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'memotions-mobile-brand';
    bar.innerHTML = `<a href="/memotions"><span>Memotions</span></a>`;
    document.body.appendChild(bar);
  }
}

function injectDemoAuth(container, navigate) {
  if (!container) return;
  const KEY = 'memotions_demo_user';

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch {
      return null;
    }
  };

  if (!document.getElementById('memotions-auth-style')) {
    const style = document.createElement('style');
    style.id = 'memotions-auth-style';
    style.textContent = `
      #memotions-auth-modal{position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;z-index:10080;padding:16px;}
      #memotions-auth-modal .auth-card{width:min(480px,96vw);background:rgba(14,14,22,.95);backdrop-filter:blur(12px);border-radius:2rem;border:1px solid rgba(34,34,50,.85);box-shadow:0 25px 45px rgba(0,0,0,.6),0 0 0 1px rgba(139,92,246,.1);padding:1.9rem 1.5rem 1.6rem;}
      #memotions-auth-modal .logo{font-family:'Irish Grover',cursive;font-size:1.6rem;display:inline-flex;align-items:center;gap:.6rem;background:linear-gradient(135deg,#1a1a2a,#0c0c14);padding:.45rem 1.1rem .45rem .9rem;border-radius:4rem;border:1px solid #2d2d40;}
      #memotions-auth-modal .logo i{background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;padding:.5rem;border-radius:1rem;font-size:1.1rem;}
      #memotions-auth-modal .toggle-buttons{display:flex;gap:.6rem;background:#12121c;padding:.45rem;border-radius:3rem;margin:1.1rem 0 1.1rem;border:1px solid #222232;}
      #memotions-auth-modal .toggle-btn{flex:1;border:0;background:transparent;color:#9ca3af;font-weight:700;padding:.65rem 0;border-radius:2rem;cursor:pointer;}
      #memotions-auth-modal .toggle-btn.active{background:#8b5cf6;color:#fff;box-shadow:0 6px 14px rgba(139,92,246,.3);}
      #memotions-auth-modal .input-field{width:100%;background:#0a0a12;border:1.5px solid #262638;border-radius:1.25rem;padding:.8rem 1rem;font-size:.95rem;color:#fff;outline:none;}
      #memotions-auth-modal .input-field:focus{border-color:#8b5cf6;background:#12121c;box-shadow:0 0 0 3px rgba(139,92,246,.2);}
      #memotions-auth-modal .submit-btn{width:100%;background:linear-gradient(95deg,#8b5cf6,#a78bfa);border:0;padding:.8rem;border-radius:2rem;font-weight:700;color:#fff;cursor:pointer;margin-top:.35rem;}
      #memotions-auth-modal .google-btn{width:100%;background:#12121c;border:1.5px solid #2d2d40;border-radius:2rem;padding:.78rem;display:flex;align-items:center;justify-content:center;gap:.65rem;font-weight:600;color:#f3f4f6;cursor:pointer;}
      #memotions-auth-modal .google-btn:hover{background:#1e1e2e;border-color:#8b5cf6;}
      #memotions-auth-modal .error-message{background:rgba(244,63,94,.15);border-left:3px solid #f43f5e;padding:.65rem .85rem;border-radius:1rem;font-size:.78rem;margin-bottom:.8rem;color:#fecdd3;display:none;}
      #memotions-auth-modal .divider{display:flex;align-items:center;gap:.75rem;color:#4b5563;font-size:.78rem;margin:.9rem 0;}
      #memotions-auth-modal .divider-line{flex:1;height:1px;background:#262638;}
      #memotions-auth-modal .auth-close{position:absolute;right:14px;top:10px;border:0;background:transparent;color:#9ca3af;font-size:1.3rem;cursor:pointer;}
      #memotions-auth-modal .demo-btn{width:100%;margin-top:.6rem;background:#1a1a2a;border:1px solid #2d2d40;color:#cbd5e1;border-radius:2rem;padding:.68rem;cursor:pointer;}
    `;
    document.head.appendChild(style);
  }

  let modal = document.getElementById('memotions-auth-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'memotions-auth-modal';
    modal.innerHTML = `
      <div class="auth-card" style="position:relative;">
        <button class="auth-close" id="mem-auth-close" type="button">×</button>
        <div style="display:flex;justify-content:center;"><div class="logo"><i class="fas fa-face-smile"></i><span>Memotions</span></div></div>
        <div class="toggle-buttons">
          <button class="toggle-btn active" data-form="signin" id="mem-auth-tab-login">Sign In</button>
          <button class="toggle-btn" data-form="signup" id="mem-auth-tab-signup">Sign Up</button>
        </div>
        <div id="mem-auth-signin-panel">
          <div id="signin-error" class="error-message"></div>
          <input class="input-field" id="signin-email" placeholder="hello@memotions.com" />
          <div style="height:8px;"></div>
          <input class="input-field" id="signin-password" type="password" placeholder="••••••••" />
          <button class="submit-btn" id="signin-submit" type="button">Sign In →</button>
          <div class="divider"><span class="divider-line"></span><span>or continue with</span><span class="divider-line"></span></div>
          <button class="google-btn" id="google-signin-btn" type="button"><i class="fab fa-google"></i> Sign in with Google</button>
        </div>
        <div id="mem-auth-signup-panel" style="display:none;">
          <div id="signup-error" class="error-message"></div>
          <input class="input-field" id="signup-username" placeholder="@memelover" />
          <div style="height:8px;"></div>
          <input class="input-field" id="signup-email" placeholder="hello@memotions.com" />
          <div style="height:8px;"></div>
          <input class="input-field" id="signup-password" type="password" placeholder="Create a strong password" />
          <button class="submit-btn" id="signup-submit" type="button">Create Account →</button>
          <div class="divider"><span class="divider-line"></span><span>or continue with</span><span class="divider-line"></span></div>
          <button class="google-btn" id="google-signup-btn" type="button"><i class="fab fa-google"></i> Sign up with Google</button>
        </div>
        <button class="demo-btn" id="mem-auth-demo-btn" type="button">Continue as Demo User</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const close = () => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };
  const open = () => {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  if (!modal.dataset.bound) {
    modal.dataset.bound = '1';
    const signinPanel = modal.querySelector('#mem-auth-signin-panel');
    const signupPanel = modal.querySelector('#mem-auth-signup-panel');
    const tabLogin = modal.querySelector('#mem-auth-tab-login');
    const tabSignup = modal.querySelector('#mem-auth-tab-signup');
    const signinError = modal.querySelector('#signin-error');
    const signupError = modal.querySelector('#signup-error');

    const setForm = (f) => {
      const signin = f === 'signin';
      signinPanel.style.display = signin ? 'block' : 'none';
      signupPanel.style.display = signin ? 'none' : 'block';
      tabLogin.classList.toggle('active', signin);
      tabSignup.classList.toggle('active', !signin);
      signinError.style.display = 'none';
      signupError.style.display = 'none';
    };

    const saveUser = (name, email) => {
      const user = {
        name: name || (email ? email.split('@')[0] : 'demo_user'),
        email: email || 'demo@memotions.local',
        at: new Date().toISOString(),
        demo: true,
      };
      localStorage.setItem(KEY, JSON.stringify(user));
      close();
    };

    modal.querySelector('#mem-auth-close')?.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
    tabLogin?.addEventListener('click', () => setForm('signin'));
    tabSignup?.addEventListener('click', () => setForm('signup'));

    modal.querySelector('#signin-submit')?.addEventListener('click', () => {
      const email = (modal.querySelector('#signin-email')?.value || '').trim();
      const password = (modal.querySelector('#signin-password')?.value || '').trim();
      if (!email || !password) {
        signinError.textContent = 'Please fill email and password.';
        signinError.style.display = 'block';
        return;
      }
      saveUser(email.split('@')[0], email);
    });
    modal.querySelector('#signup-submit')?.addEventListener('click', () => {
      const username = (modal.querySelector('#signup-username')?.value || '').trim();
      const email = (modal.querySelector('#signup-email')?.value || '').trim();
      const password = (modal.querySelector('#signup-password')?.value || '').trim();
      if (!username || !email || !password) {
        signupError.textContent = 'Please fill all fields.';
        signupError.style.display = 'block';
        return;
      }
      saveUser(username, email);
    });
    modal.querySelector('#google-signin-btn')?.addEventListener('click', () => {
      saveUser('google_user', 'google_user@gmail.com');
    });
    modal.querySelector('#google-signup-btn')?.addEventListener('click', () => {
      saveUser('google_user', 'google_user@gmail.com');
    });
    modal.querySelector('#mem-auth-demo-btn')?.addEventListener('click', () => {
      saveUser('demo_user', 'demo@memotions.local');
    });
  }

  window.__memotionsIsLoggedIn = () => !!getUser();
  window.__memotionsRequireAuth = () => {
    if (getUser()) return true;
    open();
    return false;
  };
  window.__memotionsLogout = () => {
    localStorage.removeItem(KEY);
  };

  const logoutBtn = container.querySelector('#sidebarLogoutBtn');
  if (logoutBtn && logoutBtn.dataset.bound !== '1') {
    logoutBtn.dataset.bound = '1';
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.__memotionsLogout?.();
      navigate('/memotions');
    });
  }
}

function injectInteractionAuthGate(container) {
  if (!container || container.dataset.memotionsAuthGateBound === '1') return;
  container.dataset.memotionsAuthGateBound = '1';
  const guarded = [
    '.action-btn.like-btn',
    '#react-post-like',
    '.action-btn.comment-btn',
    '#react-post-comment-submit',
    '.reaction-item',
    '.add-reaction-btn',
    '#publishMemeBtn',
    '#createBtn',
    '#sidebarUploadMemeBtn',
    '#memotions-upload-modal #submitBtn',
  ].join(',');

  container.addEventListener(
    'click',
    (e) => {
      const t = e.target.closest(guarded);
      if (!t) return;
      if (window.__memotionsIsLoggedIn?.()) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      window.__memotionsRequireAuth?.();
    },
    true
  );
}

function injectUiPovPack(container) {
  if (!container) return;
  const path = window.location.pathname;
  let style = document.getElementById('memotions-ui-pov-pack');
  if (!style) {
    style = document.createElement('style');
    style.id = 'memotions-ui-pov-pack';
    style.textContent = `
      .meme-caption, .post-caption, .caption { font-size: .98rem !important; line-height: 1.5 !important; max-width: 56ch !important; }
      .meme-card, .post-card, .trending-card, .sidebar-card, .settings-content, .settings-nav { border-radius: 16px !important; box-shadow: 0 10px 24px rgba(0,0,0,.22) !important; }
      .left-sidebar .nav-item { min-height: 48px !important; min-width: 220px !important; }
      .left-sidebar .nav-item i { font-weight: 700 !important; }
      .right-sidebar .suggestion-item, .right-sidebar .creator-item, .right-sidebar .trending-item { margin-bottom: 1.1rem !important; }
      .right-sidebar .sidebar-title, .right-sidebar h5 { display:flex !important; align-items:center !important; justify-content:space-between !important; }
      .rs-collapse-btn { border:0;background:transparent;color:#8b5cf6;cursor:pointer;font-size:.8rem;line-height:1; }
      .profile-tabs .tab { border-bottom: 0 !important; box-shadow: none !important; }
      .profile-tabs .tab::after { display: none !important; }
      .profile-tabs .tab.active {
        border-bottom: 0 !important;
        box-shadow: inset 0 -3px 0 #8b5cf6 !important;
        font-weight: 700 !important;
      }
      .profile-tabs .tab .tab-count { margin-left:.4rem;font-size:.68rem;color:#a78bfa; }
      .mem-page-label { display:none !important; }
      .rp-sort-wrap { display:flex; gap:.4rem; padding:.45rem .85rem; border-bottom:1px solid #1a1a28; position:sticky; top:0; background:#0c0c14; z-index:3; }
      .rp-sort-btn { border:1px solid #2d3350; background:#101629; color:#cbd5e1; border-radius:999px; padding:.25rem .6rem; font-size:.68rem; cursor:pointer; }
      .rp-sort-btn.active { border-color:#8b5cf6; color:#e9d5ff; background:#1b1331; }
      .rp-replying-chip { display:none; align-items:center; gap:.45rem; font-size:.7rem; color:#c4b5fd; background:#1a1430; border:1px solid #342357; border-radius:999px; padding:.3rem .55rem; margin-bottom:.35rem; }
      .rp-replying-chip button { border:0; background:transparent; color:#c4b5fd; cursor:pointer; font-size:.75rem; }
      .rp-reply-row { position: relative; }
      .rp-reply-row::before { content:""; position:absolute; left:-10px; top:.45rem; bottom:.15rem; width:1px; background:rgba(167,139,250,.35); }
      #react-profile-post-modal #react-post-reactions { position: sticky; bottom: 0; background:#0c0c14; z-index:2; padding-bottom:.35rem; }
      #react-profile-post-modal > div { height: min(90vh, 860px) !important; max-height: calc(100vh - 20px) !important; }
      #react-profile-post-modal > div > div > div:last-child { min-height: 0 !important; }
      #react-profile-post-modal #react-post-comments-list { min-height: 0 !important; }
      .mem-chipbar {
        display: flex;
        align-items: center;
        gap: .5rem;
        margin-left: auto;
        padding: .25rem;
        background: rgba(17, 24, 39, .58);
        border: 1px solid #2b3352;
        border-radius: 999px;
      }
      .mem-chip {
        border: 1px solid transparent;
        background: transparent;
        color: #cbd5e1;
        border-radius: 999px;
        padding: .35rem .75rem;
        font-size: .78rem;
        font-weight: 600;
        cursor: pointer;
        transition: all .15s ease;
      }
      .mem-chip:hover {
        border-color: #364265;
        color: #f1f5f9;
      }
      .mem-chip.active {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: #fff;
        border-color: #8b5cf6;
        box-shadow: 0 6px 16px rgba(124, 58, 237, .35);
      }
      .mem-kebab {
        position: absolute;
        right: .7rem;
        bottom: 3.15rem;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        border: 1px solid #2f395a;
        background: rgba(10, 14, 30, .86);
        color: #cbd5e1;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        line-height: 1;
        z-index: 8;
      }
      .mem-kebab:hover { border-color: #8b5cf6; color: #fff; }
      .mem-menu {
        position: absolute;
        right: .55rem;
        bottom: 2.45rem;
        min-width: 180px;
        background: #141a2f;
        border: 1px solid #2d3a62;
        border-radius: 10px;
        box-shadow: 0 12px 30px rgba(0,0,0,.4);
        padding: .3rem;
        display: none;
        z-index: 9;
      }
      .mem-menu-item {
        width: 100%;
        border: 0;
        background: transparent;
        color: #dbe3f1;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: .55rem;
        padding: .5rem .55rem;
        font-size: .79rem;
        text-align: left;
        cursor: pointer;
      }
      .mem-menu-item:hover { background: #202949; }
      .mem-menu-item[data-a="report"] { color: #fca5a5; }
      .reactions-panel {
        width: 82px !important;
        border-radius: 18px !important;
        padding: .45rem .4rem !important;
        gap: .28rem !important;
      }
      .reaction-item {
        min-height: 46px !important;
        border-radius: 12px !important;
        padding: .22rem .2rem !important;
      }
      .reaction-emoji { font-size: 1.3rem !important; }
      .reaction-count { font-size: .72rem !important; }
      .mem-emoji-picker {
        position: fixed;
        z-index: 12060;
        width: min(320px, 90vw);
        max-height: 260px;
        overflow-y: auto;
        padding: .55rem;
        border-radius: 12px;
        border: 1px solid #354168;
        background: #0f1529;
        box-shadow: 0 20px 46px rgba(0,0,0,.5);
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: .35rem;
      }
      .mem-emoji-picker button {
        border: 1px solid #2e385c;
        border-radius: 10px;
        background: #161f39;
        color: #fff;
        font-size: 1.05rem;
        padding: .42rem .2rem;
        cursor: pointer;
      }
      .mem-emoji-picker button:hover { border-color:#8b5cf6; background:#1f1740; }
      @media (max-width: 768px) {
        #memotions-mobile-nav a { min-height: 54px !important; }
        #react-profile-post-modal #react-post-comment-input,
        #react-profile-post-modal #react-post-comment-submit { position: relative; z-index: 3; }
        .content-grid, .posts-grid { padding-left: .35rem !important; padding-right: .35rem !important; }
        .mem-chipbar {
          width: 100%;
          margin: .5rem 0 0 0;
          overflow-x: auto;
          justify-content: flex-start;
        }
      }
    `;
    document.head.appendChild(style);
  }

  container.querySelectorAll('.mem-page-label').forEach((n) => n.remove());
  container.querySelectorAll('.mem-chipbar, .mem-filter-row').forEach((n) => n.remove());

  const rightSidebar = container.querySelector('.right-sidebar');
  if (rightSidebar && rightSidebar.dataset.collapseReady !== '1') {
    rightSidebar.dataset.collapseReady = '1';
    rightSidebar.querySelectorAll('.sidebar-title, h5').forEach((title) => {
      if (title.querySelector('.rs-collapse-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'rs-collapse-btn';
      btn.type = 'button';
      btn.textContent = '▾';
      title.appendChild(btn);
      btn.addEventListener('click', () => {
        const close = btn.dataset.c !== '1';
        btn.dataset.c = close ? '1' : '0';
        btn.textContent = close ? '▸' : '▾';
        let n = title.nextElementSibling;
        while (n && !n.matches('.sidebar-title,h5')) {
          n.style.display = close ? 'none' : '';
          n = n.nextElementSibling;
        }
      });
    });
  }

  if (path === '/settings') {
    const layout = container.querySelector('.settings-layout');
    const nav = container.querySelector('.settings-sidebar');
    const content = container.querySelector('.settings-content');
    if (layout?.style) {
      layout.style.maxWidth = 'none';
      layout.style.margin = '0';
      layout.style.justifyContent = 'flex-start';
      layout.style.gap = '1.5rem';
    }
    if (nav?.style) {
      nav.style.position = 'sticky';
      nav.style.top = '74px';
      nav.style.alignSelf = 'flex-start';
    }
    if (content?.style) {
      content.style.flex = '0 1 980px';
      content.style.maxWidth = '980px';
      content.style.width = '100%';
    }
    const accountSection = container.querySelector('#account-section');
    const saveBtn = accountSection?.querySelector('.save-btn');
    if (accountSection && saveBtn && !accountSection.dataset.unsavedBound) {
      accountSection.dataset.unsavedBound = '1';
      const indicator = document.createElement('div');
      indicator.style.cssText = 'display:none;font-size:.72rem;color:#c4b5fd;margin:.35rem 0 .7rem 0;';
      indicator.textContent = 'Unsaved changes';
      saveBtn.parentElement?.insertBefore(indicator, saveBtn);
      accountSection.querySelectorAll('input,select,textarea').forEach((el) => {
        el.addEventListener('input', () => { indicator.style.display = 'block'; });
      });
      saveBtn.addEventListener('click', () => { indicator.style.display = 'none'; });
    }
  }

  if (path === '/own_profile' || path === '/profile' || path === '/others_profile') {
    const contentArea = container.querySelector('#contentArea');
    const activeTab = container.querySelector('.tab.active')?.getAttribute('data-tab');
    const grid = contentArea?.querySelector('.content-grid, .posts-grid');
    if (contentArea && !contentArea.querySelector('.mem-empty-state') && (!grid || !grid.children.length)) {
      const empty = document.createElement('div');
      empty.className = 'mem-empty-state';
      empty.style.cssText = 'border:1px dashed #303859;border-radius:14px;padding:1rem;background:#0f1222;color:#a7b0c7;margin-top:.6rem;';
      const cta = activeTab === 'saved' ? 'Save posts from feed to see them here.' : activeTab === 'reactions' ? 'React on posts to build your reaction history.' : 'Create or upload your first post.';
      empty.innerHTML = `<div style="font-weight:700;color:#e2e8f0;margin-bottom:.35rem;">Nothing here yet</div><div style="font-size:.85rem;">${cta}</div>`;
      contentArea.appendChild(empty);
    }
    const tabs = container.querySelectorAll('.profile-tabs .tab');
    const savedCount = parseJsonArray(localStorage.getItem('memotions_saved_posts')).length;
    const postCount = container.querySelectorAll('#contentArea .grid-item').length;
    tabs.forEach((tab) => {
      if (tab.querySelector('.tab-count')) return;
      const c = document.createElement('span');
      c.className = 'tab-count';
      const t = tab.getAttribute('data-tab');
      c.textContent = t === 'saved' ? String(savedCount) : (t === 'posts' ? String(postCount) : '0');
      tab.appendChild(c);
    });
    if (activeTab === 'saved' && contentArea && !contentArea.querySelector('.saved-order-label')) {
      const label = document.createElement('div');
      label.className = 'saved-order-label';
      label.style.cssText = 'font-size:.72rem;color:#a78bfa;margin:.15rem 0 .55rem .2rem;';
      label.textContent = 'Sorted by latest save';
      contentArea.prepend(label);
    }
  }
}

function injectProductionUiPack(container) {
  if (!container) return;
  const path = window.location.pathname;
  const FEED_INTERACTIONS_KEY = 'memotions_feed_interactions_v1';
  const TOP_25_EMOJIS = ['😂', '🔥', '❤️', '🤣', '😍', '👏', '😭', '💀', '😎', '🙌', '🤯', '🥶', '😡', '🤔', '🥳', '😴', '😅', '🤩', '👌', '💯', '✨', '😆', '😬', '🤝', '🫡'];
  const notify = (txt, type = 'info') => {
    const bg =
      type === 'success'
        ? 'linear-gradient(135deg,#0f2a1f,#103022)'
        : type === 'warning'
          ? 'linear-gradient(135deg,#2a1d10,#33210f)'
          : 'linear-gradient(135deg,#121a31,#1b2544)';
    const border = type === 'success' ? '#1f7a46' : type === 'warning' ? '#9a6a1f' : '#3d4f80';
    const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    const n = document.createElement('div');
    n.style.cssText = `position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:12040;background:${bg};border:1px solid ${border};color:#e2e8f0;padding:.58rem .85rem;border-radius:.75rem;font-size:.79rem;display:flex;align-items:center;gap:.5rem;box-shadow:0 16px 34px rgba(0,0,0,.4);`;
    n.innerHTML = `<span style="font-size:.92rem;">${icon}</span><span>${txt}</span>`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 1800);
  };
  const getFeedStateAll = () => {
    try { return JSON.parse(localStorage.getItem(FEED_INTERACTIONS_KEY) || '{}'); } catch { return {}; }
  };
  const setFeedStateAll = (data) => localStorage.setItem(FEED_INTERACTIONS_KEY, JSON.stringify(data || {}));
  const cardStateId = (card) => {
    if (!card) return `feed_${Date.now()}`;
    if (card.dataset.feedStateId) return card.dataset.feedStateId;
    const img = card.querySelector('img')?.getAttribute('src') || '';
    const cap =
      card.querySelector('.meme-caption, .caption, .card-title, .post-title')?.textContent?.trim() || '';
    const creator =
      card.querySelector('.creator-name, .username, .post-author-name')?.textContent?.trim() || '';
    const key = btoa(unescape(encodeURIComponent(`${window.location.pathname}|${img}|${cap}|${creator}`))).replace(/=+$/g, '').slice(0, 40);
    card.dataset.feedStateId = `feed_${key}`;
    return card.dataset.feedStateId;
  };
  const parseCount = (txt) => {
    const s = String(txt || '0').trim();
    if (s.endsWith('K')) return Math.round((parseFloat(s) || 0) * 1000);
    if (s.endsWith('M')) return Math.round((parseFloat(s) || 0) * 1000000);
    return parseInt(s.replace(/[^\d]/g, ''), 10) || 0;
  };
  const formatCount = (n) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(Math.max(0, n));
  };

  // Global For You reaction override to prevent double increments from legacy handlers.
  if (path === '/memotions' && container.dataset.feedReactionGlobalBound !== '1') {
    container.dataset.feedReactionGlobalBound = '1';
    container.addEventListener('click', (e) => {
      const item = e.target.closest('.reaction-item');
      if (!item) return;
      if (!item.closest('.meme-card, .post-card')) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      const card = item.closest('.meme-card, .post-card');
      const id = cardStateId(card);
      const emoji = (item.querySelector('.reaction-emoji')?.textContent || '').trim();
      if (!emoji) return;
      const countEl = item.querySelector('.reaction-count');
      const current = parseInt(String(countEl?.textContent || '0').replace(/[^\d]/g, ''), 10) || 0;
      const all = getFeedStateAll();
      const st = all[id] || { liked: false, saved: false, likes: null, reactions: {} };
      st.reactions = st.reactions || {};
      const active = !!st.reactions[emoji]?.active;
      st.reactions[emoji] = { active: !active };
      all[id] = st;
      setFeedStateAll(all);
      const next = st.reactions[emoji].active ? current + 1 : Math.max(0, current - 1);
      if (countEl) countEl.textContent = String(next);
      if (!st.reactions[emoji].active && next <= 0) {
        item.remove();
        return;
      }
      item.style.background = st.reactions[emoji].active ? 'rgba(139,92,246,.2)' : 'transparent';
      item.style.borderColor = st.reactions[emoji].active ? '#8b5cf6' : 'transparent';
    }, true);
  }

  const openReportDialog = (onSubmit) => {
    let dlg = document.getElementById('mem-report-dialog');
    if (!dlg) {
      dlg = document.createElement('div');
      dlg.id = 'mem-report-dialog';
      dlg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;z-index:12070;padding:16px;';
      dlg.innerHTML = `
        <div style="width:min(460px,95vw);background:#0f1528;border:1px solid #31406a;border-radius:14px;box-shadow:0 24px 52px rgba(0,0,0,.5);overflow:hidden;">
          <div style="padding:.85rem 1rem;border-bottom:1px solid #26355f;color:#eef2ff;font-weight:700;">Report Post</div>
          <div style="padding:.9rem 1rem .75rem 1rem;color:#b9c4e3;font-size:.82rem;">Why are you reporting this content?</div>
          <div style="padding:0 1rem 1rem 1rem;display:grid;gap:.45rem;">
            ${['Spam', 'Harassment', 'Hate speech', 'Violence', 'Sexual content', 'Misinformation'].map((c) => `<button type="button" data-r="${c}" style="text-align:left;border:1px solid #2f3c66;background:#151d37;color:#e2e8f0;border-radius:10px;padding:.52rem .65rem;cursor:pointer;">${c}</button>`).join('')}
          </div>
          <div style="padding:.8rem 1rem;border-top:1px solid #26355f;display:flex;justify-content:flex-end;">
            <button type="button" id="mem-report-cancel" style="border:1px solid #3a4668;background:#111a31;color:#d1d5db;border-radius:10px;padding:.4rem .75rem;cursor:pointer;">Cancel</button>
          </div>
        </div>`;
      document.body.appendChild(dlg);
      dlg.addEventListener('click', (e) => {
        if (e.target === dlg) dlg.style.display = 'none';
        if (e.target.id === 'mem-report-cancel') dlg.style.display = 'none';
        const btn = e.target.closest('button[data-r]');
        if (!btn) return;
        dlg.style.display = 'none';
        onSubmit?.(btn.getAttribute('data-r') || 'Other');
      });
    }
    dlg.style.display = 'flex';
  };

  // Topbar alignment only (keep native category-tabs filter)
  if (path === '/memotions' || path === '/trending') {
    const host = container.querySelector('.top-bar, .top-nav');
    if (host) {
      const rightActions =
        host.querySelector('.top-actions, .header-actions, .nav-actions, .actions') ||
        host.querySelector('.fa-bell')?.parentElement;
      if (rightActions && rightActions.style) rightActions.style.marginLeft = 'auto';
      host.querySelectorAll('.fa-bell, .fa-envelope').forEach((i) => {
        const btn = i.closest('button,a,div');
        if (btn?.style) btn.style.marginLeft = '.55rem';
      });
    }
  }

  // Hide/Not interested menu
  if (path === '/memotions') {
    container.querySelectorAll('.mem-kebab, .mem-menu').forEach((n) => n.remove());
  }
  container.querySelectorAll('.meme-card,.trending-card,.post-card').forEach((card) => {
    if (path === '/memotions') return;
    if (card.dataset.memMenuBound === '1') return;
    card.dataset.memMenuBound = '1';
    card.style.position = 'relative';
    const k = document.createElement('button');
    k.className = 'mem-kebab';
    k.type = 'button';
    k.textContent = '⋯';
    const menu = document.createElement('div');
    menu.className = 'mem-menu';
    menu.innerHTML = `
      <button class="mem-menu-item" data-a="hide"><i class="fas fa-eye-slash"></i><span>Hide post</span></button>
      <button class="mem-menu-item" data-a="not"><i class="fas fa-ban"></i><span>Not interested</span></button>
      <button class="mem-menu-item" data-a="report"><i class="fas fa-flag"></i><span>Report</span></button>
    `;
    card.appendChild(k);
    card.appendChild(menu);
    k.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });
    menu.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      if (b.dataset.a === 'hide' || b.dataset.a === 'not') card.style.display = 'none';
      if (b.dataset.a === 'report' && path === '/trending') {
        openReportDialog((category) => {
          notify(`Report submitted: ${category}. We'll review it shortly.`, 'success');
        });
      } else {
        notify(b.dataset.a === 'report' ? 'Reported' : 'Updated feed', 'info');
      }
      menu.style.display = 'none';
    });
  });

  // Feed interactions (memotions cards): persistent like/save/comment + color states
  container.querySelectorAll('.meme-card, .post-card').forEach((card) => {
    if (card.dataset.feedActionsBound === '1') return;
    card.dataset.feedActionsBound = '1';
    const id = cardStateId(card);
    const all = getFeedStateAll();
    const st = all[id] || { liked: false, saved: false, likes: null, reactions: {} };
    const likeBtn = card.querySelector('.action-btn.like-btn, .like-btn, [data-action="like"]');
    const commentBtn = card.querySelector('.action-btn.comment-btn, .comment-btn, [data-action="comment"]');
    const saveBtn = card.querySelector('.action-btn.save-btn, .save-btn, [data-action="save"], .bookmark-btn, #saveBtn');
    const shareBtn = card.querySelector('.action-btn.share-btn, .share-btn, [data-action="share"], #shareBtn');
    const likeCountEl = likeBtn?.querySelector('span') || card.querySelector('.like-count, .likes');

    const applyState = () => {
      if (likeBtn) {
        likeBtn.style.color = st.liked ? '#f43f5e' : '#9ca3af';
        const icon = likeBtn.querySelector('i');
        if (icon) {
          icon.className = st.liked ? 'fas fa-heart' : 'far fa-heart';
          icon.style.setProperty('color', st.liked ? '#f43f5e' : '#9ca3af', 'important');
        }
      }
      if (saveBtn) {
        saveBtn.style.color = st.saved ? '#fbbf24' : '#9ca3af';
        const icon = saveBtn.querySelector('i, svg');
        if (icon) {
          if (icon.tagName.toLowerCase() === 'i') icon.className = st.saved ? 'fas fa-bookmark' : 'far fa-bookmark';
          icon.style.setProperty('color', st.saved ? '#fbbf24' : '#9ca3af', 'important');
          icon.style.setProperty('fill', st.saved ? '#fbbf24' : '#9ca3af', 'important');
          icon.style.setProperty('stroke', st.saved ? '#fbbf24' : '#9ca3af', 'important');
        }
      }
      if (likeCountEl && st.likes != null) likeCountEl.textContent = formatCount(st.likes);
    };

    if (likeCountEl && st.likes == null) st.likes = parseCount(likeCountEl.textContent || '0');
    applyState();

    if (likeBtn) {
      likeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        st.liked = !st.liked;
        st.likes = Math.max(0, Number(st.likes || 0) + (st.liked ? 1 : -1));
        const nextAll = getFeedStateAll();
        nextAll[id] = st;
        setFeedStateAll(nextAll);
        applyState();
      }, true);
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        st.saved = !st.saved;
        const nextAll = getFeedStateAll();
        nextAll[id] = st;
        setFeedStateAll(nextAll);
        applyState();
        notify(st.saved ? 'Saved to your collection' : 'Removed from saved', st.saved ? 'success' : 'warning');
      }, true);
    }
    if (shareBtn) {
      shareBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        const image = card.querySelector('img')?.src || '';
        const caption = card.querySelector('.meme-caption, .caption, .card-title, .post-title')?.textContent?.trim() || 'Meme post';
        const creator = card.querySelector('.creator-name, .username, .post-author-name')?.textContent?.trim() || 'memotions_user';
        const likes = likeCountEl?.textContent?.trim() || '0';
        window.__memotionsOpenShareDialog?.({ id, image, caption, creator, likes, comments: '0', shares: '1.2K' });
      }, true);
    }

    if (commentBtn) {
      commentBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        const image = card.querySelector('img')?.src || '';
        const caption = card.querySelector('.meme-caption, .caption, .card-title, .post-title')?.textContent?.trim() || 'Meme post';
        const creator = card.querySelector('.creator-name, .username, .post-author-name')?.textContent?.trim() || 'memotions_user';
        const likes = likeCountEl?.textContent?.trim() || '0';
        window.__openUnifiedPostModal?.({ id, image, caption, creator, likes, comments: '0' });
      }, true);
    }

    // Stabilize reaction-item behavior on non-For-You surfaces.
    if (path !== '/memotions') {
      card.querySelectorAll('.reaction-item').forEach((item) => {
        if (item.dataset.reactionToggleBound === '1') return;
        item.dataset.reactionToggleBound = '1';
        const emoji = (item.querySelector('.reaction-emoji')?.textContent || '').trim();
        const countEl = item.querySelector('.reaction-count');
        const base = parseCount(countEl?.textContent || '0');
        item.dataset.baseCount = String(base);
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation?.();
          const all2 = getFeedStateAll();
          const st2 = all2[id] || { liked: false, saved: false, likes: null, reactions: {} };
          st2.reactions = st2.reactions || {};
          const current = !!st2.reactions[emoji]?.active;
          st2.reactions[emoji] = { active: !current };
          all2[id] = st2;
          setFeedStateAll(all2);
          const next = base + (st2.reactions[emoji].active ? 1 : 0);
          if (countEl) countEl.textContent = String(next);
          item.style.background = st2.reactions[emoji].active ? 'rgba(139,92,246,.2)' : 'transparent';
          item.style.borderColor = st2.reactions[emoji].active ? '#8b5cf6' : 'transparent';
        }, true);
      });
    }
  });

  // Emoji picker anchored to clicked add-reaction button
  container.querySelectorAll('.add-reaction-btn').forEach((btn) => {
    if (btn.dataset.emojiBound === '1') return;
    btn.dataset.emojiBound = '1';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll('.mem-emoji-picker').forEach((x) => x.remove());
      const picker = document.createElement('div');
      picker.className = 'mem-emoji-picker';
      TOP_25_EMOJIS.forEach((emoji) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = emoji;
        b.addEventListener('click', () => {
          const panel = btn.closest('.reactions-panel, .card-container')?.querySelector('.reactions-panel') || btn.closest('.reactions-panel');
          if (panel) {
            const card = btn.closest('.meme-card, .post-card, .trending-card');
            const id = cardStateId(card);
            const all = getFeedStateAll();
            const st = all[id] || { liked: false, saved: false, likes: null, reactions: {} };
            st.reactions = st.reactions || {};
            const prev = !!st.reactions[emoji]?.active;
            st.reactions[emoji] = { active: !prev };
            all[id] = st;
            setFeedStateAll(all);
            const existing = Array.from(panel.querySelectorAll('.reaction-item .reaction-emoji')).find((n) => (n.textContent || '').trim() === emoji);
            if (existing) {
              const item = existing.closest('.reaction-item');
              const countEl = item?.querySelector('.reaction-count');
              const base = parseCount(item?.dataset.baseCount || countEl?.textContent || '0');
              item.dataset.baseCount = String(base);
              const n = base + (st.reactions[emoji].active ? 1 : 0);
              if (countEl) countEl.textContent = String(Math.max(0, n));
              if (item) item.style.background = st.reactions[emoji].active ? 'rgba(139,92,246,.2)' : 'transparent';
              if (item) item.style.borderColor = st.reactions[emoji].active ? '#8b5cf6' : 'transparent';
              if (!st.reactions[emoji].active && base <= 0) item?.remove();
            } else {
              const item = document.createElement('div');
              item.className = 'reaction-item';
              item.dataset.baseCount = '0';
              item.innerHTML = `<div class="reaction-emoji">${emoji}</div><div class="reaction-count">${st.reactions[emoji].active ? '1' : '0'}</div>`;
              item.style.background = st.reactions[emoji].active ? 'rgba(139,92,246,.2)' : 'transparent';
              item.style.borderColor = st.reactions[emoji].active ? '#8b5cf6' : 'transparent';
              if (st.reactions[emoji].active) panel.insertBefore(item, panel.querySelector('.add-reaction-btn') || null);
            }
          }
          picker.remove();
        });
        picker.appendChild(b);
      });
      document.body.appendChild(picker);
      const r = btn.getBoundingClientRect();
      picker.style.left = `${Math.max(8, Math.min(window.innerWidth - 328, r.left - 220))}px`;
      picker.style.top = `${Math.max(8, r.top - 270)}px`;
      const closeOnOutside = (ev) => {
        if (picker.contains(ev.target) || ev.target === btn) return;
        picker.remove();
        document.removeEventListener('mousedown', closeOnOutside, true);
      };
      document.addEventListener('mousedown', closeOnOutside, true);
    }, true);
  });

  if (path === '/memotions' && !container.querySelector('.meme-card[data-injected-gif="1"]')) {
    const feed = container.querySelector('.feed-container, .main-feed, .content-grid');
    const firstCard = feed?.querySelector('.meme-card, .post-card');
    if (feed && firstCard) {
      const gif = firstCard.cloneNode(true);
      gif.setAttribute('data-injected-gif', '1');
      const img = gif.querySelector('img');
      if (img) img.src = 'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif';
      const title = gif.querySelector('.meme-caption, .caption, .card-title, .post-title');
      if (title) title.textContent = 'GIF drop: when the sprint ends early';
      feed.insertBefore(gif, firstCard.nextSibling);
    }
  }

  // Comment reply badge + thread toggles
  const modal = container.querySelector('#react-profile-post-modal');
  const commentsList = modal?.querySelector('#react-post-comments-list');
  const input = modal?.querySelector('#react-post-comment-input');
  if (modal && input && !modal.querySelector('.rp-replying-chip')) {
    const chip = document.createElement('div');
    chip.className = 'rp-replying-chip';
    chip.innerHTML = `<span class="rp-replying-text"></span><button type="button">✕</button>`;
    input.parentElement?.insertBefore(chip, input);
    chip.querySelector('button')?.addEventListener('click', () => {
      chip.style.display = 'none';
      delete input.dataset.replyTo;
      input.value = '';
    });
  }
  if (commentsList && commentsList.dataset.memReplyToggle !== '1') {
    commentsList.dataset.memReplyToggle = '1';
    commentsList.addEventListener('click', (e) => {
      const replyBtn = e.target.closest('.rp-reply-btn');
      if (replyBtn && input) {
        const row = replyBtn.closest('[data-comment-id]');
        const user = row?.querySelector('span')?.textContent?.trim() || 'user';
        const chip = modal?.querySelector('.rp-replying-chip');
        const text = chip?.querySelector('.rp-replying-text');
        if (chip && text) {
          text.textContent = `Replying to @${user}`;
          chip.style.display = 'inline-flex';
        }
      }
    }, true);
  }
}

function injectOthersProfileWorkingGifs(container) {
  if (!container || window.location.pathname !== '/others_profile') return;
  const gifsTab = container.querySelector('.profile-tabs .tab[data-tab="gifs"]');
  if (!gifsTab) return;

  const gifPosts = [
    { id: 'ogif_1', image: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif', caption: 'Me entering the weekend with zero pending tasks', likes: '412K', comments: '9.2K' },
    { id: 'ogif_2', image: 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif', caption: 'When coffee hits and the bug disappears', likes: '367K', comments: '7.8K' },
    { id: 'ogif_4', image: 'https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/giphy.gif', caption: 'That one teammate carrying the sprint', likes: '255K', comments: '5.4K' },
    { id: 'ogif_5', image: 'https://media.giphy.com/media/13borq7Zo2kulO/giphy.gif', caption: 'Mood when client says “small change only”', likes: '223K', comments: '4.9K' },
    { id: 'ogif_6', image: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', caption: 'Brain buffering during Monday standup', likes: '189K', comments: '3.8K' },
    { id: 'ogif_7', image: 'https://media.giphy.com/media/3oEduSbSGpGaRX2Vri/giphy.gif', caption: 'When production is stable for 24 hours', likes: '176K', comments: '3.2K' },
    { id: 'ogif_8', image: 'https://media.giphy.com/media/l4FGI8GoTL7N4DsyI/giphy.gif', caption: 'Trying to stay calm before release', likes: '168K', comments: '2.9K' },
    { id: 'ogif_9', image: 'https://media.giphy.com/media/l4FGI8GoTL7N4DsyI/giphy.gif', caption: 'End-of-day victory dance after merge', likes: '145K', comments: '2.2K' },
  ];
  const gifFallbacks = [
    'https://upload.wikimedia.org/wikipedia/commons/8/82/Planeta_terra.gif',
    'https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif',
    'https://upload.wikimedia.org/wikipedia/commons/1/1a/Bachalpseeflowers.gif',
  ];

  const openGifModal = (post) => {
    if (typeof window.__openUnifiedPostModal !== 'function') return;
    window.__openUnifiedPostModal({
      id: post.id,
      image: post.image,
      caption: post.caption,
      creator: 'gif_goddess',
      likes: post.likes,
      comments: post.comments,
    });
  };

  const syncGifCount = () => {
    const countNode = gifsTab.querySelector('.tab-count');
    if (countNode) countNode.textContent = String(gifPosts.length);
  };

  const renderGifGrid = () => {
    const contentArea = container.querySelector('#contentArea') || container.querySelector('.profile-content') || container;
    if (!contentArea) return;
    let grid = contentArea.querySelector('.content-grid, .posts-grid');
    if (!grid) {
      grid = document.createElement('div');
      grid.className = 'content-grid';
      contentArea.appendChild(grid);
    }

    grid.innerHTML = '';
    gifPosts.forEach((post) => {
      const card = document.createElement('div');
      card.className = 'grid-item';
      card.setAttribute('data-id', post.id);
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <img src="${post.image}" alt="${post.caption.replace(/"/g, '&quot;')}" loading="lazy" />
        <div class="post-overlay">
          <div class="overlay-stats">
            <span class="likes">${post.likes}</span>
            <span class="comments">${post.comments}</span>
          </div>
          <div class="post-title">${post.caption}</div>
        </div>
      `;
      const imgEl = card.querySelector('img');
      if (imgEl) {
        imgEl.dataset.fallbackIndex = '0';
        imgEl.addEventListener('error', () => {
          const nextIndex = Number(imgEl.dataset.fallbackIndex || '0');
          if (nextIndex >= gifFallbacks.length) return;
          imgEl.dataset.fallbackIndex = String(nextIndex + 1);
          imgEl.src = gifFallbacks[nextIndex];
        });
      }
      card.addEventListener('click', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        openGifModal(post);
      }, true);
      grid.appendChild(card);
    });

    syncGifCount();
  };

  if (gifsTab.dataset.memGifsBound !== '1') {
    gifsTab.dataset.memGifsBound = '1';
    gifsTab.addEventListener('click', () => {
      setTimeout(renderGifGrid, 20);
    });
  }

  if (gifsTab.classList.contains('active')) {
    renderGifGrid();
  }
  // Keep GIF count correct on first page load and after any delayed tab UI updates.
  syncGifCount();
  setTimeout(syncGifCount, 120);
  setTimeout(syncGifCount, 420);
}

function enforceCreateMobileLayoutLock(container) {
  if (!container || window.location.pathname !== '/create') return;
  const applyLock = () => {
    if (window.innerWidth > 768) return;
    document.body.style.setProperty('overflow-x', 'hidden', 'important');
    const q = (sel) => Array.from(container.querySelectorAll(sel));
    q('.app').forEach((el) => {
      el.style.setProperty('padding-left', '0', 'important');
      el.style.setProperty('padding-right', '0', 'important');
      el.style.setProperty('margin-left', '0', 'important');
      el.style.setProperty('margin-right', '0', 'important');
      el.style.setProperty('display', 'block', 'important');
    });
    q('.left-sidebar, .right-sidebar').forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
    });
    q('.meme-studio').forEach((el) => {
      el.style.setProperty('width', '100%', 'important');
      el.style.setProperty('max-width', '100%', 'important');
      el.style.setProperty('margin', '0', 'important');
      el.style.setProperty('overflow', 'hidden', 'important');
    });
    q('.creator-grid').forEach((el) => {
      el.style.setProperty('display', 'block', 'important');
      el.style.setProperty('gap', '.75rem', 'important');
      el.style.setProperty('padding', '.65rem', 'important');
    });
    q('.canvas-area').forEach((el) => {
      el.style.setProperty('display', 'flex', 'important');
      el.style.setProperty('margin-bottom', '.75rem', 'important');
      el.style.setProperty('width', '100%', 'important');
      el.style.setProperty('max-width', '100%', 'important');
      el.style.setProperty('min-width', '0', 'important');
    });
    q('.tools-panel').forEach((el) => {
      el.style.setProperty('position', 'static', 'important');
      el.style.setProperty('left', 'auto', 'important');
      el.style.setProperty('right', 'auto', 'important');
      el.style.setProperty('top', 'auto', 'important');
      el.style.setProperty('display', 'block', 'important');
      el.style.setProperty('flex', '0 0 auto', 'important');
      el.style.setProperty('width', '100%', 'important');
      el.style.setProperty('max-width', '100%', 'important');
      el.style.setProperty('min-width', '0', 'important');
      el.style.setProperty('overflow', 'hidden', 'important');
    });
    q('.canvas-area, .meme-frame, .canvas-shell, .canvas-wrap').forEach((el) => {
      el.style.setProperty('width', '100%', 'important');
      el.style.setProperty('max-width', '100%', 'important');
      el.style.setProperty('min-width', '0', 'important');
    });
    q('.upload-btn, .upload-image-btn').forEach((el) => {
      el.style.setProperty('max-width', 'calc(100vw - 3rem)', 'important');
      el.style.setProperty('white-space', 'nowrap', 'important');
    });
  };

  applyLock();
  setTimeout(applyLock, 120);
  setTimeout(applyLock, 300);
  setTimeout(applyLock, 650);
  setTimeout(applyLock, 1200);

  if (container.dataset.createMobileGuardBound !== '1') {
    container.dataset.createMobileGuardBound = '1';
    const guardObserver = new MutationObserver(() => {
      applyLock();
    });
    const watchRoot =
      container.querySelector('.meme-studio') ||
      container.querySelector('.creator-grid') ||
      container;
    guardObserver.observe(watchRoot, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
    window.addEventListener('resize', applyLock, { passive: true });
    window.addEventListener('orientationchange', applyLock, { passive: true });
    if (!window.__memCreateMobileInterval) {
      window.__memCreateMobileInterval = window.setInterval(() => {
        if (window.location.pathname === '/create' && window.innerWidth <= 768) applyLock();
      }, 500);
    }
    // Keep reference so future re-renders can reuse the same observer.
    window.__memCreateMobileGuard = guardObserver;
  }
}

function stabilizeCreateMobileSurface(container) {
  if (!container || window.location.pathname !== '/create' || window.innerWidth > 768) return;
  const app = container.querySelector('.app');
  if (app) {
    app.style.setProperty('padding-left', '0', 'important');
    app.style.setProperty('padding-right', '0', 'important');
    app.style.setProperty('margin-left', '0', 'important');
    app.style.setProperty('margin-right', '0', 'important');
  }
  container.querySelectorAll('.left-sidebar, .right-sidebar').forEach((el) => el.remove());
}


export function RawHtmlPage({ htmlSource }) {
  const navigate = useNavigate();
  const rewrittenHtml = useMemo(() => rewriteHtmlLinks(htmlSource), [htmlSource]);
  const managedHeadNodesRef = useRef([]);

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rewrittenHtml, 'text/html');
    if (doc.title) document.title = doc.title;

    for (const node of managedHeadNodesRef.current) node.remove();
    managedHeadNodesRef.current = [];

    const headNodes = doc.head.querySelectorAll('link[rel="stylesheet"], style');
    headNodes.forEach((node) => {
      const clone = node.cloneNode(true);
      clone.setAttribute('data-parity-head', '1');
      document.head.appendChild(clone);
      managedHeadNodesRef.current.push(clone);
    });

    return () => {
      for (const node of managedHeadNodesRef.current) node.remove();
      managedHeadNodesRef.current = [];
    };
  }, [rewrittenHtml]);

  useEffect(() => {
    const container = document.getElementById('parity-page-root');
    if (!container) return;
    const isCreateMobile = window.location.pathname === '/create' && window.innerWidth <= 768;
    document.body.setAttribute('data-route', window.location.pathname === '/' ? 'memotions' : window.location.pathname.replace('/', ''));
    bindSpaNavigation(container, navigate);
    executeScripts(container);
    if (!isCreateMobile) injectSidebarAndPolicyLinks(container);
    if (!isCreateMobile) applyMemotionsRightSidebarForSelectedRoutes(container);
    cleanupProfileQuickFilters(container);
    injectShareDialog(container);
    injectTopActionPanels(container);
    injectGlobalShareCtas(container);
    removeDuplicatePageLogo(container);
    injectMemotionsFeedScrollFix(container);
    fixMemotionsLayoutGap(container);
    injectUploadedMemesIntoProfiles(container);
    injectSavedPostsIntoProfileSavedTab(container);
    injectFeedAndHofModalOpen(container);
    injectFollowButtons(container);
    applyGlobalThemeFromSettings(container);
    injectGlobalResponsiveConsistencyStyles();
    enforceCreateMobileLayoutLock(container);
    stabilizeCreateMobileSurface(container);
    injectMobileBrandBar();
    injectMobileBottomNav();
    injectDemoAuth(container, navigate);
    injectInteractionAuthGate(container);
    removeTopNavOnPolicyPages(container);
    injectOwnProfileAvatarUpload(container);
    injectProfilePostModal(container);
    injectOthersProfileWorkingGifs(container);
    injectUiPovPack(container);
    try { injectProductionUiPack(container); } catch (e) { console.error('injectProductionUiPack failed', e); }
    setTimeout(() => removeDuplicatePageLogo(container), 120);
    setTimeout(() => injectUploadedMemesIntoProfiles(container), 260);
    setTimeout(() => injectSavedPostsIntoProfileSavedTab(container), 300);
    setTimeout(() => injectFeedAndHofModalOpen(container), 320);
    setTimeout(() => injectFollowButtons(container), 340);
    setTimeout(() => fixMemotionsLayoutGap(container), 360);
    setTimeout(() => injectTopActionPanels(container), 200);
    setTimeout(() => injectOwnProfileAvatarUpload(container), 350);
    setTimeout(() => injectGlobalShareCtas(container), 250);
    setTimeout(() => injectProfilePostModal(container), 300);
    setTimeout(() => injectOthersProfileWorkingGifs(container), 320);
    setTimeout(() => cleanupProfileQuickFilters(container), 280);
    if (!isCreateMobile) setTimeout(() => applyMemotionsRightSidebarForSelectedRoutes(container), 330);
    setTimeout(() => injectUiPovPack(container), 360);
    setTimeout(() => { try { injectProductionUiPack(container); } catch (e) { console.error('injectProductionUiPack retry failed', e); } }, 440);
    setTimeout(() => enforceCreateMobileLayoutLock(container), 520);
    setTimeout(() => stabilizeCreateMobileSurface(container), 560);
  }, [navigate, rewrittenHtml]);

  return <div id="parity-page-root" dangerouslySetInnerHTML={{ __html: rewrittenHtml }} />;
}
