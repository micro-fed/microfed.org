/**
 * Microfed WebFinger Module Tests
 * Run: node --test test/webfinger.test.js
 */

import { test, describe } from 'node:test'
import assert from 'node:assert'
import { createResponse, parseResource, getActorUrl } from '../src/webfinger.js'

describe('createResponse', () => {
  test('creates valid JRD response', () => {
    const response = createResponse(
      'alice@example.com',
      'https://example.com/users/alice'
    )

    assert.strictEqual(response.subject, 'acct:alice@example.com')
    assert.ok(Array.isArray(response.links))
    assert.strictEqual(response.links.length, 1)
  })

  test('includes self link with ActivityPub type', () => {
    const response = createResponse(
      'alice@example.com',
      'https://example.com/users/alice'
    )

    const selfLink = response.links.find(l => l.rel === 'self')
    assert.ok(selfLink)
    assert.strictEqual(selfLink.type, 'application/activity+json')
    assert.strictEqual(selfLink.href, 'https://example.com/users/alice')
  })

  test('includes profile page link when provided', () => {
    const response = createResponse(
      'alice@example.com',
      'https://example.com/users/alice',
      { profileUrl: 'https://example.com/@alice' }
    )

    const profileLink = response.links.find(l => l.rel === 'http://webfinger.net/rel/profile-page')
    assert.ok(profileLink)
    assert.strictEqual(profileLink.type, 'text/html')
    assert.strictEqual(profileLink.href, 'https://example.com/@alice')
  })

  test('includes aliases when provided', () => {
    const response = createResponse(
      'alice@example.com',
      'https://example.com/users/alice',
      { aliases: ['https://example.com/@alice'] }
    )

    assert.deepStrictEqual(response.aliases, ['https://example.com/@alice'])
  })
})

describe('parseResource', () => {
  test('parses acct: URI', () => {
    const result = parseResource('acct:alice@example.com')

    assert.deepStrictEqual(result, {
      username: 'alice',
      domain: 'example.com'
    })
  })

  test('parses acct: URI with subdomain', () => {
    const result = parseResource('acct:bob@social.example.org')

    assert.deepStrictEqual(result, {
      username: 'bob',
      domain: 'social.example.org'
    })
  })

  test('parses https URL with /users/ path', () => {
    const result = parseResource('https://example.com/users/alice')

    assert.deepStrictEqual(result, {
      username: 'alice',
      domain: 'example.com'
    })
  })

  test('returns null for invalid input', () => {
    assert.strictEqual(parseResource(null), null)
    assert.strictEqual(parseResource(''), null)
    assert.strictEqual(parseResource('invalid'), null)
    assert.strictEqual(parseResource('acct:noatsign'), null)
  })

  test('returns null for URL without /users/ path', () => {
    const result = parseResource('https://example.com/@alice')
    assert.strictEqual(result, null)
  })
})

describe('getActorUrl', () => {
  test('extracts actor URL from webfinger response', () => {
    const webfinger = {
      subject: 'acct:alice@example.com',
      links: [
        { rel: 'self', type: 'application/activity+json', href: 'https://example.com/users/alice' }
      ]
    }

    assert.strictEqual(getActorUrl(webfinger), 'https://example.com/users/alice')
  })

  test('returns null when no self link exists', () => {
    const webfinger = {
      subject: 'acct:alice@example.com',
      links: [
        { rel: 'other', href: 'https://example.com' }
      ]
    }

    assert.strictEqual(getActorUrl(webfinger), null)
  })

  test('returns null when links is missing', () => {
    const webfinger = { subject: 'acct:alice@example.com' }

    assert.strictEqual(getActorUrl(webfinger), null)
  })

  test('ignores non-ActivityPub self links', () => {
    const webfinger = {
      subject: 'acct:alice@example.com',
      links: [
        { rel: 'self', type: 'text/html', href: 'https://example.com/@alice' },
        { rel: 'self', type: 'application/activity+json', href: 'https://example.com/users/alice' }
      ]
    }

    assert.strictEqual(getActorUrl(webfinger), 'https://example.com/users/alice')
  })
})
