export class EncryptionManager {
	private toArrayBuffer(data: ArrayBuffer | ArrayBufferView): ArrayBuffer {
		const view = data instanceof ArrayBuffer
			? new Uint8Array(data)
			: new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
		const out = new ArrayBuffer(view.byteLength)
		new Uint8Array(out).set(view)
		return out
	}

	async encryptUpdate(update: ArrayBuffer | ArrayBufferView, key: CryptoKey): Promise<Uint8Array> {
		const iv = crypto.getRandomValues(new Uint8Array(12))
		const encrypted = await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv },
			key,
			this.toArrayBuffer(update)
		)
		return new Uint8Array([...iv, ...new Uint8Array(encrypted)])
	}

	async decryptUpdate(encryptedData: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
		try {
			// Extract IV (first 12 bytes) and encrypted data
			const iv = encryptedData.slice(0, 12)
			const encrypted = encryptedData.slice(12)
			
			const decrypted = await crypto.subtle.decrypt(
				{ name: 'AES-GCM', iv },
				key,
				encrypted
			)
			
			return new Uint8Array(decrypted)
		} catch (error) {
			console.error('Decryption failed:', error)
			throw new Error('Failed to decrypt data')
		}
	}

	async generateRoomKey(password: string, salt: ArrayBuffer | ArrayBufferView): Promise<CryptoKey> {
		const keyMaterial = await crypto.subtle.importKey(
			'raw',
			new TextEncoder().encode(password),
			'PBKDF2',
			false,
			['deriveKey']
		)

		return crypto.subtle.deriveKey(
			{ name: 'PBKDF2', salt: this.toArrayBuffer(salt), iterations: 100000, hash: 'SHA-256' },
			keyMaterial,
			{ name: 'AES-GCM', length: 256 },
			false,
			['encrypt', 'decrypt']
		)
	}

	async generateRandomKey(): Promise<CryptoKey> {
		return crypto.subtle.generateKey(
			{ name: 'AES-GCM', length: 256 },
			true,
			['encrypt', 'decrypt']
		)
	}

	async generateRandomSalt(): Promise<Uint8Array> {
		return crypto.getRandomValues(new Uint8Array(16))
	}

	async hashPassword(password: string, salt: ArrayBuffer | ArrayBufferView): Promise<string> {
		const encoder = new TextEncoder()
		const data = encoder.encode(password)
		
		const hashBuffer = await crypto.subtle.digest('SHA-256', data)
		const hashArray = Array.from(new Uint8Array(hashBuffer))
		const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
		
		return hashHex
	}

	async verifyPassword(password: string, salt: ArrayBuffer | ArrayBufferView, expectedHash: string): Promise<boolean> {
		const actualHash = await this.hashPassword(password, salt)
		return actualHash === expectedHash
	}

	async encryptText(text: string, key: CryptoKey): Promise<string> {
		const encoder = new TextEncoder()
		const data = encoder.encode(text)
		
		const encrypted = await this.encryptUpdate(data, key)
		return btoa(String.fromCharCode(...encrypted))
	}

	async decryptText(encryptedText: string, key: CryptoKey): Promise<string> {
		try {
			const encrypted = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0))
			const decrypted = await this.decryptUpdate(encrypted, key)
			
			const decoder = new TextDecoder()
			return decoder.decode(decrypted)
		} catch (error) {
			console.error('Text decryption failed:', error)
			throw new Error('Failed to decrypt text')
		}
	}

	async generateKeyPair(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
		return crypto.subtle.generateKey(
			{
				name: 'RSA-OAEP',
				modulusLength: 2048,
				publicExponent: new Uint8Array([1, 0, 1]),
				hash: 'SHA-256'
			},
			true,
			['encrypt', 'decrypt']
		)
	}

	async encryptWithPublicKey(data: ArrayBuffer, publicKey: CryptoKey): Promise<ArrayBuffer> {
		return crypto.subtle.encrypt(
			{ name: 'RSA-OAEP' },
			publicKey,
			data
		)
	}

	async decryptWithPrivateKey(encryptedData: ArrayBuffer, privateKey: CryptoKey): Promise<ArrayBuffer> {
		return crypto.subtle.decrypt(
			{ name: 'RSA-OAEP' },
			privateKey,
			encryptedData
		)
	}

	async signData(data: ArrayBuffer, privateKey: CryptoKey): Promise<ArrayBuffer> {
		return crypto.subtle.sign(
			{ name: 'RSA-PSS', saltLength: 32 },
			privateKey,
			data
		)
	}

	async verifySignature(data: ArrayBuffer, signature: ArrayBuffer, publicKey: CryptoKey): Promise<boolean> {
		return crypto.subtle.verify(
			{ name: 'RSA-PSS', saltLength: 32 },
			publicKey,
			signature,
			data
		)
	}
}