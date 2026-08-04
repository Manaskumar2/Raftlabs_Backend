# High-Level Design (HLD)

## 1. System Overview

The Order Management Backend is a robust, modular API designed for handling food delivery orders. It provides a RESTful interface for managing menus and orders, coupled with a real-time WebSocket layer to push status updates to clients. The system is built using NestJS, TypeScript, and PostgreSQL (via Prisma ORM), enforcing strict business rules and clean architecture principles.

## 2. Architecture Diagram

```mermaid
graph TD
    Client[Web/Mobile Client]
    
    subgraph "NestJS Application"
        REST_API[REST API Gateway]
        WS_GW[WebSocket Gateway]
        
        REST_API --> MenuModule
        REST_API --> OrderModule
        
        OrderModule -.-> |Events| EventEmitter
        EventEmitter -.-> WS_GW
        
        MenuModule --> DB[(PostgreSQL)]
        OrderModule --> DB
    end
    
    Client -- HTTP Requests --> REST_API
    Client -- WebSocket Conn --> WS_GW
    WS_GW -- Real-time Updates --> Client
```

## 3. Module Architecture Diagram

```mermaid
graph TD
    AppModule --> MenuModule
    AppModule --> OrderModule
    AppModule --> RealtimeModule
    AppModule --> PrismaModule
    AppModule --> EventsModule
    
    OrderModule --> PrismaModule
    OrderModule --> EventsModule
    
    MenuModule --> PrismaModule
    
    RealtimeModule --> EventsModule
```

## 4. Order Creation Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant API as OrderController
    participant S as OrderService
    participant R as OrderRepository
    participant DB as PostgreSQL
    participant E as EventEmitter
    participant WS as WebSocketGateway

    C->>API: POST /api/v1/orders (items)
    API->>S: createOrder(dto)
    S->>S: Calculate total price, snapshot prices
    S->>R: create(orderData)
    R->>DB: INSERT order & items
    DB-->>R: Created Order
    R-->>S: Created Order
    S->>E: emit('order.created', order)
    E->>WS: handleOrderCreated(event)
    WS->>C: Push Update (Status: PENDING)
    S-->>API: Response
    API-->>C: 201 Created (Order)
    
    Note over S: Background simulation starts
```

## 5. Status Simulation Sequence Diagram

```mermaid
sequenceDiagram
    participant S as OrderService
    participant E as EventEmitter
    participant WS as WebSocketGateway
    participant C as Client

    Note over S: Timer: STATUS_PREPARING_DELAY
    S->>S: updateStatus(PREPARING)
    S->>E: emit('order.updated', order)
    E->>WS: Broadcast Update
    WS->>C: Push Update (Status: PREPARING)

    Note over S: Timer: STATUS_DELIVERY_DELAY
    S->>S: updateStatus(OUT_FOR_DELIVERY)
    S->>E: emit('order.updated', order)
    E->>WS: Broadcast Update
    WS->>C: Push Update (Status: OUT_FOR_DELIVERY)

    Note over S: Timer: STATUS_DELIVERED_DELAY
    S->>S: updateStatus(DELIVERED)
    S->>E: emit('order.updated', order)
    E->>WS: Broadcast Update
    WS->>C: Push Update (Status: DELIVERED)
```

## 6. Real-time Architecture Diagram

```mermaid
graph TD
    subgraph "Clients"
        C1[Client 1 - Order #101]
        C2[Client 2 - Order #102]
        C3[Admin Dashboard]
    end
    
    subgraph "WebSocket Server (Socket.IO)"
        Room1[Room: order_101]
        Room2[Room: order_102]
        RoomAdmin[Room: admin_updates]
    end
    
    subgraph "Application Core"
        EventEmitter[Node EventEmitter]
        OrderSvc[Order Service]
    end
    
    OrderSvc -- status change --> EventEmitter
    EventEmitter -- event --> WS_Server
    
    WS_Server --> Room1
    WS_Server --> Room2
    WS_Server --> RoomAdmin
    
    Room1 --> C1
    Room2 --> C2
    RoomAdmin --> C3
```

## 7. Technology Choices Rationale

- **NestJS:** Chosen for its opinionated, modular structure, excellent dependency injection, and native TypeScript support. It scales well with team size and codebase complexity.
- **TypeScript:** Enforces type safety, catching errors at compile-time rather than runtime.
- **PostgreSQL:** A highly reliable, ACID-compliant relational database. Perfect for transactional financial data (orders, prices).
- **Prisma:** Provides a type-safe database client and straightforward schema migrations.
- **Socket.IO:** Offers reliable real-time bidirectional communication with automatic fallbacks and built-in room support.

## 8. Scalability Approach

The current design is a **Modular Monolith**. This is the right choice for early-stage applications as it provides clear boundaries without the operational overhead of microservices. 
- **Database:** PostgreSQL handles high concurrency. Indexes are placed strategically on foreign keys and queried fields.
- **Compute:** The NestJS app is stateless (except for WebSocket connections and in-memory timers) and can be scaled horizontally.

## 9. Production Evolution Path

To take this application to production scale:
1.  **State Management:** Replace in-process `EventEmitter` with a durable message broker (RabbitMQ or Kafka) for cross-service events.
2.  **WebSocket Scaling:** Introduce a Redis adapter for Socket.IO to broadcast events across multiple instances.
3.  **Background Jobs:** Replace in-memory `setTimeout` with a robust background job queue (e.g., BullMQ with Redis) to ensure state transitions happen reliably even if the pod restarts.
4.  **Database:** Introduce read-replicas if read traffic (menu fetching, order history) overwhelms the primary database.

## 10. In-process Timer Limitations and Production Alternatives

**Current Limitation:** The automated status progression uses Node.js `setTimeout`. If the application crashes or restarts, active timers are lost, and orders will stall in their current state.

**Production Alternative:** 
- Use a distributed job queue like **BullMQ**.
- When an order is created, schedule a delayed job for `PREPARING`, which schedules a job for `OUT_FOR_DELIVERY`, etc.
- This ensures persistence, retry logic, and horizontal scalability.
