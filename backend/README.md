# QuickCourt Backend API

A comprehensive backend API for the QuickCourt sports venue booking application built with Node.js, Express, and SQLite.

## Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control
- **Venue Management**: CRUD operations for sports venues with approval workflow
- **Court Management**: Manage courts within venues with pricing
- **Booking System**: Complete booking lifecycle with time slot management
- **Payment Processing**: Integration ready for Stripe payments
- **Review System**: User reviews and ratings for venues
- **Admin Panel**: Administrative functions for venue approval and user management
- **Owner Dashboard**: Venue owners can manage their facilities and bookings

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **File Upload**: multer
- **Email**: nodemailer
- **Payments**: Stripe (ready for integration)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Venues
- `GET /api/venues` - Get all venues (with filters)
- `GET /api/venues/:id` - Get single venue
- `POST /api/venues` - Create venue (Owner/Admin)
- `PUT /api/venues/:id` - Update venue (Owner/Admin)
- `GET /api/venues/:venueId/courts/:courtId/slots` - Get available time slots

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get single booking
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `PUT /api/bookings/:id/status` - Update booking status (Owner/Admin)

### Admin
- `GET /api/admin/venues/pending` - Get pending venue approvals
- `PUT /api/admin/venues/:id/approve` - Approve/reject venue
- `GET /api/admin/users` - Get all users

### Owner
- `GET /api/owner/venues` - Get owner's venues
- `GET /api/owner/bookings` - Get owner's bookings

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment

## Database Schema

### Users
- id, email, password, fullName, phone, role, isVerified, isActive, profileImage, createdAt, updatedAt

### Venues
- id, name, description, location, address, latitude, longitude, ownerId, isApproved, isActive, rating, totalRatings, images, amenities, openingHours, createdAt, updatedAt

### Sports
- id, name, description, icon, isActive, createdAt

### Courts
- id, venueId, name, sportId, description, pricePerHour, isActive, createdAt, updatedAt

### Time Slots
- id, courtId, startTime, endTime, dayOfWeek, isAvailable, createdAt

### Bookings
- id, userId, courtId, date, startTime, endTime, duration, totalAmount, status, paymentStatus, paymentMethod, stripePaymentIntentId, notes, createdAt, updatedAt

### Reviews
- id, userId, venueId, bookingId, rating, comment, isVerified, createdAt

### Notifications
- id, userId, title, message, type, isRead, createdAt

### Payment Transactions
- id, bookingId, stripePaymentIntentId, amount, currency, status, paymentMethod, metadata, createdAt

### Teams
- id, name, captainId, description, logo, isActive, createdAt, updatedAt

### Team Members
- id, teamId, userId, role, joinedAt

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp env.example .env
   ```

4. Configure environment variables in `.env`

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=./database/quickcourt.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Role-Based Access Control

- **user**: Regular users who can book courts
- **owner**: Venue owners who can manage their facilities
- **admin**: Administrators with full system access

## Development

### Database Migration
```bash
npm run migrate
```

### Seed Database
```bash
npm run seed
```

### Run Tests
```bash
npm test
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a production database (PostgreSQL recommended)
3. Configure proper JWT secrets
4. Set up SSL/TLS certificates
5. Configure proper CORS settings
6. Set up monitoring and logging

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation with express-validator
- Rate limiting
- CORS protection
- Helmet.js security headers
- SQL injection prevention with parameterized queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
