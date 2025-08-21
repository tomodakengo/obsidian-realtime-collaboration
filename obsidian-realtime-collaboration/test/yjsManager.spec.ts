import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as Y from 'yjs'
import { YjsManager } from '../src/collaborative/YjsManager'

// Note: WebRTC and IndexedDB are not available in Node test runtime.
// We will only test pure Y.Doc/Y.Text behaviors and class surface.

describe('YjsManager', () => {
	let manager: YjsManager

	beforeEach(() => {
		manager = new YjsManager('test-doc')
	})

	afterEach(() => {
		manager.destroy()
	})

	it('creates a Y.Text by default with name "content"', () => {
		const text = manager.getText()
		expect(text).toBeInstanceOf(Y.Text)
	})

	it('creates a Y.Text with custom name', () => {
		const text = manager.getText('custom-content')
		expect(text).toBeInstanceOf(Y.Text)
	})

	it('returns the same Y.Text instance for the same name', () => {
		const text1 = manager.getText('content')
		const text2 = manager.getText('content')
		expect(text1).toBe(text2)
	})

	it('creates different Y.Text instances for different names', () => {
		const text1 = manager.getText('content1')
		const text2 = manager.getText('content2')
		expect(text1).not.toBe(text2)
	})

	it('destroys providers and the doc without throwing', () => {
		expect(() => manager.destroy()).not.toThrow()
	})

	it('can handle text operations', () => {
		const text = manager.getText()
		text.insert(0, 'Hello, World!')
		expect(text.toString()).toBe('Hello, World!')
	})

	it('can handle multiple text operations', () => {
		const text = manager.getText()
		text.insert(0, 'Hello')
		text.insert(5, ', World!')
		expect(text.toString()).toBe('Hello, World!')
	})

	it('can handle text deletion', () => {
		const text = manager.getText()
		text.insert(0, 'Hello, World!')
		text.delete(5, 7) // Delete ", "
		expect(text.toString()).toBe('HelloWorld!')
	})
})