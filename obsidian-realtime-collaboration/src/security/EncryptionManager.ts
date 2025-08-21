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

	async decryptUpdate(encryptedData: ArrayBuffer | ArrayBufferView, key: CryptoKey): Promise<Uint8Array> {
		const data = new Uint8Array(this.toArrayBuffer(encryptedData))
		
		if (data.length < 12) {
			throw new Error('Invalid encrypted data: too short for IV')
		}
		
		const iv = data.slice(0, 12)
		const ciphertext = data.slice(12)
		
		try {
			const decrypted = await crypto.subtle.decrypt(
				{ name: 'AES-GCM', iv },
				key,
				ciphertext
			)
			return new Uint8Array(decrypted)
		} catch (error) {
			throw new Error('Decryption failed: invalid key or corrupted data')
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
}