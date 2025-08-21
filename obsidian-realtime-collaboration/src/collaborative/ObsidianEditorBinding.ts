import * as Y from 'yjs'

export interface ObsidianEditor {
	on(event: 'changes', handler: (changes: any) => void): void
	applyChange?(change: any): void
	getValue(): string
	setValue(value: string): void
}

export class ObsidianEditorBinding {
	private readonly ytext: Y.Text
	private readonly editor: ObsidianEditor
	private isUpdating = false
	private lastAppliedLength = 0

	constructor(ytext: Y.Text, editor: ObsidianEditor) {
		this.ytext = ytext
		this.editor = editor
		this.setupBindings()
		this.syncInitialContent()
	}

	private setupBindings(): void {
		// Y.js → Editor binding
		this.ytext.observe((event: any) => {
			// Check if this is a remote change (not local)
			if (!event.transaction?.local && !this.isUpdating) {
				this.isUpdating = true
				try {
					// Apply remote changes to editor
					this.applyRemoteChangesToEditor(event)
				} finally {
					this.isUpdating = false
				}
			}
		})

		// Editor → Y.js binding
		this.editor.on('changes', (changes: any) => {
			if (!this.isUpdating) {
				this.isUpdating = true
				try {
					// Apply editor changes to Y.js
					this.applyEditorChangesToYjs(changes)
				} finally {
					this.isUpdating = false
				}
			}
		})
	}

	private syncInitialContent(): void {
		// Sync initial content from Y.js to editor
		const yjsContent = this.ytext.toString()
		const editorContent = this.editor.getValue()
		
		if (yjsContent !== editorContent) {
			if (yjsContent.length > 0) {
				// Y.js has content, sync to editor
				this.editor.setValue(yjsContent)
			} else if (editorContent.length > 0) {
				// Editor has content, sync to Y.js
				this.ytext.delete(0, this.ytext.length)
				this.ytext.insert(0, editorContent)
			}
		}
		this.lastAppliedLength = this.ytext.length
	}

	private applyRemoteChangesToEditor(event: any): void {
		try {
			// Get the current Y.js content
			const yjsContent = this.ytext.toString()
			const editorContent = this.editor.getValue()
			
			// Only update if content actually changed
			if (yjsContent !== editorContent) {
				this.editor.setValue(yjsContent)
				this.lastAppliedLength = yjsContent.length
				console.log('Applied remote changes to editor:', yjsContent.length, 'characters')
			}
		} catch (error) {
			console.error('Error applying remote changes to editor:', error)
		}
	}

	private applyEditorChangesToYjs(changes: any): void {
		try {
			const editorContent = this.editor.getValue()
			const yjsContent = this.ytext.toString()
			
			// Only update if content actually changed
			if (editorContent !== yjsContent) {
				// Calculate the difference and apply it to Y.js
				this.applyTextChanges(editorContent, yjsContent)
				this.lastAppliedLength = editorContent.length
				console.log('Applied editor changes to Y.js:', editorContent.length, 'characters')
			}
		} catch (error) {
			console.error('Error applying editor changes to Y.js:', error)
		}
	}

	private applyTextChanges(newContent: string, oldContent: string): void {
		// Simple diff algorithm for text changes
		const minLength = Math.min(newContent.length, oldContent.length)
		let commonPrefix = 0
		
		// Find common prefix
		while (commonPrefix < minLength && newContent[commonPrefix] === oldContent[commonPrefix]) {
			commonPrefix++
		}
		
		// Find common suffix
		let commonSuffix = 0
		while (commonSuffix < minLength - commonPrefix && 
			   newContent[newContent.length - 1 - commonSuffix] === oldContent[oldContent.length - 1 - commonSuffix]) {
			commonSuffix++
		}
		
		// Apply changes
		const startPos = commonPrefix
		const endPos = oldContent.length - commonSuffix
		const newText = newContent.substring(commonPrefix, newContent.length - commonSuffix)
		
		if (endPos > startPos) {
			this.ytext.delete(startPos, endPos)
		}
		if (newText.length > 0) {
			this.ytext.insert(startPos, newText)
		}
	}

	public getYjsText(): Y.Text {
		return this.ytext
	}

	public getEditor(): ObsidianEditor {
		return this.editor
	}

	public isUpdatingContent(): boolean {
		return this.isUpdating
	}

	public destroy(): void {
		// Cleanup observers and event listeners
		this.isUpdating = true
	}
}

// Simple editor binding factory
export function createSimpleEditorBinding(ytext: Y.Text, editor: ObsidianEditor): ObsidianEditorBinding {
	return new ObsidianEditorBinding(ytext, editor)
}

// Placeholder for CodeMirror integration (to be implemented later)
export function createCollaborativeViewPlugin(ytext: Y.Text) {
	// This will be implemented when CodeMirror integration is needed
	console.log('CodeMirror integration not yet implemented')
	return null
}