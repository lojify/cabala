/* ============================================================
   Lojify — Topbar de Auth Universal
   Injeta um painel fixo no canto superior direito com:
     • Não logado  → botões "Entrar" + "Criar conta"
     • Logado s/ compra no produto atual → botão "Comprar"
     • Logado c/ compra → botão "Acessar"
   
   Uso: <script src="/lojify-topbar.js" defer data-product="mapa-cabalistico-pessoal" data-access-url="/mapa"></script>
   Atributos data-*:
     data-product     → slug do produto desta página (opcional; sem ele, só mostra login/sair)
     data-access-url  → URL de acesso ao conteúdo após compra confirmada
     data-buy-url     → URL da LP de compra (default: página atual)
   ============================================================ */

(function () {
  /* ── Aguardar LojifyAuth ficar disponível ──────────────────── */
  function waitAuth(ms) {
    return new Promise((resolve) => {
      if (window.LojifyAuth) return resolve(window.LojifyAuth);
      const deadline = Date.now() + (ms || 4000);
      const iv = setInterval(() => {
        if (window.LojifyAuth) { clearInterval(iv); resolve(window.LojifyAuth); }
        else if (Date.now() > deadline) { clearInterval(iv); resolve(null); }
      }, 80);
    });
  }

  /* ── Ler configuração do script tag ─────────────────────────── */
  const me = document.currentScript ||
    document.querySelector('script[src*="lojify-topbar"]');
  const PRODUCT = me ? (me.dataset.product || '') : '';
  const ACCESS_URL = me ? (me.dataset.accessUrl || '') : '';
  const BUY_URL = me ? (me.dataset.buyUrl || window.location.pathname) : window.location.pathname;

  /* ── CSS ─────────────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    #lj-topbar {
      position: fixed; top: 12px; right: 12px; z-index: 9980;
      display: flex; gap: 8px; align-items: center;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    #lj-topbar.lj-tb-hide { transform: translateY(-140%); opacity: 0; pointer-events: none; }
    .lj-tb-btn {
      font-family: 'Cinzel', 'Georgia', serif;
      font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase;
      background: rgba(11,7,30,0.82); backdrop-filter: blur(6px);
      border: 1px solid rgba(201,168,76,0.35);
      color: rgba(232,224,245,0.9);
      padding: 8px 14px; border-radius: 2px;
      cursor: pointer; text-decoration: none; display: inline-block;
      transition: border-color 0.2s, color 0.2s, background 0.2s;
      white-space: nowrap;
    }
    .lj-tb-btn:hover { border-color: rgba(201,168,76,0.7); color: #e8c97a; }
    .lj-tb-btn.lj-tb-primary {
      background: linear-gradient(135deg, rgba(45,16,96,0.95), rgba(26,10,62,0.95));
      border-color: rgba(201,168,76,0.6); color: #e8c97a;
    }
    .lj-tb-btn.lj-tb-primary:hover { border-color: #c9a84c; background: linear-gradient(135deg, rgba(61,24,128,0.95), rgba(42,13,85,0.95)); }
    .lj-tb-btn.lj-tb-access {
      background: linear-gradient(135deg, rgba(45,212,80,0.12), rgba(45,16,96,0.9));
      border-color: rgba(74,222,128,0.5); color: rgba(74,222,128,0.9);
    }
    .lj-tb-btn.lj-tb-access:hover { border-color: rgba(74,222,128,0.8); }
    .lj-tb-divider { width: 1px; height: 20px; background: rgba(201,168,76,0.2); }
    .lj-tb-user {
      font-family: 'Cinzel', serif; font-size: 0.55rem; letter-spacing: 0.08em;
      color: rgba(201,168,76,0.5); max-width: 120px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    @media (max-width: 480px) {
      #lj-topbar { top: 8px; right: 8px; gap: 5px; }
      .lj-tb-btn { font-size: 0.52rem; padding: 6px 10px; }
      .lj-tb-user { display: none; }
    }
  `;
  document.head.appendChild(style);

  /* ── HTML inicial (estado vazio enquanto carrega) ─────────────── */
  const bar = document.createElement('div');
  bar.id = 'lj-topbar';
  bar.innerHTML = ''; // renderizado após verificação
  document.body.appendChild(bar);

  /* ── Renderizar estado ──────────────────────────────────────── */
  function render(state) {
    // state: 'loading' | 'logged-out' | 'logged-in-no-product' | 'logged-in-no-access' | 'logged-in-access'
    switch (state) {
      case 'logged-out':
        bar.innerHTML = `
          <button class="lj-tb-btn" id="lj-tb-signin">Entrar</button>
          <button class="lj-tb-btn lj-tb-primary" id="lj-tb-signup">Criar conta</button>
        `;
        document.getElementById('lj-tb-signin').addEventListener('click', () => openModal('signin'));
        document.getElementById('lj-tb-signup').addEventListener('click', () => openModal('signup'));
        break;

      case 'logged-in-no-product':
        // Logado mas sem produto configurado na página (ex: calculadora)
        bar.innerHTML = `
          <span class="lj-tb-user" id="lj-tb-email"></span>
          <div class="lj-tb-divider"></div>
          <button class="lj-tb-btn" id="lj-tb-signout">Sair</button>
        `;
        document.getElementById('lj-tb-signout').addEventListener('click', doSignOut);
        break;

      case 'logged-in-no-access':
        // Logado, tem produto configurado, mas NÃO comprou
        bar.innerHTML = `
          <span class="lj-tb-user" id="lj-tb-email"></span>
          <div class="lj-tb-divider"></div>
          <button class="lj-tb-btn lj-tb-primary" id="lj-tb-buy">Comprar</button>
          <button class="lj-tb-btn" id="lj-tb-signout">Sair</button>
        `;
        document.getElementById('lj-tb-buy').addEventListener('click', doBuy);
        document.getElementById('lj-tb-signout').addEventListener('click', doSignOut);
        break;

      case 'logged-in-access':
        // Logado e comprou
        bar.innerHTML = `
          <span class="lj-tb-user" id="lj-tb-email"></span>
          <div class="lj-tb-divider"></div>
          <a href="${ACCESS_URL}" class="lj-tb-btn lj-tb-access" id="lj-tb-access">✦ Acessar</a>
          <button class="lj-tb-btn" id="lj-tb-signout">Sair</button>
        `;
        document.getElementById('lj-tb-signout').addEventListener('click', doSignOut);
        break;

      default:
        bar.innerHTML = '';
    }
  }

  /* ── Preencher e-mail do usuário ─────────────────────────────── */
  function fillEmail(user) {
    const el = document.getElementById('lj-tb-email');
    if (el && user && user.email) {
      el.textContent = user.email;
    }
  }

  /* ── Ações ───────────────────────────────────────────────────── */
  function openModal(startMode) {
    waitAuth(3000).then(auth => {
      if (!auth || !window.LojifyModal) return;
      window.LojifyModal.open(async () => {
        // Após login bem-sucedido, re-verificar estado
        await refresh();
        // Se tem produto e access URL, redirecionar se tiver acesso
        if (PRODUCT && ACCESS_URL) {
          const has = await auth.hasPurchased(PRODUCT).catch(() => false);
          if (has) { window.location.href = ACCESS_URL; return; }
          // Tem conta mas não comprou — ir para LP de compra
          if (BUY_URL && BUY_URL !== window.location.pathname) {
            window.location.href = BUY_URL;
          }
        }
      }, startMode);
    });
  }

  async function doBuy() {
    const auth = await waitAuth(3000);
    if (!auth) { window.location.href = BUY_URL; return; }
    try {
      await auth.startCheckout(PRODUCT);
    } catch (err) {
      console.error('[lj-topbar] doBuy error:', err);
      window.location.href = BUY_URL;
    }
  }

  async function doSignOut() {
    const auth = await waitAuth(3000);
    if (auth) await auth.signOut().catch(() => {});
    render('logged-out');
    // Recarregar para limpar estado da página
    window.location.reload();
  }

  /* ── Verificar estado e renderizar ─────────────────────────── */
  async function refresh() {
    const auth = await waitAuth(4000);
    if (!auth) { render('logged-out'); return; }

    const user = await auth.getCurrentUser().catch(() => null);

    if (!user) {
      render('logged-out');
      return;
    }

    if (!PRODUCT) {
      render('logged-in-no-product');
      fillEmail(user);
      return;
    }

    const has = await auth.hasPurchased(PRODUCT).catch(() => false);
    if (has) {
      render('logged-in-access');
    } else {
      render('logged-in-no-access');
    }
    fillEmail(user);
  }

  /* ── Hide on scroll down, show on scroll up ─────────────────── */
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > lastY && y > 80) bar.classList.add('lj-tb-hide');
    else bar.classList.remove('lj-tb-hide');
    lastY = y;
  }, { passive: true });

  /* ── Init ───────────────────────────────────────────────────── */
  // Aguarda DOM pronto e então verifica
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh);
  } else {
    refresh();
  }

})();
