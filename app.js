/* ============================
   GLOBALIRONY — app.js
   Fetches real news via RSS,
   generates sarcasm via Claude API
   ============================ */

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const RSS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

// RSS feeds from serious sources
const FEEDS = [
  { url: 'https://feeds.reuters.com/reuters/businessNews', source: 'Reuters', sourceUrl: 'https://reuters.com', cat: 'finance' },
  { url: 'https://feeds.reuters.com/Reuters/worldNews', source: 'Reuters', sourceUrl: 'https://reuters.com', cat: 'politics' },
  { url: 'https://www.ft.com/rss/home', source: 'Financial Times', sourceUrl: 'https://ft.com', cat: 'economy' },
  { url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', source: 'WSJ', sourceUrl: 'https://wsj.com', cat: 'markets' },
  { url: 'https://rss.app/feeds/v1.1/FdLbMKVHDqf0plAz.json', source: 'Bloomberg', sourceUrl: 'https://bloomberg.com', cat: 'finance' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC Business', sourceUrl: 'https://bbc.com', cat: 'economy' },
  { url: 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml', source: 'WSJ', sourceUrl: 'https://wsj.com', cat: 'finance' },
  { url: 'https://apnews.com/rss/world-news', source: 'AP News', sourceUrl: 'https://apnews.com', cat: 'politics' },
];

// Fallback articles if RSS fails
const FALLBACK_ARTICLES = [
  { title: 'G7 Leaders Agree to "Take the Economy Very Seriously This Time" at Annual Summit', source: 'Reuters', sourceUrl: 'https://reuters.com', cat: 'politics', url: 'https://reuters.com', pubDate: new Date().toISOString() },
  { title: 'Fed Holds Rates Steady, Promises to Keep "Monitoring the Situation Closely"', source: 'Bloomberg', sourceUrl: 'https://bloomberg.com', cat: 'finance', url: 'https://bloomberg.com', pubDate: new Date().toISOString() },
  { title: 'IMF Revises Global Growth Forecast Down for the Third Consecutive Quarter', source: 'Financial Times', sourceUrl: 'https://ft.com', cat: 'economy', url: 'https://ft.com', pubDate: new Date().toISOString() },
  { title: 'Tech Stocks Rally on "AI Will Fix Everything" Analyst Report', source: 'WSJ', sourceUrl: 'https://wsj.com', cat: 'markets', url: 'https://wsj.com', pubDate: new Date().toISOString() },
  { title: 'EU Parliament Passes Non-Binding Resolution Calling for More Unity', source: 'Reuters', sourceUrl: 'https://reuters.com', cat: 'politics', url: 'https://reuters.com', pubDate: new Date().toISOString() },
  { title: 'Billionaire Warns About Wealth Inequality at $5,000-Per-Ticket Conference', source: 'The Economist', sourceUrl: 'https://economist.com', cat: 'economy', url: 'https://economist.com', pubDate: new Date().toISOString() },
  { title: 'Oil Prices Rise Amid Middle East Tensions, Analysts Surprised Yet Again', source: 'Reuters', sourceUrl: 'https://reuters.com', cat: 'markets', url: 'https://reuters.com', pubDate: new Date().toISOString() },
  { title: 'Central Banks Worldwide Signal "Data-Dependent" Approach to Literally Everything', source: 'Financial Times', sourceUrl: 'https://ft.com', cat: 'finance', url: 'https://ft.com', pubDate: new Date().toISOString() },
  { title: 'China GDP Growth Beats Expectations, Nobody Quite Sure Why', source: 'WSJ', sourceUrl: 'https://wsj.com', cat: 'economy', url: 'https://wsj.com', pubDate: new Date().toISOString() },
  { title: 'NATO Leaders Commit to Defense Spending Targets They Previously Missed', source: 'AP News', sourceUrl: 'https://apnews.com', cat: 'politics', url: 'https://apnews.com', pubDate: new Date().toISOString() },
];

let allArticles = [];
let currentLang = 'en';
let currentCat = 'all';

const loadingMessages = [
  'Fetching the world\'s problems...',
  'Translating chaos into headlines...',
  'Summoning financial anxiety...',
  'Consulting 47 "experts"...',
  'Calibrating outrage levels...',
  'Preparing sarcasm reserves...',
];

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  setDate();
  setupNavigation();
  setupLangToggle();
  loadNews();
});

function setDate() {
  const el = document.getElementById('dateDisplay');
  if (el) {
    const d = new Date();
    el.textContent = d.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
  }
}

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.dataset.cat;
      filterArticles();
    });
  });
}

