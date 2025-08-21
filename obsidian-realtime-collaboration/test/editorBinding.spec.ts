import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Y from 'yjs'
import { ObsidianEditorBinding, MinimalEditorLike } from '../src/collaborative/ObsidianEditorBinding'

interface MockEditor extends MinimalEditorLike {
	getValue(): string
	setValue(value: string): void
	replaceRange(replacement: string, from: { line: number, ch: number }, to?: { line: number, ch: number }): void
	getCursor(): { line: number, ch: number }
	setCursor(pos: { line: number, ch: number }): void
	somethingSelected(): boolean
	getSelection(): string
	trigger(event: string, data?: any): void
}

function createMockEditor(): MockEditor {
	let content = ''
	let cursor = { line: 0, ch: 0 }
	let selection = ''
	const listeners = new Map<string, Function[]>()

	return {
		on: vi.fn((event: string, handler: Function) => {
			if (!listeners.has(event)) {
				listeners.set(event, [])
			}
			listeners.get(event)!.push(handler)
		}),
		getValue: vi.fn(() => content),
		setValue: vi.fn((value: string) => {
			const oldContent = content
			content = value
			cursor = { line: 0, ch: value.length }
			// Trigger content change for replaceRange calls
			if (oldContent !== value) {
				// This simulates how the editor content actually changes
			}
		}),
		replaceRange: vi.fn((replacement: string, from: { line: number, ch: number }, to?: { line: number, ch: number }) => {
			// Convert positions to indices for string manipulation
			const lines = content.split('\n')
			let startIndex = 0
			for (let i = 0; i < from.line && i < lines.length; i++) {
				startIndex += lines[i].length + 1
			}
			startIndex += from.ch
			
			let endIndex = startIndex
			if (to) {
				endIndex = 0
				for (let i = 0; i < to.line && i < lines.length; i++) {
					endIndex += lines[i].length + 1
				}
				endIndex += to.ch
			}
			
			content = content.slice(0, startIndex) + replacement + content.slice(endIndex)
			cursor = { line: from.line, ch: from.ch + replacement.length }
		}),
		getCursor: vi.fn(() => cursor),
		setCursor: vi.fn((pos: { line: number, ch: number }) => {
			cursor = pos
		}),
		somethingSelected: vi.fn(() => selection.length > 0),
		getSelection: vi.fn(() => selection),
		trigger: vi.fn((event: string, data?: any) => {
			const handlers = listeners.get(event) || []
			handlers.forEach(handler => handler(data))
		})
	}
}

