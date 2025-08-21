import { User } from '../types'

export interface UserActivity {
	type: 'insert' | 'delete' | 'update' | 'cursor' | 'selection'
	position?: number
	timestamp: number
	metadata?: any
}

export interface UserAwarenessOptions {
	maxUsers?: number
	userTimeout?: number
}

export class UserAwareness {
	private users: Map<string, User> = new Map()
	private userActivities: Map<string, UserActivity[]> = new Map()
	private userChangeCallbacks: ((users: User[]) => void)[] = []
	private readonly maxUsers: number
	private readonly userTimeout: number
	private cleanupTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()

	constructor(options: UserAwarenessOptions = {}) {
		this.maxUsers = options.maxUsers || 100
		this.userTimeout = options.userTimeout || 30000 // 30 seconds
	}

	public addUser(user: User): void {
		if (this.users.size >= this.maxUsers) {
			console.warn(`Maximum number of users (${this.maxUsers}) reached`)
			return
		}

		// Clear existing timeout if user already exists
		if (this.cleanupTimers.has(user.id)) {
			clearTimeout(this.cleanupTimers.get(user.id)!)
			this.cleanupTimers.delete(user.id)
		}

		this.users.set(user.id, user)
		this.userActivities.set(user.id, [])
		this.notifyUserChange()

		// Set timeout to automatically remove inactive users
		if (this.userTimeout > 0) {
			const timer = setTimeout(() => {
				this.removeUser(user.id)
			}, this.userTimeout)
			this.cleanupTimers.set(user.id, timer)
		}
	}

	public removeUser(userId: string): void {
		if (this.users.has(userId)) {
			this.users.delete(userId)
			this.userActivities.delete(userId)
			
			// Clear cleanup timer
			if (this.cleanupTimers.has(userId)) {
				clearTimeout(this.cleanupTimers.get(userId)!)
				this.cleanupTimers.delete(userId)
			}

			this.notifyUserChange()
		}
	}

	public updateUser(user: User): void {
		if (this.users.has(user.id)) {
			this.users.set(user.id, user)
			this.notifyUserChange()
		}
	}

	public updateUserActivity(userId: string, activity: UserActivity): void {
		if (!this.users.has(userId)) return

		const activities = this.userActivities.get(userId) || []
		activities.push(activity)

		// Keep only the last 100 activities per user
		if (activities.length > 100) {
			activities.splice(0, activities.length - 100)
		}

		this.userActivities.set(userId, activities)

		// Refresh user timeout
		this.refreshUser(userId)
	}

	public getUserActivity(userId: string): UserActivity[] {
		return this.userActivities.get(userId) || []
	}

	public getRecentUserActivity(userId: string, minutes: number = 5): UserActivity[] {
		const activities = this.getUserActivity(userId)
		const cutoffTime = Date.now() - (minutes * 60 * 1000)
		return activities.filter(activity => activity.timestamp > cutoffTime)
	}

	public getUser(userId: string): User | undefined {
		return this.users.get(userId)
	}

	public getUsers(): User[] {
		return Array.from(this.users.values())
	}

	public getUserCount(): number {
		return this.users.size
	}

	public hasUser(userId: string): boolean {
		return this.users.has(userId)
	}

	public clearUsers(): void {
		// Clear all cleanup timers
		this.cleanupTimers.forEach(timer => clearTimeout(timer))
		this.cleanupTimers.clear()

		this.users.clear()
		this.userActivities.clear()
		this.notifyUserChange()
	}

	public onUsersChange(callback: (users: User[]) => void): void {
		this.userChangeCallbacks.push(callback)
	}

	public offUsersChange(callback: (users: User[]) => void): void {
		const index = this.userChangeCallbacks.indexOf(callback)
		if (index > -1) {
			this.userChangeCallbacks.splice(index, 1)
		}
	}

	private notifyUserChange(): void {
		const users = this.getUsers()
		this.userChangeCallbacks.forEach(callback => {
			try {
				callback(users)
			} catch (error) {
				console.error('Error in user change callback:', error)
			}
		})
	}

	public refreshUser(userId: string): void {
		const user = this.users.get(userId)
		if (user) {
			// Reset the timeout for this user
			if (this.cleanupTimers.has(userId)) {
				clearTimeout(this.cleanupTimers.get(userId)!)
			}

			if (this.userTimeout > 0) {
				const timer = setTimeout(() => {
					this.removeUser(userId)
				}, this.userTimeout)
				this.cleanupTimers.set(userId, timer)
			}
		}
	}

	public getOnlineUsers(): User[] {
		return this.getUsers().filter(user => user.status === 'online')
	}

	public getAwayUsers(): User[] {
		return this.getUsers().filter(user => user.status === 'away')
	}

	public getOfflineUsers(): User[] {
		return this.getUsers().filter(user => user.status === 'offline')
	}

	public setUserStatus(userId: string, status: User['status']): void {
		const user = this.users.get(userId)
		if (user) {
			user.status = status
			this.notifyUserChange()
		}
	}

	public setUserColor(userId: string, color: string): void {
		const user = this.users.get(userId)
		if (user) {
			user.color = color
			this.notifyUserChange()
		}
	}

	public setUserName(userId: string, name: string): void {
		const user = this.users.get(userId)
		if (user) {
			user.name = name
			this.notifyUserChange()
		}
	}

	public destroy(): void {
		// Clear all cleanup timers
		this.cleanupTimers.forEach(timer => clearTimeout(timer))
		this.cleanupTimers.clear()

		this.users.clear()
		this.userActivities.clear()
		this.userChangeCallbacks = []
	}
}