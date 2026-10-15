# PANDUAN — Commit & Push Niki Agent ke GitHub Saya

Repo lokal di folder ini SUDAH di-git-init dan SUDAH ada commit awal
“Niki Agent” (cek: `git log --oneline`). Tinggal push ke akun GitHub
kamu. Tidak ada file di atas 50 MB di repo ini, jadi push biasa aman
(batas GitHub per file 100 MB).

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

## 2. Buat repo kosong di GitHub

Di github.com: **New repository** → nama: `niki-agent` → **jangan**
centang “Add a README / .gitignore / license” (repo harus kosong) →
Create.

## 3. Hubungkan & push

```bash
cd niki-agent
git remote add origin https://github.com/USERNAME-KAMU/niki-agent.git
git branch -M main
git push -u origin main
```

Ganti `USERNAME-KAMU` dengan username GitHub kamu. Push pertama besar
(repo ±344 MB sebelum kompresi) — biarkan sampai selesai, jangan
ditutup di tengah.

Alternatif SSH: `git@github.com:USERNAME-KAMU/niki-agent.git`

## 4. Setelah push

- Repo `niki-agent` di akunmu = rumah resmi Niki Agent milikmu.
- Update berikutnya seperti biasa: `git add -A && git commit -m "..." && git push`.
- Mau menarik perbaikan dari upstream Hermes nanti? Tambahkan remote
  kedua bernama `upstream` ke repo NousResearch/hermes-agent, lalu
  `git fetch upstream` dan putuskan sendiri mau merge atau tidak.
  (Rebrand nama produk perlu diulang pada file yang berubah — skripnya
  tersimpan di `milik-saya/rebrand-niki.py`.)
- Wajib: file `LICENSE` (MIT, © Nous Research) tetap ada di repo —
  itu syarat lisensi dan bukti fork ini sah.
