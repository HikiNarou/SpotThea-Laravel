# Spotthea API Contract (v1)

Base URL:

`http://localhost:8000/api`

Auth:

- `POST /auth/login` returns `token` (Sanctum personal access token).
- Send authenticated request with header:
  - `Authorization: Bearer <token>`
  - `Accept: application/json`

Public endpoints:

- `GET /home`
- `GET /browse`
- `GET /genres`
- `GET /manga/{slug}`
- `GET /manga/{slug}/chapters`
- `GET /read/{slug}/{chapterId}`
- `GET /updates`
- `GET /popular`
- `GET /status/{status}`
- `GET /announcements`
- `GET /site-settings`
- `GET /search`
- `GET /search/suggest`
- `GET /manga/{mangaId}/comments`
- `GET /manga/{mangaId}/rating-summary`
- `POST /reports`
- `POST /contact`

Manga payload note:

- Manga response now includes `originCountryCode` (`JP`, `KR`, `CN`, `ID`) and `originCountryLabel`.

Updates feed query params (`GET /updates`):

- `q` (optional): search by manga title, alt title, chapter title, or chapter number.
- `order` (optional): `latest` (default) or `oldest`.
- `genre` (optional): genre slug (example: `action`).
- `country` (optional): `ALL` (default), `KR`, `JP`, `CN`, `ID`.
- `page` (optional): pagination page number.
- `pageSize` (optional): manga titles per page (default `15`, max `60`).

Updates feed response shape:

- `items`: array of update entries (`{ manga, chapter }`, max 3 chapter entries per manga).
- `page`: current page.
- `pageSize`: manga titles per page.
- `total`: total manga titles matched.
- `totalPages`: total pagination pages.

Authenticated user endpoints:

- `POST /auth/logout`
- `POST /auth/logout-all`
- `GET /me`
- `GET /me/overview`
- `PUT /me/profile`
- `PUT /me/password`
- `GET /me/library`
- `PUT /me/library`
- `PATCH /me/library/move`
- `DELETE /me/library/{mangaId}/{type}`
- `GET /me/history`
- `PUT /me/history`
- `DELETE /me/history`
- `DELETE /me/history/manga/{mangaId}`
- `PUT /manga/{mangaId}/rating`
- `DELETE /manga/{mangaId}/rating`
- `POST /manga/{mangaId}/comments`
- `DELETE /comments/{commentId}`
- `POST /comments/{commentId}/like`
- `GET /me/notifications`
- `PATCH /me/notifications/{notificationId}/read`
- `PATCH /me/notifications/read-all`
- `GET /me/notification-preferences`
- `PUT /me/notification-preferences`

Admin/moderator endpoints:

- `GET /admin/dashboard`
- `GET /admin/reports`
- `PATCH /admin/reports/{report}/status`

Admin endpoints:

- `GET /admin/manga`
- `POST /admin/manga`
- `GET /admin/manga/{manga}`
- `PATCH /admin/manga/{manga}`
- `DELETE /admin/manga/{manga}`
- `GET /admin/manga/{manga}/chapters`
- `POST /admin/manga/{manga}/chapters`
- `PATCH /admin/chapters/{chapter}`
- `DELETE /admin/chapters/{chapter}`
- `GET /admin/chapters/{chapter}/pages`
- `PUT /admin/chapters/{chapter}/pages`
- `PATCH /admin/chapters/{chapter}/pages/reorder`
- `DELETE /admin/chapters/{chapter}/pages/{page}`
- `GET /admin/genres`
- `POST /admin/genres`
- `PATCH /admin/genres/{genre}`
- `DELETE /admin/genres/{genre}`
- `PUT /admin/manga/{manga}/genres`
- `GET /admin/users`
- `GET /admin/users/{user}`
- `PATCH /admin/users/{user}/role`
- `GET /admin/settings`
- `PUT /admin/settings`
- `GET /admin/settings/platform`
- `PUT /admin/settings/platform`
- `POST /admin/broadcast`

Admin chapter list query params:

- `q` (optional): search by chapter title or number.
- `sort_by` (optional): `number`, `title`, `published_at`, `created_at`.
- `sort_dir` (optional): `asc` or `desc`.
- `page` (optional): pagination page number.
- `pageSize` (optional): items per page (default `10`).

Admin chapter payload notes (`POST /admin/manga/{manga}/chapters`, `PATCH /admin/chapters/{chapter}`):

- `number` (required on create): chapter number (numeric, `> 0`).
- `title` (required on create): chapter name/title.
- `is_oneshot` (optional): boolean, default `false`.
- `volume_number` (optional): nullable numeric.
- `translation_language` (optional): language code string (default `id`).
- `published_at` (optional): nullable datetime.
- `is_published` (optional): boolean, default `true`.
- `pages` (optional): array of page payload (`image_url`, optional `width`, `height`).

Chapter response now includes:

- `isOneshot`
- `volumeNumber`
- `translationLanguage`

Admin chapter page upload notes (`POST /admin/chapters/{chapter}/pages/upload`, `POST /admin/chapters/{chapter}/pages/upload-zip`):

- File ordering in response is natural ascending by original filename.
- Stored asset filename preserves original filename by default.
- If duplicate filename exists in the same chapter directory, backend appends numeric suffix (`(1)`, `(2)`, dst.) to avoid overwrite.
- `sourceName` in response always returns original upload filename.

Admin platform settings endpoints:

- `GET /admin/settings/platform`
- `PUT /admin/settings/platform`

Admin platform settings payload (`PUT /admin/settings/platform`):

- `maintenance_mode` (required, boolean)
- `site_name` (required, string, max 80)
- `site_tagline` (nullable, string, max 120)
- `logo_url` (nullable, relative path `/...` or absolute `http/https` URL)
- `favicon_url` (nullable, relative path `/...` or absolute `http/https` URL)
- `header_notice_enabled` (required, boolean)
- `header_notice_text` (nullable, max 240; required when `header_notice_enabled = true`)
- `footer_description` (nullable, string, max 240)
- `footer_copyright` (nullable, string, max 160)
- `footer_links` (required array, min 1 max 12): each item `{ label, href }`, `href` supports relative path or absolute URL.
- `home_ads_top_items` (required array, optional content, max 8 items): tiap item `{ image_url, target_url, alt_text }`.
- `home_ads_before_latest_items` (required array, optional content, max 4 items): tiap item `{ image_url, target_url, alt_text }`.
- `home_ads_overlay_enabled` (required, boolean): aktif/nonaktif slot iklan overlay bawah.
- `home_ads_overlay_items` (required array, optional content, max 2 items): tiap item `{ image_url, target_url, alt_text }`.

Public platform settings endpoint:

- `GET /site-settings` returns key visual settings used by public web (branding, header notice, footer config, maintenance mode, dan konfigurasi slot iklan homepage).

Admin media upload note (`POST /admin/uploads/manga-assets`):

- `type` supports `cover`, `banner`, `site_logo`, `site_favicon`, and `ad_banner`.
