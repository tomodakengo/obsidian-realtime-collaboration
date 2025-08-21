import * as Y from 'yjs'

export interface EditorChange {
	from: { line: number, ch: number }
	to: { line: number, ch: number }
	text: string[]
	origin?: string
}

export interface MinimalEditorLike {
	on(event: 'changes', handler: (changes: EditorChange[]) => void): void
	getValue?(): string
	setValue?(value: string): void
	replaceRange?(replacement: string, from: { line: number, ch: number }, to?: { line: number, ch: number }): void
	getCursor?(): { line: number, ch: number }
	setCursor?(pos: { line: number, ch: number }): void
}

export class ObsidianEditorBinding {
	private readonly ytext: Y.Text
	private readonly editor: MinimalEditorLike
	private isUpdating = false
	private ytextObserver?: (event: Y.YTextEvent, transaction: Y.Transaction) => void
	private editorChangeHandler?: (changes: EditorChange[]) => void

	constructor(ytext: Y.Text, editor: MinimalEditorLike) {
		this.ytext = ytext
		this.editor = editor
		this.setupBindings()
	}

	private setupBindings(): void {
		// Y.js to Editor synchronization
		this.ytextObserver = (event: Y.YTextEvent, transaction: Y.Transaction) => {
			if (!transaction.local && !this.isUpdating) {
				this.isUpdating = true
				try {
					this.applyYjsChangesToEditor(event)
				} catch (error) {
					console.error('Error applying Y.js changes to editor:', error)
				} finally {
					this.isUpdating = false
				}
			}
		}
		this.ytext.observe(this.ytextObserver)

		// Editor to Y.js synchronization
		this.editorChangeHandler = (changes: EditorChange[]) => {
			if (!this.isUpdating) {
				this.isUpdating = true
				try {
					this.applyEditorChangesToYjs(changes)
				} catch (error) {
					console.error('Error applying editor changes to Y.js:', error)
				} finally {
					this.isUpdating = false
				}
			}
		}
		this.editor.on('changes', this.editorChangeHandler)
	}

	private applyYjsChangesToEditor(event: Y.YTextEvent): void {
		if (!this.editor.replaceRange || !this.editor.getValue) return

		// Store current cursor position before applying changes
		const originalCursor = this.editor.getCursor?.() || { line: 0, ch: 0 }
		const originalCursorIndex = this.positionToIndex(originalCursor)
		
		// Get the current editor content and new Y.js content
		const editorContent = this.editor.getValue()
		const newContent = this.ytext.toString()
		
		// If content is completely different, replace all
		if (editorContent !== newContent) {
			this.editor.replaceRange(newContent, { line: 0, ch: 0 }, this.indexToPosition(editorContent.length))
			
			// Adjust cursor position based on content length changes
			const lengthDiff = newContent.length - editorContent.length
			if (this.editor.setCursor && lengthDiff !== 0) {
				const newCursorIndex = Math.max(0, Math.min(originalCursorIndex + lengthDiff, newContent.length))
				const newCursorPos = this.indexToPosition(newCursorIndex)
				this.editor.setCursor(newCursorPos)
			}
		}
	}

	private applyEditorChangesToYjs(changes: EditorChange[]): void {
		this.ytext.doc?.transact(() => {
			for (const change of changes) {
				try {
					// Validate change object
					if (!change || !change.from || !change.to || !Array.isArray(change.text)) {
						continue
					}

					const from = this.positionToIndex(change.from)
					const to = this.positionToIndex(change.to)
					const text = change.text.join('\n')

					// Apply deletion first if range is selected
					if (to > from) {
						this.ytext.delete(from, to - from)
					}

					// Then apply insertion
					if (text.length > 0) {
						this.ytext.insert(from, text)
					}
				} catch (error) {
					console.error('Error processing editor change:', error)
				}
			}
		}, this)
	}

	private indexToPosition(index: number): { line: number, ch: number } {
		const content = this.ytext.toString()
		let line = 0
		let ch = 0
		
		for (let i = 0; i < Math.min(index, content.length); i++) {
			if (content[i] === '\n') {
				line++
				ch = 0
			} else {
				ch++
			}
		}
		
		return { line, ch }
	}

	private positionToIndex(pos: { line: number, ch: number }): number {
		const content = this.ytext.toString()
		const lines = content.split('\n')
		
		let index = 0
		for (let i = 0; i < pos.line && i < lines.length; i++) {
			index += lines[i].length + 1 // +1 for newline character
		}
		
		if (pos.line < lines.length) {
			index += Math.min(pos.ch, lines[pos.line].length)
		}
		
		return Math.min(index, content.length)
	}

	private preserveCursorPosition(): void {
		if (!this.editor.getCursor || !this.editor.setCursor) return

		try {
			const currentCursor = this.editor.getCursor()
			// For now, keep cursor as is - more sophisticated logic can be added later
			this.editor.setCursor(currentCursor)
		} catch (error) {
			console.error('Error preserving cursor position:', error)
		}
	}

	destroy(): void {
		if (this.ytextObserver) {
			this.ytext.unobserve(this.ytextObserver)
		}
		// Note: Cannot easily remove editor event listeners without reference to original handler
		// This is a limitation of the current editor interface
	}
}