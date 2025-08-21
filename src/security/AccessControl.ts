import { Permission, SharedFolder } from '../types'

export interface AccessControlOptions {
	maxFolders?: number
	maxParticipantsPerFolder?: number
}

export class AccessControl {
	private sharedFolders: Map<string, SharedFolder> = new Map()
	private readonly maxFolders: number
	private readonly maxParticipantsPerFolder: number

	constructor(options: AccessControlOptions = {}) {
		this.maxFolders = options.maxFolders || 100
		this.maxParticipantsPerFolder = options.maxParticipantsPerFolder || 50
	}

	public createSharedFolder(folder: SharedFolder): boolean {
		if (this.sharedFolders.size >= this.maxFolders) {
			console.warn(`Maximum number of shared folders (${this.maxFolders}) reached`)
			return false
		}

		// Ensure required fields are present
		if (!folder.id || !folder.name || !folder.passwordHash) {
			console.error('Shared folder must have id, name, and passwordHash')
			return false
		}

		// Set timestamps if not provided
		if (!folder.createdAt) {
			folder.createdAt = new Date()
		}
		if (!folder.updatedAt) {
			folder.updatedAt = new Date()
		}

		this.sharedFolders.set(folder.id, folder)
		return true
	}

	public getSharedFolder(folderId: string): SharedFolder | undefined {
		return this.sharedFolders.get(folderId)
	}

	public getAllSharedFolders(): SharedFolder[] {
		return Array.from(this.sharedFolders.values())
	}

	public updateSharedFolder(folderId: string, updates: Partial<SharedFolder>): boolean {
		const folder = this.sharedFolders.get(folderId)
		if (!folder) {
			return false
		}

		// Update fields
		Object.assign(folder, updates, { updatedAt: new Date() })
		return true
	}

	public deleteSharedFolder(folderId: string): boolean {
		return this.sharedFolders.delete(folderId)
	}

	public addParticipant(folderId: string, userId: string, permissions: Permission[]): boolean {
		const folder = this.sharedFolders.get(folderId)
		if (!folder) {
			return false
		}

		if (folder.participants.size >= this.maxParticipantsPerFolder) {
			console.warn(`Maximum number of participants (${this.maxParticipantsPerFolder}) reached for folder ${folderId}`)
			return false
		}

		folder.participants.add(userId)
		folder.permissions.set(userId, permissions)
		folder.updatedAt = new Date()

		return true
	}

	public removeParticipant(folderId: string, userId: string): boolean {
		const folder = this.sharedFolders.get(folderId)
		if (!folder) {
			return false
		}

		folder.participants.delete(userId)
		folder.permissions.delete(userId)
		folder.updatedAt = new Date()

		return true
	}

	public hasPermission(folderId: string, userId: string, permission: Permission): boolean {
		const folder = this.sharedFolders.get(folderId)
		if (!folder) {
			return false
		}

		const userPermissions = folder.permissions.get(userId)
		if (!userPermissions) {
			return false
		}

		return userPermissions.includes(permission)
	}

	public grantPermission(folderId: string, userId: string, permission: Permission): boolean {
		const folder = this.sharedFolders.get(folderId)
		if (!folder) {
			return false
		}

		if (!folder.participants.has(userId)) {
			return false
		}

		const userPermissions = folder.permissions.get(userId) || []
		if (!userPermissions.includes(permission)) {
			userPermissions.push(permission)
			folder.permissions.set(userId, userPermissions)
			folder.updatedAt = new Date()
		}

		return true
	}

	public revokePermission(folderId: string, userId: string, permission: Permission): boolean {
		const folder = this.sharedFolders.get(folderId)
		if (!folder) {
			return false
		}

		const userPermissions = folder.permissions.get(userId)
		if (!userPermissions) {
			return false
		}

		const index = userPermissions.indexOf(permission)
		if (index > -1) {
			userPermissions.splice(index, 1)
			folder.permissions.set(userId, userPermissions)
			folder.updatedAt = new Date()
		}

		return true
	}

	public getUserPermissions(folderId: string, userId: string): Permission[] {
		const folder = this.sharedFolders.get(folderId)
		if (!folder) {
			return []
		}

		return folder.permissions.get(userId) || []
	}

	public getFolderParticipants(folderId: string): string[] {
		const folder = this.sharedFolders.get(folderId)
		if (!folder) {
			return []
		}

		return Array.from(folder.participants)
	}

	public getParticipantCount(folderId: string): number {
		const folder = this.sharedFolders.get(folderId)
		if (!folder) {
			return 0
		}

		return folder.participants.size
	}

	public validateFolderAccess(folderId: string, password: string): boolean {
		const folder = this.sharedFolders.get(folderId)
		if (!folder) {
			return false
		}

		// In a real implementation, this would use proper password hashing
		// For now, we'll do a simple comparison
		return folder.passwordHash === password
	}

	public changeFolderPassword(folderId: string, newPasswordHash: string): boolean {
		const folder = this.sharedFolders.get(folderId)
		if (!folder) {
			return false
		}

		folder.passwordHash = newPasswordHash
		folder.updatedAt = new Date()

		return true
	}

	public getFolderStats(): { total: number; totalParticipants: number; averageParticipants: number } {
		const total = this.sharedFolders.size
		let totalParticipants = 0

		this.sharedFolders.forEach(folder => {
			totalParticipants += folder.participants.size
		})

		const averageParticipants = total > 0 ? totalParticipants / total : 0

		return { total, totalParticipants, averageParticipants }
	}

	public searchFolders(query: string): SharedFolder[] {
		const results: SharedFolder[] = []
		const lowerQuery = query.toLowerCase()

		this.sharedFolders.forEach(folder => {
			if (folder.name.toLowerCase().includes(lowerQuery) ||
				(folder.description && folder.description.toLowerCase().includes(lowerQuery))) {
				results.push(folder)
			}
		})

		return results
	}

	public getFoldersByUser(userId: string): SharedFolder[] {
		const results: SharedFolder[] = []

		this.sharedFolders.forEach(folder => {
			if (folder.participants.has(userId)) {
				results.push(folder)
			}
		})

		return results
	}

	public clearAllFolders(): void {
		this.sharedFolders.clear()
	}

	public destroy(): void {
		this.clearAllFolders()
	}
}