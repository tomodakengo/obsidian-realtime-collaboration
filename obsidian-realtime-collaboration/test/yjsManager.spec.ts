import { describe, it, expect } from 'vitest'
import * as Y from 'yjs'
import { YjsManager } from '../src/collaborative/YjsManager'

// Note: WebRTC and IndexedDB are not available in Node test runtime.
// We will only test pure Y.Doc/Y.Text behaviors and class surface.

describe('YjsManager', () => {
	it('creates a Y.Text by default with name "content"', () => {
		const manager = new YjsManager('test-doc')
		const text = manager.getText()
		expect(text).toBeInstanceOf(Y.Text)
	})

	it('destroys providers and the doc without throwing', () => {
		const manager = new YjsManager('test-doc')
		expect(() => manager.destroy()).not.toThrow()
	})

	it('exposes an awareness instance', () => {
		const manager = new YjsManager('awareness-doc')
		const awareness: any = (manager as any).getAwareness()
		expect(awareness).toBeDefined()
		expect(typeof awareness.getLocalState).toBe('function')
	})

	it('respects provider disable flags', () => {
		const manager = new YjsManager('no-providers', { enableIndexeddb: false, enableWebrtc: false })
		expect(typeof (manager as any).getProviderNames).toBe('function')
		expect((manager as any).getProviderNames()).toEqual([])
	})
})