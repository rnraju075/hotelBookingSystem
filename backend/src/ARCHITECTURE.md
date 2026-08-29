# Backend Architecture

The backend uses a Modular Monolith architecture.

## Top-Level Boundaries

### app

Application composition and startup-related configuration.

### config

Application configuration and environment configuration.

### common

Small, genuinely shared technical components.

### infrastructure

Integration with external technical systems such as:

- MongoDB
- Redis
- GraphQL
- Socket.IO
- Events
- Logging

### modules

Business capabilities of the hotel booking system.

Current modules:

- auth
- users
- hotels
- rooms
- bookings
- payments
- reviews
- notifications
- support
- admin
- ai

### tests

Automated tests for the application.

## Dependency Direction

Business logic should not depend directly on framework-specific transport concerns.

Expected backend flow:

GraphQL Resolver
    ↓
Service
    ↓
Repository
    ↓
Mongoose Model
    ↓
MongoDB

Resolvers should primarily handle transport concerns.

Services contain business logic.

Repositories contain persistence logic.