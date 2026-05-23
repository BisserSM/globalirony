/* ============================
   GLOBALIRONY — app.js
   Uses fallback articles + Claude API for sarcasm
   ============================ */

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const API_KEY = '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';

const FALLBACK_ARTICLES = [
  { title: 'Federal Reserve Holds Interest Rates Steady for Fifth Consecutive Meeting', source: 'Bloomberg', sourceUrl: 'https://bloomberg.com', cat: 'finance', url: 'https://bloomberg.com/news/articles/federal-reserve', pubDate: new Date().toISOString() },
  { title: 'IMF Cuts Global Growth Forecast Amid Trade Tensions and Geopolitical Risks', source: 'Financial Times', sourceUrl: 'https://ft.com', cat: 'economy', url: 'https://ft.com', pubDate: new Date(Date.now()-3600000).toISOString() },
  { title: 'G7 Leaders Summit Ends With Strongly Worded Statement on Global Challenges', source: 'Reuters', sourceUrl: 'https://reuters.com', cat: 'politics', url: 'https://reuters.com', pubDate: new Date(Date.now()-7200000).toISOString() },
  { title: 'S&P 500 Hits Record High on AI Enthusiasm and Strong Earnings Reports', source: 'WSJ', sourceUrl: 'https://wsj.com', cat: 'markets', url: 'https://wsj.com', pubDate: new Date(Date.now()-10800000).toISOString() },
  { title: 'European Central Bank Signals Cautious Approach to Future Rate Decisions', source: 'Financial Times', sourceUrl: 'https://ft.com', cat: 'finance', url: 'https://ft.com', pubDate: new Date(Date.now()-14400000).toISOString() },
  { title: 'China GDP Growth Beats Analyst Expectations in First Quarter', source: 'Reuters', sourceUrl: 'https://reuters.com', cat: 'economy', url: 'https://reuters.com', pubDate: new Date(Date.now()-18000000).toISOString() },
  { title: 'NATO Allies Agree to Increase Defense Spending at Brussels Summit', source: 'AP News', sourceUrl: 'https://apnews.com', cat: 'politics', url: 'https://apnews.com', pubDate: new Date(Date.now()-21600000).toISOString() },
  { title: 'Oil Prices Surge as Middle East Tensions Escalate Once Again', source: 'Bloomberg', sourceUrl: 'https://bloomberg.com', cat: 'markets', url: 'https://bloomberg.com', pubDate: new Date(Date.now()-25200000).toISOString() },
  { title: 'World Bank Warns of Debt Crisis Risk in Developing Economies', source: 'Financial Times', sourceUrl: 'https://ft.com', cat: 'economy', url: 'https://ft.com', pubDate: new Date(Date.now()-28800000).toISOString() },
  { title: 'Tech Giants Face New Antitrust Scrutiny in Both US and European Markets', source: 'WSJ', sourceUrl: 'https://wsj.com', cat: 'politics', url: 'https://wsj.com', pubDate: new Date(Date.now()-32400000).toISOString() },
  { title: 'Bitcoin Surges Past $70,000 as Institutional Adoption Accelerates', source: 'Bloomberg', sourceUrl: 'https://bloomberg.com', cat: 'markets', url: 'https://bloomberg.com', pubDate: new Date(Date.now()-36000000).toISOString() },
  { title: 'Inflation Remains Sticky in Several Major Economies Despite Rate Hikes', source: 'Reuters', sourceUrl: 'https://reuters.com', cat: 'finance', url: 'https://reuters.com', pubDate: new Date(Date.now()-39600000).toISOString() },
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
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
}

function setLang(lang) {
  currentLang = lang;
  document.body.classList.toggle('lang-bg', lang === 'bg');
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
}

async function generateSarcasm(articles) {
  const prompt = `You are a brilliantly witty, deeply sardonic news commentator writing for GlobalIrony. Write sarcastic summaries of financial, economic, and political news.

For each article title, write TWO sarcastic summaries:
1. In English (en) — sharp, dry British-style wit, 3-4 sentences max
2. In Bulgarian (bg) — same tone, natural Bulgarian, не превод а естествен сарказъм, 3-4 изречения

Be clever, not mean-spirited. Punch at institutions and power, not victims. Focus on absurdity, predictability of crises, gap between official language and reality.

Articles:
${articles.map((a, i) => `${i + 1}. [${a.cat.toUpperCase()}] ${a.title}`).join('\n')}

Respond ONLY with a valid JSON array (no markdown, no backticks):
[{"index": 1, "en": "...", "bg": "..."}, ...]`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.warn('Sarcasm generation failed:', e.message);
    return [];
  }
}

async function loadNews() {
  showLoading(true);
  cycleLoadingMessages();
  try {
    const articles = FALLBACK_ARTICLES;
    const sarcasms = await generateSarcasm(articles);
    allArticles = articles.map((a, i) => {
      const s = sarcasms.find(x => x.index === i + 1);
      return {
        ...a,
        sarcasm_en: s?.en || fallbackEN(a),
        sarcasm_bg: s?.bg || fallbackBG(a),
      };
    });
    renderNews();
    renderTicker();
    showLoading(false);
  } catch (err) {
    showError('The news gods are displeased. ' + err.message);
  }
}

