console.log("APP LOADED - app.js:1");
// Only feed logic for index page
document.addEventListener('DOMContentLoaded', () => {
  loadFeed();
});

async function loadFeed() {
  const container = document.getElementById('poemFeed');
  if (!container) return;
  try {
    const response = await fetch('http://localhost:5000/api/poems/feed?page=1&limit=10');
    if (!response.ok) {
      container.innerHTML = '<div>Failed to load poems.</div>';
      return;
    }
    const data = await response.json();
    const poems = Array.isArray(data.poems) ? data.poems : [];
    if (!poems.length) {
      container.innerHTML = '<div>No poems yet.</div>';
      return;
    }
    container.innerHTML = poems.map(poem => {
      const title = poem.title ? `<h2>${escapeHtml(poem.title)}</h2>` : '';
      const content = poem.content ? `<div class="poem-content">${escapeHtml(poem.content).replace(/\n/g, '<br>')}</div>` : '';
      const author = poem.author && poem.author.username ? poem.author.username : 'Unknown';
      const createdAt = poem.createdAt ? new Date(poem.createdAt).toLocaleString() : '';
      return `<article class="poem-card">
        ${title}
        ${content}
        <div class="poem-meta">By <span class="poem-author">${escapeHtml(author)}</span> <span class="poem-date">${escapeHtml(createdAt)}</span></div>
      </article>`;
    }).join('');
  } catch (e) {
    container.innerHTML = '<div>Failed to load poems.</div>';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
