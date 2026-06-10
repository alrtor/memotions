(function () {
  const KEY = 'memotions-bridge-v4';
  const now = () => Date.now();

  const seed = {
    sessionUserId: 'u1',
    users: [
      { id: 'u1', name: 'Memelord', handle: 'memelord', avatar: 'https://robohash.org/memelord?set=set4&size=80x80' },
      { id: 'u2', name: 'GifQueen', handle: 'gifqueen', avatar: 'https://robohash.org/gifqueen?set=set2&size=80x80' },
      { id: 'u3', name: 'DankBrain', handle: 'dankbrain', avatar: 'https://robohash.org/dankbrain?set=set3&size=80x80' }
    ],
    follows: { u1: ['u2'], u2: ['u1'], u3: [] },
    posts: [],
    comments: [],
    notifications: []
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(seed);
      return { ...structuredClone(seed), ...JSON.parse(raw) };
    } catch {
      return structuredClone(seed);
    }
  }
  let state = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const me = () => state.users.find((u) => u.id === state.sessionUserId) || null;
  const goto = (path) => { window.location.href = path; };

  function hash(text) {
    let h = 0;
    for (let i = 0; i < text.length; i++) h = Math.imul(31, h) + text.charCodeAt(i) | 0;
    return Math.abs(h).toString(36);
  }

  function ensureNotif(text, type) {
    state.notifications.unshift({ id: 'n' + now(), text, type, createdAt: now(), read: false });
  }

  function compact(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  }

  const api = {
    getState: () => state,
    getSessionUser: me,
    login(handle) {
      const u = state.users.find((x) => x.handle.toLowerCase() === String(handle || '').trim().toLowerCase());
      if (!u) return null;
      state.sessionUserId = u.id;
      save();
      return u;
    },
    signup(name, handle) {
      const h = String(handle || '').trim().toLowerCase();
      if (!h || state.users.some((u) => u.handle.toLowerCase() === h)) return null;
      const user = { id: 'u' + now(), name: String(name || h), handle: h, avatar: `https://robohash.org/${h}?set=set4&size=80x80` };
      state.users.unshift(user);
      state.sessionUserId = user.id;
      state.follows[user.id] = [];
      save();
      return user;
    },
    ensurePost(data) {
      const key = data.bridgeKey || hash(`${data.title || ''}|${data.imageUrl || ''}|${data.caption || ''}`);
      let p = state.posts.find((x) => x.bridgeKey === key);
      if (!p) {
        p = { id: 'p' + now() + key.slice(0, 4), bridgeKey: key, userId: data.userId || (me()?.id || 'u1'), title: data.title || 'Meme', caption: data.caption || '', imageUrl: data.imageUrl || 'https://i.imgflip.com/265j.jpg', likes: [], shareCount: 0, savedBy: [], createdAt: now() };
        state.posts.unshift(p);
        save();
      }
      return p;
    },
    addPost(data) {
      const user = me();
      if (!user) return null;
      const p = { id: 'p' + now(), bridgeKey: hash(`${data.title || ''}|${data.imageUrl || ''}`), userId: user.id, title: data.title || 'Untitled', caption: data.caption || '', imageUrl: data.imageUrl || 'https://i.imgflip.com/265j.jpg', likes: [], shareCount: 0, savedBy: [], createdAt: now() };
      state.posts.unshift(p);
      ensureNotif('Post created', 'post');
      save();
      return p;
    },
    toggleLike(postId) {
      const user = me();
      if (!user) return 0;
      const p = state.posts.find((x) => x.id === postId);
      if (!p) return 0;
      const i = p.likes.indexOf(user.id);
      if (i >= 0) p.likes.splice(i, 1); else p.likes.push(user.id);
      ensureNotif(i >= 0 ? 'Like removed' : 'Post liked', 'like');
      save();
      return p.likes.length;
    },
    toggleSave(postId) {
      const user = me();
      if (!user) return false;
      const p = state.posts.find((x) => x.id === postId);
      if (!p) return false;
      const i = p.savedBy.indexOf(user.id);
      if (i >= 0) p.savedBy.splice(i, 1); else p.savedBy.push(user.id);
      save();
      return i < 0;
    },
    addComment(postId, text) {
      const user = me();
      if (!user || !String(text || '').trim()) return null;
      const c = { id: 'c' + now(), postId, userId: user.id, text: String(text).trim(), createdAt: now() };
      state.comments.push(c);
      ensureNotif('New comment posted', 'comment');
      save();
      return c;
    },
    sharePost(postId) {
      const p = state.posts.find((x) => x.id === postId);
      if (!p) return 0;
      p.shareCount = (p.shareCount || 0) + 1;
      ensureNotif('Post shared', 'share');
      save();
      return p.shareCount;
    },
    toggleFollow(handle) {
      const user = me();
      if (!user) return false;
      const target = state.users.find((u) => u.handle.toLowerCase() === String(handle || '').replace('@', '').toLowerCase());
      if (!target || target.id === user.id) return false;
      const mine = state.follows[user.id] || [];
      const i = mine.indexOf(target.id);
      if (i >= 0) mine.splice(i, 1); else mine.push(target.id);
      state.follows[user.id] = mine;
      ensureNotif(i >= 0 ? `Unfollowed @${target.handle}` : `Following @${target.handle}`, 'follow');
      save();
      return i < 0;
    },
    getComments(postId) { return state.comments.filter((c) => c.postId === postId); },
    markAllRead() { state.notifications = state.notifications.map((n) => ({ ...n, read: true })); save(); }
  };

  function patchLinks() {
    const map = { 'profile.html': '/profile' };
    document.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (map[href]) a.setAttribute('href', map[href]);
    });
  }

  function addSessionBadge() {
    const u = me();
    if (!u || document.getElementById('memotionsSessionBadge')) return;
    const badge = document.createElement('div');
    badge.id = 'memotionsSessionBadge';
    badge.textContent = `@${u.handle}`;
    badge.style.cssText = 'position:fixed;right:14px;top:14px;z-index:99999;background:#111a33;color:#dbeafe;border:1px solid #2f3f69;padding:6px 10px;border-radius:999px;font:600 12px Inter,sans-serif;';
    document.body.appendChild(badge);
  }

  function injectActionCtas() {
    if (document.getElementById('memotionsActionCtas')) return;
    const wrap = document.createElement('div');
    wrap.id = 'memotionsActionCtas';
    wrap.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:100000;font-family:Inter,system-ui,sans-serif;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;max-width:90vw;';
    const actions = [['+ Create', '/create'], ['Trending', '/trending'], ['Alerts', '/notifications'], ['Profile', '/profile']];
    wrap.innerHTML = actions.map(([label, path]) => `<button data-cta-path="${path}" style="padding:8px 10px;border-radius:999px;border:1px solid #334268;background:#101935;color:#cbd5e1;font-size:12px;font-weight:700;cursor:pointer;">${label}</button>`).join('');
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-cta-path]');
      if (!btn) return;
      goto(btn.dataset.ctaPath);
    });
    document.body.appendChild(wrap);
  }

  function wireAuthForm() {
    if (!location.pathname.includes('/auth')) return;
    document.querySelectorAll('form').forEach((form) => {
      form.addEventListener('submit', function (e) {
        const input = form.querySelector('input[placeholder*=Handle i], input[name*=handle i], input[type=text], input[type=email]');
        if (!input) return;
        e.preventDefault();
        const handle = input.value.trim();
        if (!handle) return;
        const ok = api.login(handle) || api.signup(handle, handle);
        if (ok) goto('/memotions');
      }, true);
    });
  }

  function ensurePostsFromDom() {
    const cards = document.querySelectorAll('.meme-card, .trending-card, .post-card, .post-side, .immortal-card, .rising-card');
    cards.forEach((card) => {
      if (card.dataset.bridgePostId) return;
      const title = (card.querySelector('.meme-caption, .card-title, .post-title, #postCaption') || {}).textContent || 'Meme';
      const image = (card.querySelector('img') || {}).src;
      const creator = ((card.querySelector('.username, .creator-name, .post-author-name, #postAuthorName, .card-creator span') || {}).textContent || '@memelord').replace('@', '').trim();
      let user = state.users.find((u) => u.handle === creator.toLowerCase());
      if (!user) {
        user = { id: 'u' + hash(creator), name: creator, handle: creator.toLowerCase(), avatar: `https://robohash.org/${creator}?set=set4&size=80x80` };
        state.users.push(user);
      }
      const p = api.ensurePost({ title, caption: title, imageUrl: image, userId: user.id, bridgeKey: hash(`${title}|${image}`) });
      card.dataset.bridgePostId = p.id;
    });
    save();
  }

  function bindCta(el, handlerKey, handler) {
    if (!el || el.dataset[handlerKey] === '1') return;
    el.dataset[handlerKey] = '1';
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handler(e);
    }, true);
  }

  function bindPageSpecificActions() {
    ensurePostsFromDom();

    const path = location.pathname;
    const globalButtons = [
      ['#createBtn', () => goto('/create')],
      ['#notificationBtn', () => goto('/notifications')],
      ['#profileBtn', () => goto('/profile')],
      ['#backBtn', () => goto('/memotions')]
    ];
    globalButtons.forEach(([sel, fn]) => bindCta(document.querySelector(sel), 'bridgeBound', fn));

    document.querySelectorAll('.action-btn[data-action="comment"], #commentBtn').forEach((btn) => {
      bindCta(btn, 'bridgeCommentBound', () => {
        const postId = btn.closest('.meme-card, .trending-card, .post-card, .post-side, .immortal-card, .rising-card')?.dataset.bridgePostId || state.posts[0]?.id;
        if (postId) localStorage.setItem('memotions_active_post_id', postId);
        goto('/comments');
      });
    });

    document.querySelectorAll('.action-btn[data-action="share"], #shareBtn, .share-option, #copyLinkBtn').forEach((btn) => {
      bindCta(btn, 'bridgeShareBound', () => {
        const postId = btn.closest('.meme-card, .trending-card, .post-card, .post-side, .immortal-card, .rising-card')?.dataset.bridgePostId || localStorage.getItem('memotions_active_post_id') || state.posts[0]?.id;
        if (postId) {
          localStorage.setItem('memotions_active_post_id', postId);
          api.sharePost(postId);
        }
        if (!path.includes('/share')) goto('/share');
      });
    });

    document.querySelectorAll('.action-btn[data-action="like"], #likePostBtn').forEach((btn) => {
      bindCta(btn, 'bridgeLikeBound', () => {
        const postId = btn.closest('.meme-card, .trending-card, .post-card, .post-side, .immortal-card, .rising-card')?.dataset.bridgePostId || localStorage.getItem('memotions_active_post_id') || state.posts[0]?.id;
        if (!postId) return;
        const likes = api.toggleLike(postId);
        const span = btn.querySelector('span') || document.getElementById('postLikes');
        if (span) span.textContent = compact(likes);
      });
    });

    document.querySelectorAll('.action-btn[data-action="save"], #saveBtn').forEach((btn) => {
      bindCta(btn, 'bridgeSaveBound', () => {
        const postId = btn.closest('.meme-card, .trending-card, .post-card, .post-side, .immortal-card, .rising-card')?.dataset.bridgePostId || localStorage.getItem('memotions_active_post_id') || state.posts[0]?.id;
        if (!postId) return;
        const on = api.toggleSave(postId);
        btn.classList.toggle('saved', on);
      });
    });

    document.querySelectorAll('.follow-btn, .follow-btn-sm, .follow-btn-small, #followBtn').forEach((btn) => {
      bindCta(btn, 'bridgeFollowBound', () => {
        const handle = (btn.dataset.name || btn.closest('.suggestion-item, .post-author-row, .creator-item')?.querySelector('.sugg-name, .post-author-name, .creator-name, #postAuthorName')?.textContent || '').replace('@', '').trim();
        if (!handle) return;
        const on = api.toggleFollow(handle);
        btn.textContent = on ? 'Following' : 'Follow';
      });
    });

    if (path.includes('/HallofFame')) {
      document.querySelectorAll('.immortal-card, .rising-card').forEach((card) => {
        bindCta(card, 'bridgeHofBound', () => {
          const postId = card.dataset.bridgePostId || state.posts[0]?.id;
          if (postId) localStorage.setItem('memotions_active_post_id', postId);
          goto('/comments');
        });
      });
    }

    if (path.includes('/lineage')) {
      document.querySelectorAll('.meme-card').forEach((card) => {
        bindCta(card, 'bridgeLineageBound', () => {
          const postId = card.dataset.bridgePostId || state.posts[0]?.id;
          if (postId) localStorage.setItem('memotions_active_post_id', postId);
          goto('/remix');
        });
      });
    }
  }

  function wireCreateForm() {
    if (!(location.pathname.includes('/create') || location.pathname.includes('/remix'))) return;
    const postBtn = document.getElementById('postBtn') || document.querySelector('.post-btn');
    const form = document.querySelector('form') || document.body;
    const submit = function () {
      const title = (form.querySelector('input[type=text], input[name*=title i]') || {}).value || 'Untitled meme';
      const caption = (form.querySelector('textarea') || {}).value || '';
      const imageUrl = (form.querySelector('input[type=url], input[name*=image i]') || {}).value || (document.querySelector('#memePreview img') || {}).src || 'https://i.imgflip.com/265j.jpg';
      const p = api.addPost({ title, caption, imageUrl });
      if (p) {
        localStorage.setItem('memotions_last_post_id', p.id);
        localStorage.setItem('memotions_active_post_id', p.id);
      }
    };
    if (postBtn && postBtn.dataset.bridgePostBound !== '1') {
      postBtn.dataset.bridgePostBound = '1';
      postBtn.addEventListener('click', submit, true);
    }
    if (form.tagName === 'FORM' && form.dataset.bridgePostBound !== '1') {
      form.dataset.bridgePostBound = '1';
      form.addEventListener('submit', submit, true);
    }
  }

  function wireCommentsPage() {
    if (!location.pathname.includes('/comments')) return;
    const postId = localStorage.getItem('memotions_active_post_id') || localStorage.getItem('memotions_last_post_id') || state.posts[0]?.id;
    if (!postId) return;
    const list = document.getElementById('commentsList');
    const input = document.getElementById('commentInput');
    const btn = document.getElementById('postCommentBtn');

    const render = () => {
      if (!list) return;
      const bridgeComments = api.getComments(postId);
      if (!bridgeComments.length) return;
      const block = document.createElement('div');
      block.innerHTML = bridgeComments.map((c) => {
        const u = state.users.find((x) => x.id === c.userId) || { handle: 'user' };
        return `<div class="comment-item"><div class="comment-content"><div class="comment-header"><span class="comment-name">@${u.handle}</span><span class="comment-time">now</span></div><div class="comment-text">${c.text}</div></div></div>`;
      }).join('');
      list.prepend(block);
    };

    if (btn && input && btn.dataset.bridgeCommentPostBound !== '1') {
      btn.dataset.bridgeCommentPostBound = '1';
      btn.addEventListener('click', () => {
        if (!input.value.trim()) return;
        api.addComment(postId, input.value.trim());
        input.value = '';
        render();
      }, true);
    }
    render();
  }

  function wireNotificationsPage() {
    if (!location.pathname.includes('/notifications')) return;
    const list = document.getElementById('notificationsList');
    const markAll = document.getElementById('markAllRead');
    if (!list) return;

    const render = () => {
      if (!state.notifications.length) return;
      list.innerHTML = state.notifications.slice(0, 30).map((n) => `
      <div class="notif-item ${n.read ? '' : 'unread'}">
        <div class="notif-avatar"><img src="${me()?.avatar || 'https://robohash.org/memotions?set=set4&size=50x50'}" alt="user"></div>
        <div class="notif-content"><div class="notif-text"><strong class="username">@${me()?.handle || 'memotions'}</strong> ${n.text} ${n.read ? '' : '<span class="unread-dot"></span>'}</div><div class="notif-time">just now</div></div>
        <div class="notif-preview" style="display:flex;align-items:center;justify-content:center;background:#1a1a28;"><i class="fas fa-bell" style="color:#8b5cf6"></i></div>
      </div>`).join('');
    };

    if (markAll && markAll.dataset.bridgeMarkBound !== '1') {
      markAll.dataset.bridgeMarkBound = '1';
      markAll.addEventListener('click', () => { api.markAllRead(); render(); }, true);
    }
    render();
  }

  function injectMissingPageCtas() {
    const host = document.querySelector('.top-nav, .nav, .app-header, .header');
    if (!host || document.getElementById('bridgeQuickCtaRow')) return;
    const row = document.createElement('div');
    row.id = 'bridgeQuickCtaRow';
    row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;padding:8px 12px;border-top:1px solid rgba(139,92,246,.2);';
    row.innerHTML = [
      '<button data-cta-path="/create" style="padding:6px 10px;border-radius:8px;border:1px solid #334268;background:#101935;color:#cbd5e1;cursor:pointer;">Create Meme</button>',
      '<button data-cta-path="/search" style="padding:6px 10px;border-radius:8px;border:1px solid #334268;background:#101935;color:#cbd5e1;cursor:pointer;">Search</button>',
      '<button data-cta-path="/leaderboard" style="padding:6px 10px;border-radius:8px;border:1px solid #334268;background:#101935;color:#cbd5e1;cursor:pointer;">Leaderboard</button>'
    ].join('');
    row.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-cta-path]');
      if (!btn) return;
      goto(btn.dataset.ctaPath);
    });
    host.appendChild(row);
  }

  function injectSidebarLinks() {
    const navMenu = document.querySelector('.left-sidebar .nav-menu');
    if (!navMenu) return;
    if (navMenu.dataset.bridgeSidebarInjected === '1') return;
    navMenu.dataset.bridgeSidebarInjected = '1';

    const extras = [
      { label: 'Create', icon: 'fa-plus-circle', path: '/create' },
      { label: 'Hall of Fame', icon: 'fa-crown', path: '/HallofFame' },
      { label: 'Settings', icon: 'fa-gear', path: '/settings' },
    ];

    extras.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'nav-item';
      row.setAttribute('data-bridge-path', item.path);
      row.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;
      row.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        goto(item.path);
      }, true);
      navMenu.appendChild(row);
    });
  }

  api.exportData = function exportData() {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memotions-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  api.importData = function importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const next = JSON.parse(String(reader.result || '{}'));
          state = { ...structuredClone(seed), ...next };
          save();
          resolve(true);
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };
  api.resetData = function resetData() { state = structuredClone(seed); save(); };

  function injectSettingsPanel() {
    if (!location.pathname.includes('/settings')) return;
    const host = document.querySelector('.settings-container, .settings-card, .settings-layout, .app, main, body');
    if (!host || document.getElementById('bridgeDataPanel')) return;
    const panel = document.createElement('section');
    panel.id = 'bridgeDataPanel';
    panel.style.cssText = 'margin:16px; padding:14px; border:1px solid #2f3f69; border-radius:12px; background:#0f152a; color:#e2e8f0; font-family:Inter,sans-serif;';
    panel.innerHTML = `<h3 style="margin:0 0 10px; font-size:14px;">Data Backup</h3><p style="margin:0 0 12px; font-size:12px; color:#aab6d6;">Export your local data before release/deploy updates.</p><div style="display:flex; gap:8px; flex-wrap:wrap;"><button id="bridgeExportBtn" style="padding:8px 10px; border-radius:8px; border:1px solid #3f5b9a; background:#16244b; color:#dbeafe; cursor:pointer;">Export JSON</button><label style="padding:8px 10px; border-radius:8px; border:1px solid #3f5b9a; background:#16244b; color:#dbeafe; cursor:pointer;">Import JSON<input id="bridgeImportInput" type="file" accept="application/json" style="display:none;"></label><button id="bridgeResetBtn" style="padding:8px 10px; border-radius:8px; border:1px solid #7f1d1d; background:#3b1111; color:#fecaca; cursor:pointer;">Reset Local Data</button></div><p id="bridgeDataMsg" style="margin:10px 0 0; font-size:12px; color:#9fb0d7;"></p>`;
    host.appendChild(panel);
    const msg = panel.querySelector('#bridgeDataMsg');
    panel.querySelector('#bridgeExportBtn').addEventListener('click', () => { api.exportData(); msg.textContent = 'Backup downloaded.'; });
    panel.querySelector('#bridgeImportInput').addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try { await api.importData(f); msg.textContent = 'Backup imported. Reloading...'; setTimeout(() => location.reload(), 400); }
      catch { msg.textContent = 'Import failed: invalid backup file.'; }
    });
    panel.querySelector('#bridgeResetBtn').addEventListener('click', () => {
      if (!confirm('Reset all local Memotions data on this browser?')) return;
      api.resetData(); msg.textContent = 'Data reset. Reloading...'; setTimeout(() => location.reload(), 400);
    });
  }

  function bootstrap() {
    patchLinks();
    addSessionBadge();
    injectActionCtas();
    wireAuthForm();
    wireCreateForm();
    wireCommentsPage();
    wireNotificationsPage();
    injectMissingPageCtas();
    injectSidebarLinks();
    injectSettingsPanel();
    bindPageSpecificActions();
    setTimeout(bindPageSpecificActions, 300);
    setTimeout(bindPageSpecificActions, 900);
    setTimeout(injectSidebarLinks, 300);
  }

  bootstrap();
  window.MemotionsBridge = api;
})();
