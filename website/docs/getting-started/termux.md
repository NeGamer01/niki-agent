---
sidebar_position: 3
title: "Android / Termux"
description: "Build and install Niki Agent on Android from this repository — no third-party package channel"
---

# Niki on Android with Termux

Niki Agent is a personal fork. There is **no prebuilt Termux package channel
for this fork**: the package is built from this repository by its owner, and
installed on the phone as a local `.deb` file. Nothing is downloaded from
any other project's servers at install time.

:::warning Upstream channel does not apply here
The original project published its own Termux APT repository. That channel
belongs to the original project, is **not** used by this fork, and must not
be added to a device that runs this fork — its packages contain a different
build. (Upstream also currently flags its own Termux package as broken.)
:::

The package runs on **aarch64 (arm64-v8a)** Android devices with the standard
Termux prefix, `/data/data/com.termux/files/usr`. The wheels target
Android API 24. Do not use the desktop/server `install.sh` on this target —
it refuses Termux on purpose; the `.deb` below is the Termux path.

The package bundles Python, Node.js, npm, uv, ripgrep, ffmpeg, and their
runtime libraries. The phone never compiles core dependencies: all native
wheels are built on the build host.

## Step 1 — Build the package (on a computer)

Requirements: a Linux or macOS computer with **Docker** running and `git`.
The whole pipeline is Docker-based; the phone cannot build it.

```bash
git clone https://github.com/NeGamer01/niki-agent.git
cd niki-agent
git checkout v1.0.0        # a release tag must exist; versions come from tags
```

Assemble the payload and the wheelhouse — note the staged payload and
the build output share **one directory** (`build/out`); the wheelhouse
builder looks for the staged Python inside its own output folder, and
stages the application tree there itself:

```bash
mkdir -p build/out build/dist
scripts/termux/build_cpython.sh build/out
scripts/termux/build_node.sh    build/out
bash scripts/termux/build_uv.sh build/out
scripts/termux/termux_build.sh  --repo . --tag v1.0.0 --out build/out
```

The wheelhouse step refuses to run until the tag exists on origin **and**
a GitHub Release exists for it (create one under the repo's Releases if
needed).

Assemble and smoke-test the `.deb` (the builder installs it into a fresh
pinned Termux container image and runs the installed-package checks):

```bash
bash scripts/termux/build_deb.sh --repo . --tag v1.0.0 --payload build/out --out build/dist
# → build/dist/niki-agent_1.0.0_aarch64.deb
```

## Step 2 — Install on the phone

Copy `niki-agent_1.0.0_aarch64.deb` to the phone (USB, `termux-setup-storage`,
or any file transfer), then in the standard [Termux](https://termux.dev/) app:

```bash
pkg install ./niki-agent_1.0.0_aarch64.deb
niki setup
niki --tui
```

`niki setup` asks for a model provider and **your own API key** — this fork
has no account, subscription, or hosted portal.

The `niki`, `niki-agent`, and `niki-acp` commands use the packaged runtimes.
They do not require Termux's `python` or `nodejs` packages.

## Files and updates

| Contents | Location |
| --- | --- |
| Package files | `$PREFIX/lib/niki-agent/` |
| Command symlinks | `$PREFIX/bin/niki`, `$PREFIX/bin/niki-agent`, `$PREFIX/bin/niki-acp` |
| Configuration and user data | `~/.niki/`, or the selected `NIKI_HOME` |

To update: build a new `.deb` from a newer tag (Step 1) and install it over
the old one (Step 2). `niki update` refuses to modify an APT-owned
installation and prints the package-manager command instead.

Optionally, `scripts/termux/stage_apt_repo.py` can stage the built packages
as a private APT repository if the owner later wants `pkg upgrade`-style
updates from their own server.

## Gateway

This installation does not use systemd, launchd, or Windows Scheduled Tasks.
Run the gateway in a Termux session:

```bash
niki gateway run
```

For a background process:

```bash
mkdir -p "${NIKI_HOME:-$HOME/.niki}/logs"
nohup niki gateway run >> "${NIKI_HOME:-$HOME/.niki}/logs/gateway.log" 2>&1 &
```

:::warning Android process limits
Android can suspend or terminate background Termux processes.
Battery optimization exemptions and `termux-wake-lock` can help, but do not guarantee persistent operation.
:::

## Limits

The package does not include Electron, local Chromium, or desktop
computer-use tools. A local Docker daemon is not part of the Termux
environment. Phone-native Termux:API microphone and clipboard adapters are
not provided by this package path. Optional integrations and third-party
plugins can require dependencies that do not support Android.

Python on this target reports `sys.platform == "android"`. A dependency
or skill gated only to `linux` is not automatically available on Android.

## Uninstall

```bash
pkg uninstall niki-agent
```

APT removes the package and its command symlinks. It preserves your configuration, sessions, skills, and memories.

## Troubleshooting

- **Missing command:** verify that `$PREFIX/bin` is on `PATH`, or reinstall the `.deb`.
- **Missing library or TUI bundle:** check `niki --version` and the complete error. The core package must not require a local rebuild — if it does, the build in Step 1 was incomplete.
- **Gateway stops with the screen off:** review Android's battery and background-process limits.

For general diagnostics, run `niki doctor`.
