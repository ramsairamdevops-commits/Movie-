// Reel Search - Movie search app
// Replace with your real key from https://www.omdbapi.com/apikey.aspx
const API_KEY = "your_omdb_api_key_here";   // ← CHANGE THIS LINE !!!
const BASE_URL = "https://www.omdbapi.com/";

const elements = {
  movieQuery: document.getElementById("movieQuery"),
  searchBtn: document.getElementById("searchBtn"),
  loading: document.getElementById("loading"),
  error: document.getElementById("error"),
  resultsSection: document.getElementById("resultsSection"),
  resultsHeading: document.getElementById("resultsHeading"),
  resultsGrid: document.getElementById("resultsGrid"),
  pagination: document.getElementById("pagination"),
  detailSection: document.getElementById("detailSection"),
  backBtn: document.getElementById("backBtn"),
  detailContent: document.getElementById("detailContent"),
  watchlistSection: document.getElementById("watchlistSection"),
  watchlistGrid: document.getElementById("watchlistGrid"),
  watchlistEmpty: document.getElementById("watchlistEmpty"),
  emptyState: document.getElementById("emptyState")
};

let currentPage = 1;
let lastQuery = "";

function showLoading(show) {
  elements.loading.classList.toggle("hidden", !show);
}

function showError(msg) {
  elements.error.textContent = msg;
  elements.error.classList.remove("hidden");
}

function hideError() {
  elements.error.classList.add("hidden");
}

function showSection(sectionId) {
  document.querySelectorAll('.panel').forEach(el => el.classList.add('hidden'));
  document.getElementById(sectionId)?.classList.remove('hidden');
}

async function searchMovies() {
  const query = elements.movieQuery.value.trim();
  if (!query) return showError("Please enter a movie name");

  if (API_KEY === "your_omdb_api_key_here") {
    return showError("Please add your real OMDb API key in app.js");
  }

  showLoading(true);
  hideError();
  showSection("resultsSection");

  try {
    const url = `\( {BASE_URL}?apikey= \){API_KEY}&s=\( {encodeURIComponent(query)}&page= \){currentPage}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.Response === "False") {
      showError(data.Error || "No results found");
      showSection("emptyState");
      return;
    }

    elements.resultsHeading.textContent = `Results for "\( {query}" ( \){data.totalResults} found)`;
    renderResults(data.Search || []);
  } catch (err) {
    showError("Network error or invalid API key");
    console.error(err);
  } finally {
    showLoading(false);
  }
}

function renderResults(movies) {
  elements.resultsGrid.innerHTML = movies.map(m => `
    <div class="movie-card" data-id="${m.imdbID}">
      \( {m.Poster !== "N/A" ? `<img src=" \){m.Poster}" alt="${m.Title}">` : '<div class="no-poster">No Poster</div>'}
      <h3>${m.Title}</h3>
      <p>${m.Year} • ${m.Type}</p>
    </div>
  `).join("");

  elements.resultsGrid.querySelectorAll(".movie-card").forEach(card => {
    card.addEventListener("click", () => showMovieDetail(card.dataset.id));
  });
}

async function showMovieDetail(id) {
  showLoading(true);
  showSection("detailSection");

  try {
    const url = `\( {BASE_URL}?apikey= \){API_KEY}&i=${id}&plot=full`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.Response === "False") {
      showError(data.Error);
      return;
    }

    const actors = data.Actors?.split(", ") || [];
    const hero = actors[0] || "—";
    const heroine = actors[1] || "—";

    elements.detailContent.innerHTML = `
      <div class="detail-header">
        \( {data.Poster !== "N/A" ? `<img src=" \){data.Poster}" class="detail-poster">` : '<div class="no-poster big">No Poster</div>'}
        <div>
          <h1>\( {data.Title} ( \){data.Year})</h1>
          <p>${data.Runtime} • ${data.Genre} • ${data.Rated}</p>
          <p><strong>IMDb:</strong> ${data.imdbRating || "—"} / 10</p>
        </div>
      </div>

      <p><strong>Plot:</strong> ${data.Plot || "No plot available"}</p>

      <div class="cast-section">
        <h3>Cast & Crew</h3>
        <p><strong>Director:</strong> ${data.Director || "—"}</p>
        <p><strong>Hero / Lead:</strong> ${hero}</p>
        <p><strong>Heroine / Lead Actress:</strong> ${heroine}</p>
        <p><strong>Main Cast:</strong> ${actors.slice(0,4).join(", ") || "—"}</p>
        <p><strong>Full Cast:</strong> ${data.Actors || "—"}</p>
        <p><strong>Writer:</strong> ${data.Writer || "—"}</p>
      </div>

      <p><strong>Language:</strong> ${data.Language || "—"} • <strong>Country:</strong> ${data.Country || "—"}</p>
      <p><strong>Awards:</strong> ${data.Awards || "None listed"}</p>
      <p><strong>Box Office:</strong> ${data.BoxOffice || "Not available"}</p>
    `;
  } catch (err) {
    showError("Could not load movie details");
    console.error(err);
  } finally {
    showLoading(false);
  }
}

elements.searchBtn.addEventListener("click", searchMovies);
elements.movieQuery.addEventListener("keypress", e => {
  if (e.key === "Enter") searchMovies();
});

elements.backBtn.addEventListener("click", () => {
  showSection("resultsSection");
});
