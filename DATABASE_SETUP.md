# Car Rental App Database Setup

This document describes the MongoDB database setup for the Car Rental Platform MVP.

## 🗄️ Database Architecture

The application uses **MongoDB** with a **microservices architecture** where each service has its own database:

- **user-service** → `car_rental_users` database
- **car-service** → `car_rental_cars` database  
- **booking-service** → `car_rental_bookings` database
- **payment-service** → `car_rental_payments` database

## 📋 Database Schemas

### 1. User Schema (`car_rental_users.users`)

```typescript
interface IUser {
  email: string;                    // Unique, lowercase, validated
  passwordHash: string;             // bcrypt hashed password
  role: 'customer' | 'admin';       // User role (default: customer)
  profile: {
    firstName: string;
    lastName: string;
    phone: string;                  // Validated mobile phone
    driverLicense: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ email: 1 }` (unique)
- `{ role: 1 }`
- `{ 'profile.phone': 1 }`

### 2. Car Schema (`car_rental_cars.cars`)

```typescript
interface ICar {
  title: string;                    // Car name/model
  category: 'sedan' | 'suv' | 'hatchback' | 'luxury' | 'van';
  features: string[];               // Array of car features
  pricePerDay: number;              // Daily rental price (min: $1)
  location: {
    city: string;
    address: string;
  };
  availability: boolean;            // Default: true
  images: string[];                 // Array of image URLs
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ category: 1 }`
- `{ 'location.city': 1 }`
- `{ pricePerDay: 1 }`
- `{ availability: 1 }`
- `{ category: 1, 'location.city': 1, pricePerDay: 1 }` (compound)
- Text index on `{ title: 'text', features: 'text' }`

### 3. Booking Schema (`car_rental_bookings.bookings`)

```typescript
interface IBooking {
  userId: ObjectId;                 // Reference to User
  carId: ObjectId;                  // Reference to Car
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  startDate: Date;                  // Must be in future
  endDate: Date;                    // Must be after startDate
  totalPrice: number;               // Total booking cost
  paymentId?: ObjectId;             // Reference to Payment
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ userId: 1 }`
- `{ carId: 1 }`
- `{ status: 1 }`
- `{ carId: 1, startDate: 1, endDate: 1 }` (conflict checking)
- `{ carId: 1, status: 1, startDate: 1, endDate: 1 }`

**Conflict Prevention:**
- Pre-save middleware prevents overlapping bookings for the same car
- Only checks `confirmed` and `active` status bookings

### 4. Payment Schema (`car_rental_payments.payments`)

```typescript
interface IPayment {
  bookingId: ObjectId;              // Reference to Booking
  userId: ObjectId;                 // Reference to User
  provider: 'stripe' | 'paypal';    // Payment provider
  amount: number;                   // Payment amount
  currency: string;                 // Default: 'USD'
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  transactionId: string;            // Unique transaction ID
  metadata?: Record<string, any>;   // Additional payment data
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ transactionId: 1 }` (unique)
- `{ bookingId: 1 }`
- `{ userId: 1 }`
- `{ status: 1 }`
- `{ provider: 1 }`
- `{ userId: 1, status: 1, createdAt: -1 }` (compound)

## 🐳 Docker Setup

### MongoDB Container Configuration

```yaml
mongodb:
  image: mongo:7.0
  container_name: car-rental-mongodb
  restart: unless-stopped
  ports:
    - "27017:27017"
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: password123
    MONGO_INITDB_DATABASE: car_rental
  volumes:
    - mongodb_data:/data/db
    - ./mongodb-init:/docker-entrypoint-initdb.d
  networks:
    - car-rental-network
```

### Environment Variables

Each service has its own `.env` file with database configuration:

```bash
# Database Configuration
MONGODB_URI=mongodb://admin:password123@mongodb:27017/car_rental_users?authSource=admin
```

## 🚀 Getting Started

### 1. Start MongoDB Container

```bash
cd backend
docker-compose up mongodb -d
```

### 2. Install Dependencies

```bash
# For each service
cd user-service
npm install

cd ../car-service  
npm install

cd ../booking-service
npm install

cd ../payment-service
npm install
```

### 3. Build TypeScript

```bash
# For each service
npm run build
```

### 4. Start Services

```bash
# Development mode with TypeScript
npm run dev

# Production mode
npm start
```

### 5. Test Database Connections

Visit these endpoints to verify database connectivity:

- User Service: `http://localhost:3001/test-db`
- Car Service: `http://localhost:3002/test-db`
- Booking Service: `http://localhost:3003/test-db`
- Payment Service: `http://localhost:3004/test-db`

## 🔧 Database Configuration

### Connection Options

```typescript
const databaseConfig = {
  url: process.env.MONGODB_URI,
  options: {
    maxPoolSize: 10,              // Connection pool size
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    bufferMaxEntries: 0,
  }
};
```

### Graceful Shutdown

All services handle graceful database disconnection on:
- `SIGINT` (Ctrl+C)
- `SIGTERM` (Docker stop)

## 📊 Database Operations

### User Operations
- Create user with encrypted password
- Authenticate user with JWT
- Update user profile
- Role-based access control

### Car Operations  
- CRUD operations for cars
- Search by category, location, price
- Availability management
- Image upload handling

### Booking Operations
- Create/cancel bookings
- Conflict detection
- Status workflow management
- Date validation

### Payment Operations
- Process payments via Stripe/PayPal
- Handle webhooks
- Refund processing
- Transaction tracking

## 🛡️ Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **Input Validation**: Mongoose schema validation
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for frontend domains
- **Helmet**: Security headers
- **Environment Variables**: Sensitive data in .env files

## 📈 Performance Optimization

- **Indexes**: Strategic indexing for common queries
- **Connection Pooling**: MongoDB connection pool management
- **Compound Indexes**: Multi-field query optimization
- **Text Search**: Full-text search on car titles and features

## 🧪 Testing

Each service provides health check endpoints:

```bash
GET /health           # Service health status
GET /test-db          # Database connection test
GET /                 # Service information
```

## 🔄 Next Steps

1. **Install dependencies** for all services
2. **Start MongoDB** container
3. **Build TypeScript** code
4. **Test database connections**
5. **Implement API endpoints** for each service
6. **Add authentication middleware**
7. **Create frontend integration**

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure MongoDB container is running
2. **Authentication Failed**: Check username/password in .env
3. **TypeScript Errors**: Run `npm install` to install dependencies
4. **Port Conflicts**: Ensure ports 27017, 3001-3006 are available

### Debug Commands

```bash
# Check MongoDB container status
docker-compose ps

# View MongoDB logs
docker-compose logs mongodb

# Test direct MongoDB connection
docker exec -it car-rental-mongodb mongosh -u admin -p password123

# Check service logs
docker-compose logs user-service
```