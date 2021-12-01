<div align="center">
  <img src="https://microfed.org/images/microfed.jpg" />
  <h1><a href="https://microfed.org/">Microfed</a></h1>
</div>

<div align="center">  
<i>Micro Services Meets the Fediverse</i>
</div>

---

<div align="center">
<h4>Documentation</h4>
</div>
  
---
  
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/micro-fed/microfed.org/blob/gh-pages/LICENSE)
[![npm](https://img.shields.io/npm/v/microfed)](https://npmjs.com/package/microfed)
[![npm](https://img.shields.io/npm/dw/microfed.svg)](https://npmjs.com/package/microfed)
[![Github Stars](https://img.shields.io/github/stars/micro-fed/microfed.org.svg)](https://github.com/micro-fed/microfed.org/)
  
# ⚡️ Introduction

Tthis project is still at concept stage and aims to brainstorm the intersection of [micro servcies](https://en.wikipedia.org/wiki/Microservices) and the [fediverse](https://en.wikipedia.org/wiki/Fediverse).

The idea is that each component of a fediverse server can be composed from smaller services.

These include:
- [Profile](#Profile)
- [Inbox](#Inbox)
- [Outbox](#Outbox)
- [Authentication](#Authentication)

# ✍️ Profile

Your profile page is the starting point for microfed services.  It will generally be an HTTP page, but the data should be agnostic to HTTP or any other protocol so that it can live in a database, or run over a P2P network.

The profile will be in HTML, with the data in in JSON(-LD).  It will contain:

&nbsp;&nbsp;✓&nbsp;The profile page  
&nbsp;&nbsp;✓&nbsp;The User / Actor / Agent  
&nbsp;&nbsp;✓&nbsp;Attributes about the User  
&nbsp;&nbsp;✓&nbsp;Ability to store a public key  
&nbsp;&nbsp;✓&nbsp;A list of connections (friends, knows, followers etc.)  
&nbsp;&nbsp;✓&nbsp;Endpoint for inbox  
&nbsp;&nbsp;✓&nbsp;Endpoint for outbox  
&nbsp;&nbsp;✓&nbsp;Authentictation endpoints  
&nbsp;&nbsp;✓&nbsp;Arbitrary fields specified by the user  

The Profile can be self hosted, or part of a multi user service.  It should be able to run on a mobile device, or in the browser.

# Inbox

The Inbox should be a place where people can send messages in JSON.  The micro service can filter out messages based on user preferences.  The message format should be as far as possible compatible with Activity Pub JSON.  Signatures can be used to verify the authenticity of a message.

# Outbox

The outbox is a service that allows messages to be sent to other inboxes.  It should also have to ability to store a private key on behalf of a user, in order to sign outgoing messages.  It should be able to route messages to the right endpoints.

# Authentication

Initially, strong authentication via PKI will be supported.  Delegated authenticaiton, such as OAuth and OIDC may be considered desirable.  A loosely coupled authentication suite will allow the user to add different authentication modules.  This could also work with enterprise authentication. 

# ⚖️ License

- MIT
