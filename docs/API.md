# API Documentation

## Base URL
`http://localhost:3000/api/v1`

## Authentication
Most endpoints require authentication via JSON Web Token (JWT).
Include the token in the `Authorization` header of your HTTP requests:
```http
Authorization: Bearer <your_jwt_token>
```

### Roles
- **CUSTOMER**: Can create orders, view their own orders, update/cancel their own orders.
- **ADMIN**: Can view all orders, and update order statuses.

---

## Auth Endpoints

### 1. Register
Registers a new customer.

- **Method**: `POST`
- **Path**: `/auth/register`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "id": "cuid...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CUSTOMER"
  }
  ```

### 2. Login
Authenticates a user and returns a JWT.

- **Method**: `POST`
- **Path**: `/auth/login`
- **Body**:
  ```json
  {
    "email": "customer@example.com",
    "password": "password123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR..."
  }
  ```

---

## Menu Endpoints

### `GET /menu`
Retrieve all available menu items.
- **Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Pizza",
    "description": "Cheese pizza",
    "price": "12.99",
    "isAvailable": true
  }
]
```

### `GET /menu/:id`
Retrieve a specific menu item.
- **Response:** `200 OK`
- **Errors:** `404 Not Found`

## Order Endpoints

### 1. Create Order (Requires CUSTOMER role)
Create a new order for the authenticated user.

- **Method**: `POST`
- **Request Body:**
```json
{
  "items": [
    { "menuItemId": "uuid1", "quantity": 2 },
    { "menuItemId": "uuid2", "quantity": 1 }
  ]
}
```
- **Response:** `201 Created`
```json
{
  "id": "order-uuid",
  "status": "PENDING",
  "totalAmount": "35.50",
  "items": [ ... ]
}
```

### 2. Get All Orders (Requires Auth)
Retrieve a paginated list of orders. (Admins see all; Customers see only their own).

- **Method**: `GET`
- **Query Params:** `?status=PENDING` (optional)
- **Response:** `200 OK`

### 3. Get Order by ID (Requires Auth)
Retrieve a specific order. (Customers can only view their own).

- **Method**: `GET`
- **Response:** `200 OK`
- **Errors:** `404 Not Found`

### 4. Update Order (Requires CUSTOMER role)
Update an order's details (address/phone) only when in `ORDER_RECEIVED` status. Must be the owner.

- **Method**: `PATCH`
- **Request Body:** Similar to POST, replaces items.
- **Errors:** `400 Bad Request` if not PENDING.

### 5. Delete Order
Cancel/Soft-delete an order.
- **Errors:** `400 Bad Request` if already delivered or cancelled.

### 6. Update Order Status (Requires ADMIN role)
Manually transition the status of an order (Admin only).

- **Method**: `PATCH`
- **Request Body:**
```json
{
  "status": "PREPARING"
}
```
- **Errors:** `400 Bad Request` for invalid transition.

### `GET /health`
Health check endpoint.

## WebSocket Events

Gateway URL: `/` (or `/events`)

- **Emit `joinOrderRoom`**: Client sends `{"orderId": "uuid"}` to join.
- **Listen `orderStatusUpdate`**: Server pushes updates.
```json
{
  "orderId": "uuid",
  "status": "PREPARING",
  "updatedAt": "2024-01-01T12:00:00Z"
}
```
