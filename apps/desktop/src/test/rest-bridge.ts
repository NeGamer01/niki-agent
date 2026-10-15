import { vi } from 'vitest'

import type { NikiApiRequest } from '@/global'

/** Install a fake `window.nikiDesktop.api`, the preload bridge every REST helper sends through. */
export function installRestBridge(answer: (request: NikiApiRequest) => object) {
  const api = vi.fn(async (request: NikiApiRequest) => answer(request))

  Object.defineProperty(window, 'nikiDesktop', { configurable: true, value: { api } })

  return api
}
