import { contextBridge, ipcRenderer, webFrame, webUtils } from 'electron'

import type { DesktopProfileRoute } from './desktop-profile'
import type { HudModifierApi, HudModifierStatus } from './hud-modifier-types'
import { customWindowControlsEnabled } from './window-controls'

// Which translucency the OS can back. Asked synchronously because the renderer
// needs it before its first paint, and answered by main because deciding it
// needs `os.release()` — a sandboxed preload may only require electron, events,
// timers and url, so importing node:os here throws before contextBridge runs
// and takes the ENTIRE bridge down with it (window.nikiDesktop undefined =>
// "Desktop IPC bridge is unavailable"). No reply means no glass, which degrades
// to an ordinary opaque window rather than a page thinned over nothing.
const translucencySupport = ipcRenderer.sendSync('niki:translucency:support')
const hudWindowing = ipcRenderer.sendSync('niki:hud:windowing')
const hudNativeDrag = hudWindowing?.nativeDrag === true

const launchFlags: { localModels?: boolean; assumeFreshInstall?: boolean } | undefined =
  ipcRenderer.sendSync('niki:feature-flags')

// Local, sanitized skin payload for the first renderer theme paint. This does
// not wait on `gateway.ready`, so an unreachable remote primary cannot force
// the built-in palette over the skin configured on this machine.
const localSkin = ipcRenderer.sendSync('niki:skin:local')

import { unwrapExpectedNotFound } from './api-expected-404'

