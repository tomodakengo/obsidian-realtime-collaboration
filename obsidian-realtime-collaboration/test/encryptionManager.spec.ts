import { describe, it, expect, beforeEach } from 'vitest'
import { EncryptionManager } from '../src/security/EncryptionManager'

// Web Crypto is available in Node 19+ as globalThis.crypto. Vitest environment should expose it.

describe('EncryptionManager', () => {
	let manager: EncryptionManager

	beforeEach(() => {
		manager = new EncryptionManager()
	})

	it('derives a room key from password and salt', async () => {
		const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
		expect(key).toBeDefined()
		expect(key.type).toBe('secret')
		expect(key.algorithm).toBeDefined()
	})

	it('encrypts data to non-empty buffer', async () => {
		const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
		const payload = new TextEncoder().encode('hello')
		const enc = await manager.encryptUpdate(payload, key)
		expect(enc.byteLength).toBeGreaterThan(payload.byteLength)
	})

	it('encrypts different data to different results', async () => {
		const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
		const payload1 = new TextEncoder().encode('hello')
		const payload2 = new TextEncoder().encode('world')
		
		const enc1 = await manager.encryptUpdate(payload1, key)
		const enc2 = await manager.encryptUpdate(payload2, key)
		
		expect(enc1).not.toEqual(enc2)
	})

	it('generates different keys for different passwords', async () => {
		const salt = new Uint8Array([1,2,3])
		const key1 = await manager.generateRoomKey('pass1', salt)
		const key2 = await manager.generateRoomKey('pass2', salt)
		
		// Test that the keys produce different encrypted outputs for the same data
		const testData = new TextEncoder().encode('test')
		const encrypted1 = await manager.encryptUpdate(testData, key1)
		const encrypted2 = await manager.encryptUpdate(testData, key2)
		
		// Different keys should produce different encrypted outputs
		expect(encrypted1).not.toEqual(encrypted2)
		
		// Also test that key2 cannot decrypt data encrypted with key1
		await expect(manager.decryptUpdate(encrypted1, key2)).rejects.toThrow()
	})

	it('generates different keys for different salts', async () => {
		const salt1 = new Uint8Array([1,2,3])
		const salt2 = new Uint8Array([3,2,1])
		const key1 = await manager.generateRoomKey('pass', salt1)
		const key2 = await manager.generateRoomKey('pass', salt2)
		
		// Test that the keys produce different encrypted outputs for the same data
		const testData = new TextEncoder().encode('test')
		const encrypted1 = await manager.encryptUpdate(testData, key1)
		const encrypted2 = await manager.encryptUpdate(testData, key2)
		
		// Different keys should produce different encrypted outputs
		expect(encrypted1).not.toEqual(encrypted2)
		
		// Also test that key2 cannot decrypt data encrypted with key1
		await expect(manager.decryptUpdate(encrypted1, key2)).rejects.toThrow()
	})

	it('handles empty payload encryption', async () => {
		const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
		const payload = new Uint8Array(0)
		const enc = await manager.encryptUpdate(payload, key)
		expect(enc.byteLength).toBeGreaterThan(0)
	})

	it('handles large payload encryption', async () => {
		const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
		const payload = new Uint8Array(1000).fill(65) // 1000 bytes of 'A'
		const enc = await manager.encryptUpdate(payload, key)
		expect(enc.byteLength).toBeGreaterThan(payload.byteLength)
	})

	it('can decrypt encrypted data', async () => {
		const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
		const originalPayload = new TextEncoder().encode('Hello, World!')
		const encrypted = await manager.encryptUpdate(originalPayload, key)
		const decrypted = await manager.decryptUpdate(encrypted, key)
		
		expect(decrypted).toEqual(originalPayload)
	})

	it('can decrypt text data', async () => {
		const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
		const originalText = 'Hello, World!'
		const encrypted = await manager.encryptText(originalText, key)
		const decrypted = await manager.decryptText(encrypted, key)
		
		expect(decrypted).toBe(originalText)
	})

	it('generates random keys', async () => {
		const key1 = await manager.generateRandomKey()
		const key2 = await manager.generateRandomKey()
		
		expect(key1).toBeDefined()
		expect(key2).toBeDefined()
		
		// Test that the keys produce different encrypted outputs for the same data
		const testData = new TextEncoder().encode('test')
		const encrypted1 = await manager.encryptUpdate(testData, key1)
		const encrypted2 = await manager.encryptUpdate(testData, key2)
		
		// Different keys should produce different encrypted outputs
		expect(encrypted1).not.toEqual(encrypted2)
		
		// Also test that key2 cannot decrypt data encrypted with key1
		await expect(manager.decryptUpdate(encrypted1, key2)).rejects.toThrow()
	})

	it('generates random salts', async () => {
		const salt1 = await manager.generateRandomSalt()
		const salt2 = await manager.generateRandomSalt()
		
		expect(salt1).toBeDefined()
		expect(salt2).toBeDefined()
		expect(salt1).not.toEqual(salt2)
		expect(salt1.length).toBe(16)
		expect(salt2.length).toBe(16)
	})

	it('hashes passwords consistently', async () => {
		const salt = new Uint8Array([1,2,3])
		const password = 'test-password'
		
		const hash1 = await manager.hashPassword(password, salt)
		const hash2 = await manager.hashPassword(password, salt)
		
		expect(hash1).toBe(hash2)
		expect(hash1).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex string
	})

	it('verifies passwords correctly', async () => {
		const salt = new Uint8Array([1,2,3])
		const password = 'test-password'
		
		const hash = await manager.hashPassword(password, salt)
		
		expect(await manager.verifyPassword(password, salt, hash)).toBe(true)
		expect(await manager.verifyPassword('wrong-password', salt, hash)).toBe(false)
	})

	it('generates RSA key pairs', async () => {
		const keyPair = await manager.generateKeyPair()
		
		expect(keyPair.publicKey).toBeDefined()
		expect(keyPair.privateKey).toBeDefined()
		expect(keyPair.publicKey.type).toBe('public')
		expect(keyPair.privateKey.type).toBe('private')
	})

	it('can encrypt and decrypt with RSA', async () => {
		const keyPair = await manager.generateKeyPair()
		const originalData = new TextEncoder().encode('Hello, RSA!')
		
		const encrypted = await manager.encryptWithPublicKey(originalData.buffer, keyPair.publicKey)
		const decrypted = await manager.decryptWithPrivateKey(encrypted, keyPair.privateKey)
		
		expect(new Uint8Array(decrypted)).toEqual(originalData)
	})

	it('can sign and verify data', async () => {
		const keyPair = await manager.generateSigningKeyPair()
		const data = new TextEncoder().encode('Hello, Signature!')
		
		const signature = await manager.signData(data.buffer, keyPair.privateKey)
		const isValid = await manager.verifySignature(data.buffer, signature, keyPair.publicKey)
		
		expect(isValid).toBe(true)
	})

	it('fails to decrypt with wrong key', async () => {
		const key1 = await manager.generateRoomKey('pass1', new Uint8Array([1,2,3]))
		const key2 = await manager.generateRoomKey('pass2', new Uint8Array([1,2,3]))
		const payload = new TextEncoder().encode('Hello, World!')
		
		const encrypted = await manager.encryptUpdate(payload, key1)
		
		await expect(manager.decryptUpdate(encrypted, key2)).rejects.toThrow()
	})

	it('fails to decrypt corrupted data', async () => {
		const key = await manager.generateRoomKey('pass', new Uint8Array([1,2,3]))
		const corruptedData = new Uint8Array(50).fill(0)
		
		await expect(manager.decryptUpdate(corruptedData, key)).rejects.toThrow()
	})
})