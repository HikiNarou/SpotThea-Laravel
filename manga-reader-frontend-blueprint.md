# Blueprint Frontend Website Manga Reader (Production-Ready)

> Dokumen ini berfokus **100% pada sisi Frontend** (UI/UX, routing, state, komponen, dan perilaku).  
> Setiap bagian yang butuh dukungan backend akan diberi **Catatan untuk Backend** supaya integrasi mudah.

Dokumen ini melengkapi draft awal fitur/halaman yang sudah kamu buat (homepage, daftar manga, detail manga, reader, search, login/register, dashboard user, admin).  

---

## Tujuan Produk

Website manga reader dengan pengalaman baca yang:
- Cepat, stabil, dan nyaman di mobile maupun desktop.
- Navigasi jelas (browse -> detail -> pilih chapter -> baca).
- Mudah kembali melanjutkan baca (continue reading, history).
- SEO-friendly untuk halaman publik (manga detail, chapter list, genre).
- Siap produksi: error state rapi, loading state rapi, analytics, aksesibilitas dasar, dan performa kuat.

---

## Peran Pengguna dan Hak Akses (Frontend)

1) **Guest (tanpa login)**
- Bisa browsing, search, lihat detail manga, baca chapter (opsional, tergantung kebijakan).
- Bisa mengatur preferensi reader **lokal** (mode baca, theme) via localStorage/cookie.

2) **User (login)**
- Semua kemampuan guest + bookmark/follow, rating, komentar (opsional), history tersimpan akun, notifikasi update.

3) **Moderator (opsional)**
- Akses panel moderasi komentar/laporan.

4) **Admin**
- Akses panel admin: CRUD manga, chapter, halaman, user, tag/genre, audit log, analytics.

> Catatan: Hak akses di frontend tetap harus divalidasi backend. Frontend hanya menyembunyikan UI yang tidak relevan.

---

## Standar UI/UX (Acuan Produksi)

### Layout dan Navigasi Global
- **Header sticky**: logo, menu (Home/Browse/Genres/Latest), search bar, tombol login/user menu.
- **Footer**: link About, DMCA/Disclaimer, Privacy, Terms, Contact, API status (opsional).
- **Breadcrumb** di halaman dalam: Home / Manga / [Title] / Chapter [x].

### Responsif (Mobile-first)
- Mobile: bottom sheet untuk filter, drawer menu, reader fokus 1 kolom.
- Desktop: filter sidebar di browse, grid lebih padat.

### Dark Mode + Theme
- Toggle theme: Light/Dark/System.
- Reader punya tema khusus (mis. sepia/dim) terpisah dari theme global.

### Aksesibilitas Minimal (Wajib)
- Semua fungsi bisa dioperasikan lewat keyboard (tab/enter/esc).  
- Fokus terlihat jelas (focus ring).  
- Modal dialog punya fokus trap, bisa ditutup dengan Esc.  
- Autocomplete search mengikuti pola combobox/ARIA yang benar.

---

## Arsitektur Frontend yang Disarankan

> Kamu bebas memakai stack lain, tapi untuk produksi dan SEO, rekomendasi ini realistis.

### Tech Stack
- **Next.js (App Router) + React + TypeScript**
  - SSR/SSG untuk SEO halaman publik.
- Styling: Tailwind CSS / CSS Modules + Design Tokens.
- Data fetching:
  - **TanStack Query (React Query)** untuk server-state caching, pagination, dan invalidation.
- Form: React Hook Form + Zod (validasi).
- UI util: Headless UI / Radix UI (aksesibilitas komponen).
- State ringan: Zustand (untuk settings reader, auth session snapshot, dsb).

### Prinsip Data
- Bedakan **Server State** (manga list, chapter list, profile) vs **Client State** (theme, mode baca, panel terbuka).
- Caching:
  - List (browse/search): cache + pagination.
  - Detail manga: cache lebih lama (jarang berubah).
  - Reader pages: cache pendek, tapi support prefetch halaman berikutnya.

