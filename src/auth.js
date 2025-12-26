/**
 * Microfed Auth Module
 * Keypair generation and HTTP Signatures
 */

import { generateKeyPairSync, createSign, createVerify, createHash } from 'crypto'

/**
 * Generate RSA keypair for signing
 * @param {number} [modulusLength=2048] - Key size in bits
 * @returns {Object} { publicKey, privateKey } in PEM format
 */
export function generateKeypair(modulusLength = 2048) {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })
  return { publicKey, privateKey }
}

/**
 * Create HTTP Signature headers for a request
 * @param {Object} options - Signing options
 * @param {string} options.privateKey - PEM private key
 * @param {string} options.keyId - Key identifier URL (actor#main-key)
 * @param {string} options.method - HTTP method (POST, GET)
 * @param {string} options.url - Target URL
 * @param {string} [options.body] - Request body (for POST)
 * @param {Object} [options.headers] - Additional headers to sign
 * @returns {Object} Headers object with Signature, Date, Digest
 */
export function sign(options) {
  const { privateKey, keyId, method, url, body } = options

  const parsedUrl = new URL(url)
  const date = new Date().toUTCString()
  const headers = { ...options.headers }

  // Build headers to sign
  const signedHeaders = ['(request-target)', 'host', 'date']
  const headerLines = [
    `(request-target): ${method.toLowerCase()} ${parsedUrl.pathname}`,
    `host: ${parsedUrl.host}`,
    `date: ${date}`
  ]

  // Add digest for POST requests with body
  if (body) {
    const digest = createHash('sha256').update(body).digest('base64')
    headers['Digest'] = `SHA-256=${digest}`
    signedHeaders.push('digest')
    headerLines.push(`digest: SHA-256=${digest}`)
  }

  // Create signature
  const signingString = headerLines.join('\n')
  const signer = createSign('RSA-SHA256')
  signer.update(signingString)
  const signature = signer.sign(privateKey, 'base64')

  // Build Signature header
  headers['Date'] = date
  headers['Signature'] = [
    `keyId="${keyId}"`,
    `algorithm="rsa-sha256"`,
    `headers="${signedHeaders.join(' ')}"`,
    `signature="${signature}"`
  ].join(',')

  return headers
}

/**
 * Verify HTTP Signature from request
 * @param {Object} options - Verification options
 * @param {string} options.publicKey - PEM public key
 * @param {string} options.signature - Signature header value
 * @param {string} options.method - HTTP method
 * @param {string} options.path - Request path
 * @param {Object} options.headers - Request headers
 * @returns {boolean} True if valid
 */
export function verify(options) {
  const { publicKey, signature, method, path, headers } = options

  // Parse Signature header
  const sigParts = parseSignatureHeader(signature)
  if (!sigParts) return false

  // Rebuild signing string
  const signedHeaders = sigParts.headers.split(' ')
  const headerLines = signedHeaders.map(name => {
    if (name === '(request-target)') {
      return `(request-target): ${method.toLowerCase()} ${path}`
    }
    const value = headers[name] || headers[name.toLowerCase()]
    return `${name}: ${value}`
  })

  const signingString = headerLines.join('\n')

  // Verify
  const verifier = createVerify('RSA-SHA256')
  verifier.update(signingString)

  try {
    return verifier.verify(publicKey, sigParts.signature, 'base64')
  } catch {
    return false
  }
}

/**
 * Parse Signature header into components
 * @param {string} header - Signature header value
 * @returns {Object|null} { keyId, algorithm, headers, signature }
 */
export function parseSignatureHeader(header) {
  const parts = {}
  const regex = /(\w+)="([^"]+)"/g
  let match

  while ((match = regex.exec(header)) !== null) {
    parts[match[1]] = match[2]
  }

  if (!parts.keyId || !parts.signature) return null
  return parts
}

/**
 * Create SHA-256 digest of content
 * @param {string} content - Content to hash
 * @returns {string} Digest header value
 */
export function digest(content) {
  const hash = createHash('sha256').update(content).digest('base64')
  return `SHA-256=${hash}`
}

/**
 * Verify digest header matches body
 * @param {string} body - Request body
 * @param {string} digestHeader - Digest header value
 * @returns {boolean} True if matches
 */
export function verifyDigest(body, digestHeader) {
  return digest(body) === digestHeader
}

export default { generateKeypair, sign, verify, parseSignatureHeader, digest, verifyDigest }
