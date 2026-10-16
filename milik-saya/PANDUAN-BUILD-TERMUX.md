# Panduan Build Paket Termux Niki Agent — dari Repo Sendiri

Tujuan: menghasilkan file paket `niki-agent_1.0.0_aarch64.deb` yang isinya
**persis kode di repo ini** (sudah rebrand, tanpa fitur Portal), lalu
menginstall-nya di HP Android lewat Termux. Tidak ada paket yang diambil
dari server proyek lain pada saat install.

> Kenapa harus build sendiri? Paket Termux siap-unduh yang beredar adalah
> milik proyek asal (di server mereka, berisi build mereka — dan saat ini
> dinyatakan rusak oleh mereka sendiri). Repo ini membawa seluruh mesin
> build-nya (`scripts/termux/`), jadi pemilik repo bisa membuat paketnya
> sendiri dari sumbernya sendiri.

---

## Yang dibutuhkan

**Di komputer (tempat build):**
- Linux atau macOS. Di Windows: gunakan WSL2 (skrip-skripnya bash + Docker).
- **Docker** terinstall dan sedang berjalan (`docker ps` tidak error).
- `git`, dan ruang disk kosong yang lega — build pertama mengunduh image
  kontainer dan mengompilasi wheel native; sediakan ruang beberapa GB
  (perkiraan kasar, bukan angka pasti) dan waktu yang tidak sebentar.
- Koneksi internet untuk unduhan publik saat build pertama: image dasar
  resmi Termux (`termux/termux-docker`, di-pin berdasarkan digest di
  `pm/lock.json`), paket dari PyPI, dan rilis publik di GitHub. Ini
  unduhan *perkakas build* dari sumber publik — bukan paket jadi dari
  server proyek asal.

**Di HP:**
- Android **arm64 (aarch64)**.
- Aplikasi **Termux standar** (dari F-Droid atau GitHub Termux — jangan
  versi Play Store yang sudah usang), prefix standar
  `/data/data/com.termux/files/usr`.

---

## Jalur cepat (disarankan): build di GitHub Actions

Repo ini sekarang punya workflow **“Build Paket Termux (.deb)”**
(`.github/workflows/build-termux-deb.yml`) yang menjalankan seluruh
pipeline di bawah pada **mesin ARM64 asli milik GitHub** — bukan emulasi,
jadi jauh lebih cepat daripada build di komputer x86 (yang bisa berjam-jam
karena semua kompilasi ARM-nya diemulasi). Gratis untuk repo publik.

Caranya:

1. Buka repo → tab **Actions** → pilih **Build Paket Termux (.deb)**.
2. Klik **Run workflow**, isi tag `v1.0.0`, klik **Run**.
3. Tunggu sampai job hijau. Di bagian bawah halaman run itu, unduh
   artefak `niki-agent-termux-v1.0.0` — isinya file
   `niki-agent_1.0.0_aarch64.deb`.
4. Lanjut ke **Langkah 6** di bawah (install di HP).

Kalau jalur cepat ini berhasil, Langkah 1–5 versi lokal tidak perlu
kamu jalankan. Sisanya di panduan ini tetap berguna sebagai jalur manual
dan untuk memahami isi pipeline-nya.

---

## Langkah 1 — Ambil repo & masuk ke tag rilis

Versi paket ditentukan oleh **tag git**, bukan file versi. Tag `v1.0.0`
sudah dibuat di repo ini.

```bash
git clone https://github.com/NeGamer01/niki-agent.git
cd niki-agent
git checkout v1.0.0
```

Untuk rilis berikutnya nanti: buat tag baru dulu (mis. `git tag -a v1.0.1 -m "..."`
lalu `git push origin v1.0.1`) dan checkout tag itu sebelum build.

## Langkah 2 — Susun payload (Python, Node, uv versi Termux)

```bash
mkdir -p build/payload build/out
scripts/termux/build_cpython.sh build/payload
scripts/termux/build_node.sh    build/payload
bash scripts/termux/build_uv.sh      build/payload
```

Ketiganya men-stage paket bionik yang terkunci di `pm/lock.json` ke dalam
`build/payload/` (dengan verifikasi digest). Aman dijalankan ulang:
yang sudah ter-stage dan terverifikasi akan dilewati.

## Langkah 3 — Bangun wheelhouse (semua wheel Python untuk Android)

```bash
scripts/termux/termux_build.sh --repo . --tag v1.0.0 --out build/out
```

