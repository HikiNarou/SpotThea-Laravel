# SpotThea

> Theme web modern untuk Manga Reader — dibangun dengan **Next.js 16** (frontend) dan **Laravel 12** (backend API).

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Laravel](https://img.shields.io/badge/Laravel-12-red?logo=laravel)
![PHP](https://img.shields.io/badge/PHP-%3E%3D8.2-777BB4?logo=php)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Struktur Repository](#struktur-repository)
- [Tech Stack](#tech-stack)
- [Prasyarat](#prasyarat)
- [Quick Start (Lokal)](#quick-start-lokal)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Akun Demo](#akun-demo)
- [Deployment](#deployment)
  - [Shared Hosting (cPanel)](#1-shared-hosting-cpanel)
  - [VPS / Dedicated Server](#2-vps--dedicated-server)
  - [Docker](#3-docker)
  - [Vercel + VPS (Hybrid)](#4-vercel--vps-hybrid)
- [Alternatif & Referensi Teknologi](#alternatif--referensi-teknologi)
- [Dokumentasi API](#dokumentasi-api)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

---

## Tentang Proyek

SpotThea adalah tema web untuk website manga reader yang mengedepankan pengalaman baca nyaman, cepat, dan responsif di mobile maupun desktop. Proyek ini terdiri dari dua bagian utama: frontend berbasis Next.js dan backend API berbasis Laravel.

Fitur utama:

- 📖 Reader dengan mode paginated, vertical scroll, dan webtoon
- 🔍 Pencarian manga dengan autocomplete
- 📚 Sistem library (follow, bookmark, custom list)
- 🕑 Riwayat baca dengan resume otomatis
- 🛡️ Panel admin untuk CRUD manga, chapter, dan manajemen user
- 🌙 Dark mode dan tema reader khusus (light/dim/dark)
- 📱 Responsif (mobile-first)
- 🔐 Autentikasi via Laravel Sanctum

---

## Struktur Repository

```
SpotThea-Laravel/
├── spotthea/                # Frontend — Next.js (App Router)
│   ├── src/
│   │   ├── app/             # Routes & pages
│   │   ├── components/      # Komponen UI
│   │   ├── features/        # Logika per fitur
│   │   ├── lib/             # API client, utils, constants
│   │   ├── stores/          # Zustand stores
│   │   ├── providers/       # React context providers
│   │   └── types/           # TypeScript types
│   ├── public/              # Aset statis
│   ├── package.json
│   └── next.config.ts
│
├── spotthea-backend/        # Backend — Laravel 12
│   ├── app/                 # Application logic (Models, Controllers, dll.)
│   ├── routes/              # Definisi route (api.php, web.php)
│   ├── database/            # Migrations & seeders
│   ├── docs/                # Dokumentasi API & deployment
│   │   ├── api-contract.md
│   │   └── deployment-cpanel.md
│   ├── config/              # Konfigurasi Laravel
│   ├── .env.example
│   └── composer.json
│
├── manga-reader-frontend-blueprint.md   # Blueprint fitur frontend
└── README.md                # ← Kamu di sini
```

---

## Tech Stack

### Frontend (`spotthea/`)

| Teknologi | Versi | Kegunaan |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16 | Framework React dengan SSR/SSG |
| [React](https://react.dev/) | 19 | Library UI |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility-first CSS |
| [TanStack Query](https://tanstack.com/query) | 5 | Server-state management & caching |
| [Zustand](https://zustand.docs.pmnd.rs/) | 5 | Client-state management |
| [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | 7 / 4 | Form handling & validasi |
| [Framer Motion](https://www.framer.com/motion/) | 12 | Animasi |
| [Lucide React](https://lucide.dev/) | — | Ikon |

### Backend (`spotthea-backend/`)

| Teknologi | Versi | Kegunaan |
|---|---|---|
| [Laravel](https://laravel.com/) | 12 | Framework PHP |
| PHP | ≥ 8.2 | Runtime |
| [Laravel Sanctum](https://laravel.com/docs/sanctum) | 4 | Autentikasi API (token-based) |
| SQLite (default) / MySQL / PostgreSQL | — | Database |
| [Laravel Pint](https://laravel.com/docs/pint) | — | Code style fixer |
| [PHPUnit](https://phpunit.de/) | 11 | Testing |

---

## Prasyarat

Pastikan tools berikut sudah terinstal:

- **PHP** ≥ 8.2 dengan ekstensi: `mbstring`, `xml`, `curl`, `sqlite3` (atau driver DB lain)
- **Composer** ≥ 2.x — [getcomposer.org](https://getcomposer.org/)
- **Node.js** ≥ 18.x (disarankan LTS terbaru) — [nodejs.org](https://nodejs.org/)
- **npm** ≥ 9.x (bawaan Node.js)
- **Git** — [git-scm.com](https://git-scm.com/)

> **Tips:** Untuk mengelola versi PHP/Node.js, gunakan [Herd](https://herd.laravel.com/) (PHP) atau [nvm](https://github.com/nvm-sh/nvm) / [fnm](https://github.com/Schniz/fnm) (Node.js).

---

## Quick Start (Lokal)

### 1. Clone repository

```bash
git clone https://github.com/HikiNarou/SpotThea-Laravel.git
cd SpotThea-Laravel
```

### 2. Setup backend

```bash
cd spotthea-backend

# Install dependensi PHP
composer install

# Salin file environment
cp .env.example .env

# Generate application key
php artisan key:generate

# Jalankan migrasi database + seeder (data contoh)
php artisan migrate:fresh --seed

# Buat symlink storage untuk akses file publik
php artisan storage:link

# Jalankan server backend (default: http://localhost:8000)
php artisan serve
```

### 3. Setup frontend

Buka terminal baru:

```bash
cd spotthea

# Install dependensi Node.js
npm install

# Buat file environment lokal
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api" > .env.local

# Jalankan dev server (default: http://localhost:3000)
npm run dev
```

### 4. Buka di browser

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000/api](http://localhost:8000/api)

> **Shortcut:** Backend juga mendukung `composer dev` yang menjalankan server, queue worker, log viewer, dan Vite secara bersamaan (memerlukan `concurrently`).

---

## Konfigurasi Environment

### Backend (`spotthea-backend/.env`)

| Variabel | Deskripsi | Contoh |
|---|---|---|
| `APP_ENV` | Environment aplikasi | `local` / `production` |
| `APP_DEBUG` | Mode debug (matikan di produksi!) | `true` / `false` |
| `APP_URL` | URL base backend | `https://api.domain.com` |
| `MEDIA_URL` | URL base untuk file media/storage | `https://api.domain.com/storage` |
| `FRONTEND_URLS` | URL frontend yang diizinkan CORS (pisah koma) | `https://domain.com` |
| `DB_CONNECTION` | Driver database | `sqlite` / `mysql` / `pgsql` |
| `DB_HOST` | Host database (jika bukan SQLite) | `127.0.0.1` |
| `DB_DATABASE` | Nama database | `spotthea` |
| `DB_USERNAME` | Username database | `root` |
| `DB_PASSWORD` | Password database | — |
| `FILESYSTEM_DISK` | Disk penyimpanan file | `local` / `public` / `s3` |

### Frontend (`spotthea/.env.local`)

| Variabel | Deskripsi | Contoh |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | URL base API backend | `http://localhost:8000/api` |

---

## Akun Demo

Setelah menjalankan `php artisan migrate:fresh --seed`, akun berikut tersedia:

| Role | Email | Password |
|---|---|---|
| User | `user@spotthea.app` | `User12345!` |
| Moderator | `moderator@spotthea.app` | `Mod12345!` |
| Admin | `admin@spotthea.app` | `Admin12345!` |

---

## Deployment

### 1. Shared Hosting (cPanel)

Cocok untuk budget terbatas. Lihat panduan lengkap di [`spotthea-backend/docs/deployment-cpanel.md`](spotthea-backend/docs/deployment-cpanel.md).

**Ringkasan langkah:**

```bash
# Di server, setelah upload file backend
php artisan key:generate --force
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link
```

- Arahkan document root ke folder `public/` project backend.
- Untuk frontend, build secara lokal (`npm run build`) lalu upload folder output atau gunakan layanan terpisah (Vercel/Netlify).

> **Catatan:** cPanel umumnya tidak mendukung Node.js runtime. Frontend Next.js perlu di-deploy terpisah atau di-export sebagai static site (set `output: 'export'` di `next.config.ts`) jika tidak butuh SSR.

### 2. VPS / Dedicated Server

Opsi paling fleksibel. Contoh setup dengan **Ubuntu 22.04+**, **Nginx**, **PHP-FPM**, dan **PM2** (atau **Supervisor**):

#### a. Install dependensi server

```bash
# Update & install packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx php8.2-fpm php8.2-mbstring php8.2-xml \
  php8.2-curl php8.2-sqlite3 php8.2-mysql php8.2-zip \
  composer unzip git curl

# Install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 untuk menjalankan Next.js
sudo npm install -g pm2
```

#### b. Deploy backend (Laravel)

```bash
cd /var/www
git clone https://github.com/HikiNarou/SpotThea-Laravel.git
cd SpotThea-Laravel/spotthea-backend

composer install --no-dev --optimize-autoloader
cp .env.example .env
# Edit .env sesuai konfigurasi produksi
php artisan key:generate --force
php artisan migrate --force
php artisan storage:link
php artisan optimize
```

Contoh konfigurasi Nginx untuk backend:

```nginx
server {
    listen 80;
    server_name api.domain.com;
    root /var/www/SpotThea-Laravel/spotthea-backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

#### c. Deploy frontend (Next.js)

```bash
cd /var/www/SpotThea-Laravel/spotthea

npm ci
echo "NEXT_PUBLIC_API_BASE_URL=https://api.domain.com/api" > .env.local
npm run build

# Jalankan dengan PM2
pm2 start npm --name "spotthea-frontend" -- start
pm2 save
pm2 startup
```

Contoh konfigurasi Nginx untuk frontend (reverse proxy ke Next.js):

```nginx
server {
    listen 80;
    server_name domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### d. SSL (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domain.com -d api.domain.com
```

### 3. Docker

Jika menggunakan Docker, buat `docker-compose.yml` di root project:

```yaml
services:
  backend:
    build:
      context: ./spotthea-backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - APP_ENV=production
      - APP_DEBUG=false
      - DB_CONNECTION=mysql
      - DB_HOST=db
      - DB_DATABASE=spotthea
      - DB_USERNAME=spotthea
      - DB_PASSWORD=secret
    depends_on:
      - db

  frontend:
    build:
      context: ./spotthea
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://backend:8000/api

  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: spotthea
      MYSQL_USER: spotthea
      MYSQL_PASSWORD: secret
      MYSQL_ROOT_PASSWORD: rootsecret
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

> **Catatan:** Dockerfile untuk masing-masing service perlu dibuat sesuai kebutuhan. Referensi:
> - Laravel: [Dockerfile Laravel](https://laravel.com/docs/deployment#docker)
> - Next.js: [Dockerfile Next.js](https://nextjs.org/docs/app/building-your-application/deploying#docker-image)

### 4. Vercel + VPS (Hybrid)

Kombinasi paling praktis — deploy frontend ke **Vercel** (gratis untuk proyek personal) dan backend ke VPS:

1. **Frontend → Vercel**
   - Push folder `spotthea/` ke repository terpisah atau atur root directory di Vercel ke `spotthea/`.
   - Set environment variable `NEXT_PUBLIC_API_BASE_URL` di dashboard Vercel.

2. **Backend → VPS**
   - Ikuti langkah [VPS / Dedicated Server](#2-vps--dedicated-server) untuk backend saja.
   - Pastikan CORS di `.env` mengizinkan domain Vercel: `FRONTEND_URLS=https://your-app.vercel.app`.

> **Alternatif Vercel:** [Netlify](https://www.netlify.com/), [Cloudflare Pages](https://pages.cloudflare.com/), atau [Railway](https://railway.app/) (mendukung Next.js SSR).

---

## Alternatif & Referensi Teknologi

Berikut beberapa alternatif jika ingin menyesuaikan tech stack:

| Kategori | Dipakai Saat Ini | Alternatif |
|---|---|---|
| Frontend Framework | Next.js | [Nuxt.js](https://nuxt.com/) (Vue), [SvelteKit](https://kit.svelte.dev/), [Remix](https://remix.run/) |
| Backend Framework | Laravel | [AdonisJS](https://adonisjs.com/) (Node.js), [NestJS](https://nestjs.com/), [FastAPI](https://fastapi.tiangolo.com/) (Python) |
| Database | SQLite / MySQL | [PostgreSQL](https://www.postgresql.org/), [MariaDB](https://mariadb.org/), [PlanetScale](https://planetscale.com/) |
| Object Storage | Local disk | [Cloudflare R2](https://www.cloudflare.com/r2/), [AWS S3](https://aws.amazon.com/s3/), [MinIO](https://min.io/) |
| Cache | Database | [Redis](https://redis.io/), [Memcached](https://memcached.org/) |
| Search Engine | Database query | [Meilisearch](https://www.meilisearch.com/), [Typesense](https://typesense.org/), [Algolia](https://www.algolia.com/) |
| Process Manager | — | [PM2](https://pm2.io/), [Supervisor](http://supervisord.org/) |
| Reverse Proxy | — | [Nginx](https://nginx.org/), [Caddy](https://caddyserver.com/) (auto HTTPS), [Traefik](https://traefik.io/) |
| CI/CD | — | [GitHub Actions](https://github.com/features/actions), [GitLab CI](https://docs.gitlab.com/ci/), [Coolify](https://coolify.io/) (self-hosted PaaS) |
| Monitoring | — | [Sentry](https://sentry.io/), [Laravel Telescope](https://laravel.com/docs/telescope), [Uptime Kuma](https://github.com/louislam/uptime-kuma) |
| Hosting Frontend | Self-hosted | [Vercel](https://vercel.com/), [Netlify](https://www.netlify.com/), [Cloudflare Pages](https://pages.cloudflare.com/) |
| Hosting Backend | Self-hosted | [Railway](https://railway.app/), [Fly.io](https://fly.io/), [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform) |

---

## Dokumentasi API

Dokumentasi kontrak API tersedia di:

- 📄 [`spotthea-backend/docs/api-contract.md`](spotthea-backend/docs/api-contract.md) — Daftar endpoint, format request/response
- 📄 [`spotthea-backend/docs/deployment-cpanel.md`](spotthea-backend/docs/deployment-cpanel.md) — Panduan deploy ke cPanel
- 📄 [`manga-reader-frontend-blueprint.md`](manga-reader-frontend-blueprint.md) — Blueprint lengkap frontend (UI/UX, routing, komponen)

---

## Kontribusi

Kontribusi sangat diterima! Silakan:

1. Fork repository ini
2. Buat branch fitur (`git checkout -b fitur/fitur-baru`)
3. Commit perubahan (`git commit -m "Tambah fitur baru"`)
4. Push ke branch (`git push origin fitur/fitur-baru`)
5. Buka Pull Request

Pastikan kode mengikuti style yang ada:
- **Backend:** Jalankan `./vendor/bin/pint` (Laravel Pint) sebelum commit.
- **Frontend:** Jalankan `npm run lint` sebelum commit.

---

## Lisensi

Proyek ini dilisensikan di bawah [MIT License](https://opensource.org/licenses/MIT).
