# UniConnect NestJS Backend

Production-ready NestJS backend for the UniConnect application.

## Features

- **NestJS Framework**: Modern, scalable Node.js framework
- **TypeScript**: Full TypeScript support with strict typing
- **Supabase Integration**: Database operations with Supabase
- **JWT Authentication**: Secure authentication with Passport
- **API Documentation**: Swagger/OpenAPI documentation
- **Rate Limiting**: Built-in rate limiting for API protection
- **Security**: Helmet, CORS, and input validation
- **Production Ready**: Docker, PM2, and clustering support

## Quick Start

### Prerequisites

- Node.js 18+
- npm 8+
- Supabase account and project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure your `.env` file with your Supabase credentials and JWT secret.

### Development

```bash
# Start in development mode
npm run start:dev

# Build the application
npm run build

# Start in production mode
npm run start:prod
```

### API Documentation

Once running, visit `http://localhost:3000/api` for Swagger documentation.

## Production Deployment

### Using Docker

```bash
# Build Docker image
docker build -t uniconnect-backend .

# Run container
docker run -p 3000:3000 --env-file .env uniconnect-backend
```

### Using PM2

```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/google` - Google authentication
- `GET /auth/verify-token` - Token verification

### Orders
- `POST /orders/create` - Create new order
- `GET /orders/user/:userId` - Get user orders
- `GET /orders/:orderId` - Get specific order
- `PATCH /orders/:orderId/status` - Update order status
- `DELETE /orders/:orderId` - Delete order
- `GET /orders/user/:userId/stats` - Get order statistics

### Users
- `GET /users` - Get all users
- `GET /users/:userId` - Get specific user

### Meals
- `GET /meals` - Get all meals
- `GET /meals/:id` - Get specific meal

### Market
- `GET /market` - Get all market items
- `GET /market/:id` - Get specific market item

### Rentals
- `GET /rentals` - Get all rentals
- `GET /rentals/:id` - Get specific rental

### Notifications
- `GET /notifications` - Get all notifications
- `GET /notifications/user/:userId` - Get user notifications

### Profile
- `GET /profile/:userId` - Get user profile
- `PUT /profile/:userId` - Update user profile

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration time | No (default: 7d) |
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment mode | No (default: development) |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: *) |

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request rate limiting
- **Input Validation**: Request validation with class-validator
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt password hashing

## Performance Features

- **Compression**: Response compression
- **Clustering**: PM2 cluster mode support
- **Caching**: Built-in caching capabilities
- **Database Optimization**: Efficient Supabase queries

## Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run test coverage
npm run test:cov
```

## License

MIT License