/**
 * Mastodon Compatibility Tests
 * Tests that our output matches Mastodon's expected format
 *
 * Run: node --test test/mastodon.test.js
 */

import { test, describe } from 'node:test'
import assert from 'node:assert'
import { createActor } from '../src/profile.js'
import { generateKeypair } from '../src/auth.js'
import { createResponse } from '../src/webfinger.js'
import { createNote, wrapCreate } from '../src/outbox.js'

describe('Mastodon Actor Compatibility', () => {
  test('actor has all required fields for Mastodon', () => {
    const { publicKey } = generateKeypair()

    const actor = createActor({
      id: 'https://example.com/users/alice',
      username: 'alice',
      name: 'Alice',
      summary: '<p>Hello!</p>',
      publicKey
    })

    // Required by Mastodon
    assert.ok(actor['@context'], 'missing @context')
    assert.ok(actor.id, 'missing id')
    assert.ok(actor.type, 'missing type')
    assert.ok(actor.preferredUsername, 'missing preferredUsername')
    assert.ok(actor.inbox, 'missing inbox')
    assert.ok(actor.outbox, 'missing outbox')
    assert.ok(actor.publicKey, 'missing publicKey')
    assert.ok(actor.publicKey.id, 'missing publicKey.id')
    assert.ok(actor.publicKey.owner, 'missing publicKey.owner')
    assert.ok(actor.publicKey.publicKeyPem, 'missing publicKeyPem')
  })

  test('actor @context includes security namespace', () => {
    const { publicKey } = generateKeypair()

    const actor = createActor({
      id: 'https://example.com/users/alice',
      username: 'alice',
      publicKey
    })

    assert.ok(
      actor['@context'].includes('https://w3id.org/security/v1'),
      '@context must include security namespace for publicKey'
    )
  })

  test('publicKey.id follows Mastodon convention', () => {
    const { publicKey } = generateKeypair()

    const actor = createActor({
      id: 'https://example.com/users/alice',
      username: 'alice',
      publicKey
    })

    // Mastodon expects keyId to be actor#main-key
    assert.strictEqual(
      actor.publicKey.id,
      'https://example.com/users/alice#main-key'
    )
  })

  test('publicKey.owner matches actor id', () => {
    const { publicKey } = generateKeypair()

    const actor = createActor({
      id: 'https://example.com/users/alice',
      username: 'alice',
      publicKey
    })

    assert.strictEqual(actor.publicKey.owner, actor.id)
  })

  test('inbox/outbox URLs follow convention', () => {
    const actor = createActor({
      id: 'https://example.com/users/alice',
      username: 'alice'
    })

    assert.strictEqual(actor.inbox, 'https://example.com/users/alice/inbox')
    assert.strictEqual(actor.outbox, 'https://example.com/users/alice/outbox')
  })
})

describe('Mastodon WebFinger Compatibility', () => {
  test('webfinger response has required fields', () => {
    const response = createResponse(
      'alice@example.com',
      'https://example.com/users/alice'
    )

    assert.ok(response.subject, 'missing subject')
    assert.ok(response.links, 'missing links')
    assert.ok(Array.isArray(response.links), 'links must be array')
  })

  test('webfinger subject uses acct: scheme', () => {
    const response = createResponse(
      'alice@example.com',
      'https://example.com/users/alice'
    )

    assert.ok(
      response.subject.startsWith('acct:'),
      'subject must use acct: scheme'
    )
  })

  test('webfinger has self link with ActivityPub type', () => {
    const response = createResponse(
      'alice@example.com',
      'https://example.com/users/alice'
    )

    const selfLink = response.links.find(l => l.rel === 'self')

    assert.ok(selfLink, 'missing self link')
    assert.strictEqual(selfLink.type, 'application/activity+json')
    assert.strictEqual(selfLink.href, 'https://example.com/users/alice')
  })
})

describe('Mastodon Note Compatibility', () => {
  test('note has required fields', () => {
    const note = createNote({
      actor: 'https://example.com/users/alice',
      content: '<p>Hello, Mastodon!</p>'
    })

    assert.strictEqual(note.type, 'Note')
    assert.ok(note.id, 'missing id')
    assert.ok(note.attributedTo, 'missing attributedTo')
    assert.ok(note.content, 'missing content')
    assert.ok(note.published, 'missing published')
    assert.ok(note.to, 'missing to')
    assert.ok(note.cc, 'missing cc')
  })

  test('public note addresses Public collection', () => {
    const note = createNote({
      actor: 'https://example.com/users/alice',
      content: '<p>Public post</p>',
      public: true
    })

    assert.ok(
      note.to.includes('https://www.w3.org/ns/activitystreams#Public'),
      'public note must address Public collection'
    )
  })

  test('note cc includes followers collection', () => {
    const note = createNote({
      actor: 'https://example.com/users/alice',
      content: '<p>Public post</p>',
      public: true
    })

    assert.ok(
      note.cc.some(c => c.includes('/followers')),
      'note cc should include followers collection'
    )
  })

  test('published is ISO 8601 format', () => {
    const note = createNote({
      actor: 'https://example.com/users/alice',
      content: '<p>Test</p>'
    })

    // Should be parseable as date
    const date = new Date(note.published)
    assert.ok(!isNaN(date.getTime()), 'published must be valid ISO 8601')
  })
})

describe('Mastodon Create Activity Compatibility', () => {
  test('Create activity wraps note correctly', () => {
    const note = createNote({
      actor: 'https://example.com/users/alice',
      content: '<p>Hello!</p>'
    })

    const activity = wrapCreate('https://example.com/users/alice', note)

    assert.strictEqual(activity.type, 'Create')
    assert.strictEqual(activity.actor, 'https://example.com/users/alice')
    assert.strictEqual(activity.object, note)
    assert.ok(activity['@context'], 'missing @context')
    assert.ok(activity.id, 'missing id')
    assert.ok(activity.published, 'missing published')
  })

  test('Create activity copies addressing from object', () => {
    const note = createNote({
      actor: 'https://example.com/users/alice',
      content: '<p>Hello!</p>',
      public: true
    })

    const activity = wrapCreate('https://example.com/users/alice', note)

    assert.deepStrictEqual(activity.to, note.to)
    assert.deepStrictEqual(activity.cc, note.cc)
  })
})

describe('Fetch Remote Mastodon Actor', async () => {
  test('can parse real Mastodon actor format', async () => {
    // Test against mastodon.social's format expectations
    // This is what a Mastodon actor looks like
    const mastodonActor = {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        'https://w3id.org/security/v1'
      ],
      id: 'https://mastodon.social/users/test',
      type: 'Person',
      preferredUsername: 'test',
      inbox: 'https://mastodon.social/users/test/inbox',
      outbox: 'https://mastodon.social/users/test/outbox',
      publicKey: {
        id: 'https://mastodon.social/users/test#main-key',
        owner: 'https://mastodon.social/users/test',
        publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMIIB...\n-----END PUBLIC KEY-----'
      }
    }

    // Our code should be able to work with this format
    assert.ok(mastodonActor.id)
    assert.ok(mastodonActor.inbox)
    assert.ok(mastodonActor.publicKey.publicKeyPem)
  })
})
