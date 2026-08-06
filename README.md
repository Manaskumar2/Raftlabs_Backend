# Order Management Backend

A robust, modular NestJS backend for managing food delivery orders, featuring a RESTful API, PostgreSQL database, and real-time WebSocket updates.

## Architecture Diagram

```mermaid
graph TD
    Client[Client Apps] --> |REST API| NestJS
    Client <--> |WebSocket| NestJS
    NestJS --> |Prisma ORM| Postgres[(PostgreSQL)]
```

## Features
- **Menu Management:** REST endpoints to fetch available items.
- **Order Processing:** Create, read, update, and delete (cancel) orders.
- **Status Simulation:** Background tasks simulate the kitchen preparation and delivery process.
- **Real-Time Updates:** Socket.IO integration pushes status changes to subscribed clients.
- **Data Integrity:** Strict state machine for order transitions and exact decimal arithmetic for pricing.

## Tech Stack
- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Real-time:** Socket.IO
- **Validation:** class-validator, class-transformer

## Prerequisites
- Node.js (v20+)
- PostgreSQL (v16+)
- *Optional:* Docker and Docker Compose

## Quick Start (Docker)
```bash
docker-compose up -d
```

## Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/order_management?schema=public
   PORT=3000
   CORS_ORIGIN=*
   STATUS_PREPARING_DELAY=10000
   STATUS_DELIVERY_DELAY=10000
   STATUS_DELIVERED_DELAY=10000
   NODE_ENV=development
   ```

3. **Database Setup:**
   Ensure PostgreSQL is running.
   ```bash
   npx prisma migrate dev
   npm run seed
   ```

4. **Run the application:**
   ```bash
   npm run start:dev
   ```

## Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## Order Lifecycle

```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> PREPARING
    PREPARING --> OUT_FOR_DELIVERY
    OUT_FOR_DELIVERY --> DELIVERED
    
    PENDING --> CANCELLED
    
    DELIVERED --> [*]
    CANCELLED --> [*]
```

## Production Improvements
For a true production environment, the following improvements are recommended:
1. **Authentication/Authorization:** Add JWT-based auth to secure endpoints.
2. **Durable Message Queues:** Replace in-memory timers with BullMQ/Redis for resilient background processing.
3. **Horizontal Scaling:** Utilize Redis adapter for Socket.IO to support multiple backend instances.
4. **Monitoring:** Implement Prometheus metrics and centralized logging.