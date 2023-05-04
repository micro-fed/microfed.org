# 🧩 Microfed Core

Microfed Core is the central module that manages communication between different components of the Microfed framework and provides utility functions. This document outlines the core design of Microfed Core, focusing on its integration with ActivityPub.

## Table of Contents

- [🔧 Core Components](#core-components)
- [🌐 ActivityPub Integration](#activitypub-integration)
- [🗄️ API Interface](#api-interface)
- [🔍 Error Handling and Logging](#error-handling-and-logging)

## 🔧 Core Components

Microfed Core comprises the following components:

1. **Configuration Management**: Handles settings and configuration for the framework, including user preferences, application settings, and module configurations.
2. **Module Loader**: Manages the loading, initialization, and communication between Microfed modules, such as the Profile, Inbox, Outbox, and Authentication modules.
3. **ActivityPub Adapter**: Provides a set of utility functions and classes to interact with ActivityPub, parse and serialize data, and manage ActivityPub objects.
4. **Networking**: Handles networking tasks, such as HTTP requests, WebSocket connections, and peer-to-peer communication.

## 🌐 ActivityPub Integration

Microfed Core integrates with ActivityPub using the ActivityPub Adapter component. The adapter offers the following functionality:

1. **ActivityPub Objects**: Defines classes for ActivityPub objects, such as Activities, Actors, and Objects, including methods to manipulate and interact with these objects.
2. **Parsing and Serialization**: Provides utility functions to parse and serialize ActivityPub objects from/to JSON-LD format.
3. **Activity Handling**: Implements methods for processing incoming and outgoing activities, such as Create, Update, Delete, Follow, and Like, according to the ActivityPub specification.
4. **ActivityPub API**: Offers an API for interacting with ActivityPub services, such as fetching and updating Actor profiles, sending activities, and managing followers and following collections.

## 🗄️ API Interface

Microfed Core exposes a simple and intuitive API interface for developers to interact with the framework and its modules. The API includes methods for:

1. **Module Management**: Registering, initializing, and accessing Microfed modules.
2. **ActivityPub Interaction**: Sending and receiving ActivityPub activities, managing Actor profiles, and handling collections.
3. **Utility Functions**: Accessing common utility functions, such as data validation, conversion, and formatting.

## 🔍 Error Handling and Logging

Microfed Core provides a robust error handling and logging system to ensure that any issues or errors are properly reported and logged. This system includes:

1. **Error Classes**: Custom error classes for different types of errors that can occur within Microfed Core and its modules.
2. **Error Reporting**: Methods for reporting errors to the user or developer, with context-specific information and suggestions for resolving the issue.
3. **Logging**: A flexible logging system that supports different log levels, log formats, and log destinations (e.g., console, file, or remote server).

---

Microfed Core is the backbone of the Microfed framework, providing seamless integration with ActivityPub and managing communication between its components. By handling the core functionality, Microfed Core allows developers to focus on building innovative and decentralized applications that leverage the power of microservices and the fediverse.