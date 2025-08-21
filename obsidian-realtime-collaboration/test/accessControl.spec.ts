import { describe, it, expect } from 'vitest'
import { Permission, type SharedFolder, AccessControl } from '../src/security/AccessControl'

describe('AccessControl', () => {
	it('creates shared folder and manages permissions', () => {
		const ac = new AccessControl()
		const folder: SharedFolder = ac.createSharedFolder('folder-1', 'Team')
		ac.grantPermission(folder.id, 'alice', Permission.WRITE)
		expect(ac.hasPermission(folder.id, 'alice', Permission.WRITE)).toBe(true)
		ac.revokePermission(folder.id, 'alice', Permission.WRITE)
		expect(ac.hasPermission(folder.id, 'alice', Permission.WRITE)).toBe(false)
	})
})