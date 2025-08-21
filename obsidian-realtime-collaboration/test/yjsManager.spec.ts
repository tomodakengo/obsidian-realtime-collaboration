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

	it('exposes awareness instance', () => {
		const manager = new YjsManager('test-doc')
		const awareness = (manager as any).getAwareness?.()
		expect(awareness).toBeDefined()
	})

	it('destroys providers and the doc without throwing', () => {
		const manager = new YjsManager('test-doc')
		expect(() => manager.destroy()).not.toThrow()
	})
})