# SpotThea Live Production Deployment Guide

Panduan ini fokus untuk deploy **SpotThea (Next.js + Laravel API)** ke environment **live production** dengan struktur yang rapi, aman, dan mudah diikuti oleh pemula.

---

## Daftar Isi

1. [Tujuan & Prinsip Utama](#tujuan--prinsip-utama)
2. [Gambaran Arsitektur per Skenario](#gambaran-arsitektur-per-skenario)
3. [Standar Wajib Sebelum Go-Live](#standar-wajib-sebelum-go-live)
4. [Skenario 1 — GitHub + Vercel (FE) + Hosting (BE) + Cloudflare + R2](#skenario-1--github--vercel-fe--hosting-be--cloudflare--r2)
5. [Skenario 2 — GitHub + Vercel (FE) + Render (BE) + Cloudflare + R2](#skenario-2--github--vercel-fe--render-be--cloudflare--r2)
6. [Skenario 3 — GitHub + Fullstack VPS (FE+BE+DB) + Caddy + Cloudflare](#skenario-3--github--fullstack-vps-febedb--caddy--cloudflare)
7. [Checklist Go-Live Final](#checklist-go-live-final)
8. [Runbook Operasional (Backup, Monitoring, Rollback)](#runbook-operasional-backup-monitoring-rollback)

---

## Tujuan & Prinsip Utama

- **Mudah dipahami pemula**: urutan langkah jelas dari nol sampai live.
- **Aman untuk produksi**: debug off, HTTPS aktif, secret tidak bocor.
- **Terukur**: ada smoke test, monitoring, backup, dan rollback plan.
- **Terpisah jelas per skenario**: tidak campur aduk antar metode deploy.

---

## Gambaran Arsitektur per Skenario

### Skenario 1 (Hosting Backend)
- Frontend: Vercel
- Backend Laravel: Shared Hosting/cPanel
- CDN/DNS/WAF: Cloudflare
- Object Storage: Cloudflare R2 (S3-compatible)

### Skenario 2 (Render Backend)
- Frontend: Vercel
- Backend Laravel: Render Web Service
- CDN/DNS/WAF: Cloudflare
- Object Storage: Cloudflare R2

### Skenario 3 (Fullstack VPS)
- Frontend Next.js + Backend Laravel + DB di 1 VPS
- Reverse Proxy + TLS: Caddy
- DNS/CDN/WAF: Cloudflare
- Ops penuh oleh tim (lebih fleksibel, lebih banyak tanggung jawab)

---

## Standar Wajib Sebelum Go-Live

## 1) Domain & subdomain

Rekomendasi:
- `yourdomain.com` → frontend
- `api.yourdomain.com` → backend API
- `media.yourdomain.com` (opsional) → custom domain untuk R2 public asset

## 2) Environment variable inti

### Backend (`spotthea-backend/.env`)

Minimal:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com
MEDIA_URL=https://api.yourdomain.com/storage
FRONTEND_URLS=https://yourdomain.com,https://www.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=...
DB_PORT=3306
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...

FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=auto
AWS_BUCKET=...
AWS_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
AWS_URL=https://media.yourdomain.com
AWS_USE_PATH_STYLE_ENDPOINT=true

CACHE_STORE=database
QUEUE_CONNECTION=database
SESSION_DRIVER=database
```

Catatan:
- `FRONTEND_URLS` dipisah koma untuk CORS.
- Jika belum pakai custom domain R2, `AWS_URL` bisa kosong (URL asset mengikuti endpoint/bucket URL).
- Jika tidak pakai R2 dulu, set `FILESYSTEM_DISK=public`.

### Frontend (`spotthea/.env.local` di Vercel Environment Variables)

```env
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
```

## 3) Hardening minimum

- `APP_DEBUG=false`
- HTTPS aktif end-to-end
- Laravel cache optimize:
  - `php artisan optimize`
  - `php artisan config:cache`
  - `php artisan route:cache`
  - `php artisan view:cache`
- Permissions benar:
  - writable: `storage/`, `bootstrap/cache/`
- Jangan commit `.env` ke GitHub

## 4) Smoke test minimum

- `GET /api/home` → 200
- `GET /api/site-settings` → 200
- Login user/admin berhasil
- Upload media dari admin berhasil
- URL media dapat diakses publik

---

## Skenario 1 — GitHub + Vercel (FE) + Hosting (BE) + Cloudflare + R2

> Cocok untuk budget lebih hemat, tetapi ada keterbatasan dibanding VPS/Render.

## A. Alur arsitektur

1. Developer push ke GitHub
2. Vercel auto-deploy frontend
3. Backend deploy ke hosting (manual/git deploy sesuai provider)
4. Cloudflare jadi DNS + proxy + proteksi
5. File gambar/media disimpan di Cloudflare R2

## B. Langkah implementasi

## 1) Persiapan backend di hosting

Di server hosting (folder backend):

```bash
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate --force
php artisan migrate --force
php artisan storage:link
php artisan optimize
```

Pastikan document root mengarah ke folder `public/` Laravel.

## 2) Konfigurasi `.env` backend produksi

Set variabel inti seperti bagian standar wajib, terutama:
- `APP_URL`, `MEDIA_URL`
- `FRONTEND_URLS` (domain Vercel/custom domain frontend)
- `FILESYSTEM_DISK=s3`
- kredensial R2

## 3) Setup Cloudflare R2

1. Buat bucket R2 (misal `spotthea-media-prod`)
2. Buat API Token R2 (Access Key + Secret)
3. Aktifkan custom domain (opsional, disarankan): `media.yourdomain.com`
4. Masukkan ke env Laravel (`AWS_*`)

## 4) Setup frontend di Vercel

1. Import repo GitHub ke Vercel
2. Root directory: `spotthea`
3. Framework preset: Next.js
4. Isi env:
   - `NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api`
5. Deploy

## 5) Setup DNS & proxy di Cloudflare

Rekomendasi record:
- `A`/`CNAME` untuk frontend (sesuai target Vercel) → proxied (orange cloud)
- `A`/`CNAME` untuk `api` ke hosting backend → proxied
- `CNAME` `media` ke custom domain R2 (jika digunakan) → DNS only/proxied sesuai kebutuhan akses asset

## 6) Konfigurasi SSL/TLS Cloudflare

- SSL/TLS mode: **Full (strict)**
- Always Use HTTPS: ON
- Automatic HTTPS Rewrites: ON

## 7) CORS dan cookie/sesi

- `FRONTEND_URLS` harus memuat domain frontend final.
- Jika multi-domain (`www` dan non-`www`), cantumkan semua.

## 8) Job worker (jika fitur queue dipakai)

Karena default `QUEUE_CONNECTION=database`, jalankan worker via cron/supervisor sesuai fitur hosting.
Jika hosting tidak mendukung daemon worker stabil, pertimbangkan pindah ke Render/VPS.

## C. Kelebihan & risiko

Kelebihan:
- Biaya awal rendah
- Setup frontend sangat cepat via Vercel

Risiko:
- Resource backend hosting terbatas
- Queue/background job sering jadi bottleneck

---

## Skenario 2 — GitHub + Vercel (FE) + Render (BE) + Cloudflare + R2

> Cocok untuk deployment modern dengan kemudahan operasional backend tanpa kelola server penuh.

## A. Alur arsitektur

1. Push ke GitHub
2. Vercel build/deploy frontend
3. Render build/deploy Laravel API
4. Cloudflare mengelola DNS + proteksi
5. R2 untuk media

## B. Langkah implementasi

## 1) Buat service backend di Render

Pilih **Web Service** dari repo yang sama, dengan root directory: `spotthea-backend`.

Contoh command:
- Build Command: `composer install --no-dev --optimize-autoloader`
- Start Command: `php artisan migrate --force && php artisan optimize && php artisan serve --host=0.0.0.0 --port=$PORT`

> Untuk produksi serius, disarankan pakai setup proses yang lebih proper (Nginx + PHP-FPM via Docker) agar kontrol performa lebih baik.

## 2) Tambahkan environment variable di Render

Isi semua env backend production:
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://api.yourdomain.com`
- `MEDIA_URL=...`
- `FRONTEND_URLS=https://yourdomain.com,...`
- DB credential Render PostgreSQL/MySQL
- R2 credential (`AWS_*`)

## 3) Database di Render

Pilih salah satu:
- Managed PostgreSQL
- Managed MySQL (jika tersedia)

Pastikan `DB_CONNECTION` sesuai driver Laravel.

## 4) Queue worker terpisah (direkomendasikan)

Buat service kedua di Render (Background Worker):
- Command: `php artisan queue:work --tries=3 --timeout=120`
- Pakai env yang sama dengan service API

## 5) Frontend di Vercel

Sama seperti skenario 1:
- Root directory `spotthea`
- `NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api`

## 6) Cloudflare DNS

- `CNAME` `api` → endpoint Render backend
- `CNAME` apex/www sesuai setup Vercel
- Atur SSL mode ke **Full (strict)**

## 7) Verifikasi pasca deploy

- Cek endpoint publik API
- Cek login dan endpoint auth
- Cek upload media ke R2
- Cek worker queue berjalan (job tidak stuck)

## C. Kelebihan & risiko

Kelebihan:
- Tidak perlu maintain OS server
- Scaling backend lebih mudah daripada shared hosting

Risiko:
- Biaya bisa naik saat trafik meningkat
- Tetap perlu disiplin monitoring quota/resource

---

## Skenario 3 — GitHub + Fullstack VPS (FE+BE+DB) + Caddy + Cloudflare

> Cocok untuk tim yang butuh kontrol penuh performa, tuning, dan biaya jangka panjang.

## A. Topologi yang disarankan

- 1 VPS Ubuntu 22.04+
- Caddy sebagai reverse proxy + auto HTTPS origin
- App:
  - Next.js (`spotthea`) via `npm run start`
  - Laravel API (`spotthea-backend`) via PHP-FPM
- DB lokal VPS (MySQL/PostgreSQL) atau managed DB eksternal
- Cloudflare untuk DNS/WAF/CDN

## B. Langkah implementasi

## 1) Install paket server

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl unzip caddy php8.2-fpm php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-mysql composer
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 2) Clone project & setup backend

```bash
cd /var/www
git clone https://github.com/HikiNarou/SpotThea-Laravel.git
cd SpotThea-Laravel/spotthea-backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate --force
php artisan migrate --force
php artisan storage:link
php artisan optimize
```

## 3) Setup frontend

```bash
cd /var/www/SpotThea-Laravel/spotthea
npm ci
echo "NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api" > .env.local
npm run build
pm2 start npm --name spotthea-frontend -- start
pm2 save
pm2 startup
```

## 4) Konfigurasi Caddy

Contoh `/etc/caddy/Caddyfile`:

```caddy
yourdomain.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000
}

api.yourdomain.com {
    root * /var/www/SpotThea-Laravel/spotthea-backend/public
    php_fastcgi unix//run/php/php8.2-fpm.sock
    file_server
    encode zstd gzip
}
```

Reload:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## 5) Cloudflare integrasi

- DNS `A` record `@` dan `api` ke IP VPS
- Proxy ON (orange cloud)
- SSL/TLS mode: Full (strict)
- Aktifkan WAF managed rules dasar

## 6) Queue & scheduler Laravel

### Queue worker (systemd)

Buat service worker agar selalu hidup.

### Scheduler (cron)

Tambahkan:

```bash
* * * * * cd /var/www/SpotThea-Laravel/spotthea-backend && php artisan schedule:run >> /dev/null 2>&1
```

## C. Kelebihan & risiko

Kelebihan:
- Kontrol penuh performa dan konfigurasi
- Potensi biaya lebih efisien di trafik tinggi

Risiko:
- Perlu skill DevOps lebih tinggi
- Tanggung jawab patching & security di pihak tim

---

## Checklist Go-Live Final

- [ ] Domain + DNS sudah benar
- [ ] HTTPS aktif dan valid
- [ ] `APP_DEBUG=false`
- [ ] Secret tersimpan di platform env, bukan di repo
- [ ] Migrasi DB sukses
- [ ] Frontend memanggil API production (`NEXT_PUBLIC_API_BASE_URL`)
- [ ] CORS benar (`FRONTEND_URLS`)
- [ ] Upload media sukses (R2/public disk)
- [ ] Queue worker aktif (jika digunakan)
- [ ] Monitoring + alert aktif
- [ ] Backup DB terjadwal
- [ ] Rollback plan sudah diuji

---

## Runbook Operasional (Backup, Monitoring, Rollback)

## 1) Backup

- DB: backup harian + retention minimal 7–30 hari
- Media (R2): lifecycle + versioning (jika tersedia)
- Simpan backup lintas region/provider bila memungkinkan

## 2) Monitoring

Minimal monitor:
- Uptime endpoint: `/api/home`
- Error rate (5xx)
- Latency API
- Kapasitas disk/memory/CPU (untuk VPS)

## 3) Rollback cepat

- Simpan versi rilis (tag) di GitHub
- Jika deploy gagal:
  1. rollback frontend ke deployment Vercel sebelumnya
  2. rollback backend ke release terakhir stabil
  3. jalankan smoke test ulang

## 4) Prosedur perubahan aman

- Semua perubahan lewat PR review
- Deploy bertahap (staging → production)
- Lakukan deploy di jam trafik rendah

---

## Penutup

Jika Anda pemula:
- Mulai dari **Skenario 2 (Vercel + Render + Cloudflare + R2)** karena paling seimbang antara kemudahan dan kestabilan.
- Jika budget sangat ketat, gunakan **Skenario 1**.
- Jika butuh kontrol tinggi dan siap kelola infrastruktur, pilih **Skenario 3**.

