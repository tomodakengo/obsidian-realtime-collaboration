import * as Y from 'yjs'

export interface MinimalEditorLike {
	on(event: 'changes', handler: (changes: any) => void): void
	applyChange?(change: any): void
}

export class ObsidianEditorBinding {
	private readonly ytext: Y.Text
	private readonly editor: MinimalEditorLike
	private isUpdating = false

	constructor(ytext: Y.Text, editor: MinimalEditorLike) {
		this.ytext = ytext
		this.editor = editor
		this.setupBindings()
	}

	private setupBindings(): void {
		// Y.js → Editor binding
		this.ytext.observe((event: any) => {
			// Check if this is a remote change (not local)
			if (!event.transaction?.local && !this.isUpdating) {
				this.isUpdating = true
				try {
					// Apply remote changes to editor
					if (this.editor.applyChange) {
						// Extract changes from the event
						const changes = this.extractChangesFromEvent(event)
						this.editor.applyChange(changes)
					}
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

	private extractChangesFromEvent(event: any): any {
		// Extract changes from Y.js event
		// This is a simplified implementation - in real usage, you'd want to handle
		// the specific change types (insert, delete, etc.)
		return {
			delta: event.changes?.delta || [],
			transaction: event.transaction,
			timestamp: Date.now()
		}
	}

	private applyEditorChangesToYjs(changes: any): void {
		// Placeholder for applying editor changes to Y.js
		// This will be implemented based on the specific editor interface
		console.log('Applying editor changes to Y.js:', changes)
	}

	public destroy(): void {
		// Cleanup if needed
	}
}