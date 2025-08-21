export enum Permission {
	READ = 'read',
	WRITE = 'write',
	SHARE = 'share',
	ADMIN = 'admin',
}

export interface SharedFolder {
	id: string
	name: string
	passwordHash?: string
	participants: Set<string>
	permissions: Map<string, Permission[]>
}

export class AccessControl {
	private readonly folders: Map<string, SharedFolder> = new Map()

	createSharedFolder(id: string, name: string): SharedFolder {
		const folder: SharedFolder = {
			id,
			name,
			participants: new Set(),
			permissions: new Map(),
		}
		this.folders.set(id, folder)
		return folder
	}

	grantPermission(folderId: string, userId: string, permission: Permission): void {
		const folder = this.folders.get(folderId)
		if (!folder) throw new Error('Folder not found')
		const current = folder.permissions.get(userId) ?? []
		if (!current.includes(permission)) {
			folder.permissions.set(userId, [...current, permission])
		}
	}

	revokePermission(folderId: string, userId: string, permission: Permission): void {
		const folder = this.folders.get(folderId)
		if (!folder) throw new Error('Folder not found')
		const current = folder.permissions.get(userId) ?? []
		folder.permissions.set(userId, current.filter(p => p !== permission))
	}

	hasPermission(folderId: string, userId: string, permission: Permission): boolean {
		const folder = this.folders.get(folderId)
		if (!folder) return false
		const current = folder.permissions.get(userId) ?? []
		return current.includes(permission)
	}
}