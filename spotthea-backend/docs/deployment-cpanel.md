# Deployment Guide (Laravel API on cPanel)

Dokumen ini untuk setup production `spotthea-backend` pada hosting cPanel (Apache + PHP-FPM/mod_php).

## 1. Environment

Set minimal variabel berikut di `.env` production:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.your-domain.com
MEDIA_URL=https://api.your-domain.com/storage
FRONTEND_URLS=https://your-domain.com
FILESYSTEM_DISK=public
```

Catatan:
- `MEDIA_URL` opsional, tapi direkomendasikan untuk memastikan URL image konsisten di reverse proxy/CDN.
- Jika memakai subfolder/domain berbeda untuk storage, arahkan `MEDIA_URL` ke base URL storage publik.

## 2. Laravel bootstrap

Jalankan di server setelah deploy:

```bash
php artisan key:generate --force
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan storage:link
```

Jika `storage:link` gagal karena permission/symlink policy cPanel, buat symlink manual dari:
- `public/storage` -> `storage/app/public`

## 3. File permission

Pastikan writable:
- `storage/`
- `bootstrap/cache/`

Rekomendasi umum:
- folder `755`
- file `644`

## 4. Public upload hardening

Folder `storage/app/public` sudah dilengkapi `.htaccess` untuk:
- menonaktifkan directory listing (`Options -Indexes`)
- menolak eksekusi file script (`php`, `phtml`, `phar`, dll)

Pastikan Apache membaca `.htaccess` (`AllowOverride All` pada virtual host/public_html target).

## 5. Apache document root

Untuk Laravel, document root harus mengarah ke folder `public/` project backend.

Jika cPanel memaksa `public_html`, copy isi `public/` Laravel ke `public_html` dan sesuaikan path di `index.php` (opsi fallback, bukan opsi utama).

## 6. Post-deploy smoke test

Verifikasi endpoint:
- `GET /api/home`
- `GET /api/site-settings`
- `GET /api/admin/dashboard` (pakai token admin)
- Upload image dari panel admin lalu cek URL hasil upload dapat diakses publik.

Jika URL upload salah host/scheme:
- cek `APP_URL`
- cek `MEDIA_URL`
- clear cache config: `php artisan config:clear && php artisan config:cache`

## 7. Performance checklist (Production)

Untuk menjaga TTFB dan stabilitas saat trafik naik:

1. Aktifkan cache Laravel:

```bash
php artisan optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

2. Pastikan PHP OPcache aktif di cPanel (direkomendasikan):
- `opcache.enable=1`
- `opcache.memory_consumption` disesuaikan (umumnya 128MB+)
- `opcache.validate_timestamps=1` (set `0` jika deployment immutable + restart PHP-FPM terkontrol)

3. Aktifkan compression HTTP di web server (gzip/brotli) untuk JSON/CSS/JS.

4. Gunakan `CACHE_STORE` yang cepat (Redis direkomendasikan untuk produksi skala menengah/tinggi).
