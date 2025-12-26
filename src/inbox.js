/**
 * Microfed Inbox Module
 * Receive and process incoming activities
 */

import { verify, parseSignatureHeader, verifyDigest } from './auth.js'

const ACTIVITYPUB_TYPE = 'application/activity+json'
const LD_TYPE = 'application/ld+json'

/**
 * Create inbox handler
 * @param {Object} options - Handler options
 * @param {Function} options.getPublicKey - async (keyId) => publicKeyPem
 * @param {Object} [options.handlers] - Activity type handlers { Follow, Create, ... }
 * @param {boolean} [options.verifySignatures=true] - Require valid signatures
 * @returns {Function} Handler(req) => Response
 */
export function createHandler(options) {
  const { getPublicKey, handlers = {}, verifySignatures = true } = options

  return async (req) => {
    // Must be POST
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Check content type
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('json')) {
      return new Response('Invalid content type', { status: 415 })
    }

    // Parse body
    let activity
    let body
    try {
      body = await req.text()
      activity = JSON.parse(body)
    } catch {
      return new Response('Invalid JSON', { status: 400 })
    }

    // Verify signature
    if (verifySignatures) {
      const signatureHeader = req.headers.get('signature')
      if (!signatureHeader) {
        return new Response('Missing signature', { status: 401 })
      }

      const sigParts = parseSignatureHeader(signatureHeader)
      if (!sigParts) {
        return new Response('Invalid signature format', { status: 401 })
      }

      // Verify digest if present
      const digestHeader = req.headers.get('digest')
      if (digestHeader && !verifyDigest(body, digestHeader)) {
        return new Response('Digest mismatch', { status: 401 })
      }

      // Fetch public key and verify
      try {
        const publicKey = await getPublicKey(sigParts.keyId)
        if (!publicKey) {
          return new Response('Unknown key', { status: 401 })
        }

        const url = new URL(req.url)
        const valid = verify({
          publicKey,
          signature: signatureHeader,
          method: req.method,
          path: url.pathname,
          headers: Object.fromEntries(req.headers)
        })

        if (!valid) {
          return new Response('Invalid signature', { status: 401 })
        }
      } catch (err) {
        return new Response('Signature verification failed', { status: 401 })
      }
    }

    // Validate activity
    if (!activity.type) {
      return new Response('Missing activity type', { status: 400 })
    }

    // Route to handler
    const handler = handlers[activity.type]
    if (handler) {
      try {
        await handler(activity)
      } catch (err) {
        console.error(`Error handling ${activity.type}:`, err)
        return new Response('Processing error', { status: 500 })
      }
    }

    // Accept activity
    return new Response('', { status: 202 })
  }
}

/**
 * Parse activity from request
 * @param {Request} req - Incoming request
 * @returns {Promise<Object>} Parsed activity
 */
export async function parseActivity(req) {
  const body = await req.text()
  return JSON.parse(body)
}

/**
 * Get actor ID from activity
 * @param {Object} activity - Activity object
 * @returns {string} Actor ID
 */
export function getActor(activity) {
  const actor = activity.actor
  if (typeof actor === 'string') return actor
  if (actor?.id) return actor.id
  throw new Error('Cannot extract actor from activity')
}

/**
 * Get object from activity
 * @param {Object} activity - Activity object
 * @returns {Object|string} Object or object ID
 */
export function getObject(activity) {
  return activity.object
}

/**
 * Check if activity is addressed to actor
 * @param {Object} activity - Activity object
 * @param {string} actorId - Actor to check
 * @returns {boolean} True if addressed to actor
 */
export function isAddressedTo(activity, actorId) {
  const recipients = [
    ...(activity.to || []),
    ...(activity.cc || []),
    ...(activity.bto || []),
    ...(activity.bcc || [])
  ]
  return recipients.includes(actorId)
}

/**
 * Check if activity is public
 * @param {Object} activity - Activity object
 * @returns {boolean} True if public
 */
export function isPublic(activity) {
  const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public'
  const recipients = [...(activity.to || []), ...(activity.cc || [])]
  return recipients.includes(PUBLIC) || recipients.includes('Public')
}

/**
 * Standard activity type handlers (stubs)
 */
export const standardHandlers = {
  Follow: async (activity) => { /* Accept/Reject follow */ },
  Undo: async (activity) => { /* Reverse previous activity */ },
  Create: async (activity) => { /* Store content */ },
  Update: async (activity) => { /* Update content */ },
  Delete: async (activity) => { /* Delete content */ },
  Like: async (activity) => { /* Record like */ },
  Announce: async (activity) => { /* Record boost */ },
  Accept: async (activity) => { /* Confirm follow */ },
  Reject: async (activity) => { /* Deny follow */ }
}

export default {
  createHandler,
  parseActivity,
  getActor,
  getObject,
  isAddressedTo,
  isPublic,
  standardHandlers
}
