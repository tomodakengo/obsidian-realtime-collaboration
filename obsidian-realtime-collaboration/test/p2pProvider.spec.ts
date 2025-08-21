import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Y from 'yjs'
import { P2PProvider } from '../src/collaborative/P2PProvider'

// Mock WebRTC APIs for testing
const mockRTCPeerConnection = vi.fn(() => ({
	createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-offer' }),
	createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-answer' }),
	setLocalDescription: vi.fn().mockResolvedValue(undefined),
	setRemoteDescription: vi.fn().mockResolvedValue(undefined),
	addIceCandidate: vi.fn().mockResolvedValue(undefined),
	createDataChannel: vi.fn(() => ({
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		send: vi.fn(),
		close: vi.fn(),
		readyState: 'open'
	})),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	close: vi.fn(),
	connectionState: 'new',
	iceConnectionState: 'new'
}))

// Mock WebSocket for signaling
const mockWebSocket = vi.fn(() => ({
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	send: vi.fn(),
	close: vi.fn(),
	readyState: 1, // OPEN
	CONNECTING: 0,
	OPEN: 1,
	CLOSING: 2,
	CLOSED: 3
}))

// Setup global mocks
Object.defineProperty(globalThis, 'RTCPeerConnection', {
	value: mockRTCPeerConnection,
	writable: true
})

Object.defineProperty(globalThis, 'WebSocket', {
	value: mockWebSocket,
	writable: true
})

