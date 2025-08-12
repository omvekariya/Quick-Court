# QuickCourt - Sports Venue Booking Platform

A comprehensive sports venue booking platform that connects sports enthusiasts with local sports facilities. Built with React, TypeScript, Node.js, and SQLite.

---
## 👨‍💻 Team Members

| Name                         | Email                      |
| ---------------------------- | -------------------------- |
| *Prince Harshadbhai Patel* | prins14104@gmail.com       |
| *Om Sanjaybhai Vekariya*   | omvekariya31@gmail.com     |
| *Dhruv Pravinbhai Raiyani* | dhruvraiyani2004@gmail.com |

---
📽 *Demo Video*: [https://drive.google.com/file/d/1PYhFzrEXkJ2jinoyonqsPNwDYi3DAtf6/view](https://drive.google.com/file/d/1PYhFzrEXkJ2jinoyonqsPNwDYi3DAtf6/view)
---

## 🏀 Features

### For Users
- **Browse Venues**: Search and filter sports venues by location, sport type, and price
- **Book Courts**: Easy booking system with real-time availability
- **Manage Bookings**: View, cancel, and track booking history
- **Reviews & Ratings**: Rate and review venues after bookings
- **Team Management**: Create and manage sports teams
- **Payment Integration**: Secure payment processing with Stripe

### For Venue Owners
- **Venue Management**: Add and manage multiple sports facilities
- **Court Management**: Set up courts with pricing and availability
- **Time Slot Management**: Configure operating hours and availability
- **Booking Overview**: Monitor and manage incoming bookings
- **Analytics Dashboard**: Track revenue and booking statistics

### For Administrators
- **Venue Approval**: Review and approve new venue submissions
- **User Management**: Manage user accounts and roles
- **System Reports**: Generate comprehensive system reports
- **Content Moderation**: Moderate reviews and content

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **React Router** for navigation
- **React Query** for data fetching
- **Axios** for API communication
- **React Hook Form** for form handling

### Backend
- **Node.js** with Express.js
- **SQLite** for database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation
- **Multer** for file uploads
- **Stripe** for payments
- **Nodemailer** for email notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=./database/quickcourt.db
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The backend will be running at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

The frontend will be running at `http://localhost:5173`

## 📁 Project Structure

```
QuickCourt/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── database/       # Database setup and migrations
│   │   └── utils/          # Utility functions
│   ├── database/           # SQLite database files
│   └── package.json
└── README.md
```

## 🔐 Authentication & Authorization

The application uses JWT-based authentication with role-based access control:

- **User**: Can book courts, manage bookings, and write reviews
- **Owner**: Can manage venues, courts, and view booking analytics
- **Admin**: Has full system access for moderation and management

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts and profiles
- **venues**: Sports facilities and their details
- **courts**: Individual courts within venues
- **bookings**: Court reservations
- **reviews**: User reviews and ratings
- **sports**: Available sports types
- **teams**: User-created sports teams
- **notifications**: System notifications
- **payments**: Payment transaction records

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Venues
- `GET /api/venues` - Get all venues (with filters)
- `GET /api/venues/:id` - Get single venue details
- `POST /api/venues` - Create new venue (Owner/Admin)
- `PUT /api/venues/:id` - Update venue (Owner/Admin)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user's bookings
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Admin
- `GET /api/admin/venues/pending` - Get pending venue approvals
- `PUT /api/admin/venues/:id/approve` - Approve/reject venue
- `GET /api/admin/users` - Get all users

### Owner
- `GET /api/owner/venues` - Get owner's venues
- `GET /api/owner/bookings` - Get owner's bookings

## 🎨 UI Components

The frontend uses a comprehensive set of UI components built with Shadcn/ui:

- **Cards**: Venue cards, booking cards
- **Forms**: Login, registration, booking forms
- **Navigation**: Navbar, sidebar, breadcrumbs
- **Data Display**: Tables, lists, statistics
- **Feedback**: Toasts, alerts, loading states

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run migrate      # Run database migrations
npm run seed         # Seed database with sample data
npm test             # Run tests
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

## 🚀 Deployment

### Backend Deployment
1. Set `NODE_ENV=production`
2. Configure production database (PostgreSQL recommended)
3. Set up proper JWT secrets
4. Configure environment variables
5. Deploy to your preferred platform (Heroku, Railway, etc.)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting platform
3. Configure environment variables for API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team

## 🔮 Future Enhancements

- **Mobile App**: React Native mobile application
- **Real-time Features**: Live booking updates and notifications
- **Advanced Analytics**: Detailed reporting and insights
- **Social Features**: User profiles, friend connections
- **Tournament Management**: Organize and manage sports tournaments
- **Integration APIs**: Connect with external sports platforms
