# Backend Microservices

This folder contains all backend microservices for the Car Rental App. Each service is an independent Node.js/Express.js app, containerized with Docker.

- `user-service`: User authentication and profiles
- `car-service`: Car CRUD and availability
- `booking-service`: Booking management
- `payment-service`: Payment processing
- `notification-service`: Email/push notifications
- `ai-service`: AI chat/recommendations
- `gateway-service`: API Gateway

Use `docker-compose.yml` to orchestrate all services.
