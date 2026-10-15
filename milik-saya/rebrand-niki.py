#!/usr/bin/env python3
"""Rebrand nama PRODUK Niki -> Niki di repo fork (fase tampilan & identitas).

Yang diganti: 'Niki Agent' -> 'Niki Agent', 'Niki' mandiri -> 'Niki',
'NIKI' mandiri -> 'NIKI' (teks tampilan, docs, README, desktop identity,
CLI strings, installer messages, metadata paket).

Yang SENGAJA tidak diganti (identifier teknis / pihak ketiga — menggantinya
merusak fungsi, bukan sekadar nama):
- URL & domain eksternal (nousresearch.com, niki-assets, github upstream)
- paket pihak ketiga: hermes-parser / hermes-estree (Meta), model
  'Hermes 3/4' milik Niki, slug model provider (nousresearch/hermes-...)
- file LICENSE & file .lock, berkas biner
- identifier huruf kecil: modul python (niki_cli dll), variabel NIKI_*,
  folder data ~/.niki — ini nama teknis internal, tidak tampil ke user.
"""
import os
import re
import sys

ROOT = sys.argv[1]
SKIP_DIRS = {".git", "node_modules", "dist", ".venv", "__pycache__"}
SKIP_FILES = {"LICENSE", "uv.lock", "package-lock.json", "flake.lock",
              "pnpm-lock.yaml", "yarn.lock"}
SKIP_EXT = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".icns", ".woff",
            ".woff2", ".ttf", ".eot", ".pdf", ".zip", ".gz", ".bz2",
            ".xz", ".7z", ".mp3", ".mp4", ".webm", ".webp", ".svgz",
            ".bin", ".dat", ".db", ".sqlite", ".snap", ".msix", ".dmg",
            ".exe", ".dll", ".so", ".dylib", ".a", ".o", ".pyc"}
PROTECT_LINE = ("negamer01", "niki-assets", "hermes-parser",
                "hermes-estree", "niki-engine", "nikijs")
changed_files = 0
changed_lines = 0

RULES = [
    (re.compile(r"Niki Agent"), "Niki Agent"),
    (re.compile(r"NIKI AGENT"), "NIKI AGENT"),
    (re.compile(r"niki agent"), "niki agent"),
    (re.compile(r"\bNiki\b(?!\s?-?\s?\d)"), "Niki"),
    (re.compile(r"\bNIKI\b"), "NIKI"),
]

for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    for fn in filenames:
        if fn in SKIP_FILES or fn.startswith("LICENSE"):
            continue
        path = os.path.join(dirpath, fn)
        if os.path.splitext(fn)[1].lower() in SKIP_EXT:
            continue
        try:
            with open(path, encoding="utf-8") as f:
                lines = f.readlines()
        except (UnicodeDecodeError, OSError):
            continue
        out, touched = [], False
        for line in lines:
            low = line.lower()
            if any(p in low for p in PROTECT_LINE):
                out.append(line)
                continue
            new = line
            for rx, rep in RULES:
                new = rx.sub(rep, new)
            if new != line:
                touched = True
                changed_lines += 1
            out.append(new)
        if touched:
            changed_files += 1
            with open(path, "w", encoding="utf-8") as f:
                f.writelines(out)

print(f"Rebrand selesai: {changed_files} file, {changed_lines} baris diubah.")
