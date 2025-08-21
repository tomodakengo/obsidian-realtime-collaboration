import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { IndexeddbPersistence } from 'y-indexeddb'
import { Awareness } from 'y-protocols/awareness'

export interface YjsManagerOptions {
	enableIndexeddb?: boolean
	enableWebrtc?: boolean
	doc?: Y.Doc
	signalingServers?: string[]
	roomName?: string
	password?: string
}

export interface DocumentChangeEvent {
	type: 'insert' | 'delete' | 'update'
	position: number
	length: number
	content?: string
	timestamp: number
	userId?: string
}

export class YjsManager {
	private readonly doc: Y.Doc
	private readonly providers: Map<string, any> = new Map()
	private readonly awareness: Awareness
	private readonly changeCallbacks: ((event: DocumentChangeEvent) => void)[] = []
	private readonly connectionCallbacks: ((connected: boolean) => void)[] = []
	private isDestroyed = false

	constructor(documentId: string, options: YjsManagerOptions = {}) {
		const inBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'
		const hasIndexedDB = typeof indexedDB !== 'undefined'
		const canWebrtc = inBrowser && typeof (globalThis as any).RTCPeerConnection !== 'undefined'

		this.doc = options.doc ?? new Y.Doc()
		this.awareness = new Awareness(this.doc)

		const shouldIndexeddb = options.enableIndexeddb ?? (inBrowser && hasIndexedDB)
		const shouldWebrtc = options.enableWebrtc ?? canWebrtc

		// Set up awareness
		this.setupAwareness()

		// Set up providers
		if (shouldIndexeddb) {
			this.setupIndexedDB(documentId)
		}

		if (shouldWebrtc) {
			this.setupWebRTC(documentId, options)
		}

		// Set up document observers
		this.setupDocumentObservers()
	}

	private setupAwareness(): void {
		// Set local user state
		this.awareness.setLocalState({
			user: {
				id: this.generateUserId(),
				name: 'Anonymous User',
				color: this.generateUserColor(),
				status: 'online'
			},
			lastSeen: Date.now()
		})

		// Listen for awareness changes
		this.awareness.on('change', (changes: any) => {
			console.log('Awareness changed:', changes)
		})
	}

	private setupIndexedDB(documentId: string): void {
		try {
			const yIndexeddb = new IndexeddbPersistence(documentId, this.doc)
			
			yIndexeddb.once('synced', () => {
				console.log('IndexedDB synced for document:', documentId)
			})

			this.providers.set('indexeddb', yIndexeddb)
		} catch (error) {
			console.warn('Failed to initialize IndexedDB persistence:', error)
		}
	}

	private setupWebRTC(documentId: string, options: YjsManagerOptions): void {
		try {
			const roomName = options.roomName || documentId
			const signalingServers = options.signalingServers || [
				'wss://signaling.yjs.dev',
				'wss://y-webrtc-signaling-eu.herokuapp.com',
				'wss://y-webrtc-signaling-us.herokuapp.com'
			]

			const webrtc = new WebrtcProvider(roomName, this.doc, {
				signaling: signalingServers,
				password: options.password,
				awareness: this.awareness,
				maxConns: 20,
				filterBcConns: false,
				peerOpts: {}
			})

			// Set up WebRTC event listeners
			webrtc.on('status', ({ connected }: { connected: boolean }) => {
				console.log('WebRTC connection status:', connected ? 'connected' : 'disconnected')
				this.notifyConnectionChange(connected)
			})

			webrtc.on('synced', () => {
				console.log('WebRTC synced')
			})

			webrtc.on('peers', (peers: any) => {
				console.log('WebRTC peers:', peers)
			})

			this.providers.set('webrtc', webrtc)
		} catch (error) {
			console.warn('Failed to initialize WebRTC provider:', error)
		}
	}

	private setupDocumentObservers(): void {
		// Observe all text elements in the document
		this.doc.on('afterTransaction', (transaction: Y.Transaction) => {
			if (transaction.local) return

			// Process changes from the transaction
			transaction.changed.forEach((changeSet, parent) => {
				if (parent instanceof Y.Text) {
					this.processTextChanges(parent, changeSet, transaction)
				}
			})
		})
	}

