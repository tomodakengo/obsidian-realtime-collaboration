import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as Y from 'yjs'
import { YjsManager } from '../src/collaborative/YjsManager'

// Note: WebRTC and IndexedDB are not available in Node test runtime.
// We will only test pure Y.Doc/Y.Text behaviors and class surface.

describe('YjsManager', () => {
	let manager: YjsManager

	afterEach(() => {
		if (manager) {
			manager.destroy()
		}
	})

	describe('Basic functionality', () => {
		it('creates a Y.Text by default with name "content"', () => {
			manager = new YjsManager('test-doc')
			const text = manager.getText()
			expect(text).toBeInstanceOf(Y.Text)
		})

		it('creates named Y.Text instances', () => {
			manager = new YjsManager('test-doc')
			const customText = manager.getText('custom')
			expect(customText).toBeInstanceOf(Y.Text)
			expect(customText).not.toBe(manager.getText('content'))
		})

		it('destroys providers and the doc without throwing', () => {
			manager = new YjsManager('test-doc')
			expect(() => manager.destroy()).not.toThrow()
		})
	})

	describe('Provider management', () => {
		it('disables providers when options are false', () => {
			manager = new YjsManager('test-doc', {
				enableIndexeddb: false,
				enableWebrtc: false
			})
			expect(() => manager.getText()).not.toThrow()
		})

		it('accepts custom Y.Doc instance', () => {
			const customDoc = new Y.Doc()
			manager = new YjsManager('test-doc', { doc: customDoc })
			const text = manager.getText()
			expect(text.doc).toBe(customDoc)
		})
	})

	describe('Awareness functionality', () => {
		it('provides awareness instance', () => {
			manager = new YjsManager('test-doc')
			const awareness = manager.getAwareness()
			expect(awareness).toBeDefined()
			expect(typeof awareness.setLocalState).toBe('function')
		})

		it('allows setting local state', () => {
			manager = new YjsManager('test-doc')
			const awareness = manager.getAwareness()
			const userState = { name: 'Test User', cursor: { line: 0, ch: 0 } }
			
			expect(() => awareness.setLocalState(userState)).not.toThrow()
		})

		it('tracks awareness changes', () => {
			manager = new YjsManager('test-doc')
			const awareness = manager.getAwareness()
			let changeCount = 0
			
			awareness.on('change', () => {
				changeCount++
			})
			
			awareness.setLocalState({ name: 'Test User' })
			expect(changeCount).toBeGreaterThan(0)
		})
	})

	describe('Document state management', () => {
		it('provides document state as Uint8Array', () => {
			manager = new YjsManager('test-doc')
			const text = manager.getText()
			text.insert(0, 'Hello World')
			
			const state = manager.getDocumentState()
			expect(state).toBeInstanceOf(Uint8Array)
			expect(state.length).toBeGreaterThan(0)
		})

		it('applies state vector correctly', () => {
			const doc1 = new Y.Doc()
			const doc2 = new Y.Doc()
			
			manager = new YjsManager('test-doc', { doc: doc1 })
			const manager2 = new YjsManager('test-doc', { doc: doc2 })
			
			// Make changes in first doc
			const text1 = manager.getText()
			text1.insert(0, 'Hello')
			
			// Get state and apply to second doc
			const state = manager.getDocumentState()
			manager2.applyUpdate(state)
			
			const text2 = manager2.getText()
			expect(text2.toString()).toBe('Hello')
			
			manager2.destroy()
		})

		it('generates state vector for synchronization', () => {
			manager = new YjsManager('test-doc')
			const text = manager.getText()
			text.insert(0, 'Test content')
			
			const stateVector = manager.getStateVector()
			expect(stateVector).toBeInstanceOf(Uint8Array)
		})
	})

	describe('Connection status', () => {
		it('reports connection status correctly', () => {
			manager = new YjsManager('test-doc', {
				enableWebrtc: false,
				enableIndexeddb: false
			})
			
			const status = manager.getConnectionStatus()
			expect(status).toHaveProperty('webrtc')
			expect(status).toHaveProperty('indexeddb')
			expect(status.webrtc).toBe('disabled')
			expect(status.indexeddb).toBe('disabled')
		})
	})
})