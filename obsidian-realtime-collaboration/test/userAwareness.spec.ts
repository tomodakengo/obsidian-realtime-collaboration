import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { UserAwareness } from '../src/ui/UserAwareness'

describe('UserAwareness', () => {
	let userAwareness: UserAwareness

	beforeEach(() => {
		userAwareness = new UserAwareness()
	})

	afterEach(() => {
		userAwareness.destroy()
	})

	it('creates a user awareness instance', () => {
		expect(userAwareness).toBeInstanceOf(UserAwareness)
	})

	it('can add a user', () => {
		const user = { id: '1', name: 'Test User', color: '#ff0000' }
		userAwareness.addUser(user)
		
		const users = userAwareness.getUsers()
		expect(users).toHaveLength(1)
		expect(users[0]).toEqual(user)
	})

	it('can remove a user', () => {
		const user = { id: '1', name: 'Test User', color: '#ff0000' }
		userAwareness.addUser(user)
		userAwareness.removeUser('1')
		
		const users = userAwareness.getUsers()
		expect(users).toHaveLength(0)
	})

	it('can update user information', () => {
		const user = { id: '1', name: 'Test User', color: '#ff0000' }
		userAwareness.addUser(user)
		
		const updatedUser = { id: '1', name: 'Updated User', color: '#00ff00' }
		userAwareness.updateUser(updatedUser)
		
		const users = userAwareness.getUsers()
		expect(users[0]).toEqual(updatedUser)
	})

	it('can get user by id', () => {
		const user = { id: '1', name: 'Test User', color: '#ff0000' }
		userAwareness.addUser(user)
		
		const foundUser = userAwareness.getUser('1')
		expect(foundUser).toEqual(user)
	})

	it('returns undefined for non-existent user', () => {
		const foundUser = userAwareness.getUser('non-existent')
		expect(foundUser).toBeUndefined()
	})

	it('can get all users', () => {
		const user1 = { id: '1', name: 'User 1', color: '#ff0000' }
		const user2 = { id: '2', name: 'User 2', color: '#00ff00' }
		
		userAwareness.addUser(user1)
		userAwareness.addUser(user2)
		
		const users = userAwareness.getUsers()
		expect(users).toHaveLength(2)
		expect(users).toContainEqual(user1)
		expect(users).toContainEqual(user2)
	})

	it('can clear all users', () => {
		const user = { id: '1', name: 'Test User', color: '#ff0000' }
		userAwareness.addUser(user)
		userAwareness.clearUsers()
		
		const users = userAwareness.getUsers()
		expect(users).toHaveLength(0)
	})

	it('can subscribe to user changes', () => {
		const mockCallback = vi.fn()
		userAwareness.onUsersChange(mockCallback)
		
		const user = { id: '1', name: 'Test User', color: '#ff0000' }
		userAwareness.addUser(user)
		
		// The callback should have been called
		expect(mockCallback).toHaveBeenCalled()
	})

	it('can unsubscribe from user changes', () => {
		const mockCallback = vi.fn()
		userAwareness.onUsersChange(mockCallback)
		userAwareness.offUsersChange(mockCallback)
		
		const user = { id: '1', name: 'Test User', color: '#ff0000' }
		userAwareness.addUser(user)
		
		// The callback should not have been called
		expect(mockCallback).not.toHaveBeenCalled()
	})
})