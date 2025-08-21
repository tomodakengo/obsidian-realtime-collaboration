import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'

export interface P2PProviderOptions {
	signalingServers?: string[]
	iceServers?: RTCIceServer[]
	maxConnections?: number
}

export interface ConnectionStatus {
	state: 'disconnected' | 'connecting' | 'connected' | 'error'
	connectedPeers: number
}

export class P2PProvider {
	private readonly doc: Y.Doc
	private readonly awareness: Awareness
	private readonly roomName: string
	private readonly options: P2PProviderOptions
	private readonly peers = new Set<string>()
	private readonly eventListeners = new Map<string, Function[]>()
	private signalingConnection?: WebSocket
	private connectionState: ConnectionStatus['state'] = 'disconnected'

	constructor(roomName: string, doc: Y.Doc, options: P2PProviderOptions = {}) {
		this.roomName = roomName
		this.doc = doc
		this.awareness = new Awareness(doc)
		this.options = {
			signalingServers: options.signalingServers || ['ws://localhost:4444'],
			iceServers: options.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }],
			maxConnections: options.maxConnections || 50,
			...options
		}

		this.setupDocumentObservers()
		this.setupAwarenessObservers()
	}

	private setupDocumentObservers(): void {
		this.doc.on('update', (update: Uint8Array, origin: any) => {
			if (origin !== this) {
				this.emit('send-update', update)
			}
		})
	}

	private setupAwarenessObservers(): void {
		this.awareness.on('update', ({ added, updated, removed }: any) => {
			const changedClients = added.concat(updated).concat(removed)
			if (changedClients.length > 0) {
				this.emit('send-awareness', { added, updated, removed })
			}
		})
	}

	getRoomName(): string {
		return this.roomName
	}

	getSignalingServers(): string[] {
		return this.options.signalingServers || []
	}

	getConnectionStatus(): ConnectionStatus {
		return {
			state: this.connectionState,
			connectedPeers: this.peers.size
		}
	}

	getConnectedPeers(): string[] {
		return Array.from(this.peers)
	}

	getAwareness(): Awareness {
		return this.awareness
	}

	async connect(): Promise<void> {
		try {
			this.connectionState = 'connecting'
			const signalingServer = this.options.signalingServers?.[0]
			
			if (!signalingServer) {
				throw new Error('No signaling server configured')
			}

			this.signalingConnection = new WebSocket(signalingServer)
			
			return new Promise((resolve, reject) => {
				if (!this.signalingConnection) {
					reject(new Error('Failed to create WebSocket connection'))
					return
				}

				this.signalingConnection.addEventListener('open', () => {
					this.connectionState = 'connected'
					resolve()
				})

				this.signalingConnection.addEventListener('error', (error) => {
					this.connectionState = 'error'
					reject(error)
				})

				this.signalingConnection.addEventListener('close', () => {
					this.connectionState = 'disconnected'
				})
			})
		} catch (error) {
			this.connectionState = 'error'
			throw error
		}
	}

	addPeer(peerId: string): void {
		if (!this.peers.has(peerId)) {
			this.peers.add(peerId)
			this.emit('peer-connected', peerId)
		}
	}

	removePeer(peerId: string): void {
		if (this.peers.has(peerId)) {
			this.peers.delete(peerId)
			this.emit('peer-disconnected', peerId)
		}
	}

	receiveUpdate(update: Uint8Array, fromPeer: string): void {
		try {
			Y.applyUpdate(this.doc, update, this)
		} catch (error) {
			console.error('Error applying received update:', error)
		}
	}

	receiveAwarenessUpdate(awarenessUpdate: Uint8Array, fromPeer: string): void {
		try {
			// In a real implementation, this would decode and apply awareness update
			// For now, we just handle it gracefully
		} catch (error) {
			console.error('Error applying awareness update:', error)
		}
	}

	on(event: string, handler: Function): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, [])
		}
		this.eventListeners.get(event)!.push(handler)
	}

	off(event: string, handler: Function): void {
		const handlers = this.eventListeners.get(event)
		if (handlers) {
			const index = handlers.indexOf(handler)
			if (index > -1) {
				handlers.splice(index, 1)
			}
		}
	}

	private emit(event: string, data?: any): void {
		const handlers = this.eventListeners.get(event) || []
		handlers.forEach(handler => {
			try {
				handler(data)
			} catch (error) {
				console.error(`Error in event handler for ${event}:`, error)
			}
		})
	}

	destroy(): void {
		this.peers.clear()
		this.eventListeners.clear()
		
		if (this.signalingConnection) {
			this.signalingConnection.close()
		}
		
		this.awareness.destroy()
		this.connectionState = 'disconnected'
	}
}