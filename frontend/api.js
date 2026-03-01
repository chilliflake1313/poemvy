// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Token management
function getAuthToken() {
  return localStorage.getItem('accessToken');
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

function setTokens(accessToken, refreshToken) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.clear();
}

// Check if user is authenticated - DISABLED FOR DEVELOPMENT
function isAuthenticated() {
  return false; // Always return false during development
}

// Refresh access token
async function refreshAccessToken() {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch (error) {
    // Refresh failed - logout user
    handleUnauthorized();
    throw error;
  }
}

// Global 401 handler - DISABLED FOR DEVELOPMENT
function handleUnauthorized() {
  // Do nothing during development - no login required
  console.log('Auth disabled for development');
}

// Enhanced fetch - TEMPORARILY DISABLED AUTH FOR DEVELOPMENT
async function fetchWithAuth(url, options = {}) {
  // No auth headers during development
  let response = await fetch(url, options);
  return response;
}

// Like a poem
async function likePoem(poemId) {
  try {
    const response = await fetch(`${API_BASE_URL}/poems/${poemId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to like poem');
    }

    return await response.json();
  } catch (error) {
    console.error('Error liking poem:', error);
    throw error;
  }
}

// Unlike a poem
async function unlikePoem(poemId) {
  try {
    const response = await fetch(`${API_BASE_URL}/poems/${poemId}/unlike`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to unlike poem');
    }

    return await response.json();
  } catch (error) {
    console.error('Error unliking poem:', error);
    throw error;
  }
}

// Bookmark a poem
async function bookmarkPoem(poemId) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/bookmark/${poemId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to bookmark poem');
    }

    return await response.json();
  } catch (error) {
    console.error('Error bookmarking poem:', error);
    throw error;
  }
}

// Unbookmark a poem
async function unbookmarkPoem(poemId) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/unbookmark/${poemId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to unbookmark poem');
    }

    return await response.json();
  } catch (error) {
    console.error('Error unbookmarking poem:', error);
    throw error;
  }
}

// Get user's liked poems
async function getLikedPoems(page = 1, limit = 100) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/likes?page=${page}&limit=${limit}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get liked poems');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting liked poems:', error);
    throw error;
  }
}

// Get user's bookmarked poems
async function getBookmarkedPoems(page = 1, limit = 100) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/bookmarks?page=${page}&limit=${limit}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get bookmarked poems');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting bookmarked poems:', error);
    throw error;
  }
}

// Store user's liked and bookmarked poems in memory for quick access
let userLikedPoems = new Set();
let userBookmarkedPoems = new Set();

// Load user's likes and bookmarks from API
async function loadUserInteractions() {
  if (!isAuthenticated()) {
    return;
  }

  try {
    // Load liked poems
    const likedResult = await getLikedPoems();
    if (likedResult.success && likedResult.poems) {
      userLikedPoems = new Set(likedResult.poems.map(poem => poem._id));
    }

    // Load bookmarked poems
    const bookmarkedResult = await getBookmarkedPoems();
    if (bookmarkedResult.success && bookmarkedResult.poems) {
      userBookmarkedPoems = new Set(bookmarkedResult.poems.map(poem => poem._id));
    }
  } catch (error) {
    console.error('Error loading user interactions:', error);
  }
}

// Check if poem is liked
function isPoemLiked(poemId) {
  return userLikedPoems.has(poemId);
}

// Check if poem is bookmarked
function isPoemBookmarked(poemId) {
  return userBookmarkedPoems.has(poemId);
}

// Add poem to liked set
function addLikedPoem(poemId) {
  userLikedPoems.add(poemId);
}

// Remove poem from liked set
function removeLikedPoem(poemId) {
  userLikedPoems.delete(poemId);
}

// Add poem to bookmarked set
function addBookmarkedPoem(poemId) {
  userBookmarkedPoems.add(poemId);
}

// Remove poem from bookmarked set
function removeBookmarkedPoem(poemId) {
  userBookmarkedPoems.delete(poemId);
}

// Add a comment to a poem
async function addComment(poemId, text) {
  try {
    const response = await fetch(`${API_BASE_URL}/poems/${poemId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add comment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}
