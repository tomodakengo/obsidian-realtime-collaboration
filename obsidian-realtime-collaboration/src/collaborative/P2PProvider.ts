import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { ConnectionState } from '../types'

export interface P2PProviderOptions {
	roomName: string
	doc: Y.Doc
	signalingServers?: string[]
	password?: string
	awareness?: any
}

export class P2PProvider {
	private readonly roomName: string
	private readonly doc: Y.Doc
	private readonly signalingServers: string[]
	private readonly password?: string
	private readonly awareness?: any
	private provider?: WebrtcProvider
	private connectionState: ConnectionState = ConnectionState.DISCONNECTED
	private connectionChangeCallbacks: ((state: ConnectionState) => void)[] = []

	constructor(roomName: string, doc: Y.Doc, options: Partial<P2PProviderOptions> = {}) {
		this.roomName = roomName
		this.doc = doc
		this.signalingServers = options.signalingServers || [
			'wss://signaling.yjs.dev',
			'wss://y-webrtc-signaling-eu.herokuapp.com',
			'wss://y-webrtc-signaling-us.herokuapp.com'
		]
		this.password = options.password
		this.awareness = options.awareness

		this.initializeProvider()
	}

	private initializeProvider(): void {
		try {
			// Check if WebRTC is available
			if (typeof window !== 'undefined' && typeof (globalThis as any).RTCPeerConnection !== 'undefined') {
				this.provider = new WebrtcProvider(this.roomName, this.doc, {
					signaling: this.signalingServers,
					password: this.password,
					awareness: this.awareness,
					maxConns: 20,
					filterBcConns: false,
					peerOpts: {}
				})

				this.setupEventListeners()
				this.connectionState = ConnectionState.DISCONNECTED
			} else {
				console.warn('WebRTC not available, P2P provider will not be initialized')
			}
		} catch (error) {
			console.error('Failed to initialize P2P provider:', error)
			this.connectionState = ConnectionState.ERROR
		}
	}

	private setupEventListeners(): void {
		if (!this.provider) return

		this.provider.on('status', ({ status }: { status: string }) => {
			switch (status) {
				case 'connected':
					this.connectionState = ConnectionState.CONNECTED
					break
				case 'disconnected':
					this.connectionState = ConnectionState.DISCONNECTED
					break
				case 'connecting':
					this.connectionState = ConnectionState.CONNECTING
					break
				default:
					this.connectionState = ConnectionState.ERROR
			}
			this.notifyConnectionChange()
		})

		this.provider.on('peer-joined', (peer: any) => {
			console.log('Peer joined:', peer)
		})

		this.provider.on('peer-left', (peer: any) => {
			console.log('Peer left:', peer)
		})

		this.provider.on('error', (error: any) => {
			console.error('P2P provider error:', error)
			this.connectionState = ConnectionState.ERROR
			this.notifyConnectionChange()
		})
	}

	public connect(): void {
		if (this.provider && this.connectionState === ConnectionState.DISCONNECTED) {
			this.connectionState = ConnectionState.CONNECTING
			this.notifyConnectionChange()
			
			// The provider will automatically attempt to connect
			// The status event will update the connection state
		}
	}

	public disconnect(): void {
		if (this.provider && this.connectionState === ConnectionState.CONNECTED) {
			this.provider.disconnect()
			this.connectionState = ConnectionState.DISCONNECTED
			this.notifyConnectionChange()
		}
	}

	public destroy(): void {
		if (this.provider) {
			this.provider.destroy()
			this.provider = undefined
		}
		this.connectionState = ConnectionState.DISCONNECTED
		this.connectionChangeCallbacks = []
	}

	public getConnectionState(): ConnectionState {
		return this.connectionState
	}

	public onConnectionChange(callback: (state: ConnectionState) => void): void {
		this.connectionChangeCallbacks.push(callback)
	}

	public offConnectionChange(callback: (state: ConnectionState) => void): void {
		const index = this.connectionChangeCallbacks.indexOf(callback)
		if (index > -1) {
			this.connectionChangeCallbacks.splice(index, 1)
		}
	}

	private notifyConnectionChange(): void {
		this.connectionChangeCallbacks.forEach(callback => {
			try {
				callback(this.connectionState)
			} catch (error) {
				console.error('Error in connection change callback:', error)
			}
		})
	}

	public getLocalUserState(): any {
		if (this.provider?.awareness) {
			return this.provider.awareness.getLocalState()
		}
		return null
	}

	public getConnectedPeers(): any[] {
		if (this.provider?.awareness) {
			return Array.from(this.provider.awareness.getStates().keys())
		}
		return []
	}

	public isConnected(): boolean {
		return this.connectionState === ConnectionState.CONNECTED
	}

	public getRoomName(): string {
		return this.roomName
	}

	public getProvider(): WebrtcProvider | undefined {
		return this.provider
	}
}