function fallbackEN(a) {
  const t = [
    `In a shocking development that surprised absolutely no one, powerful people are doing things that benefit powerful people. The full story is available behind a paywall.`,
    `Officials confirm the situation is being "closely monitored," which is bureaucratic for "we saw it coming and did nothing." More updates expected once it resolves itself.`,
    `Markets reacted by going up, then down, then sideways — ultimately proving that markets react to news. Analysts are being paid to explain why.`,
    `World leaders expressed "deep concern" and called for "urgent dialogue," which historically resolves roughly 0% of urgent situations. Progress is expected imminently.`,
  ];
  return t[Math.floor(Math.random() * t.length)];
}

function fallbackBG(a) {
  const t = [
    `В шокираща новина, която не изненада никого, мощни хора правят неща в полза на мощни хора. Пълната история е зад платена стена.`,
    `Служителите потвърждават, че ситуацията „се наблюдава отблизо" — превод: „видяхме го идващо и не направихме нищо."`,
    `Пазарите реагираха като се покачиха, после паднаха, после се движиха настрани — доказвайки, че пазарите реагират на новини.`,
    `Световните лидери изразиха „дълбока загриженост" и призоваха за „спешен диалог", което исторически решава около 0% от спешните ситуации.`,
  ];
  return t[Math.floor(Math.random() * t.length)];
}

function renderNews() {
  const filtered = currentCat === 'all' ? allArticles : allArticles.filter(a => a.cat === currentCat);
  if (!filtered.length) {
    document.getElementById('newsLayout').style.display = 'none';
    document.getElementById('moreSection').style.display = 'none';
    showError('No stories found for this category.');
    return;
  }
  const [featured, ...rest] = filtered;
  const sideItems = rest.slice(0, 4);
  const moreItems = rest.slice(4);
  document.getElementById('featuredCol').innerHTML = renderFeaturedCard(featured);
  document.getElementById('sideList').innerHTML = sideItems.map(renderSideCard).join('');
  if (moreItems.length) {
    document.getElementById('moreGrid').innerHTML = moreItems.map(renderMoreCard).join('');
    document.getElementById('moreSection').style.display = 'block';
  } else {
    document.getElementById('moreSection').style.display = 'none';
  }
  document.getElementById('newsLayout').style.display = 'grid';
  setupPanel();
}

function filterArticles() { renderNews(); }
function catClass(cat) { return `cat-${cat}`; }
function catLabel(cat) { return cat.charAt(0).toUpperCase() + cat.slice(1); }
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000 / 60;
  if (diff < 60) return `${Math.round(diff)}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
}

function renderFeaturedCard(a) {
  return `<div class="featured-card">
    <div class="card-cat ${catClass(a.cat)}">${catLabel(a.cat)}</div>
    <h2 class="card-title">${a.title}</h2>
    <div class="card-source-line"><a href="${a.sourceUrl}" target="_blank">${a.source}</a><span>·</span><span>${timeAgo(a.pubDate)}</span></div>
    <div class="sarcasm-block">
      <div class="s-label">🧂 Sarcasm</div>
      <div class="s-text en-text">${a.sarcasm_en}</div>
      <div class="s-text bg-text">${a.sarcasm_bg}</div>
    </div>
    <a href="${a.url}" target="_blank" class="panel-source-btn">Read full story → ${a.source}</a>
  </div>`;
}

function renderSideCard(a) {
  return `<div class="side-card" onclick="openPanel(${JSON.stringify(a).replace(/"/g, '&quot;')})">
    <div class="side-card-cat ${catClass(a.cat)}">${catLabel(a.cat)}</div>
    <div class="side-card-title">${a.title}</div>
    <div class="side-card-sarcasm"><span class="en-text">${a.sarcasm_en}</span><span class="bg-text">${a.sarcasm_bg}</span></div>
    <div class="side-card-meta"><a href="${a.sourceUrl}" target="_blank" onclick="event.stopPropagation()">${a.source}</a><span>· ${timeAgo(a.pubDate)}</span></div>
  </div>`;
}

function renderMoreCard(a) {
  return `<div class="more-card" onclick="openPanel(${JSON.stringify(a).replace(/"/g, '&quot;')})">
    <div class="more-card-cat ${catClass(a.cat)}">${catLabel(a.cat)}</div>
    <div class="more-card-title">${a.title}</div>
    <div class="more-card-sarcasm"><span class="en-text">${a.sarcasm_en}</span><span class="bg-text">${a.sarcasm_bg}</span></div>
    <div class="more-card-meta"><a href="${a.sourceUrl}" target="_blank" onclick="event.stopPropagation()">${a.source}</a><span>· ${timeAgo(a.pubDate)}</span></div>
  </div>`;
}

function setupPanel() {
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
    <div class="panel-meta" style="margin-top:1rem;">${article.source} · ${timeAgo(article.pubDate)}</div>`;
  document.getElementById('articlePanel').classList.add('open');
  document.getElementById('overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePanel() {
  document.getElementById('articlePanel')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

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
