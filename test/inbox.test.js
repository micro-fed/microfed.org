/**
 * Microfed Inbox Module Tests
 * Run: node --test test/inbox.test.js
 */

import { test, describe } from 'node:test'
import assert from 'node:assert'
import { getActor, getObject, isAddressedTo, isPublic } from '../src/inbox.js'

describe('getActor', () => {
  test('extracts actor string', () => {
    const activity = {
      type: 'Create',
      actor: 'https://example.com/users/alice'
    }

    assert.strictEqual(getActor(activity), 'https://example.com/users/alice')
  })

  test('extracts actor from object', () => {
    const activity = {
      type: 'Create',
      actor: { id: 'https://example.com/users/alice' }
    }

    assert.strictEqual(getActor(activity), 'https://example.com/users/alice')
  })

  test('throws when actor missing', () => {
    assert.throws(() => {
      getActor({ type: 'Create' })
    }, /Cannot extract actor/)
  })
})

describe('getObject', () => {
  test('returns object directly', () => {
    const activity = {
      type: 'Create',
      object: { type: 'Note', content: 'Hello' }
    }

    assert.deepStrictEqual(getObject(activity), { type: 'Note', content: 'Hello' })
  })

  test('returns object ID string', () => {
    const activity = {
      type: 'Like',
      object: 'https://example.com/notes/123'
    }

    assert.strictEqual(getObject(activity), 'https://example.com/notes/123')
  })
})

describe('isAddressedTo', () => {
  test('returns true when in to field', () => {
    const activity = {
      type: 'Create',
      to: ['https://example.com/users/bob']
    }

    assert.strictEqual(isAddressedTo(activity, 'https://example.com/users/bob'), true)
  })

  test('returns true when in cc field', () => {
    const activity = {
      type: 'Create',
      to: ['https://www.w3.org/ns/activitystreams#Public'],
      cc: ['https://example.com/users/bob']
    }

    assert.strictEqual(isAddressedTo(activity, 'https://example.com/users/bob'), true)
  })

  test('returns false when not addressed', () => {
    const activity = {
      type: 'Create',
      to: ['https://example.com/users/alice']
    }

    assert.strictEqual(isAddressedTo(activity, 'https://example.com/users/bob'), false)
  })

  test('handles missing to/cc fields', () => {
    const activity = { type: 'Create' }

    assert.strictEqual(isAddressedTo(activity, 'https://example.com/users/bob'), false)
  })
})

describe('isPublic', () => {
  test('returns true for Public in to', () => {
    const activity = {
      type: 'Create',
      to: ['https://www.w3.org/ns/activitystreams#Public']
    }

    assert.strictEqual(isPublic(activity), true)
  })

  test('returns true for Public in cc', () => {
    const activity = {
      type: 'Create',
      to: ['https://example.com/users/alice/followers'],
      cc: ['https://www.w3.org/ns/activitystreams#Public']
    }

    assert.strictEqual(isPublic(activity), true)
  })

  test('returns true for short Public form', () => {
    const activity = {
      type: 'Create',
      to: ['Public']
    }

    assert.strictEqual(isPublic(activity), true)
  })

  test('returns false for non-public', () => {
    const activity = {
      type: 'Create',
      to: ['https://example.com/users/bob']
    }

    assert.strictEqual(isPublic(activity), false)
  })

  test('handles missing to/cc fields', () => {
    const activity = { type: 'Create' }

    assert.strictEqual(isPublic(activity), false)
  })
})
