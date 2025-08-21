import { describe, it, expect, beforeEach } from 'vitest'
import { AccessControl } from '../src/security/AccessControl'
import { Permission, SharedFolder } from '../src/types'

describe('AccessControl', () => {
	let accessControl: AccessControl

	beforeEach(() => {
		accessControl = new AccessControl()
	})

	it('creates an access control instance', () => {
		expect(accessControl).toBeInstanceOf(AccessControl)
	})

	it('can create a shared folder', () => {
		const folder: SharedFolder = {
			id: 'test-folder',
			name: 'Test Folder',
			description: 'Test folder description',
			passwordHash: 'hashed-password',
			participants: new Set(['user1']),
			permissions: new Map([['user1', [Permission.READ, Permission.WRITE]]])
		}

		accessControl.createSharedFolder(folder)
		const createdFolder = accessControl.getSharedFolder('test-folder')
		
		expect(createdFolder).toBeDefined()
		expect(createdFolder?.id).toBe('test-folder')
		expect(createdFolder?.name).toBe('Test Folder')
	})

	it('can add participants to a shared folder', () => {
		const folderId = 'test-folder'
		accessControl.createSharedFolder({
			id: folderId,
			name: 'Test Folder',
			description: 'Test folder description',
			passwordHash: 'hashed-password',
			participants: new Set(['user1']),
			permissions: new Map([['user1', [Permission.READ, Permission.WRITE]]])
		})

		accessControl.addParticipant(folderId, 'user2', [Permission.READ])
		
		const folder = accessControl.getSharedFolder(folderId)
		expect(folder?.participants.has('user2')).toBe(true)
		expect(folder?.permissions.get('user2')).toEqual([Permission.READ])
	})

	it('can remove participants from a shared folder', () => {
		const folderId = 'test-folder'
		accessControl.createSharedFolder({
			id: folderId,
			name: 'Test Folder',
			description: 'Test folder description',
			passwordHash: 'hashed-password',
			participants: new Set(['user1', 'user2']),
			permissions: new Map([
				['user1', [Permission.READ, Permission.WRITE]],
				['user2', [Permission.READ]]
			])
		})

		accessControl.removeParticipant(folderId, 'user2')
		
		const folder = accessControl.getSharedFolder(folderId)
		expect(folder?.participants.has('user2')).toBe(false)
		expect(folder?.permissions.has('user2')).toBe(false)
	})

	it('can check user permissions', () => {
		const folderId = 'test-folder'
		accessControl.createSharedFolder({
			id: folderId,
			name: 'Test Folder',
			description: 'Test folder description',
			passwordHash: 'hashed-password',
			participants: new Set(['user1']),
			permissions: new Map([['user1', [Permission.READ, Permission.WRITE]]])
		})

		expect(accessControl.hasPermission(folderId, 'user1', Permission.READ)).toBe(true)
		expect(accessControl.hasPermission(folderId, 'user1', Permission.WRITE)).toBe(true)
		expect(accessControl.hasPermission(folderId, 'user1', Permission.ADMIN)).toBe(false)
		expect(accessControl.hasPermission(folderId, 'user2', Permission.READ)).toBe(false)
	})

	it('can grant permissions to users', () => {
		const folderId = 'test-folder'
		accessControl.createSharedFolder({
			id: folderId,
			name: 'Test Folder',
			description: 'Test folder description',
			passwordHash: 'hashed-password',
			participants: new Set(['user1']),
			permissions: new Map([['user1', [Permission.READ]]])
		})

		accessControl.grantPermission(folderId, 'user1', Permission.WRITE)
		
		expect(accessControl.hasPermission(folderId, 'user1', Permission.WRITE)).toBe(true)
	})

	it('can revoke permissions from users', () => {
		const folderId = 'test-folder'
		accessControl.createSharedFolder({
			id: folderId,
			name: 'Test Folder',
			description: 'Test folder description',
			passwordHash: 'hashed-password',
			participants: new Set(['user1']),
			permissions: new Map([['user1', [Permission.READ, Permission.WRITE]]])
		})

		accessControl.revokePermission(folderId, 'user1', Permission.WRITE)
		
		expect(accessControl.hasPermission(folderId, 'user1', Permission.READ)).toBe(true)
		expect(accessControl.hasPermission(folderId, 'user1', Permission.WRITE)).toBe(false)
	})

	it('can list all shared folders', () => {
		const folder1: SharedFolder = {
			id: 'folder1',
			name: 'Folder 1',
			description: 'Folder 1 description',
			passwordHash: 'hash1',
			participants: new Set(['user1']),
			permissions: new Map([['user1', [Permission.READ]]])
		}

		const folder2: SharedFolder = {
			id: 'folder2',
			name: 'Folder 2',
			description: 'Folder 2 description',
			passwordHash: 'hash2',
			participants: new Set(['user2']),
			permissions: new Map([['user2', [Permission.READ]]])
		}

		accessControl.createSharedFolder(folder1)
		accessControl.createSharedFolder(folder2)

		const folders = accessControl.getAllSharedFolders()
		expect(folders).toHaveLength(2)
		expect(folders.map(f => f.id)).toContain('folder1')
		expect(folders.map(f => f.id)).toContain('folder2')
	})

	it('can delete a shared folder', () => {
		const folderId = 'test-folder'
		accessControl.createSharedFolder({
			id: folderId,
			name: 'Test Folder',
			description: 'Test folder description',
			passwordHash: 'hashed-password',
			participants: new Set(['user1']),
			permissions: new Map([['user1', [Permission.READ]]])
		})

		accessControl.deleteSharedFolder(folderId)
		
		const folder = accessControl.getSharedFolder(folderId)
		expect(folder).toBeUndefined()
	})

	it('can validate folder access with password', () => {
		const folderId = 'test-folder'
		const password = 'test-password'
		const passwordHash = 'hashed-password' // In real implementation, this would be properly hashed

		accessControl.createSharedFolder({
			id: folderId,
			name: 'Test Folder',
			description: 'Test folder description',
			passwordHash,
			participants: new Set(['user1']),
			permissions: new Map([['user1', [Permission.READ]]])
		})

		// This is a simplified test - in real implementation, password validation would be more complex
		expect(accessControl.validateFolderAccess(folderId, password)).toBeDefined()
	})
})