import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { IndexeddbPersistence } from 'y-indexeddb'
import * as awarenessProtocol from 'y-protocols/awareness'

export interface YjsManagerOptions {
	enableIndexeddb?: boolean
	enableWebrtc?: boolean
	doc?: Y.Doc
}

export class YjsManager {
	private readonly doc: Y.Doc
	private readonly providers: Map<string, any> = new Map()
	private readonly awareness: awarenessProtocol.Awareness

	constructor(documentId: string, options: YjsManagerOptions = {}) {
		const inBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'
		const hasIndexedDB = typeof indexedDB !== 'undefined'
		const canWebrtc = inBrowser && typeof (globalThis as any).RTCPeerConnection !== 'undefined'

		this.doc = options.doc ?? new Y.Doc()
		this.awareness = new awarenessProtocol.Awareness(this.doc)

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

	getAwareness(): awarenessProtocol.Awareness {
		return this.awareness
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
		this.doc.destroy()
	}
}