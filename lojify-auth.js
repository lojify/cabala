/* ============================================================
   Lojify — Supabase Auth + Stripe Checkout helper
   Compartilhado entre todas as páginas do site (lojify.store)
   ============================================================ */

const SUPABASE_URL = 'https://nygxtbzecvsepgajkokk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Z3h0YnplY3ZzZXBnYWprb2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NTg2MTEsImV4cCI6MjA3NDMzNDYxMX0.Ne2v-_1RcmxetoNOqQ_QYnNTVWGRpQ-rb-UqCTsAAvw';

// Carrega o SDK do Supabase via CDN (uma vez só)
function loadSupabaseSDK() {
  return new Promise((resolve, reject) => {
    if (window.supabase) return resolve(window.supabase);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
    script.onload = () => resolve(window.supabase);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

let _client = null;
async function getClient() {
  if (_client) return _client;
  const sb = await loadSupabaseSDK();
  _client = sb.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}

// ---------- Sessão ----------
async function getSession() {
  const client = await getClient();
  const { data } = await client.auth.getSession();
  return data.session;
}

async function getCurrentUser() {
  const session = await getSession();
  return session ? session.user : null;
}

async function signOut() {
  const client = await getClient();
  await client.auth.signOut();
}

// ---------- Cadastro / login (email + senha) ----------
async function signUp(email, password) {
  const client = await getClient();
  return client.auth.signUp({ email, password });
}

async function signIn(email, password) {
  const client = await getClient();
  return client.auth.signInWithPassword({ email, password });
}

// ---------- Verificar acesso (tabela purchases) ----------
async function hasPurchased(productSlug) {
  const client = await getClient();
  const { data: { session } } = await client.auth.getSession();
  if (!session) return false;

  const { data, error } = await client
    .from('purchases')
    .select('status')
    .eq('product_slug', productSlug)
    .eq('status', 'paid')
    .maybeSingle();

  if (error) {
    console.error('Erro ao verificar compra:', error);
    return false;
  }
  return !!data;
}

// ---------- Checkout Stripe ----------

// Mapa de success_url e cancel_url por produto
const CHECKOUT_ROUTES = {
  'mapa-cabalistico-pessoal': {
    success_url: 'https://lojify.store/mapa?status=desbloqueado',
    cancel_url:  'https://lojify.store/',
  },
  'livro-negro-cabala': {
    success_url: 'https://lojify.store/livro?status=desbloqueado',
    cancel_url:  'https://lojify.store/livro',
  },
};

async function startCheckout(productSlug) {
  const client = await getClient();
  const { data: { session } } = await client.auth.getSession();
  if (!session) {
    throw new Error('not_authenticated');
  }

  const routes = CHECKOUT_ROUTES[productSlug] || {
    success_url: 'https://lojify.store/',
    cancel_url:  'https://lojify.store/',
  };

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      product_slug: productSlug,
      success_url:  routes.success_url,
      cancel_url:   routes.cancel_url,
    }),
  });

  const json = await resp.json();
  if (!resp.ok || json.error) {
    throw new Error(json.error || 'Erro ao criar sessão de checkout');
  }
  window.location.href = json.url;
}

// Expor globalmente
window.LojifyAuth = {
  getClient,
  getSession,
  getCurrentUser,
  signOut,
  signUp,
  signIn,
  hasPurchased,
  startCheckout,
};
