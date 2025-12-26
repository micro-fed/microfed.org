/**
 * Live Federation Tests
 * Tests against real Mastodon instances
 *
 * Run: node --test test/live.test.js
 *
 * Note: Requires network access. May fail if instances are down.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert'
import { lookup, resolve, getActorUrl } from '../src/webfinger.js'
import { parseActor, getActorId } from '../src/profile.js'

describe('Live WebFinger Lookup', { timeout: 10000 }, () => {
  test('lookup mastodon.social account', async () => {
    // Using Gargron (Mastodon creator) as a stable test account
    const webfinger = await lookup('Gargron@mastodon.social')

    assert.ok(webfinger.subject, 'missing subject')
    assert.ok(webfinger.links, 'missing links')

    const actorUrl = getActorUrl(webfinger)
    assert.ok(actorUrl, 'no actor URL found')
    assert.ok(actorUrl.includes('mastodon.social'), 'unexpected actor URL')
  })

  test('lookup returns valid JRD structure', async () => {
    const webfinger = await lookup('Gargron@mastodon.social')

    // Validate JRD structure
    assert.ok(webfinger.subject.startsWith('acct:'))

    const selfLink = webfinger.links.find(l =>
      l.rel === 'self' && l.type === 'application/activity+json'
    )
    assert.ok(selfLink, 'missing ActivityPub self link')
    assert.ok(selfLink.href.startsWith('https://'))
  })
})

describe('Live Actor Fetch', { timeout: 10000 }, () => {
  test('resolve mastodon.social actor', async () => {
    const actor = await resolve('Gargron@mastodon.social')

    // Validate required ActivityPub fields
    assert.ok(actor.id, 'missing id')
    assert.ok(actor.type, 'missing type')
    assert.ok(actor.inbox, 'missing inbox')
    assert.ok(actor.outbox, 'missing outbox')
    assert.ok(actor.preferredUsername, 'missing preferredUsername')
  })

  test('actor has publicKey for signatures', async () => {
    const actor = await resolve('Gargron@mastodon.social')

    assert.ok(actor.publicKey, 'missing publicKey')
    assert.ok(actor.publicKey.id, 'missing publicKey.id')
    assert.ok(actor.publicKey.publicKeyPem, 'missing publicKeyPem')
    assert.ok(
      actor.publicKey.publicKeyPem.includes('BEGIN PUBLIC KEY'),
      'publicKeyPem not in PEM format'
    )
  })

  test('actor type is Person', async () => {
    const actor = await resolve('Gargron@mastodon.social')
    assert.strictEqual(actor.type, 'Person')
  })

  test('can extract actor ID', async () => {
    const actor = await resolve('Gargron@mastodon.social')
    const id = getActorId(actor)

    assert.ok(id.startsWith('https://'))
    assert.ok(id.includes('mastodon.social'))
  })
})

describe('Live Outbox Fetch', { timeout: 10000 }, () => {
  test('can fetch actor outbox', async () => {
    const actor = await resolve('Gargron@mastodon.social')

    const response = await fetch(actor.outbox, {
      headers: { 'Accept': 'application/activity+json' }
    })

    assert.strictEqual(response.status, 200)

    const outbox = await response.json()
    assert.ok(
      outbox.type === 'OrderedCollection' || outbox.type === 'OrderedCollectionPage',
      'outbox must be OrderedCollection'
    )
    assert.ok(typeof outbox.totalItems === 'number', 'missing totalItems')
  })
})

describe('Cross-instance Federation', { timeout: 15000 }, () => {
  test('can lookup account on hachyderm.io', async () => {
    // Test a different instance to verify federation lookup works
    // Using a known active account
    const webfinger = await lookup('nova@hachyderm.io')

    assert.ok(webfinger.subject)
    const actorUrl = getActorUrl(webfinger)
    assert.ok(actorUrl.includes('hachyderm.io'))
  })
})
