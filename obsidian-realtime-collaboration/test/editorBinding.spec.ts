import { describe, it, expect, vi } from 'vitest'
import * as Y from 'yjs'
import { ObsidianEditorBinding, MinimalEditorLike } from '../src/collaborative/ObsidianEditorBinding'

describe('ObsidianEditorBinding', () => {
	it('constructs and wires listeners without throwing', () => {
		const doc = new Y.Doc()
		const text = doc.getText('content')
		const editor: MinimalEditorLike = {
			on: vi.fn(),
		}
		expect(() => new ObsidianEditorBinding(text, editor)).not.toThrow()
	})
})