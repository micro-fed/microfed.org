/**
 * Microfed Example Server
 * Minimal ActivityPub server using native Node.js http
 *
 * Run: node example/server.js
 * Test: curl http://localhost:3000/.well-known/webfinger?resource=acct:alice@localhost:3000
 */

import { createServer } from 'http'
import { profile, auth, webfinger, inbox } from '../index.js'

// Configuration
const PORT = process.env.PORT || 3000
const DOMAIN = process.env.DOMAIN || `localhost:${PORT}`
const PROTOCOL = DOMAIN.includes('localhost') ? 'http' : 'https'

// Generate keypair for our actor
const { publicKey, privateKey } = auth.generateKeypair()

// Create our actor
const actor = profile.createActor({
  id: `${PROTOCOL}://${DOMAIN}/users/alice`,
  username: 'alice',
  name: 'Alice (Microfed Demo)',
  summary: '<p>A demo actor running on Microfed</p>',
  publicKey
})

// Store for received activities
const activities = []
const followers = []

// Activity handlers
const handlers = {
  Follow: async (activity) => {
    console.log(`Follow from: ${activity.actor}`)
    followers.push(activity.actor)
    // In production, you'd send an Accept activity back
  },

  Create: async (activity) => {
    console.log(`Create: ${activity.object?.type}`)
    activities.push(activity)
  },

  Like: async (activity) => {
    console.log(`Like from: ${activity.actor}`)
  },

  Undo: async (activity) => {
    console.log(`Undo: ${activity.object?.type}`)
    if (activity.object?.type === 'Follow') {
      const idx = followers.indexOf(activity.actor)
      if (idx > -1) followers.splice(idx, 1)
    }
  }
}

// Get public key for signature verification
async function getPublicKey(keyId) {
  // In production, fetch the actor and extract publicKey
  // For demo, we just return null (skip verification)
  console.log(`Key lookup: ${keyId}`)
  return null
}

// Create inbox handler
const inboxHandler = inbox.createHandler({
  getPublicKey,
  handlers,
  verifySignatures: false // Disable for local testing
})

// Request handler
async function handleRequest(req, res) {
  const url = new URL(req.url, `${PROTOCOL}://${DOMAIN}`)
  const path = url.pathname
  const accept = req.headers.accept || ''
  const isActivityPub = accept.includes('activity+json') || accept.includes('ld+json')

  console.log(`${req.method} ${path}`)

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  // WebFinger
  if (path === '/.well-known/webfinger') {
    const resource = url.searchParams.get('resource')
    const parsed = webfinger.parseResource(resource)

    if (!parsed || parsed.username !== 'alice') {
      res.writeHead(404)
      return res.end('Not found')
    }

    const response = webfinger.createResponse(
      `alice@${DOMAIN}`,
      actor.id,
      { profileUrl: `${PROTOCOL}://${DOMAIN}/@alice` }
    )

    res.setHeader('Content-Type', 'application/jrd+json')
    return res.end(JSON.stringify(response, null, 2))
  }

  // Actor profile
  if (path === '/users/alice') {
    res.setHeader('Content-Type', 'application/activity+json')
    return res.end(JSON.stringify(actor, null, 2))
  }

  // Inbox
  if (path === '/users/alice/inbox' && req.method === 'POST') {
    // Convert Node request to Web Request for handler
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks).toString()

    const webReq = new Request(url.href, {
      method: 'POST',
      headers: req.headers,
      body
    })

    const webRes = await inboxHandler(webReq)
    res.writeHead(webRes.status)
    return res.end(await webRes.text())
  }

  // Outbox (read-only collection)
  if (path === '/users/alice/outbox') {
    const collection = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${actor.id}/outbox`,
      totalItems: 0,
      orderedItems: []
    }
    res.setHeader('Content-Type', 'application/activity+json')
    return res.end(JSON.stringify(collection, null, 2))
  }

  // Followers collection
  if (path === '/users/alice/followers') {
    const collection = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${actor.id}/followers`,
      totalItems: followers.length,
      orderedItems: followers
    }
    res.setHeader('Content-Type', 'application/activity+json')
    return res.end(JSON.stringify(collection, null, 2))
  }

  // Following collection
  if (path === '/users/alice/following') {
    const collection = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${actor.id}/following`,
      totalItems: 0,
      orderedItems: []
    }
    res.setHeader('Content-Type', 'application/activity+json')
    return res.end(JSON.stringify(collection, null, 2))
  }

  // HTML profile page
  if (path === '/@alice' || (path === '/users/alice' && !isActivityPub)) {
    res.setHeader('Content-Type', 'text/html')
    return res.end(`<!DOCTYPE html>
<html>
<head>
  <title>${actor.name}</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; }
    .handle { color: #666; }
  </style>
</head>
<body>
  <h1>${actor.name}</h1>
  <p class="handle">@alice@${DOMAIN}</p>
  <p>${actor.summary}</p>
  <p><strong>Followers:</strong> ${followers.length}</p>
  <hr>
  <p><small>Powered by <a href="https://microfed.org">Microfed</a></small></p>
</body>
</html>`)
  }

  // Home
  if (path === '/') {
    res.setHeader('Content-Type', 'text/html')
    return res.end(`<!DOCTYPE html>
<html>
<head>
  <title>Microfed Demo</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; }
    code { background: #f0f0f0; padding: 0.2rem 0.4rem; border-radius: 3px; }
    pre { background: #f0f0f0; padding: 1rem; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Microfed Demo Server</h1>
  <p>A minimal ActivityPub server.</p>

  <h2>Endpoints</h2>
  <ul>
    <li><a href="/.well-known/webfinger?resource=acct:alice@${DOMAIN}">WebFinger</a></li>
    <li><a href="/users/alice">Actor (JSON)</a></li>
    <li><a href="/@alice">Profile (HTML)</a></li>
    <li><code>POST /users/alice/inbox</code> - Receive activities</li>
  </ul>

  <h2>Test with curl</h2>
  <pre>curl -H "Accept: application/activity+json" ${PROTOCOL}://${DOMAIN}/users/alice</pre>

  <p><a href="https://microfed.org">microfed.org</a></p>
</body>
</html>`)
  }

  res.writeHead(404)
  res.end('Not found')
}

// Start server
const server = createServer(handleRequest)

server.listen(PORT, () => {
  console.log(`
  Microfed Demo Server
  ====================
  Running at: ${PROTOCOL}://${DOMAIN}

  Endpoints:
  - GET  /.well-known/webfinger?resource=acct:alice@${DOMAIN}
  - GET  /users/alice
  - POST /users/alice/inbox
  - GET  /@alice

  Try: curl -H "Accept: application/activity+json" ${PROTOCOL}://${DOMAIN}/users/alice
  `)
})
