const API_URL = "http://localhost:5000/api";

const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const publishBtn = document.getElementById("publishBtn");

// Publish poem
const publishPoem = async () => {
  const title = titleInput.value.trim();
  const content = contentInput.textContent.trim(); // ✅ Use textContent, not innerHTML

  if (!title || !content) {
    alert("Title and content are required.");
    return;
  }

  try {
    publishBtn.disabled = true;
    publishBtn.textContent = "Publishing...";

    const res = await fetch(`${API_URL}/poems`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title, content })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to publish");
    }

    alert("Poem published!");
    
    // Clear form
    titleInput.value = "";
    contentInput.textContent = "";
    
    // Redirect to feed
    window.location.href = "index.html";

  } catch (err) {
    console.error(err);
    alert(err.message);
  } finally {
    publishBtn.disabled = false;
    publishBtn.textContent = "Publish";
  }
};

if (publishBtn) {
  publishBtn.addEventListener("click", publishPoem);
