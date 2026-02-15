# Poemvy Backend API

Production-ready REST API for Poemvy - a poetry sharing platform built with Node.js, Express, and MongoDB.

## Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting
- **express-validator** - Input validation

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from example:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/poemvy
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
```

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── database.js  # MongoDB connection
│   ├── models/          # Mongoose schemas
│   │   ├── User.js
│   │   ├── Poem.js
│   │   └── Collection.js
│   ├── routes/          # API routes
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── poem.routes.js
│   │   └── collection.routes.js
│   ├── controllers/     # Request handlers
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── poem.controller.js
│   │   └── collection.controller.js
│   ├── services/        # Business logic
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── poem.service.js
│   │   └── collection.service.js
│   ├── middleware/      # Custom middleware
│   │   └── auth.js      # JWT authentication
│   └── app.js           # Express app setup
├── server.js            # Server entry point
├── package.json
└── .env.example
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user (protected)

### Users
- `GET /api/users/profile/:username` - Get user profile
- `GET /api/users/search?q=query` - Search users
- `PUT /api/users/profile` - Update profile (protected)
- `PUT /api/users/password` - Update password (protected)
- `PUT /api/users/username` - Update username (protected)
- `POST /api/users/follow/:userId` - Follow user (protected)
- `POST /api/users/unfollow/:userId` - Unfollow user (protected)
- `DELETE /api/users/account` - Delete account (protected)

### Poems
- `GET /api/poems/feed` - Get poem feed
- `GET /api/poems/:poemId` - Get single poem
- `GET /api/poems/user/:username` - Get user's poems
- `GET /api/poems/tag/:tag` - Get poems by tag
- `POST /api/poems` - Create poem (protected)
- `PUT /api/poems/:poemId` - Update poem (protected)
- `DELETE /api/poems/:poemId` - Delete poem (protected)
- `POST /api/poems/:poemId/like` - Like poem (protected)
- `POST /api/poems/:poemId/unlike` - Unlike poem (protected)
- `POST /api/poems/:poemId/comment` - Add comment (protected)
- `DELETE /api/poems/:poemId/comment/:commentId` - Delete comment (protected)
- `POST /api/poems/:poemId/share` - Share poem (protected)

### Collections
- `GET /api/collections/:collectionId` - Get collection
- `GET /api/collections/user/:username` - Get user's collections
- `POST /api/collections` - Create collection (protected)
- `PUT /api/collections/:collectionId` - Update collection (protected)
- `DELETE /api/collections/:collectionId` - Delete collection (protected)
- `POST /api/collections/:collectionId/poems/:poemId` - Add poem to collection (protected)
- `DELETE /api/collections/:collectionId/poems/:poemId` - Remove poem from collection (protected)
- `POST /api/collections/:collectionId/follow` - Follow collection (protected)
- `POST /api/collections/:collectionId/unfollow` - Unfollow collection (protected)

## Authentication

Protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Access tokens expire in 15 minutes. Use the refresh token to get a new access token:

```bash
POST /api/auth/refresh
{
  "refreshToken": "your_refresh_token"
}
```

## Security Features

- JWT authentication with refresh tokens
- Password hashing with bcryptjs
- Helmet security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- Input validation with express-validator
- MongoDB injection protection
- XSS protection

## Error Handling

All errors return JSON with the following format:

```json
{
  "error": "Error message"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## License

MIT