describe('P2PProvider', () => {
	let doc: Y.Doc
	let provider: P2PProvider

	beforeEach(() => {
		doc = new Y.Doc()
		vi.clearAllMocks()
	})

	afterEach(() => {
		if (provider) {
			provider.destroy()
		}
		doc.destroy()
	})

	describe('Basic functionality', () => {
		it('constructs without throwing', () => {
			expect(() => {
				provider = new P2PProvider('test-room', doc)
			}).not.toThrow()
		})

		it('provides destroy method', () => {
			provider = new P2PProvider('test-room', doc)
			expect(() => provider.destroy()).not.toThrow()
		})

		it('exposes room name', () => {
			provider = new P2PProvider('test-room', doc)
			expect(provider.getRoomName()).toBe('test-room')
		})
	})

	describe('Connection management', () => {
		it('reports initial connection status as disconnected', () => {
			provider = new P2PProvider('test-room', doc)
			const status = provider.getConnectionStatus()
			expect(status.state).toBe('disconnected')
			expect(status.connectedPeers).toBe(0)
		})

		it('allows setting signaling servers', () => {
			const signalingServers = ['ws://localhost:4444', 'ws://backup.example.com']
			provider = new P2PProvider('test-room', doc, { signalingServers })
			
			expect(provider.getSignalingServers()).toEqual(signalingServers)
		})

		it('connects to signaling server', async () => {
			// Mock WebSocket to immediately trigger open event
			mockWebSocket.mockImplementationOnce((url: string) => {
				const ws = {
					addEventListener: vi.fn((event: string, handler: Function) => {
						if (event === 'open') {
							setTimeout(() => handler({}), 0)
						}
					}),
					removeEventListener: vi.fn(),
					send: vi.fn(),
					close: vi.fn(),
					readyState: 1
				}
				return ws
			})
			
			provider = new P2PProvider('test-room', doc, {
				signalingServers: ['ws://localhost:4444']
			})
			
			await provider.connect()
			expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:4444')
		})

		it('handles connection failures gracefully', async () => {
			mockWebSocket.mockImplementationOnce(() => {
				throw new Error('Connection failed')
			})
			
			provider = new P2PProvider('test-room', doc)
			
			await expect(provider.connect()).rejects.toThrow('Connection failed')
		})
	})

	describe('Peer management', () => {
		it('tracks connected peers', () => {
			provider = new P2PProvider('test-room', doc)
			
			// Simulate peer connection
			provider.addPeer('peer-1')
			expect(provider.getConnectedPeers()).toContain('peer-1')
			expect(provider.getConnectionStatus().connectedPeers).toBe(1)
		})

		it('removes disconnected peers', () => {
			provider = new P2PProvider('test-room', doc)
			
			provider.addPeer('peer-1')
			provider.addPeer('peer-2')
			expect(provider.getConnectionStatus().connectedPeers).toBe(2)
			
			provider.removePeer('peer-1')
			expect(provider.getConnectedPeers()).not.toContain('peer-1')
			expect(provider.getConnectedPeers()).toContain('peer-2')
			expect(provider.getConnectionStatus().connectedPeers).toBe(1)
		})

		it('emits events on peer changes', () => {
			provider = new P2PProvider('test-room', doc)
			const peerConnectedSpy = vi.fn()
			const peerDisconnectedSpy = vi.fn()
			
			provider.on('peer-connected', peerConnectedSpy)
			provider.on('peer-disconnected', peerDisconnectedSpy)
			
			provider.addPeer('peer-1')
			expect(peerConnectedSpy).toHaveBeenCalledWith('peer-1')
			
			provider.removePeer('peer-1')
			expect(peerDisconnectedSpy).toHaveBeenCalledWith('peer-1')
		})
	})

	describe('Data synchronization', () => {
		it('sends Y.js updates to peers', () => {
			provider = new P2PProvider('test-room', doc)
			const sendSpy = vi.fn()
			provider.on('send-update', sendSpy)
			
			// Make a change to the document
			const text = doc.getText('content')
			text.insert(0, 'Hello')
			
			// Should trigger update send
			expect(sendSpy).toHaveBeenCalled()
		})

		it('applies received updates to document', () => {
			provider = new P2PProvider('test-room', doc)
			
			// Create update from another document
			const remoteDoc = new Y.Doc()
			const remoteText = remoteDoc.getText('content')
			remoteText.insert(0, 'Remote content')
			const update = Y.encodeStateAsUpdate(remoteDoc)
			
			// Apply received update
			provider.receiveUpdate(update, 'peer-1')
			
			// Document should be updated
			const text = doc.getText('content')
			expect(text.toString()).toBe('Remote content')
			
			remoteDoc.destroy()
		})

		it('handles malformed updates gracefully', () => {
			provider = new P2PProvider('test-room', doc)
			
			// Should not throw with invalid update
			expect(() => {
				provider.receiveUpdate(new Uint8Array([1, 2, 3]), 'peer-1')
			}).not.toThrow()
		})
	})

	describe('Awareness synchronization', () => {
		it('syncs awareness state with peers', () => {
			provider = new P2PProvider('test-room', doc)
			const awareness = provider.getAwareness()
			
			awareness.setLocalState({ name: 'Test User', cursor: { line: 0, ch: 0 } })
			
			// Should trigger awareness update
			const sendSpy = vi.fn()
			provider.on('send-awareness', sendSpy)
			
			// Trigger awareness change
			awareness.setLocalState({ name: 'Test User', cursor: { line: 0, ch: 5 } })
			expect(sendSpy).toHaveBeenCalled()
		})

		it('applies received awareness updates', () => {
			provider = new P2PProvider('test-room', doc)
			const awareness = provider.getAwareness()
			
			// Simulate receiving awareness update
			const remoteState = { name: 'Remote User', cursor: { line: 1, ch: 10 } }
			provider.receiveAwarenessUpdate(
				new Uint8Array([1, 2, 3]), // Mock awareness update
				'peer-1'
			)
			
			// Should handle the update without throwing
			expect(() => awareness.getStates()).not.toThrow()
		})
	})

	describe('Configuration options', () => {
		it('accepts custom configuration', () => {
			const config = {
				signalingServers: ['ws://custom.server.com'],
				iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
				maxConnections: 10
			}
			
			provider = new P2PProvider('test-room', doc, config)
			expect(provider.getSignalingServers()).toEqual(config.signalingServers)
		})

		it('uses default configuration when none provided', () => {
			provider = new P2PProvider('test-room', doc)
			const servers = provider.getSignalingServers()
			expect(Array.isArray(servers)).toBe(true)
			expect(servers.length).toBeGreaterThan(0)
		})
	})

	describe('Error handling', () => {
		it('handles WebRTC errors gracefully', () => {
			mockRTCPeerConnection.mockImplementationOnce(() => {
				throw new Error('WebRTC not supported')
			})
			
			expect(() => {
				provider = new P2PProvider('test-room', doc)
			}).not.toThrow()
		})

		it('handles signaling errors gracefully', async () => {
			// Mock WebSocket to immediately trigger error event
			mockWebSocket.mockImplementationOnce((url: string) => {
				const ws = {
					addEventListener: vi.fn((event: string, handler: Function) => {
						if (event === 'error') {
							setTimeout(() => handler(new Error('Signaling error')), 0)
						}
					}),
					removeEventListener: vi.fn(),
					send: vi.fn(),
					close: vi.fn(),
					readyState: 1
				}
				return ws
			})
			
			provider = new P2PProvider('test-room', doc)
			
			// Should handle error by rejecting
			await expect(provider.connect()).rejects.toThrow('Signaling error')
		})
	})
})