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

Decap CMS 3.6.2 (точна версія + SRI): вакансії (7 мов), блог (нові записи — польською, Markdown),
відгуки Google, контакти й налаштування, ідентифікатори аналітики.
«Опублікувати» = коміт у GitHub → Netlify перезбирає сайт (~1 хв). Якщо `tools/check.js` знаходить помилку,
збірка зупиняється і в мережі лишається попередня версія.

Вхід — через GitHub (backend `github`), бо Git Gateway Netlify більше не рекомендує для нових сайтів:
1. Підключити репозиторій у Netlify (налаштування збірки — у `netlify.toml`).
2. Netlify → Site configuration → Access & security → OAuth → Install provider → **GitHub**
   (Client ID і Secret з GitHub → Settings → Developer settings → OAuth Apps,
   callback URL: `https://api.netlify.com/auth/done`).
3. Кожному редактору — акаунт GitHub із правом запису в репозиторій (Collaborators).
4. Вхід: `https://alimatgroup.com/admin/` → «Login with GitHub».

Інструкція для редакторів польською: `docs/panel-instrukcja.md`.

## Аналітика (Google, Meta)

Адмінка → Ustawienia → «Analityka i marketing». Поки всі поля порожні, на сайті немає жодних сторонніх
скриптів і банера cookies. Рекомендовано: лише **GTM-ID**, а GA4, Google Ads, Meta Pixel, LinkedIn — тегами в GTM.
- Банер згоди (7 мов) + Google Consent Mode v2: до згоди все «denied»; Meta Pixel вантажиться лише після згоди на маркетинг.
- Події в `dataLayer`: `generate_lead` (form_type, job, channel), `contact` (method: whatsapp/phone/telegram/viber/email),
  `apply_popup_open`, `consent_update`. Без GTM вони йдуть напряму в GA4/Ads (gtag) і Meta (`Lead`, `Contact`).
- Content-Security-Policy (meta-тег на сторінках) розширюється лише для доменів увімкнених сервісів.

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
