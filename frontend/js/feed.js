const API_URL = "http://localhost:5000/api";
const feedContainer = document.getElementById("feedContainer");

const loadFeed = async () => {
  try {
    if (!feedContainer) {
      console.error("feedContainer not found");
      return;
    }

    feedContainer.innerHTML = "<p>Loading poems...</p>";

    const res = await fetch(`${API_URL}/poems`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to load feed");
    }

    renderPoems(data.poems);

  } catch (error) {
    console.error("Feed error:", error);
    feedContainer.innerHTML = `<p style="color: red;">Failed to load poems</p>`;
  }
};

const renderPoems = (poems) => {
  if (!poems || poems.length === 0) {
    feedContainer.innerHTML = "<p>No poems yet. Be the first to write!</p>";
    return;
  }

  feedContainer.innerHTML = "";

  poems.forEach(poem => {
    const card = document.createElement("div");
    card.className = "poem-card";

    // Create title
    const title = document.createElement("h2");
    title.className = "poem-title";
    title.textContent = poem.title;

    // Create body - CRITICAL: use textContent + pre-wrap
    const body = document.createElement("div");
    body.className = "poem-body";
    body.textContent = poem.content; // ✅ Preserves line breaks

    // Create meta
    const meta = document.createElement("div");
    meta.className = "poem-meta";
    const date = new Date(poem.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    meta.textContent = `by ${poem.author?.username || 'Anonymous'} • ${date}`;

    // Assemble card
    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(meta);

    feedContainer.appendChild(card);
  });
};

document.addEventListener("DOMContentLoaded", loadFeed);