function setupLangToggle() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
    });
  });
}

function setLang(lang) {
  currentLang = lang;
  document.body.classList.toggle('lang-bg', lang === 'bg');
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
}

// ── FETCH RSS ──
async function fetchFeed(feed) {
  try {
    const res = await fetch(`${RSS_PROXY}${encodeURIComponent(feed.url)}&count=4&api_key=ctxhqfhswxc7rq9jfrkbsf7h3kphbjmlutaxwmvn`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.items) return [];
    return data.items.slice(0, 4).map(item => ({
      title: item.title?.replace(/<[^>]+>/g, '').trim(),
      source: feed.source,
      sourceUrl: feed.sourceUrl,
      cat: feed.cat,
      url: item.link || item.url || feed.sourceUrl,
      pubDate: item.pubDate || new Date().toISOString(),
      description: item.description?.replace(/<[^>]+>/g, '').slice(0, 200) || '',
    })).filter(a => a.title && a.title.length > 10);
  } catch { return []; }
}

async function fetchAllFeeds() {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const articles = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  // deduplicate by title similarity
  const seen = new Set();
  return articles.filter(a => {
    const key = a.title.toLowerCase().slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
}

// ── GENERATE SARCASM ──
async function generateSarcasm(articles) {
  const prompt = `You are a brilliantly witty, deeply sardonic news commentator writing for a site called GlobalIrony. You write sarcastic summaries of financial, economic, and political news.

For each article title below, write TWO sarcastic summaries:
1. In English (en) — sharp, dry British-style wit, 3-4 sentences max
2. In Bulgarian (bg) — same tone, natural Bulgarian, не превод а естествен сарказъм, 3-4 изречения

The sarcasm should be clever, not mean-spirited. Punch at power, not at victims. Focus on the absurdity of institutions, the predictability of crises, and the gap between official language and reality.

Articles:
${articles.map((a, i) => `${i + 1}. [${a.cat.toUpperCase()}] ${a.title}`).join('\n')}

Respond ONLY with a valid JSON array (no markdown, no backticks, no explanation):
[
  {"index": 1, "en": "English sarcasm here.", "bg": "Български сарказъм тук."},
  ...
]`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.warn('Sarcasm generation failed:', e);
    return [];
  }
}

// ── LOAD & RENDER ──
async function loadNews() {
  showLoading(true);
  cycleLoadingMessages();

  try {
    // Try real RSS first
    let articles = await fetchAllFeeds();
    if (articles.length < 4) {
      articles = FALLBACK_ARTICLES;
    }

    // Generate sarcasm
    const sarcasms = await generateSarcasm(articles);

    // Merge sarcasm into articles
    allArticles = articles.map((a, i) => {
      const s = sarcasms.find(x => x.index === i + 1);
      return {
        ...a,
        sarcasm_en: s?.en || generateFallbackSarcasm(a),
        sarcasm_bg: s?.bg || generateFallbackSarcasmBG(a),
      };
    });

    renderNews();
    renderTicker();
    showLoading(false);

  } catch (err) {
    showError('The news gods are displeased. ' + err.message);
  }
}

function generateFallbackSarcasm(article) {
  const templates = [
    `In a shocking development that surprised absolutely no one, ${article.source} reports that powerful people are doing things that benefit powerful people. The full story is available behind a paywall.`,
    `Officials confirm the situation is being "closely monitored," which is bureaucratic for "we saw it coming and did nothing." More updates expected once the situation resolves itself.`,
    `Markets reacted to this news by going up, then down, then sideways — ultimately proving that markets react to news. Analysts are being paid to explain why.`,
    `World leaders have expressed "deep concern" and called for an "urgent dialogue," which historically resolves roughly 0% of urgent situations. Progress is expected imminently.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function generateFallbackSarcasmBG(article) {
  const templates = [
    `В шокираща новина, която не изненада абсолютно никого, мощни хора правят неща в полза на мощни хора. Пълната история е зад платена стена.`,
    `Служителите потвърждават, че ситуацията „се наблюдава отблизо" — бюрократски превод на „видяхме го идващо и не направихме нищо." Повече подробности се очакват, когато ситуацията се реши сама.`,
    `Пазарите реагираха на новините, като се покачиха, после паднаха, после се движиха настрани — доказвайки, че пазарите реагират на новини. Анализаторите получават заплата да обяснят защо.`,
    `Световните лидери изразиха „дълбока загриженост" и призоваха за „спешен диалог", което исторически решава около 0% от спешните ситуации. Напредъкът се очаква всеки момент.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function renderNews() {
  const filtered = currentCat === 'all' ? allArticles : allArticles.filter(a => a.cat === currentCat);
  if (!filtered.length) {
    document.getElementById('newsLayout').style.display = 'none';
    document.getElementById('moreSection').style.display = 'none';
    showError('No stories found for this category. The world may have briefly paused.');
    return;
  }

  const [featured, ...rest] = filtered;
  const sideItems = rest.slice(0, 4);
  const moreItems = rest.slice(4);

  // Featured
  document.getElementById('featuredCol').innerHTML = renderFeaturedCard(featured);
  // Side
  document.getElementById('sideList').innerHTML = sideItems.map(renderSideCard).join('');
  // More
  if (moreItems.length) {
    document.getElementById('moreGrid').innerHTML = moreItems.map(renderMoreCard).join('');
    document.getElementById('moreSection').style.display = 'block';
  } else {
    document.getElementById('moreSection').style.display = 'none';
  }

  document.getElementById('newsLayout').style.display = 'grid';

  // Panel
  setupPanel();
}

function filterArticles() {
  renderNews();
}

function catClass(cat) {
  return `cat-${cat}`;
}
function catLabel(cat) {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000 / 60;
  if (diff < 60) return `${Math.round(diff)}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
}

function renderFeaturedCard(a) {
  return `
    <div class="featured-card" data-url="${a.url}">
      <div class="card-cat ${catClass(a.cat)}">${catLabel(a.cat)}</div>
      <h2 class="card-title">${a.title}</h2>
      <div class="card-source-line">
        <a href="${a.sourceUrl}" target="_blank">${a.source}</a>
        <span>·</span>
        <span>${timeAgo(a.pubDate)}</span>
      </div>
      <div class="sarcasm-block">
        <div class="s-label">🧂 Sarcasm</div>
        <div class="s-text en-text">${a.sarcasm_en}</div>
        <div class="s-text bg-text">${a.sarcasm_bg}</div>
      </div>
      <a href="${a.url}" target="_blank" class="panel-source-btn">Read full story → ${a.source}</a>
    </div>`;
}

function renderSideCard(a) {
  return `
    <div class="side-card" onclick="openPanel(${JSON.stringify(a).replace(/"/g, '&quot;')})">
      <div class="side-card-cat ${catClass(a.cat)}">${catLabel(a.cat)}</div>
      <div class="side-card-title">${a.title}</div>
      <div class="side-card-sarcasm">
        <span class="en-text">${a.sarcasm_en}</span>
        <span class="bg-text">${a.sarcasm_bg}</span>
      </div>
      <div class="side-card-meta">
        <a href="${a.sourceUrl}" target="_blank" onclick="event.stopPropagation()">${a.source}</a>
        <span>· ${timeAgo(a.pubDate)}</span>
      </div>
    </div>`;
}

function renderMoreCard(a) {
  return `
    <div class="more-card" onclick="openPanel(${JSON.stringify(a).replace(/"/g, '&quot;')})">
      <div class="more-card-cat ${catClass(a.cat)}">${catLabel(a.cat)}</div>
      <div class="more-card-title">${a.title}</div>
      <div class="more-card-sarcasm">
        <span class="en-text">${a.sarcasm_en}</span>
        <span class="bg-text">${a.sarcasm_bg}</span>
      </div>
      <div class="more-card-meta">
        <a href="${a.sourceUrl}" target="_blank" onclick="event.stopPropagation()">${a.source}</a>
        <span>· ${timeAgo(a.pubDate)}</span>
      </div>
    </div>`;
}

// ── ARTICLE PANEL ──
function setupPanel() {
  // Ensure panel + overlay exist
  if (!document.getElementById('articlePanel')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="overlay" id="overlay" onclick="closePanel()"></div>
      <div class="article-panel" id="articlePanel">
        <div class="panel-close"><button class="panel-close-btn" onclick="closePanel()">← Close</button></div>
        <div id="panelContent"></div>
      </div>`);
  }
}

