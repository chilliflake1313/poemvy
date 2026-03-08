const API_URL = "http://localhost:5000/api";

const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const publishBtn = document.getElementById("publishBtn");

// Check if editing a poem
let editingPoemId = null;

document.addEventListener('DOMContentLoaded', () => {
  const editPoemData = localStorage.getItem('editPoem');
  
  if (editPoemData) {
    try {
      const poem = JSON.parse(editPoemData);
      editingPoemId = poem.id;
      
      // Pre-fill form
      if (titleInput) titleInput.value = poem.title;
      if (contentInput) contentInput.textContent = poem.content;
      
      // Change button text
      if (publishBtn) publishBtn.textContent = 'Update Poem';
      
      // Clear localStorage
      localStorage.removeItem('editPoem');
    } catch (error) {
      console.error('Error loading poem for editing:', error);
    }
  }
});

// Publish or update poem
const publishPoem = async () => {
  const title = titleInput.value.trim();
  const content = contentInput.textContent.trim();

  if (!title || !content) {
    alert("Title and content are required.");
    return;
  }

  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    alert('Please log in to publish poems');
    window.location.href = 'login.html';
    return;
  }

  try {
    publishBtn.disabled = true;
    publishBtn.textContent = editingPoemId ? "Updating..." : "Publishing...";

    const url = editingPoemId 
      ? `${API_URL}/poems/${editingPoemId}` 
      : `${API_URL}/poems`;
    
    const method = editingPoemId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({ title, content })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Failed to ${editingPoemId ? 'update' : 'publish'}`);
    }

    alert(editingPoemId ? "Poem updated!" : "Poem published!");
    
    // Clear form
    titleInput.value = "";
    contentInput.textContent = "";
    const wasEditing = editingPoemId;
    editingPoemId = null;
    
    // Redirect to profile if edited, feed if new
    if (wasEditing) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      window.location.href = `profile.html?username=${user.username}`;
    } else {
      window.location.href = "index.html";
    }

  } catch (err) {
    console.error(err);
    alert(err.message);
  } finally {
    publishBtn.disabled = false;
    publishBtn.textContent = editingPoemId ? "Update Poem" : "Publish";
  }
};

if (publishBtn) {
  publishBtn.addEventListener("click", publishPoem);
}
