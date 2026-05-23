# 🗞️ GlobalIrony — Инструкции за деплой

Сайт за финансови, икономически и политически новини с AI-генериран сарказъм на БГ и EN.

---

## Файлове
```
globalirony/
├── index.html      ← главната страница
├── style.css       ← стилове
├── app.js          ← логика + AI sarcasm
├── vercel.json     ← Vercel конфигурация
└── README.md       ← това
```

---

## Стъпка 1 — Вземи Anthropic API ключ

1. Отиди на https://console.anthropic.com
2. Регистрирай се (безплатно)
3. Settings → API Keys → Create Key
4. Копирай ключа (изглежда: `sk-ant-api03-...`)

---

## Стъпка 2 — Добави ключа в app.js

Отвори `app.js` и намери реда:
```js
headers: { 'Content-Type': 'application/json' },
```

Промени го на:
```js
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'ТУК-ПОСТАВИ-КЛЮЧА-СИ',
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
},
```

---

## Стъпка 3 — Качи на GitHub

1. Отиди на https://github.com/new
2. Създай ново хранилище (repo), напр. `globalirony`
3. Качи всички файлове (Upload files)

---

## Стъпка 4 — Deploy на Vercel (безплатно)

1. Отиди на https://vercel.com
2. "Add New Project"
3. Import твоето GitHub repo
4. Deploy → готово!

Vercel дава безплатен домейн: `globalirony.vercel.app`

---

## Опции за персонализиране

**Смени името:**
В `index.html` → търси `GLOBAL<em>IRONY</em>` → промени

**Добави нов RSS feed:**
В `app.js` → масива `FEEDS` → добави нов обект:
```js
{ url: 'RSS_URL_ТУК', source: 'Ново Медия', sourceUrl: 'https://...', cat: 'finance' }
```

**Категории:** `finance`, `economy`, `politics`, `markets`

---

## Как работи

1. При зареждане сайтът дърпа реални новини от Reuters, FT, BBC, WSJ, AP
2. Изпраща заглавията към Claude API
3. Claude генерира саркастични резюмета на EN и БГ
4. Показва всичко с красив newspaper дизайн

---

Въпроси → globalirony@example.com