function openPanel(article) {
  setupPanel();
  document.getElementById('panelContent').innerHTML = `
    <div class="panel-cat ${catClass(article.cat)}">${catLabel(article.cat)}</div>
    <h2 class="panel-title">${article.title}</h2>
    <div class="panel-sarcasm">
      <div class="s-label">🧂 Sarcasm</div>
      <div class="s-text en-text">${article.sarcasm_en}</div>
      <div class="s-text bg-text">${article.sarcasm_bg}</div>
    </div>
    <a href="${article.url}" target="_blank" class="panel-source-btn">Read on ${article.source} →</a>
    <div class="panel-meta" style="margin-top:1rem; color:var(--muted);">
      ${article.source} · ${timeAgo(article.pubDate)}
    </div>`;
  document.getElementById('articlePanel').classList.add('open');
  document.getElementById('overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePanel() {
  document.getElementById('articlePanel')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ── TICKER ──
function renderTicker() {
  const tickers = [
    { label: 'S&P 500', val: '5,304', change: '+0.4%', up: true },
    { label: 'NASDAQ', val: '18,861', change: '+0.6%', up: true },
    { label: 'EUR/USD', val: '1.0842', change: '-0.1%', up: false },
    { label: 'Gold', val: '$2,341', change: '+0.8%', up: true },
    { label: 'Brent Oil', val: '$78.4', change: '-1.2%', up: false },
    { label: 'BTC', val: '$67,200', change: '+2.1%', up: true },
    { label: 'DAX', val: '18,704', change: '+0.2%', up: true },
    { label: '10Y UST', val: '4.62%', change: '+2bp', up: false },
    { label: 'JPY/USD', val: '156.3', change: '+0.3%', up: true },
    { label: 'Silver', val: '$27.8', change: '-0.4%', up: false },
  ];
  const html = [...tickers, ...tickers].map(t =>
    `<span><strong>${t.label}</strong> ${t.val} <span class="${t.up ? 'up' : 'down'}">${t.change}</span></span>`
  ).join('');
  const el = document.getElementById('tickerInner');
  if (el) el.innerHTML = html;
}

// ── UI HELPERS ──
let loadingInterval;
function showLoading(show) {
  document.getElementById('loadingState').style.display = show ? 'flex' : 'none';
  document.getElementById('newsLayout').style.display = show ? 'none' : 'grid';
  document.getElementById('errorState').style.display = 'none';
  if (!show && loadingInterval) clearInterval(loadingInterval);
}

function cycleLoadingMessages() {
  let i = 0;
  const el = document.getElementById('loadingMsg');
  if (el) el.textContent = loadingMessages[0];
  loadingInterval = setInterval(() => {
    i = (i + 1) % loadingMessages.length;
    if (el) el.textContent = loadingMessages[i];
  }, 2000);
}

function showError(msg) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('newsLayout').style.display = 'none';
  document.getElementById('moreSection').style.display = 'none';
  document.getElementById('errorState').style.display = 'block';
  document.getElementById('errorMsg').textContent = msg;
  if (loadingInterval) clearInterval(loadingInterval);
}
