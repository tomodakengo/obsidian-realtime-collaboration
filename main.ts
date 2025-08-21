import { Plugin } from 'obsidian'
import { YjsManager } from './src/collaborative/YjsManager'
import { P2PProvider } from './src/collaborative/P2PProvider'
import { ObsidianEditorBinding } from './src/collaborative/ObsidianEditorBinding'
import { UserAwareness } from './src/ui/UserAwareness'
import { ShareDialog } from './src/ui/ShareDialog'
import { EncryptionManager } from './src/security/EncryptionManager'
import { AccessControl } from './src/security/AccessControl'
import { ConnectionState } from './src/types'

export default class CollaborativePlugin extends Plugin {
	private yjsManager?: YjsManager
	private p2pProvider?: P2PProvider
	private editorBinding?: ObsidianEditorBinding
	private userAwareness?: UserAwareness
	private shareDialog?: ShareDialog
	private encryptionManager?: EncryptionManager
	private accessControl?: AccessControl
	private isInitialized = false

	async onload() {
		console.log('Loading Collaborative Plugin')

		try {
			// Initialize core components
			this.encryptionManager = new EncryptionManager()
			this.accessControl = new AccessControl()
			this.userAwareness = new UserAwareness()
			this.shareDialog = new ShareDialog()

			// Initialize Y.js manager with improved configuration
			this.yjsManager = new YjsManager('collaborative-doc', {
				enableIndexeddb: true,
				enableWebrtc: true,
				roomName: 'obsidian-collab-room',
				signalingServers: [
					'wss://signaling.yjs.dev',
					'wss://y-webrtc-signaling-eu.herokuapp.com',
					'wss://y-webrtc-signaling-us.herokuapp.com'
				]
			})

			// Set up document change monitoring
			this.setupDocumentMonitoring()

			// Set up connection monitoring
			this.setupConnectionMonitoring()

			// Set up user awareness
			this.setupUserAwareness()

			// Register editor extension
			this.setupEditorExtension()

			// Initialize P2P connection
			this.initializeP2PConnection()

			this.isInitialized = true
			console.log('Collaborative Plugin loaded successfully')
		} catch (error) {
			console.error('Failed to load Collaborative Plugin:', error)
		}
	}

	private setupDocumentMonitoring(): void {
		if (!this.yjsManager) return

		// Monitor document changes
		this.yjsManager.onDocumentChange((event) => {
			console.log('Document changed:', event)
			
			// Update user awareness with change information
			if (this.userAwareness && event.userId) {
				this.userAwareness.updateUserActivity(event.userId, {
					type: event.type,
					position: event.position,
					timestamp: event.timestamp
				})
			}
		})
	}

	private setupConnectionMonitoring(): void {
		if (!this.yjsManager) return

		// Monitor connection state changes
		this.yjsManager.onConnectionChange((connected) => {
			console.log('Connection state changed:', connected ? 'CONNECTED' : 'DISCONNECTED')
			
			// Update user status based on connection
			if (this.userAwareness) {
				const localUserState = this.yjsManager?.getLocalUserState()
				if (localUserState?.user) {
					this.userAwareness.setUserStatus(localUserState.user.id, 
						connected ? 'online' : 'offline'
					)
				}
			}

			// Update connection state in UI
			this.updateConnectionStatus(connected)
		})
	}

	private setupUserAwareness(): void {
		if (!this.userAwareness || !this.yjsManager) return

		// Add current user
		const localUserState = this.yjsManager.getLocalUserState()
		if (localUserState?.user) {
			this.userAwareness.addUser({
				id: localUserState.user.id,
				name: localUserState.user.name,
				color: localUserState.user.color,
				status: 'online'
			})
		}

		// Listen for user changes from Y.js awareness
		const awareness = this.yjsManager.getAwareness()
		awareness.on('change', (changes: any) => {
			// Update user awareness when remote users change
			this.updateUserAwarenessFromYjs(awareness)
		})

		// Listen for user awareness changes
		this.userAwareness.onUsersChange((users) => {
			console.log('Users changed:', users)
		})
	}

	private updateUserAwarenessFromYjs(awareness: any): void {
		if (!this.userAwareness) return

		const states = awareness.getStates()
		states.forEach((state: any, clientId: number) => {
			if (state.user && this.userAwareness) {
				const user = {
					id: state.user.id,
					name: state.user.name,
					color: state.user.color,
					status: state.user.status || 'online'
				}
				
				// Add or update user in awareness
				this.userAwareness.addUser(user)
			}
		})
	}

	private updateConnectionStatus(connected: boolean): void {
		// Update connection status in console for now
		console.log(`Collaborative connection: ${connected ? '🟢 Connected' : '🔴 Disconnected'}`)
	}

	private initializeP2PConnection(): void {
		if (!this.yjsManager) return

		// Connect to P2P network
		this.yjsManager.connect()

		// Set up periodic connection check
		setInterval(() => {
			if (this.yjsManager && !this.yjsManager.isConnected()) {
				console.log('Attempting to reconnect...')
				this.yjsManager.connect()
			}
		}, 30000) // Check every 30 seconds
	}

	// Note: This method name conflicts with Obsidian's Plugin class
	// We'll rename it to avoid the conflict
	private setupEditorExtension(): void {
		if (!this.yjsManager) return

		// Get the main text element from Y.js
		const ytext = this.yjsManager.getText('content')

		// For now, just log that we're ready
		// CodeMirror integration will be implemented in a later phase
		console.log('Collaborative editor extension ready for integration')
		console.log('Y.js text element:', ytext.toString())
		console.log('Document content length:', ytext.length)
	}

	onunload() {
		console.log('Unloading Collaborative Plugin')

		// Clean up all components
		if (this.editorBinding) {
			this.editorBinding.destroy()
		}

		if (this.yjsManager) {
			this.yjsManager.destroy()
		}

		if (this.userAwareness) {
			this.userAwareness.destroy()
		}

		if (this.shareDialog) {
			this.shareDialog.destroy()
		}

		if (this.accessControl) {
			this.accessControl.destroy()
		}

		this.isInitialized = false
		console.log('Collaborative Plugin unloaded')
	}

	// Public API methods for other parts of the plugin
	public getYjsManager(): YjsManager | undefined {
		return this.yjsManager
	}

	public getP2PProvider(): P2PProvider | undefined {
		return this.p2pProvider
	}

	public getUserAwareness(): UserAwareness | undefined {
		return this.userAwareness
	}

	public getShareDialog(): ShareDialog | undefined {
		return this.shareDialog
	}

	public getEncryptionManager(): EncryptionManager | undefined {
		return this.encryptionManager
	}

	public getAccessControl(): AccessControl | undefined {
		return this.accessControl
	}

	public isPluginInitialized(): boolean {
		return this.isInitialized
	}

	// Utility methods
	public getConnectionStatus(): boolean {
		return this.yjsManager ? this.yjsManager.isConnected() : false
	}

	public getConnectedUsersCount(): number {
		if (!this.yjsManager) return 0
		const users = this.yjsManager.getConnectedUsers()
		return users.size
	}

	public getDocumentContent(): string {
		if (!this.yjsManager) return ''
		const ytext = this.yjsManager.getText('content')
		return ytext.toString()
	}

	public setDocumentContent(content: string): void {
		if (!this.yjsManager) return
		const ytext = this.yjsManager.getText('content')
		ytext.delete(0, ytext.length)
		ytext.insert(0, content)
	}
}