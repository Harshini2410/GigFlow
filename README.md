# GigFlow

A full-stack mini-freelance marketplace platform where Clients can post jobs (Gigs) and Freelancers can apply for them (Bids).

## Features

- **User Authentication**: Secure sign-up and login with JWT and HttpOnly cookies
- **Gig Management**: Post, browse, and search for jobs
- **Bidding System**: Freelancers can submit bids with messages and prices
- **Hiring Logic**: Clients can hire freelancers with atomic transaction support
- **Real-time Notifications**: Socket.io integration for instant hire notifications
- **Responsive UI**: Modern dark-first design with Tailwind CSS

## Tech Stack

### Frontend
- React.js 18.2.0 (with Vite 5.0.8)
- Tailwind CSS 3.4.0
- Redux Toolkit 2.0.1 (State Management)
- React Router DOM 6.21.1
- Axios 1.6.2
- Socket.io Client 4.6.1
- Framer Motion 10.16.16

### Backend
- Node.js with Express.js 4.18.2
- MongoDB with Mongoose 8.0.3
- JWT Authentication (jsonwebtoken 9.0.2)
- Socket.io 4.6.1
- bcryptjs 2.4.3

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB instance)
- npm or yarn

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd ServiceHive_assignment
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters_long
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Important**: 
- Replace `MONGODB_URI` with your MongoDB Atlas connection string
- Generate a strong random string for `JWT_SECRET` (minimum 32 characters)

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory (optional, defaults work for local development):

```env
VITE_API_URL=http://localhost:5000/api
```

## Running the Application

### Development Mode

1. Start the backend server:
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

### Production Build

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Start the backend:
```bash
cd backend
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Gigs
- `GET /api/gigs` - Get all open gigs (with optional `?search=query` parameter)
- `GET /api/gigs/:id` - Get single gig
- `POST /api/gigs` - Create a new gig (Protected)
- `GET /api/gigs/my-gigs` - Get user's gigs (Protected)

### Bids
- `POST /api/bids` - Submit a bid for a gig (Protected)
- `GET /api/bids/:gigId` - Get all bids for a specific gig (Owner only, Protected)
- `GET /api/bids/my-bids` - Get user's bids (Protected)
- `PATCH /api/bids/:bidId/hire` - Hire a freelancer (Owner only, Protected)

## Database Schema

### User
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, required, hashed)
- `timestamps` (createdAt, updatedAt)

### Gig
- `title` (String, required)
- `description` (String, required)
- `budget` (Number, required)
- `ownerId` (ObjectId, ref: User, required)
- `status` (String, enum: ['open', 'assigned'], default: 'open')
- `timestamps` (createdAt, updatedAt)

### Bid
- `gigId` (ObjectId, ref: Gig, required)
- `freelancerId` (ObjectId, ref: User, required)
- `message` (String, required)
- `price` (Number, required)
- `status` (String, enum: ['pending', 'hired', 'rejected'], default: 'pending')
- `timestamps` (createdAt, updatedAt)

## Bonus Features

### 1. Transactional Integrity (Race Conditions)
The hiring logic uses MongoDB Transactions to ensure atomic operations. If two users try to hire different freelancers simultaneously, only one will succeed, preventing race conditions.

Implementation: `backend/controllers/bidController.js` - `hireFreelancer` function

### 2. Real-time Updates
Socket.io integration provides instant notifications when a freelancer is hired. The freelancer receives a real-time notification: "You have been hired for [Project Name]!"

Implementation: 
- Backend: `backend/server.js` and `backend/controllers/bidController.js`
- Frontend: `frontend/src/utils/socket.js` and `frontend/src/App.jsx`

## Project Structure

```
ServiceHive_assignment/
├── backend/
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Auth and error middleware
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── server.js         # Express server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── store/        # Redux store and slices
│   │   ├── utils/        # API and socket utilities
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # React entry point
│   ├── index.html
│   └── package.json
└── README.md
```

## Security Features

- JWT tokens stored in HttpOnly cookies
- Password hashing with bcryptjs
- CORS configuration
- Protected routes with authentication middleware
- Input validation on all endpoints
- Authorization checks (e.g., only gig owners can view bids)

## Contributing

This is an assignment project. For issues or questions, please contact the repository owner.

## License

ISC

