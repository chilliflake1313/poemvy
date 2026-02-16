// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Token management
function getAuthToken() {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    console.log('[AUTH TOKEN CHECK] ❌ NO TOKEN FOUND');
    return null;
  }
  
  // Check if token is expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = Date.now() > payload.exp * 1000;
    
    if (isExpired) {
      console.error('[AUTH TOKEN CHECK] ❌ TOKEN EXPIRED at', new Date(payload.exp * 1000).toLocaleString());
      console.log('Attempting to refresh token...');
      // Token is expired, but return it anyway - let the refresh logic handle it
      // Or we could trigger a refresh here
    } else {
      const expiresIn = Math.floor((payload.exp * 1000 - Date.now()) / 1000 / 60);
      console.log('[AUTH TOKEN CHECK] ✅ Token valid, expires in', expiresIn, 'minutes');
    }
  } catch (e) {
    console.warn('[AUTH TOKEN CHECK] ⚠️ Could not decode token:', e.message);
  }
  
  return token;
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

// Check if user is authenticated
function isAuthenticated() {
  return !!getAuthToken();
}

// Debug helper - call from console to check auth status
function debugAuthStatus() {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const user = localStorage.getItem('user');
  
  console.log('=== AUTH STATUS DEBUG ===');
  console.log('Access Token:', accessToken ? `EXISTS (${accessToken.length} chars)` : '❌ MISSING');
  console.log('Refresh Token:', refreshToken ? `EXISTS (${refreshToken.length} chars)` : '❌ MISSING');
  console.log('User Data:', user ? JSON.parse(user) : '❌ MISSING');
  console.log('Is Authenticated:', !!accessToken);
  
  if (accessToken) {
    console.log('Token Preview:', accessToken.substring(0, 30) + '...');
    
    // Try to decode JWT (basic check, doesn't validate signature)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      console.log('Token Payload:', payload);
      console.log('Token Expiry:', new Date(payload.exp * 1000).toLocaleString());
      console.log('Token Expired:', Date.now() > payload.exp * 1000);
    } catch (e) {
      console.error('Failed to decode token:', e);
    }
  }
  
  console.log('========================');
  return {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    hasUser: !!user,
    isAuthenticated: !!accessToken
  };
}

// Make debugAuthStatus available globally for console access
window.debugAuthStatus = debugAuthStatus;


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

// Global 401 handler - Force logout
function handleUnauthorized() {
  clearTokens();
  // Redirect to login if not already there
  if (!window.location.href.includes('login.html')) {
    window.location.href = 'login.html';
  }
}

// Enhanced fetch with automatic token refresh
async function fetchWithAuth(url, options = {}) {
  // Add auth header
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${getAuthToken()}`
  };

  let response = await fetch(url, options);

  // Handle 401 - Try to refresh token
  if (response.status === 401) {
    try {
      // Try refreshing the token
      await refreshAccessToken();
      
      // Retry original request with new token
      options.headers['Authorization'] = `Bearer ${getAuthToken()}`;
      response = await fetch(url, options);
      
      // If still 401, force logout
      if (response.status === 401) {
        handleUnauthorized();
      }
    } catch (error) {
      handleUnauthorized();
      throw error;
    }
  }

  return response;
}

// Like a poem
async function likePoem(poemId) {
  try {
    const response = await fetch(`${API_BASE_URL}/poems/${poemId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
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
        'Authorization': `Bearer ${getAuthToken()}`,
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
        'Authorization': `Bearer ${getAuthToken()}`,
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
        'Authorization': `Bearer ${getAuthToken()}`,
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
        'Authorization': `Bearer ${getAuthToken()}`
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
        'Authorization': `Bearer ${getAuthToken()}`
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
        'Authorization': `Bearer ${getAuthToken()}`,
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

// Save or update draft
async function saveDraft(title, content) {
  try {
    const token = getAuthToken();
    
    if (!token) {
      console.error('[SAVE DRAFT] ❌ NO TOKEN - User must be logged in');
      throw new Error('You must be logged in to save drafts');
    }
    
    console.log('[SAVE DRAFT] Request details:', {
      url: `${API_BASE_URL}/poems/draft`,
      method: 'PUT',
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'NONE',
      title: title,
      contentLength: content?.length || 0
    });

    const response = await fetch(`${API_BASE_URL}/poems/draft`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, content })
    });

    console.log('[SAVE DRAFT] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[SAVE DRAFT] Failed:', response.status, errorData);
      throw new Error(`Failed to save draft: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[SAVE DRAFT] Success:', result);
    return result;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
}

// Get latest draft
async function getDraft() {
  try {
    const response = await fetch(`${API_BASE_URL}/poems/draft`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get draft');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting draft:', error);
    throw error;
  }
}

// Publish draft
async function publishDraft(poemId) {
  try {
    const token = getAuthToken();
    
    if (!token) {
      console.error('[PUBLISH DRAFT] ❌ NO TOKEN - User must be logged in');
      throw new Error('You must be logged in to publish poems');
    }
    
    console.log('[PUBLISH DRAFT] Request details:', {
      url: `${API_BASE_URL}/poems/${poemId}/publish`,
      method: 'PUT',
      poemId: poemId,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'NONE'
    });

    const response = await fetch(`${API_BASE_URL}/poems/${poemId}/publish`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('[PUBLISH DRAFT] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[PUBLISH DRAFT] Failed:', response.status, errorData);
      throw new Error(`Failed to publish poem: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[PUBLISH DRAFT] Success:', result);
    return result;
  } catch (error) {
    console.error('Error publishing poem:', error);
    throw error;
  }
}
