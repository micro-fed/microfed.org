# Microfed: Design Overview

<div align="center">
  <img src="https://microfed.org/images/microfed.jpg" />
  <h1><a href="https://microfed.org/">Microfed</a></h1>
</div>

<div align="center">  
<i>Micro Services Meets the Fediverse</i>
</div>

---

Microfed is a modular and extensible JavaScript framework that aims to bring together microservices and the fediverse, enabling the creation of decentralized applications that leverage the power of both worlds.

This document provides a high-level overview of Microfed's design, outlining the core modules and their functionality.

## Table of Contents

- [Microfed Core](#microfed-core)
- [Profile Module](#profile-module)
- [Inbox Module](#inbox-module)
- [Outbox Module](#outbox-module)
- [Authentication Module](#authentication-module)
- [Utility Functions](#utility-functions)

## Microfed Core

The Microfed Core serves as the central module that manages communication between different components and provides utility functions.

## Profile Module

The Profile Module consists of the following features:

- A class representing a user profile, including attributes, public keys, connections, and endpoints.
- Methods for parsing and serializing profile data from/to JSON-LD format.
- Support for self-hosted and multi-user services.
- Compatibility with mobile devices and browsers.

## Inbox Module

The Inbox Module is designed to offer the following functionality:

- A class representing a user's inbox, which stores incoming messages in JSON format.
- Methods for filtering messages based on user preferences.
- Support for Activity Pub JSON compatibility and message signatures.

## Outbox Module

The Outbox Module includes the following capabilities:

- A class representing a user's outbox, which sends messages to other inboxes.
- Methods for storing private keys and signing outgoing messages.
- Support for routing messages to appropriate endpoints.

## Authentication Module

The Authentication Module provides a flexible and extensible authentication system:

- A base authentication class, which can be extended for different authentication methods.
- Support for PKI-based strong authentication.
- Support for delegated authentication (e.g., OAuth, OIDC) if needed.
- Integration with enterprise authentication systems.

## Utility Functions

The Utility Functions module offers various general-purpose functions, such as data validation, conversion, and formatting.

---

With its modular and extensible design, Microfed provides a robust and flexible foundation for developing decentralized applications that harness the power of microservices and the fediverse. By combining these technologies, Microfed empowers developers to create innovative, secure, and scalable applications for the decentralized web.
