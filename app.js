// Reel Search — Movie search app (client-side only)
// Get free OMDb key: https://www.omdbapi.com/apikey.aspx

const API_KEY = "your_omdb_api_key_here";  // ← PASTE YOUR REAL KEY HERE!
const BASE_URL = "https://www.omdbapi.com/";
const WATCHLIST_KEY = "reel-search-watchlist";

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
  watchlistCount: document.getElementById("watchlistCount"),
  watchlistCountLabel: document.getElementById("watchlistCountLabel"),
  searchSection: document.getElementById("searchSection"),
  emptyState: document.getElementById("emptyState"),
};

let currentPage = 1;
let totalPages = 1;
let lastQuery = "";
let detailOpenedFrom = "search";

// ─── Watchlist (localStorage) ────────────────────────────────────────────────
function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || [];
  } catch {
    return [];
  }
}

function setWatchlist(list) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
  updateWatchlistCount();
}

function isInWatchlist(imdbId) {
  return getWatchlist().some(item => item.imdbID === imdbId);
}

function addToWatchlist(item) {
  const list = getWatchlist();
  if (list.some(i => i.imdbID === item.imdbID)) return;
  list.push({
    imdbID: item.imdbID,
    Title: item.Title,
    Year: item.Year,
    Type: item.Type,
    Poster: item.Poster
  });
  setWatchlist(list);
}

function removeFromWatchlist(imdbId) {
  setWatchlist(getWatchlist().filter(i => i.imdbID !== imdbId));
}

function updateWatchlistCount() {
  const n = getWatchlist().length;
  elements.watchlistCount?.textContent = n;
  elements.watchlistCountLabel.textContent = n ? `\( {n} title \){n !== 1 ? "s" : ""}` : "";
}

// ─── UI Helpers ──────────────────────────────────────────────────────────────
function showLoading(show) {
  elements.loading?.classList.toggle("hidden", !show);
  elements.searchBtn.disabled = show;
}

function showError(message) {
  elements.error.textContent = message;
  elements.error.classList.remove("hidden");
}

function hideError() {
  elements.error?.classList.add("hidden");
}

function showEmptyState(show) {
  elements.emptyState.style.display = show ? "block" : "none";
}

function showResults(show) {
  elements.resultsSection?.classList.toggle("hidden", !show);
}

function showDetail(show) {
  elements.detailSection?.classList.toggle("hidden", !show);
}

function showWatchlist(show) {
  elements.watchlistSection?.classList.toggle("hidden", !show);
}

// ─── API ─────────────────────────────────────────────────────────────────────
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Network error");
  return res.json();
}

function buildSearchUrl(query, page = 1) {
  return `\( {BASE_URL}?apikey= \){API_KEY}&s=\( {encodeURIComponent(query)}&page= \){page}`;
}

function buildDetailUrl(id) {
  return `\( {BASE_URL}?apikey= \){API_KEY}&i=${id}&plot=full`;
}

// ─── Search ──────────────────────────────────────────────────────────────────
async function searchMovies(query, page = 1) {
  if (API_KEY === "your_omdb_api_key_here") {
    showError("Please add your real OMDb API key in app.js");
    return;
  }
  if (!query.trim()) {
    showError("Please enter a movie title");
    return;
  }

  hideError();
  showLoading(true);
  showResults(false);
  showDetail(false);
  showWatchlist(false);
  lastQuery = query;
  currentPage = page;

  try {
    const data = await fetchJson(buildSearchUrl(query, page));

    if (data.Response === "False") {
      showError(data.Error || "No results found");
      showEmptyState(true);
      return;
    }

    totalPages = Math.ceil(data.totalResults / 10);
    renderResults(data.Search || []);
    renderPagination();
    showResults(true);
    showEmptyState(false);
  } catch (err) {
    showError("Something went wrong. Check your internet or API key.");
    console.error(err);
  } finally {
    showLoading(false);
  }
}

