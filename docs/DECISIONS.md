# Architecture Decision Records (ADRs)

### 1. Why NestJS?
**Context:** Need a backend framework for a scalable Node.js application.
**Decision:** Selected NestJS.
**Consequences:** Provides a TypeScript-first, modular architecture with robust Dependency Injection and enterprise patterns out of the box. Slightly steeper learning curve, but high maintainability.

### 2. Why PostgreSQL?
**Context:** Choosing a primary data store.
**Decision:** Selected PostgreSQL.
**Consequences:** Ensures ACID compliance for transactional data (orders). Native support for JSON and precise Decimal types. Production-proven.

### 3. Why Prisma?
**Context:** Selecting an ORM for database interaction.
**Decision:** Selected Prisma ORM.
**Consequences:** Provides excellent type safety, schema-first design, and seamless migrations. Developer experience (DX) is superior to traditional ORMs like TypeORM.

### 4. Why modular monolith?
**Context:** Deciding on system architecture boundaries.
**Decision:** Adopted a modular monolith architecture.
**Consequences:** Right-sized for current requirements. Clear boundaries (Modules) allow for easy deployment now, while leaving a path to evolve into microservices if needed later.

### 5. Why WebSocket/Socket.IO?
**Context:** Requirement for real-time status updates to clients.
**Decision:** Implemented Socket.IO.
**Consequences:** Enables real-time bidirectional communication. Built-in support for "rooms" makes it trivial to subscribe users to specific order updates. Wide client support and fallback mechanisms.

### 6. Why price snapshots?
**Context:** Storing item prices in the order history.
**Decision:** Copy `MenuItem` price to `OrderItem.priceAtOrder` at creation.
**Consequences:** Guarantees historical accuracy. Menu price changes will not retroactively alter the total amount of past orders.

### 7. Why state machine pattern?
**Context:** Managing order status transitions (PENDING -> PREPARING -> etc).
**Decision:** Implemented a centralized OrderStatusPolicy (State Machine).
**Consequences:** Protects domain integrity. Prevents invalid transitions and centralizes business rules, making the logic highly testable.

### 8. Why EventEmitter for decoupling?
**Context:** Triggering WebSocket updates after database saves.
**Decision:** Used `@nestjs/event-emitter`.
**Consequences:** Simple, in-process event bus. Decouples the HTTP/Service layer from the WebSocket layer without requiring external dependencies (like Redis/RabbitMQ). Sufficient for the assessment scope.

### 9. Why simple timers for simulation?
**Context:** Simulating order status progression automatically.
**Decision:** Used standard Node.js `setTimeout`.
**Consequences:** Meets the assessment scope easily. However, it has limitations (state is lost on server restart). Production alternatives (e.g., BullMQ) are documented.

### 10. Why CANCELLED status?
**Context:** Handling user cancellation or admin rejection.
**Decision:** Added a CANCELLED status (soft-delete approach).
**Consequences:** Mirrors real-world necessity. Preserves order history and metrics rather than hard-deleting records from the database.

### 11. Why duplicate item merging?
**Context:** User submits an order with two identical items separately.
**Decision:** Merge duplicate items and sum their quantities.
**Consequences:** UX-friendly and mirrors real food delivery apps. Optimizes database storage (fewer rows in `OrderItem`).

### 12. Why abstract repository classes?
**Context:** Structuring database access logic.
**Decision:** Created abstract Repository classes (interfaces) as DI tokens.
**Consequences:** Adheres to Dependency Inversion. Makes the application highly testable by easily injecting mock repositories. Allows swapping Prisma for another ORM with minimal service-level changes.
