const username = "AlirezaR32";

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function safeURL(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

async function loadProjects() {
  const container = document.getElementById("projectsGrid");
  if (!container) return;

  container.innerHTML = `
    <div class="proj-card reveal vis">
      <div class="proj-id">LOADING</div>
      <div class="proj-name">Fetching GitHub projects...</div>
      <div class="proj-desc">Connecting to github.com/${username}</div>
    </div>
  `;

  try {
    const res = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=6`,
    );

    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}`);
    }

    const repos = await res.json();
    container.innerHTML = "";

    if (!repos.length) {
      container.innerHTML = `
        <div class="proj-card reveal vis">
          <div class="proj-id">NO_REPOS</div>
          <div class="proj-name">No public repositories found</div>
          <div class="proj-desc">Public GitHub repositories will appear here automatically.</div>
        </div>
      `;
      return;
    }

    repos.forEach((repo, index) => {
      const tags = repo.language ? [repo.language] : [];
      const repoURL = safeURL(repo.html_url);
      const homepageURL = safeURL(repo.homepage);

      const card = document.createElement("div");
      card.className = "proj-card reveal vis";

      card.innerHTML = `
        <div class="proj-id">PROJECT_${String(index + 1).padStart(3, "0")}</div>
        <div class="proj-name">${escapeHTML(repo.name)}</div>
        <div class="proj-desc">${escapeHTML(repo.description || "No description provided.")}</div>

        <div class="proj-tags">
          ${tags.map((t) => `<span class="proj-tag">${escapeHTML(t)}</span>`).join("")}
        </div>

        <div class="proj-links">
          ${repoURL ? `<a class="proj-link" href="${repoURL}" target="_blank" rel="noreferrer">⌥ GitHub</a>` : ""}
          ${homepageURL ? `<a class="proj-link" href="${homepageURL}" target="_blank" rel="noreferrer">⬢ Live</a>` : ""}
        </div>
      `;

      container.appendChild(card);
    });
  } catch (error) {
    container.innerHTML = `
      <div class="proj-card reveal vis">
        <div class="proj-id">GITHUB_ERROR</div>
        <div class="proj-name">Could not load GitHub projects</div>
        <div class="proj-desc">${error.message}. Check your internet connection or GitHub API rate limit.</div>
        <div class="proj-links">
          <a class="proj-link" href="https://github.com/${username}" target="_blank" rel="noreferrer">⌥ GitHub Profile</a>
        </div>
      </div>
    `;
  }
}

loadProjects();
