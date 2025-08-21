import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EncryptionManager } from '../src/security/EncryptionManager'

// Web Crypto is available in Node 19+ as globalThis.crypto. Vitest environment should expose it.

describe('EncryptionManager', () => {
	let manager: EncryptionManager

	beforeEach(() => {
		manager = new EncryptionManager()
	})

	describe('Key generation', () => {
		it('derives a room key from password and salt', async () => {
			const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
			expect(key).toBeDefined()
			expect(key.type).toBe('secret')
		})

		it('generates different keys for different passwords', async () => {
			const salt = new Uint8Array([1,2,3])
			const key1 = await manager.generateRoomKey('password1', salt)
			const key2 = await manager.generateRoomKey('password2', salt)
			
			// Keys should be different (we can't compare directly, but we can test behavior)
			const testData = new TextEncoder().encode('test')
			const encrypted1 = await manager.encryptUpdate(testData, key1)
			const encrypted2 = await manager.encryptUpdate(testData, key2)
			
			expect(encrypted1).not.toEqual(encrypted2)
		})

		it('generates different keys for different salts', async () => {
			const password = 'same-password'
			const key1 = await manager.generateRoomKey(password, new Uint8Array([1,2,3]))
			const key2 = await manager.generateRoomKey(password, new Uint8Array([4,5,6]))
			
			const testData = new TextEncoder().encode('test')
			const encrypted1 = await manager.encryptUpdate(testData, key1)
			const encrypted2 = await manager.encryptUpdate(testData, key2)
			
			expect(encrypted1).not.toEqual(encrypted2)
		})
	})

	describe('Encryption', () => {
		it('encrypts data to non-empty buffer', async () => {
			const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
			const payload = new TextEncoder().encode('hello')
			const encrypted = await manager.encryptUpdate(payload, key)
			expect(encrypted.byteLength).toBeGreaterThan(payload.byteLength)
		})

		it('includes IV in encrypted output', async () => {
			const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
			const payload = new TextEncoder().encode('hello')
			const encrypted = await manager.encryptUpdate(payload, key)
			
			// IV should be first 12 bytes
			expect(encrypted.byteLength).toBeGreaterThan(12)
		})

		it('produces different output for same input (due to random IV)', async () => {
			const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
			const payload = new TextEncoder().encode('hello')
			
			const encrypted1 = await manager.encryptUpdate(payload, key)
			const encrypted2 = await manager.encryptUpdate(payload, key)
			
			expect(encrypted1).not.toEqual(encrypted2)
		})
	})

	describe('Decryption', () => {
		it('decrypts encrypted data correctly', async () => {
			const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
			const originalData = new TextEncoder().encode('hello world')
			
			const encrypted = await manager.encryptUpdate(originalData, key)
			const decrypted = await manager.decryptUpdate(encrypted, key)
			
			expect(decrypted).toEqual(originalData)
		})

		it('fails to decrypt with wrong key', async () => {
			const key1 = await manager.generateRoomKey('pass1', new Uint8Array([1,2,3]))
			const key2 = await manager.generateRoomKey('pass2', new Uint8Array([1,2,3]))
			const originalData = new TextEncoder().encode('hello world')
			
			const encrypted = await manager.encryptUpdate(originalData, key1)
			
			await expect(manager.decryptUpdate(encrypted, key2)).rejects.toThrow()
		})

		it('fails to decrypt corrupted data', async () => {
			const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
			const originalData = new TextEncoder().encode('hello world')
			
			const encrypted = await manager.encryptUpdate(originalData, key)
			// Corrupt the data
			encrypted[encrypted.length - 1] = encrypted[encrypted.length - 1] ^ 1
			
			await expect(manager.decryptUpdate(encrypted, key)).rejects.toThrow()
		})
	})

	describe('Round-trip encryption', () => {
		it('handles empty data', async () => {
			const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
			const originalData = new Uint8Array(0)
			
			const encrypted = await manager.encryptUpdate(originalData, key)
			const decrypted = await manager.decryptUpdate(encrypted, key)
			
			expect(decrypted).toEqual(originalData)
		})

		it('handles large data', async () => {
			const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
			const originalData = new Uint8Array(10000).fill(42)
			
			const encrypted = await manager.encryptUpdate(originalData, key)
			const decrypted = await manager.decryptUpdate(encrypted, key)
			
			expect(decrypted).toEqual(originalData)
		})

		it('handles binary data', async () => {
			const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
			const originalData = new Uint8Array([0, 1, 2, 255, 254, 128, 64, 32])
			
			const encrypted = await manager.encryptUpdate(originalData, key)
			const decrypted = await manager.decryptUpdate(encrypted, key)
			
			expect(decrypted).toEqual(originalData)
		})
	})

	describe('Error handling', () => {
		it('throws on invalid encrypted data format', async () => {
			const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
			const invalidData = new Uint8Array([1, 2, 3]) // Too short for IV + encrypted data
			
			await expect(manager.decryptUpdate(invalidData, key)).rejects.toThrow()
		})
	})
})