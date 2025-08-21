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
			if (!event.transaction?.local && !this.isUpdating) {
				this.isUpdating = true
				// placeholder for applying to editor
				this.isUpdating = false
			}
		})

		this.editor.on('changes', (changes: any) => {
			if (!this.isUpdating) {
				this.isUpdating = true
				// placeholder for applying to yjs
				this.isUpdating = false
			}
		})
	}
}