# Like & Bookmark Feature - Backend Integration

## Overview
The heart (like) and bookmark features are now integrated with a real backend API that persists data across sessions.

## What's Been Implemented

### Backend Changes

1. **User Model Updates** ([backend/src/models/User.js](backend/src/models/User.js))
   - Added `bookmarkedPoems` field to store user's bookmarked poems

2. **API Routes** ([backend/src/routes/user.routes.js](backend/src/routes/user.routes.js))
   - `POST /api/users/bookmark/:poemId` - Bookmark a poem
   - `POST /api/users/unbookmark/:poemId` - Remove bookmark
   - `GET /api/users/bookmarks` - Get all bookmarked poems
   - `GET /api/users/likes` - Get all liked poems

3. **API Routes** ([backend/src/routes/poem.routes.js](backend/src/routes/poem.routes.js))
   - `POST /api/poems/:poemId/like` - Like a poem (already existed)
   - `POST /api/poems/:poemId/unlike` - Unlike a poem (already existed)

4. **Controllers & Services**
   - Added bookmark/unbookmark methods in [backend/src/controllers/user.controller.js](backend/src/controllers/user.controller.js)
   - Implemented service layer in [backend/src/services/user.service.js](backend/src/services/user.service.js)

### Frontend Changes

1. **API Integration** ([frontend/api.js](frontend/api.js))
   - Complete API client for like/unlike operations
   - Bookmark/unbookmark operations
   - Load user's liked and bookmarked poems
   - In-memory caching for quick state checks

2. **Updated Pages**
   - [frontend/index.html](frontend/index.html) - Integrated with backend API
   - [frontend/profile.html](frontend/profile.html) - Integrated with backend API
   - Added `data-poem-id` attributes to all poem cards
   - Automatic state restoration on page load

## How It Works

### User Flow

1. **When page loads:**
   - If user is authenticated, the app fetches all their liked and bookmarked poems
   - Icons are automatically set to filled/colored state for previously liked/bookmarked poems

2. **When clicking heart button:**
   - UI updates immediately (optimistic update)
   - API call is made in the background
   - If API call fails, UI reverts to previous state
   - Like count increments/decrements
   - Icon switches between outline and filled heart

3. **When clicking bookmark button:**
   - UI updates immediately (optimistic update)
   - API call is made in the background
   - If API call fails, UI reverts to previous state
   - Text changes between "Save" and "Saved"
   - Icon switches between outline and filled bookmark

### Authentication

The system checks for authentication using `localStorage.getItem('authToken')`.

- **If authenticated:** All actions persist to backend database
- **If not authenticated:** Actions only work in the current session (no persistence)

## Setup Instructions

### 1. Start MongoDB
```bash
# Make sure MongoDB is running locally
# Default connection: mongodb://localhost:27017/poemvy
```

### 2. Start Backend Server
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### 3. Start Frontend Server
```bash
cd frontend
python -m http.server 8080
# Or use any other static file server
# Frontend runs on http://localhost:8080
```

### 4. Testing the Features

**For full functionality (with persistence):**
1. Create a user account via the auth API
2. Store the auth token in localStorage: `localStorage.setItem('authToken', 'your_token_here')`
3. Refresh the page
4. Now likes and bookmarks will persist!

**For demo (without persistence):**
- Features work without authentication
- State is maintained during the current session only
- Refreshing the page will reset all likes/bookmarks

## API Endpoints Reference

### Poems
- `POST /api/poems/:poemId/like` - Like a poem
- `POST /api/poems/:poemId/unlike` - Unlike a poem

### Users
- `POST /api/users/bookmark/:poemId` - Bookmark a poem
- `POST /api/users/unbookmark/:poemId` - Unbookmark a poem
- `GET /api/users/bookmarks` - Get user's bookmarked poems
- `GET /api/users/likes` - Get user's liked poems

All protected routes require the `Authorization: Bearer <token>` header.

## Database Schema

### User Model
```javascript
{
  // ... existing fields
  bookmarkedPoems: [{ type: ObjectId, ref: 'Poem' }]
}
```

### Poem Model
```javascript
{
  // ... existing fields
  likes: [{ type: ObjectId, ref: 'User' }]  // Already existed
}
```

## Features

✅ Backend persistence - Likes and bookmarks saved to MongoDB
✅ Automatic state restoration - Current state loaded on page refresh
✅ Optimistic UI updates - Instant feedback before API response
✅ Error handling - UI reverts if API calls fail
✅ Visual feedback - Filled icons in red (likes) and orange (bookmarks)
✅ Like counters - Real-time increment/decrement
✅ Works without auth - For demo purposes

## Next Steps (Optional Enhancements)

- Add authentication UI (login/signup pages)
- Create a bookmarks page to view all saved poems
- Add notification when like/bookmark actions succeed/fail
- Implement real-time updates using WebSockets
- Add analytics for most liked/bookmarked poems
