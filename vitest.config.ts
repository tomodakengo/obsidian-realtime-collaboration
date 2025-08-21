import { defineConfig } from 'vitest/config'

// Robust crypto polyfill for Node.js (including Node 16)
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

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts']
  },
  define: {
    global: 'globalThis'
  }
})