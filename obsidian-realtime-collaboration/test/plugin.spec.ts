import { describe, it, expect } from 'vitest'
import Plugin from '../main'

describe('CollaborativePlugin', () => {
	it('has onload and onunload lifecycle', () => {
		const p: any = new (Plugin as any)()
		expect(typeof p.onload).toBe('function')
		expect(typeof p.onunload).toBe('function')
	})
})