describe('ObsidianEditorBinding', () => {
	let doc: Y.Doc
	let text: Y.Text
	let editor: MockEditor
	let binding: ObsidianEditorBinding

	beforeEach(() => {
		doc = new Y.Doc()
		text = doc.getText('content')
		editor = createMockEditor()
	})

	afterEach(() => {
		if (binding) {
			binding.destroy()
		}
		doc.destroy()
	})

	describe('Basic functionality', () => {
		it('constructs and wires listeners without throwing', () => {
			expect(() => {
				binding = new ObsidianEditorBinding(text, editor)
			}).not.toThrow()
			
			expect(editor.on).toHaveBeenCalledWith('changes', expect.any(Function))
		})

		it('provides destroy method', () => {
			binding = new ObsidianEditorBinding(text, editor)
			expect(() => binding.destroy()).not.toThrow()
		})
	})

	describe('Y.js to Editor synchronization', () => {
		it('applies Y.js text insertions to editor', () => {
			binding = new ObsidianEditorBinding(text, editor)
			
			// Simulate remote change by creating separate doc and applying update
			const remoteDoc = new Y.Doc()
			const remoteText = remoteDoc.getText('content')
			remoteText.insert(0, 'Hello World')
			
			// Apply remote update to our document
			const update = Y.encodeStateAsUpdate(remoteDoc)
			Y.applyUpdate(doc, update)
			
			// Should update editor
			expect(editor.replaceRange).toHaveBeenCalledWith('Hello World', { line: 0, ch: 0 }, { line: 0, ch: 0 })
			
			remoteDoc.destroy()
		})

		it('applies Y.js text deletions to editor', () => {
			// Setup initial content in both docs
			text.insert(0, 'Hello World')
			const remoteDoc = new Y.Doc()
			const remoteText = remoteDoc.getText('content')
			remoteText.insert(0, 'Hello World')
			
			// Sync initial state
			let update = Y.encodeStateAsUpdate(doc)
			Y.applyUpdate(remoteDoc, update)
			
			editor.setValue('Hello World')
			binding = new ObsidianEditorBinding(text, editor)
			
			// Clear mock calls from setup
			vi.clearAllMocks()
			
			// Make remote deletion
			remoteText.delete(5, 6) // Delete ' World'
			
			// Apply remote update to our document
			update = Y.encodeStateAsUpdate(remoteDoc)
			Y.applyUpdate(doc, update)
			
			// Should update editor with the final result
			expect(editor.replaceRange).toHaveBeenCalled()
			
			remoteDoc.destroy()
		})

		it('applies Y.js text replacements to editor', () => {
			// Setup initial content
			text.insert(0, 'Hello World')
			editor.setValue('Hello World')
			binding = new ObsidianEditorBinding(text, editor)
			
			// Clear mock calls from setup
			vi.clearAllMocks()
			
			// Simulate remote replacement
			const remoteDoc = new Y.Doc()
			const remoteText = remoteDoc.getText('content')
			remoteText.insert(0, 'Hello World')
			remoteText.delete(6, 5) // Delete 'World'
			remoteText.insert(6, 'Y.js') // Insert 'Y.js'
			
			// Apply remote update to our document
			const update = Y.encodeStateAsUpdate(remoteDoc)
			Y.applyUpdate(doc, update)
			
			// Should update editor (at least one call for the change)
			expect(editor.replaceRange).toHaveBeenCalled()
			
			remoteDoc.destroy()
		})

		it('does not apply changes from local transactions', () => {
			binding = new ObsidianEditorBinding(text, editor)
			
			// Simulate local change (this would normally come from editor)
			doc.transact(() => {
				text.insert(0, 'Local change')
			}, binding)
			
			// Should not call editor methods for local changes
			expect(editor.replaceRange).not.toHaveBeenCalled()
		})
	})

	describe('Editor to Y.js synchronization', () => {
		it('applies editor insertions to Y.js', () => {
			binding = new ObsidianEditorBinding(text, editor)
			
			const mockChange = {
				from: { line: 0, ch: 0 },
				to: { line: 0, ch: 0 },
				text: ['Hello'],
				origin: '+input'
			}
			
			// Trigger editor change
			editor.trigger('changes', [mockChange])
			
			expect(text.toString()).toBe('Hello')
		})

		it('applies editor deletions to Y.js', () => {
			// Setup initial content
			text.insert(0, 'Hello World')
			binding = new ObsidianEditorBinding(text, editor)
			
			const mockChange = {
				from: { line: 0, ch: 5 },
				to: { line: 0, ch: 11 },
				text: [''],
				origin: '+delete'
			}
			
			// Trigger editor change
			editor.trigger('changes', [mockChange])
			
			expect(text.toString()).toBe('Hello')
		})

		it('applies editor replacements to Y.js', () => {
			// Setup initial content
			text.insert(0, 'Hello World')
			binding = new ObsidianEditorBinding(text, editor)
			
			const mockChange = {
				from: { line: 0, ch: 6 },
				to: { line: 0, ch: 11 },
				text: ['Y.js'],
				origin: '+input'
			}
			
			// Trigger editor change
			editor.trigger('changes', [mockChange])
			
			expect(text.toString()).toBe('Hello Y.js')
		})

		it('handles multiple changes in one transaction', () => {
			binding = new ObsidianEditorBinding(text, editor)
			
			const mockChanges = [
				{
					from: { line: 0, ch: 0 },
					to: { line: 0, ch: 0 },
					text: ['Hello '],
					origin: '+input'
				},
				{
					from: { line: 0, ch: 6 },
					to: { line: 0, ch: 6 },
					text: ['World'],
					origin: '+input'
				}
			]
			
			// Trigger editor changes
			editor.trigger('changes', mockChanges)
			
			expect(text.toString()).toBe('Hello World')
		})
	})

	describe('Cursor and selection synchronization', () => {
		it('preserves cursor position during remote changes', () => {
			// Setup initial content and cursor position
			text.insert(0, 'Hello World')
			editor.setValue('Hello World')
			binding = new ObsidianEditorBinding(text, editor)
			editor.setCursor({ line: 0, ch: 5 })
			
			// Clear mock calls from setup
			vi.clearAllMocks()
			
			// Remote insertion before cursor
			const remoteDoc = new Y.Doc()
			const remoteText = remoteDoc.getText('content')
			remoteText.insert(0, 'Hello World')
			remoteText.insert(0, 'PREFIX ') // Insert before cursor position
			
			// Apply remote change
			const update = Y.encodeStateAsUpdate(remoteDoc)
			Y.applyUpdate(doc, update)
			
			// Cursor should be adjusted due to remote changes
			expect(editor.setCursor).toHaveBeenCalled()
			
			remoteDoc.destroy()
		})

		it('handles concurrent editing without conflicts', () => {
			const doc2 = new Y.Doc()
			const text2 = doc2.getText('content')
			const editor2 = createMockEditor()
			const binding2 = new ObsidianEditorBinding(text2, editor2)
			
			binding = new ObsidianEditorBinding(text, editor)
			
			// Concurrent changes
			text.insert(0, 'Alice: ')
			text2.insert(0, 'Bob: ')
			
			// Sync documents
			const update1 = Y.encodeStateAsUpdate(doc)
			const update2 = Y.encodeStateAsUpdate(doc2)
			Y.applyUpdate(doc2, update1)
			Y.applyUpdate(doc, update2)
			
			// Both documents should converge to same state
			expect(text.toString()).toBe(text2.toString())
			
			binding2.destroy()
			doc2.destroy()
		})
	})

	describe('Error handling', () => {
		it('handles editor errors gracefully', () => {
			editor.replaceRange = vi.fn(() => {
				throw new Error('Editor error')
			})
			
			binding = new ObsidianEditorBinding(text, editor)
			
			// Should not throw when editor operations fail
			expect(() => {
				text.insert(0, 'Hello')
			}).not.toThrow()
		})

		it('handles malformed change events', () => {
			binding = new ObsidianEditorBinding(text, editor)
			
			// Should not throw with malformed change
			expect(() => {
				editor.trigger('changes', [{ invalid: 'change' }])
			}).not.toThrow()
		})
	})
})