// Robust crypto polyfill for all Node.js versions (16, 18, 20)
function setupCryptoPolyfill() {
  if (!globalThis.crypto) {
    try {
      // Try Node.js 18+ native webcrypto first
      const crypto = require('crypto')
      if (crypto.webcrypto) {
        Object.defineProperty(globalThis, 'crypto', {
          value: crypto.webcrypto,
          writable: false,
          configurable: false
        })
        return
      }
    } catch (error) {
      // Continue to polyfill
    }

    try {
      // Fallback to @peculiar/webcrypto for Node.js 16
      const { Crypto } = require('@peculiar/webcrypto')
      Object.defineProperty(globalThis, 'crypto', {
        value: new Crypto(),
        writable: false,
        configurable: false
      })
    } catch (error) {
      console.warn('Could not setup crypto polyfill:', error)
    }
  }
}

// Setup crypto polyfill
setupCryptoPolyfill()

// Polyfill for btoa and atob
if (!globalThis.btoa) {
  globalThis.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')
}

if (!globalThis.atob) {
  globalThis.atob = (str: string) => Buffer.from(str, 'base64').toString('binary')
}