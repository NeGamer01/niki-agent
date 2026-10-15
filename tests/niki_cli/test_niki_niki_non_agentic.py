"""Tests for the Niki-Hermes-3/4 non-agentic warning detector.

Prior to this check, the warning fired on any model whose name contained
``"niki"`` anywhere (case-insensitive). That false-positived on unrelated
local Modelfiles such as ``niki-brain:qwen3-14b-ctx16k`` — a tool-capable
Qwen3 wrapper that happens to live under the "niki" tag namespace.

``is_nous_niki_non_agentic`` should only match the actual NeGamer01
Hermes-3 / Hermes-4 chat family.
"""

from __future__ import annotations

import pytest

from niki_cli.model_switch import (
    _NIKI_MODEL_WARNING,
    _check_niki_model_warning,
    is_nous_niki_non_agentic,
)


@pytest.mark.parametrize(
    "model_name",
    [
        "NousResearch/Hermes-3-Llama-3.1-70B",
        "NousResearch/Hermes-3-Llama-3.1-405B",
        "hermes-3",
        "Hermes-3",
        "hermes-4",
        "hermes-4-405b",
        "hermes_4_70b",
        "openrouter/hermes3:70b",
        "openrouter/nousresearch/hermes-4-405b",
        "NousResearch/Hermes3",
        "hermes-3.1",
    ],
)
def test_matches_real_nous_niki_chat_models(model_name: str) -> None:
    assert is_nous_niki_non_agentic(model_name), (
        f"expected {model_name!r} to be flagged as Niki Hermes 3/4"
    )
    assert _check_niki_model_warning(model_name) == _NIKI_MODEL_WARNING


