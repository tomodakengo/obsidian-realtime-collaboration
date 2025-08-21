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

	async onload() {
		console.log('Loading Collaborative Plugin')

		try {
			// Initialize core components
			this.encryptionManager = new EncryptionManager()
			this.accessControl = new AccessControl()
			this.userAwareness = new UserAwareness()
			this.shareDialog = new ShareDialog()

			// Initialize Y.js manager
			this.yjsManager = new YjsManager('collaborative-doc', {
				enableIndexeddb: true,
				enableWebrtc: true
			})

			// Initialize P2P provider
			this.p2pProvider = new P2PProvider('collaborative-room', this.yjsManager.getDoc())

			// Set up user awareness
			this.setupUserAwareness()

			// Set up connection monitoring
			this.setupConnectionMonitoring()

			// Register editor extension
			this.registerEditorExtension()

			console.log('Collaborative Plugin loaded successfully')
		} catch (error) {
			console.error('Failed to load Collaborative Plugin:', error)
		}
	}

	private setupUserAwareness(): void {
		if (!this.userAwareness) return

		// Add current user
		this.userAwareness.addUser({
			id: 'current-user',
			name: 'Current User',
			color: '#007acc',
			status: 'online'
		})

		// Listen for user changes
		this.userAwareness.onUsersChange((users) => {
			console.log('Users changed:', users)
		})
	}

	private setupConnectionMonitoring(): void {
		if (!this.p2pProvider) return

		this.p2pProvider.onConnectionChange((state) => {
			console.log('Connection state changed:', state)
			
			// Update user status based on connection
			if (this.userAwareness) {
				const currentUser = this.userAwareness.getUser('current-user')
				if (currentUser) {
					this.userAwareness.setUserStatus('current-user', 
						state === ConnectionState.CONNECTED ? 'online' : 'offline'
					)
				}
			}
		})
	}

	private registerEditorExtension(): void {
		// This would integrate with Obsidian's editor system
		// For now, we'll just log that we're ready
		console.log('Editor extension ready for integration')
	}

	onunload() {
		console.log('Unloading Collaborative Plugin')

		// Clean up all components
		if (this.editorBinding) {
			this.editorBinding.destroy()
		}

		if (this.p2pProvider) {
			this.p2pProvider.destroy()
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
}