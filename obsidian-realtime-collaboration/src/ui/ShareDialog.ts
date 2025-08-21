import { Room } from '../types'

export interface RoomSettings {
	id: string
	name?: string
	description?: string
	maxParticipants?: number
	hasPassword: boolean
	createdAt?: Date
	updatedAt?: Date
}

export interface ShareDialogOptions {
	baseUrl?: string
	roomIdLength?: number
}

export class ShareDialog {
	private readonly baseUrl: string
	private readonly roomIdLength: number
	private rooms: Map<string, RoomSettings> = new Map()
	private roomPasswords: Map<string, string> = new Map()

	constructor(options: ShareDialogOptions = {}) {
		this.baseUrl = options.baseUrl || 'https://obsidian.md'
		this.roomIdLength = options.roomIdLength || 16
	}

	public generateRoomId(): string {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
		let result = ''
		for (let i = 0; i < this.roomIdLength; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length))
		}
		return result
	}

	public generateShareableLink(roomId: string): string {
		return `${this.baseUrl}/collaborate/${roomId}`
	}

	public parseRoomIdFromLink(link: string): string | null {
		try {
			const url = new URL(link)
			const pathParts = url.pathname.split('/')
			const roomIdIndex = pathParts.indexOf('collaborate')
			
			if (roomIdIndex !== -1 && roomIdIndex + 1 < pathParts.length) {
				const roomId = pathParts[roomIdIndex + 1]
				// Validate room ID format
				if (roomId && roomId.length === this.roomIdLength && /^[A-Za-z0-9]+$/.test(roomId)) {
					return roomId
				}
			}
		} catch (error) {
			console.error('Failed to parse room ID from link:', error)
		}
		return null
	}

	public setRoomPassword(roomId: string, password: string): void {
		this.roomPasswords.set(roomId, password)
		
		// Update room settings
		const room = this.rooms.get(roomId)
		if (room) {
			room.hasPassword = true
			room.updatedAt = new Date()
		}
	}

	public hasRoomPassword(roomId: string): boolean {
		return this.roomPasswords.has(roomId)
	}

	public validateRoomPassword(roomId: string, password: string): boolean {
		const storedPassword = this.roomPasswords.get(roomId)
		return storedPassword === password
	}

	public getRoomSettings(roomId: string): RoomSettings {
		let room = this.rooms.get(roomId)
		
		if (!room) {
			room = {
				id: roomId,
				hasPassword: false,
				createdAt: new Date(),
				updatedAt: new Date()
			}
			this.rooms.set(roomId, room)
		}
		
		return { ...room }
	}

	public updateRoomSettings(roomId: string, settings: Partial<RoomSettings>): void {
		const room = this.rooms.get(roomId)
		
		if (room) {
			Object.assign(room, settings, { updatedAt: new Date() })
		} else {
			const newRoom: RoomSettings = {
				id: roomId,
				hasPassword: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				...settings
			}
			this.rooms.set(roomId, newRoom)
		}
	}

	public createRoom(name?: string, description?: string, maxParticipants?: number): string {
		const roomId = this.generateRoomId()
		const room: RoomSettings = {
			id: roomId,
			name,
			description,
			maxParticipants,
			hasPassword: false,
			createdAt: new Date(),
			updatedAt: new Date()
		}
		
		this.rooms.set(roomId, room)
		return roomId
	}

	public deleteRoom(roomId: string): boolean {
		const deleted = this.rooms.delete(roomId)
		if (deleted) {
			this.roomPasswords.delete(roomId)
		}
		return deleted
	}

	public getAllRooms(): RoomSettings[] {
		return Array.from(this.rooms.values())
	}

	public getRoomCount(): number {
		return this.rooms.size
	}

	public clearRooms(): void {
		this.rooms.clear()
		this.roomPasswords.clear()
	}

	public exportRoomData(roomId: string): string | null {
		const room = this.rooms.get(roomId)
		if (!room) return null
		
		const exportData = {
			room,
			hasPassword: this.hasRoomPassword(roomId),
			exportedAt: new Date().toISOString()
		}
		
		return JSON.stringify(exportData, null, 2)
	}

	public importRoomData(data: string): boolean {
		try {
			const importData = JSON.parse(data)
			const room = importData.room as RoomSettings
			
			if (room && room.id) {
				this.rooms.set(room.id, room)
				return true
			}
		} catch (error) {
			console.error('Failed to import room data:', error)
		}
		return false
	}

	public getRoomStats(): { total: number; withPassword: number; withoutPassword: number } {
		const total = this.rooms.size
		const withPassword = Array.from(this.rooms.values()).filter(room => room.hasPassword).length
		const withoutPassword = total - withPassword
		
		return { total, withPassword, withoutPassword }
	}

	public destroy(): void {
		this.rooms.clear()
		this.roomPasswords.clear()
	}
}