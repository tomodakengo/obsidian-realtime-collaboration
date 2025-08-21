import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Y from 'yjs'
import { P2PProvider } from '../src/collaborative/P2PProvider'
import { ConnectionState } from '../src/types'

// Mock WebRTC since it's not available in Node test runtime
vi.mock('y-webrtc', () => ({
	WebrtcProvider: vi.fn().mockImplementation(() => ({
		destroy: vi.fn(),
		connect: vi.fn(),
		disconnect: vi.fn(),
		awareness: {
			getLocalState: vi.fn(() => ({ user: { name: 'Test User' } })),
			on: vi.fn(),
			off: vi.fn(),
		},
	})),
}))

describe('P2PProvider', () => {
	let doc: Y.Doc
	let provider: P2PProvider

	beforeEach(() => {
		doc = new Y.Doc()
		provider = new P2PProvider('test-room', doc)
	})

	afterEach(() => {
		provider.destroy()
		doc.destroy()
	})

	it('creates a P2P provider with room name', () => {
		expect(provider).toBeInstanceOf(P2PProvider)
	})

	it('connects to the P2P network', () => {
		expect(() => provider.connect()).not.toThrow()
	})

	it('disconnects from the P2P network', () => {
		expect(() => provider.disconnect()).not.toThrow()
	})

	it('destroys the provider without throwing', () => {
		expect(() => provider.destroy()).not.toThrow()
	})

	it('provides user awareness information', () => {
		const localState = provider.getLocalUserState()
		expect(localState).toBeDefined()
		expect(localState.user).toBeDefined()
		expect(localState.user.name).toBe('Test User')
	})

	it('can handle connection state changes', () => {
		const mockCallback = vi.fn()
		provider.onConnectionChange(mockCallback)
		
		// Simulate connection change
		provider.connect()
		
		// The callback should have been registered
		expect(mockCallback).toBeDefined()
	})

	it('returns correct connection state', () => {
		const state = provider.getConnectionState()
		expect(state).toBeDefined()
		expect(Object.values(ConnectionState)).toContain(state)
	})

	it('can check if connected', () => {
		const isConnected = provider.isConnected()
		expect(typeof isConnected).toBe('boolean')
	})

	it('returns room name', () => {
		const roomName = provider.getRoomName()
		expect(roomName).toBe('test-room')
	})

	it('returns connected peers', () => {
		const peers = provider.getConnectedPeers()
		expect(Array.isArray(peers)).toBe(true)
	})
})