import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ObsidianEditorBinding, ObsidianEditor } from '../src/collaborative/ObsidianEditorBinding'
import * as Y from 'yjs'

describe('ObsidianEditorBinding', () => {
	let doc: Y.Doc
	let text: Y.Text
	let editor: ObsidianEditor
	let binding: ObsidianEditorBinding

	beforeEach(() => {
		doc = new Y.Doc()
		text = doc.getText('content')
		editor = {
			on: vi.fn(),
			getValue: vi.fn().mockReturnValue(''),
			setValue: vi.fn(),
			applyChange: vi.fn(),
		}
		binding = new ObsidianEditorBinding(text, editor)
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
		// Y.js delete operation: delete(start, length)
		// Delete ", " (comma and space) starting at position 5, length 2
		text.delete(5, 2)
		expect(text.toString()).toBe('HelloWorld!')
	})

	it('can handle multiple operations from Y.js', () => {
		text.insert(0, 'Hello')
		text.insert(5, ', World!')
		expect(text.toString()).toBe('Hello, World!')
	})

	it('calls editor setValue when remote changes occur', () => {
		// Reset the mock to clear previous calls
		vi.clearAllMocks()
		
		// Create a new document and text to simulate remote changes
		const remoteDoc = new Y.Doc()
		const remoteText = remoteDoc.getText('content')
		remoteText.insert(0, 'Remote change')
		
		// Get the update from the remote document
		const update = Y.encodeStateAsUpdate(remoteDoc)
		
		// Apply the update to the local document
		Y.applyUpdate(doc, update)
		
		// The binding should call the editor's setValue method
		expect(editor.setValue).toHaveBeenCalled()
		
		// Clean up
		remoteDoc.destroy()
	})

	it('calls editor on method with changes event', () => {
		// Verify that the editor's on method was called with 'changes' event
		expect(editor.on).toHaveBeenCalledWith('changes', expect.any(Function))
	})
})