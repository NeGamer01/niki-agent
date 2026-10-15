import { describe, expect, it } from 'vitest'

import {
  normalizeNikiOpenString,
  pathFromNikiDeepLink,
  pathFromOpenDeepLink,
  resolveNikiOpenPath
} from './niki-open-target'

describe('normalizeNikiOpenString', () => {
  it('accepts hash-router paths and strips a leading hash', () => {
    expect(normalizeNikiOpenString('/index-network/intent/1')).toBe('/index-network/intent/1')
    expect(normalizeNikiOpenString('#/index-network/intent/1')).toBe('/index-network/intent/1')
  })

  it('maps plugin-scoped niki:// deep links to the same path', () => {
    expect(normalizeNikiOpenString('niki://index-network/intent/1')).toBe('/index-network/intent/1')
    expect(normalizeNikiOpenString('niki://index-network/intent/1?focus=true')).toBe(
      '/index-network/intent/1?focus=true'
    )
  })

  it('maps niki://open/… deep links by stripping the open host', () => {
    expect(normalizeNikiOpenString('niki://open/index-network/intent/1')).toBe('/index-network/intent/1')
    expect(normalizeNikiOpenString('niki://open/settings/plugins')).toBe('/settings/plugins')
  })

  it('rejects reserved niki kinds and unsafe paths', () => {
    expect(normalizeNikiOpenString('niki://blueprint/morning-brief')).toBeNull()
    expect(normalizeNikiOpenString('niki://plugin/install')).toBeNull()
    expect(normalizeNikiOpenString('https://example.com/x')).toBeNull()
    expect(normalizeNikiOpenString('/../etc/passwd')).toBeNull()
    expect(normalizeNikiOpenString('index-network')).toBeNull()
  })
})

describe('resolveNikiOpenPath', () => {
  it('merges structured path + params', () => {
    expect(resolveNikiOpenPath({ path: '/index-network/intent/1', params: { focus: 'true' } })).toBe(
      '/index-network/intent/1?focus=true'
    )
  })

  it('resolves href the same as a bare string', () => {
    expect(resolveNikiOpenPath({ href: 'niki://index-network/intent/1' })).toBe('/index-network/intent/1')
  })
})

describe('pathFromNikiDeepLink', () => {
  it('builds the navigate path from a plugin-scoped deep-link payload', () => {
    expect(pathFromNikiDeepLink('index-network', 'intent/1')).toBe('/index-network/intent/1')
  })

  it('builds the navigate path from niki://open/… payloads', () => {
    expect(pathFromOpenDeepLink('index-network/intent/1')).toBe('/index-network/intent/1')
    expect(pathFromNikiDeepLink('open', 'agent/42')).toBe('/agent/42')
  })

  it('ignores reserved kinds', () => {
    expect(pathFromNikiDeepLink('blueprint', 'morning-brief')).toBeNull()
    expect(pathFromNikiDeepLink('plugin', 'install')).toBeNull()
  })
})