	private processTextChanges(text: Y.Text, changeSet: any, transaction: Y.Transaction): void {
		// Get the changes from the transaction
		const changes = changeSet.delta
		
		changes.forEach((change: any) => {
			if (change.insert) {
				// Text was inserted
				this.notifyChange({
					type: 'insert',
					position: changeSet.anchor,
					length: change.insert.length,
					content: change.insert,
					timestamp: Date.now(),
					userId: this.getUserIdFromTransaction(transaction)
				})
			} else if (change.delete) {
				// Text was deleted
				this.notifyChange({
					type: 'delete',
					position: changeSet.anchor,
					length: change.delete,
					timestamp: Date.now(),
					userId: this.getUserIdFromTransaction(transaction)
				})
			}
		})
	}

	private getUserIdFromTransaction(transaction: Y.Transaction): string | undefined {
		// Try to get user ID from awareness
		const origin = transaction.origin
		if (origin && typeof origin === 'object' && 'userId' in origin) {
			return origin.userId as string
		}
		return undefined
	}

	public getText(name: string = 'content'): Y.Text {
		return this.doc.getText(name)
	}

	public getDoc(): Y.Doc {
		return this.doc
	}

	public getAwareness(): Awareness {
		return this.awareness
	}

	public getConnectedUsers(): Map<number, any> {
		return this.awareness.getStates()
	}

	public getLocalUserState(): any {
		return this.awareness.getLocalState()
	}

	public setLocalUserState(state: any): void {
		this.awareness.setLocalState(state)
	}

	public isConnected(): boolean {
		const webrtcProvider = this.providers.get('webrtc')
		return webrtcProvider ? webrtcProvider.connected : false
	}

	public connect(): void {
		const webrtcProvider = this.providers.get('webrtc')
		if (webrtcProvider && typeof webrtcProvider.connect === 'function') {
			webrtcProvider.connect()
		}
	}

	public disconnect(): void {
		const webrtcProvider = this.providers.get('webrtc')
		if (webrtcProvider && typeof webrtcProvider.disconnect === 'function') {
			webrtcProvider.disconnect()
		}
	}

	public onDocumentChange(callback: (event: DocumentChangeEvent) => void): void {
		this.changeCallbacks.push(callback)
	}

	public offDocumentChange(callback: (event: DocumentChangeEvent) => void): void {
		const index = this.changeCallbacks.indexOf(callback)
		if (index > -1) {
			this.changeCallbacks.splice(index, 1)
		}
	}

	public onConnectionChange(callback: (connected: boolean) => void): void {
		this.connectionCallbacks.push(callback)
	}

	public offConnectionChange(callback: (connected: boolean) => void): void {
		const index = this.connectionCallbacks.indexOf(callback)
		if (index > -1) {
			this.connectionCallbacks.splice(index, 1)
		}
	}

	private notifyChange(event: DocumentChangeEvent): void {
		this.changeCallbacks.forEach(callback => {
			try {
				callback(event)
			} catch (error) {
				console.error('Error in document change callback:', error)
			}
		})
	}

	private notifyConnectionChange(connected: boolean): void {
		this.connectionCallbacks.forEach(callback => {
			try {
				callback(connected)
			} catch (error) {
				console.error('Error in connection change callback:', error)
			}
		})
	}

	private generateUserId(): string {
		return 'user_' + Math.random().toString(36).substr(2, 9)
	}

	private generateUserColor(): string {
		const colors = [
			'#007acc', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
			'#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3'
		]
		return colors[Math.floor(Math.random() * colors.length)]
	}

	public destroy(): void {
		if (this.isDestroyed) return
		this.isDestroyed = true

		// Clean up providers
		this.providers.forEach((provider) => {
			try {
				if (provider && typeof provider.destroy === 'function') {
					provider.destroy()
				}
			} catch (error) {
				console.warn('Error destroying provider:', error)
			}
		})
		this.providers.clear()

		// Clean up awareness
		try {
			this.awareness.destroy()
		} catch (error) {
			console.warn('Error destroying awareness:', error)
		}

		// Clean up document
		try {
			this.doc.destroy()
		} catch (error) {
			console.warn('Error destroying document:', error)
		}

		// Clear callbacks
		this.changeCallbacks.length = 0
		this.connectionCallbacks.length = 0
	}
}