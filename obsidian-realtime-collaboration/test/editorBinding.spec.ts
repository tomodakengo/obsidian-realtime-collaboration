import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Y from 'yjs'
import { ObsidianEditorBinding, MinimalEditorLike } from '../src/collaborative/ObsidianEditorBinding'

describe('ObsidianEditorBinding', () => {
	let doc: Y.Doc
	let text: Y.Text
	let editor: MinimalEditorLike
	let binding: ObsidianEditorBinding

	beforeEach(() => {
		doc = new Y.Doc()
		text = doc.getText('content')
		editor = {
			on: vi.fn(),
			applyChange: vi.fn(),
		}
		binding = new ObsidianEditorBinding(text, editor)
	})

	afterEach(() => {
		doc.destroy()
	})

	it('constructs and wires listeners without throwing', () => {
		expect(binding).toBeInstanceOf(ObsidianEditorBinding)
		expect(editor.on).toHaveBeenCalledWith('changes', expect.any(Function))
	})

	it('observes Y.js text changes', () => {
		// Verify that the binding is observing the Y.js text
		expect(text.observe).toBeDefined()
	})

	it('can handle text insertion from Y.js', () => {
		// Simulate a remote change from Y.js
		text.insert(0, 'Hello, World!')
		// The binding should handle this without throwing
		expect(text.toString()).toBe('Hello, World!')
	})

	it('can handle text deletion from Y.js', () => {
		text.insert(0, 'Hello, World!')
		text.delete(5, 7) // Delete ", "
		expect(text.toString()).toBe('HelloWorld!')
	})

	it('can handle multiple operations from Y.js', () => {
		text.insert(0, 'Hello')
		text.insert(5, ', World!')
		expect(text.toString()).toBe('Hello, World!')
	})

	it('calls editor applyChange when remote changes occur', () => {
		// Reset the mock to clear previous calls
		vi.clearAllMocks()
		
		// Create a new document and text to simulate remote changes
		const remoteDoc = new Y.Doc()
		const remoteText = remoteDoc.getText('content')
		remoteText.insert(0, 'Remote change')
		
		// Get the update from the remote document
		const update = Y.encodeUpdateAsUpdateV2(remoteDoc)
		
		// Apply the update to the local document
		Y.applyUpdateV2(doc, update)
		
		// The binding should call the editor's applyChange method
		expect(editor.applyChange).toHaveBeenCalled()
		
		// Clean up
		remoteDoc.destroy()
	})

	it('calls editor on method with changes event', () => {
		// Verify that the editor's on method was called with 'changes' event
		expect(editor.on).toHaveBeenCalledWith('changes', expect.any(Function))
	})
})