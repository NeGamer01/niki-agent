# Catatan Rebrand: Niki Agent -> Niki Agent

Dilakukan atas permintaan pemilik, pada salinan fork di folder niki-agent.

## Yang diganti menjadi Niki / Niki Agent
- Judul & isi README, dokumentasi website (website/docs), teks bantuan &
  pesan tampilan di kode, installer (banner/pesan), metadata paket
  (pyproject name = niki-agent, package.json name = niki-agent).
- Identitas desktop: product-identity.cjs (display Niki / Niki Light /
  Niki Agent, pascal Niki/NikiLight/NikiBundled), productName = Niki.
- Perintah utama baru: `niki`, `niki-agent`, `niki-acp`
  (entry point yang sama di [project.scripts] pyproject.toml).
  Perintah lama `niki*` dipertahankan sebagai alias kompatibilitas.
- Docker: image niki-agent, container niki & niki-dashboard.
- Kepribadian bawaan (SOUL.md): "You are Niki Agent ...".
- Aturan umum pemilik tetap di milik-saya/ATURAN-SAYA.md.

## Yang SENGAJA dipertahankan (teknis, bukan nama tampilan)
Mengganti ini akan merusak fungsi / layanan pihak ketiga, jadi dibiarkan:
- File LICENSE & hak cipta NeGamer01 — syarat wajib lisensi MIT.
- URL/endpoint eksternal: situs & aset upstream (nousresearch.com),
  repo upstream, endpoint Niki Portal, slug model pihak ketiga
  (mis. nousresearch/hermes-...), nama model "Hermes 3/4" milik Niki,
  paket JS pihak ketiga hermes-parser/hermes-estree (buatan Meta).
- Identifier internal huruf kecil: nama modul Python (niki_cli,
  niki_state, ...), variabel lingkungan NIKI_*, folder data
  ~/.niki, kunci [tool.niki] di pyproject, kebab id desktop
  (niki, niki-light, niki-bundled). Ini nama teknis di dalam
  mesin — tidak tampil sebagai merek ke pengguna — dan dipakai oleh
  installer, updater, dan kompatibilitas data. Menggantinya berarti
  menulis ulang mesinnya dan memutus jalur update & data lama.
- Folder data tetap ~/.niki agar data dari instalasi Niki mana pun
  tetap terbaca.

## Status verifikasi
- Sintaks file kunci lolos cek (py_compile, bash -n, validasi TOML/JSON).
- Sisa kata "Niki" sesudah rebrand hanya pada kategori "dipertahankan"
  di atas (atribusi, URL, model/paket pihak ketiga, identifier internal).

## Catatan lanjutan (kunci dependensi)
- pyproject.toml diubah (nama proyek & entry point `niki*`), tetapi
  `uv.lock` SENGAJA tidak diubah oleh rebrand ini. Sesuai aturan repo
  (AGENTS.md area pm), setelah mengubah pyproject jalankan
  `niki pm lock` (atau `niki pm lock` setelah terpasang) pada
  lingkungan PM kamu dan commit hasil `uv.lock` yang baru. Installer
  upstream membangun environment-nya sendiri lewat PM, jadi langkah
  ini adalah bagian dari setup pertama di mesin kamu.

## Pembaruan 15 Okt 2026 malam — banner & tema biru muda (permintaan pemilik)

- `assets/banner.png` DIGANTI TOTAL: gambar pixel baru bertuliskan
  "NIKI-AGENT" gradasi biru muda (#7DD3FC → #38BDF8 → #0284C7),
  ukuran sama 1145×196. Banner NIKI-AGENT emas sudah tidak ada.
- Logo ASCII terminal di `niki_cli/banner.py` digambar ulang menjadi
  "NIKI AGENT" (nama variabel internal `NIKI_AGENT_LOGO` dipertahankan
  demi kompatibilitas skin/test) dan caduceus diwarnai ulang ke biru.
- Tema terminal default → biru muda: skin `default` di
  `niki_cli/skin_engine.py` (termasuk overlay mode terang), seeds TUI
  di `ui-tui/src/theme.ts`, cermin desktop di
  `apps/desktop/electron/local-skin.ts`, dan fallback warna di
  `niki_cli/cli_render.py`. Warna semantik (ok hijau, error merah,
  warn kuning) sengaja dipertahankan agar maknanya tidak hilang.
- Skin bawaan lain (ares, mono, slate, poseidon, dll.) tidak diubah;
  pemilik bisa beralih kapan saja dengan perintah `/skin`.

## REBRAND TOTAL — 15 Okt 2026 (menggantikan kebijakan lama di atas)

Atas instruksi tegas pemilik, kebijakan lama "identifier internal
dipertahankan" DICABUT. Sekarang rename bersifat total:

- Modul `hermes_cli` → `niki_cli`, `hermes_state*.py` → `niki_state*.py`,
  `hermes_constants` → `niki_constants`, `hermes_platform` → `niki_platform`, dst.
- Env `HERMES_*`/`NOUS_*` → `NIKI_*`; folder data `~/.hermes` → `~/.niki`;
  fungsi `get_hermes_home()` → `get_niki_home()` (terverifikasi jalan).
- Alias perintah `hermes`/`hermes-agent`/`hermes-acp` DIHAPUS; hanya
  `niki`, `niki-agent`, `niki-acp`.
- Semua tautan repo → `github.com/NeGamer01/niki-agent`; domain dokumen
  upstream diganti ke repo pemilik (install.sh → raw.githubusercontent
  repo pemilik).
- Hasil audit: "hermes" 101.450 → 1.492 kemunculan; "HERMES" 20.420 → 5;
  "NousResearch" 1.134 → 101.

Sisa yang SENGAJA dipertahankan (bukan merek Niki, melainkan):
1. File `LICENSE` — atribusi copyright Nous Research diwajibkan lisensi MIT.
2. `tests/compat/old_updater_surface.json` (±1.028) — fixture yang merekam
   permukaan rilis LAMA persis apa adanya, untuk uji kompatibilitas update.
3. Endpoint layanan eksternal `portal.nousresearch.com` &
   `inference-api.nousresearch.com` — alamat server fitur Portal/Inference
   opsional, sama kedudukannya seperti `api.openai.com` di provider OpenAI.
4. ID model eksternal (`hermes-4`, `hermes-4-405b`) di katalog model —
   nama resmi model pihak ketiga di penyedia API; menggantinya membuat
   model tidak ditemukan.
5. Dependensi pihak ketiga `hermes-parser`/`hermes-estree` (Meta) di
   file lock JavaScript — dibuat ulang apa adanya saat `npm install`.
6. `contributors/` — catatan nama/email kontributor upstream (data historis),
   dan referensi repo eksternal upstream (mis. `nousresearch/hermes-sandbox`,
   plugin resmi) sebagai SUMBER luar yang bisa diganti pemilik kapan saja.
7. `uv.lock`/`package-lock.json` belum dibuat ulang — jalankan
   `niki pm lock` setelah setup pertama.

Verifikasi: `python3 -m compileall` seluruh repo = 0 error;
`import niki_constants` dan `get_niki_home()` → `~/.niki` terbukti jalan.
Skrip: `milik-saya/rebrand-total.py` (+ pass2/pass3 dijalankan dari workspace).
