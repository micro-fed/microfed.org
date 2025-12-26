/**
 * Microfed Profile Module
 * Minimal ActivityPub actor/profile generation
 */

const AS_CONTEXT = 'https://www.w3.org/ns/activitystreams'
const SECURITY_CONTEXT = 'https://w3id.org/security/v1'

/**
 * Create an ActivityPub actor profile
 * @param {Object} options - Actor configuration
 * @param {string} options.id - Actor's unique URL (required)
 * @param {string} options.type - Actor type: Person, Service, Group, Application, Organization
 * @param {string} options.username - preferredUsername (handle)
 * @param {string} [options.name] - Display name
 * @param {string} [options.summary] - Bio/description (HTML allowed)
 * @param {string} [options.inbox] - Inbox URL (defaults to {id}/inbox)
 * @param {string} [options.outbox] - Outbox URL (defaults to {id}/outbox)
 * @param {string} [options.publicKey] - PEM-encoded public key
 * @param {string} [options.icon] - Avatar URL
 * @param {string} [options.image] - Header/banner URL
 * @returns {Object} ActivityPub Actor object
 */
export function createActor(options) {
  const { id, type = 'Person', username } = options

  if (!id) throw new Error('Actor id is required')
  if (!username) throw new Error('Actor username is required')

  const actor = {
    '@context': [AS_CONTEXT, SECURITY_CONTEXT],
    type,
    id,
    preferredUsername: username,
    inbox: options.inbox || `${id}/inbox`,
    outbox: options.outbox || `${id}/outbox`,
    followers: options.followers || `${id}/followers`,
    following: options.following || `${id}/following`
  }

  // Optional fields
  if (options.name) actor.name = options.name
  if (options.summary) actor.summary = options.summary
  if (options.url) actor.url = options.url
  if (options.icon) actor.icon = { type: 'Image', url: options.icon }
  if (options.image) actor.image = { type: 'Image', url: options.image }

  // Public key for HTTP signatures
  if (options.publicKey) {
    actor.publicKey = {
      id: `${id}#main-key`,
      owner: id,
      publicKeyPem: options.publicKey
    }
  }

  // Shared inbox for efficient delivery
  if (options.sharedInbox) {
    actor.endpoints = { sharedInbox: options.sharedInbox }
  }

  return actor
}

/**
 * Create a minimal actor (just the essentials)
 * @param {string} id - Actor URL
 * @param {string} username - Handle
 * @returns {Object} Minimal actor object
 */
export function createMinimalActor(id, username) {
  return createActor({ id, username })
}

/**
 * Parse an actor from JSON
 * @param {string|Object} json - JSON string or object
 * @returns {Object} Parsed actor
 */
export function parseActor(json) {
  const actor = typeof json === 'string' ? JSON.parse(json) : json

  // Validate required fields
  if (!actor.id) throw new Error('Actor missing id')
  if (!actor.inbox) throw new Error('Actor missing inbox')

  return actor
}

/**
 * Extract actor ID from various formats
 * @param {string|Object} actor - Actor URL, object, or activity
 * @returns {string} Actor ID URL
 */
export function getActorId(actor) {
  if (typeof actor === 'string') return actor
  if (actor.id) return actor.id
  if (actor.actor) return getActorId(actor.actor)
  throw new Error('Cannot extract actor ID')
}

/**
 * Build actor URL from domain and username
 * @param {string} domain - Domain (e.g., example.com)
 * @param {string} username - Username/handle
 * @param {string} [path] - URL path pattern (default: /users/{username})
 * @returns {string} Full actor URL
 */
export function buildActorUrl(domain, username, path = '/users/{username}') {
  const actorPath = path.replace('{username}', username)
  return `https://${domain}${actorPath}`
}

export default { createActor, createMinimalActor, parseActor, getActorId, buildActorUrl }
