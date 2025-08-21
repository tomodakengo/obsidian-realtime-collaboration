// Create manifest compliance tests per spec
import { describe, it, expect } from 'vitest'
import manifest from '../manifest.json'

// Using tsconfig resolveJsonModule to import JSON

describe('manifest.json', () => {
	it('contains required fields per spec', () => {
		expect(manifest).toHaveProperty('id', 'collaborative-editor')
		expect(manifest).toHaveProperty('name', 'Collaborative Editor')
		expect(manifest).toHaveProperty('minAppVersion', '0.15.0')
		expect(manifest).toHaveProperty('description')
		expect(typeof manifest.description).toBe('string')
		expect(manifest).toHaveProperty('isDesktopOnly', false)
	})
})