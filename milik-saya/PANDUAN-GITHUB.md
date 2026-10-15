# PANDUAN — Commit & Push Niki Agent ke GitHub Saya

Repo ini SUDAH di-git-init dan SUDAH ada commit “Niki Agent”
(cek: `git log --oneline`). Tinggal push ke akun GitHub kamu.
Tidak ada file di atas 50 MB di repo ini, jadi push biasa aman
(batas GitHub per file 100 MB).

Kalau kamu menerima repo ini sebagai file `niki-agent.bundle`,
pulihkan dulu repo + commit-nya persis seperti aslinya:

```bash
git clone niki-agent.bundle niki-agent
cd niki-agent
git log --oneline   # commit Niki Agent harus muncul
```

## 1. Atur identitas git kamu (sekali)

Di dalam folder `niki-agent`:

```bash
git config user.name "Nama Kamu"
git config user.email "email@kamu"
```

Commit awal dibuat dengan identitas sementara. Kalau mau commit awal
itu atas namamu juga:

```bash
git commit --amend --reset-author --no-edit
```

## 2. Repo GitHub tujuan (SUDAH dibuat)

Repo: https://github.com/NeGamer01/niki-agent — publik, dibuat
15 Okt 2026, dan terverifikasi masih KOSONG (size 0, belum ada branch).
Jadi tidak ada yang akan tertimpa oleh push pertama ini.

## 3. Hubungkan & push

```bash
cd niki-agent
git remote add origin https://github.com/NeGamer01/niki-agent.git
git branch -M main
git push -u origin main
```

Catatan clone dari bundle: hasil clone dari file bundle menjadikan
file bundle itu sebagai `origin`. Dalam kasus itu ganti alamatnya,
bukan add:

```bash
git remote set-url origin https://github.com/NeGamer01/niki-agent.git
git push -u origin main
```

Saat push lewat HTTPS, GitHub tidak lagi menerima kata sandi akun —
gunakan username `NeGamer01` dan **Personal Access Token (PAT)**
sebagai kata sandi. Buat PAT di GitHub: Settings → Developer settings
→ Personal access tokens → Fine-grained tokens → hanya repo
`niki-agent`, permission Contents: Read and write. Token itu rahasia:
jangan kirim ke siapa pun lewat chat, termasuk ke Muse.

Ganti `NeGamer01` dengan username GitHub kamu. Push pertama besar
(repo ±344 MB sebelum kompresi) — biarkan sampai selesai, jangan
ditutup di tengah.

Alternatif SSH: `git@github.com:NeGamer01/niki-agent.git`

## 4. Setelah push

- Repo `niki-agent` di akunmu = rumah resmi Niki Agent milikmu.
- Update berikutnya seperti biasa: `git add -A && git commit -m "..." && git push`.
- Mau menarik perbaikan dari upstream Niki nanti? Tambahkan remote
  kedua bernama `upstream` ke repo NeGamer01/niki-agent, lalu
  `git fetch upstream` dan putuskan sendiri mau merge atau tidak.
  (Rebrand nama produk perlu diulang pada file yang berubah — skripnya
  tersimpan di `milik-saya/rebrand-niki.py`.)
- Wajib: file `LICENSE` (MIT, © NeGamer01) tetap ada di repo —
  itu syarat lisensi dan bukti fork ini sah.
