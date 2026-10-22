# Alimat Group — сайт

Статичний сайт на чистому HTML/CSS/JS. 7 мов: PL (основна), UA, RU, EN, ES, PT, RO.
Невеликий генератор на Node.js без залежностей збирає з `data/*.json` готові HTML-сторінки в `dist/`.

## Команди

```bash
node src/build.js     # зібрати сайт у dist/
node tools/check.js   # зібрати + перевірити переклади, посилання, SEO, JSON-LD (exit 1 при помилці)
```

Потрібен лише Node.js 20+. `npm install` не потрібен.

## Структура (за фічами)

```
data/settings.json        контакти, телефони, WhatsApp, адреса, endpoint форм
data/ui/<мова>.json       усі тексти інтерфейсу (7 файлів, однакові ключі)
data/jobs/<slug>.json     вакансії: блок "pl" (спільні поля + польський текст) + переклади
src/core/                 мови й URL, layout (head/SEO/header/footer), форми, утиліти
src/features/<фіча>/      home, jobs, candidates, apply, employers, contact
public/                   CSS, JS, лого, адмінка (/admin)
tools/check.js            перевірки якості
```

## Адмінка (/admin)

Decap CMS: редагування вакансій (всіма 7 мовами) і контактів у браузері.
Зміни зберігаються як коміти в Git, хостинг сам перезбирає сайт.

Налаштування на Netlify:
1. Залити проєкт у GitHub-репозиторій, підключити його в Netlify (налаштування збірки вже в `netlify.toml`).
2. Site settings → Identity → Enable; Registration → Invite only; Services → Git Gateway → Enable.
3. Запросити email адміністратора — він зайде на `https://alimatgroup.com/admin/`.

Для інших хостингів (Cloudflare Pages, Vercel) замініть `backend` у `public/admin/config.yml` на `github`.

## Форми

Якщо `formEndpoint` у `data/settings.json` порожній, заявка відкривається як готове повідомлення у WhatsApp.
Щоб заявки приходили на пошту, вкажіть URL сервісу форм (Formspree, Web3Forms, Basin тощо) —
адреса автоматично додається в Content-Security-Policy при збірці.

## SEO

- окремий URL для кожної мови з локалізованими адресами (`/uk/vakansii/`, `/en/jobs/` …), `hreflang` + `x-default`
- `sitemap.xml` з альтернативними мовами, `robots.txt`
- JobPosting (Google for Jobs), EmploymentAgency, FAQPage, BreadcrumbList
- 301-редиректи зі старих адрес WordPress (`_redirects`), щоб не втратити позиції
- неактивна вакансія: сторінка лишається з `noindex`, зникає зі списку й sitemap

## Деплой на GitHub Pages

Workflow `.github/workflows/pages.yml` збирає й перевіряє сайт при кожному пуші в `main` і публікує `dist/`.
1. Settings → Pages → Source: **GitHub Actions**.
2. Без власного домену сайт відкривається за адресою `https://<owner>.github.io/<repo>/`
   (шлях задають `SITE_BASE` і `SITE_URL` у workflow).
3. З доменом alimatgroup.com: Settings → Pages → Custom domain, у DNS — записи для GitHub Pages,
   потім видаліть `SITE_BASE` і `SITE_URL` з workflow.

На GitHub Pages старі адреси WordPress перенаправляються HTML-заглушками (meta refresh), бо `_redirects` там не працює.
Адмінці на GitHub Pages потрібен `backend: github` + OAuth-проксі; простіше тримати адмінку через Netlify.
