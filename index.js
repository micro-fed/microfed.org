/**
 * Microfed - Minimal, modular ActivityPub microservices
 *
 * @example
 * import { profile, auth, webfinger, inbox, outbox } from 'microfed'
 *
 * // Generate keypair
 * const { publicKey, privateKey } = auth.generateKeypair()
 *
 * // Create actor
 * const actor = profile.createActor({
 *   id: 'https://example.com/users/alice',
 *   username: 'alice',
 *   name: 'Alice',
 *   publicKey
 * })
 *
 * // Create and send a post
 * const note = outbox.createNote({
 *   actor: actor.id,
 *   content: '<p>Hello, Fediverse!</p>'
 * })
 * const activity = outbox.wrapCreate(actor.id, note)
 */

export * as profile from './src/profile.js'
export * as auth from './src/auth.js'
export * as webfinger from './src/webfinger.js'
export * as inbox from './src/inbox.js'
export * as outbox from './src/outbox.js'

// Convenience re-exports
export { createActor, createMinimalActor } from './src/profile.js'
export { generateKeypair, sign, verify } from './src/auth.js'
export { lookup, resolve } from './src/webfinger.js'
export { createActivity, createNote, send, deliver } from './src/outbox.js'