### Optimasi List Panjang
- Chapter list bisa ratusan: gunakan **virtualization** (mis. react-window) untuk performa scroll.
- Browse list: infinite scroll atau pagination yang jelas.

### Optimasi Gambar
- Halaman cover memakai komponen image yang support responsive + lazy load.
- Reader: progressive loading, placeholder blur, retry on fail, prefetch 1-3 halaman berikutnya.

---

## Peta Halaman dan Routes

> Format berikut menganggap routing ala Next.js, tetapi bisa diadaptasi ke framework lain.

### Public Routes
| Route | Tujuan | Komponen Kunci | Catatan Backend (data) |
|---|---|---|---|
| `/` | Homepage (featured + latest updates) | Featured carousel, Continue Reading, Latest Chapters, Tabs kategori | Endpoint: featured, latest updates, popular, continue reading (user) |
| `/browse` | Daftar manga dengan filter/sort | Filter panel, grid/list, pagination/infinite | Endpoint: manga list + filter genre/status/year/sort |
| `/genre` | Daftar genre | Genre chips/list | Endpoint: genre list |
| `/genre/[slug]` | Browse by genre | sama seperti browse | Endpoint: manga list by genre |
| `/search` | Halaman search (lebih lengkap) | Search input, suggestion, result filters | Endpoint: search + suggestion |
| `/manga/[slug]` | Detail manga | Hero section, tabs (Synopsis/Chapters), actions | Endpoint: manga detail + chapter summary |
| `/manga/[slug]/chapters` | Opsi jika chapter list dipisah | Chapter list page | Endpoint: chapter list paginated |
| `/read/[slug]/[chapterId]` | Reader halaman chapter | Reader canvas, controls, settings | Endpoint: chapter detail + pages |
| `/updates` | Semua update terbaru | Feed update | Endpoint: latest chapter feed |
| `/popular` | Popular | list | Endpoint: ranking/popular |
| `/ongoing` `/completed` | Filter status cepat | list | Endpoint: list by status |
| `/404` | Not found | error view | - |
| `/maintenance` | Mode maintenance | info status | - |

### Auth Routes
| Route | Tujuan | Komponen Kunci | Catatan Backend |
|---|---|---|---|
| `/login` | Login | form, social login opsional | auth login |
| `/register` | Register | form + verify email | auth register |
| `/forgot-password` | Reset password | email form | request reset |
| `/reset-password?token=` | Set password baru | password form | verify token + update |
| `/verify-email?token=` | Verifikasi email | status view | verify token |

### User Routes (Protected)
| Route | Tujuan | Komponen Kunci | Catatan Backend |
|---|---|---|---|
| `/me` | Dashboard user | stats, continue reading, quick links | user profile + reading stats |
| `/me/library` | Bookmark/Follow | tabs: Following, Bookmarks, Lists | follow list, bookmark list |
| `/me/history` | Riwayat baca | list + resume | reading history |
| `/me/notifications` | Notifikasi | list + settings | notifications |
| `/me/settings` | Pengaturan akun + reader | profile form, security, preferences | update profile |
| `/me/reviews` | Rating/review user (opsional) | list | user reviews |

### Admin Routes (Protected + Role)
| Route | Tujuan | Komponen Kunci | Catatan Backend |
|---|---|---|---|
| `/admin` | Dashboard admin | KPI, pending reports | analytics summary |
| `/admin/manga` | CRUD manga | table, create/edit form | manga CRUD |
| `/admin/manga/[id]/chapters` | Kelola chapter | list + upload | chapter CRUD |
| `/admin/chapters/[id]/pages` | Upload/urut halaman | drag-drop reorder, preview | page upload/order |
| `/admin/genres` | Kelola genre | CRUD | genre CRUD |
| `/admin/users` | User management | search/filter, role assign | users CRUD |
| `/admin/reports` | Laporan konten/chapter | queue + moderation | reports |
| `/admin/settings` | Konfigurasi | toggles, maintenance mode | settings |

---

