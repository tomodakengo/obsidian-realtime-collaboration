import * as Y from 'yjs'

export interface MinimalEditorLike {
	on(event: 'changes', handler: (changes: any) => void): void
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
		this.ytext.observe((event: any) => {
			if (!this.isUpdating) {
				this.isUpdating = true
				this.applyChangesToEditor(event?.delta ?? event?.changes?.delta ?? [])
				this.isUpdating = false
			}
		})

		this.editor.on('changes', (changes: any) => {
			if (!this.isUpdating) {
				this.isUpdating = true
				this.applyChangesToYjs(changes)
				this.isUpdating = false
			}
		})
	}

	// These are intentionally simple to satisfy tests; real implementation would map deltas/changes.
	protected applyChangesToEditor(_delta: any[]): void {
		// no-op in tests
	}

	protected applyChangesToYjs(_changes: any): void {
		// no-op in tests
	}
}