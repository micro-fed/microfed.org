/**
 * Microfed Outbox Module Tests
 * Run: node --test test/outbox.test.js
 */

import { test, describe } from 'node:test'
import assert from 'node:assert'
import { createActivity, createNote, wrapCreate, createFollow, createUndo, createAccept } from '../src/outbox.js'

describe('createActivity', () => {
  test('creates activity with required fields', () => {
    const activity = createActivity({
      type: 'Follow',
      actor: 'https://example.com/users/alice',
      object: 'https://example.com/users/bob'
    })

    assert.strictEqual(activity['@context'], 'https://www.w3.org/ns/activitystreams')
    assert.strictEqual(activity.type, 'Follow')
    assert.strictEqual(activity.actor, 'https://example.com/users/alice')
    assert.strictEqual(activity.object, 'https://example.com/users/bob')
    assert.ok(activity.id)
    assert.ok(activity.published)
  })

  test('includes to and cc arrays', () => {
    const activity = createActivity({
      type: 'Create',
      actor: 'https://example.com/users/alice',
      object: { type: 'Note' },
      to: ['https://www.w3.org/ns/activitystreams#Public'],
      cc: ['https://example.com/users/alice/followers']
    })

    assert.deepStrictEqual(activity.to, ['https://www.w3.org/ns/activitystreams#Public'])
    assert.deepStrictEqual(activity.cc, ['https://example.com/users/alice/followers'])
  })

  test('uses provided id', () => {
    const activity = createActivity({
      type: 'Like',
      actor: 'https://example.com/users/alice',
      object: 'https://example.com/notes/123',
      id: 'https://example.com/activities/custom-id'
    })

    assert.strictEqual(activity.id, 'https://example.com/activities/custom-id')
  })

  test('throws when type is missing', () => {
    assert.throws(() => {
      createActivity({
        actor: 'https://example.com/users/alice',
        object: 'https://example.com/users/bob'
      })
    }, /type is required/)
  })

  test('throws when actor is missing', () => {
    assert.throws(() => {
      createActivity({
        type: 'Follow',
        object: 'https://example.com/users/bob'
      })
    }, /actor is required/)
  })

  test('throws when object is missing', () => {
    assert.throws(() => {
      createActivity({
        type: 'Follow',
        actor: 'https://example.com/users/alice'
      })
    }, /object is required/)
  })
})

describe('createNote', () => {
  test('creates note with required fields', () => {
    const note = createNote({
      actor: 'https://example.com/users/alice',
      content: '<p>Hello, world!</p>'
    })

    assert.strictEqual(note.type, 'Note')
    assert.strictEqual(note.attributedTo, 'https://example.com/users/alice')
    assert.strictEqual(note.content, '<p>Hello, world!</p>')
    assert.ok(note.id)
    assert.ok(note.published)
  })

  test('public note has correct addressing', () => {
    const note = createNote({
      actor: 'https://example.com/users/alice',
      content: '<p>Public post</p>',
      public: true
    })

    assert.ok(note.to.includes('https://www.w3.org/ns/activitystreams#Public'))
    assert.ok(note.cc.includes('https://example.com/users/alice/followers'))
  })

  test('private note has empty addressing', () => {
    const note = createNote({
      actor: 'https://example.com/users/alice',
      content: '<p>Private post</p>',
      public: false
    })

    assert.deepStrictEqual(note.to, [])
    assert.deepStrictEqual(note.cc, [])
  })

  test('includes inReplyTo when provided', () => {
    const note = createNote({
      actor: 'https://example.com/users/alice',
      content: '<p>This is a reply</p>',
      inReplyTo: 'https://other.example/notes/456'
    })

    assert.strictEqual(note.inReplyTo, 'https://other.example/notes/456')
  })
})

describe('wrapCreate', () => {
  test('wraps note in Create activity', () => {
    const note = {
      type: 'Note',
      id: 'https://example.com/notes/123',
      content: '<p>Hello</p>',
      to: ['https://www.w3.org/ns/activitystreams#Public'],
      cc: ['https://example.com/users/alice/followers']
    }

    const activity = wrapCreate('https://example.com/users/alice', note)

    assert.strictEqual(activity.type, 'Create')
    assert.strictEqual(activity.actor, 'https://example.com/users/alice')
    assert.strictEqual(activity.object, note)
    assert.deepStrictEqual(activity.to, note.to)
    assert.deepStrictEqual(activity.cc, note.cc)
  })
})

describe('createFollow', () => {
  test('creates Follow activity', () => {
    const follow = createFollow(
      'https://example.com/users/alice',
      'https://other.example/users/bob'
    )

    assert.strictEqual(follow.type, 'Follow')
    assert.strictEqual(follow.actor, 'https://example.com/users/alice')
    assert.strictEqual(follow.object, 'https://other.example/users/bob')
    assert.deepStrictEqual(follow.to, ['https://other.example/users/bob'])
  })
})

describe('createUndo', () => {
  test('creates Undo activity for Follow', () => {
    const follow = {
      type: 'Follow',
      id: 'https://example.com/activities/123',
      actor: 'https://example.com/users/alice',
      object: 'https://other.example/users/bob',
      to: ['https://other.example/users/bob'],
      cc: []
    }

    const undo = createUndo('https://example.com/users/alice', follow)

    assert.strictEqual(undo.type, 'Undo')
    assert.strictEqual(undo.actor, 'https://example.com/users/alice')
    assert.strictEqual(undo.object, follow)
    assert.deepStrictEqual(undo.to, follow.to)
  })
})

describe('createAccept', () => {
  test('creates Accept activity for Follow', () => {
    const follow = {
      type: 'Follow',
      id: 'https://other.example/activities/456',
      actor: 'https://other.example/users/bob',
      object: 'https://example.com/users/alice'
    }

    const accept = createAccept('https://example.com/users/alice', follow)

    assert.strictEqual(accept.type, 'Accept')
    assert.strictEqual(accept.actor, 'https://example.com/users/alice')
    assert.strictEqual(accept.object, follow)
    assert.deepStrictEqual(accept.to, ['https://other.example/users/bob'])
  })
})