## Spesifikasi Detail per Halaman (Frontend)

### 1) Homepage (`/`)
**Tujuan:** cepat menemukan manga untuk dibaca dan melihat update terbaru.

**Section UI yang disarankan**
- Featured carousel (auto-slide + manual).
- “Continue Reading” (hanya user login).
- Tabs kategori: Popular, Latest, Ongoing, Completed.
- Latest Updates (feed chapter terbaru).
- Browse by Genre (chips horizontal).
- Banner info (maintenance, event, dsb).

**Interaksi**
- Carousel: swipe (mobile), arrow (desktop), indikator.
- Tabs: caching per tab, skeleton saat loading.
- Latest Updates: klik ke reader atau detail manga.

**State yang wajib ada**
- Loading skeleton per section (bukan spinner global).
- Empty state: jika belum ada continue reading.
- Error: retry per section.

**Catatan untuk Backend**
- Endpoint terpisah per section lebih fleksibel: `GET /home` bisa return semua sekaligus (lebih cepat 1 request) atau split.
- Pastikan response ringan (limit item, include cover urls, last chapter).

---

### 2) Browse / Daftar Manga (`/browse`, `/genre/[slug]`, `/popular`, dll.)
**Tujuan:** menjelajah katalog dengan filter/sort yang jelas.

**Filter yang direkomendasikan**
- Genre (multi-select)
- Status (ongoing/completed/hiatus)
- Year range (opsional)
- Type (manga/manhwa/manhua)
- Sort: Popularity, Latest update, A-Z, Rating
- Language (opsional)
- Content rating (safe/mature)

**Komponen**
- Filter drawer (mobile) + sidebar (desktop).
- Result grid/list switch.
- Pagination atau infinite scroll.
- “Quick preview” card (hover/long-press) menampilkan sinopsis singkat.

**UX penting**
- Filter harus tersimpan di URL query supaya shareable:
  - contoh: `/browse?genres=action,romance&status=ongoing&sort=popular&page=2`
- “Reset filter” jelas.
- Debounce saat mengubah filter (hindari request beruntun).

**Catatan untuk Backend**
- Endpoint list harus mendukung filter + pagination cursor atau page-based.
- Kembalikan total count (opsional) untuk info “x results”.
- Gunakan cache headers untuk list populer.

---

### 3) Search (`/search`)
**Tujuan:** menemukan manga cepat, dengan saran realtime.

**Search Bar Global**
- Ada di header setiap halaman.
- Autocomplete dropdown:
  - Suggestion: judul manga, alt title, author (opsional).
  - Item suggestion menampilkan cover mini + status + last update.

**Halaman Search**
- Input besar + filter sama seperti browse.
- Highlight kata kunci di hasil.

**Catatan untuk Backend**
- Sediakan endpoint `GET /search/suggest?q=...` cepat (limit 5-10).
- Sediakan endpoint `GET /search?q=...&filters...` untuk hasil lengkap.

---

### 4) Manga Detail (`/manga/[slug]`)
**Tujuan:** halaman SEO utama, tempat user memutuskan follow/baca.

**Struktur UI**
- Hero: cover, title, alt title, badge (status/type), rating, jumlah chapter, view count (opsional).
- Action buttons:
  - Read First / Read Latest
  - Continue (jika ada progress)
  - Follow/Unfollow
  - Bookmark (opsional) + tambah ke list
- Tabs:
  - **Synopsis**: deskripsi, metadata (author, artist, genres, year, serialization)
  - **Chapters**: list chapter + sort (latest/oldest) + filter (volume/season, jika ada)
- Related manga / recommended.
- Comments (opsional) di bawah.

**Chapter List UX**
- Search chapter (input kecil).
- “Jump to chapter” (dropdown).
- Virtualized list untuk 300+ item.
- Indikator chapter sudah dibaca.

**Catatan untuk Backend**
- `GET /manga/:slug` mengembalikan detail + summary chapter (mis. 10 terbaru) agar first paint cepat.
- Chapter list bisa endpoint terpisah paginated.
- Progress: endpoint untuk read status per chapter.

