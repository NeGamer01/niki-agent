# Catatan Rebrand: Hermes Agent -> Niki Agent

Dilakukan atas permintaan pemilik, pada salinan fork di folder niki-agent.

## Yang diganti menjadi Niki / Niki Agent
- Judul & isi README, dokumentasi website (website/docs), teks bantuan &
  pesan tampilan di kode, installer (banner/pesan), metadata paket
  (pyproject name = niki-agent, package.json name = niki-agent).
- Identitas desktop: product-identity.cjs (display Niki / Niki Light /
  Niki Agent, pascal Niki/NikiLight/NikiBundled), productName = Niki.
- Perintah utama baru: `niki`, `niki-agent`, `niki-acp`
  (entry point yang sama di [project.scripts] pyproject.toml).
  Perintah lama `hermes*` dipertahankan sebagai alias kompatibilitas.
- Docker: image niki-agent, container niki & niki-dashboard.
- Kepribadian bawaan (SOUL.md): "You are Niki Agent ...".
- Aturan umum pemilik tetap di milik-saya/ATURAN-SAYA.md.

## Yang SENGAJA dipertahankan (teknis, bukan nama tampilan)
Mengganti ini akan merusak fungsi / layanan pihak ketiga, jadi dibiarkan:
- File LICENSE & hak cipta Nous Research — syarat wajib lisensi MIT.
- URL/endpoint eksternal: situs & aset upstream (nousresearch.com),
  repo upstream, endpoint Nous Portal, slug model pihak ketiga
  (mis. nousresearch/hermes-...), nama model "Hermes 3/4" milik Nous,
  paket JS pihak ketiga hermes-parser/hermes-estree (buatan Meta).
- Identifier internal huruf kecil: nama modul Python (hermes_cli,
  hermes_state, ...), variabel lingkungan HERMES_*, folder data
  ~/.hermes, kunci [tool.hermes] di pyproject, kebab id desktop
  (hermes, hermes-light, hermes-bundled). Ini nama teknis di dalam
  mesin — tidak tampil sebagai merek ke pengguna — dan dipakai oleh
  installer, updater, dan kompatibilitas data. Menggantinya berarti
  menulis ulang mesinnya dan memutus jalur update & data lama.
- Folder data tetap ~/.hermes agar data dari instalasi Hermes mana pun
  tetap terbaca.

## Status verifikasi
- Sintaks file kunci lolos cek (py_compile, bash -n, validasi TOML/JSON).
- Sisa kata "Hermes" sesudah rebrand hanya pada kategori "dipertahankan"
  di atas (atribusi, URL, model/paket pihak ketiga, identifier internal).

## Catatan lanjutan (kunci dependensi)
- pyproject.toml diubah (nama proyek & entry point `niki*`), tetapi
  `uv.lock` SENGAJA tidak diubah oleh rebrand ini. Sesuai aturan repo
  (AGENTS.md area pm), setelah mengubah pyproject jalankan
  `hermes pm lock` (atau `niki pm lock` setelah terpasang) pada
  lingkungan PM kamu dan commit hasil `uv.lock` yang baru. Installer
  upstream membangun environment-nya sendiri lewat PM, jadi langkah
  ini adalah bagian dari setup pertama di mesin kamu.

## Pembaruan 15 Okt 2026 malam — banner & tema biru muda (permintaan pemilik)

- `assets/banner.png` DIGANTI TOTAL: gambar pixel baru bertuliskan
  "NIKI-AGENT" gradasi biru muda (#7DD3FC → #38BDF8 → #0284C7),
  ukuran sama 1145×196. Banner HERMES-AGENT emas sudah tidak ada.
- Logo ASCII terminal di `hermes_cli/banner.py` digambar ulang menjadi
  "NIKI AGENT" (nama variabel internal `HERMES_AGENT_LOGO` dipertahankan
  demi kompatibilitas skin/test) dan caduceus diwarnai ulang ke biru.
- Tema terminal default → biru muda: skin `default` di
  `hermes_cli/skin_engine.py` (termasuk overlay mode terang), seeds TUI
  di `ui-tui/src/theme.ts`, cermin desktop di
  `apps/desktop/electron/local-skin.ts`, dan fallback warna di
  `hermes_cli/cli_render.py`. Warna semantik (ok hijau, error merah,
  warn kuning) sengaja dipertahankan agar maknanya tidak hilang.
- Skin bawaan lain (ares, mono, slate, poseidon, dll.) tidak diubah;
  pemilik bisa beralih kapan saja dengan perintah `/skin`.