function renderResults(list) {
  elements.resultsGrid.innerHTML = list.map(item => {
    const inList = isInWatchlist(item.imdbID);
    return `
      <article class="card" data-imdb-id="${item.imdbID}">
        ${item.Poster !== "N/A" 
          ? `<img src="\( {item.Poster}" alt=" \){item.Title}" loading="lazy">`
          : `<div class="card-placeholder">🎬</div>`}
        <div class="card-info">
          <h3>${item.Title}</h3>
          <p>${item.Year} · ${item.Type}</p>
        </div>
        <button class="btn-watchlist \( {inList ? 'in-watchlist' : ''}" data-imdb-id=" \){item.imdbID}">
          ♥ ${inList ? 'In List' : 'Add'}
        </button>
      </article>
    `;
  }).join("");

  elements.resultsGrid.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.classList.contains("btn-watchlist")) return;
      openDetail(card.dataset.imdbId);
    });
  });

  elements.resultsGrid.querySelectorAll(".btn-watchlist").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const id = btn.dataset.imdbId;
      const card = btn.closest(".card");
      const item = {
        imdbID: id,
        Title: card.querySelector("h3").textContent,
        Year: card.querySelector("p").textContent.split(" · ")[0],
        Type: card.querySelector("p").textContent.split(" · ")[1],
        Poster: card.querySelector("img")?.src || "N/A"
      };
      if (isInWatchlist(id)) {
        removeFromWatchlist(id);
        btn.classList.remove("in-watchlist");
        btn.textContent = "♥ Add";
      } else {
        addToWatchlist(item);
        btn.classList.add("in-watchlist");
        btn.textContent = "♥ In List";
      }
    });
  });
}

function renderPagination() {
  if (totalPages <= 1) {
    elements.pagination.classList.add("hidden");
    return;
  }
  elements.pagination.classList.remove("hidden");
  let html = "";
  if (currentPage > 1) html += `<button data-page="${currentPage-1}">← Prev</button>`;
  for (let i = Math.max(1, currentPage-2); i <= Math.min(totalPages, currentPage+2); i++) {
    html += `<button \( {i === currentPage ? 'class="active"' : ''} data-page=" \){i}">${i}</button>`;
  }
  if (currentPage < totalPages) html += `<button data-page="${currentPage+1}">Next →</button>`;
  elements.pagination.innerHTML = html;

  elements.pagination.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => searchMovies(lastQuery, Number(btn.dataset.page)));
  });
}

// ─── Detail View ─────────────────────────────────────────────────────────────
async function openDetail(imdbId) {
  detailOpenedFrom = elements.watchlistSection.classList.contains("hidden") ? "search" : "watchlist";
  showLoading(true);
  showResults(false);
  showWatchlist(false);
  showDetail(true);

  try {
    const data = await fetchJson(buildDetailUrl(imdbId));
    if (data.Response === "False") {
      showError(data.Error || "Could not load details");
      return;
    }
    renderDetail(data);
  } catch (err) {
    showError("Failed to load movie details");
    console.error(err);
  } finally {
    showLoading(false);
  }
}

