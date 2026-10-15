"""Resolve NIKI_HOME for standalone skill scripts.

Skill scripts may run outside the Niki process (e.g. system Python,
nix env, CI) where ``niki_constants`` is not importable.  This module
provides the same ``get_niki_home()`` and ``display_niki_home()``
contracts as ``niki_constants`` without requiring it on ``sys.path``.

When ``niki_constants`` IS available it is used directly so that any
future enhancements (profile resolution, Docker detection, etc.) are
picked up automatically.  The fallback path replicates the core logic
from ``niki_constants.py`` using only the stdlib.

All scripts under ``google-workspace/scripts/`` should import from here
instead of duplicating the ``NIKI_HOME = Path(os.getenv(...))`` pattern.
"""

from __future__ import annotations

import os
from pathlib import Path

try:
    from niki_constants import display_niki_home
    from niki_constants import get_niki_home
except (ModuleNotFoundError, ImportError):

    def get_niki_home() -> Path:
        """Return the Niki home directory (default: ~/.niki).

        Mirrors ``niki_constants.get_niki_home()``."""
        val = os.environ.get("NIKI_HOME", "").strip()
        return Path(val) if val else Path.home() / ".niki"

    def display_niki_home() -> str:
        """Return a user-friendly ``~/``-shortened display string.

        Mirrors ``niki_constants.display_niki_home()``."""
        home = get_niki_home()
        try:
            return "~/" + home.relative_to(Path.home()).as_posix()
        except ValueError:
            return str(home)
