# PANDUAN INSTALL — Niki Agent Milik Saya (Fork 1:1)

Panduan memasang salinan pribadimu dari Niki Agent: kode & fitur sama
persis dengan upstream (repo NeGamer01/niki-agent, lisensi MIT),
di folder niki-agent. Commit acuan tercatat di
milik-saya/UPSTREAM.txt. Tidak ada fitur yang dikurangi.

Dua cara pasang di tiap perangkat:
- Cara A, dari salinanmu sendiri (disarankan): salin folder
  niki-agent ke perangkat itu, lalu jalankan installer dari
  dalam folder.
- Cara B, installer resmi upstream: satu perintah dari situs Niki.
  Data & konfigurasimu tetap milikmu karena tersimpan di ~/.niki/
  perangkatmu.

Setelah terpasang, perintah utamanya: niki (perintah lama niki tetap jalan sebagai alias). Perintah lainnya sama di semua platform: niki,
niki setup, niki model, niki gateway setup, niki desktop.

## 1. Linux / VPS / WSL2 / macOS (CLI)

Cara A:

    cd niki-agent
    bash scripts/install.sh
    source ~/.bashrc        (macOS: ~/.zshrc)
    niki setup            (pilih provider, isi API key kamu sendiri)
    niki

Cara B: jalankan installer resmi dari situs github.com/NeGamer01/niki-agent
(halaman Installation), perintah curl install.sh yang ada di sana.

Catatan: macOS resmi hanya Apple Silicon; Mac Intel tidak didukung
upstream (lihat website/docs/getting-started/platform-support.md di
salinanmu). Di VPS untuk jalan terus gunakan niki gateway run, atau
unit systemd / tmux sesuai docs upstream.

## 2. Windows

Desktop: unduh paket desktop resmi dari situs Niki, atau dari folder
salinanmu gunakan skrip PowerShell-nya:

    cd niki-agent
    powershell -ExecutionPolicy Bypass -File scripts\install.ps1
    niki setup

Cara B resmi juga ada di halaman Installation upstream (perintah
PowerShell install.ps1). Setelah CLI terpasang, aplikasi desktop bisa
dibuka dengan perintah: niki desktop

## 3. Android / Termux

Pakai aplikasi Termux standar, HP arm64 (aarch64), Android API 24+.
Langkah lengkap persis ada di dalam salinanmu:
website/docs/getting-started/termux.md — ringkasnya: tambahkan repo APT
Niki (stable) dengan verifikasi fingerprint kuncinya, lalu
pkg install niki-agent, niki setup, niki --tui.

Peringatan jujur dari dokumen upstream di commit ini: paket Termux saat
ini dinyatakan "currently broken" oleh upstream dan sedang diperbaiki,
jadi langkah itu bisa gagal untuk sementara. Itu keadaan upstream apa
adanya; fork 1:1 tidak mengubahnya. Alternatif sementara di HP:
jalankan Niki di VPS (cara 1) lalu hubungkan lewat gateway
Telegram/WhatsApp dari HP kamu.

## 4. Docker (server / NAS / komputer rumah)

Di folder salinanmu sudah ada Dockerfile dan docker-compose.yml resmi
upstream:

    cd niki-agent
    docker compose up -d --build

Baca komentar di file compose sebelum mengubah port / volume; data
persistenmu mengikuti pengaturan compose itu.

## 5. Menjadikannya benar-benar milik saya

1. Data & aturanmu terpisah dari kode. Setelah install, semua milikmu
   ada di ~/.niki/ perangkat itu: profil, SOUL.md, memory, skills,
   sesi, API key. Kode boleh di-update, datamu tetap.
2. Pasang aturanmu: salin isi milik-saya/ATURAN-SAYA.md ke SOUL.md di
   folder data/profilmu (atau gabungkan), lalu edit bebas. Di situlah
   nama panggilan agenmu & aturan-aturanmu berlaku.
3. Punya repo sendiri (opsional, disarankan): buat repo kosong di akun
   GitHub kamu, lalu di folder salinanmu ganti remote origin ke repomu
   dan rename origin lama menjadi upstream, lalu push. Dengan itu
   salinanmu tersimpan di akunmu, dan kamu tetap bisa menarik update
   resmi dari upstream kapan pun kamu mau — menerima update atau
   tidak, sepenuhnya keputusanmu. Catatan: salinan ini clone dangkal,
   jalankan git fetch --unshallow sebelum push pertama.
4. Yang wajib dipertahankan: file LICENSE (MIT, NeGamer01) harus
   tetap disertakan bila kamu menyebarkan salinan ini; itu satu-satunya
   syarat lisensinya. Jangan mengklaim fork ini produk resmi
   NeGamer01.

## 6. Cek cepat setelah terpasang

    niki --version
    niki doctor
    niki setup
    niki

Dokumentasi lengkap upstream ikut tersalin persis di website/docs/
dalam folder salinanmu.
