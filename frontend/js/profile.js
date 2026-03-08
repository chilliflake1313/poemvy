// Profile Page JavaScript
const API_URL = 'http://localhost:5000/api';

// Extract username from URL
function getUsernameFromURL() {
  const path = window.location.pathname;
  // Support both /@username and /profile.html?username=... formats
  if (path.startsWith('/@')) {
    return path.replace('/@', '');
  }
  // Fallback to query parameter
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('username');
}

// Get current user ID from localStorage
function getCurrentUserId() {
  try {
    const userRaw = localStorage.getItem('user');
    if (!userRaw) return null;
    const user = JSON.parse(userRaw);
    return user?._id || user?.id || null;
  } catch (error) {
    return null;
  }
}

// Fetch user profile
async function loadUserProfile() {
  const username = getUsernameFromURL();
  
  if (!username) {
    document.getElementById('profile-content').innerHTML = '<div class="error">No username provided</div>';
    return;
  }

  try {
    const accessToken = localStorage.getItem('accessToken');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_URL}/user/profile/${username}`, {
      headers
    });

    if (!response.ok) {
      throw new Error('User not found');
    }

    const data = await response.json();
    displayProfile(data.user, data.isFollowing);
    loadUserPoems(username);
  } catch (error) {
    console.error('Error loading profile:', error);
    document.getElementById('profile-content').innerHTML = 
      `<div class="error">Error: ${error.message}</div>`;
  }
}

// Display profile information
function displayProfile(user, isFollowing) {
  // Update page title
  document.title = `${user.name || user.username} – Poemvy`;

  // Update profile name
  const profileName = document.getElementById('profile-name');
  if (profileName) {
    profileName.textContent = user.name || user.username;
  }

  // Update username
  const profileUsername = document.getElementById('profile-username');
  if (profileUsername) {
    profileUsername.textContent = `@${user.username}`;
  }

  // Update bio
  const profileBio = document.getElementById('profile-bio');
  if (profileBio) {
    profileBio.textContent = user.bio || 'No bio yet';
  }

  // Update avatar
  const profileAvatar = document.getElementById('profile-avatar');
  if (profileAvatar) {
    profileAvatar.src = user.avatar || 'https://storage.googleapis.com/banani-avatars/avatar%2Ffemale%2F25-35%2FEuropean%2F2';
  }

  // Update follower/following counts
  const followerCount = document.getElementById('follower-count');
  if (followerCount) {
    followerCount.textContent = user.followerCount || 0;
  }

  const followingCount = document.getElementById('following-count');
  if (followingCount) {
    followingCount.textContent = user.followingCount || 0;
  }

  // Check if viewing own profile
  const currentUserId = getCurrentUserId();
  const isOwnProfile = currentUserId && currentUserId === user._id;
  
  // Store for later use
  window.isOwnProfile = isOwnProfile;
  window.profileUserId = user._id;

  // Update follow button
  const followBtn = document.getElementById('follow-btn');
  if (followBtn) {
    // If viewing own profile, change to "Edit Profile" button
    if (isOwnProfile) {
      followBtn.textContent = 'Edit Profile';
      followBtn.style.display = 'inline-block';
      followBtn.classList.remove('following');
      followBtn.onclick = () => {
        window.location.href = 'account.html';
      };
    } else {
      followBtn.style.display = 'inline-block';
      followBtn.classList.toggle('following', isFollowing);
      followBtn.textContent = isFollowing ? 'Following' : 'Follow';
      followBtn.onclick = () => toggleFollow(user._id, isFollowing);
    }
  }
}

// Load user's poems
async function loadUserPoems(username) {
  try {
    const response = await fetch(`${API_URL}/poems/user/${username}`);
    
    if (!response.ok) {
      throw new Error('Failed to load poems');
    }

    const data = await response.json();
    displayUserPoems(data.poems);
  } catch (error) {
    console.error('Error loading poems:', error);
    const poemsContainer = document.getElementById('user-poems');
    if (poemsContainer) {
      poemsContainer.innerHTML = '<div class="error">Failed to load poems</div>';
    }
  }
}

// Display user's poems
function displayUserPoems(poems) {
  const poemsContainer = document.getElementById('user-poems');
  
  if (!poemsContainer) return;

  // Update poem count
  const poemCount = document.getElementById('poem-count');
  if (poemCount) {
    poemCount.textContent = poems.length;
  }

  if (!poems || poems.length === 0) {
    poemsContainer.innerHTML = '<div class="no-poems">No poems yet</div>';
    return;
  }

  const currentUserId = getCurrentUserId();

  poemsContainer.innerHTML = poems.map(poem => {
    const poemTags = extractTagsForDisplay(poem);
    const tagsText = poemTags.length > 0
      ? poemTags.map((tag) => `#${tag}`).join(' ')
      : '';

    const createdDate = new Date(poem.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - createdDate);
    const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const dateStr = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo}d ago`;
    
    const likesCount = poem.likes ? poem.likes.length : 0;
    const commentsCount = poem.comments ? poem.comments.length : 0;
    const readCount = poem.readCount || 0;
    const isLikedByCurrentUser = hasUserLikedPoem(poem, currentUserId);
    
    // Add edit/delete buttons if viewing own profile
    const ownerActions = window.isOwnProfile ? `
      <div class="poem-interaction" style="margin-left: auto;">
        <button onclick="editPoem('${poem._id}')" style="padding: 6px 16px; background: #000; color: #fff; border: none; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: 500; margin-right: 8px;">Edit</button>
        <button onclick="deletePoem('${poem._id}')" style="padding: 6px 16px; background: transparent; color: #dc2626; border: 1px solid #dc2626; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: 500;">Delete</button>
      </div>
    ` : '';
    
    return `
      <article class="poem-card" data-poem-id="${poem._id}">
        <!-- Left Sidebar -->
        <aside class="poem-sidebar">
          <div class="poem-author-section">
            <img
              src="${escapeHtml(poem.author?.avatar || 'https://storage.googleapis.com/banani-avatars/avatar%2Ffemale%2F25-35%2FEuropean%2F2')}"
              class="author-avatar"
              alt="Author Avatar"
            />
            <div class="poem-author-label">WRITTEN BY</div>
            <a href="profile.html?username=${escapeHtml(poem.author?.username || 'anonymous')}" class="poem-author-name">${escapeHtml(poem.author?.username || 'Anonymous')}</a>
            <div class="poem-author-subtitle">${escapeHtml(poem.author?.bio || '')}</div>
            ${window.isOwnProfile ? '' : '<button class="poem-follow-btn">Follow</button>'}
          </div>

          <div class="sidebar-divider"></div>

          <div class="poem-meta-section">
            <div class="poem-meta-item">
              <div class="poem-meta-label">PUBLISHED</div>
              <div class="poem-meta-value">${dateStr}</div>
            </div>

            ${tagsText ? `<div class="poem-meta-item">
              <div class="poem-meta-label">TAGS</div>
              <div class="poem-meta-value tag">${tagsText}</div>
            </div>` : ''}
          </div>
        </aside>

        <!-- Right Content -->
        <main class="poem-content-section">
          <h1 class="poem-title">${escapeHtml(normalizePoemTitle(poem.title))}</h1>
          <div class="poem-body">
            ${formatPoemStanzas(poem.content)}
          </div>
          
          <div class="main-divider"></div>

          <div class="poem-footer">
            <div class="poem-interaction like-btn ${isLikedByCurrentUser ? 'liked' : ''}" data-poem-id="${poem._id}" aria-pressed="${isLikedByCurrentUser ? 'true' : 'false'}">
              <div class="action-icon">
                <iconify-icon icon="lucide:heart" style="font-size: 16px; color: var(--muted-foreground)"></iconify-icon>
              </div>
              <span class="poem-interaction-count">${likesCount}</span>
            </div>
            <div class="poem-interaction comment-btn" data-poem-id="${poem._id}">
              <div class="action-icon">
                <iconify-icon icon="lucide:message-circle" style="font-size: 16px; color: var(--muted-foreground)"></iconify-icon>
              </div>
              <span class="poem-interaction-count">${commentsCount}</span>
            </div>
            <div class="poem-interaction read-btn">
              <div class="action-icon">
                <iconify-icon icon="lucide:activity" style="font-size: 16px; color: var(--muted-foreground)"></iconify-icon>
              </div>
              <span class="poem-interaction-count">${readCount}</span>
            </div>
            ${ownerActions}
          </div>
        </main>
      </article>
    `;
  }).join('');
}

// Helper function to normalize poem title
function normalizePoemTitle(title) {
  if (!title) return 'Untitled';
  return String(title)
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to normalize poem body
function normalizePoemBody(content) {
  if (!content) return '';
  return String(content)
    .replace(/\r\n/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/\t/g, '    ')
    .trim();
}

// Helper function to format poem stanzas
function formatPoemStanzas(content) {
  const normalized = normalizePoemBody(content);
  if (!normalized) return '';

  const cleaned = normalized
    .replace(/\(\s+\)/g, '')
    .replace(/\[\s+\]/g, '')
    .replace(/\{\s+\}/g, '')
    .trim();

  if (!cleaned) return '';

  const stanzas = cleaned.split(/\n{2,}/);
  return stanzas
    .map((stanza) => stanza.trim())
    .filter(Boolean)
    .map((stanza) => {
      const lines = stanza
        .split('\n')
        .map((line) => line.trimEnd())
        .filter((line) => line.trim().length > 0)
        .map((line) => escapeHtml(line));

      if (lines.length === 0) return '';
      return `<p class="stanza">${lines.join('<br />')}</p>`;
    })
    .filter(Boolean)
    .join('');
}

// Helper function to extract tags
function extractTagsForDisplay(poem) {
  const storedTags = Array.isArray(poem?.tags)
    ? poem.tags
        .map((tag) => String(tag || '').replace(/^#/, '').trim().toLowerCase())
        .filter(Boolean)
    : [];

  if (storedTags.length > 0) {
    return [...new Set(storedTags)];
  }

  const content = typeof poem?.content === 'string' ? poem.content : '';
  const hashtagMatches = content.match(/#[^\s#]+/g) || [];
  const fallbackTags = hashtagMatches
    .map((tag) => tag.slice(1))
    .map((tag) => tag.replace(/^[^a-zA-Z0-9_]+|[^a-zA-Z0-9_]+$/g, ''))
    .map((tag) => tag.toLowerCase())
    .filter(Boolean);

  return [...new Set(fallbackTags)];
}

// Helper function to check if user liked poem
function hasUserLikedPoem(poem, currentUserId) {
  if (!currentUserId || !Array.isArray(poem?.likes)) {
    return false;
  }

  return poem.likes.some((likeUser) => {
    const likedUserId = typeof likeUser === 'object' ? likeUser?._id : likeUser;
    return String(likedUserId) === String(currentUserId);
  });
}

// Toggle follow/unfollow
async function toggleFollow(userId, currentlyFollowing) {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    alert('Please log in to follow users');
    window.location.href = 'login.html';
    return;
  }

  try {
    const endpoint = currentlyFollowing ? 'unfollow' : 'follow';
    const response = await fetch(`${API_URL}/user/${endpoint}/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to update follow status');
    }

    // Reload profile to get updated follow status
    loadUserProfile();
  } catch (error) {
    console.error('Error toggling follow:', error);
    alert('Failed to update follow status. Please try again.');
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Edit poem function
async function editPoem(poemId) {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    alert('Please log in to edit poems');
    return;
  }

  // Fetch poem data first
  try {
    const response = await fetch(`${API_URL}/poems`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const poems = await response.json();
    const poem = poems.find(p => p._id === poemId);
    
    if (!poem) {
      alert('Poem not found');
      return;
    }

    // Redirect to write page with poem data
    localStorage.setItem('editPoem', JSON.stringify({
      id: poem._id,
      title: poem.title,
      content: poem.content,
      tags: poem.tags || []
    }));
    
    window.location.href = 'write.html';
  } catch (error) {
    console.error('Error fetching poem:', error);
    alert('Failed to load poem for editing');
  }
}

// Delete poem function
async function deletePoem(poemId) {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    alert('Please log in to delete poems');
    return;
  }

  if (!confirm('Are you sure you want to delete this poem? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/poems/${poemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete poem');
    }

    // Reload poems
    const username = getUsernameFromURL();
    loadUserPoems(username);
    
    alert('Poem deleted successfully');
  } catch (error) {
    console.error('Error deleting poem:', error);
    alert('Failed to delete poem. Please try again.');
  }
}

