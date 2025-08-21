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

	it('invokes applyChangesToEditor on remote Yjs changes', () => {
		const doc = new Y.Doc()
		const text = doc.getText('content')
		const editor: MinimalEditorLike = { on: vi.fn() }
		const binding = new ObsidianEditorBinding(text, editor)
		const spy = vi.spyOn(binding as any, 'applyChangesToEditor')
		doc.transact(() => {
			text.insert(0, 'a')
		}, undefined, false)
		expect(spy).toHaveBeenCalledTimes(1)
	})

	it('invokes applyChangesToYjs when editor emits changes', () => {
		const doc = new Y.Doc()
		const text = doc.getText('content')
		let changeHandler: ((changes: any) => void) | undefined
		const editor: MinimalEditorLike = {
			on: vi.fn((event: any, handler: any) => {
				if (event === 'changes') changeHandler = handler
			}) as any,
		}
		const binding = new ObsidianEditorBinding(text, editor)
		const spy = vi.spyOn(binding as any, 'applyChangesToYjs')
		changeHandler?.([{ from: 0, to: 0, insert: 'x' }])
		expect(spy).toHaveBeenCalledTimes(1)
	})
})