// Robust polyfill for Web Crypto API in Node.js (including Node 16)
async function setupCrypto() {
  if (!globalThis.crypto) {
    try {
      // Try to import webcrypto from node:crypto (Node 16+)
      const { webcrypto } = await import('node:crypto')
      Object.defineProperty(globalThis, 'crypto', {
        value: webcrypto,
        writable: false,
        configurable: false
      })
    } catch (error) {
      try {
        // Fallback to crypto from standard crypto module
        const crypto = await import('crypto')
        if (crypto.webcrypto) {
          Object.defineProperty(globalThis, 'crypto', {
            value: crypto.webcrypto,
            writable: false,
            configurable: false
          })
        }
      } catch (fallbackError) {
        console.warn('Could not setup crypto polyfill:', fallbackError)
      }
    }
  }
}

// Setup crypto synchronously if possible
try {
  const crypto = require('crypto')
  if (crypto.webcrypto && !globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', {
      value: crypto.webcrypto,
      writable: false,
      configurable: false
    })
  }
} catch (error) {
  // Will be handled by async setup
}

// Setup crypto asynchronously if needed
if (!globalThis.crypto) {
  setupCrypto()
}

// Polyfill for btoa and atob
if (!globalThis.btoa) {
  globalThis.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')
}

if (!globalThis.atob) {
  globalThis.atob = (str: string) => Buffer.from(str, 'base64').toString('binary')
}