// Tab switching functionality
function initTabSwitching() {
  const tabs = document.querySelectorAll('.profile-tab');
  const poemsContainer = document.getElementById('user-poems');
  const aboutContainer = document.getElementById('about-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Show/hide content based on tab
      const tabText = tab.textContent.trim();
      if (tabText === 'Poems') {
        if (poemsContainer) poemsContainer.style.display = 'block';
        if (aboutContainer) aboutContainer.style.display = 'none';
      } else if (tabText === 'About') {
        if (poemsContainer) poemsContainer.style.display = 'none';
        if (aboutContainer) aboutContainer.style.display = 'block';
        loadAboutSection();
      }
    });
  });
}

// Load About section
function loadAboutSection() {
  const aboutContainer = document.getElementById('about-content');
  if (!aboutContainer) return;

  const profileBio = document.getElementById('profile-bio');
  const bio = profileBio ? profileBio.textContent : 'No bio yet';

  if (window.isOwnProfile) {
    // Show editable bio for own profile
    aboutContainer.innerHTML = `
      <div style="padding: 24px; background: #fff; border-radius: 16px; border: 1px solid #e5e5e5;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">About</h3>
        <textarea id="bio-edit" style="width: 100%; min-height: 120px; padding: 12px; border: 1px solid #e5e5e5; border-radius: 12px; font-family: inherit; font-size: 14px; resize: vertical;">${bio}</textarea>
        <button onclick="saveBio()" style="margin-top: 12px; padding: 8px 20px; background: #000; color: #fff; border: none; border-radius: 20px; cursor: pointer; font-size: 14px; font-weight: 500;">Save Bio</button>
      </div>
    `;
  } else {
    // Show read-only bio for other profiles
    aboutContainer.innerHTML = `
      <div style="padding: 24px; background: #fff; border-radius: 16px; border: 1px solid #e5e5e5;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">About</h3>
        <p style="margin: 0; color: #333; line-height: 1.6;">${bio}</p>
      </div>
    `;
  }
}

// Save bio function
async function saveBio() {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    alert('Please log in to update bio');
    return;
  }

  const bioEdit = document.getElementById('bio-edit');
  if (!bioEdit) return;

  const newBio = bioEdit.value.trim();

  try {
    const response = await fetch(`${API_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ bio: newBio })
    });

    if (!response.ok) {
      throw new Error('Failed to update bio');
    }

    // Update bio display
    const profileBio = document.getElementById('profile-bio');
    if (profileBio) {
      profileBio.textContent = newBio || 'No bio yet';
    }

    alert('Bio updated successfully');
  } catch (error) {
    console.error('Error updating bio:', error);
    alert('Failed to update bio. Please try again.');
  }
}

// Make functions globally available
window.editPoem = editPoem;
window.deletePoem = deletePoem;
window.saveBio = saveBio;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();
  initTabSwitching();
});
