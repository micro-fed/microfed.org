/**
 * Microfed WebFinger Module
 * Actor discovery via WebFinger protocol
 */

const WEBFINGER_PATH = '/.well-known/webfinger'
const ACTIVITYPUB_TYPE = 'application/activity+json'

/**
 * Create WebFinger response for an actor
 * @param {string} account - Account identifier (user@domain)
 * @param {string} actorUrl - Actor's ActivityPub URL
 * @param {Object} [options] - Additional options
 * @param {string} [options.profileUrl] - HTML profile page URL
 * @param {Array} [options.aliases] - Alternative identifiers
 * @returns {Object} WebFinger JRD response
 */
export function createResponse(account, actorUrl, options = {}) {
  const response = {
    subject: `acct:${account}`,
    links: [
      {
        rel: 'self',
        type: ACTIVITYPUB_TYPE,
        href: actorUrl
      }
    ]
  }

  // Add HTML profile link
  if (options.profileUrl) {
    response.links.push({
      rel: 'http://webfinger.net/rel/profile-page',
      type: 'text/html',
      href: options.profileUrl
    })
  }

  // Add aliases
  if (options.aliases) {
    response.aliases = options.aliases
  }

  return response
}

/**
 * Parse WebFinger resource query
 * @param {string} resource - Resource query (acct:user@domain or URL)
 * @returns {Object|null} { username, domain } or null
 */
export function parseResource(resource) {
  if (!resource) return null

  // Handle acct: URI
  if (resource.startsWith('acct:')) {
    const account = resource.slice(5)
    const [username, domain] = account.split('@')
    if (username && domain) {
      return { username, domain }
    }
  }

  // Handle URL
  if (resource.startsWith('https://') || resource.startsWith('http://')) {
    try {
      const url = new URL(resource)
      const match = url.pathname.match(/\/users\/([^/]+)/)
      if (match) {
        return { username: match[1], domain: url.host }
      }
    } catch {
      return null
    }
  }

  return null
}

/**
 * Lookup actor via WebFinger
 * @param {string} account - Account to lookup (user@domain)
 * @returns {Promise<Object>} WebFinger response
 */
export async function lookup(account) {
  // Extract domain
  const [, domain] = account.includes('@') ? account.split('@') : [null, account]
  if (!domain) throw new Error('Invalid account format')

  const resource = account.includes('@') ? `acct:${account}` : account
  const url = `https://${domain}${WEBFINGER_PATH}?resource=${encodeURIComponent(resource)}`

  const response = await fetch(url, {
    headers: { 'Accept': 'application/jrd+json, application/json' }
  })

  if (!response.ok) {
    throw new Error(`WebFinger lookup failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Get actor URL from WebFinger response
 * @param {Object} webfinger - WebFinger JRD response
 * @returns {string|null} Actor URL or null
 */
export function getActorUrl(webfinger) {
  if (!webfinger.links) return null

  const link = webfinger.links.find(l =>
    l.rel === 'self' && l.type === ACTIVITYPUB_TYPE
  )

  return link?.href || null
}

/**
 * Resolve account to actor object
 * @param {string} account - Account (user@domain)
 * @returns {Promise<Object>} Actor object
 */
export async function resolve(account) {
  const webfinger = await lookup(account)
  const actorUrl = getActorUrl(webfinger)

  if (!actorUrl) {
    throw new Error('No ActivityPub actor found')
  }

  const response = await fetch(actorUrl, {
    headers: { 'Accept': ACTIVITYPUB_TYPE }
  })

  if (!response.ok) {
    throw new Error(`Actor fetch failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Create WebFinger request handler
 * @param {Function} findActor - Function(username) => { actorUrl, profileUrl? }
 * @returns {Function} Handler(req) => Response
 */
export function createHandler(findActor) {
  return async (req) => {
    const url = new URL(req.url)
    const resource = url.searchParams.get('resource')

    if (!resource) {
      return new Response('Missing resource parameter', { status: 400 })
    }

    const parsed = parseResource(resource)
    if (!parsed) {
      return new Response('Invalid resource format', { status: 400 })
    }

    const actor = await findActor(parsed.username)
    if (!actor) {
      return new Response('Not found', { status: 404 })
    }

    const response = createResponse(
      `${parsed.username}@${parsed.domain}`,
      actor.actorUrl,
      { profileUrl: actor.profileUrl }
    )

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/jrd+json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

export default { createResponse, parseResource, lookup, getActorUrl, resolve, createHandler }
