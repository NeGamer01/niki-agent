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
