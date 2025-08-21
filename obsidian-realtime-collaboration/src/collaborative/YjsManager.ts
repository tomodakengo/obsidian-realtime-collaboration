import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { IndexeddbPersistence } from 'y-indexeddb'
import { Awareness } from 'y-protocols/awareness'

export interface YjsManagerOptions {
	enableIndexeddb?: boolean
	enableWebrtc?: boolean
	doc?: Y.Doc
}

export interface ConnectionStatus {
	webrtc: 'disabled' | 'connecting' | 'connected' | 'disconnected'
	indexeddb: 'disabled' | 'connecting' | 'connected' | 'error'
}

export class YjsManager {
	private readonly doc: Y.Doc
	private readonly providers: Map<string, any> = new Map()
	private readonly awareness: Awareness

	constructor(documentId: string, options: YjsManagerOptions = {}) {
		const inBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'
		const hasIndexedDB = typeof indexedDB !== 'undefined'
		const canWebrtc = inBrowser && typeof (globalThis as any).RTCPeerConnection !== 'undefined'

		this.doc = options.doc ?? new Y.Doc()
		this.awareness = new Awareness(this.doc)

		const shouldIndexeddb = options.enableIndexeddb ?? (inBrowser && hasIndexedDB)
		const shouldWebrtc = options.enableWebrtc ?? canWebrtc

		if (shouldIndexeddb) {
			try {
				const yIndexeddb = new IndexeddbPersistence(documentId, this.doc)
				this.providers.set('indexeddb', yIndexeddb)
			} catch (_) {
				// ignore in unsupported environments
			}
		}

		if (shouldWebrtc) {
			try {
				const webrtc = new WebrtcProvider(documentId, this.doc)
				this.providers.set('webrtc', webrtc)
			} catch (_) {
				// ignore in unsupported environments
			}
		}
	}

	getText(name: string = 'content'): Y.Text {
		return this.doc.getText(name)
	}

	getAwareness(): Awareness {
		return this.awareness
	}

	getDocumentState(): Uint8Array {
		return Y.encodeStateAsUpdate(this.doc)
	}

	applyUpdate(update: Uint8Array): void {
		Y.applyUpdate(this.doc, update)
	}

	getStateVector(): Uint8Array {
		return Y.encodeStateVector(this.doc)
	}

	getConnectionStatus(): ConnectionStatus {
		const webrtcProvider = this.providers.get('webrtc')
		const indexeddbProvider = this.providers.get('indexeddb')

		return {
			webrtc: webrtcProvider ? 'connected' : 'disabled',
			indexeddb: indexeddbProvider ? 'connected' : 'disabled'
		}
	}

	destroy(): void {
		this.providers.forEach((p) => {
			try {
				if (p && typeof p.destroy === 'function') p.destroy()
			} catch (_) {
				// ignore provider cleanup errors
			}
		})
		this.providers.clear()
		this.awareness.destroy()
		this.doc.destroy()
	}
}