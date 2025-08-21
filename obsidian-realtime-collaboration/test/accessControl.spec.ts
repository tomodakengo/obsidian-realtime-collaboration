import { describe, it, expect } from 'vitest'
import { AccessControl, Permission } from '../src/security/AccessControl'

describe('AccessControl', () => {
	it('adds participants and grants permissions', () => {
		const ac = new AccessControl('folder1', 'Test Folder', 'hash')
		ac.addParticipant('user1')
		ac.grantPermission('user1', Permission.READ)
		expect(ac.hasPermission('user1', Permission.READ)).toBe(true)
	})

	it('revokes permissions correctly', () => {
		const ac = new AccessControl('folder1', 'Test Folder', 'hash')
		ac.addParticipant('user1')
		ac.grantPermission('user1', Permission.WRITE)
		ac.revokePermission('user1', Permission.WRITE)
		expect(ac.hasPermission('user1', Permission.WRITE)).toBe(false)
	})

	it('throws when granting permission to non-participant', () => {
		const ac = new AccessControl('folder1', 'Test Folder', 'hash')
		expect(() => ac.grantPermission('userX', Permission.ADMIN)).toThrow()
	})
})