contextBridge.exposeInMainWorld('nikiDesktop', {
  glassSupported: translucencySupport?.glass === true,
  translucencySupported: translucencySupport?.translucency === true,
  // Launch-flag fact: the app was started with --local, so the renderer may
  // show the local-models surfaces. Static for the window's lifetime.
  localModelsEnabled: launchFlags?.localModels === true,
  // Dev-only launch fact: an unpackaged app started with --fresh-install, so
  // onboarding treats this launch as a fresh install. Always false when packaged.
  assumeFreshInstall: launchFlags?.assumeFreshInstall === true,
  localSkin: localSkin && typeof localSkin === 'object' ? localSkin : null,
  getConnection: (profile, opts) => ipcRenderer.invoke('niki:connection', profile, opts),
  // Loopback origin that hosts YouTube's player for the file:// renderer.
  getEmbedHostOrigin: () => ipcRenderer.invoke('niki:embed-host:origin'),
  // Registry-scoped backend resolution: { connectionId, profile } → descriptor.
  getConnectionFor: payload => ipcRenderer.invoke('niki:connection:for', payload),
  getProfileRoutes: profiles => ipcRenderer.invoke('niki:plugin-profile-routes', profiles),
  revalidateConnection: () => ipcRenderer.invoke('niki:connection:revalidate'),
  getGatewayWsUrl: profile => ipcRenderer.invoke('niki:gateway:ws-url', profile),
  // Registry-scoped fresh WS URL: { connectionId, profile } → result shape of
  // getGatewayWsUrl, minted against that connection's backend.
  getGatewayWsUrlFor: payload => ipcRenderer.invoke('niki:gateway:ws-url-for', payload),
  // Union agent roster across every registered connection.
  getAgentRoster: () => ipcRenderer.invoke('niki:agents:roster'),
  openSessionWindow: (sessionId, opts) => ipcRenderer.invoke('niki:window:openSession', sessionId, opts),
  openSessionInTerminal: (sessionId, opts) => ipcRenderer.invoke('niki:window:openInTerminal', sessionId, opts),
  openWindow: (options?: DesktopProfileRoute) => ipcRenderer.invoke('niki:window:openInstance', options),
  openBrowserWindow: tabId => ipcRenderer.invoke('niki:window:openBrowser', tabId),
  windowRelay: {
    send: payload => ipcRenderer.send('niki:window:relay', payload),
    onMessage: callback => {
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on('niki:window:relay', listener)

      return () => ipcRenderer.removeListener('niki:window:relay', listener)
    }
  },
  onBrowserPopoutClosed: callback => {
    const listener = (_event, tabId) => callback(tabId)
    ipcRenderer.on('niki:browser-popout:closed', listener)

    return () => ipcRenderer.removeListener('niki:browser-popout:closed', listener)
  },
  claimAmbientCue: key => ipcRenderer.invoke('niki:ambient:claim', key),
  windowControls: {
    custom: customWindowControlsEnabled(),
    minimize: () => ipcRenderer.send('niki:window-control', 'minimize'),
    toggleMaximize: () => ipcRenderer.send('niki:window-control', 'toggle-maximize'),
    close: () => ipcRenderer.send('niki:window-control', 'close')
  },
  wakeIndicator: {
    getState: () => ipcRenderer.invoke('niki:wake-indicator:get'),
    setState: state => ipcRenderer.send('niki:wake-indicator:set', state),
    onState: callback => {
      const listener = (_event, state) => callback(state)
      ipcRenderer.on('niki:wake-indicator:state', listener)

      return () => ipcRenderer.removeListener('niki:wake-indicator:state', listener)
    }
  },
  chatOnboarding: {
    size: mode => ipcRenderer.send('niki:window:size', mode)
  },
  petOverlay: {
    // Main renderer → main process: window lifecycle + drag. `request` is
    // `{ bounds, screen }`; resolves with the screen bounds it actually used.
    open: request => ipcRenderer.invoke('niki:pet-overlay:open', request),
    close: () => ipcRenderer.invoke('niki:pet-overlay:close'),
    setBounds: bounds => ipcRenderer.send('niki:pet-overlay:set-bounds', bounds),
    setIgnoreMouse: ignore => ipcRenderer.send('niki:pet-overlay:ignore-mouse', ignore),
    // Flip the overlay focusable (and focus it) while the composer needs keys.
    setFocusable: focusable => ipcRenderer.send('niki:pet-overlay:set-focusable', focusable),
    // Main renderer → overlay (forwarded by main): push the latest pet state.
    pushState: payload => ipcRenderer.send('niki:pet-overlay:state', payload),
    // Overlay → main renderer (forwarded by main): pop back in / composer submit.
    control: payload => ipcRenderer.send('niki:pet-overlay:control', payload),
    // Overlay subscribes to state pushes.
    onState: callback => {
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on('niki:pet-overlay:state', listener)

      return () => ipcRenderer.removeListener('niki:pet-overlay:state', listener)
    },
    // Main renderer subscribes to overlay control messages.
    onControl: callback => {
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on('niki:pet-overlay:control', listener)

      return () => ipcRenderer.removeListener('niki:pet-overlay:control', listener)
    }
  },
  // HUD mode: the chrome-free floating chat. A full app renderer (own gateway)
  // sized as a floating bar, so it mounts the real composer. Main owns the
  // window; `onChanged` keeps every window's toggle truthful.
  hud: {
    nativeDrag: hudNativeDrag,
    windowing: {
      clientPlacement: hudWindowing?.clientPlacement !== false,
      controlDrag: hudWindowing?.controlDrag === true,
      nativeDrag: hudNativeDrag,
      solid: hudWindowing?.solid === true,
      workspaceTransfer: hudWindowing?.workspaceTransfer === true
    },
    open: request => ipcRenderer.invoke('niki:hud:open', request),
    close: () => ipcRenderer.invoke('niki:hud:close'),
    setIgnoreMouse: ignore => ipcRenderer.send('niki:hud:ignore-mouse', ignore),
    beginMove: () => ipcRenderer.send('niki:hud:begin-move'),
    endMove: () => ipcRenderer.send('niki:hud:end-move'),
    moveBy: delta => ipcRenderer.send('niki:hud:move-by', delta),
    setWorkspaceTransfer: transferring => ipcRenderer.send('niki:hud:workspace-transfer', transferring),
    setBounds: bounds => ipcRenderer.send('niki:hud:set-bounds', bounds),
    resetLayout: () => ipcRenderer.invoke('niki:hud:reset-layout'),
    // Whether the band covers the window below the bar. Main pairs it with the
    // user's translucency setting to decide the native frost (macOS vibrancy /
    // Windows 11 DWM backdrop) — see hudFrostFor.
    setFrost: showing => ipcRenderer.invoke('niki:hud:frost', showing),
    // The HUD tells main which session it is on; main hands that back to the
    // app window when the HUD closes, so the app can re-home onto it.
    setSession: sessionId => ipcRenderer.send('niki:hud:session', sessionId),
    onGoto: callback => {
      const listener = (_event, sessionId) => callback(sessionId)
      ipcRenderer.on('niki:hud:goto', listener)

      return () => ipcRenderer.removeListener('niki:hud:goto', listener)
    },
    onChanged: callback => {
      const listener = (_event, state) => callback(state)
      ipcRenderer.on('niki:hud:changed', listener)

      return () => ipcRenderer.removeListener('niki:hud:changed', listener)
    },
    // Linux only, and silent elsewhere: where the cursor is, in page
    // coordinates, or null when it has left the window. Stands in for the
    // mousemove that `setIgnoreMouseEvents(true, { forward: true })` delivers on
    // macOS and Windows but not here.
    onCursor: callback => {
      const listener = (_event, point) => callback(point)
      ipcRenderer.on('niki:hud:cursor', listener)

      return () => ipcRenderer.removeListener('niki:hud:cursor', listener)
    },
    // Main's game-overlay watch: whether a fullscreen app (a game) is under
    // the HUD, so the renderer can step back to the low-opacity overlay
    // treatment while one owns the screen.
    onGameOverlay: callback => {
      const listener = (_event, state) => callback(state)
      ipcRenderer.on('niki:hud:game-overlay', listener)

      return () => ipcRenderer.removeListener('niki:hud:game-overlay', listener)
    }
  },
  hudModifier: {
    getSettings: () => ipcRenderer.invoke('niki:hud-modifier:settings:get'),
    setEnabled: enabled => ipcRenderer.invoke('niki:hud-modifier:settings:set', enabled),
    openPermissionSettings: () => ipcRenderer.invoke('niki:hud-modifier:permission'),
    onStatus: callback => {
      const listener = (_event: Electron.IpcRendererEvent, status: HudModifierStatus) => callback(status)
      ipcRenderer.on('niki:hud-modifier:status', listener)

      return () => ipcRenderer.removeListener('niki:hud-modifier:status', listener)
    }
  } satisfies HudModifierApi,
  // macOS native screenshot gesture; captures require a main-issued request.
  screenshot:
    process.platform === 'darwin'
      ? {
          getSettings: () => ipcRenderer.invoke('niki:screenshot:settings:get'),
          setEnabled: enabled => ipcRenderer.invoke('niki:screenshot:settings:set', enabled),
          openPermissionSettings: kind => ipcRenderer.invoke('niki:screenshot:permission', kind),
          capture: requestId => ipcRenderer.invoke('niki:screenshot:capture', requestId),
          onStatus: callback => {
            const listener = (_event, status) => callback(status)
            ipcRenderer.on('niki:screenshot:status', listener)

            return () => ipcRenderer.removeListener('niki:screenshot:status', listener)
          },
          onRequest: callback => {
            const channel = 'niki:screenshot:request'
            const listener = (_event, requestId) => callback(requestId)

            if (ipcRenderer.listenerCount(channel) === 0) {
              ipcRenderer.send('niki:screenshot:subscribe', true)
            }

            ipcRenderer.on(channel, listener)

            return () => {
              ipcRenderer.removeListener(channel, listener)

              if (ipcRenderer.listenerCount(channel) === 0) {
                ipcRenderer.send('niki:screenshot:subscribe', false)
              }
            }
          }
        }
      : undefined,
  // Quick Entry: the global-hotkey mini composer window. Main owns the OS
  // shortcut + the persisted preference; the quick window only captures text
  // and hands it back, and the primary renderer submits it through the normal
  // prompt path.
  quickEntry: {
    getSettings: () => ipcRenderer.invoke('niki:quick-entry:settings:get'),
    setSettings: patch => ipcRenderer.invoke('niki:quick-entry:settings:set', patch),
    // Invoke returns the delivery result so the draft is not lost (#85590).
    submit: payload => ipcRenderer.invoke('niki:quick-entry:submit', payload),
    // Main cannot invoke the primary renderer, so it receives this ack (#85590).
    ackSubmit: (correlationId, result) => ipcRenderer.send('niki:quick-entry:ack', { correlationId, result }),
    dismiss: () => ipcRenderer.send('niki:quick-entry:dismiss'),
    // Primary renderer → main → quick window: gateway connection state + the
    // recent-session options the target picker offers. Main caches the latest
    // payload so a freshly spawned quick window starts from truth.
    pushState: payload => ipcRenderer.send('niki:quick-entry:state', payload),
    // Quick window subscribes to those pushes.
    onState: callback => {
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on('niki:quick-entry:state', listener)

      return () => ipcRenderer.removeListener('niki:quick-entry:state', listener)
    },
    // Main → primary renderer: a submit captured by the quick window.
    onSubmit: callback => {
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on('niki:quick-entry:submit', listener)

      return () => ipcRenderer.removeListener('niki:quick-entry:submit', listener)
    },
    // Main → quick window: you were just summoned (reset draft + refocus).
    onShown: callback => {
      const listener = () => callback()
      ipcRenderer.on('niki:quick-entry:shown', listener)

      return () => ipcRenderer.removeListener('niki:quick-entry:shown', listener)
    },
    // Main → quick window: the outcome of a submit whose relay already timed
    // out. Delivery is now KNOWN — reconcile the unknown state instead of
    // leaving the user to resend a prompt that may already be delivered.
    onLateResult: callback => {
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on('niki:quick-entry:late-result', listener)

      return () => ipcRenderer.removeListener('niki:quick-entry:late-result', listener)
    }
  },
  getBootProgress: () => ipcRenderer.invoke('niki:boot-progress:get'),
  getConnectionConfig: profile => ipcRenderer.invoke('niki:connection-config:get', profile),
  saveConnectionConfig: payload => ipcRenderer.invoke('niki:connection-config:save', payload),
  applyConnectionConfig: payload => ipcRenderer.invoke('niki:connection-config:apply', payload),
  testConnectionConfig: payload => ipcRenderer.invoke('niki:connection-config:test', payload),
  // Opt-in OS-keychain encryption for stored gateway secrets (default off —
  // see secret-storage-policy.ts). get never touches the OS keychain.
  getSecretStorageEncryption: () => ipcRenderer.invoke('niki:secret-storage:get'),
  setSecretStorageEncryption: (on: boolean) => ipcRenderer.invoke('niki:secret-storage:set', on),
  // v2 multi-connection registry: named agent sources (local / remote / cloud / ssh).
  connections: {
    list: () => ipcRenderer.invoke('niki:connections:list'),
    save: payload => ipcRenderer.invoke('niki:connections:save', payload),
    remove: id => ipcRenderer.invoke('niki:connections:remove', id),
    setPrimary: id => ipcRenderer.invoke('niki:connections:set-primary', id),
    setLaunchMode: mode => ipcRenderer.invoke('niki:connections:set-launch-mode', mode),
    setLastUsed: id => ipcRenderer.invoke('niki:connections:set-last-used', id),
    test: id => ipcRenderer.invoke('niki:connections:test', id),
    updateManaged: id => ipcRenderer.invoke('niki:connections:update-managed', id),
    // Fan out `niki update` to every eligible registered connection.
    // Optional excludeIds skips rows the caller updates through another path.
    updateAll: options => ipcRenderer.invoke('niki:connections:update-all', options),
    // Registry lifecycle push (main → renderer): a connection was removed or
    // materially edited, so secondaries scoped to it must be disposed (and,
    // for edits, re-dialed at the new target).
    onChanged: callback => {
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on('niki:connections:changed', listener)

      return () => ipcRenderer.removeListener('niki:connections:changed', listener)
    }
  },
  sshConfigHosts: () => ipcRenderer.invoke('niki:ssh-config:hosts'),
  sshResolveHost: host => ipcRenderer.invoke('niki:ssh-config:resolve', host),
  probeConnectionConfig: remoteUrl => ipcRenderer.invoke('niki:connection-config:probe', remoteUrl),
  // `options` lets a registry-editor draft sign in BEFORE it is saved: the
  // main process settles the draft's connection id up front so the login
  // window writes into the per-connection cookie jar the saved entry will
  // read (not the legacy shared jar an unsaved URL would fall back to).
  oauthLoginConnectionConfig: (remoteUrl, options) =>
    ipcRenderer.invoke('niki:connection-config:oauth-login', remoteUrl, options),
  oauthLogoutConnectionConfig: remoteUrl => ipcRenderer.invoke('niki:connection-config:oauth-logout', remoteUrl),
  // Niki Cloud: one portal login powers discovery + silent per-agent sign-in
  // (cloud-auto-discovery Phase 3).
  cloud: {
    status: () => ipcRenderer.invoke('niki:cloud:status'),
    login: () => ipcRenderer.invoke('niki:cloud:login'),
    logout: () => ipcRenderer.invoke('niki:cloud:logout'),
    discover: org => ipcRenderer.invoke('niki:cloud:discover', org),
    agentSignIn: dashboardUrl => ipcRenderer.invoke('niki:cloud:agent-sign-in', dashboardUrl)
  },
  profile: {
    getDefault: () => ipcRenderer.invoke('niki:profile:default:get'),
    setDefault: (route: DesktopProfileRoute) => ipcRenderer.invoke('niki:profile:default:set', route),
    onDefaultChanged: (callback: (route: DesktopProfileRoute | null) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, route: DesktopProfileRoute | null) => callback(route)
      ipcRenderer.on('niki:profile:default:changed', listener)

      return () => ipcRenderer.removeListener('niki:profile:default:changed', listener)
    },
    get: () => ipcRenderer.invoke('niki:profile:get'),
    remember: name => ipcRenderer.invoke('niki:profile:remember', name),
    set: name => ipcRenderer.invoke('niki:profile:set', name)
  },
  // The handler resolves an expected 404 with a sentinel instead of rejecting
  // (Electron logs a stack for every rejected invoke). Turn it back into the
  // rejection the renderer expects — see electron/api-expected-404.ts.
  api: request => ipcRenderer.invoke('niki:api', request).then(unwrapExpectedNotFound),
  notify: payload => ipcRenderer.invoke('niki:notify', payload),
  claimStartupLatency: () => ipcRenderer.invoke('niki:startup-latency:claim'),
  requestMicrophoneAccess: () => ipcRenderer.invoke('niki:requestMicrophoneAccess'),
  readWindowBelow: () => ipcRenderer.invoke('niki:window:readBelow'),
  readFileDataUrl: filePath => ipcRenderer.invoke('niki:readFileDataUrl', filePath),
  readFileDataUrlForAttach: filePath => ipcRenderer.invoke('niki:readFileDataUrlForAttach', filePath),
  dataUrlReadMax: {
    get: () => ipcRenderer.invoke('niki:data-url-read-max:get'),
    set: maxMb => ipcRenderer.invoke('niki:data-url-read-max:set', maxMb)
  },
  readFileText: filePath => ipcRenderer.invoke('niki:readFileText', filePath),
  readPluginSource: (filePath: string) => ipcRenderer.invoke('niki:readPluginSource', filePath),
  selectPaths: options => ipcRenderer.invoke('niki:selectPaths', options),
  selectSavePath: options => ipcRenderer.invoke('niki:selectSavePath', options),
  writeClipboard: text => ipcRenderer.invoke('niki:writeClipboard', text),
  readClipboard: () => ipcRenderer.invoke('niki:readClipboard'),
  saveGatewayFile: payload => ipcRenderer.invoke('niki:saveGatewayFile', payload),
  saveImageFromUrl: url => ipcRenderer.invoke('niki:saveImageFromUrl', url),
  contextMenuEdit: command => ipcRenderer.invoke('niki:context-menu:edit', command),
  contextMenuCopyImage: () => ipcRenderer.invoke('niki:context-menu:copy-image'),
  contextMenuSpellcheck: action => ipcRenderer.invoke('niki:context-menu:spellcheck', action),
  contextMenuGuestAddWord: payload => ipcRenderer.invoke('niki:context-menu:guest-add-word', payload),
  onContextMenuSpellcheck: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('niki:context-menu-spellcheck', listener)

    return () => ipcRenderer.removeListener('niki:context-menu-spellcheck', listener)
  },
  saveImageBuffer: (data, ext, name) => ipcRenderer.invoke('niki:saveImageBuffer', { data, ext, name }),
  capturePreview: payload => ipcRenderer.invoke('niki:capturePreview', payload),
  savePastedText: text => ipcRenderer.invoke('niki:savePastedText', { text }),
  saveClipboardImage: () => ipcRenderer.invoke('niki:saveClipboardImage'),
  getPathForFile: file => {
    try {
      return webUtils.getPathForFile(file) || ''
    } catch {
      return ''
    }
  },
  normalizePreviewTarget: (target, baseDir) => ipcRenderer.invoke('niki:normalizePreviewTarget', target, baseDir),
  watchPreviewFile: url => ipcRenderer.invoke('niki:watchPreviewFile', url),
  watchDirectory: dir => ipcRenderer.invoke('niki:watchDirectory', dir),
  stopPreviewFileWatch: id => ipcRenderer.invoke('niki:stopPreviewFileWatch', id),
  setActiveWork: payload => ipcRenderer.send('niki:active-work', payload),
  setTitleBarTheme: payload => ipcRenderer.send('niki:titlebar-theme', payload),
  setNativeTheme: mode => ipcRenderer.send('niki:native-theme', mode),
  setTranslucency: payload => ipcRenderer.send('niki:translucency', payload),
  setKeepAwake: mode => ipcRenderer.send('niki:keep-awake', mode),
  minimizeToTray: {
    get: () => ipcRenderer.invoke('niki:minimize-to-tray:get'),
    set: on => ipcRenderer.invoke('niki:minimize-to-tray:set', on),
    onChanged: callback => {
      const listener = (_event, status) => callback(status)
      ipcRenderer.on('niki:minimize-to-tray:changed', listener)

      return () => ipcRenderer.removeListener('niki:minimize-to-tray:changed', listener)
    }
  },
  setDisableF12: blocked => ipcRenderer.send('niki:devtools:disable-f12', blocked),
  setF12ShortcutActive: active => ipcRenderer.send('niki:f12ShortcutActive', Boolean(active)),
  onF12Shortcut: callback => {
    const listener = (_event, input) => callback(input)
    ipcRenderer.on('niki:f12-shortcut', listener)

    return () => ipcRenderer.removeListener('niki:f12-shortcut', listener)
  },
  setPreviewShortcutActive: active => ipcRenderer.send('niki:previewShortcutActive', Boolean(active)),
  setPreviewGuestHidden: (webContentsId, hidden) =>
    ipcRenderer.send('niki:preview-guest-hidden', { webContentsId, hidden: Boolean(hidden) }),
  openExternal: url => ipcRenderer.invoke('niki:openExternal', url),
  freeTierChallenge: {
    // Load the account service's challenge page in a hidden window (revealed
    // only if the page asks for the human). Resolves with how it ended.
    run: request => ipcRenderer.invoke('niki:freeTierChallenge:run', request)
  },
  mcpOauth: {
    // One-shot loopback listener for MCP OAuth against remote backends: bind
    // on this machine, hand redirectUri to mcp.servers.oauth.start, then wait
    // for the provider redirect and relay code/state via oauth.callback.
    listen: () => ipcRenderer.invoke('niki:mcp-oauth:listen'),
    wait: (id, timeoutMs) => ipcRenderer.invoke('niki:mcp-oauth:wait', id, timeoutMs),
    cancel: id => ipcRenderer.invoke('niki:mcp-oauth:cancel', id)
  },
  openPreviewInBrowser: url => ipcRenderer.invoke('niki:openPreviewInBrowser', url),
  reachPreviewUrl: url => ipcRenderer.invoke('niki:preview:reach', url),
  setActiveConnectionRoute: route => ipcRenderer.send('niki:connection:active-route', route),
  fetchLinkTitle: url => ipcRenderer.invoke('niki:fetchLinkTitle', url),
  resolveFavicon: url => ipcRenderer.invoke('niki:resolveFavicon', url),
  sanitizeWorkspaceCwd: cwd => ipcRenderer.invoke('niki:workspace:sanitize', cwd),
  settings: {
    getDefaultProjectDir: () => ipcRenderer.invoke('niki:setting:defaultProjectDir:get'),
    setDefaultProjectDir: dir => ipcRenderer.invoke('niki:setting:defaultProjectDir:set', dir),
    pickDefaultProjectDir: () => ipcRenderer.invoke('niki:setting:defaultProjectDir:pick')
  },
  preparedSubmissions: {
    read: () => ipcRenderer.invoke('niki:prepared-submissions:read'),
    update: (key, entry) => ipcRenderer.invoke('niki:prepared-submissions:update', key, entry),
    compareAndSet: (key, expected, entry) =>
      ipcRenderer.invoke('niki:prepared-submissions:compare-and-set', key, expected, entry)
  },
  zoom: {
    // Current zoom of this window, as { level, percent }.
    get: () => ipcRenderer.invoke('niki:zoom:get'),
    // Synchronous zoom factor (1 = 100%). Coordinate math needs it in the
    // same tick as the event it converts, so no IPC round-trip here.
    factor: () => webFrame.getZoomFactor(),
    setPercent: percent => ipcRenderer.send('niki:zoom:set-percent', percent),
    // Fires on every zoom change, including the Ctrl/Cmd +/-/0 shortcuts,
    // so the settings UI can stay in sync with the keyboard.
    onChanged: callback => {
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on('niki:zoom:changed', listener)

      return () => ipcRenderer.removeListener('niki:zoom:changed', listener)
    }
  },
  revealLogs: () => ipcRenderer.invoke('niki:logs:reveal'),
  getRecentLogs: () => ipcRenderer.invoke('niki:logs:recent'),
  // Fire-and-forget: persists a renderer error-boundary catch (with component
  // stack) to desktop.log so crashes survive the window (#79428).
  reportRendererError: report => ipcRenderer.send('niki:logs:renderer-error', report),
  logLine: (line: string): void => ipcRenderer.send('niki:logs:renderer-line', line),
  readDir: dirPath => ipcRenderer.invoke('niki:fs:readDir', dirPath),
  gitRoot: startPath => ipcRenderer.invoke('niki:fs:gitRoot', startPath),
  revealPath: targetPath => ipcRenderer.invoke('niki:fs:reveal', targetPath),
  openDir: dirPath => ipcRenderer.invoke('niki:fs:openDir', dirPath),
  desktopPluginsRoot: () => ipcRenderer.invoke('niki:fs:desktopPluginsRoot'),
  reconcileDesktopPlugins: () => ipcRenderer.invoke('niki:fs:reconcileDesktopPlugins'),
  logsRoot: (profile?: string) => ipcRenderer.invoke('niki:fs:logsRoot', profile),
  renamePath: (targetPath, newName) => ipcRenderer.invoke('niki:fs:rename', targetPath, newName),
  writeTextFile: (filePath, content) => ipcRenderer.invoke('niki:fs:writeText', filePath, content),
  trashPath: targetPath => ipcRenderer.invoke('niki:fs:trash', targetPath),
  git: {
    worktreeList: repoPath => ipcRenderer.invoke('niki:git:worktreeList', repoPath),
    worktreeAdd: (repoPath, options) => ipcRenderer.invoke('niki:git:worktreeAdd', repoPath, options),
    worktreeRemove: (repoPath, worktreePath, options) =>
      ipcRenderer.invoke('niki:git:worktreeRemove', repoPath, worktreePath, options),
    branchSwitch: (repoPath, branch) => ipcRenderer.invoke('niki:git:branchSwitch', repoPath, branch),
    branchList: repoPath => ipcRenderer.invoke('niki:git:branchList', repoPath),
    baseBranchList: repoPath => ipcRenderer.invoke('niki:git:baseBranchList', repoPath),
    repoStatus: repoPath => ipcRenderer.invoke('niki:git:repoStatus', repoPath),
    fileDiff: (repoPath, filePath) => ipcRenderer.invoke('niki:git:fileDiff', repoPath, filePath),
    scanRepos: (roots, options) => ipcRenderer.invoke('niki:git:scanRepos', roots, options),
    review: {
      list: (repoPath, scope, baseRef) => ipcRenderer.invoke('niki:git:review:list', repoPath, scope, baseRef),
      diff: (repoPath, filePath, scope, baseRef, staged) =>
        ipcRenderer.invoke('niki:git:review:diff', repoPath, filePath, scope, baseRef, staged),
      stage: (repoPath, filePath) => ipcRenderer.invoke('niki:git:review:stage', repoPath, filePath),
      unstage: (repoPath, filePath) => ipcRenderer.invoke('niki:git:review:unstage', repoPath, filePath),
      revert: (repoPath, filePath) => ipcRenderer.invoke('niki:git:review:revert', repoPath, filePath),
      revParse: (repoPath, ref) => ipcRenderer.invoke('niki:git:review:revParse', repoPath, ref),
      commit: (repoPath, message, push) => ipcRenderer.invoke('niki:git:review:commit', repoPath, message, push),
      commitContext: repoPath => ipcRenderer.invoke('niki:git:review:commitContext', repoPath),
      push: repoPath => ipcRenderer.invoke('niki:git:review:push', repoPath),
      shipInfo: repoPath => ipcRenderer.invoke('niki:git:review:shipInfo', repoPath),
      prList: (repoPath, branches, numbers) =>
        ipcRenderer.invoke('niki:git:review:prList', repoPath, branches, numbers),
      createPr: repoPath => ipcRenderer.invoke('niki:git:review:createPr', repoPath)
    }
  },
  terminal: {
    attach: id => ipcRenderer.invoke('niki:terminal:attach', id),
    cwd: id => ipcRenderer.invoke('niki:terminal:cwd', id),
    dispose: id => ipcRenderer.invoke('niki:terminal:dispose', id),
    resize: (id, size) => ipcRenderer.invoke('niki:terminal:resize', id, size),
    start: options => ipcRenderer.invoke('niki:terminal:start', options),
    write: (id, data) => ipcRenderer.invoke('niki:terminal:write', id, data),
    onData: (id, callback) => {
      const channel = `niki:terminal:${id}:data`
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on(channel, listener)

      return () => ipcRenderer.removeListener(channel, listener)
    },
    onExit: (id, callback) => {
      const channel = `niki:terminal:${id}:exit`
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on(channel, listener)

      return () => ipcRenderer.removeListener(channel, listener)
    }
  },
  onClosePreviewRequested: callback => {
    const listener = () => callback()
    ipcRenderer.on('niki:close-preview-requested', listener)

    return () => ipcRenderer.removeListener('niki:close-preview-requested', listener)
  },
  onPreviewNav: callback => {
    const listener = (_event, command) => callback(command)
    ipcRenderer.on('niki:preview-nav', listener)

    return () => ipcRenderer.removeListener('niki:preview-nav', listener)
  },
  onOpenFolderRequested: callback => {
    const listener = () => callback()
    ipcRenderer.on('niki:open-folder-requested', listener)

    return () => ipcRenderer.removeListener('niki:open-folder-requested', listener)
  },
  onOpenUpdatesRequested: callback => {
    const listener = () => callback()
    ipcRenderer.on('niki:open-updates', listener)

    return () => ipcRenderer.removeListener('niki:open-updates', listener)
  },
  onDeepLink: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('niki:deep-link', listener)

    return () => ipcRenderer.removeListener('niki:deep-link', listener)
  },
  signalDeepLinkReady: () => ipcRenderer.invoke('niki:deep-link-ready'),
  probePluginRepo: payload => ipcRenderer.invoke('niki:plugin:probe', payload),
  installDesktopPlugin: payload => ipcRenderer.invoke('niki:plugin:installDesktop', payload),
  removeDesktopPlugin: payload => ipcRenderer.invoke('niki:plugin:removeDesktop', payload),
  onWindowStateChanged: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('niki:window-state-changed', listener)

    return () => ipcRenderer.removeListener('niki:window-state-changed', listener)
  },
  onFocusSession: callback => {
    const listener = (_event, sessionId) => callback(sessionId)
    ipcRenderer.on('niki:focus-session', listener)

    return () => ipcRenderer.removeListener('niki:focus-session', listener)
  },
  onNotificationAction: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('niki:notification-action', listener)

    return () => ipcRenderer.removeListener('niki:notification-action', listener)
  },
  onNotificationActivate: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('niki:notification-activate', listener)

    return () => ipcRenderer.removeListener('niki:notification-activate', listener)
  },
  onExternalOpenFailed: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('niki:external-open-failed', listener)

    return () => ipcRenderer.removeListener('niki:external-open-failed', listener)
  },
  onPreviewFileChanged: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('niki:preview-file-changed', listener)

    return () => ipcRenderer.removeListener('niki:preview-file-changed', listener)
  },
  onBackendExit: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('niki:backend-exit', listener)

    return () => ipcRenderer.removeListener('niki:backend-exit', listener)
  },
  // Soft gateway-mode apply finished tearing down the primary backend. Renderer
  // should wipe session lists + re-dial without a window reload.
  onConnectionApplied: callback => {
    const listener = () => callback()
    ipcRenderer.on('niki:connection:applied', listener)

    return () => ipcRenderer.removeListener('niki:connection:applied', listener)
  },
  onPowerResume: callback => {
    const listener = () => callback()
    ipcRenderer.on('niki:power-resume', listener)

    return () => ipcRenderer.removeListener('niki:power-resume', listener)
  },
  // AC ↔ battery transitions; renderers slow their backstop polls on battery.
  getOnBattery: () => ipcRenderer.invoke('niki:power-battery:get'),
  onBatteryChanged: callback => {
    const listener = (_event, onBattery) => callback(Boolean(onBattery))
    ipcRenderer.on('niki:power-battery', listener)

    return () => ipcRenderer.removeListener('niki:power-battery', listener)
  },
  onBootProgress: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('niki:boot-progress', listener)

    return () => ipcRenderer.removeListener('niki:boot-progress', listener)
  },
  // First-launch bootstrap progress -- emitted by the install.ps1 stage
  // runner in main.ts (apps/desktop/electron/bootstrap-runner.ts).
  // Renderer's install overlay subscribes to live events and queries the
  // current snapshot via getBootstrapState() to recover after a devtools
  // reload mid-bootstrap.
  getBootstrapState: () => ipcRenderer.invoke('niki:bootstrap:get'),
  probeLocalBackend: () => ipcRenderer.invoke('niki:local-backend:probe'),
  continueBootstrapLocal: () => ipcRenderer.invoke('niki:bootstrap:continue-local'),
  recycleBackend: profile => ipcRenderer.invoke('niki:backend:recycle', profile),
  resetBootstrap: () => ipcRenderer.invoke('niki:bootstrap:reset'),
  updateHold: {
    recheck: () => ipcRenderer.invoke('niki:update-hold:recheck'),
    quit: () => ipcRenderer.invoke('niki:update-hold:quit'),
    startAnyway: (request: { holdId: string; confirmed: true }) =>
      ipcRenderer.invoke('niki:update-hold:start-anyway', request)
  },
  repairBootstrap: () => ipcRenderer.invoke('niki:bootstrap:repair'),
  cancelBootstrap: () => ipcRenderer.invoke('niki:bootstrap:cancel'),
  onBootstrapEvent: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('niki:bootstrap:event', listener)

    return () => ipcRenderer.removeListener('niki:bootstrap:event', listener)
  },
  getVersion: () => ipcRenderer.invoke('niki:version'),
  relaunchApp: () => ipcRenderer.invoke('niki:app:relaunch'),
  getMachineProfile: () => ipcRenderer.invoke('niki:machine:profile'),
  getRemoteDisplayReason: () => ipcRenderer.invoke('niki:get-remote-display-reason'),
  uninstall: {
    summary: () => ipcRenderer.invoke('niki:uninstall:summary'),
    run: mode => ipcRenderer.invoke('niki:uninstall:run', { mode }),
    openAppsSettings: () => ipcRenderer.invoke('niki:uninstall:openAppsSettings')
  },
  updates: {
    check: opts => ipcRenderer.invoke('niki:updates:check', opts),
    apply: opts => ipcRenderer.invoke('niki:updates:apply', opts),
    setChannel: name => ipcRenderer.invoke('niki:updates:channel:set', name),
    onProgress: callback => {
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on('niki:updates:progress', listener)

      return () => ipcRenderer.removeListener('niki:updates:progress', listener)
    },
    takePendingRun: () => ipcRenderer.invoke('niki:updates:metric:take'),
    ackPendingRun: sent => ipcRenderer.invoke('niki:updates:metric:ack', sent),
    onPendingRun: callback => {
      const listener = () => callback()
      ipcRenderer.on('niki:updates:metric:pending', listener)

      return () => ipcRenderer.removeListener('niki:updates:metric:pending', listener)
    }
  },
  desktopMetrics: {
    setEnabled: (on, profile) => ipcRenderer.invoke('niki:desktop-metrics:set-enabled', on, profile),
    takeRendererCrashes: () => ipcRenderer.invoke('niki:desktop-metrics:crash:take'),
    ackRendererCrashes: sent => ipcRenderer.invoke('niki:desktop-metrics:crash:ack', sent)
  },
  themes: {
    fetchMarketplace: id => ipcRenderer.invoke('niki:vscode-theme:fetch', id),
    searchMarketplace: query => ipcRenderer.invoke('niki:vscode-theme:search', query)
  },
  // Find-in-page (Ctrl/Cmd+F): delegates to Electron's
  // webContents.findInPage on the IPC sender's window so a Cmd+F pressed
  // in a secondary session window searches THAT window, not the primary.
  // `onFoundInPage` returns the unsubscribe fn; the renderer wires it via
  // `initFindInPageListener` in store/find-in-page.ts and tears it down
  // when the FindBar unmounts.
  findInPage: (query, options) => ipcRenderer.invoke('niki:find-in-page', query, options),
  stopFindInPage: () => ipcRenderer.invoke('niki:stop-find-in-page'),
  onFoundInPage: callback => {
    const listener = (_event, result) => callback(result)
    ipcRenderer.on('niki:found-in-page', listener)

    return () => ipcRenderer.removeListener('niki:found-in-page', listener)
  },
  // Main-process `before-input-event` forwards Ctrl/Cmd+F here so renderer
  // can open the FindBar even when the GTK compositor has already grabbed
  // the chord at the windowing layer (#81727).
  onOpenFindBarRequested: callback => {
    const listener = () => callback()
    ipcRenderer.on('niki:open-find-bar', listener)

    return () => ipcRenderer.removeListener('niki:open-find-bar', listener)
  }
})