Skrip ini menjalankan separuh pekerjaannya di dalam kontainer Termux
yang ter-pin, karena wheel-nya harus bionik (biner glibc tidak bisa jalan
di HP). Hasilnya: folder `build/out/wheelhouse/` + `index.json` +
`SHA256SUMS`.

## Langkah 4 — Masukkan kode aplikasi & wheelhouse ke payload

```bash
git archive v1.0.0 -o build/app.tar
mkdir -p build/payload/app
tar -xf build/app.tar -C build/payload/app
cp -r build/out/wheelhouse build/payload/
```

Setelah ini `build/payload/` berisi `python/`, `node/`, `app/`, dan
`wheelhouse/` — persis yang diminta langkah berikutnya.

## Langkah 5 — Rakit paket .deb (sekaligus diuji otomatis)

```bash
bash scripts/termux/build_deb.sh --repo . --tag v1.0.0 --payload build/payload --out build/out
```

Hasil akhir: **`build/out/niki-agent_1.0.0_aarch64.deb`**.

Skrip ini tidak punya jalan pintas: paket selalu di-install ke image
Termux segar di dalam Docker dan diuji (`validate_installed.py`) sebelum
dinyatakan jadi. Kalau langkah ini selesai tanpa error, paketnya sudah
terbukti bisa terpasang dan berjalan di lingkungan Termux bersih.

## Langkah 6 — Install di HP

Pindahkan `niki-agent_1.0.0_aarch64.deb` ke HP (kabel USB, atau
`termux-setup-storage` lalu salin dari penyimpanan bersama). Lalu di
Termux:

```bash
pkg install ./niki-agent_1.0.0_aarch64.deb
niki --version
niki doctor
niki setup
niki --tui
```

- `niki setup`: pilih provider model dan masukkan **API key milikmu
  sendiri** (mis. OpenRouter/OpenAI/lainnya). Agen ini tidak punya akun,
  langganan, atau portal — memang begitu desainnya sekarang.
- Data & konfigurasi tinggal di `~/.niki/` di HP-mu.

## Memperbarui versi

Ulangi Langkah 1–6 dengan tag yang lebih baru. Install .deb baru menimpa
yang lama; konfigurasi, sesi, skill, dan memori di `~/.niki/` tidak
terhapus. `pkg uninstall niki-agent` mencopot paketnya saja (data tetap
ada).

## (Opsional, nanti) Repo APT pribadi

Kalau suatu hari ingin update bergaya `pkg update && pkg upgrade` dari
server milikmu sendiri, repo ini menyediakan
`scripts/termux/stage_apt_repo.py` untuk menyusun repo APT statis dari
kumpulan .deb hasil build, ditandatangani kunci GPG milikmu sendiri.
Tidak wajib untuk pemakaian pribadi satu HP — install .deb langsung
sudah cukup.

---

## Kalau ada langkah yang gagal

- **`docker: command not found` / daemon tidak jalan** → Docker belum
  terinstall/berjalan di komputer. Build memang tidak bisa jalan tanpa
  Docker, dan tidak bisa dipindah ke HP.
- **Error menyebut tag tidak ditemukan** → kamu belum `git checkout`
  tag-nya, atau sedang di salinan repo yang belum `git fetch --tags`.
- **Gagal di tengah unduhan** → jalankan ulang perintah yang sama;
  tahap staging & wheelhouse menyimpan cache, jadi tidak mengulang dari
  nol.
- **Di HP: `pkg install` menolak file** → pastikan nama file berakhiran
  `_aarch64.deb`, kamu berada di folder yang benar (`ls` dulu), dan HP-mu
  memang arm64.
- **Gateway berhenti saat layar mati** → itu batasan Android terhadap
  proses latar Termux; pengecualian baterai untuk Termux dan
  `termux-wake-lock` membantu, tapi tidak menjamin 100%.

## Catatan kejujuran

- Panduan ini disusun dari skrip build yang benar-benar ada di repo ini
  (`scripts/termux/termux_build.sh`, `build_deb.sh`, `build_cpython.sh`,
  `build_node.sh`, `build_uv.sh`) dan dokumen paketnya — bukan karangan.
- Build pertama adalah pekerjaan berat (kelas rilis/CI). Kalau komputer
  yang dipakai kelas ringan, bersiaplah menunggu.
- Paket hasil build ini adalah paket **milikmu dari repomu** — tidak
  ditandatangani/didistribusikan pihak mana pun selain kamu.