function renderDetail(data) {
  const hasPoster = data.Poster && data.Poster !== "N/A";
  const meta = [data.Year, data.Rated !== "N/A" ? data.Rated : null, data.Runtime].filter(Boolean).join(" · ");

  const inList = isInWatchlist(data.imdbID);
  const watchlistBtn = `
    <button class="btn-watchlist \( {inList ? "in-watchlist" : ""}" data-imdb-id=" \){data.imdbID}">
      ${inList ? "♥ In My List" : "♥ Add to My List"}
    </button>
  `;

  const trailerLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(data.Title + " official trailer")}`;
  const trailerBtn = `<a href="${trailerLink}" target="_blank" class="btn-trailer">▶ Watch Trailer</a>`;

  // Cast parsing
  const actors = data.Actors !== "N/A" ? data.Actors.split(", ").map(s => s.trim()) : [];
  const hero = actors[0] || "—";
  const heroine = actors[1] || "—";
  const fullCast = actors.length > 0 ? actors.join(", ") : "—";

  const infoRows = [
    ["Release", data.Released !== "N/A" ? data.Released : data.Year],
    ["Director", data.Director !== "N/A" ? data.Director : "—"],
    ["Writer", data.Writer !== "N/A" ? data.Writer : "—"],
    ["Hero", hero],
    ["Heroine", heroine],
    ["Main Cast", actors.slice(0,4).join(", ") || "—"],
    ["Full Cast", fullCast],
    ["Genre", data.Genre || "—"],
    ["Language", data.Language || "—"],
    ["Country", data.Country || "—"],
    ["Runtime", data.Runtime || "—"],
    ["Box Office", data.BoxOffice || "—"],
    ["Awards", data.Awards || "—"]
  ].filter(([,v]) => v && v !== "—");

  elements.detailContent.innerHTML = `
    <div class="detail-hero">
      <div class="detail-poster-wrap">
        \( {hasPoster ? `<img src=" \){data.Poster}" alt="${data.Title}" class="detail-poster">` : '<div class="detail-placeholder">🎥</div>'}
        <div class="detail-actions">\( {watchlistBtn} \){trailerBtn}</div>
      </div>
      <div class="detail-main">
        <h1 class="detail-title">${data.Title}</h1>
        <p class="detail-meta">${meta}</p>
        <div class="detail-ratings">${buildRatingsHtml(data)}</div>
        <p class="detail-plot">${data.Plot || "No plot available."}</p>
        <dl class="detail-info">
          \( {infoRows.map(([k,v]) => `<dt> \){k}:</dt><dd>${v}</dd>`).join("")}
        </dl>
      </div>
    </div>
  `;

  elements.detailContent.querySelector(".btn-watchlist")?.addEventListener("click", e => {
    e.preventDefault();
    if (inList) {
      removeFromWatchlist(data.imdbID);
      e.target.classList.remove("in-watchlist");
      e.target.textContent = "♥ Add to My List";
    } else {
      addToWatchlist({
        imdbID: data.imdbID,
        Title: data.Title,
        Year: data.Year,
        Type: "movie",
        Poster: data.Poster
      });
      e.target.classList.add("in-watchlist");
      e.target.textContent = "♥ In My List";
    }
  });
}

function buildRatingsHtml(data) {
  let html = '<div class="ratings-group">';
  if (data.imdbRating && data.imdbRating !== "N/A") {
    html += `<div class="rating">IMDb <strong>${data.imdbRating}/10</strong></div>`;
  }
  const rt = data.Ratings?.find(r => r.Source === "Rotten Tomatoes")?.Value;
  if (rt) html += `<div class="rating">Rotten Tomatoes <strong>${rt}</strong></div>`;
  if (data.Metascore && data.Metascore !== "N/A") {
    html += `<div class="rating">Metacritic <strong>${data.Metascore}</strong></div>`;
  }
  html += '</div>';
  return html || '<p>No ratings available</p>';
}

// ─── View Switching ──────────────────────────────────────────────────────────
function switchView(view) {
  showResults(false);
  showDetail(false);
  showWatchlist(false);
  showEmptyState(view === "search");

  document.querySelectorAll(".nav-link").forEach(el => el.classList.remove("active"));
  document.querySelector(`[data-view="${view}"]`)?.classList.add("active");

  if (view === "search") {
    elements.movieQuery?.focus();
  } else if (view === "watchlist") {
    renderWatchlist();
    showWatchlist(true);
  }
}

function renderWatchlist() {
  const list = getWatchlist();
  if (list.length === 0) {
    elements.watchlistEmpty.classList.remove("hidden");
    elements.watchlistGrid.innerHTML = "";
    return;
  }
  elements.watchlistEmpty.classList.add("hidden");
  renderResults(list);
}

// ─── Event Listeners ─────────────────────────────────────────────────────────
elements.searchBtn?.addEventListener("click", () => searchMovies(elements.movieQuery.value));

elements.movieQuery?.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchMovies(elements.movieQuery.value);
  }
});

elements.backBtn?.addEventListener("click", () => {
  showDetail(false);
  if (detailOpenedFrom === "search") showResults(true);
  else switchView("watchlist");
});

document.querySelectorAll("[data-view]").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    switchView(link.dataset.view);
  });
});

// Init
document.addEventListener("DOMContentLoaded", () => {
  switchView("search");
  updateWatchlistCount();
});
