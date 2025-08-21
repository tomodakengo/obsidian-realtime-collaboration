import { describe, it, expect } from 'vitest'
import { Permission, createSharedFolder } from '../src/security/AccessControl'

describe('AccessControl', () => {
  it('exports Permission enum with ADMIN', () => {
    expect(Permission.ADMIN).toBe('admin')
  })

  it('creates SharedFolder with correct defaults', () => {
    const folder = createSharedFolder({ id: 'id1', name: 'Team', passwordHash: 'hash' })
    expect(folder.id).toBe('id1')
    expect(folder.name).toBe('Team')
    expect(folder.passwordHash).toBe('hash')
    expect(folder.participants instanceof Set).toBe(true)
    expect(folder.permissions instanceof Map).toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import { Permission, createSharedFolder } from '../src/security/AccessControl'

describe('AccessControl', () => {
  it('exports Permission enum with ADMIN', () => {
    expect(Permission.ADMIN).toBe('admin')
  })

  it('creates SharedFolder with correct defaults', () => {
    const folder = createSharedFolder({ id: 'id1', name: 'Team', passwordHash: 'hash' })
    expect(folder.id).toBe('id1')
    expect(folder.name).toBe('Team')
    expect(folder.passwordHash).toBe('hash')
    expect(folder.participants instanceof Set).toBe(true)
    expect(folder.permissions instanceof Map).toBe(true)
  })
})

