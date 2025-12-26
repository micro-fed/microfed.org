<div align="center">
  <img src="https://microfed.org/images/microfed.jpg" />
  <h1><a href="https://microfed.org/">Microfed</a></h1>
</div>

<div align="center">
<i>Minimal, modular ActivityPub microservices</i>
</div>

---

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/micro-fed/microfed.org/blob/gh-pages/LICENSE)
[![npm](https://img.shields.io/npm/v/microfed)](https://npmjs.com/package/microfed)
[![npm](https://img.shields.io/npm/dw/microfed.svg)](https://npmjs.com/package/microfed)
[![Github Stars](https://img.shields.io/github/stars/micro-fed/microfed.org.svg)](https://github.com/micro-fed/microfed.org/)

## Features

- **Pure JavaScript** — No TypeScript, no build step
- **Zero dependencies** — Only Node.js built-ins
- **Modular** — Use only what you need
- **Fast** — Minimal overhead
- **Standards compliant** — ActivityPub, WebFinger, HTTP Signatures

## Install

```bash
npm install microfed
```

## Quick Start

```javascript
import { profile, auth, outbox } from 'microfed'

// Generate keypair for signing
const { publicKey, privateKey } = auth.generateKeypair()

// Create an actor
const actor = profile.createActor({
  id: 'https://example.com/users/alice',
  username: 'alice',
  name: 'Alice',
  publicKey
})

// Create a post
const note = outbox.createNote({
  actor: actor.id,
  content: '<p>Hello, Fediverse!</p>'
})

// Wrap in Create activity
const activity = outbox.wrapCreate(actor.id, note)

// Send to a remote inbox
await outbox.send({
  activity,
  inbox: 'https://remote.example/users/bob/inbox',
  privateKey,
  keyId: `${actor.id}#main-key`
})
```

## Modules

### profile — Actor generation

```javascript
import { createActor, createMinimalActor } from 'microfed/profile'

const actor = createActor({
  id: 'https://example.com/users/alice',
  username: 'alice',
  name: 'Alice',
  summary: '<p>Hello!</p>',
  publicKey: '-----BEGIN PUBLIC KEY-----...',
  icon: 'https://example.com/avatar.png'
})
```

### auth — Keypairs and HTTP Signatures

```javascript
import { generateKeypair, sign, verify } from 'microfed/auth'

// Generate RSA keypair
const { publicKey, privateKey } = generateKeypair()

// Sign a request
const headers = sign({
  privateKey,
  keyId: 'https://example.com/users/alice#main-key',
  method: 'POST',
  url: 'https://remote.example/inbox',
  body: JSON.stringify(activity)
})

// Verify incoming signature
const valid = verify({
  publicKey,
  signature: req.headers.signature,
  method: 'POST',
  path: '/inbox',
  headers: req.headers
})
```

### webfinger — Discovery

```javascript
import { createResponse, lookup, resolve } from 'microfed/webfinger'

// Create WebFinger response
const response = createResponse(
  'alice@example.com',
  'https://example.com/users/alice'
)

// Lookup remote actor
const actor = await resolve('bob@remote.example')
```

### inbox — Receive activities

```javascript
import { createHandler } from 'microfed/inbox'

const handler = createHandler({
  getPublicKey: async (keyId) => {
    // Fetch and return public key for keyId
  },
  handlers: {
    Follow: async (activity) => {
      console.log(`Follow from ${activity.actor}`)
    },
    Create: async (activity) => {
      console.log(`New post: ${activity.object.content}`)
    }
  }
})
```

### outbox — Send activities

```javascript
import { createNote, createFollow, send, deliver } from 'microfed/outbox'

// Create a post
const note = createNote({
  actor: 'https://example.com/users/alice',
  content: '<p>Hello!</p>'
})

// Create a follow
const follow = createFollow(
  'https://example.com/users/alice',
  'https://remote.example/users/bob'
)

// Deliver to multiple inboxes
const results = await deliver({
  activity,
  inboxes: ['https://server1.example/inbox', 'https://server2.example/inbox'],
  privateKey,
  keyId: 'https://example.com/users/alice#main-key'
})
```

## Example Server

Run the demo server:

```bash
npm run example
# → http://localhost:3000
```

Test it:

```bash
# WebFinger
curl "http://localhost:3000/.well-known/webfinger?resource=acct:alice@localhost:3000"

# Actor
curl -H "Accept: application/activity+json" http://localhost:3000/users/alice
```

## Testing

```bash
npm test
```

## Design

Microfed decomposes a fediverse server into modular microservices:

| Module | Purpose |
|--------|---------|
| **profile** | Actor/user representation |
| **auth** | Cryptographic identity and signatures |
| **webfinger** | Actor discovery |
| **inbox** | Receive and process activities |
| **outbox** | Create and send activities |

Each module can be used independently or combined. See the [Design Documentation](./DESIGN.md) for architecture details.

## License

MIT
