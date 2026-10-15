"""Behavior-contract compatibility tests for native Niki plugins."""

from pathlib import Path
import shutil

import niki_yaml as yaml

from niki_cli.plugins import PluginManager


LEGACY_PLUGIN = Path(__file__).parent / "fixtures" / "plugin_compat_legacy"


def test_legacy_plugin_loads_and_ignores_additive_hook_and_manifest_fields(
    tmp_path, monkeypatch
):
    """A frozen plugin keeps working as manifests and hook payloads grow."""
    niki_home = tmp_path / "niki-home"
    plugins_dir = niki_home / "plugins"
    plugins_dir.mkdir(parents=True)
    shutil.copytree(LEGACY_PLUGIN, plugins_dir / "legacy-contract-fixture")
    (niki_home / "config.yaml").write_text(
        yaml.safe_dump(
            {"plugins": {"enabled": ["legacy-contract-fixture"]}}
        ),
        encoding="utf-8",
    )
    empty_bundled = tmp_path / "bundled-plugins"
    empty_bundled.mkdir()
    monkeypatch.setenv("HOME", str(tmp_path / "os-home"))
    monkeypatch.setenv("NIKI_HOME", str(niki_home))
    monkeypatch.setenv("NIKI_BUNDLED_PLUGINS", str(empty_bundled))

    manager = PluginManager()
    manager.discover_and_load()

    loaded = manager._plugins["legacy-contract-fixture"]
    assert loaded.enabled is True
    assert loaded.error is None
    assert loaded.module is not None
    assert loaded.manifest.version == "0.1.0"
    assert "on_session_start" in loaded.hooks_registered

    results = manager.invoke_hook(
        "on_session_start",
        session_id="legacy-session",
        resumed=True,
        future_additive_field={"nested": "value"},
    )

    assert results == [{"legacy_session_id": "legacy-session"}]
    assert loaded.module.received_sessions == ["legacy-session"]