---

### 5) Reader (`/read/[slug]/[chapterId]`)
**Tujuan:** pengalaman baca paling nyaman, cepat, minim gangguan.

**Mode baca**
- **Paginated** (1 halaman per layar, tombol next/prev)
- **Vertical scroll** (semua halaman turun)
- **Webtoon mode** (scroll + spacing besar) opsional
- Toggle reading direction (LTR/RTL) untuk manga tertentu.

**Kontrol Reader (Sticky / Overlay)**
- Top bar: Back, judul manga, chapter selector, report, settings.
- Bottom bar: Prev/Next, progress bar, page indicator.
- Floating button: scroll to top/bottom (mobile).

**Reader Settings (disimpan di akun atau lokal)**
- Theme: light/dim/dark
- Fit: width/height/original
- Gap antar halaman
- Auto next chapter (on/off)
- Preload pages (off/low/high)
- Reduce motion (on/off)
- Keyboard shortcuts help

**Keyboard Shortcuts (desktop)**
- Arrow left/right: prev/next page
- Space: scroll down (vertical)
- Shift+Space: scroll up
- F: fullscreen
- S: open settings
- Esc: close overlays

**Error Handling**
- Jika 1 gambar gagal load:
  - tampilkan placeholder + tombol retry.
  - opsi “report broken page”.
- Jika chapter tidak ada:
  - tampilkan 404 + tombol kembali.

**Catatan untuk Backend**
- Endpoint chapter harus return:
  - daftar URL gambar (idealnya CDN), ukuran gambar (opsional), jumlah halaman.
  - next/prev chapter id untuk navigasi cepat.
- Support hotlink protection yang kompatibel (tokenized URL) tapi tetap cacheable.

---

### 6) Login/Register
**UI**
- Form sederhana, validasi jelas, show password.
- Social login opsional (Google/GitHub) jika diperlukan.
- “Remember me” (opsional).
- ReCaptcha/anti-bot opsional (jika spam tinggi).

**Catatan untuk Backend**
- Return session cookie httpOnly atau token strategy yang aman.
- Endpoint refresh session.

---

### 7) Dashboard User (`/me`)
**Section**
- Continue reading cards (dengan progress).
- Recent follows (update terbaru dari yang di-follow).
- Reading stats (opsional): waktu baca, chapter read.
- Shortcut: Library, History, Settings.

**Catatan untuk Backend**
- Endpoint gabungan `GET /me/overview` untuk mengurangi banyak request.

---

### 8) Library (Follow/Bookmark) (`/me/library`)
**Fitur**
- Tabs: Following, Bookmarks, Custom Lists.
- Custom list: “Favorites”, “To Read”, “Dropped” (opsional).
- Sorting: last updated, last read, title.

**Catatan untuk Backend**
- Endpoint list milik user + last update info (join dengan manga updates).

---

### 9) History (`/me/history`)
**Fitur**
- Filter: terakhir 7 hari / 30 hari / semua.
- Tombol “Clear history” (konfirmasi modal).
- Resume langsung ke halaman terakhir.

**Catatan untuk Backend**
- Simpan progress: chapterId + pageIndex + updatedAt.

---

### 10) Notifications (`/me/notifications`)
**Fitur**
- Notifikasi update chapter baru untuk manga yang di-follow.
- Preference:
  - Email notifications (opsional)
  - Web push notifications (opsional)
  - Quiet hours (opsional)
- UI harus memprioritaskan UX: izin push diminta hanya setelah user follow beberapa manga.

**Catatan untuk Backend**
- Endpoint subscribe/unsubscribe push + store subscription.

---

### 11) Admin Panel (Frontend)
**Prinsip UI**
- Layout dashboard dengan sidebar.
- Table besar: pagination, search, filter.
- Create/edit form: multi-step (Manga info -> Genres -> Cover -> Metadata).
- Upload chapter:
  - drag-drop images
  - auto sort by filename
  - reorder pages dengan drag
  - preview sebelum publish
  - status draft/published/scheduled

