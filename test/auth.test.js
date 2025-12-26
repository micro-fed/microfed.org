/**
 * Microfed Auth Module Tests
 * Run: node --test test/auth.test.js
 */

import { test, describe } from 'node:test'
import assert from 'node:assert'
import { generateKeypair, sign, verify, parseSignatureHeader, digest, verifyDigest } from '../src/auth.js'

describe('generateKeypair', () => {
  test('generates valid RSA keypair', () => {
    const { publicKey, privateKey } = generateKeypair()

    assert.ok(publicKey.includes('-----BEGIN PUBLIC KEY-----'))
    assert.ok(publicKey.includes('-----END PUBLIC KEY-----'))
    assert.ok(privateKey.includes('-----BEGIN PRIVATE KEY-----'))
    assert.ok(privateKey.includes('-----END PRIVATE KEY-----'))
  })

  test('generates unique keypairs', () => {
    const pair1 = generateKeypair()
    const pair2 = generateKeypair()

    assert.notStrictEqual(pair1.publicKey, pair2.publicKey)
    assert.notStrictEqual(pair1.privateKey, pair2.privateKey)
  })
})

describe('sign', () => {
  test('returns required headers', () => {
    const { privateKey } = generateKeypair()

    const headers = sign({
      privateKey,
      keyId: 'https://example.com/users/alice#main-key',
      method: 'POST',
      url: 'https://remote.example/users/bob/inbox',
      body: '{"type":"Follow"}'
    })

    assert.ok(headers.Date)
    assert.ok(headers.Signature)
    assert.ok(headers.Digest)
    assert.ok(headers.Digest.startsWith('SHA-256='))
  })

  test('signature header has required parts', () => {
    const { privateKey } = generateKeypair()

    const headers = sign({
      privateKey,
      keyId: 'https://example.com/users/alice#main-key',
      method: 'POST',
      url: 'https://remote.example/users/bob/inbox',
      body: '{}'
    })

    const parsed = parseSignatureHeader(headers.Signature)
    assert.ok(parsed.keyId)
    assert.ok(parsed.algorithm)
    assert.ok(parsed.headers)
    assert.ok(parsed.signature)
  })

  test('GET request without body omits digest', () => {
    const { privateKey } = generateKeypair()

    const headers = sign({
      privateKey,
      keyId: 'https://example.com/users/alice#main-key',
      method: 'GET',
      url: 'https://remote.example/users/bob'
    })

    assert.ok(headers.Date)
    assert.ok(headers.Signature)
    assert.strictEqual(headers.Digest, undefined)
  })
})

describe('verify', () => {
  test('verifies valid signature', () => {
    const { publicKey, privateKey } = generateKeypair()
    const url = 'https://remote.example/users/bob/inbox'
    const body = '{"type":"Follow","actor":"https://example.com/users/alice"}'

    const headers = sign({
      privateKey,
      keyId: 'https://example.com/users/alice#main-key',
      method: 'POST',
      url,
      body
    })

    const valid = verify({
      publicKey,
      signature: headers.Signature,
      method: 'POST',
      path: '/users/bob/inbox',
      headers: {
        host: 'remote.example',
        date: headers.Date,
        digest: headers.Digest
      }
    })

    assert.strictEqual(valid, true)
  })

  test('rejects tampered signature', () => {
    const { publicKey, privateKey } = generateKeypair()

    const headers = sign({
      privateKey,
      keyId: 'https://example.com/users/alice#main-key',
      method: 'POST',
      url: 'https://remote.example/inbox',
      body: '{}'
    })

    // Tamper with signature
    const tampered = headers.Signature.replace(/signature="[^"]+"/, 'signature="dGFtcGVyZWQ="')

    const valid = verify({
      publicKey,
      signature: tampered,
      method: 'POST',
      path: '/inbox',
      headers: {
        host: 'remote.example',
        date: headers.Date,
        digest: headers.Digest
      }
    })

    assert.strictEqual(valid, false)
  })

  test('rejects wrong public key', () => {
    const sender = generateKeypair()
    const other = generateKeypair()

    const headers = sign({
      privateKey: sender.privateKey,
      keyId: 'https://example.com/users/alice#main-key',
      method: 'POST',
      url: 'https://remote.example/inbox',
      body: '{}'
    })

    const valid = verify({
      publicKey: other.publicKey, // Wrong key
      signature: headers.Signature,
      method: 'POST',
      path: '/inbox',
      headers: {
        host: 'remote.example',
        date: headers.Date,
        digest: headers.Digest
      }
    })

    assert.strictEqual(valid, false)
  })
})

describe('parseSignatureHeader', () => {
  test('parses valid signature header', () => {
    const header = 'keyId="https://example.com/users/alice#main-key",algorithm="rsa-sha256",headers="(request-target) host date",signature="abc123"'

    const parsed = parseSignatureHeader(header)

    assert.strictEqual(parsed.keyId, 'https://example.com/users/alice#main-key')
    assert.strictEqual(parsed.algorithm, 'rsa-sha256')
    assert.strictEqual(parsed.headers, '(request-target) host date')
    assert.strictEqual(parsed.signature, 'abc123')
  })

  test('returns null for invalid header', () => {
    assert.strictEqual(parseSignatureHeader('invalid'), null)
    assert.strictEqual(parseSignatureHeader(''), null)
  })
})

describe('digest', () => {
  test('creates SHA-256 digest', () => {
    const result = digest('{"test":true}')

    assert.ok(result.startsWith('SHA-256='))
    assert.strictEqual(result.length, 8 + 44) // "SHA-256=" + base64
  })

  test('same input produces same digest', () => {
    const body = '{"type":"Create"}'

    assert.strictEqual(digest(body), digest(body))
  })

  test('different input produces different digest', () => {
    assert.notStrictEqual(digest('a'), digest('b'))
  })
})

describe('verifyDigest', () => {
  test('verifies matching digest', () => {
    const body = '{"type":"Follow"}'
    const digestHeader = digest(body)

    assert.strictEqual(verifyDigest(body, digestHeader), true)
  })

  test('rejects non-matching digest', () => {
    const body = '{"type":"Follow"}'
    const wrongDigest = digest('{"type":"Create"}')

    assert.strictEqual(verifyDigest(body, wrongDigest), false)
  })
})
