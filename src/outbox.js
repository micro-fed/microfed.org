/**
 * Microfed Outbox Module
 * Create and send activities to remote inboxes
 */

import { sign } from './auth.js'
import { resolve } from './webfinger.js'

const ACTIVITYPUB_TYPE = 'application/activity+json'
const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public'

/**
 * Create an activity
 * @param {Object} options - Activity options
 * @param {string} options.type - Activity type (Create, Follow, Like, etc.)
 * @param {string} options.actor - Actor ID URL
 * @param {Object|string} options.object - Activity object
 * @param {Array} [options.to] - Primary recipients
 * @param {Array} [options.cc] - Secondary recipients
 * @param {string} [options.id] - Activity ID (auto-generated if not provided)
 * @returns {Object} Activity object
 */
export function createActivity(options) {
  const { type, actor, object, to = [], cc = [] } = options

  if (!type) throw new Error('Activity type is required')
  if (!actor) throw new Error('Activity actor is required')
  if (!object) throw new Error('Activity object is required')

  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type,
    id: options.id || `${actor}/activities/${Date.now()}`,
    actor,
    object,
    to,
    cc,
    published: new Date().toISOString()
  }
}

/**
 * Create a Note (post)
 * @param {Object} options - Note options
 * @param {string} options.actor - Author's actor ID
 * @param {string} options.content - HTML content
 * @param {string} [options.id] - Note ID (auto-generated if not provided)
 * @param {boolean} [options.public=true] - Make post public
 * @param {string} [options.inReplyTo] - ID of post being replied to
 * @returns {Object} Note object
 */
export function createNote(options) {
  const { actor, content, public: isPublic = true, inReplyTo } = options

  const note = {
    type: 'Note',
    id: options.id || `${actor}/notes/${Date.now()}`,
    attributedTo: actor,
    content,
    published: new Date().toISOString(),
    to: isPublic ? [PUBLIC] : [],
    cc: isPublic ? [`${actor}/followers`] : []
  }

  if (inReplyTo) note.inReplyTo = inReplyTo

  return note
}

/**
 * Wrap object in Create activity
 * @param {string} actor - Actor ID
 * @param {Object} object - Object to wrap
 * @returns {Object} Create activity
 */
export function wrapCreate(actor, object) {
  return createActivity({
    type: 'Create',
    actor,
    object,
    to: object.to,
    cc: object.cc
  })
}

/**
 * Create Follow activity
 * @param {string} actor - Follower's actor ID
 * @param {string} target - Target actor ID to follow
 * @returns {Object} Follow activity
 */
export function createFollow(actor, target) {
  return createActivity({
    type: 'Follow',
    actor,
    object: target,
    to: [target]
  })
}

/**
 * Create Undo activity
 * @param {string} actor - Actor ID
 * @param {Object|string} activity - Activity to undo
 * @returns {Object} Undo activity
 */
export function createUndo(actor, activity) {
  const activityId = typeof activity === 'string' ? activity : activity.id
  return createActivity({
    type: 'Undo',
    actor,
    object: activity,
    to: activity.to || [],
    cc: activity.cc || []
  })
}

/**
 * Create Accept activity (for follow requests)
 * @param {string} actor - Actor accepting
 * @param {Object} follow - Follow activity being accepted
 * @returns {Object} Accept activity
 */
export function createAccept(actor, follow) {
  return createActivity({
    type: 'Accept',
    actor,
    object: follow,
    to: [follow.actor]
  })
}

/**
 * Send activity to inbox
 * @param {Object} options - Send options
 * @param {Object} options.activity - Activity to send
 * @param {string} options.inbox - Target inbox URL
 * @param {string} options.privateKey - Sender's private key (PEM)
 * @param {string} options.keyId - Sender's key ID
 * @returns {Promise<Response>} Fetch response
 */
export async function send(options) {
  const { activity, inbox, privateKey, keyId } = options

  const body = JSON.stringify(activity)

  const headers = sign({
    privateKey,
    keyId,
    method: 'POST',
    url: inbox,
    body,
    headers: {
      'Content-Type': ACTIVITYPUB_TYPE,
      'Accept': ACTIVITYPUB_TYPE
    }
  })

  return fetch(inbox, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': ACTIVITYPUB_TYPE
    },
    body
  })
}

/**
 * Deliver activity to multiple inboxes
 * @param {Object} options - Delivery options
 * @param {Object} options.activity - Activity to deliver
 * @param {Array<string>} options.inboxes - Target inbox URLs
 * @param {string} options.privateKey - Sender's private key
 * @param {string} options.keyId - Sender's key ID
 * @returns {Promise<Array>} Array of { inbox, success, error? }
 */
export async function deliver(options) {
  const { activity, inboxes, privateKey, keyId } = options

  const results = await Promise.allSettled(
    inboxes.map(async (inbox) => {
      const response = await send({ activity, inbox, privateKey, keyId })
      return { inbox, status: response.status }
    })
  )

  return results.map((result, i) => ({
    inbox: inboxes[i],
    success: result.status === 'fulfilled' && result.value.status < 300,
    error: result.status === 'rejected' ? result.reason.message : null
  }))
}

/**
 * Resolve recipients and get their inboxes
 * @param {Array<string>} recipients - Actor IDs or accounts
 * @returns {Promise<Array<string>>} Inbox URLs
 */
export async function resolveInboxes(recipients) {
  const inboxes = new Set()

  for (const recipient of recipients) {
    // Skip public addressing
    if (recipient === PUBLIC || recipient.endsWith('/followers')) continue

    try {
      let actor
      if (recipient.includes('@') && !recipient.startsWith('http')) {
        actor = await resolve(recipient)
      } else {
        const response = await fetch(recipient, {
          headers: { 'Accept': ACTIVITYPUB_TYPE }
        })
        actor = await response.json()
      }

      if (actor.inbox) {
        inboxes.add(actor.endpoints?.sharedInbox || actor.inbox)
      }
    } catch (err) {
      console.error(`Failed to resolve ${recipient}:`, err.message)
    }
  }

  return [...inboxes]
}

export default {
  createActivity,
  createNote,
  wrapCreate,
  createFollow,
  createUndo,
  createAccept,
  send,
  deliver,
  resolveInboxes
}