**Catatan untuk Backend**
- Butuh presigned upload URL (S3/R2) untuk upload cepat.
- Endpoint untuk reorder pages, publish, rollback.

---

## Komponen Global (Design System Minimal)

### Komponen Dasar
- Button (primary/secondary/ghost/danger)
- Input, Select, Checkbox, Switch
- Tabs
- Modal / Dialog
- Drawer / Bottom sheet
- Toast / Snackbar
- Badge (status: ongoing/completed)
- Skeleton loader
- Pagination component

### Komponen Domain Manga
- MangaCard (grid)
- MangaRow (list)
- ChapterRow (dengan read indicator)
- RatingStars
- FollowButton / BookmarkButton
- ReaderImage (dengan retry, placeholder)
- ChapterSelector (dropdown)
- GenreChip

---

## States yang Harus Konsisten di Semua Halaman

- **Loading**: skeleton, shimmer, placeholder.
- **Empty**: pesan human-friendly + CTA (mis. “Mulai follow manga”).
- **Error**: tampilkan pesan + tombol retry, jangan blank screen.
- **Offline**: halaman khusus atau banner “koneksi terputus”.
- **Permission**: not authorized (login required) atau forbidden (role).

---

## SEO dan Social Sharing (Frontend)

Halaman yang wajib SEO:
- Manga detail
- Browse by genre
- Search (opsional, biasanya noindex)
- Update feed (opsional)

Yang harus ada:
- Title/description unik per manga/chapter.
- Open Graph tags untuk share.
- Canonical URL.
- Robots + sitemap.

Structured data (JSON-LD) rekomendasi:
- Manga detail: `CreativeWork` / `Book` / `ComicStory` (sesuaikan kebutuhan).
- BreadcrumbList.

---

## Performa dan Reliabilitas (Frontend)

Target performa mengacu pada Web Vitals:
- LCP (Largest Contentful Paint) cepat
- INP (Interaction to Next Paint) responsif
- CLS (Cumulative Layout Shift) stabil

Strategi:
- SSR/SSG untuk halaman publik.
- Image optimization, lazy loading.
- Prefetch route (Next.js link) untuk halaman yang sering dibuka.
- Cache server-state (TanStack Query).
- Virtualize list panjang.
- Stale-while-revalidate untuk data yang sering diakses (popular, browse).

---

## PWA (Opsional tapi Bagus untuk Reader)

- Web App Manifest + install prompt.
- Service worker untuk cache asset + offline fallback.
- Cache halaman reader yang baru dibuka (read again tanpa loading besar).

---

## Observability dan Analytics (Frontend)

- Error tracking: Sentry (opsional).
- Analytics event:
  - view_manga
  - start_reading
  - finish_chapter
  - follow_manga
  - search_query
  - report_broken_page

---

## Testing Checklist (Frontend)

- Unit: komponen UI, utilities.
- Integration: browse filters, auth flow.
- E2E: search -> detail -> reader -> next chapter.
- A11y smoke test: tab navigation, focus visible, modal.

---

## Lampiran: Ringkasan Kebutuhan API (Untuk Backend)

> Ini bukan desain backend final, hanya daftar yang frontend butuhkan.

- Auth: login/register/logout/refresh
- Manga list + filter + pagination
- Manga detail
- Chapter list + progress read status
- Chapter detail + pages + next/prev
- Search suggest + search result
- Follow/bookmark CRUD
- History CRUD
- Notifications feed + push subscription
- Admin: manga/chapter/page upload & reorder
- Reports

---

## Catatan Penutup

Blueprint ini sengaja dibuat modular supaya mudah dikembangkan bertahap:
1) Public browsing + detail + reader
2) Auth + library + history
3) Notifications + admin panel
4) PWA + optimasi performa lanjutan


---

# Tambahan Produksi: Halaman Sistem, Keamanan, i18n, dan Edge Cases

