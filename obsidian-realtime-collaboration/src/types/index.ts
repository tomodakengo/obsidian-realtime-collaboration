// User-related types
export interface User {
	id: string
	name: string
	color: string
	avatar?: string
	status?: 'online' | 'offline' | 'away'
}

// Room-related types
export interface Room {
	id: string
	name: string
	description?: string
	createdAt: Date
	createdBy: string
	maxParticipants?: number
	hasPassword: boolean
	participants: Set<string>
}

// Permission types
export enum Permission {
	READ = 'read',
	WRITE = 'write',
	SHARE = 'share',
	ADMIN = 'admin'
}

// Shared folder types
export interface SharedFolder {
	id: string
	name: string
	description?: string
	passwordHash: string
	participants: Set<string>
	permissions: Map<string, Permission[]>
	createdAt?: Date
	updatedAt?: Date
}

// Editor change types
export interface EditorChange {
	from: number
	to: number
	text: string[]
	origin?: string
}

// Collaboration event types
export interface CollaborationEvent {
	type: 'user_joined' | 'user_left' | 'document_changed' | 'cursor_moved'
	userId: string
	timestamp: Date
	data?: any
}

// Connection state types
export enum ConnectionState {
	DISCONNECTED = 'disconnected',
	CONNECTING = 'connecting',
	CONNECTED = 'connected',
	RECONNECTING = 'reconnecting',
	ERROR = 'error'
}

// Provider types
export interface Provider {
	connect(): void
	disconnect(): void
	destroy(): void
	awareness?: any
}

// Y.js document types
export interface YjsDocument {
	id: string
	text: any
	awareness: any
	providers: Map<string, Provider>
}