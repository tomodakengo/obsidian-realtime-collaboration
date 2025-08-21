import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { UserAwareness } from '../src/ui/UserAwareness'

// Mock DOM elements
const mockElement = () => {
	let innerHTML = ''
	return {
		get innerHTML() { return innerHTML },
		set innerHTML(value: string) { innerHTML = value },
		classList: {
			add: vi.fn(),
			remove: vi.fn(),
			contains: vi.fn()
		},
		appendChild: vi.fn((child: any) => {
			if (child && child.innerHTML) {
				innerHTML += child.innerHTML
			} else if (child && child.textContent) {
				innerHTML += child.textContent
			}
		}),
		removeChild: vi.fn(),
		querySelector: vi.fn(),
		querySelectorAll: vi.fn(() => []),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		style: {},
		children: [],
		textContent: ''
	}
}

// Mock document.createElement
Object.defineProperty(globalThis, 'document', {
	value: {
		createElement: vi.fn((tagName: string) => {
			const element = mockElement()
			element.tagName = tagName
			return element
		})
	},
	writable: true
})

describe('UserAwareness', () => {
	let doc: Y.Doc
	let awareness: Awareness
	let container: any
	let userAwareness: UserAwareness

	beforeEach(() => {
		doc = new Y.Doc()
		awareness = new Awareness(doc)
		container = mockElement()
		vi.clearAllMocks()
	})

	afterEach(() => {
		if (userAwareness) {
			userAwareness.destroy()
		}
		awareness.destroy()
		doc.destroy()
	})

	describe('Basic functionality', () => {
		it('constructs without throwing', () => {
			expect(() => {
				userAwareness = new UserAwareness(awareness, container)
			}).not.toThrow()
		})

		it('provides destroy method', () => {
			userAwareness = new UserAwareness(awareness, container)
			expect(() => userAwareness.destroy()).not.toThrow()
		})

		it('renders initial empty state', () => {
			userAwareness = new UserAwareness(awareness, container)
			expect(container.innerHTML).toContain('No users online')
		})
	})

	describe('User display', () => {
		it('shows online users when awareness state changes', () => {
			userAwareness = new UserAwareness(awareness, container)
			
			// Add a user to awareness
			awareness.setLocalState({
				user: { name: 'Alice', color: '#ff0000' },
				cursor: { line: 0, ch: 0 }
			})
			
			// Should update the display
			expect(container.innerHTML).toContain('Alice')
		})

		it('displays multiple users', () => {
			userAwareness = new UserAwareness(awareness, container)
			
			// Simulate multiple users
			const states = new Map()
			states.set(1, {
				user: { name: 'Alice', color: '#ff0000' },
				cursor: { line: 0, ch: 0 }
			})
			states.set(2, {
				user: { name: 'Bob', color: '#00ff00' },
				cursor: { line: 1, ch: 5 }
			})
			
			// Mock awareness.getStates to return our test states
			awareness.getStates = vi.fn(() => states)
			
			// Trigger update
			userAwareness.updateDisplay()
			
			expect(container.innerHTML).toContain('Alice')
			expect(container.innerHTML).toContain('Bob')
		})

		it('removes users when they disconnect', () => {
			userAwareness = new UserAwareness(awareness, container)
			
			// First, add a user
			const states = new Map()
			states.set(1, {
				user: { name: 'Alice', color: '#ff0000' },
				cursor: { line: 0, ch: 0 }
			})
			awareness.getStates = vi.fn(() => states)
			userAwareness.updateDisplay()
			
			expect(container.innerHTML).toContain('Alice')
			
			// Then remove the user
			states.clear()
			awareness.getStates = vi.fn(() => states)
			userAwareness.updateDisplay()
			
			expect(container.innerHTML).not.toContain('Alice')
			expect(container.innerHTML).toContain('No users online')
		})
	})

	describe('User information display', () => {
		it('shows user names', () => {
			userAwareness = new UserAwareness(awareness, container)
			
			const states = new Map()
			states.set(1, {
				user: { name: 'Test User', color: '#ff0000' }
			})
			awareness.getStates = vi.fn(() => states)
			
			userAwareness.updateDisplay()
			expect(container.innerHTML).toContain('Test User')
		})

		it('shows user colors', () => {
			userAwareness = new UserAwareness(awareness, container)
			
			const states = new Map()
			states.set(1, {
				user: { name: 'Alice', color: '#ff0000' }
			})
			awareness.getStates = vi.fn(() => states)
			
			userAwareness.updateDisplay()
			
			// Should create elements with color styling
			expect(document.createElement).toHaveBeenCalled()
		})

		it('shows cursor positions when available', () => {
			userAwareness = new UserAwareness(awareness, container)
			
			const states = new Map()
			states.set(1, {
				user: { name: 'Alice', color: '#ff0000' },
				cursor: { line: 5, ch: 10 }
			})
			awareness.getStates = vi.fn(() => states)
			
			userAwareness.updateDisplay()
			expect(container.innerHTML).toContain('5:10')
		})

		it('handles users without cursor information', () => {
			userAwareness = new UserAwareness(awareness, container)
			
			const states = new Map()
			states.set(1, {
				user: { name: 'Alice', color: '#ff0000' }
				// No cursor information
			})
			awareness.getStates = vi.fn(() => states)
			
			expect(() => userAwareness.updateDisplay()).not.toThrow()
			expect(container.innerHTML).toContain('Alice')
		})
	})

	describe('Real-time updates', () => {
		it('updates automatically when awareness changes', () => {
			userAwareness = new UserAwareness(awareness, container)
			
			// Initially empty
			expect(container.innerHTML).toContain('No users online')
			
			// Add user through awareness
			awareness.setLocalState({
				user: { name: 'Dynamic User', color: '#00ff00' }
			})
			
			// Should automatically update
			expect(container.innerHTML).toContain('Dynamic User')
		})

		it('handles rapid awareness changes', () => {
			userAwareness = new UserAwareness(awareness, container)
			
			// Rapid changes
			for (let i = 0; i < 10; i++) {
				awareness.setLocalState({
					user: { name: `User${i}`, color: '#ff0000' },
					cursor: { line: i, ch: i }
				})
			}
			
			// Should handle without throwing
			expect(() => userAwareness.updateDisplay()).not.toThrow()
		})
	})

	describe('Configuration options', () => {
		it('accepts custom configuration', () => {
			const config = {
				showCursor: false,
				maxUsers: 5,
				className: 'custom-awareness'
			}
			
			userAwareness = new UserAwareness(awareness, container, config)
			expect(container.classList.add).toHaveBeenCalledWith('custom-awareness')
		})

		it('uses default configuration when none provided', () => {
			userAwareness = new UserAwareness(awareness, container)
			expect(container.classList.add).toHaveBeenCalledWith('user-awareness')
		})

		it('respects maxUsers limit', () => {
			const config = { maxUsers: 2 }
			userAwareness = new UserAwareness(awareness, container, config)
			
			// Add more users than the limit
			const states = new Map()
			for (let i = 1; i <= 5; i++) {
				states.set(i, {
					user: { name: `User${i}`, color: '#ff0000' }
				})
			}
			awareness.getStates = vi.fn(() => states)
			
			userAwareness.updateDisplay()
			
			// Should show only maxUsers + indication of more
			const innerHTML = container.innerHTML
			expect(innerHTML).toContain('User1')
			expect(innerHTML).toContain('User2')
			expect(innerHTML).toContain('+3 more')
		})
	})

	describe('Event handling', () => {
		it('emits events when users join', () => {
			const onUserJoin = vi.fn()
			userAwareness = new UserAwareness(awareness, container)
			userAwareness.on('user-join', onUserJoin)
			
			// Simulate awareness update event with proper structure
			const mockEvent = {
				added: [1],
				updated: [],
				removed: []
			}
			
			// Mock the awareness state
			awareness.getStates = vi.fn(() => {
				const states = new Map()
				states.set(1, {
					user: { name: 'New User', color: '#ff0000' }
				})
				return states
			})
			
			// Trigger the awareness listener directly
			userAwareness['awarenessListener'](mockEvent)
			
			expect(onUserJoin).toHaveBeenCalledWith({
				user: { name: 'New User', color: '#ff0000' }
			})
		})

		it('emits events when users leave', () => {
			const onUserLeave = vi.fn()
			userAwareness = new UserAwareness(awareness, container)
			userAwareness.on('user-leave', onUserLeave)
			
			// First simulate user joining
			const joinEvent = {
				added: [1],
				updated: [],
				removed: []
			}
			
			awareness.getStates = vi.fn(() => {
				const states = new Map()
				states.set(1, {
					user: { name: 'Leaving User', color: '#ff0000' }
				})
				return states
			})
			
			userAwareness['awarenessListener'](joinEvent)
			
			// Then simulate user leaving
			const leaveEvent = {
				added: [],
				updated: [],
				removed: [1]
			}
			
			awareness.getStates = vi.fn(() => new Map())
			userAwareness['awarenessListener'](leaveEvent)
			
			expect(onUserLeave).toHaveBeenCalledWith({ clientId: 1 })
		})
	})

	describe('Error handling', () => {
		it('handles malformed awareness states', () => {
			userAwareness = new UserAwareness(awareness, container)
			
			// Mock malformed states
			const states = new Map()
			states.set(1, { invalid: 'state' })
			states.set(2, null)
			states.set(3, undefined)
			awareness.getStates = vi.fn(() => states)
			
			expect(() => userAwareness.updateDisplay()).not.toThrow()
		})

		it('handles DOM manipulation errors gracefully', () => {
			container.innerHTML = '' // Reset
			container.appendChild = vi.fn(() => {
				throw new Error('DOM error')
			})
			
			userAwareness = new UserAwareness(awareness, container)
			
			const states = new Map()
			states.set(1, {
				user: { name: 'Test User', color: '#ff0000' }
			})
			awareness.getStates = vi.fn(() => states)
			
			expect(() => userAwareness.updateDisplay()).not.toThrow()
		})
	})
})