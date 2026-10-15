#!/usr/bin/env python3
"""Rebrand TOTAL Niki Agent: hapus seluruh jejak nama hermes/nous dari isi & nama file.

Dilindungi (tidak diubah):
- LICENSE / NOTICE (kewajiban hukum lisensi MIT)
- contributors/ (catatan atribusi kontributor upstream)
- tests/compat/*.json (fixture permukaan rilis historis)
- file lock (uv.lock, package-lock.json, *.lock) - dibuat ulang via pm lock
- URL endpoint layanan eksternal yang benar-benar dipakai kode jaringan
  (host *nousresearch.com di dalam URL http) - alamat layanan, bukan merek
- ID model eksternal versi (hermes-3, hermes-4, nousresearch/hermes-*) - data katalog
- paket pihak ketiga hermes-parser / hermes-estree (milik Meta)
"""
import os, re, sys

ROOT = os.path.expanduser('~/workspace/niki-agent')
SKIP_DIRS = {'.git', 'node_modules', '__pycache__', 'dist', 'dist-electron'}
SKIP_PATH_PREFIX = ('contributors/', 'tests/compat/')
LOCK_NAMES = {'uv.lock', 'package-lock.json', 'bun.lock', 'bun.lockb',
              'pnpm-lock.yaml', 'yarn.lock', 'Cargo.lock', 'poetry.lock'}
PROTECT_NAMES = {'LICENSE', 'LICENSE.md', 'LICENSE.txt', 'NOTICE', 'NOTICE.md'}

changed_files = 0
changed_lines = 0

# ---------- perlindungan substring ----------
PLACEHOLDERS = []
def protect(pattern, text, flags=0):
    def repl(m):
        PLACEHOLDERS.append(m.group(0))
        return f'\x00{len(PLACEHOLDERS)-1}\x00'
    return re.sub(pattern, repl, text, flags=flags)

def protect_all(text):
    text = protect(r'https?://[\w.\-]*nousresearch\.com[\w/\-._~:?#\[\]@!$&\'()*+,;=%]*', text)
    text = protect(r'nousresearch/hermes[\w.\-]*', text, re.I)
    text = protect(r'hermes-parser', text)
    text = protect(r'hermes-estree', text)
    text = protect(r'hermes[-_ ]?[0-9][\w.\-]*', text)   # ID model berversi
    text = protect(r'Hermes[-_ ]?[0-9][\w.\-]*', text)
    return text

def restore(text):
    for i, val in enumerate(PLACEHOLDERS):
        text = text.replace(f'\x00{i}\x00', val)
    return text

# ---------- aturan ganti (berurutan) ----------
def transform(text):
    global PLACEHOLDERS
    PLACEHOLDERS = []
    text = protect_all(text)
    text = text.replace('hermes-agent.nousresearch.com', 'github.com/NeGamer01/niki-agent')
    text = text.replace('github.com/NousResearch/hermes-agent', 'github.com/NeGamer01/niki-agent')
    text = text.replace('NousResearch', 'NeGamer01')
    text = text.replace('Nous Research', 'NeGamer01')
    text = re.sub(r'nousresearch(?![\w.\-]*\.(com|ai|dev|io))', 'negamer01', text)
    text = text.replace('Nous Portal', 'Niki Portal')
    text = re.sub(r'\bNOUS_', 'NIKI_', text)
    text = re.sub(r'\bnous_', 'niki_', text)
    text = re.sub(r'_nous\b', '_niki', text)
    text = re.sub(r'\bNous\b', 'Niki', text)
    text = re.sub(r'\bNOUS\b', 'NIKI', text)
    text = re.sub(r'\bnous\b', 'niki', text)
    text = text.replace('Hermes', 'Niki')
    text = text.replace('HERMES', 'NIKI')
    text = text.replace('hermes', 'niki')
    text = restore(text)
    return text

def is_text_file(path):
    try:
        with open(path, 'rb') as f:
            chunk = f.read(8192)
        if b'\x00' in chunk:
            return False
        chunk.decode('utf-8')
        return True
    except Exception:
        return False

def process_file(path):
    global changed_files, changed_lines
    try:
        with open(path, 'r', encoding='utf-8') as f:
            old = f.read()
    except Exception:
        return
    new = transform(old)
    if new != old:
        changed_lines += sum(1 for a, b in zip(old.splitlines(), new.splitlines()) if a != b)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new)
        changed_files += 1

# ---------- pyproject: hapus alias perintah hermes SEBELUM transform umum ----------
pp = os.path.join(ROOT, 'pyproject.toml')
with open(pp, encoding='utf-8') as f:
    ppt = f.read()
for alias in ('hermes = "hermes_cli.main:main"',
              'hermes-agent = "hermes_cli.main:main"',
              'hermes-acp = "acp_adapter.entry:main"'):
    if alias in ppt:
        ppt = ppt.replace(alias + '\n', '')
        print('alias dihapus:', alias)
with open(pp, 'w', encoding='utf-8') as f:
    f.write(ppt)

# ---------- isi file ----------
for dirpath, dirnames, filenames in os.walk(ROOT):
    rel = os.path.relpath(dirpath, ROOT)
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    if rel.startswith('contributors') or rel.startswith('tests/compat'):
        continue
    for fn in filenames:
        if fn in LOCK_NAMES or fn in PROTECT_NAMES:
            continue
        p = os.path.join(dirpath, fn)
        relp = os.path.relpath(p, ROOT)
        if relp.startswith(SKIP_PATH_PREFIX):
            continue
        if is_text_file(p):
            process_file(p)
print(f'isi: {changed_files} file diubah, ~{changed_lines} baris')

# ---------- nama file & folder ----------
renamed = 0
for dirpath, dirnames, filenames in os.walk(ROOT, topdown=False):
    rel = os.path.relpath(dirpath, ROOT)
    if '.git' in rel.split(os.sep) or 'node_modules' in rel.split(os.sep):
        continue
    if rel.startswith('contributors'):
        continue
    for name in filenames + dirnames:
        if name in LOCK_NAMES or name in PROTECT_NAMES:
            continue
        new = (name.replace('Hermes', 'Niki').replace('HERMES', 'NIKI')
                   .replace('hermes', 'niki')
                   .replace('Nous', 'Niki').replace('nous', 'niki'))
        if new != name:
            src = os.path.join(dirpath, name)
            dst = os.path.join(dirpath, new)
            if not os.path.exists(dst):
                os.rename(src, dst)
                renamed += 1
            else:
                print('TABRAKAN nama, dilewati:', src, '->', dst)
print(f'nama: {renamed} file/folder di-rename')
print('SELESAI')
