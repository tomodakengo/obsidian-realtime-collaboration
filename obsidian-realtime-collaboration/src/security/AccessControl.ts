export enum Permission {
	READ = 'read',
	WRITE = 'write',
	SHARE = 'share',
	ADMIN = 'admin',
}

export interface SharedFolder {
	id: string
	name: string
	passwordHash: string
	participants: Set<string>
	permissions: Map<string, Permission[]>
}

/**
 * AccessControl manages participant membership and permission grants for a shared folder.
 */
export class AccessControl {
	private readonly folder: SharedFolder

	constructor(id: string, name: string, passwordHash: string) {
		this.folder = {
			id,
			name,
			passwordHash,
			participants: new Set(),
			permissions: new Map(),
		}
	}

	/** Adds a user to the participant list */
	addParticipant(userId: string): void {
		this.folder.participants.add(userId)
		// initialize permission map if absent
		if (!this.folder.permissions.has(userId)) {
			this.folder.permissions.set(userId, [])
		}
	}

	/** Removes a user from the participant list and associated permissions */
	removeParticipant(userId: string): void {
		this.folder.participants.delete(userId)
		this.folder.permissions.delete(userId)
	}

	/** Grants a specific permission to a participant */
	grantPermission(userId: string, permission: Permission): void {
		if (!this.folder.participants.has(userId)) {
			throw new Error(`User ${userId} is not a participant`)
		}
		const list = this.folder.permissions.get(userId) ?? []
		if (!list.includes(permission)) {
			list.push(permission)
			this.folder.permissions.set(userId, list)
		}
	}

	/** Revokes a permission from a participant */
	revokePermission(userId: string, permission: Permission): void {
		const list = this.folder.permissions.get(userId)
		if (!list) return
		const idx = list.indexOf(permission)
		if (idx !== -1) {
			list.splice(idx, 1)
			this.folder.permissions.set(userId, list)
		}
	}

	/** Checks if a participant has a permission */
	hasPermission(userId: string, permission: Permission): boolean {
		return (this.folder.permissions.get(userId) ?? []).includes(permission)
	}

	/** Returns copy of folder state (immutable) */
	get state(): SharedFolder {
		return {
			id: this.folder.id,
			name: this.folder.name,
			passwordHash: this.folder.passwordHash,
			participants: new Set(this.folder.participants),
			permissions: new Map(Array.from(this.folder.permissions.entries()).map(([u, perms]) => [u, [...perms]])),
		}
	}
}