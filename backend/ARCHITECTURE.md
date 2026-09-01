# Hotel Booking Backend Architecture

## Architecture Style

The backend uses a Modular Monolith architecture.

The application is deployed as a single backend application while
business capabilities are separated into independent modules.

## Business Modules

- Auth
- Users
- Hotels
- Rooms
- Bookings
- Payments
- Reviews
- Notifications
- Admin

## Infrastructure

Infrastructure contains technical integrations required by the application.

Examples:

- MongoDB
- Redis
- External services

## Shared

Shared contains reusable technical functionality that does not belong
to a specific business module.

Examples:

- Errors
- Common types
- Constants
- Utilities
- Middleware

## Module Structure

Each business module should own its implementation.

Typical structure:

module/
├── model
├── schema
├── repository
├── service
├── controller
├── routes
└── types

Not every module must contain every layer.
Layers are introduced when they provide value.

## Request Flow

HTTP Request
    ↓
Route
    ↓
Controller
    ↓
Service
    ↓
Repository
    ↓
MongoDB

## Responsibilities

### Route

Responsible for HTTP endpoint definitions and middleware composition.

### Controller

Responsible for translating HTTP requests into application calls
and translating application results into HTTP responses.

### Service

Contains business rules and application logic.

### Repository

Responsible for persistence and database operations.

### Model

Defines the MongoDB/Mongoose data representation.

### Schema

Validates external input before it reaches business logic.

## Infrastructure Rule

Business modules should not directly create database connections.

MongoDB and Redis connections are owned by the infrastructure layer.

## Dependency Direction

Business logic should depend on abstractions/interfaces where useful.

Infrastructure implementations should remain replaceable.

## Performance Principles

The application should prioritize:

- Appropriate MongoDB indexes
- Query optimization
- Projection
- Pagination
- Efficient aggregation
- Redis caching where appropriate
- Connection pooling
- Avoiding unnecessary database calls
- Avoiding unbounded document growth

## Concurrency Principles

Operations involving shared inventory must use atomic database
operations and/or transactions where required.

Hotel room availability must be protected against race conditions.

## Room Hold

A room selected for booking can be temporarily held for 10 minutes.

The hold is represented using persistent database state rather than
an in-memory JavaScript timer.

Example:

status = HELD
holdExpiresAt = <expiration timestamp>

Expired holds must become available for other customers.

## Environment Separation

The same application code should be deployable to:

- Local
- DEV
- QA/SIT
- UAT
- Staging/Pre-Production
- Production

Environment-specific configuration and secrets must not be hardcoded
into application source code.