## Halaman Informasi & Legal (Public)
| Route | Tujuan | Catatan |
|---|---|---|
| `/about` | Tentang situs | Profil singkat + cara kerja |
| `/dmca` | DMCA/Disclaimer | Wajib untuk situs konten, sesuai kebijakan platform kamu |
| `/privacy` | Privacy Policy | Jelaskan cookie, analytics, dsb |
| `/terms` | Terms of Service | Aturan penggunaan |
| `/contact` | Kontak | Form contact / email |
| `/report` | Laporkan masalah | Form report umum (bukan per halaman) |

> Catatan untuk Backend: contact/report butuh endpoint submit + anti-spam.

## Halaman Status & Recovery
- `/offline` : halaman fallback ketika service worker mendeteksi offline (PWA).
- `/500` : internal error (opsional) atau gunakan error boundary default.

---

## i18n (Internationalization) dan Locale
Walaupun konten manga biasanya 1 bahasa, UI sebaiknya siap multi bahasa:
- Bahasa UI: `id`, `en` (minimal).
- Format tanggal pakai locale.
- URL tetap stabil (tidak wajib prefix locale), tapi bisa:
  - `/id/manga/[slug]` jika multi bahasa serius.

> Catatan untuk Backend: jika multi bahasa, endpoint harus bisa kirim field title/description per locale.

---

## Keamanan Frontend (Checklist Ringan)
- Hindari menyimpan token sensitif di localStorage bila bisa (lebih aman cookie httpOnly).
- Sanitasi konten user-generated (komentar) sebelum render.
- Rate-limit action sensitif via UI:
  - tombol follow/unfollow disable sementara saat request in-flight
  - debounce search suggest

---

## Pattern Error Boundary dan Retry
Untuk produksi, pastikan ada 3 lapis error handling:
1) **Per komponen/section** (mis. latest updates gagal -> hanya section itu yang error)
2) **Per halaman/route** (mis. detail manga gagal -> tampilkan pesan + tombol balik)
3) **Global fallback** (mis. runtime error) -> halaman error ringan + tombol refresh

---

## Edge Cases yang Harus Dipikirkan (UX)
- Manga tanpa cover -> fallback image + inisial judul.
- Manga tanpa chapter -> CTA “Follow untuk update”.
- Chapter dengan 1 halaman saja -> disable next/prev page.
- Banyak halaman -> memory pressure di mobile, jangan render semua sekaligus (lazy render).
- Gambar terlalu besar -> fit-to-width default.
- Adult/mature content -> gate modal (18+).
- URL chapter berubah/redirect -> handle 301/302, tampilkan “chapter dipindahkan”.

---

## Saran Implementasi Folder (Next.js App Router)
Contoh struktur ringkas:
- `app/`
  - `(public)/` -> home, browse, manga detail, reader
  - `(auth)/` -> login/register
  - `(user)/me/` -> dashboard, library, history
  - `(admin)/admin/` -> admin panel
  - `api/` -> (opsional) route handler untuk og image, sitemap, dll.
- `components/` -> design system + domain components
- `features/` -> logic per fitur (search, reader, library)
- `lib/` -> api client, utils, constants
- `stores/` -> Zustand stores (reader settings, ui)
- `styles/` -> tokens, globals
- `types/` -> TypeScript types (Manga, Chapter, User)

---

## Catatan Integrasi SEO di Next.js
- Gunakan Metadata API untuk title/description/OG (app router).
- Buat `sitemap.xml` dan `robots.txt` agar crawler mudah index halaman manga & genre.
- Untuk pagination/infinite loading di browse, pastikan ada URL page yang bisa di-crawl (mis. `?page=2`).

---

## Checklist Go-Live Frontend
Sebelum produksi:
- Lighthouse audit: performance, accessibility, SEO.
- Test device low-end (Android) untuk reader.
- Test jaringan lambat (3G) untuk cover + reader pages.
- Pastikan semua route punya loading + empty + error state.
- Pastikan SEO meta muncul benar saat share (OG image).
