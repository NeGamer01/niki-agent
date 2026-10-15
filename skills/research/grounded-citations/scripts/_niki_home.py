"""Resolve NIKI_HOME for standalone skill scripts.

Skill scripts may run outside the Niki process (system Python, nix env,
CI) where ``niki_constants`` is not importable.  This module provides the
same ``get_niki_home()`` contract without requiring it on ``sys.path``.

When ``niki_constants`` IS available it is used directly so profile
resolution and any future enhancements are picked up automatically.
"""

from __future__ import annotations

import os
from pathlib import Path

try:
    from niki_constants import get_niki_home
except (ModuleNotFoundError, ImportError):

    def get_niki_home() -> Path:
        """Return the Niki home directory (default: ``~/.niki``)."""
        val = os.environ.get("NIKI_HOME", "").strip()
        return Path(val) if val else Path.home() / ".niki"
