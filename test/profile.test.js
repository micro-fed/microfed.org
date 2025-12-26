/**
 * Microfed Profile Module Tests
 * Run: node --test test/profile.test.js
 */

import { test, describe } from 'node:test'
import assert from 'node:assert'
import { createActor, createMinimalActor, parseActor, getActorId, buildActorUrl } from '../src/profile.js'

describe('createActor', () => {
  test('creates actor with required fields', () => {
    const actor = createActor({
      id: 'https://example.com/users/alice',
      username: 'alice'
    })

    assert.strictEqual(actor.id, 'https://example.com/users/alice')
    assert.strictEqual(actor.type, 'Person')
    assert.strictEqual(actor.preferredUsername, 'alice')
    assert.strictEqual(actor.inbox, 'https://example.com/users/alice/inbox')
    assert.strictEqual(actor.outbox, 'https://example.com/users/alice/outbox')
    assert.strictEqual(actor.followers, 'https://example.com/users/alice/followers')
    assert.strictEqual(actor.following, 'https://example.com/users/alice/following')
  })

  test('includes @context with ActivityStreams and security', () => {
    const actor = createActor({
      id: 'https://example.com/users/alice',
      username: 'alice'
    })

    assert.ok(Array.isArray(actor['@context']))
    assert.ok(actor['@context'].includes('https://www.w3.org/ns/activitystreams'))
    assert.ok(actor['@context'].includes('https://w3id.org/security/v1'))
  })

  test('supports different actor types', () => {
    const service = createActor({
      id: 'https://example.com/bot',
      username: 'bot',
      type: 'Service'
    })

    assert.strictEqual(service.type, 'Service')
  })

  test('includes optional fields when provided', () => {
    const actor = createActor({
      id: 'https://example.com/users/alice',
      username: 'alice',
      name: 'Alice',
      summary: '<p>Hello!</p>',
      url: 'https://example.com/@alice'
    })

    assert.strictEqual(actor.name, 'Alice')
    assert.strictEqual(actor.summary, '<p>Hello!</p>')
    assert.strictEqual(actor.url, 'https://example.com/@alice')
  })

  test('formats icon as Image object', () => {
    const actor = createActor({
      id: 'https://example.com/users/alice',
      username: 'alice',
      icon: 'https://example.com/avatar.png'
    })

    assert.deepStrictEqual(actor.icon, {
      type: 'Image',
      url: 'https://example.com/avatar.png'
    })
  })

  test('includes publicKey when provided', () => {
    const publicKey = '-----BEGIN PUBLIC KEY-----\nMIIB...\n-----END PUBLIC KEY-----'
    const actor = createActor({
      id: 'https://example.com/users/alice',
      username: 'alice',
      publicKey
    })

    assert.strictEqual(actor.publicKey.id, 'https://example.com/users/alice#main-key')
    assert.strictEqual(actor.publicKey.owner, 'https://example.com/users/alice')
    assert.strictEqual(actor.publicKey.publicKeyPem, publicKey)
  })

  test('includes sharedInbox endpoint when provided', () => {
    const actor = createActor({
      id: 'https://example.com/users/alice',
      username: 'alice',
      sharedInbox: 'https://example.com/inbox'
    })

    assert.deepStrictEqual(actor.endpoints, {
      sharedInbox: 'https://example.com/inbox'
    })
  })

  test('throws when id is missing', () => {
    assert.throws(() => {
      createActor({ username: 'alice' })
    }, /id is required/)
  })

  test('throws when username is missing', () => {
    assert.throws(() => {
      createActor({ id: 'https://example.com/users/alice' })
    }, /username is required/)
  })
})

describe('createMinimalActor', () => {
  test('creates actor with just id and username', () => {
    const actor = createMinimalActor(
      'https://example.com/users/bob',
      'bob'
    )

    assert.strictEqual(actor.id, 'https://example.com/users/bob')
    assert.strictEqual(actor.preferredUsername, 'bob')
    assert.strictEqual(actor.type, 'Person')
  })
})

describe('parseActor', () => {
  test('parses actor object', () => {
    const input = {
      id: 'https://example.com/users/alice',
      inbox: 'https://example.com/users/alice/inbox'
    }

    const actor = parseActor(input)
    assert.strictEqual(actor.id, input.id)
  })

  test('parses JSON string', () => {
    const json = '{"id":"https://example.com/users/alice","inbox":"https://example.com/users/alice/inbox"}'

    const actor = parseActor(json)
    assert.strictEqual(actor.id, 'https://example.com/users/alice')
  })

  test('throws when id is missing', () => {
    assert.throws(() => {
      parseActor({ inbox: 'https://example.com/inbox' })
    }, /missing id/)
  })

  test('throws when inbox is missing', () => {
    assert.throws(() => {
      parseActor({ id: 'https://example.com/users/alice' })
    }, /missing inbox/)
  })
})

describe('getActorId', () => {
  test('returns string as-is', () => {
    assert.strictEqual(
      getActorId('https://example.com/users/alice'),
      'https://example.com/users/alice'
    )
  })

  test('extracts id from object', () => {
    assert.strictEqual(
      getActorId({ id: 'https://example.com/users/alice' }),
      'https://example.com/users/alice'
    )
  })

  test('extracts actor from activity', () => {
    assert.strictEqual(
      getActorId({ actor: 'https://example.com/users/alice' }),
      'https://example.com/users/alice'
    )
  })

  test('handles nested actor object', () => {
    assert.strictEqual(
      getActorId({ actor: { id: 'https://example.com/users/alice' } }),
      'https://example.com/users/alice'
    )
  })

  test('throws when cannot extract id', () => {
    assert.throws(() => {
      getActorId({})
    }, /Cannot extract actor ID/)
  })
})

describe('buildActorUrl', () => {
  test('builds URL with default path', () => {
    assert.strictEqual(
      buildActorUrl('example.com', 'alice'),
      'https://example.com/users/alice'
    )
  })

  test('builds URL with custom path', () => {
    assert.strictEqual(
      buildActorUrl('example.com', 'alice', '/@{username}'),
      'https://example.com/@alice'
    )
  })

  test('handles subdomain', () => {
    assert.strictEqual(
      buildActorUrl('social.example.org', 'bob'),
      'https://social.example.org/users/bob'
    )
  })
})
