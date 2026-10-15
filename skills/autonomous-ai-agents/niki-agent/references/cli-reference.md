# Niki CLI Reference

Live sources when anything looks stale: `niki --help`, `niki <command> --help`,
https://github.com/NeGamer01/niki-agent/docs/reference/cli-commands

### Global Flags

```
niki [flags] [command]        (no subcommand = interactive chat)

  --version, -V             Show version
  -z, --oneshot PROMPT      One-shot: print ONLY the final response (for scripts/pipes)
  -m MODEL  --provider P    Model/provider override for this invocation
  -t, --toolsets LIST       Comma-separated toolsets for this invocation
  --resume, -r SESSION      Resume session by ID or title
  --continue, -c [NAME]     Resume by name, or most recent session
  --worktree, -w            Isolated git worktree mode (parallel agents)
  --skills, -s SKILL        Preload skills (comma-separate or repeat)
  --profile, -p NAME        Use a named profile
  --yolo                    Skip dangerous command approval
  --tui / --cli             Force the Ink TUI / classic REPL
  --ignore-rules            Skip AGENTS.md/SOUL.md/memory/skill injection
  --safe-mode               Disable ALL customizations (troubleshooting)
  --pass-session-id         Include session ID in system prompt
```

### Chat

```
niki chat [flags]
  -q, --query TEXT          Single query, non-interactive
  --image PATH              Attach a local image to a single query
  -Q, --quiet               Suppress banner, spinner, tool previews
  --checkpoints             Enable filesystem checkpoints (/rollback)
  --max-turns N             Cap tool-calling iterations
  --source TAG              Session source tag (default: cli)
```
(plus the global flags above)

### Configuration

```
niki setup [section]      Wizard (model|tts|terminal|gateway|tools|agent)
niki model                Interactive model/provider picker
niki fallback [add|remove|list]  Fallback provider chain
niki config [show|edit|get|set|unset|path|env-path|check|migrate]
niki login / logout       OAuth sign-in / clear stored auth
niki doctor [--fix]       Check dependencies and config
niki status [--full]      Component summary (--full: every section)
```

### Tools & Skills

```
niki tools [list|enable NAME|disable NAME]   Per-platform toolsets (curses UI with no args)

niki skills list|browse|search QUERY|inspect ID
niki skills install ID    Hub identifier OR a direct https://…/SKILL.md URL
niki skills config        Enable/disable skills per platform
niki skills check|update|uninstall|publish PATH
niki skills tap add REPO  Add a GitHub repo as a skill source
niki bundles              Skill bundles (one /<name> alias loads several skills)
```

### MCP Servers

```
niki mcp add NAME (--url or --command) | remove | list | test NAME
niki mcp catalog | install NAME     Curated catalog install
niki mcp configure NAME             Toggle tool selection
niki mcp serve                      Run Niki as an MCP server
```
Details (transport, tool discovery, catalog): `references/native-mcp.md`.

### Gateway (Messaging Platforms)

```
niki gateway run|install|start|stop|restart|status|setup
```

20+ platforms: Telegram, Discord, Slack, WhatsApp (Baileys + Business Cloud API), iMessage (Photon — `niki photon setup`), Signal, Email, SMS, Matrix, Mattermost, Teams, LINE, SimpleX, ntfy, Google Chat, Home Assistant, DingTalk, Feishu, WeCom, Weixin, API Server, Webhooks. Open WebUI connects via the API Server adapter. Most adapters ship under `plugins/platforms/`.
Docs: https://github.com/NeGamer01/niki-agent/docs/user-guide/messaging/

### Sessions

```
niki sessions list|browse|rename ID TITLE|delete ID|export OUT|prune|stats
```

### Cron / Webhooks

```
niki cron list|create SCHED|edit ID|pause|resume|run ID|remove|status
    Schedules: '30m', 'every 2h', '0 9 * * *', ISO timestamp
niki webhook subscribe NAME|list|remove NAME|test NAME
```
Webhook payloads/routes: `references/webhooks.md`.

### Profiles

```
niki profile list|create NAME (--clone|--clone-all|--clone-from)|use|show|delete
niki profile rename A B | alias NAME | export NAME | import FILE
niki profile migrate-identity A B   Retry a completed rename's session/routing identity migration
```

### Credentials & Pools

```
niki auth                 Interactive credential manager
niki auth add [PROVIDER]  Add OAuth or API-key credential (niki, openai-codex, qwen-oauth, …)
niki auth list|remove P IDX|reset PROVIDER|status
```
Multiple credentials per provider form a pool that rotates automatically and skips exhausted keys.

### Other

```
niki desktop / gui        Native desktop app
niki dashboard            Web admin panel + embedded chat (--stop / --status)
niki proxy                OpenAI-compatible local proxy backed by an OAuth provider
niki portal               Quick setup / sign in via Niki Portal
niki kanban <verb>        Multi-agent work-queue board
niki project              Named multi-folder workspaces
niki skin list|use|set    Switch/tweak skins (see references/themes.md)
niki pets <verb>          Pet mascots (see references/petdex.md)
niki memory setup|status|off|reset   Memory provider
niki secrets bitwarden|onepassword   External secret stores
niki moa                  Mixture-of-Agents slots
niki hooks / security / backup / import / checkpoints / console
niki logs [-f] [errors]   View agent/error logs
niki send                 One-off message through a gateway platform
niki pairing / plugins / insights / journey / computer-use
niki acp                  ACP server (IDE integration)
niki completion bash|zsh|fish
niki update / uninstall / claw migrate
```

Plugin- and provider-supplied subcommands (e.g. `niki photon setup`) only appear once their plugin is installed/active.

### Where to Find Things

| Looking for... | Location |
|---|---|
| Config options | `niki config edit` · [Configuration docs](https://github.com/NeGamer01/niki-agent/docs/user-guide/configuration) |
| Tools / toolsets | `niki tools list` · [Tools reference](https://github.com/NeGamer01/niki-agent/docs/reference/tools-reference) |
| Skills catalog | `niki skills browse` · [Skills catalog](https://github.com/NeGamer01/niki-agent/docs/reference/skills-catalog) |
| Provider setup | `niki model` · [Providers guide](https://github.com/NeGamer01/niki-agent/docs/integrations/providers) |
| Env variables | `niki config env-path` · [Env vars reference](https://github.com/NeGamer01/niki-agent/docs/reference/environment-variables) |
| Gateway logs | `~/.niki/logs/gateway.log` (or `niki logs`) |
| Sessions | `niki sessions browse` (reads state.db) |
