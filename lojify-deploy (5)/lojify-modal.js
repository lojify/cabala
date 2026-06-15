/* ============================================================
   Lojify — Modal de Login / Cadastro
   Injeta um modal estilizado (tema dourado/escuro) e expõe
   window.LojifyModal.open(onSuccess) para abrir o fluxo.
   Requer lojify-auth.js carregado antes.
   ============================================================ */

(function () {
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    .lj-modal-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(10,6,8,0.85);
      display: none; align-items: center; justify-content: center;
      padding: 24px;
    }
    .lj-modal-overlay.open { display: flex; }
    .lj-modal {
      background: var(--bg-panel, #1c1117);
      border: 1px solid var(--gold-dim, #8a6f3f);
      border-radius: 4px;
      max-width: 420px; width: 100%;
      padding: 40px 32px;
      position: relative;
      font-family: var(--serif, 'Cormorant Garamond', serif);
      color: var(--ink, #ece6dc);
      box-shadow: 0 30px 80px rgba(0,0,0,0.6);
    }
    .lj-modal h3 {
      font-family: var(--display, 'Cinzel', serif);
      font-size: 22px; font-weight: 600;
      color: var(--gold-bright, #e8c882);
      margin-bottom: 8px; text-align: center;
    }
    .lj-modal .lj-sub {
      font-size: 14px; color: var(--ink-dim, #a89c93);
      text-align: center; margin-bottom: 24px;
    }
    .lj-modal label {
      display: block; font-family: var(--sans, 'Jost', sans-serif);
      font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;
      color: var(--gold-dim, #8a6f3f); margin-bottom: 6px; margin-top: 16px;
    }
    .lj-modal input {
      width: 100%; padding: 12px 14px;
      background: var(--bg-deep, #150c12);
      border: 1px solid var(--line, #3a2a30);
      border-radius: 2px; color: var(--ink, #ece6dc);
      font-family: var(--serif, serif); font-size: 16px;
    }
    .lj-modal input:focus { outline: none; border-color: var(--gold, #cda45e); }
    .lj-modal .lj-submit {
      width: 100%; margin-top: 24px;
      font-family: var(--display, 'Cinzel', serif);
      font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase;
      background: linear-gradient(135deg, var(--gold, #cda45e), var(--gold-bright, #e8c882));
      color: var(--bg-void, #0a0608);
      padding: 14px; border: none; border-radius: 2px;
      cursor: pointer; transition: all .25s ease;
    }
    .lj-modal .lj-submit:hover { box-shadow: 0 8px 24px rgba(205,164,94,0.35); }
    .lj-modal .lj-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .lj-modal .lj-toggle {
      text-align: center; margin-top: 20px; font-size: 13px;
      color: var(--ink-dim, #a89c93);
    }
    .lj-modal .lj-toggle a { color: var(--gold, #cda45e); text-decoration: underline; cursor: pointer; }
    .lj-modal .lj-close {
      position: absolute; top: 16px; right: 16px;
      background: transparent; border: none; color: var(--ink-dim, #a89c93);
      font-size: 20px; cursor: pointer; line-height: 1;
    }
    .lj-modal .lj-close:hover { color: var(--gold, #cda45e); }
    .lj-modal .lj-error {
      color: #e08a8a; font-size: 13px; margin-top: 12px; text-align: center;
      display: none;
    }
    .lj-modal .lj-info {
      color: var(--gold-bright, #e8c882); font-size: 13px; margin-top: 12px; text-align: center;
      display: none;
    }
  `;
  document.head.appendChild(styleTag);

  const overlay = document.createElement('div');
  overlay.className = 'lj-modal-overlay';
  overlay.innerHTML = `
    <div class="lj-modal">
      <button class="lj-close" aria-label="Fechar">✕</button>
      <h3 id="ljModalTitle">Acesse sua conta</h3>
      <p class="lj-sub" id="ljModalSub">Entre ou crie sua conta para continuar.</p>
      <label for="ljEmail">E-mail</label>
      <input type="email" id="ljEmail" autocomplete="email" placeholder="seu@email.com" />
      <label for="ljPass">Senha</label>
      <input type="password" id="ljPass" autocomplete="current-password" placeholder="••••••••" />
      <button class="lj-submit" id="ljSubmitBtn">Entrar</button>
      <div class="lj-error" id="ljError"></div>
      <div class="lj-info" id="ljInfo"></div>
      <div class="lj-toggle" id="ljToggle">
        Ainda não tem conta? <a id="ljToggleLink">Criar conta</a>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  let mode = 'signin'; // 'signin' | 'signup'
  let onSuccessCb = null;

  const els = {
    title: overlay.querySelector('#ljModalTitle'),
    sub: overlay.querySelector('#ljModalSub'),
    email: overlay.querySelector('#ljEmail'),
    pass: overlay.querySelector('#ljPass'),
    submit: overlay.querySelector('#ljSubmitBtn'),
    error: overlay.querySelector('#ljError'),
    info: overlay.querySelector('#ljInfo'),
    toggleLink: overlay.querySelector('#ljToggleLink'),
    close: overlay.querySelector('.lj-close'),
  };

  function renderMode() {
    els.error.style.display = 'none';
    els.info.style.display = 'none';
    if (mode === 'signin') {
      els.title.textContent = 'Acesse sua conta';
      els.sub.textContent = 'Entre com seu e-mail e senha.';
      els.submit.textContent = 'Entrar';
      overlay.querySelector('#ljToggle').innerHTML = 'Ainda não tem conta? <a id="ljToggleLink">Criar conta</a>';
    } else {
      els.title.textContent = 'Criar conta';
      els.sub.textContent = 'Crie sua senha para liberar o acesso após o pagamento.';
      els.submit.textContent = 'Criar conta';
      overlay.querySelector('#ljToggle').innerHTML = 'Já tem conta? <a id="ljToggleLink">Entrar</a>';
    }
    overlay.querySelector('#ljToggleLink').addEventListener('click', () => {
      mode = mode === 'signin' ? 'signup' : 'signin';
      renderMode();
    });
  }

  els.close.addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });

  els.submit.addEventListener('click', async () => {
    const email = els.email.value.trim();
    const pass = els.pass.value;
    els.error.style.display = 'none';
    els.info.style.display = 'none';

    if (!email || !pass) {
      els.error.textContent = 'Preencha e-mail e senha.';
      els.error.style.display = 'block';
      return;
    }
    if (pass.length < 6) {
      els.error.textContent = 'A senha precisa ter pelo menos 6 caracteres.';
      els.error.style.display = 'block';
      return;
    }

    els.submit.disabled = true;
    els.submit.textContent = 'Aguarde...';

    try {
      if (mode === 'signup') {
        const { data, error } = await window.LojifyAuth.signUp(email, pass);
        if (error) throw error;

        if (data.session) {
          overlay.classList.remove('open');
          if (onSuccessCb) onSuccessCb();
        } else {
          els.info.textContent = 'Conta criada! Verifique seu e-mail para confirmar antes de continuar, ou tente entrar.';
          els.info.style.display = 'block';
          mode = 'signin';
          renderMode();
        }
      } else {
        const { data, error } = await window.LojifyAuth.signIn(email, pass);
        if (error) throw error;
        overlay.classList.remove('open');
        if (onSuccessCb) onSuccessCb();
      }
    } catch (err) {
      let msg = err.message || 'Ocorreu um erro. Tente novamente.';
      if (msg.includes('Invalid login credentials')) msg = 'E-mail ou senha incorretos. Se ainda não tem conta, clique em "Criar conta" abaixo.';
      if (msg.includes('User already registered')) msg = 'Este e-mail já tem conta. Tente entrar.';
      els.error.textContent = msg;
      els.error.style.display = 'block';
    } finally {
      els.submit.disabled = false;
      els.submit.textContent = mode === 'signup' ? 'Criar conta' : 'Entrar';
    }
  });

  renderMode();

  window.LojifyModal = {
    open(onSuccess, startMode) {
      mode = startMode === 'signup' ? 'signup' : 'signin';
      els.email.value = '';
      els.pass.value = '';
      renderMode();
      onSuccessCb = onSuccess || null;
      overlay.classList.add('open');
      setTimeout(() => els.email.focus(), 50);
    },
    close() {
      overlay.classList.remove('open');
    },
  };
})();
