// Reel Search - Movie Finder App (fixed version)
// IMPORTANT: Replace the line below with YOUR REAL OMDb API key
// Get free key: https://www.omdbapi.com/apikey.aspx
const API_KEY = "your_real_api_key_here";   // ← CHANGE THIS !!!

const BASE_URL = "https://www.omdbapi.com/";

const elements = {
  movieQuery: document.getElementById("movie-query"),
  searchBtn: document.getElementById("search-btn"),
  loading: document.getElementById("loading"),
  errorMessage: document.getElementById("error-message"),
  resultsSection: document.getElementById("results-section"),
  resultsTitle: document.getElementById("results-title"),
  resultsGrid: document.getElementById("results-grid"),
  detailSection: document.getElementById("detail-section"),
  backBtn: document.getElementById("back-btn"),
  detailContent: document.getElementById("detail-content"),
  emptyState: document.getElementById("empty-state")
};

function showLoading(show) {
  elements.loading.classList.toggle("hidden", !show);
}

function showError(msg) {
  elements.errorMessage.textContent = msg;
  elements.errorMessage.classList.remove("hidden");
}

function hideError() {
  elements.errorMessage.classList.add("hidden");
}

function showView(viewId) {
  document.querySelectorAll('section[id$="-section"]').forEach(sec => sec.classList.add("hidden"));
  document.getElementById(viewId)?.classList.remove("hidden");
}

async function searchMovies() {
  const query = elements.movieQuery.value.trim();
  if (!query) {
    showError("Please enter a movie title");
    return;
  }

  if (API_KEY === "your_real_api_key_here" || API_KEY === "your_omdb_api_key_here") {
    showError("Please add your real OMDb API key in app.js (line 4)");
    return;
  }

  showLoading(true);
  hideError();
  showView("results-section");

  try {
    const url = `\( {BASE_URL}?apikey= \){API_KEY}&s=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.Response === "False") {
      showError(data.Error || "No movies found");
      showView("empty-state");
      return;
    }

    elements.resultsTitle.textContent = `Results for "${query}"`;
    renderResults(data.Search || []);
  } catch (err) {
    showError("Failed to load results. Check internet or API key.");
    console.error(err);
  } finally {
    showLoading(false);
  }
}

function renderResults(movies) {
  elements.resultsGrid.innerHTML = movies.map(movie => `
    <div class="movie-card" onclick="showDetail('${movie.imdbID}')">
      ${movie.Poster !== "N/A" 
        ? `<img src="\( {movie.Poster}" alt=" \){movie.Title}">` 
        : '<div class="no-poster">No Poster</div>'}
      <div class="card-info">
        <h3>${movie.Title}</h3>
        <p>${movie.Year} • ${movie.Type}</p>
      </div>
    </div>
  `).join("");
}

async function showDetail(imdbID) {
  showLoading(true);
  showView("detail-section");

  try {
    const url = `\( {BASE_URL}?apikey= \){API_KEY}&i=${imdbID}&plot=full`;
    const response = await fetch(url);
    const movie = await response.json();

    if (movie.Response === "False") {
      showError(movie.Error || "Movie not found");
      return;
    }

    const actors = movie.Actors?.split(", ") || [];
    const hero = actors[0] || "—";
    const heroine = actors[1] || "—";

    elements.detailContent.innerHTML = `
      <div class="detail-poster">
        ${movie.Poster !== "N/A" 
          ? `<img src="\( {movie.Poster}" alt=" \){movie.Title}">` 
          : '<div class="no-poster large">No Poster</div>'}
      </div>

      <div class="detail-body">
        <h1>\( {movie.Title} ( \){movie.Year})</h1>
        <p class="meta">${movie.Runtime} • ${movie.Genre} • Rated ${movie.Rated || "N/A"}</p>
        
        <p><strong>IMDb:</strong> ${movie.imdbRating || "N/A"} / 10</p>
        
        <p class="plot"><strong>Plot:</strong> ${movie.Plot || "No plot available."}</p>
        
        <div class="cast-info">
          <h3>Cast & Crew</h3>
          <p><strong>Director:</strong> ${movie.Director || "—"}</p>
          <p><strong>Hero / Lead:</strong> ${hero}</p>
          <p><strong>Heroine / Lead Actress:</strong> ${heroine}</p>
          <p><strong>Writer:</strong> ${movie.Writer || "—"}</p>
          <p><strong>Actors:</strong> ${movie.Actors || "—"}</p>
        </div>

        <p><strong>Language:</strong> ${movie.Language || "—"}</p>
        <p><strong>Awards:</strong> ${movie.Awards || "None listed"}</p>
      </div>
    `;
  } catch (err) {
    showError("Could not load movie details");
    console.error(err);
  } finally {
    showLoading(false);
  }
}

// Event listeners
elements.searchBtn.addEventListener("click", searchMovies);

elements.movieQuery.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchMovies();
  }
});

elements.backBtn.addEventListener("click", () => {
  showView("results-section");
});

// Initial view
showView("search-section");
