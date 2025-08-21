import { describe, it, expect } from 'vitest'
import { EncryptionManager } from '../src/security/EncryptionManager'

// Web Crypto is available in Node 19+ as globalThis.crypto. Vitest environment should expose it.

describe('EncryptionManager', () => {
	it('derives a room key from password and salt', async () => {
		const mgr = new EncryptionManager()
		const key = await mgr.generateRoomKey('pass', new Uint8Array([1,2,3]))
		expect(key).toBeDefined()
	})

	it('encrypts data to non-empty buffer', async () => {
		const mgr = new EncryptionManager()
		const key = await mgr.generateRoomKey('pass', new Uint8Array([1,2,3]))
		const payload = new TextEncoder().encode('hello')
		const enc = await mgr.encryptUpdate(payload, key)
		expect(enc.byteLength).toBeGreaterThan(payload.byteLength)
	})
})